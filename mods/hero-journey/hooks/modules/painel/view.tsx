// O painel: o cartão da campanha (objetivo curto e progresso), as quests do
// capítulo, grupo e inventário, e o rodapé preso embaixo; mais as páginas
// ⚙ Configurações e ℹ Sobre. O detalhe de cada missão fica na resposta final
// do Claude, não no painel. Com poucos dados a tela não fica vazia: o Clawd
// está sempre no grupo, os capítulos fazem as vezes das quests e o inventário
// limpo mostra os últimos commits.

import type { RenderElement } from 'claude-code'

import type { Campaign, Cls, GuardMode, Inventory, Member, ModuleId, Prefs, Profile, Quest, Rarity, Section, Skin, Working } from '../../../types'
import { linkIcon } from '../../core/art'
import { humanType } from '../../core/classes'
import type { MemberArt, QuestArt } from '../../core/hero-art'
import { doneMembersArt, glyphOf, itemsArt, memberArt, objectiveBar, questIconAt, questsArt, rarityTone, resourcesArt } from '../../core/hero-art'
import type { IconName } from '../../core/polish-art'
import { categoryHeader, featureList, icon, parade } from '../../core/polish-art'
import { isOn, isShown, MODULES, SECTIONS } from '../../core/prefs'
import type { Ctx } from '../../core/ui'
import { GITHUB_URL, LINKEDIN_URL, pxOf, svg, title, VERSION } from '../../core/ui'
import { goalOf } from '../campanha/campanha'
import { campaignSteps } from '../faixa/view'
import { questView } from './painel'

export type PaneData = {
  prefs: Prefs
  campaign: Campaign | null
  quests: readonly Quest[]
  party: readonly Member[]
  inventory: Inventory
  partyTab: 'grupo' | 'inventario'
  usage: { context?: number; mana?: number; manaAt: string; manaIn: string; vigor?: number; vigorAt: string; vigorIn: string }
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
  sideQuest: () => void
  projects: () => void
  config: () => void
  about: () => void
}

/** O corpo ocupa o meio; o rodapé fica preso embaixo (o painel recebe a altura toda). */
export const mainView = (c: Ctx, d: PaneData, act: PaneActions): RenderElement => {
  const { Box } = c.ui
  const show = (s: Section) => isShown(d.prefs, s)
  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box key="body" flexDirection="column" gap={2} flexGrow={1} flexShrink={1} overflow="hidden">
        {show('objetivo') && objectiveSection(c, d, act)}
        {show('quests') && questSection(c, d)}
        {partySections(c, d, act)}
      </Box>
      {show('rodape') && footer(c, d, act)}
    </Box>
  )
}

/** O objetivo inteiro (o 1º pedido) e o curto que a tela mostra. */
export const objectiveOf = (campaign: Campaign | null) =>
  campaign === null ? { text: '', short: '', n: 0 } : { text: campaign.objective, short: goalOf(campaign), n: campaign.chapters.length }

const stepWords = (c: Ctx) => ({ step: c.t.stepTip, steps: c.t.stepsWord, chapter: c.t.chapterShort })

