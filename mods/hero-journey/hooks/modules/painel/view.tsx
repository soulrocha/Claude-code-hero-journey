// O painel: o palco no topo (a classe em ação no seu cenário, o Aprendiz
// pensando ou o acampamento), o que está acontecendo em texto nativo, o
// objetivo, e só com conteúdo o plano, o grupo em expedição e o inventário; no
// fim, presos embaixo, os recursos (Mochila, Mana e Vigor) e os botões. Mais as
// páginas ⚙ Configurações e ℹ Sobre.

import type { RenderElement } from 'claude-code'

import type { Campaign, Cls, GuardMode, Inventory, Member, ModuleId, Prefs, Progress, Quest, Resources, Skin } from '../../../types'
import { barArt, categoryHeader, classColor, classGallery, featureList, itemIcon, linkIcon, objectiveBar, parade, petArt, rarityTone, toneOf } from '../../core/art'
import type { IconName, ResRow } from '../../core/art'
import { campWithSageArt, stageArt } from '../../core/cenarios'
import { clockOf, humanType, untilOf } from '../../core/classes'
import { isOn, MODULES } from '../../core/prefs'
import type { Ctx } from '../../core/ui'
import { clawdArt, GITHUB_URL, LINKEDIN_URL, pxOf, svg, textBar, title, VERSION } from '../../core/ui'
import { CLASS_ICON } from '../../core/tsprites'
import { goalOf } from '../campanha/campanha'
import { continueSection, memoryConfig, sageNudge } from '../grimorio/view'
import type { MemoryConfigActions } from '../grimorio/view'
import type { Dests } from '../grimorio/grimorio'
import { stepsOf } from '../faixa/view'
import { bagOf, countdown, short, windowOf } from '../mochila/recursos'
import { rarityOf } from './painel'
import type { Scene } from './palco'
import { MAX_STEPS, stepWindow } from './palco'

export type PaneData = {
  prefs: Prefs
  campaign: Campaign | null
  quests: readonly Quest[]
  party: readonly Member[]
  inventory: Inventory
  resources: Resources | null
  /** O instante do desenho, para a contagem do reset. */
  now: number
  scene: Scene
  /** O que cabe (o layoutOf do palco): a altura do palco e quantos heróis e itens entram. */
  fit: { stage: number; maxCards: number; maxItems: number }
  /** Inscrições do grimório esperando o Selar. */
  pendingInscriptions: number
  /** O grimório no palco: o aviso do que o Sábio anotou, o de salvar antes de dormir e o Continuar. */
  grim: { noted: number; saveNext?: string; continueList: readonly Progress[]; continueHint: boolean }
}

export type PaneActions = {
  /** ✦ O Haiku reescreve o objetivo curto a partir dos pedidos da sessão (gasta tokens, só no clique). */
  recalibrate: () => void
  compact: () => void
  grimoire: () => void
  config: () => void
  dismissNoted: () => void
  saveProgress: () => void
  dismissSave: () => void
  continueTask: (p: Progress) => void
  continueHow: () => void
}

/** O corpo ocupa o meio; os recursos e os botões ficam presos no fim (o painel recebe a altura toda). */
export const mainView = (c: Ctx, d: PaneData, act: PaneActions): RenderElement => {
  const { Box } = c.ui
  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box key="body" flexDirection="column" flexGrow={1} flexShrink={1} overflow="hidden">
        {stageSection(c, d)}
        {nowSection(c, d)}
        {grimSection(c, d, act)}
        {goalSection(c, d, act)}
        {partySection(c, d)}
        {inventorySection(c, d)}
      </Box>
      {footer(c, d, act)}
    </Box>
  )
}

/** O objetivo inteiro (o 1º pedido) e o curto que a tela mostra. */
export const objectiveOf = (campaign: Campaign | null) =>
  campaign === null ? { text: '', short: '', n: 0 } : { text: campaign.objective, short: goalOf(campaign), n: campaign.chapters.length }

const stepWords = (c: Ctx) => ({ step: c.t.stepTip, steps: c.t.stepsWord, chapter: c.t.chapterShort })

const clockAt = (ms: number | undefined) => (ms === undefined ? '' : clockOf(new Date(ms).toISOString()))

/** Os dois últimos pedaços do caminho: "painel/view.tsx". */
const shortPath = (path: string) => path.split(/[\\/]/).filter(Boolean).slice(-2).join('/')

