// O painel: objetivo, quests, grupo e inventário, o relatório fixo embaixo e o
// rodapé; mais as páginas ⚙ Configurações e ℹ Sobre.

import type { RenderElement } from 'claude-code'

import type { Campaign, Cls, GuardMode, Inventory, Member, ModuleId, Prefs, Profile, Quest, Section, Skin } from '../../../types'
import { CLASSES, classColor, crab, doneQuestsArt, itemIcon, linkIcon, objectiveArt, rarityColor, resourceBar } from '../../core/art'
import { isOn, isShown, MODULES, SECTIONS } from '../../core/prefs'
import type { Ctx } from '../../core/ui'
import { GITHUB_URL, LINKEDIN_URL, pxOf, svg, title, VERSION } from '../../core/ui'
import { questView } from './painel'

export type PaneData = {
  prefs: Prefs
  campaign: Campaign | null
  quests: readonly Quest[]
  party: readonly Member[]
  inventory: Inventory
  partyTab: 'grupo' | 'inventario'
  usage: { context?: number; mana?: number; manaAt: string; vigor?: number; vigorAt: string }
}

export type PaneActions = {
  tab: (tab: 'grupo' | 'inventario') => void
  joinParty: (joined: boolean) => void
  achieved: () => void
  compact: () => void
  grimoire: () => void
  sideQuest: () => void
  projects: () => void
  config: () => void
  about: () => void
}

/** O relatório entra já desenhado: é do módulo campanha. */
export const mainView = (c: Ctx, d: PaneData, act: PaneActions, report: RenderElement | null): RenderElement => {
  const { Box } = c.ui
  const show = (s: Section) => isShown(d.prefs, s)
  return (
    <Box flexDirection="column" gap={1}>
      {show('objetivo') && objectiveSection(c, d.campaign, act)}
      {show('quests') && questSection(c, d.quests)}
      {partySections(c, d, act)}
      <Box key="spacer" flexGrow={1} />
      {show('relatorio') && report}
      {show('rodape') && footer(c, d, act)}
    </Box>
  )
}

const objectiveSection = (c: Ctx, campaign: Campaign | null, act: PaneActions) => {
  const { Box, Button, Text } = c.ui
  const objective = campaign?.objective ?? ''
  return (
    <Box key="objetivo" flexDirection="column" alignItems={c.skin === 'epico' ? 'center' : 'flex-start'}>
      {title(c, c.t.section.objetivo, campaign?.achieved === true ? '?' : undefined)}
      {objective === '' ? (
        <Text dimColor>{c.t.noObjective}</Text>
      ) : c.desktop ? (
        svg(c.ui, true, objectiveArt(objective, c.palette, c.skin, pxOf(c)), 'objective')
      ) : (
        <Text wrap="wrap">{objective}</Text>
      )}
      {campaign !== null &&
        (campaign.achieved ? (
          <Text color="success">{c.t.achieved}</Text>
        ) : (
          <Button key="achieved" plain dimColor label={`☐ ${c.t.markAchieved}`} onPress={act.achieved} />
        ))}
    </Box>
  )
}

const questSection = (c: Ctx, quests: readonly Quest[]) => {
  const { Box, Text } = c.ui
  const q = questView(quests)
  return (
    <Box key="quests" flexDirection="column">
      {title(c, c.t.section.quests, q.current === undefined && q.done.length > 0 ? '?' : '!')}
      {quests.length === 0 && <Text dimColor>{c.t.noQuests}</Text>}
      {q.done.length > 0 &&
        (c.desktop ? (
          svg(c.ui, true, doneQuestsArt(q.done.map(x => x.title), c.palette), 'done-quests')
        ) : (
          <Text color="success">{'✓'.repeat(Math.min(12, q.done.length))}</Text>
        ))}
      {q.current !== undefined && (
        <Text bold color="warning" wrap="wrap">
          ! {q.current.title}
        </Text>
      )}
      {q.next.map(n => (
        <Text key={`next-${n.id}`} dimColor wrap="truncate-end">
          · {n.title}
        </Text>
      ))}
      {q.mist > 0 && <Text dimColor>{c.t.questsMist(q.mist)}</Text>}
    </Box>
  )
}