const objectiveSection = (c: Ctx, d: PaneData, act: PaneActions) => {
  const { Box, Button, Text } = c.ui
  const o = objectiveOf(d.campaign)
  const steps = campaignSteps(d.campaign, d.quests, c.t.chapter)
  const n = Math.max(1, o.n)
  const label = `${c.t.campaignLabel} · ${c.t.chapterShort(n)}`
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
  // (o inteiro no tooltip da barra) e a barra fina de canto a canto. Com muitos
  // capítulos, a barra mostra só os 12 últimos para os losangos não se amontoarem.
  const bar = steps.length > 12 ? steps.slice(-12) : steps
  // Ações do objetivo como chips: ícone desenhado + botão, separadas do texto.
  const chip = (key: string, iconName: IconName, label: string, onPress: () => void) => (
    <Box key={`chip-${key}`} flexDirection="row" gap={1} alignItems="center">
      {svg(c, icon(iconName, c.palette, label), `chip-icon-${key}`)}
      <Button key={key} plain label={label} onPress={onPress} />
    </Box>
  )
  return (
    <Box key="objetivo" flexDirection="column">
      {title(c, c.t.section.objetivo, achieved ? '?' : undefined)}
      <Text bold wrap="wrap">
        {o.short === '' ? c.t.noObjective : o.short}
      </Text>
      {bar.length > 0 && svg(c, objectiveBar(pxOf(c), bar, n, c.palette, stepWords(c)), 'objective-bar')}
      {d.campaign !== null && (
        <Box flexDirection="row" gap={3} marginTop={1}>
          {chip('recalibrate', 'memoria', c.t.recalibrate.replace(/^✦s*/, ''), act.recalibrate)}
          {canMark && chip('achieved', 'objetivo', c.t.markAchieved, act.achieved)}
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
        <Text dimColor wrap="wrap">
          {c.t.questsHint}
        </Text>
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

/** O painel não rola com o rodapé preso: no máximo 3 cartões em ação, o resto vira "+N". */
const MAX_ACTIVE = 3

const partySections = (c: Ctx, d: PaneData, act: PaneActions) => {
  const { Box, Button } = c.ui
  const showParty = isShown(d.prefs, 'grupo')
  const showInv = isShown(d.prefs, 'inventario')
  if (!showParty && !showInv) return null
  const active = d.party.filter(m => m.status === 'run').length
  const counts = { grupo: 1 + active, inventario: d.inventory.items.length }
  if (d.prefs.partyJoined && showParty && showInv) {
    const on = d.partyTab
    // Como no laboratório: ◆ Grupo ◇ Inventário centralizados, com o contador; ⊞ separa.
    const tab = (id: 'grupo' | 'inventario', label: string) => (
      <Button key={`tab-${id}`} plain dimColor={on !== id} label={`${on === id ? '◆' : '◇'} ${label} · ${counts[id]}`} onPress={() => act.tab(id)} />
    )
    return (
      <Box key="party" flexDirection="column">
        {title(c, `${c.t.section.grupo} · ${c.t.section.inventario}`)}
        <Box flexDirection="row" gap={2} alignItems="center">
          <Box flexGrow={1} />
          {tab('grupo', c.t.section.grupo)}
          {tab('inventario', c.t.section.inventario)}
          <Box flexGrow={1} />
          <Button key="split" plain dimColor label="⊞" onPress={() => act.joinParty(false)} />
        </Box>
        {on === 'grupo' ? partyBody(c, d.party, d.working, d.campaign?.achieved === true) : inventoryBody(c, d.inventory)}
      </Box>
    )
  }
  return (
    <Box key="party" flexDirection="column" gap={1}>
      {showParty && (
        <Box flexDirection="column">
          {title(c, c.t.section.grupo, undefined, String(counts.grupo))}
          {partyBody(c, d.party, d.working, d.campaign?.achieved === true)}
        </Box>
      )}
      {showInv && (
        <Box flexDirection="column">
          {title(c, c.t.section.inventario, undefined, String(counts.inventario))}
          {inventoryBody(c, d.inventory)}
        </Box>
      )}
      {showParty && showInv && <Button key="join" plain dimColor label={c.t.join} onPress={() => act.joinParty(true)} />}
    </Box>
  )
}

const partyBody = (c: Ctx, party: readonly Member[], working: Working | null, achieved: boolean) => {
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
    ...active.slice(0, MAX_ACTIVE).map(m => ({
      name: memberName(c, m),
      cls: m.cls,
      sub: `${c.t.className[m.cls].toLowerCase()} · ${m.description}`,
      status: c.t.onExpedition,
      busy: true,
    })),
  ]
  const moreActive = Math.max(0, active.length - MAX_ACTIVE)
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
      {active.length === 0 && done.length === 0 && <Text dimColor>{c.t.partyHint}</Text>}
    </Box>
  )
}

const RARITY_ORDER: Rarity[] = ['lendario', 'raro', 'incomum', 'comum', 'pobre']

const inventoryBody = (c: Ctx, inv: Inventory) => {
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
  const shown = inv.items.slice(0, 8)
  const delta = (added?: number, removed?: number) =>
    added === undefined ? '' : `+${added}${removed !== undefined && removed > 0 ? ` −${removed}` : ''}`
  const recent = inv.recent ?? []
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
                  recent.map(r => ({ name: r.subject.replace(/^w+(([^)]*))?!?:s*/, ''), rarity: 'comum' as const, glyph: '◆', diff: c.t.ago(Date.now() / 1000 - Number(r.when)), tip: `${r.hash} · ${r.subject}` })),
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
                name: item.path.split(/[\/]/).slice(-3).join('/'),
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
      {inv.items.length > 8 && <Text dimColor>+{inv.items.length - 8}</Text>}
    </Box>
  )
}