/** Quem está em cena e o que faz, nas duas linhas embaixo do palco. */
export const sceneWords = (c: Ctx, s: Scene) => {
  const k = toneOf(c.palette)
  const name = c.t.className[s.hero]
  switch (s.mode) {
    case 'work':
      return { who: name, color: classColor(s.hero, c.palette), verb: c.t.classVerb[s.hero], note: s.file === undefined ? s.summary : undefined }
    case 'fail':
      return { who: name, color: k.bad, verb: c.t.stumbled, note: c.t.failedNote(s.summary ?? name) }
    case 'think':
      return { who: name, color: classColor('aprendiz', c.palette), verb: c.t.classVerb.aprendiz, note: undefined }
    case 'wait':
      return { who: c.t.yourTurn, color: k.warn, verb: c.t.answered(clockAt(s.endedAt)), note: undefined }
    case 'fresh':
      return { who: c.t.yourTurn, color: k.warn, verb: c.t.freshCamp, note: undefined }
    case 'sleep':
      return { who: name, color: k.muted, verb: c.t.asleep, note: c.t.asleepNote(clockAt(s.endedAt)) }
  }
}

/** O palco do terminal: quem aparece, em que pose e tamanho; nada acima do prompt (sem tela cheia). */
export const stageLook = (c: Pick<Ctx, 'desktop' | 'inline' | 'width'>, d: Pick<PaneData, 'scene' | 'fit'>) => {
  if (c.desktop || c.inline === true) return undefined
  const s = d.scene
  const camp = s.place === 'acampamento'
  return {
    cls: camp ? ('aprendiz' as Cls) : s.hero,
    pose: camp ? (s.mode === 'sleep' ? ('sleep' as const) : ('idle' as const)) : s.pose === 'fail' ? ('fail' as const) : ('work' as const),
    camp,
    scale: d.fit.stage <= 170 || c.width < 48 ? 1 : 2,
  }
}

const stageSection = (c: Ctx, d: PaneData) => {
  if (!c.desktop) {
    // Terminal: só o Clawd, em pixel art própria e sem fundo; no acampamento, a fogueira ao lado.
    // Grande (2×, 48 colunas) com o painel livre; 1× com plano, grupo ou inventário. Acima do
    // prompt (sem tela cheia) não há palco: ele comeria a conversa. O relógio do register anima.
    const look = stageLook(c, d)
    if (look === undefined) return null
    const { Box } = c.ui
    return (
      <Box key="stage-box" flexDirection="row" justifyContent="center">
        {clawdArt(c, look.cls, look.pose, 'stage', look.scale, look.camp)}
      </Box>
    )
  }
  const w = sceneWords(c, d.scene)
  const s = d.scene
  const alt = `${w.who} ${w.verb}`
  return svg(
    c,
    s.sage === true && s.place === 'acampamento'
      ? campWithSageArt(pxOf(c), d.fit.stage, s.mode === 'sleep', alt, c.t.placeName)
      : stageArt(s.hero, s.pose, s.place, pxOf(c), d.fit.stage, alt, c.t.placeName),
    'stage',
  )
}

/** O grimório no palco: o Sábio anotou (fim do turno), salvar antes de dormir e o Continuar da sessão nova. */
const grimSection = (c: Ctx, d: PaneData, act: PaneActions) => {
  const m = d.scene.mode
  if (m === 'wait' && d.scene.sage === true && d.grim.noted > 0)
    return sageNudge(c, 'nudge-noted', c.t.sageNoted(d.grim.noted), undefined, { label: c.t.seeAndKeep, onPress: act.grimoire }, { label: c.t.notNow, onPress: act.dismissNoted })
  if (m === 'sleep' && d.scene.sage === true && d.grim.saveNext !== undefined)
    return sageNudge(
      c,
      'nudge-save',
      c.t.saveBeforeStop,
      d.grim.saveNext === '' ? undefined : c.t.nextStep(d.grim.saveNext),
      { label: c.t.saveProgress, onPress: act.saveProgress },
      { label: c.t.notNow, onPress: act.dismissSave },
    )
  // Sem objetivo nesta conversa (sessão nova, ou depois de um /clear), o acampamento oferece continuar o que ficou salvo.
  if (d.scene.place === 'acampamento' && (m === 'fresh' || d.campaign === null) && d.grim.continueList.length > 0) return continueSection(c, d.grim.continueList, d.grim.continueHint, { go: act.continueTask, how: act.continueHow })
  return null
}