const partySections = (c: Ctx, d: PaneData, act: PaneActions) => {
  const { Box, Button, Text } = c.ui
  const showParty = isShown(d.prefs, 'grupo')
  const showInv = isShown(d.prefs, 'inventario')
  if (!showParty && !showInv) return null
  if (d.prefs.partyJoined && showParty && showInv) {
    const on = d.partyTab
    return (
      <Box key="party" flexDirection="column">
        <Box flexDirection="row" gap={1} justifyContent={c.skin === 'epico' ? 'center' : 'flex-start'}>
          <Button
            key="tab-grupo"
            plain
            dimColor={on !== 'grupo'}
            label={`${on === 'grupo' ? '◆' : '◇'} ${c.t.section.grupo}`}
            onPress={() => act.tab('grupo')}
          />
          <Button
            key="tab-inventario"
            plain
            dimColor={on !== 'inventario'}
            label={`${on === 'inventario' ? '◆' : '◇'} ${c.t.section.inventario}`}
            onPress={() => act.tab('inventario')}
          />
          <Button key="split" plain label={c.t.split} onPress={() => act.joinParty(false)} />
        </Box>
        {on === 'grupo' ? partyBody(c, d.party) : inventoryBody(c, d.inventory)}
      </Box>
    )
  }
  return (
    <Box key="party" flexDirection="column" gap={1}>
      {showParty && (
        <Box flexDirection="column">
          {title(c, c.t.section.grupo)}
          {partyBody(c, d.party)}
        </Box>
      )}
      {showInv && (
        <Box flexDirection="column">
          {title(c, c.t.section.inventario)}
          {inventoryBody(c, d.inventory)}
        </Box>
      )}
      {showParty && showInv && <Button key="join" plain label={c.t.join} onPress={() => act.joinParty(true)} />}
    </Box>
  )
}

const partyBody = (c: Ctx, party: readonly Member[]) => {
  const { Box, Text } = c.ui
  const active = party.filter(m => m.status === 'run')
  const done = party.filter(m => m.status !== 'run')
  if (party.length === 0) return <Text dimColor>{c.t.noParty}</Text>
  return (
    <Box flexDirection="column">
      {active.map(m => (
        <Box key={`m-${m.id}`} flexDirection="row" gap={1} alignItems="center">
          {svg(c.ui, c.desktop, crab(m.cls, 38, c.palette, `${c.t.className[m.cls]} · ${m.description}`, true), `crab-${m.id}`)}
          <Box flexDirection="column">
            <Text bold color={classColor(m.cls, c.palette)}>
              {c.t.className[m.cls]}
            </Text>
            <Text dimColor wrap="truncate-end">
              {m.description}
            </Text>
          </Box>
        </Box>
      ))}
      {done.length > 0 && (
        <Box flexDirection="row" gap={1} flexWrap="wrap">
          <Text dimColor>{c.t.partyDone}:</Text>
          {done.slice(-8).map(m =>
            c.desktop ? (
              svg(c.ui, true, crab(m.cls, 22, c.palette, `${m.status === 'err' ? '✗' : '✓'} ${c.t.className[m.cls]} · ${m.description}`), `done-${m.id}`)
            ) : (
              <Text key={`done-${m.id}`} color={m.status === 'err' ? 'error' : 'success'}>
                {m.status === 'err' ? '✗' : '✓'} {c.t.className[m.cls]}
              </Text>
            ),
          )}
        </Box>
      )}
    </Box>
  )
}

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
  return (
    <Box flexDirection="column">
      <Text dimColor>⎇ {head}</Text>
      {inv.items.length === 0 && <Text dimColor>{c.t.clean}</Text>}
      {inv.items.slice(0, 12).map(item => {
        const tip = `${item.path} · ${c.t.rarity[item.rarity]}`
        const delta =
          item.added === undefined ? '' : ` +${item.added}${item.removed !== undefined && item.removed > 0 ? ` −${item.removed}` : ''}`
        return (
          <Box key={`i-${item.path}`} flexDirection="row" gap={1}>
            {svg(c.ui, c.desktop, itemIcon(item.path, item.rarity, c.palette, tip), `icon-${item.path}`)}
            <Text color={rarityColor(item.rarity, c.palette)} wrap="truncate-start">
              {item.path}
            </Text>
            {delta !== '' && <Text dimColor>{delta}</Text>}
          </Box>
        )
      })}
      {inv.items.length > 12 && <Text dimColor>+{inv.items.length - 12}</Text>}
    </Box>
  )
}

