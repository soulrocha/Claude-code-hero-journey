// Guarda: o que vai acima do diálogo do Claude. Um encontro épico: a cabeça do
// dragão cuspindo fogo, o aviso de arquivo crítico e a mudança antes da escolha.

import type { RenderElement } from 'claude-code'

import type { GuardFile } from '../../../types'
import { dragonArt } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { svg } from '../../core/ui'

/** Os dois últimos pedaços do caminho: "config/.env.homologacao". */
const shortPath = (path: string) => path.replace(/\\/g, '/').split('/').filter(Boolean).slice(-2).join('/')

export const guardView = (c: Ctx, files: readonly GuardFile[]): RenderElement => {
  const { Box, Text, Code } = c.ui
  const names = files.map(f => f.name).join(', ')
  if (!c.desktop) {
    const list = files.map(f => `${f.name} +${f.added}${f.removed > 0 ? ` −${f.removed}` : ''}`).join(' · ')
    return <Text color="warning">🔒 {list}</Text>
  }
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="warning" paddingX={1} gap={1}>
      <Box flexDirection="row" columnGap={2} alignItems="center">
        {svg(c, dragonArt(c.t.guardTitle(names)), 'dragao')}
        <Box flexDirection="column" flexShrink={1}>
          <Text bold color="warning" wrap="wrap">
            {c.t.guardTitle(names)}
          </Text>
          <Text dimColor wrap="wrap">
            {c.t.guardSub}
          </Text>
        </Box>
      </Box>
      {files.map(f => (
        <Box key={`guard-${f.path}`} flexDirection="column">
          <Box flexDirection="row" columnGap={1}>
            <Text bold>{f.name}</Text>
            {f.added > 0 && <Text color="success">+{f.added}</Text>}
            {f.removed > 0 && <Text color="error">−{f.removed}</Text>}
            <Box flexGrow={1} />
            <Text dimColor wrap="truncate-start">
              {shortPath(f.path)}
            </Text>
          </Box>
          <Code key={`diff-${f.path}`} source={f.diff} format="diff" path={f.name} />
        </Box>
      ))}
    </Box>
  )
}