const nowSection = (c: Ctx, d: PaneData) => {
  const { Box, Text } = c.ui
  const w = sceneWords(c, d.scene)
  const file = d.scene.mode === 'work' ? d.scene.file : undefined
  return (
    <Box key="now" flexDirection="column" marginTop={c.desktop ? 1 : 0}>
      <Box flexDirection="row" columnGap={1}>
        <Text bold color={w.color}>
          {w.who}
        </Text>
        <Text dimColor wrap="truncate-end">
          {w.verb}
        </Text>
      </Box>
      {file !== undefined ? (
        <Box flexDirection="row" columnGap={1}>
          <Text color={rarityTone(rarityOf(shortPath(file)), c.palette)} wrap="truncate-end">
            {shortPath(file)}
          </Text>
          {d.scene.actions > 1 && <Text dimColor>· {c.t.actions(d.scene.actions)}</Text>}
        </Box>
      ) : (
        w.note !== undefined && (
          <Text dimColor wrap="truncate-end">
            {w.note}
          </Text>
        )
      )}
    </Box>
  )
}

/** O objetivo: o título do app (ou a Missão); a barra e os passos só com um plano de verdade (2 tarefas ou mais). */
const goalSection = (c: Ctx, d: PaneData, act: PaneActions) => {
  const { Box, Button, Text } = c.ui
  if (d.campaign === null) return null
  const o = objectiveOf(d.campaign)
  const steps = stepsOf(d.quests)
  const plan = steps.length >= 2
  const done = steps.filter(s => s.state === 'done').length
  const achieved = d.campaign.achieved
  const n = Math.max(1, o.n)
  // Sem o título do app (terminal, ou antes dele chegar), o ✦ Recalibrar fica à mão.
  const canRecalibrate = d.campaign.shortFrom !== 'app'
  const win = stepWindow(steps, MAX_STEPS)
  const k = toneOf(c.palette)
  return (
    <Box key="goal" flexDirection="column" marginTop={1}>
      {title(c, c.t.section.objetivo, achieved ? '?' : undefined, plan ? `${done}/${steps.length}` : undefined)}
      <Text bold wrap="wrap">
        {o.short === '' ? c.t.noObjective : o.short}
      </Text>
      {plan ? (
        <Box flexDirection="column">
          {svg(c, objectiveBar(pxOf(c), steps, n, c.palette, stepWords(c)), 'goal-bar')}
          {win.hidden > 0 && <Text color="success">{c.t.doneSteps(win.hidden)}</Text>}
          {win.shown.map((s, i) => (
            <Box key={`step-${win.hidden + i}`} flexDirection="row" columnGap={1}>
              <Text color={s.state === 'done' ? 'success' : s.state === 'now' ? k.gild : undefined} dimColor={s.state === 'next'}>
                {s.state === 'done' ? '✓' : s.state === 'now' ? '▸' : '○'}
              </Text>
              <Text bold={s.state === 'now'} dimColor={s.state !== 'now'} wrap="truncate-end">
                {s.name}
              </Text>
            </Box>
          ))}
        </Box>
      ) : (
        <Box flexDirection="row" columnGap={2}>
          <Text dimColor wrap="truncate-end">
            {[c.t.chapterShort(n), c.t.startedAt(clockAt(d.campaign.startedAt))].filter(Boolean).join(' · ')}
          </Text>
          {canRecalibrate && <Button key="recalibrate" plain dimColor label={c.t.recalibrateShort} onPress={act.recalibrate} />}
        </Box>
      )}
      {achieved && <Text color="success">{c.t.achieved}</Text>}
    </Box>
  )
}

/** O nome de um membro: o tipo humanizado ("QA adversarial") ou, sem tipo, a classe. */
const memberName = (c: Ctx, m: Member) => humanType(m.type, c.t.knownTypes) || c.t.className[m.cls]