const footer = (c: Ctx, d: PaneData, act: PaneActions) => {
  const { Box, Button, Text } = c.ui
  const u = d.usage
  const mochila = u.context === undefined ? '—' : `${Math.round(u.context)}%`
  const mana = u.mana === undefined ? '—' : `${Math.round(u.mana)}%`
  const vigor = u.vigor === undefined ? '—' : `${Math.round(u.vigor)}%`
  const bar = (kind: 'mochila' | 'mana' | 'vigor', value: number | undefined, tip: string) =>
    svg(c.ui, c.desktop, resourceBar(kind, value === undefined ? undefined : value / 100, c.palette, tip), `bar-${kind}`)
  const on = (id: ModuleId) => isOn(d.prefs, id)
  return (
    <Box key="footer" flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1}>
      <Box flexDirection="row" gap={1} alignItems="center" flexWrap="wrap">
        {bar('mochila', u.context, c.t.mochilaTip(mochila))}
        <Button key="mochila" plain label={`${c.t.footer.mochila} ${mochila}`} onPress={act.compact} />
        {bar('mana', u.mana, c.t.manaTip(mana, u.manaAt))}
        <Text>
          {c.t.footer.mana} {mana}
          {u.manaAt === '' ? '' : ` · ${u.manaAt}`}
        </Text>
        {bar('vigor', u.vigor, c.t.vigorTip(vigor, u.vigorAt))}
        <Text>
          {c.t.footer.vigor} {vigor}
        </Text>
      </Box>
      <Box flexDirection="row" gap={1}>
        {on('grimorio') && <Button key="grimorio" plain label={c.t.grimoire} onPress={act.grimoire} />}
        {on('sideQuest') && <Button key="side-quest" plain label={c.t.sideQuest} onPress={act.sideQuest} />}
        {on('projetos') && <Button key="projects" plain label={c.t.projects} onPress={act.projects} />}
        <Box flexGrow={1} />
        <Button key="config" plain label={c.t.config} onPress={act.config} />
        <Button key="about" plain label={c.t.about} onPress={act.about} />
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
}

const radio = (on: boolean) => (on ? '◉' : '○')
const check = (on: boolean) => (on ? '☑' : '☐')

