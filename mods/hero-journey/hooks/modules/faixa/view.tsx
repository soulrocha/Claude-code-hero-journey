// Faixa acima do prompt, enxuta: o pet (com o acessório enquanto trabalha), o
// item na mão (o arquivo em uso, na cor da raridade), a ação curta e o objetivo
// em miniatura. O ◈ no canto abre e fecha o painel sem mover nada. Nunca
// repete o pedido da pessoa.

import type { RenderElement } from 'claude-code'

import type { Campaign, Member, Quest, Working } from '../../../types'
import { bandArt, classColor } from '../../core/art'
import type { Step } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { svg } from '../../core/ui'
import { humanType } from '../../core/classes'
import { questView, rarityOf } from '../painel/painel'

/**
 * Os passos da campanha: as quests (tarefas do Claude) ou, sem elas, os capítulos.
 * Capítulo fechado (com relatório) é passo feito; o último aberto é o atual.
 */
export const campaignSteps = (c: Campaign | null, quests: readonly Quest[], chapterName: (n: number) => string): Step[] => {
  if (quests.length > 0) return stepsOf(quests)
  const chapters = c?.chapters ?? []
  const lastOpen = [...chapters].reverse().find(ch => ch.report === undefined)
  return chapters.map(ch => ({
    name: ch.report?.mission ?? chapterName(ch.n),
    state: ch.report !== undefined ? 'done' : ch === lastOpen ? 'now' : 'next',
  }))
}

export const stepsOf = (quests: readonly Quest[]): Step[] => {
  const current = questView(quests).current
  return quests.map(q => ({
    name: q.title,
    state: q.status === 'completed' ? 'done' : q === current ? 'now' : 'next',
  }))
}

/**
 * `away`: subagentes rodando em segundo plano. Com o Claude parado e alguém em
 * expedição, a faixa diz isso (nada de "Pronto" falso) e o tooltip lista cada um.
 */
export const bandView = (
  c: Ctx,
  now: Working | null,
  quests: readonly Quest[],
  campaign: Campaign | null,
  toggle: () => void,
  away: readonly Member[] = [],
  intent = '',
  /** O selo de um recurso em alerta ("🎒 Mochila 92%"), ao lado do ◈; só aparece quando importa. */
  alert?: string,
): RenderElement => {
  const { Box, Button, Text } = c.ui
  const name = now ? c.t.className[now.cls] : ''
  const awayName = (m: Member) => humanType(m.type, c.t.knownTypes) || c.t.className[m.cls]
  const idle = away.length > 0 ? c.t.expedition(away.length, awayName(away[0] as Member)) : c.t.bandIdle
  const idleTip = away.length > 0 ? c.t.expeditionTip(away.map(m => `${awayName(m)} (${c.t.className[m.cls]}) — ${m.description}`)) : undefined
  if (!c.desktop) {
    // Terminal: uma linha só, sem Svg.
    const goal = quests.length > 0 ? `${quests.filter(q => q.status === 'completed').length}/${quests.length}` : ''
    return (
      <Box key="band" flexDirection="row" gap={1}>
        {now ? (
          <Text bold color={classColor(now.cls, c.palette)}>
            {name}
          </Text>
        ) : (
          <Text dimColor>{idle}</Text>
        )}
        {now && (
          <Text dimColor wrap="truncate-end">
            · {now.summary}
          </Text>
        )}
        <Box flexGrow={1} />
        {alert !== undefined && <Text color="warning">{alert}</Text>}
        {goal !== '' && <Text dimColor>{goal}</Text>}
      </Box>
    )
  }
  // Nunca o texto do pedido: o passo atual (quest) ou o capítulo, com a trilha deles.
  const steps = campaignSteps(campaign, quests, c.t.chapter)
  const done = steps.filter(s => s.state === 'done').length
  const now$ = steps.find(s => s.state === 'now')
  const byQuests = quests.length > 0
  const chapters = campaign?.chapters.length ?? 0
  // Sem objetivo de verdade (nenhuma quest e um capítulo só), o bloco some e libera a faixa.
  const goal =
    steps.length === 0 || (!byQuests && steps.length < 2)
      ? null
      : {
          label: byQuests ? `${done}/${steps.length}` : c.t.chapterShort(Math.max(1, chapters)),
          current: now$ === undefined || now$.name === c.t.chapter(chapters) ? '' : now$.name,
          tip: now$ ? `${byQuests ? c.t.bandStep(Math.min(done + 1, steps.length), steps.length) : c.t.chapter(chapters)}: ${now$.name}` : c.t.chapter(chapters),
          // Todas as etapas: a arte conta todas e desenha só os 12 losangos mais recentes.
          steps,
        }
  const w = Math.max(160, Math.round(c.width * 7.6))
  // A raridade olha só o fim do caminho: uma pasta-ancestral "api" não torna tudo raro.
  const tail = now?.file?.split(/[\\/]/).slice(-3).join('/')
  const art = bandArt(
    w,
    // A ação: a frase que o Claude narrou antes das ferramentas (briefing de bordo) ou o resumo da ferramenta.
    now ? { cls: now.cls, name, text: intent !== '' ? intent : now.summary, file: tail, rarity: tail === undefined ? undefined : rarityOf(tail) } : null,
    idle,
    goal,
    c.palette,
    26,
    idleTip,
  )
  return (
    <Box key="band" flexDirection="row">
      {svg(c, art, 'band-art')}
      <Box position="absolute" top={0} right={0} flexDirection="row" columnGap={1} alignItems="center">
        {alert !== undefined && <Button key="hero-alert" plain label={alert} onPress={toggle} />}
        <Button key="hero-toggle" plain dimColor label="◈" onPress={toggle} />
      </Box>
    </Box>
  )
}