/** O grupo: só os subagentes em expedição, cada um com o seu Clawd. */
const partySection = (c: Ctx, d: PaneData) => {
  const { Box, Text } = c.ui
  const away = d.party.filter(m => m.status === 'run')
  if (away.length === 0) return null
  const shown = away.slice(0, Math.max(1, d.fit.maxCards))
  return (
    <Box key="party" flexDirection="column" marginTop={1}>
      {title(c, c.t.onExpeditionTitle, undefined, String(away.length))}
      {shown.map(m => (
        <Box key={`m-${m.id}`} flexDirection="row" columnGap={1} alignItems="center">
          {svg(c, petArt(m.cls, 'work', 30, `${memberName(c, m)} · ${c.t.className[m.cls]}`), `pet-${m.id}`)}
          <Box flexDirection="column" flexGrow={1} flexShrink={1}>
            <Box flexDirection="row" columnGap={1}>
              <Text bold color={classColor(m.cls, c.palette)} wrap="truncate-end">
                {memberName(c, m)}
              </Text>
              <Box flexGrow={1} />
              <Text dimColor>{c.t.onExpedition}</Text>
            </Box>
            <Text dimColor wrap="truncate-end">
              {c.t.className[m.cls]} · {m.description}
            </Text>
          </Box>
        </Box>
      ))}
      {away.length > shown.length && <Text dimColor>{c.t.moreActive(away.length - shown.length)}</Text>}
    </Box>
  )
}

/** O inventário: só com arquivos mexidos, com a raridade pelo impacto. */
const inventorySection = (c: Ctx, d: PaneData) => {
  const { Box, Text } = c.ui
  const inv = d.inventory
  if (!inv.isRepo || inv.items.length === 0) return null
  const shown = inv.items.slice(0, Math.max(1, d.fit.maxItems))
  const head = [inv.branch === undefined ? '' : `⎇ ${inv.branch}`, inv.ahead > 0 ? c.t.ahead(inv.ahead) : '', inv.behind > 0 ? c.t.behind(inv.behind) : '', String(inv.items.length)]
    .filter(Boolean)
    .join(' · ')
  const delta = (added?: number, removed?: number) => (added === undefined ? '' : `+${added}${removed !== undefined && removed > 0 ? ` −${removed}` : ''}`)
  return (
    <Box key="items" flexDirection="column" marginTop={1}>
      {title(c, c.t.section.inventario, undefined, head)}
      {shown.map(item => {
        const diff = item.rarity === 'pobre' ? c.t.deleted : delta(item.added, item.removed) || (item.code === '??' ? c.t.isNew : '')
        const added = diff.startsWith('+') || diff === c.t.isNew
        return (
          <Box key={`it-${item.path}`} flexDirection="row" columnGap={1} alignItems="center" hover={{ backgroundColor: toneOf(c.palette).track }}>
            {svg(c, itemIcon(item.path, item.rarity, c.palette, `${item.path} — ${c.t.rarity[item.rarity]}`), `ic-${item.path}`)}
            <Text color={rarityTone(item.rarity, c.palette)} wrap="truncate-start">
              {c.desktop ? shortPath(item.path) : item.path}
            </Text>
            <Box flexGrow={1} />
            <Text color={added ? 'success' : undefined} dimColor={!added}>
              {diff}
            </Text>
          </Box>
        )
      })}
      {inv.items.length > shown.length && <Text dimColor>+{inv.items.length - shown.length}</Text>}
    </Box>
  )
}

