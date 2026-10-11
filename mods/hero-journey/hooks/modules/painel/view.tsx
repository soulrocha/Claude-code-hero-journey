// O painel: o objetivo e o progresso, as quests do capítulo, grupo e inventário,
// e no fim, presos embaixo, os botões e os recursos (Mochila, Mana e Vigor);
// mais as páginas ⚙ Configurações e ℹ Sobre. Com poucos dados a tela não fica
// vazia: o Clawd está sempre no grupo, os capítulos fazem as vezes das quests e o
// inventário limpo mostra os últimos commits.

import type { RenderElement } from 'claude-code'

import type { Campaign, Cls, GuardMode, Inventory, Member, ModuleId, Prefs, Quest, Rarity, Resources, Skin, Working } from '../../../types'
import { categoryHeader, doneMembersArt, featureList, glyphOf, itemsArt, linkIcon, memberArt, objectiveBar, parade, questIconAt, questsArt, rarityTone, resourceRows, toneOf } from '../../core/art'
import { clockOf, humanType, untilOf } from '../../core/classes'
import type { IconName, MemberArt, QuestArt, ResRow } from '../../core/art'
import { isOn, MODULES } from '../../core/prefs'
import type { Ctx } from '../../core/ui'
import { GITHUB_URL, LINKEDIN_URL, pxOf, svg, title, VERSION } from '../../core/ui'
import { goalOf } from '../campanha/campanha'
import { campaignSteps } from '../faixa/view'
import { bagOf, countdown, short, windowOf } from '../mochila/recursos'
import { questView } from './painel'

export type PaneData = {
  prefs: Prefs
  campaign: Campaign | null
  quests: readonly Quest[]
  party: readonly Member[]
  inventory: Inventory
  partyTab: 'grupo' | 'inventario'
  resources: Resources | null
  /** O instante do desenho, para a contagem do reset. */
  now: number
  /** Quanto cabe no meio para o rodapé ficar preso no fim (o paneFit do register). */
  fit: { maxCards: number; maxItems: number }
  working: Working | null
  /** Inscrições do grimório esperando o Selar. */
  pendingInscriptions: number
}

export type PaneActions = {
  tab: (tab: 'grupo' | 'inventario') => void
  joinParty: (joined: boolean) => void
  achieved: () => void
  /** ✦ O Haiku reescreve o objetivo curto a partir dos pedidos da sessão (gasta tokens, só no clique). */
  recalibrate: () => void
  compact: () => void
  grimoire: () => void
  config: () => void
  about: () => void
}

/** O corpo ocupa o meio; os botões e os recursos ficam presos no fim (o painel recebe a altura toda). */
export const mainView = (c: Ctx, d: PaneData, act: PaneActions): RenderElement => {
  const { Box } = c.ui
  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box key="body" flexDirection="column" gap={1} flexGrow={1} flexShrink={1} overflow="hidden">
        {objectiveSection(c, d, act)}
        {questSection(c, d)}
        {partySections(c, d, act)}
      </Box>
      {footer(c, d, act)}
    </Box>
  )
}

/** O objetivo inteiro (o 1º pedido) e o curto que a tela mostra. */
export const objectiveOf = (campaign: Campaign | null) =>
  campaign === null ? { text: '', short: '', n: 0 } : { text: campaign.objective, short: goalOf(campaign), n: campaign.chapters.length }

const stepWords = (c: Ctx) => ({ step: c.t.stepTip, steps: c.t.stepsWord, chapter: c.t.chapterShort })

/**
 * Um botão da casa: o glifo em dourado e o rótulo, sem moldura. Uma linha de
 * botões assim quebra quando falta largura, em vez de cortar o último.
 */
const action = (c: Ctx, key: string, glyph: string, label: string, onPress: () => void, dim = false) => {
  const { Button, Text } = c.ui
  return (
    <Button key={key} plain dimColor={dim} label={`${glyph} ${label}`} onPress={onPress}>
      <Text color={toneOf(c.palette).gild}>{glyph}</Text> {label}
    </Button>
  )
}

