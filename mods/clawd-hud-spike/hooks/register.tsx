// clawd-hud-spike: sondas no app real para os itens A VALIDAR do handoff.
// Nenhum hook chama o modelo: nada de $.model, agent.spawn, compact ou submit.
// Tudo o que usa `$` mora neste arquivo: o motor não segue o `$` por um import.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement, RenderInput } from 'claude-code'

import type { GuardFile, Placement, ProbeId, Verdict } from '../types'
import { CLASS_NAME, classColor, classOf, crab, guardLine, paletteOf } from './art'
import type { Crab } from './art'
import { deltaOf, GUARD_HINT, GUARD_OPTIONS, PROTECTED } from './guard'
import { footerText, measuredLine, PROBES, reportText } from './lab'
import type { Snapshot } from './lab'

const PANE = 'clawd-spike'

const verdicts = atom({ plugin: 'clawd-hud-spike', key: 'verdicts' } as const, {})
const measures = atom({ plugin: 'clawd-hud-spike', key: 'measures' } as const, {})
const guard = atom({ plugin: 'clawd-hud-spike', key: 'guard' } as const, [])
const working = atom({ plugin: 'clawd-hud-spike', key: 'working' } as const, null)
const turn = atom({ plugin: 'clawd-hud-spike', key: 'turn' } as const, null)
const placement = atom({ plugin: 'clawd-hud-spike', key: 'placement' } as const, {})
const collapseReads = atom({ plugin: 'clawd-hud-spike', key: 'collapseReads' } as const, false)
const page = atom({ plugin: 'clawd-hud-spike', key: 'page' } as const, 0)

const READS = /^(Read|Grep|Glob|LS)$/
const ROWS_PER_PROBE = 3
const FIXED_ROWS = 9

/** O que o render do Pane viu, levado pelos botões até o estado. */
type Seen = { surface: string; placement: Placement }

type Ui = ReturnType<EngineInterface['ui']['resolve']>
type DesktopUi = Extract<Ui, { Svg: unknown }>

/** Svg só existe na tabela do desktop; quem chama confere a superfície antes. */
const svgOf = (ui: Ui, c: Crab) => {
  const { Svg } = ui as DesktopUi
  return <Svg key={c.alt} source={c.source} width={c.width} height={c.height} alt={c.alt} isInteractive />
}

const summaryOf = (e: { tool: string } & Record<string, unknown>) => {
  for (const field of ['description', 'file_path', 'pattern', 'url', 'query', 'command'] as const) {
    const value = e[field]
    if (typeof value === 'string' && value !== '') return value.length > 90 ? `${value.slice(0, 89)}…` : value
  }
  return e.tool
}

async function refreshTheme($: EngineInterface) {
  const row = (await $.config.list()).find(r => r.key === 'theme')
  const theme = row === undefined ? 'sem linha "theme"' : String(row.value)
  await update($, measures, m => ({ ...m, theme }))
  return theme
}

async function snapshot($: EngineInterface): Promise<Snapshot> {
  return {
    measures: await read($, measures),
    turn: await read($, turn),
    collapseReads: await read($, collapseReads),
    placement: await read($, placement),
  }
}

/** Grava o veredito e, junto, o que o render do Pane mediu (o render não escreve estado). */
async function setVerdict($: EngineInterface, id: ProbeId, verdict: Verdict, seen: Seen) {
  const all = await update($, verdicts, marks => ({ ...marks, [id]: verdict }))
  await $.store.set('verdicts', all)
  await update($, placement, p => ({ ...p, ...seen.placement }))
  await update($, measures, m => ({ ...m, surface: seen.surface }))
}

/** Proteção pelo diálogo do Claude: a linha de arquivos vive no estado enquanto ele pergunta. */
async function askWithGuard($: EngineInterface, files: readonly GuardFile[]) {
  await update($, guard, () => [...files])
  try {
    const names = files.map(f => f.name).join(' e ')
    return await $.ui.ask(`O Claude quer alterar ${names}, que são protegidos. O que fazer?`, {
      header: 'Proteção',
      options: GUARD_OPTIONS,
    })
  } catch {
    return 'dispensado'
  } finally {
    await update($, guard, () => [])
  }
}