/** As três linhas dos recursos: a mochila contra o ponto de compactação, a mana e o vigor pelo que resta. */
export const resourceData = (c: Ctx, r: Resources | null, now: number): ResRow[] => {
  const k = toneOf(c.palette)
  const bag = r === null ? undefined : bagOf(r)
  const pctText = (v: number | undefined) => (v === undefined ? '—' : `${Math.round(v)}%`)
  const top = (r?.top ?? []).map(x => `${c.t.bagCategory[x.name.toLowerCase()] ?? x.name.toLowerCase()} ${short(x.tokens)}`).join(', ')
  const delta = bag?.delta === undefined || bag.delta === 0 ? '' : `${bag.delta > 0 ? '▲ +' : '▼ '}${short(Math.abs(bag.delta))}`
  const rows: ResRow[] = [
    {
      key: 'mochila',
      label: c.t.footer.mochila,
      value: bag?.percent,
      color: bag?.state === 'transbordando' ? k.bad : bag?.state === 'pesada' ? k.warn : '#c9965f',
      text: pctText(bag?.percent),
      sub: bag?.percent === undefined ? '' : c.t.bag[bag.state],
      tip: c.t.bagTip(pctText(bag?.percent), r?.compactsAt !== undefined, bag?.left === undefined ? '' : short(bag.left), delta, top),
      pulse: bag?.state === 'transbordando',
    },
  ]
  for (const [key, kind, base] of [
    ['mana', 'five_hour', '#6cb6ec'],
    ['vigor', 'seven_day', '#8fc46a'],
  ] as const) {
    const w = r?.windows.find(x => x.kind === kind)
    const v = w === undefined ? undefined : windowOf(w, now)
    const name = c.t.footer[key]
    const at = w?.resetsAt !== undefined && v !== undefined && !v.refilled ? c.t.resetAt(clockOf(w.resetsAt), untilOf(w.resetsAt, now)) : ''
    rows.push({
      key,
      label: name,
      value: v?.left,
      color: v?.level === 'critico' ? k.bad : v?.level === 'baixo' ? k.warn : base,
      text: pctText(v?.left),
      sub: v === undefined ? '' : v.refilled ? c.t.refilled : `${v.fast ? '⚡ ' : ''}${v.resetIn === undefined ? '' : `↻ ${countdown(v.resetIn)}`}`,
      tip: v === undefined ? name : c.t.windowTip(name, c.t.period[key], pctText(v.left), at, v.fast, v.refilled),
      pulse: v?.level === 'critico',
    })
  }
  return rows
}

const RES_ICON: Record<string, string> = { mochila: '🎒', mana: '💧', vigor: '💚' }

/**
 * O rodapé, preso no fim do painel: os recursos em texto nativo, um por linha,
 * com a barra fina no meio (clicar na Mochila leva ao cartão de compactar);
 * embaixo, o Grimório num canto e o ⚙ no outro.
 */
export const footer = (c: Ctx, d: Pick<PaneData, 'resources' | 'now' | 'prefs' | 'pendingInscriptions'>, act: Pick<PaneActions, 'compact' | 'grimoire' | 'config'>) => {
  const { Box, Button, Text } = c.ui
  const rows = resourceData(c, d.resources, d.now)
  const on = (id: ModuleId) => isOn(d.prefs, id)
  const alerted = (r: ResRow) => r.color === toneOf(c.palette).bad || r.color === toneOf(c.palette).warn
  // O rótulo (11 colunas), a porcentagem (5) e a nota (9), com 3 de espaço entre eles: a barra fica com o resto.
  const barW = Math.max(60, pxOf(c) - Math.round(28 * 7.6))
  return (
    <Box key="footer" flexDirection="column" marginTop={1}>
      {c.desktop ? (
        rows.map(r => (
          <Box key={`r-${r.key}`} flexDirection="row" columnGap={1} alignItems="center">
            <Box width={11} flexShrink={0}>
              {r.key === 'mochila' && on('mochila') ? (
                // A Mochila é o botão de compactar: o clique leva ao cartão (salvar o progresso e compactar).
                <Button key="compact" plain dimColor={!alerted(r)} label={`${RES_ICON[r.key]} ${r.label}`} onPress={act.compact}>
                  <Text color={alerted(r) ? r.color : undefined}>
                    {RES_ICON[r.key]} {r.label}
                  </Text>
                </Button>
              ) : (
                <Text dimColor={!alerted(r)} color={alerted(r) ? r.color : undefined}>
                  {RES_ICON[r.key] ?? ''} {r.label}
                </Text>
              )}
            </Box>
            {svg(c, barArt(barW, r.value ?? 0, r.color, r.tip, r.pulse, c.palette), `bar-${r.key}`)}
            <Box width={5} flexShrink={0} justifyContent="flex-end">
              <Text bold color={alerted(r) ? r.color : undefined}>
                {r.text}
              </Text>
            </Box>
            <Box width={9} flexShrink={0} justifyContent="flex-end">
              <Text dimColor wrap="truncate-end">
                {r.sub}
              </Text>
            </Box>
          </Box>
        ))
      ) : (
        // Terminal: uma linha por recurso, com a barra em texto no meio; a Mochila é o botão de compactar.
        rows.map(r => {
          const bar = textBar(r.value ?? 0, Math.max(6, c.width - 30))
          return (
            <Box key={`r-${r.key}`} flexDirection="row" columnGap={1}>
              <Box width={11} flexShrink={0}>
                {r.key === 'mochila' && on('mochila') ? (
                  <Button key="compact" plain dimColor={!alerted(r)} label={`${RES_ICON[r.key]} ${r.label}`} onPress={act.compact} />
                ) : (
                  <Text dimColor={!alerted(r)} color={alerted(r) ? r.color : undefined}>
                    {RES_ICON[r.key] ?? ''} {r.label}
                  </Text>
                )}
              </Box>
              <Text color={r.color}>
                {bar.full}
                <Text dimColor>{bar.empty}</Text>
              </Text>
              <Box width={5} flexShrink={0} justifyContent="flex-end">
                <Text bold color={alerted(r) ? r.color : undefined}>
                  {r.text}
                </Text>
              </Box>
              <Box width={8} flexShrink={0} justifyContent="flex-end">
                <Text dimColor wrap="truncate-end">
                  {r.sub}
                </Text>
              </Box>
            </Box>
          )
        })
      )}
      <Box flexDirection="row" columnGap={2} alignItems="center" marginTop={c.desktop ? 1 : 0}>
        {on('grimorio') && (
          <Button key="grimorio" plain label={d.pendingInscriptions > 0 ? `${c.t.grimoire} · ${d.pendingInscriptions}` : c.t.grimoire} onPress={act.grimoire}>
            {c.t.grimoire}
            {d.pendingInscriptions > 0 && <Text color={toneOf(c.palette).gild}>{` · ${d.pendingInscriptions}`}</Text>}
          </Button>
        )}
        <Box flexGrow={1} />
        <Button key="config" plain dimColor label="⚙" onPress={act.config} />
      </Box>
    </Box>
  )
}

