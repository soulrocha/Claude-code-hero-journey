// Guarda: o que vai acima do diálogo do Claude. No modo diálogo, a linha com
// os ícones e os nomes dos arquivos; no modo chefe, o Guardião do Cofre com os
// diffs lado a lado.

import type { RenderElement } from 'claude-code'

import type { GuardFile } from '../../../types'
import { guardLine, itemIcon, mimic } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { svg } from '../../core/ui'

export const guardLineView = (c: Ctx, files: readonly GuardFile[]): RenderElement => {
  const { Box, Text } = c.ui
  if (!c.desktop) {
    const names = files.map(f => `${f.name} +${f.added}${f.removed > 0 ? ` −${f.removed}` : ''}`).join(' · ')
    return <Text color="warning">🔒 {names}</Text>
  }
  return <Box>{svg(c, guardLine(files, c.palette, name => c.t.guardNotice(name)), 'guard-line')}</Box>
}

export const bossView = (c: Ctx, files: readonly GuardFile[]): RenderElement => {
  const { Box, Text, Code } = c.ui
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="warning" paddingX={1} gap={1}>
      <Box flexDirection="row" gap={2} alignItems="center">
        {svg(c, mimic(c.palette, c.t.bossTitle), 'mimic')}
        <Box flexDirection="column">
          <Text bold color="warning">
            ⚔ {c.t.bossTitle}
          </Text>
          <Text dimColor>{c.t.bossSubtitle}</Text>
        </Box>
      </Box>
      <Box flexDirection="row" gap={2} flexWrap="wrap">
        {files.map(f => (
          <Box key={`boss-${f.path}`} flexDirection="column" flexGrow={1}>
            <Box flexDirection="row" gap={1}>
              {svg(c, itemIcon(f.name, 'lendario', c.palette, f.name), `boss-icon-${f.path}`)}
              <Text bold>{f.name}</Text>
              <Text color="success">+{f.added}</Text>
              {f.removed > 0 && <Text color="error">−{f.removed}</Text>}
            </Box>
            <Code key={`diff-${f.path}`} source={f.diff} format="diff" path={f.name} />
          </Box>
        ))}
      </Box>
    </Box>
  )
}