const objectiveSection = (c: Ctx, d: PaneData, act: PaneActions) => {
  const { Box, Text } = c.ui
  const o = objectiveOf(d.campaign)
  const steps = campaignSteps(d.campaign, d.quests, c.t.chapter)
  const n = Math.max(1, o.n)
  const achieved = d.campaign?.achieved === true
  // "Alcançado?" só depois de ao menos um capítulo fechado: antes disso é ruído.
  const canMark = d.campaign !== null && !achieved && d.campaign.chapters.some(ch => ch.report !== undefined)
  if (!c.desktop) {
    return (
      <Box key="objetivo" flexDirection="column">
        {title(c, c.t.section.objetivo, achieved ? '?' : undefined)}
        <Text bold wrap="wrap">
          {o.short === '' ? c.t.noObjective : o.short}
        </Text>
        {steps.length > 0 && <Text dimColor>{`${steps.filter(s => s.state === 'done').length}/${steps.length} · ${c.t.chapterShort(n)}`}</Text>}
      </Box>
    )
  }
  // Como no laboratório aprovado: título do quest log, o objetivo curto em negrito
  // e a barra fina de canto a canto. Com muitos capítulos, a barra conta todos e
  // desenha só os 12 losangos mais recentes. As ações vêm logo embaixo, à esquerda.
  return (
    <Box key="objetivo" flexDirection="column">
      {title(c, c.t.section.objetivo, achieved ? '?' : undefined)}
      <Text bold wrap="wrap">
        {o.short === '' ? c.t.noObjective : o.short}
      </Text>
      {steps.length > 0 && svg(c, objectiveBar(pxOf(c), steps, n, c.palette, stepWords(c)), 'objective-bar')}
      {d.campaign !== null && (
        <Box flexDirection="row" columnGap={2} flexWrap="wrap">
          {action(c, 'recalibrate', '✦', c.t.recalibrateShort, act.recalibrate, true)}
          {canMark && action(c, 'achieved', '◎', c.t.markAchievedShort, act.achieved, true)}
          {achieved && <Text color="success">{c.t.achieved}</Text>}
        </Box>
      )}
    </Box>
  )
}

const questSection = (c: Ctx, d: PaneData) => {
  const { Box, Text } = c.ui
  const quests = d.quests
  const q = questView(quests)
  const done = q.done.length
  const counter = quests.length > 0 ? `${done}/${quests.length}` : undefined
  const mark = q.current === undefined && done > 0 ? '?' : '!'
  const cls: Cls | undefined = d.working?.cls
  if (!c.desktop) {
    return (
      <Box key="quests" flexDirection="column">
        {title(c, c.t.section.quests, mark)}
        {quests.length === 0 && <Text dimColor>{c.t.noQuests}</Text>}
        {done > 0 && <Text color="success">{'✓'.repeat(Math.min(12, done))}</Text>}
        {q.current !== undefined && (
          <Text bold color="warning" wrap="wrap">
            ! {q.current.title}
          </Text>
        )}
        {q.next.map(x => (
          <Text key={`next-${x.id}`} dimColor wrap="truncate-end">
            · {x.title}
          </Text>
        ))}
        {q.mist > 0 && <Text dimColor>{c.t.questsMist(q.mist)}</Text>}
      </Box>
    )
  }
  // Sem tarefas do Claude, os capítulos contam a história: os fechados acesos, o atual em destaque.
  if (quests.length === 0) {
    const chapters = d.campaign?.chapters ?? []
    if (chapters.length === 0) {
      return (
        <Box key="quests" flexDirection="column">
          {title(c, c.t.section.quests, '!')}
          <Text dimColor>{c.t.noQuests}</Text>
        </Box>
      )
    }
    const closed = chapters.filter(ch => ch.report !== undefined)
    const open = chapters.filter(ch => ch.report === undefined)
    const name = (n: number, mission?: string) => mission ?? c.t.chapter(n)
    const current = open[open.length - 1]
    return (
      <Box key="quests" flexDirection="column">
        {title(c, c.t.chaptersTitle, closed.length > 0 && current === undefined ? '?' : '!', `${closed.length}/${chapters.length}`)}
        {svg(
          c,
          questsArt(
            pxOf(c),
            closed.map((ch, i): QuestArt => ({ name: name(ch.n, ch.report?.mission), icon: questIconAt(ch.report?.mission ?? '', i), sub: '' })),
            current && {
              name: name(current.n),
              icon: '◈',
              sub: cls ? `${c.t.inProgress} · ${c.t.className[cls]}` : c.t.waitingYou,
              cls,
            },
            [],
            '',
            c.palette,
            c.t.chaptersDone(closed.length),
          ),
          'chapters-art',
        )}
      </Box>
    )
  }
  return (
    <Box key="quests" flexDirection="column">
      {title(c, c.t.section.quests, mark, counter)}
      {svg(
        c,
        questsArt(
          pxOf(c),
          q.done.map((x, i) => ({ name: x.title, icon: questIconAt(x.title, i), sub: '' })),
          q.current && {
            name: q.current.title,
            icon: questIconAt(q.current.title, done),
            sub: cls ? `${c.t.inProgress} · ${c.t.className[cls]}` : c.t.inProgress,
            cls,
          },
          q.next.map((x, i) => ({ name: x.title, icon: questIconAt(x.title, done + 1 + i), sub: '' })),
          q.mist > 0 ? c.t.questsMist(q.mist) : '',
          c.palette,
          c.t.questsDone(done),
        ),
        'quests-art',
      )}
    </Box>
  )
}

