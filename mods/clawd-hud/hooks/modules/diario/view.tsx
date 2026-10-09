// Diário de bordo: a linha de cada ferramenta e a cabeça de um grupo recolhido.

import type { RenderElement } from 'claude-code'

import type { DiaryEntry } from '../../../types'
import { classColor, diaryMark, TONE } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { svg } from '../../core/ui'
import { groupStats } from './diario'

export const groupHeadView = (c: Ctx, entries: readonly DiaryEntry[], split: () => void): RenderElement => {
  const { Box, Button, Text } = c.ui
  const first = entries[0]
  const cls = first?.cls ?? 'druida'
  const s = groupStats(entries)
  const parts = [c.t.actions(s.count)]
  if (s.created > 0) parts.push(`✓ ${c.t.isNew}${s.created > 1 ? ` ×${s.created}` : ''}`)
  if (s.added + s.removed > 0) parts.push(`✓ +${s.added} −${s.removed}`)
  if (s.failed > 0) parts.push(`✗ ${c.t.failed(s.failed)}`)
  const tip = `${c.t.className[cls]} · ${parts.join(' · ')}`
  return (
    <Box flexDirection="row" gap={1} alignItems="center">
      {svg(c.ui, c.desktop, diaryMark(cls, c.palette, tip, s.failed > 0 ? 'err' : 'ok'), 'mark')}
      <Text color={classColor(cls, c.palette)} bold>
        {c.t.className[cls]}
      </Text>
      <Text color={s.failed > 0 ? TONE[c.palette].bad : undefined}>· {parts.join(' · ')}</Text>
      <Button key={`split-${first?.group ?? ''}`} plain dimColor label={`${c.t.expandGroup} ›`} onPress={split} />
    </Box>
  )
}

export const rowView = (
  c: Ctx,
  entry: Pick<DiaryEntry, 'cls' | 'status' | 'summary' | 'ms' | 'added' | 'removed' | 'isNew'>,
  row: RenderElement,
): RenderElement => {
  const { Box, Text } = c.ui
  const name = c.t.className[entry.cls]
  const chips: string[] = []
  if (entry.status === 'ok') chips.push('✓')
  if (entry.status === 'err') chips.push('✗')
  if (entry.isNew === true) chips.push(c.t.isNew)
  if (entry.added !== undefined && entry.added + (entry.removed ?? 0) > 0) chips.push(`+${entry.added} −${entry.removed ?? 0}`)
  if (entry.ms !== undefined && entry.ms >= 1000) chips.push(`${(entry.ms / 1000).toFixed(1)}s`)
  return (
    <Box flexDirection="row" gap={1}>
      {svg(c.ui, c.desktop, diaryMark(entry.cls, c.palette, `${name} · ${entry.summary}`, entry.status), 'mark')}
      <Box flexDirection="column" flexGrow={1}>
        {entry.status === 'run' && (
          <Text bold color={classColor(entry.cls, c.palette)}>
            {name} · {c.t.running}
          </Text>
        )}
        {row}
      </Box>
      {chips.length > 0 && <Text color={entry.status === 'err' ? 'error' : 'subtle'}>{chips.join(' · ')}</Text>}
    </Box>
  )
}
