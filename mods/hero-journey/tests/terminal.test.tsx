import { expect, mock, test } from 'claude-code/testing'

import { rasterOfPixels } from '../hooks/core/raster'
import { CLASS_ICON, TH, TW, tsprite } from '../hooks/core/tsprites'
import type { Cls } from '../types'

const PLUGIN = 'hero-journey'

const pane = (placement: 'dock' | 'inline', bodyRows = 40) =>
  ({
    plugin: PLUGIN,
    surface: 'terminal',
    component: 'Pane',
    requestId: 'hero-journey',
    props: { title: 'Hero Journey', isFocused: false, bodyColumns: 48, placement, scroll: { offset: 0, bodyRows }, view: {} },
    viewport: { columns: 160, rows: 48, isFullscreen: placement === 'dock' },
  }) as const

const usage = (percent: number, five: number) => () =>
  ({ value: { startedAt: 0, context: { percent, window: 200000 }, rateLimits: [{ kind: 'five_hour', percentUsed: five }] } }) as never

const edited = () => ({ result: { filePath: 'x', structuredPatch: [{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 2, lines: ['-a', '+b', '+c'] }] } }) as never

const ALL: Cls[] = ['aprendiz', 'mago', 'cacador', 'ladino', 'runico', 'ilusionista', 'sabio', 'engenheiro', 'bruxo', 'rei', 'artifice', 'oraculo', 'geomante', 'alquimista', 'cartomante', 'invocador', 'cronomante', 'paladino', 'pintor']

test('os 19 Clawds do terminal: cada classe veste algo próprio, e a falha difere do trabalho', () => {
  const body = tsprite('aprendiz', 'sleep').filter(c => c !== undefined).length
  const seen = new Set<string>()
  for (const cls of ALL) {
    const work = tsprite(cls, 'work')
    const fail = tsprite(cls, 'fail')
    expect(work.length).toBe(TW * TH)
    expect(work.filter(c => c !== undefined).length).toBeGreaterThan(body / 2)
    expect(JSON.stringify(fail)).not.toBe(JSON.stringify(work))
    seen.add(JSON.stringify(work))
    expect(CLASS_ICON[cls].length).toBeGreaterThan(0)
  }
  expect(seen.size).toBe(ALL.length)
  // O quadro 1 da animação sobe o personagem; o tamanho do Raster não muda (o blit exige o mesmo).
  expect(JSON.stringify(tsprite('mago', 'work', false, 1))).not.toBe(JSON.stringify(tsprite('mago', 'work')))
  const big = rasterOfPixels(tsprite('mago', 'work'), TW, TH, 'stage', 2)
  expect([big.columns, big.rows]).toEqual([48, 13])
  const small = rasterOfPixels(tsprite('mago', 'work'), TW, TH, 'stage', 1)
  expect([small.columns, small.rows]).toEqual([24, 7])
  // Três u32 por célula, em base64.
  expect(atob(small.cells).length).toBe(24 * 7 * 12)
})

test('no terminal encaixado, o palco é o Clawd em Raster e os recursos têm uma linha cada', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('session.usage', usage(34, 28))
  mock.store(on, { setupDone: true })
  const ui = await $.ui.mount(pane('dock'))
  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
  const stage = await ui.find({ type: 'Raster', key: 'stage' })
  expect([stage?.props.columns, stage?.props.rows]).toEqual([48, 13])
  expect(await ui.find({ text: /Sua vez/ })).toBeDefined()
  expect(await ui.find({ key: 'compact' })).toBeDefined()
  expect(await ui.find({ text: /^34%$/ })).toBeDefined()
  await ui.unmount()

  // Acima do prompt (sem tela cheia) não há palco.
  const inline = await $.ui.mount(pane('inline'))
  expect(await inline.find({ type: 'Raster' })).toBeUndefined()
  expect(await inline.find({ text: /Sua vez/ })).toBeDefined()
  await inline.unmount()
})

test('no terminal, o diário mantém a linha do motor e põe o ícone e a classe à direita', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('tool.call', { tool: 'Edit' }, edited)
  on('ui.render', { component: 'ToolUse' }, () => ({ type: 'Text', props: {}, children: ['⏺ Edit(src/app.ts)'] }) as never)
  await $.tool.call({ tool: 'Edit', tool_use_id: 'e1', file_path: '/repo/src/app.ts', old_string: 'a', new_string: 'b\nc' } as never)
  const ui = await $.ui.mount({
    plugin: PLUGIN,
    surface: 'terminal',
    component: 'ToolUse',
    requestId: 'e1',
    props: { tool_use_id: 'e1', tool: 'Edit', input: { file_path: '/repo/src/app.ts' }, isRunning: false, isErrored: false, isInterrupted: false },
  })
  expect(await ui.find({ text: /⏺ Edit/ })).toBeDefined()
  expect(await ui.find({ text: new RegExp(`^${CLASS_ICON.runico}$`) })).toBeDefined()
  expect(await ui.find({ text: /^Rúnico$/ })).toBeDefined()
  expect(await ui.find({ text: /^\+2 −1$/ })).toBeDefined()
  await ui.unmount()
})