/** O nome de um membro: o tipo humanizado ("QA adversarial") ou, sem tipo, a classe. */
const memberName = (c: Ctx, m: Member) => humanType(m.type, c.t.knownTypes) || c.t.className[m.cls]

const partySections = (c: Ctx, d: PaneData, act: PaneActions) => {
  const { Box, Button, Text } = c.ui
  const active = d.party.filter(m => m.status === 'run').length
  const counts = { grupo: 1 + active, inventario: d.inventory.items.length }
  if (d.prefs.partyJoined) {
    const on = d.partyTab
    // As abas alinhadas à esquerda, com o resto do painel: ◆ a aberta, ◇ a outra; ⊞ separa.
    const tab = (id: 'grupo' | 'inventario', label: string) => (
      <Button key={`tab-${id}`} plain dimColor={on !== id} label={`${on === id ? '◆' : '◇'} ${label} · ${counts[id]}`} onPress={() => act.tab(id)}>
        <Text color={on === id ? toneOf(c.palette).gild : undefined}>{on === id ? '◆' : '◇'}</Text> {label} · {String(counts[id])}
      </Button>
    )
    return (
      <Box key="party" flexDirection="column">
        {title(c, `${c.t.section.grupo} · ${c.t.section.inventario}`)}
        <Box flexDirection="row" columnGap={2} alignItems="center">
          {tab('grupo', c.t.section.grupo)}
          {tab('inventario', c.t.section.inventario)}
          <Box flexGrow={1} />
          <Button key="split" plain dimColor label="⊞" onPress={() => act.joinParty(false)} />
        </Box>
        {on === 'grupo' ? partyBody(c, d.party, d.working, d.campaign?.achieved === true, d.fit.maxCards) : inventoryBody(c, d.inventory, d.fit.maxItems)}
      </Box>
    )
  }
  return (
    <Box key="party" flexDirection="column" gap={1}>
      <Box flexDirection="column">
        {title(c, c.t.section.grupo, undefined, String(counts.grupo))}
        {partyBody(c, d.party, d.working, d.campaign?.achieved === true, d.fit.maxCards)}
      </Box>
      <Box flexDirection="column">
        {title(c, c.t.section.inventario, undefined, String(counts.inventario))}
        {inventoryBody(c, d.inventory, d.fit.maxItems)}
      </Box>
      <Button key="join" plain dimColor label={c.t.join} onPress={() => act.joinParty(true)} />
    </Box>
  )
}