async function guardEdit($: EngineInterface, tool: string, path: string, delta: { added: number; removed: number }) {
  const name = path.split(/[\\/]/).pop() ?? path
  const answer = await askWithGuard($, [{ name, ...delta }])
  await update($, measures, m => ({ ...m, ask: `${answer} (via ${tool})` }))
  if (answer === 'Aprovar') return undefined
  if (answer === 'Editar no chat') {
    return { deny: `${name} é protegido: a pessoa quer ajustar a mudança no chat antes. Pergunte o que mudar.` }
  }
  return { deny: `${name} é protegido e a alteração foi recusada (${answer}).` }
}

/** Ações das sondas que precisam de um clique. Nenhuma gasta tokens. */
async function act($: EngineInterface, id: ProbeId) {
  if (id === 'ask') {
    const answer = await askWithGuard($, [
      { name: '.env.homologacao', added: 1, removed: 0 },
      { name: 'azure-pipelines.yml', added: 3, removed: 1 },
    ])
    await update($, measures, m => ({ ...m, ask: answer }))
  } else if (id === 'fill') {
    const r = await $.prompt.fill({ text: 'Teste da sonda 4: texto vindo do clawd-hud-spike' })
    const fill = r.isFilled ? 'preencheu' : `recusou: ${r.refusal ?? 'sem causa (um hook)'}`
    await update($, measures, m => ({ ...m, fill }))
  } else if (id === 'tooluse') {
    await update($, collapseReads, isOn => !isOn)
  } else if (id === 'ferramentas') {
    const all = await $.tool.list()
    const hits = all.map(t => t.name).filter(n => /^mcp__ccd|session|handoff|diff|preview/i.test(n))
    const tools = `${all.length} ferramentas; candidatas: ${hits.length === 0 ? 'nenhuma' : hits.slice(0, 15).join(', ')}`
    await update($, measures, m => ({ ...m, tools }))
  }
}

