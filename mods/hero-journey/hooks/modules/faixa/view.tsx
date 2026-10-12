// Faixa acima do prompt, em uma linha: o pet da classe, quem age, o arquivo em
// uso (na cor da raridade) ou o que a ferramenta faz, e à direita o selo de
// alerta e a trilha do plano. O "Painel ›" no canto abre e fecha o painel. Nunca repete
// o pedido da pessoa nem a frase que o Claude escreveu no chat.

import type { RenderElement } from 'claude-code'

import type { Member, Quest, Working } from '../../../types'
import { classColor, petArt, rarityTone, toneOf, trailArt } from '../../core/art'
import type { Step } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { svg } from '../../core/ui'
import { humanType } from '../../core/classes'
import { questView, rarityOf } from '../painel/painel'

/** Os passos do plano: as tarefas do Claude, com a primeira em aberto como a atual. */
export const stepsOf = (quests: readonly Quest[]): Step[] => {
  const current = questView(quests).current
  return quests.map(q => ({
    name: q.title,
    state: q.status === 'completed' ? 'done' : q === current ? 'now' : 'next',
  }))
}

/** Os dois últimos pedaços do caminho: "painel/view.tsx". */
const shortPath = (path: string) => path.split(/[\\/]/).filter(Boolean).slice(-2).join('/')

/**
 * `away`: subagentes rodando em segundo plano. Com o Claude parado e alguém em
 * expedição, a faixa diz isso (nada de "Pronto" falso) e o tooltip lista cada um.
 * `failed`: a última ferramenta do turno falhou (o pet tropeça).
 */
export const bandView = (
  c: Ctx,
  now: Working | null,
  quests: readonly Quest[],
  toggle: () => void,
  away: readonly Member[] = [],
  /** O selo de um recurso em alerta ("🎒 Mochila 92%"), ao lado do ◈; só aparece quando importa. */
  alert?: string,
  failed = false,
): RenderElement => {
  const { Box, Button, Text } = c.ui
  const k = toneOf(c.palette)
  const name = now ? c.t.className[now.cls] : ''
  const awayName = (m: Member) => humanType(m.type, c.t.knownTypes) || c.t.className[m.cls]
  const idle = away.length > 0 ? c.t.expedition(away.length, awayName(away[0] as Member)) : c.t.yourTurn
  const idleTip = away.length > 0 ? c.t.expeditionTip(away.map(m => `${awayName(m)} (${c.t.className[m.cls]}) — ${m.description}`)) : idle
  // Só com um plano de verdade (2 tarefas ou mais): a trilha e o placar.
  const steps = quests.length >= 2 ? stepsOf(quests) : []
  const done = steps.filter(s => s.state === 'done').length
  const current = steps.find(s => s.state === 'now')
  const file = now?.file === undefined ? undefined : shortPath(now.file)
  if (!c.desktop) {
    // Terminal: a mesma linha, sem Svg.
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
            · {file ?? now.summary}
          </Text>
        )}
        <Box flexGrow={1} />
        {alert !== undefined && <Text color="warning">{alert}</Text>}
        {steps.length > 0 && <Text dimColor>{`${done}/${steps.length}`}</Text>}
      </Box>
    )
  }
  const pet = now
    ? petArt(now.cls, failed ? 'fail' : 'work', 40, `${name} · ${now.summary}`)
    : petArt('aprendiz', 'idle', 40, idleTip)
  const tip = current === undefined ? `${done}/${steps.length}` : `${c.t.bandStep(Math.min(done + 1, steps.length), steps.length)}: ${current.name}`
  return (
    <Box key="band" flexDirection="row" columnGap={1} alignItems="center">
      {svg(c, pet, 'band-pet')}
      {now ? (
        <Box flexDirection="row" columnGap={1} flexShrink={1}>
          <Text bold color={failed ? k.bad : classColor(now.cls, c.palette)}>
            {name}
          </Text>
          {file !== undefined ? (
            <Text color={rarityTone(rarityOf(file), c.palette)} wrap="truncate-end">
              {file}
            </Text>
          ) : (
            <Text dimColor wrap="truncate-end">
              {now.summary}
            </Text>
          )}
        </Box>
      ) : (
        <Text color={away.length > 0 ? 'warning' : undefined} dimColor={away.length === 0} wrap="truncate-end">
          {idle}
        </Text>
      )}
      <Box flexGrow={1} />
      {alert !== undefined && <Button key="hero-alert" plain label={alert} onPress={toggle} />}
      {steps.length > 0 && svg(c, trailArt(steps.length, done, c.palette, tip), 'band-trail')}
      {steps.length > 0 && <Text dimColor>{`${done}/${steps.length}`}</Text>}
      <Button key="hero-toggle" plain dimColor label={c.t.panelToggle} onPress={toggle} />
    </Box>
  )
}