/** O grupo: o Clawd sempre, até `maxActive` cartões em ação (o resto vira "+N") e a fileira dos que voltaram. */
const partyBody = (c: Ctx, party: readonly Member[], working: Working | null, achieved: boolean, maxActive: number) => {
  const { Box, Text } = c.ui
  const active = party.filter(m => m.status === 'run')
  const done = party.filter(m => m.status !== 'run')
  // O Clawd está sempre no grupo: em ação, comemorando ou cochilando no acampamento.
  const main: MemberArt =
    working !== null
      ? { name: c.t.className.druida, cls: working.cls, sub: c.t.mainSession(c.t.className[working.cls]), status: c.t.inAction, busy: true }
      : achieved
        ? { name: c.t.className.druida, cls: 'druida', sub: c.t.mainSession(c.t.className.druida), status: c.t.missionDone, busy: false }
        : { name: c.t.className.druida, cls: 'druida', sub: c.t.atCamp, status: c.t.resting, busy: false, idle: true }
  const cards: MemberArt[] = [
    main,
    ...active.slice(0, maxActive).map(m => ({
      name: memberName(c, m),
      cls: m.cls,
      sub: `${c.t.className[m.cls].toLowerCase()} · ${m.description}`,
      status: c.t.onExpedition,
      busy: true,
    })),
  ]
  const moreActive = Math.max(0, active.length - maxActive)
  if (!c.desktop) {
    return (
      <Box flexDirection="column">
        {cards.map((m, i) => (
          <Text key={`m-${i}`} wrap="truncate-end">
            {m.name} · {m.status} · {m.sub}
          </Text>
        ))}
        {done.length > 0 && <Text dimColor>{`${c.t.partyDone}: ${done.map(m => `${m.status === 'err' ? '✗' : '✓'} ${memberName(c, m)}`).join(' ')}`}</Text>}
      </Box>
    )
  }
  return (
    <Box flexDirection="column">
      {cards.map((m, i) => svg(c, memberArt(pxOf(c), m, c.palette), `member-${i}-${m.cls}`))}
      {moreActive > 0 && <Text dimColor>{c.t.moreActive(moreActive)}</Text>}
      {done.length > 0 &&
        svg(
          c,
          doneMembersArt(
            pxOf(c),
            done.map(m => ({ name: memberName(c, m), cls: m.cls, sub: m.description, status: '', busy: false, failed: m.status === 'err' })),
            c.t.doneHint,
            c.palette,
          ),
          'members-done',
        )}
    </Box>
  )
}

const RARITY_ORDER: Rarity[] = ['lendario', 'raro', 'incomum', 'comum', 'pobre']

