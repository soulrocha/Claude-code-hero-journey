// Diário de bordo, enxuto: o pet de 28 px com o trilho na cor da classe, a linha
// do próprio app e o resultado em símbolo + texto curto. Vale durante o turno: no
// fim, o app desktop recolhe as linhas em "Executado N ações", e o recibo fica.
// Padrão de embrulhar o ToolUse e medir o tempo: tool-timing-badge, de Daniel
// Ávila (claude-code-templates, MIT) — https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/ui/tool-timing-badge

import type { RenderElement } from 'claude-code'

import type { DiaryEntry } from '../../../types'
import { diaryPet, pillOutline, statusColor } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { svg } from '../../core/ui'

/** O texto curto ao lado do símbolo: "novo", "+12 −3", "falhou", "em execução" ou o tempo. */
const resultWords = (c: Ctx, entry: Pick<DiaryEntry, 'status' | 'ms' | 'added' | 'removed' | 'isNew'>) => {
  if (entry.status === 'run') return c.t.running
  if (entry.status === 'err') return c.t.failedShort
  if (entry.isNew === true) return c.t.isNew
  if (entry.added !== undefined && entry.added + (entry.removed ?? 0) > 0) return `+${entry.added} −${entry.removed ?? 0}`
  if (entry.ms !== undefined && entry.ms >= 1000) return `${(entry.ms / 1000).toFixed(1)}s`
  return ''
}

export const rowView = (
  c: Ctx,
  entry: Pick<DiaryEntry, 'cls' | 'status' | 'summary' | 'ms' | 'added' | 'removed' | 'isNew'>,
  row: RenderElement,
): RenderElement => {
  const { Box, Text } = c.ui
  const name = c.t.className[entry.cls]
  const words = resultWords(c, entry)
  const color = statusColor(entry.status, c.palette)
  if (!c.desktop) {
    return (
      <Box flexDirection="row" gap={1}>
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          {row}
        </Box>
        <Text color={color}>{`${entry.status === 'run' ? '…' : entry.status === 'err' ? '✗' : '✓'}${words === '' ? '' : ` ${words}`}`}</Text>
      </Box>
    )
  }
  return (
    <Box flexDirection="row" gap={1} alignItems="center">
      {svg(c, diaryPet(entry.cls, entry.status, `${name} · ${entry.summary}`, c.palette), 'mark')}
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        {row}
      </Box>
      {svg(c, pillOutline(entry.status, entry.status === 'run' ? '' : words, c.palette), 'pill')}
    </Box>
  )
}