async function renderPane($: EngineInterface, e: RenderInput<'Pane'>): Promise<RenderElement> {
  const seen: Seen = {
    surface: e.surface,
    placement: {
      placement: e.props.placement,
      columns: e.viewport?.columns,
      rows: e.viewport?.rows,
      isFullscreen: e.viewport?.isFullscreen,
      bodyRows: e.props.scroll.bodyRows,
      bodyColumns: e.props.bodyColumns,
    },
  }
  const stored = await snapshot($)
  const snap = { ...stored, placement: { ...stored.placement, ...seen.placement } }
  const palette = paletteOf(snap.measures.theme)
  const marks = await read($, verdicts)
  const perPage = Math.max(1, Math.floor((e.props.scroll.bodyRows - FIXED_ROWS) / ROWS_PER_PROBE))
  const pages = Math.ceil(PROBES.length / perPage)
  const at = Math.min(await read($, page), pages - 1)
  const shown = PROBES.slice(at * perPage, at * perPage + perPage)
  const footer = footerText(await $.session.usage())

  const ui = $.ui.resolve(e)
  const { Box, Text, Button } = ui
  const markOf = (id: ProbeId) => (marks[id] === 'ok' ? '✓' : marks[id] === 'falhou' ? '✗' : '·')
  const colorOf = (id: ProbeId) => (marks[id] === 'ok' ? 'success' : marks[id] === 'falhou' ? 'error' : 'text')

  return (
    <Box flexDirection="column">
      {e.surface === 'desktop' ? (
        <Box key="art" flexDirection="row" gap={2} justifyContent="center">
          {svgOf(ui, crab('druida', 56, palette, { tip: 'Clawd druida: pisca (CSS) e as estrelas pulsam (SMIL)' }))}
          {svgOf(ui, crab('artifice', 90, palette, { withProp: true, tip: 'Artífice: a engrenagem gira (CSS)' }))}
        </Box>
      ) : (
        <Text key="art" dimColor>
          (Svg só no desktop: aqui é {e.surface})
        </Text>
      )}
      <Text bold>
        Laboratório do spike · página {at + 1} de {pages}
      </Text>
      <Box flexDirection="column" flexGrow={1}>
        {shown.map(probe => {
          const detail = measuredLine(snap, probe.id)
          return (
            <Box key={`row-${probe.id}`} flexDirection="column">
              <Box flexDirection="row" gap={1}>
                <Text bold color={colorOf(probe.id)}>
                  {markOf(probe.id)} {probe.item}. {probe.title}
                </Text>
                <Button key={`ok-${probe.id}`} label="✓ ok" onPress={() => setVerdict($, probe.id, 'ok', seen)} />
                <Button key={`no-${probe.id}`} label="✗ falhou" onPress={() => setVerdict($, probe.id, 'falhou', seen)} />
                {probe.action !== undefined && (
                  <Button key={`act-${probe.id}`} label={probe.action} variant="primary" onPress={() => act($, probe.id)} />
                )}
              </Box>
              <Text dimColor wrap="wrap">
                {probe.how}
              </Text>
              {detail !== undefined && <Text color="suggestion">→ {detail}</Text>}
            </Box>
          )
        })}
      </Box>
      <Box flexDirection="row" gap={1}>
        <Button key="prev" label="‹" onPress={() => update($, page, n => Math.max(0, n - 1))} />
        <Button key="next" label="›" onPress={() => update($, page, n => Math.min(pages - 1, n + 1))} />
      </Box>
      <Box borderStyle="round" borderColor="subtle" paddingX={1}>
        <Text>{footer}</Text>
      </Box>
    </Box>
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const ran = await next(e)

    await $.command.register({ name: 'spike', description: 'Abre o Laboratório do spike da HUD' })
    await $.command.register({ name: 'spike-relatorio', description: 'Relatório do spike para colar no DECISOES.md' })

    const sessions = Number((await $.store.get('sessoes')) ?? 0) + 1
    await $.store.set('sessoes', sessions)
    const stored = (await $.store.get('verdicts')) as Partial<Record<ProbeId, Verdict>> | undefined
    if (stored !== undefined) await update($, verdicts, marks => ({ ...stored, ...marks }))
    const version = (await $.session.version()).version
    await update($, measures, m => ({ ...m, sessions, version }))
    await refreshTheme($)

    // Sonda 11: aberto sem pedido, o painel só aparece em tela larga.
    const opened = await $.ui.open({ id: PANE, title: 'Laboratório' })
    await update($, placement, p => ({
      ...p,
      isPlaced: opened.isPlaced,
      reason: opened.isPlaced ? undefined : String(opened.reason),
    }))

    return ran
  })

  on('command.run', { command: 'spike' }, async $ => {
    await refreshTheme($)
    const opened = await $.ui.open({ id: PANE, title: 'Laboratório', focus: true })
    return { text: opened.isPlaced ? 'Laboratório aberto.' : `O Laboratório não abriu: ${String(opened.reason)}` }
  })

  on('command.run', { command: 'spike-relatorio' }, async $ => ({
    text: reportText(await snapshot($), await read($, verdicts)),
  }))

  on('config.set', { key: 'theme' }, async ($, e, next) => {
    const ran = await next(e)
    await refreshTheme($)
    $.ui.invalidate('ui.render')
    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, ($, e) => renderPane($, e))

  // Faixa: o que está rodando agora.
  on('tool.call', async ($, e, next) => {
    await update($, working, () => ({ tool: e.tool, cls: classOf(e.tool), summary: summaryOf(e) }))
    return next(e)
  }).catch(($, e, next) => next(e))

  // Sonda 3b: proteção de verdade, só para spike-sandbox/. Falha fechada.
  const failClosed = { deny: 'clawd-hud-spike: o guarda falhou; alteração bloqueada.' }

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    if (!PROTECTED.test(e.file_path)) return next(e)
    return (await guardEdit($, 'Edit', e.file_path, deltaOf(e))) ?? next(e)
  }).catch(($, e, next) => (next.called ? next(e) : failClosed))

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    if (!PROTECTED.test(e.file_path)) return next(e)
    return (await guardEdit($, 'Write', e.file_path, deltaOf(e))) ?? next(e)
  }).catch(($, e, next) => (next.called ? next(e) : failClosed))

  on('turn.complete', async ($, e, next) => {
    const ran = await next(e)
    if (e.agentId === undefined) {
      await update($, working, () => null)
      const answer = e.answer ?? ''
      await update($, turn, () => ({
        reason: e.reason,
        durationMs: e.durationMs,
        answerHead: answer.slice(0, 80).replace(/\s+/g, ' '),
        answerChars: answer.length,
      }))
    }
    return ran
  })

  // Sonda 3: a linha de arquivos acima do diálogo do Claude.
  on('ui.render', { component: 'AskUserQuestion' }, async ($, e, next) => {
    const files = await read($, guard)
    if (files.length === 0) return next(e)

    // A ferramenta aceita descrição por opção, embora o $.ui.ask não a passe:
    // a sonda 3 confere se o desktop desenha o que o hook acrescenta aqui.
    const questions = e.props.questions.map(q => {
      const options = (q as { options?: { label: string }[] }).options
      return options === undefined
        ? q
        : { ...(q as object), options: options.map(o => ({ ...o, description: GUARD_HINT[o.label] ?? '' })) }
    })
    const dialog = await next({ ...e, props: { ...e.props, questions } })

    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    if (e.surface !== 'desktop') {
      const names = files.map(f => `${f.name} +${f.added}${f.removed > 0 ? ` −${f.removed}` : ''}`).join(' · ')
      return (
        <Box flexDirection="column">
          <Text color="warning">⚿ {names}</Text>
          {dialog}
        </Box>
      )
    }
    const palette = paletteOf((await read($, measures)).theme)
    return (
      <Box flexDirection="column">
        {svgOf(ui, guardLine(files, palette))}
        {dialog}
      </Box>
    )
  })

  // Sonda 8 (parte 2): com as leituras recolhidas, a saída delas também some, como na HUD.
  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    if (!READS.test(e.props.tool) || !(await read($, collapseReads))) return next(e)
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

  // Sonda 8: o Clawd à esquerda de cada ferramenta; leituras recolhíveis.
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (READS.test(e.props.tool) && !e.props.isRunning && (await read($, collapseReads))) {
      const { Box } = $.ui.resolve(e)
      return <Box />
    }
    const row = await next(e)
    if (e.surface !== 'desktop') return row

    const ui = $.ui.resolve(e)
    const { Box } = ui
    const palette = paletteOf((await read($, measures)).theme)
    const cls = classOf(e.props.tool)
    return (
      <Box flexDirection="row" gap={1}>
        {svgOf(ui, crab(cls, 40, palette, { tip: `${CLASS_NAME[cls]} · ${e.props.tool}` }))}
        <Box flexDirection="column" flexGrow={1}>
          {row}
        </Box>
      </Box>
    )
  })

  // Faixa acima do prompt: o Clawd de 90 px enquanto o Claude trabalha; some no fim.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const now = await read($, working)
    if (!e.props.isWorking || e.props.hasSurvey || now === null) return next(e)

    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const palette = paletteOf((await read($, measures)).theme)
    const below = await next(e)
    const title = `${CLASS_NAME[now.cls]} · ${now.tool}`
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={2} alignItems="center">
          {e.surface === 'desktop' && svgOf(ui, crab(now.cls, 90, palette, { withProp: true, tip: title }))}
          <Box flexDirection="column">
            <Text bold color={classColor(now.cls, palette)}>
              {title}
            </Text>
            <Text dimColor wrap="truncate-end">
              {now.summary}
            </Text>
          </Box>
        </Box>
        {below}
      </Box>
    )
  })
}