// ---------- Configurações ----------

export type ConfigActions = {
  back: () => void
  lang: (value: 'auto' | 'pt-BR' | 'en') => void
  skin: (skin: Skin) => void
  module: (id: ModuleId) => void
  guard: (mode: GuardMode) => void
  haiku: () => void
  setup: () => void
  about: () => void
  /** Abre a página ⚙ Memória (recursos, avisos, destinos e integrações do grimório). */
  memory: () => void
}

const radio = (on: boolean) => (on ? '◉' : '○')
const check = (on: boolean) => (on ? '☑' : '☐')

/** Os recursos por lugar: o que aparece no chat, no painel, a memória e a proteção. */
const MODULE_GROUPS: { row: 'rowChat' | 'rowPanel' | 'rowMemory' | 'rowGuard'; ids: ModuleId[] }[] = [
  { row: 'rowChat', ids: ['diario', 'faixa', 'recibo'] },
  { row: 'rowPanel', ids: ['painel', 'campanha'] },
  { row: 'rowMemory', ids: ['grimorio', 'mochila'] },
  { row: 'rowGuard', ids: ['guarda'] },
]

/**
 * O ⚙ em duas categorias, como o /config do Claude Code: cada linha com o rótulo
 * curto à esquerda e as opções à direita. O que cada recurso faz fica no "?" do
 * cabeçalho (tooltip); embaixo do grimório, a página ⚙ Memória; embaixo da
 * guarda, o modo. Primeiros passos e Sobre ficam no pé, discretos.
 */
