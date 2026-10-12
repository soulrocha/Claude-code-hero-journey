// Diário de bordo, enxuto: o pet da classe com 44 px de altura (na falha, a pose de falha), quem
// age e o quê, e o resultado em texto curto + símbolo, sem contorno. Vale durante o turno: no
// fim, o app desktop recolhe as linhas em "Executado N ações", e o recibo fica.
// Padrão de embrulhar o ToolUse e medir o tempo: tool-timing-badge, de Daniel
// Ávila (claude-code-templates, MIT) — https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/ui/tool-timing-badge

import type { RenderElement } from 'claude-code'

import type { DiaryEntry } from '../../../types'
import { classColor, diaryPet, spinRing, statusColor } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { svg } from '../../core/ui'

/** O texto curto ao lado do símbolo: "novo", "+12 −3", "falhou", "em execução" ou o tempo. */
const resultWords = (c: Ctx, entry: Pick<DiaryEntry, 'status' | 'ms' | 'added' | 'removed' | 'isNew'>) => {
  if (entry.status === 'run') return ''
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
  // A linha é do mod (sem o trilho do app): o Clawd grande, quem age e o quê, e o resultado
  // à direita com o símbolo por último, para os símbolos ficarem alinhados na mesma coluna.
  return (
    <Box flexDirection="row" columnGap={1} alignItems="center">
      {svg(c, diaryPet(entry.cls, entry.status, `${name} · ${entry.summary}`), 'mark')}
      <Box flexDirection="row" columnGap={1} flexGrow={1} flexShrink={1}>
        <Text bold color={entry.status === 'err' ? color : classColor(entry.cls, c.palette)}>
          {name}
        </Text>
        <Text wrap="truncate-end">{entry.summary}</Text>
      </Box>
      <Box flexDirection="row" columnGap={1} flexShrink={0} alignItems="center">
        {words !== '' && (
          <Text color={entry.status === 'err' ? color : undefined} dimColor={entry.status !== 'err'}>
            {words}
          </Text>
        )}
        {entry.status === 'run' ? (
          svg(c, spinRing(color, c.t.running), 'ring')
        ) : (
          <Text bold color={color}>
            {entry.status === 'err' ? '✗' : '✓'}
          </Text>
        )}
      </Box>
    </Box>
  )
}
