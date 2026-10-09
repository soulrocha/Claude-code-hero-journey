// Faixa acima do prompt: o Clawd de 90 px com o acessório animado, a classe e o
// que ela faz, e a intenção que o Claude narrou antes das ferramentas (ou, sem
// ela, o objetivo da campanha). Some quando o turno termina.

import type { RenderElement } from 'claude-code'

import type { Working } from '../../../types'
import { classColor, crab } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { svg } from '../../core/ui'

export const bandView = (c: Ctx, now: Working, intent: string, objective: string): RenderElement => {
  const second = intent !== '' ? intent : objective
  const { Box, Text } = c.ui
  const name = c.t.className[now.cls]
  return (
    <Box key="band" flexDirection="row" gap={2} alignItems="center">
      {svg(c.ui, c.desktop, crab(now.cls, 90, c.palette, `${name} · ${now.summary}`, true), 'band-crab')}
      <Box flexDirection="column" flexGrow={1}>
        <Text bold color={classColor(now.cls, c.palette)} wrap="truncate-end">
          {name} · {now.summary}
        </Text>
        {second !== '' && (
          <Text dimColor wrap="wrap">
            {second}
          </Text>
        )}
      </Box>
    </Box>
  )
}