export const configView = (c: Ctx, prefs: Prefs, langOption: string, act: ConfigActions): RenderElement => {
  const { Box, Button, Text } = c.ui
  const W = pxOf(c)
  const cat = (key: string, name: IconName, label: string, rows: RenderElement[], tip?: string) => (
    <Box key={`cat-${key}`} flexDirection="column">
      {c.desktop ? svg(c, categoryHeader(W, name, label, c.palette, tip), `cat-${key}-head`) : <Text bold color="claude">{label.toUpperCase()}</Text>}
      <Box flexDirection="column" paddingLeft={c.desktop ? 3 : 1}>
        {rows}
      </Box>
    </Box>
  )
  const line = (label: string, children: (RenderElement | false)[]) => (
    <Box key={`line-${label}`} flexDirection="row" gap={1}>
      <Box width={10} flexShrink={0}>
        <Text dimColor wrap="truncate-end">
          {label}
        </Text>
      </Box>
      <Box flexDirection="row" flexWrap="wrap" columnGap={2} flexGrow={1} flexShrink={1}>
        {children.filter((x): x is RenderElement => x !== false)}
      </Box>
    </Box>
  )
  const mod = (id: ModuleId) => {
    const tokens = MODULES.find(m => m.id === id)?.tokens === true
    return <Button key={`mod-${id}`} plain dimColor={!isOn(prefs, id)} label={`${check(isOn(prefs, id))} ${c.t.modShort[id]}${tokens ? ' ✦' : ''}`} onPress={() => act.module(id)} />
  }
  const tip = [...MODULES.map(m => `${c.t.module[m.id][0]}: ${c.t.module[m.id][1]}${m.tokens ? ` · ✦ ${c.t.tokens}` : ''}`), '', c.t.guardHint].join('\n')
  const sub = (key: string, children: RenderElement[]) => (
    <Box key={key} flexDirection="row" gap={1}>
      <Box width={10} flexShrink={0} />
      <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
        {children}
      </Box>
    </Box>
  )
  return (
    <Box flexDirection="column" gap={1}>
      <Button key="back" plain label={c.t.back} onPress={act.back} />
      {cat('geral', 'geral', c.t.catGeneral, [
        line(c.t.language, [
          <Button key="lang-auto" plain dimColor={langOption !== 'auto'} label={`${radio(langOption === 'auto')} ${c.t.langAutoShort}`} onPress={() => act.lang('auto')} />,
          <Button key="lang-pt" plain dimColor={langOption !== 'pt-BR'} label={`${radio(langOption === 'pt-BR')} Português`} onPress={() => act.lang('pt-BR')} />,
          <Button key="lang-en" plain dimColor={langOption !== 'en'} label={`${radio(langOption === 'en')} English`} onPress={() => act.lang('en')} />,
        ]),
        line(c.t.skin, [
          <Button key="skin-epico" plain dimColor={c.skin !== 'epico'} label={`${radio(c.skin === 'epico')} ${c.t.skinEpico}`} onPress={() => act.skin('epico')} />,
          <Button key="skin-sobrio" plain dimColor={c.skin !== 'sobrio'} label={`${radio(c.skin === 'sobrio')} ${c.t.skinSobrio}`} onPress={() => act.skin('sobrio')} />,
        ]),
      ])}
      {cat(
        'modulos',
        'modulos',
        c.t.catFeatures,
        MODULE_GROUPS.flatMap(g => [
          line(c.t[g.row], g.ids.map(mod)),
          ...(g.row === 'rowMemory' && isOn(prefs, 'grimorio') ? [sub('mem-sub', [<Button key="mem-open" plain label={c.t.memoryOpen} onPress={act.memory} />])] : []),
          ...(g.row === 'rowGuard' && isOn(prefs, 'guarda')
            ? [
                sub(
                  'guard-sub',
                  (['dialogo', 'nativo'] as const).map(mode => (
                    <Button key={`guard-${mode}`} plain dimColor={prefs.guardMode !== mode} label={`${radio(prefs.guardMode === mode)} ${c.t.guardModes[mode]}`} onPress={() => act.guard(mode)} />
                  )),
                ),
              ]
            : []),
        ]),
        tip,
      )}
      <Box key="cfg-links" flexDirection="row" columnGap={3} paddingLeft={c.desktop ? 3 : 1}>
        <Button key="setup-open" plain dimColor label={c.t.setupLink} onPress={act.setup} />
        <Button key="about" plain dimColor label={c.t.aboutLink} onPress={act.about} />
      </Box>
    </Box>
  )
}

// ---------- ⚙ Memória ----------

/** A página ⚙ Memória: o que foi detectado, cada recurso e aviso, os destinos, as integrações e o Haiku. */
export const memoryView = (
  c: Ctx,
  prefs: Prefs,
  mem: { dests: Dests; progressLabel: string; act: MemoryConfigActions },
  back: () => void,
  haiku: () => void,
): RenderElement => {
  const { Box, Button, Text } = c.ui
  return (
    <Box flexDirection="column" gap={1}>
      <Button key="back" plain label={c.t.back} onPress={back} />
      {c.desktop ? svg(c, categoryHeader(pxOf(c), 'memoria', c.t.catMemory, c.palette), 'mem-head') : <Text bold color="claude">{c.t.catMemory.toUpperCase()}</Text>}
      {memoryConfig(c, prefs.memory, mem.dests, mem.progressLabel, mem.act)}
      <Box key="mem-haiku" flexDirection="row" gap={1}>
        <Box width={12} flexShrink={0}>
          <Text dimColor>{c.t.grimoireRow}</Text>
        </Box>
        <Button key="haiku" plain dimColor={!prefs.grimorioHaiku} label={`${prefs.grimorioHaiku ? '☑' : '☐'} ${c.t.haikuShort} ✦`} onPress={haiku} />
      </Box>
    </Box>
  )
}

