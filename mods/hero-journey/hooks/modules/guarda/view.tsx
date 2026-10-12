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
    // Terminal: o motor só aceita 12 linhas em volta do diálogo e recusa ali o Raster (as células contam
    // como texto). O dragão vira 🐉 na linha do aviso; embaixo, os arquivos e até 4 linhas da mudança.
    const changed = files.flatMap(f => f.diff.split('\n').filter(l => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l)))
    const shown = changed.slice(0, changed.length > 4 ? 3 : 4)
    return (
      <Box flexDirection="column">
        <Box flexDirection="column">
          <Text bold color="warning" wrap="truncate-end">
            🐉 {c.t.guardTitle(names)}
          </Text>
          <Box flexDirection="column" paddingLeft={3}>
            {files.slice(0, 2).map(f => (
              <Box key={`guard-${f.path}`} flexDirection="row" columnGap={1}>
                <Text bold>{f.name}</Text>
                {f.added > 0 && <Text color="success">+{f.added}</Text>}
                {f.removed > 0 && <Text color="error">−{f.removed}</Text>}
                <Text dimColor wrap="truncate-start">
                  {shortPath(f.path)}
                </Text>
              </Box>
            ))}
            {shown.map((l, i) => (
              <Text key={`guard-l${i}`} color={l.startsWith('+') ? 'success' : 'error'} wrap="truncate-end">
                {l}
              </Text>
            ))}
            {changed.length > shown.length && <Text dimColor>{`+${changed.length - shown.length} …`}</Text>}
          </Box>
        </Box>
      </Box>
    )
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