export const configView = (c: Ctx, prefs: Prefs, langOption: string, act: ConfigActions): RenderElement => {
  const { Box, Button, Text } = c.ui
  const row = (label: string, children: RenderElement[]) => (
    <Box key={`row-${label}`} flexDirection="column">
      <Text bold>{label}</Text>
      <Box flexDirection="row" gap={1} flexWrap="wrap">
        {children}
      </Box>
    </Box>
  )
  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="row" gap={1}>
        <Button key="back" plain label={c.t.back} onPress={act.back} />
        <Box flexGrow={1} />
        <Button key="setup-open" plain label={c.t.setupOpen} onPress={act.setup} />
      </Box>
      {title(c, c.t.configTitle)}
      {row(c.t.language, [
        <Button key="lang-auto" plain label={`${radio(langOption === 'auto')} ${c.t.langAuto}`} onPress={() => act.lang('auto')} />,
        <Button key="lang-pt" plain label={`${radio(langOption === 'pt-BR')} Português (Brasil)`} onPress={() => act.lang('pt-BR')} />,
        <Button key="lang-en" plain label={`${radio(langOption === 'en')} English`} onPress={() => act.lang('en')} />,
      ])}
      <Box key="modules" flexDirection="column">
        <Text bold>{c.t.modules}</Text>
        {MODULES.map(m => (
          <Box key={`mod-row-${m.id}`} flexDirection="row" gap={1}>
            <Button key={`mod-${m.id}`} plain label={`${check(isOn(prefs, m.id))} ${c.t.module[m.id][0]}`} onPress={() => act.module(m.id)} />
            <Text dimColor wrap="truncate-end">
              {c.t.module[m.id][1]}
              {m.tokens ? ` · ${c.t.tokens}` : ''}
            </Text>
          </Box>
        ))}
      </Box>
      {row(c.t.skin, [
        <Button key="skin-epico" plain label={`${radio(c.skin === 'epico')} ${c.t.skinEpico}`} onPress={() => act.skin('epico')} />,
        <Button key="skin-sobrio" plain label={`${radio(c.skin === 'sobrio')} ${c.t.skinSobrio}`} onPress={() => act.skin('sobrio')} />,
      ])}
      {row(
        c.t.profileTitle,
        (['completo', 'foco', 'minimo', 'personalizado'] as const).map(p => (
          <Button key={`profile-${p}`} plain label={`${radio(prefs.profile === p)} ${c.t.profile[p]}`} onPress={() => act.profile(p)} />
        )),
      )}
      {row(
        c.t.show,
        SECTIONS.map(s => (
          <Button key={`show-${s}`} plain label={`${check(isShown(prefs, s))} ${c.t.section[s]}`} onPress={() => act.toggle(s)} />
        )),
      )}
      {row(c.t.diaryMode, [
        <Button key="diary-agrupado" plain label={`${radio(prefs.diary === 'agrupado')} ${c.t.grouped}`} onPress={() => act.diary('agrupado')} />,
        <Button key="diary-separado" plain label={`${radio(prefs.diary === 'separado')} ${c.t.separate}`} onPress={() => act.diary('separado')} />,
      ])}
      <Text dimColor wrap="wrap">
        {c.t.diaryHint}
      </Text>
      {row(
        c.t.guardMode,
        (['dialogo', 'chefe', 'nativo'] as const).map(mode => (
          <Button key={`guard-${mode}`} plain label={`${radio(prefs.guardMode === mode)} ${c.t.guardModes[mode]}`} onPress={() => act.guard(mode)} />
        )),
      )}
      <Text dimColor wrap="wrap">
        {c.t.guardHint}
      </Text>
      <Box flexDirection="row" gap={1}>
        <Button key="haiku" plain label={`${check(prefs.grimorioHaiku)} ${c.t.haiku}`} onPress={act.haiku} />
        <Text dimColor>· {c.t.tokens}</Text>
      </Box>
    </Box>
  )
}

// ---------- Sobre ----------

export const aboutView = (c: Ctx, back: () => void): RenderElement => {
  const { Box, Button, Text, Link } = c.ui
  const links: { kind: 'linkedin' | 'github'; href: string; label: string }[] = [
    { kind: 'linkedin' as const, href: LINKEDIN_URL, label: c.t.linkedin },
    { kind: 'github' as const, href: GITHUB_URL, label: c.t.github },
  ].filter(l => l.href !== '')
  return (
    <Box flexDirection="column" gap={1}>
      <Button key="back" plain label={c.t.back} onPress={back} />
      {title(c, c.t.aboutTitle)}
      {c.desktop && (
        <Box flexDirection="row" gap={1} justifyContent="center" flexWrap="wrap">
          {CLASSES.map((cls: Cls) => svg(c.ui, true, crab(cls, 30, c.palette, c.t.className[cls]), `about-${cls}`))}
        </Box>
      )}
      {c.t.aboutBody.map((p, i) => (
        <Text key={`p-${i}`} wrap="wrap">
          {p}
        </Text>
      ))}
      {links.map(l => (
        <Box key={`link-${l.kind}`} flexDirection="row" gap={1} alignItems="center">
          {svg(c.ui, c.desktop, linkIcon(l.kind, c.palette, l.label), `icon-${l.kind}`)}
          <Link href={l.href}>{l.label}</Link>
        </Box>
      ))}
      <Text dimColor wrap="wrap">
        {c.t.credits}
      </Text>
      <Text dimColor>clawd-hud · {c.t.version(VERSION)}</Text>
    </Box>
  )
}