// ---------- Sobre ----------

const FEATURE_ICONS: IconName[] = ['objetivo', 'grupo', 'inventario', 'protecao', 'grimorio']

export const aboutView = (c: Ctx, back: () => void): RenderElement => {
  const { Box, Button, Text, Link } = c.ui
  const W = pxOf(c)
  const links: { kind: 'linkedin' | 'github'; href: string; label: string }[] = [
    { kind: 'linkedin' as const, href: LINKEDIN_URL, label: c.t.linkedin },
    { kind: 'github' as const, href: GITHUB_URL, label: c.t.github },
  ].filter(l => l.href !== '')
  return (
    <Box flexDirection="column" gap={1}>
      <Button key="back" plain label={c.t.back} onPress={back} />
      {c.desktop ? (
        svg(c, parade(W, 'Hero Journey', c.palette, c.t.aboutTagline(VERSION)), 'about-parade')
      ) : (
        <Box key="about-head" flexDirection="column">
          <Box key="about-parade" flexDirection="row" justifyContent="center">
            {clawdArt(c, 'mago', 'work', 'about-pet-a')}
            {c.width >= 48 && clawdArt(c, 'paladino', 'work', 'about-pet-b')}
          </Box>
          <Text bold color="claude">
            HERO JOURNEY · {c.t.version(VERSION)}
          </Text>
        </Box>
      )}
      {c.desktop
        ? svg(
            c,
            featureList(
              W,
              c.t.aboutFeatures.map((f, i) => ({ icon: FEATURE_ICONS[i] ?? 'objetivo', title: f[0], text: f[1] })),
              c.palette,
            ),
            'about-features',
          )
        : c.t.aboutFeatures.map(f => (
            <Text key={`f-${f[0]}`} wrap="wrap">
              · {f[0]}: {f[1]}
            </Text>
          ))}
      {c.desktop && svg(c, categoryHeader(W, 'grupo', c.t.classesTitle, c.palette, c.t.classesHint), 'about-classes-head')}
      {!c.desktop && (
        // Terminal: o elenco em lista, o nome na cor da classe e o que ela faz (sem tooltip, o papel vem escrito).
        <Box key="about-classes" flexDirection="column">
          <Text bold>{c.t.classesTitle}</Text>
          {(Object.keys(c.t.className) as Cls[]).map(cls => (
            <Box key={`cls-${cls}`} flexDirection="row" columnGap={1}>
              <Text>{CLASS_ICON[cls]}</Text>
              <Box width={12} flexShrink={0}>
                <Text bold color={classColor(cls, c.palette)}>
                  {c.t.className[cls]}
                </Text>
              </Box>
              <Text dimColor wrap="truncate-end">
                {c.t.classRole[cls]}
              </Text>
            </Box>
          ))}
        </Box>
      )}
      {c.desktop && classGallery(W, Object.keys(c.t.className) as Cls[], cls => c.t.className[cls], cls => c.t.classRole[cls], c.palette).map((art, i) => svg(c, art, `about-classes-${i}`))}
      {c.desktop ? svg(c, categoryHeader(W, 'projeto', c.t.aboutBy, c.palette), 'about-by') : <Text bold>{c.t.aboutBy}</Text>}
      <Box flexDirection="column" paddingLeft={c.desktop ? 3 : 0}>
        <Text bold>Saulo Rocha</Text>
        <Text dimColor wrap="wrap">
          {c.t.authorRole}
        </Text>
        <Box flexDirection="row" gap={2}>
          {links.map(l => (
            <Box key={`link-${l.kind}`} flexDirection="row" gap={1} alignItems="center">
              {svg(c, linkIcon(l.kind, c.palette, l.label), `icon-${l.kind}`)}
              <Link href={l.href}>{l.label}</Link>
            </Box>
          ))}
        </Box>
      </Box>
      <Text dimColor wrap="wrap">
        {c.t.credits}
      </Text>
    </Box>
  )
}