/** Como no laboratório: Mochila, Mana e Vigor em três colunas, e Grimório, Side quest e ⚙ numa linha. */
const footer = (c: Ctx, d: PaneData, act: PaneActions) => {
  const { Box, Button, Text } = c.ui
  const u = d.usage
  const pctOf = (v: number | undefined) => (v === undefined ? '—' : `${Math.round(v)}%`)
  const on = (id: ModuleId) => isOn(d.prefs, id)
  const grim = d.pendingInscriptions > 0 ? `${c.t.grimoire} · ${d.pendingInscriptions}` : c.t.grimoire
  return (
    <Box key="footer" flexDirection="column">
      {c.desktop ? (
        svg(
          c,
          resourcesArt(
            pxOf(c),
            [
              { key: 'mochila', label: c.t.footer.mochila, value: u.context, color: '#c9965f', reset: '', tip: c.t.mochilaTip(pctOf(u.context)) },
              { key: 'mana', label: c.t.footer.mana, value: u.mana, color: '#6cb6ec', reset: u.manaIn, tip: c.t.manaTip(pctOf(u.mana), u.manaAt) },
              { key: 'vigor', label: c.t.footer.vigor, value: u.vigor, color: '#8fc46a', reset: u.vigorIn, tip: c.t.vigorTip(pctOf(u.vigor), u.vigorAt) },
            ],
            c.palette,
          ),
          'resources',
        )
      ) : (
        <Text dimColor>{`${c.t.footer.mochila} ${pctOf(u.context)} · ${c.t.footer.mana} ${pctOf(u.mana)} · ${c.t.footer.vigor} ${pctOf(u.vigor)}`}</Text>
      )}
      <Box flexDirection="row" gap={2} justifyContent="space-between" alignItems="center">
        {on('grimorio') && <Button key="grimorio" plain label={grim} onPress={act.grimoire} />}
        {on('sideQuest') && <Button key="side-quest" plain label={c.t.sideQuest} onPress={act.sideQuest} />}
        <Button key="config" plain label="⚙" onPress={act.config} />
      </Box>
    </Box>
  )
}

// ---------- Configurações ----------

export type ConfigActions = {
  back: () => void
  lang: (value: 'auto' | 'pt-BR' | 'en') => void
  skin: (skin: Skin) => void
  profile: (profile: Profile) => void
  toggle: (section: Section) => void
  diary: (mode: Prefs['diary']) => void
  module: (id: ModuleId) => void
  guard: (mode: GuardMode) => void
  haiku: () => void
  setup: () => void
  /** Atalhos que saíram do rodapé: Projetos, Sobre e Compactar. */
  projects: () => void
  about: () => void
  compact: () => void
}

const radio = (on: boolean) => (on ? '◉' : '○')
const check = (on: boolean) => (on ? '☑' : '☐')

/** Os módulos por lugar: o que aparece no chat, no painel, as ferramentas e a proteção. */
const MODULE_GROUPS: { row: 'rowChat' | 'rowPanel' | 'rowTools' | 'rowGuard'; ids: ModuleId[] }[] = [
  { row: 'rowChat', ids: ['diario', 'faixa'] },
  { row: 'rowPanel', ids: ['painel', 'campanha', 'comemoracao'] },
  { row: 'rowTools', ids: ['grimorio', 'mochila', 'sideQuest', 'projetos'] },
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
      <Box flexDirection="row" gap={1}>
        <Button key="back" plain label={c.t.back} onPress={act.back} />
        <Box flexGrow={1} />
        {isOn(prefs, 'projetos') && <Button key="projects" plain dimColor label={c.t.projects} onPress={act.projects} />}
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
      {cat('painel', 'painel', c.t.catPanel, [
        line(
          c.t.profileTitleShort,
          (['completo', 'foco', 'minimo', 'personalizado'] as const).map(p => (
            <Button key={`profile-${p}`} plain dimColor={prefs.profile !== p} label={`${radio(prefs.profile === p)} ${c.t.profile[p]}`} onPress={() => act.profile(p)} />
          )),
        ),
        line(
          c.t.showShort,
          SECTIONS.map(s => <Button key={`show-${s}`} plain dimColor={!isShown(prefs, s)} label={`${check(isShown(prefs, s))} ${c.t.section[s]}`} onPress={() => act.toggle(s)} />),
        ),
      ])}
      {cat(
        'diario',
        'diario',
        c.t.diaryMode,
        [
          line(c.t.readsRow, [
            <Button key="diary-agrupado" plain dimColor={prefs.diary !== 'agrupado'} label={`${radio(prefs.diary === 'agrupado')} ${c.t.grouped}`} onPress={() => act.diary('agrupado')} />,
            <Button key="diary-separado" plain dimColor={prefs.diary !== 'separado'} label={`${radio(prefs.diary === 'separado')} ${c.t.separate}`} onPress={() => act.diary('separado')} />,
          ]),
        ],
        c.t.diaryHint,
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