/** O inventário: o branch, e até `max` itens (ou os últimos commits, com tudo guardado). */
const inventoryBody = (c: Ctx, inv: Inventory, max: number) => {
  const { Box, Text } = c.ui
  if (!inv.isRepo) return <Text dimColor>{c.t.notRepo}</Text>
  const head = [
    inv.branch ?? '?',
    inv.ahead > 0 ? c.t.ahead(inv.ahead) : '',
    inv.behind > 0 ? c.t.behind(inv.behind) : '',
    inv.items.length > 0 ? c.t.uncommitted(inv.items.length) : '',
  ]
    .filter(Boolean)
    .join(' · ')
  const shown = inv.items.slice(0, max)
  const delta = (added?: number, removed?: number) =>
    added === undefined ? '' : `+${added}${removed !== undefined && removed > 0 ? ` −${removed}` : ''}`
  const recent = (inv.recent ?? []).slice(0, max)
  return (
    <Box flexDirection="column">
      <Text dimColor>⎇ {head}</Text>
      {inv.items.length === 0 && (
        // Limpo: o baú mostra o que já foi guardado (os últimos commits).
        <Box flexDirection="column">
          <Text color="success">{c.t.clean}</Text>
          {recent.length > 0 && <Text dimColor>{c.t.recentCommits}</Text>}
          {c.desktop && recent.length > 0
            ? svg(
                c,
                itemsArt(
                  pxOf(c),
                  recent.map(r => ({ name: r.subject.replace(/^\w+(\([^)]*\))?!?:\s*/, ''), rarity: 'comum' as const, glyph: '◆', diff: c.t.ago(Date.now() / 1000 - Number(r.when)), tip: `${r.hash} · ${r.subject}` })),
                  c.palette,
                ),
                'recent-art',
              )
            : recent.map(r => (
                <Text key={`r-${r.hash}`} dimColor wrap="truncate-end">
                  ◆ {r.subject} · {c.t.ago(Date.now() / 1000 - Number(r.when))}
                </Text>
              ))}
        </Box>
      )}
      {inv.items.length > 0 && (
        // A legenda: o cartão colorido aparece ao passar o mouse sobre a linha (hover nativo).
        <Box key="rarity" flexDirection="row" gap={1}>
          <Text dimColor>{c.t.rarityByImpact}</Text>
          <Text bold color="claude">
            (?)
          </Text>
          <Box
            position="absolute"
            top={1}
            left={0}
            display="none"
            hover={{ display: 'flex' }}
            flexDirection="column"
            borderStyle="round"
            paddingX={1}
            backgroundColor={c.bg}
          >
            <Text bold>{c.t.rarities}</Text>
            {RARITY_ORDER.map(r => (
              <Text key={`rar-${r}`} color={rarityTone(r, c.palette)}>
                {c.t.rarity[r]}
              </Text>
            ))}
          </Box>
        </Box>
      )}
      {c.desktop
        ? shown.length > 0 &&
          svg(
            c,
            itemsArt(
              pxOf(c),
              shown.map(item => ({
                name: item.path.split(/[\\/]/).slice(-3).join('/'),
                rarity: item.rarity,
                glyph: glyphOf(item.path),
                diff: item.rarity === 'pobre' ? c.t.deleted : delta(item.added, item.removed) || (item.code === '??' ? c.t.isNew : ''),
                tip: `${item.path} — ${c.t.rarity[item.rarity]}`,
              })),
              c.palette,
            ),
            'items-art',
          )
        : shown.map(item => (
            <Box key={`i-${item.path}`} flexDirection="row" gap={1}>
              <Text color={rarityTone(item.rarity, c.palette)} wrap="truncate-start">
                {item.path}
              </Text>
              <Text dimColor>{delta(item.added, item.removed)}</Text>
            </Box>
          ))}
      {inv.items.length > max && <Text dimColor>+{inv.items.length - max}</Text>}
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

/**
 * O rodapé, preso no fim do painel: os botões (Grimório e Compactar à esquerda,
 * ⚙ à direita) e, por último, os recursos, um por linha, para nada se sobrepor.
 */
const footer = (c: Ctx, d: PaneData, act: PaneActions) => {
  const { Box, Button, Text } = c.ui
  const rows = resourceData(c, d.resources, d.now)
  const on = (id: ModuleId) => isOn(d.prefs, id)
  return (
    <Box key="footer" flexDirection="column">
      <Box flexDirection="row" columnGap={2} alignItems="center">
        {on('grimorio') && (
          <Button key="grimorio" plain label={d.pendingInscriptions > 0 ? `${c.t.grimoire} · ${d.pendingInscriptions}` : c.t.grimoire} onPress={act.grimoire}>
            {c.t.grimoire}
            {d.pendingInscriptions > 0 && <Text color={toneOf(c.palette).gild}>{` · ${d.pendingInscriptions}`}</Text>}
          </Button>
        )}
        {on('mochila') && <Button key="compact" plain dimColor label={c.t.compactShort} onPress={act.compact} />}
        <Box flexGrow={1} />
        <Button key="config" plain label="⚙" onPress={act.config} />
      </Box>
      {c.desktop ? (
        svg(c, resourceRows(pxOf(c), rows, c.palette), 'resources')
      ) : (
        <Text dimColor wrap="truncate-end">
          {rows.map(r => `${r.label} ${r.text}${r.sub === '' ? '' : ` ${r.sub}`}`).join(' · ')}
        </Text>
      )}
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
  compact: () => void
}

const radio = (on: boolean) => (on ? '◉' : '○')
const check = (on: boolean) => (on ? '☑' : '☐')

/** Os módulos por lugar: o que aparece no chat, no painel, as ferramentas e a proteção. */
const MODULE_GROUPS: { row: 'rowChat' | 'rowPanel' | 'rowTools' | 'rowGuard'; ids: ModuleId[] }[] = [
  { row: 'rowChat', ids: ['diario', 'faixa', 'recibo'] },
  { row: 'rowPanel', ids: ['painel', 'campanha'] },
  { row: 'rowTools', ids: ['mochila', 'grimorio'] },
  { row: 'rowGuard', ids: ['guarda'] },
]

/**
 * O ⚙ em categorias com ícone. Cada linha: o rótulo curto à esquerda e as opções
 * à direita; a explicação de cada opção fica no "?" do cabeçalho (tooltip).
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
  const line = (label: string, children: RenderElement[]) => (
    <Box key={`line-${label}`} flexDirection="row" gap={1}>
      <Box width={13} flexShrink={0}>
        <Text dimColor wrap="truncate-end">
          {label}
        </Text>
      </Box>
      <Box flexDirection="row" flexWrap="wrap" flexGrow={1} flexShrink={1}>
        {children}
      </Box>
    </Box>
  )
  const mod = (id: ModuleId) => {
    const tokens = MODULES.find(m => m.id === id)?.tokens === true
    return (
      <Button key={`mod-${id}`} plain dimColor={!isOn(prefs, id)} label={`${check(isOn(prefs, id))} ${c.t.module[id][0]}${tokens ? ' ✦' : ''}`} onPress={() => act.module(id)} />
    )
  }
  const modulesTip = MODULES.map(m => `${c.t.module[m.id][0]}: ${c.t.module[m.id][1]}${m.tokens ? ` · ✦ ${c.t.tokens}` : ''}`).join('\n')
  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="row" columnGap={2} flexWrap="wrap">
        <Button key="back" plain label={c.t.back} onPress={act.back} />
        <Box flexGrow={1} />
        {isOn(prefs, 'mochila') && <Button key="mochila" plain dimColor label={c.t.compactShort} onPress={act.compact} />}
        <Button key="about" plain dimColor label={c.t.about} onPress={act.about} />
        <Button key="setup-open" plain dimColor label={c.t.setupOpen} onPress={act.setup} />
      </Box>
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
        c.t.modules,
        MODULE_GROUPS.map(g => line(c.t[g.row], g.ids.map(mod))),
        modulesTip,
      )}
      {cat(
        'protecao',
        'protecao',
        c.t.guardMode,
        [
          line(
            c.t.guardRow,
            (['dialogo', 'chefe', 'nativo'] as const).map(mode => (
              <Button key={`guard-${mode}`} plain dimColor={prefs.guardMode !== mode} label={`${radio(prefs.guardMode === mode)} ${c.t.guardModes[mode]}`} onPress={() => act.guard(mode)} />
            )),
          ),
        ],
        c.t.guardHint,
      )}
      {cat(
        'memoria',
        'memoria',
        c.t.catMemory,
        [line(c.t.grimoireRow, [<Button key="haiku" plain dimColor={!prefs.grimorioHaiku} label={`${check(prefs.grimorioHaiku)} ${c.t.haikuShort} ✦`} onPress={act.haiku} />])],
        `${c.t.haiku} · ${c.t.tokens}`,
      )}
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
        <Text bold color="claude">
          HERO JOURNEY · {c.t.version(VERSION)}
        </Text>
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
