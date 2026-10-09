// Diário de bordo: a linha de cada ferramenta e a cabeça de um grupo recolhido.

import type { RenderElement } from 'claude-code'

import type { DiaryEntry } from '../../../types'
import { classColor, diaryMark, TONE } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { svg } from '../../core/ui'
import { groupStats } from './diario'

/** O chip de resultado à direita da linha, como na demo: borda e texto na mesma cor. */
const chip = (c: Ctx, key: string, text: string, color: string) => {
  const { Box, Text } = c.ui
  if (!c.desktop) return <Text key={key} color={color}>{text}</Text>
  return (
    <Box key={key} borderStyle="round" borderColor={color} paddingX={1}>
      <Text color={color}>{text}</Text>
    </Box>
  )
}

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
  const t = TONE[c.palette]
  return (
    <Box flexDirection="row" gap={1} alignItems="center">
      {svg(c, diaryMark(cls, c.palette, tip, s.failed > 0 ? 'err' : 'ok'), 'mark')}
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        <Box flexDirection="row" gap={1}>
          <Text color={classColor(cls, c.palette)} bold>
            {c.t.className[cls]}
          </Text>
          <Text color={s.failed > 0 ? t.bad : undefined}>· {parts.join(' · ')}</Text>
        </Box>
        <Text dimColor>{c.t.splitHint}</Text>
      </Box>
      {chip(c, 'chip', `${s.count - s.failed}/${s.count}`, s.failed > 0 ? t.bad : t.ok)}
      <Button key={`split-${first?.group ?? ''}`} label={`${c.t.expandGroup} ▾`} onPress={split} />
    </Box>
  )
}

export const rowView = (
  c: Ctx,
  entry: Pick<DiaryEntry, 'cls' | 'status' | 'summary' | 'ms' | 'added' | 'removed' | 'isNew'>,
  row: RenderElement,
): RenderElement => {
  const { Box, Text } = c.ui
  const t = TONE[c.palette]
  const name = c.t.className[entry.cls]
  const parts: string[] = []
  if (entry.isNew === true) parts.push(c.t.isNew)
  if (entry.added !== undefined && entry.added + (entry.removed ?? 0) > 0) parts.push(`+${entry.added} −${entry.removed ?? 0}`)
  if (entry.ms !== undefined && entry.ms >= 1000) parts.push(`${(entry.ms / 1000).toFixed(1)}s`)
  const running = entry.status === 'run'
  const label =
    running ? `${c.t.running}…` : `${entry.status === 'err' ? '✗' : '✓'}${parts.length > 0 ? ` ${parts.join(' · ')}` : ''}`
  const color = running ? classColor('druida', c.palette) : entry.status === 'err' ? t.bad : t.ok
  return (
    <Box
      flexDirection="row"
      gap={1}
      alignItems="center"
      backgroundColor={running && c.desktop ? t.card : undefined}
    >
      {svg(c, diaryMark(entry.cls, c.palette, `${name} · ${entry.summary}`, entry.status), 'mark')}
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        {running && (
          <Text bold color={classColor(entry.cls, c.palette)}>
            {name}
          </Text>
        )}
        {row}
      </Box>
      {chip(c, 'chip', label, color)}
    </Box>
  )
}