test('no terminal, o spinner é do mod: ícone e nome da classe', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('tool.call', { tool: 'Read' }, () => ({ result: {} }) as never)
  on('ui.render', { component: 'Spinner' }, () => ({ type: 'Text', props: {}, children: ['Sauteing…'] }) as never)
  on('turn.start', ($$, e) => ({ turnId: (e as { turnId: string }).turnId }) as never)
  await $.turn.start({ text: 'ler', turnId: 't1' } as never)
  const call = $.tool.call({ tool: 'Read', tool_use_id: 'r1', file_path: '/repo/hooks/core/art.ts' } as never)
  await call
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Spinner', requestId: 'main', props: { word: 'Sauteing', message: null, suffix: '…', mode: 'thinking' } } as never)
  expect(await ui.find({ text: /Sauteing/ })).toBeUndefined()
  expect(await ui.find({ text: new RegExp(`^${CLASS_ICON.aprendiz}$`) })).toBeDefined()
  expect(await ui.find({ text: /^Aprendiz$/ })).toBeDefined()
  await ui.unmount()
})

test('no terminal, o recibo entra no lugar do "Baked for" e não vira texto embaixo da resposta', { options: { language: 'pt-BR' } }, async ($, on) => {
  let shown = ''
  on('tool.call', { tool: 'Edit' }, edited)
  on('turn.start', ($$, e) => ({ turnId: (e as { turnId: string }).turnId }) as never)
  on('turn.complete', () => ({ text: 'resposta' }) as never)
  on('session.surfaces', () => ({ value: ['terminal'] }) as never)
  on('ui.render', { component: 'TurnDuration' }, () => ({ type: 'Text', props: {}, children: ['Baked for 1s'] }) as never)
  await $.turn.start({ text: 'editar', turnId: 't1' } as never)
  await $.tool.call({ tool: 'Edit', tool_use_id: 'e1', file_path: '/repo/src/app.ts', old_string: 'a', new_string: 'b\nc' } as never)
  const done = await $.turn.complete({ turnId: 't1', reason: 'answer', durationMs: 4000, isAborted: false, answer: 'feito' } as never)
  shown = (done as { text: string }).text
  expect(shown).toBe('resposta')
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'TurnDuration', requestId: 'd1', props: { word: 'Baked', durationMs: 4000 } } as never)
  expect(await ui.find({ text: /Baked/ })).toBeUndefined()
  expect(await ui.find({ text: /^Rúnico$/ })).toBeDefined()
  expect(await ui.find({ text: /1 ação/ })).toBeDefined()
  await ui.unmount()
})

test('no terminal, a guarda cabe nas 12 linhas em volta do diálogo', { options: { language: 'pt-BR' } }, async ($, on) => {
  let drawn = false
  on('ui.render', { component: 'AskUserQuestion' }, () => ({ type: 'engine', ref: 0 }) as never)
  on('tool.call', { tool: 'AskUserQuestion' }, (async (_: unknown, e: { questions: { question: string }[] }) => {
    const ui = await $.ui.mount({
      plugin: PLUGIN,
      surface: 'terminal',
      component: 'AskUserQuestion',
      requestId: 'q1',
      props: { tool: 'AskUserQuestion', questions: e.questions },
    } as never)
    drawn = (await ui.find({ text: /🐉/ })) !== undefined
    await ui.unmount()
    return { result: { questions: e.questions, answers: { [e.questions[0]?.question ?? '']: 'Recusar' } } }
  }) as never)
  await $.tool.call({ tool: 'Edit', tool_use_id: 'g1', file_path: '/repo/.env.homologacao', old_string: 'A=1', new_string: 'A=2' } as never)
  expect(drawn).toBe(true)
})

test('no terminal, um recurso em alerta vai para o fim da linha de dicas do prompt', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('session.usage', usage(40, 95))
  on('turn.start', ($, e) => ({ turnId: (e as { turnId: string }).turnId }) as never)
  on('turn.complete', () => ({ text: '' }) as never)
  on('ui.render', { component: 'PromptHint' }, ((_: unknown, e: { props: { hint: string; tail?: string } }) => ({
    type: 'Text',
    props: {},
    children: [`${e.props.hint}|${e.props.tail ?? ''}`],
  })) as never)
  // O fim do turno lê os recursos: a mana com 5% está em alerta.
  await $.turn.start({ text: 'oi', turnId: 't1' } as never)
  await $.turn.complete({ turnId: 't1', reason: 'answer', durationMs: 1000, isAborted: false, answer: 'ok' } as never)
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'PromptHint', requestId: 'hint', props: { isDraft: false, isWorking: false, hint: '? for shortcuts' } } as never)
  expect(await ui.find({ text: /\? for shortcuts\|.*Mana/ })).toBeDefined()
  await ui.unmount()
})
