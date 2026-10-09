// Faixa acima do prompt: um cartão na cor da classe, com o Clawd e o acessório
// animado, a classe e o que ela faz, e a intenção que o Claude narrou antes das
// ferramentas (ou, sem ela, o objetivo da campanha). Some quando o turno termina.

import type { RenderElement } from 'claude-code'

import type { Working } from '../../../types'
import { classColor, crab, TONE } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { svg } from '../../core/ui'

export const bandView = (c: Ctx, now: Working, intent: string, objective: string): RenderElement => {
  const second = intent !== '' ? intent : objective
  const { Box, Text } = c.ui
  const name = c.t.className[now.cls]
  const color = classColor(now.cls, c.palette)
  return (
    <Box
      key="band"
      flexDirection="row"
      gap={2}
      alignItems="center"
      paddingX={c.desktop ? 1 : 0}
      borderStyle={c.desktop ? 'round' : undefined}
      borderColor={c.desktop ? color : undefined}
      backgroundColor={c.desktop ? TONE[c.palette].card : undefined}
    >
      {svg(c, crab(now.cls, 72, c.palette, `${name} · ${now.summary}`, true), 'band-crab')}
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        <Box flexDirection="row" gap={1}>
          <Text bold color={color}>
            {name}
          </Text>
          <Text dimColor wrap="truncate-end">
            · {now.summary}
          </Text>
        </Box>
        {second !== '' && <Text wrap="wrap">{second}</Text>}
      </Box>
    </Box>
  )
}
