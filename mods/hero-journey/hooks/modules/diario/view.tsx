// Diário de bordo, enxuto: o pet de 28 px com o trilho na cor da classe, a linha
// do próprio app e o resultado em símbolo + texto curto, sem pílula. Um grupo
// recolhido é uma linha só: "Mago · 3 ações ✓ 3 · Separar ▾".

import type { RenderElement } from 'claude-code'

import type { DiaryEntry } from '../../../types'
import { classColor } from '../../core/art'
import { diaryPet, pillOutline, statusColor } from '../../core/hero-art'
import type { Ctx } from '../../core/ui'
import { svg } from '../../core/ui'
import { groupStats } from './diario'

/** O texto curto ao lado do símbolo: "novo", "+12 −3", "falhou", "em execução" ou o tempo. */
export const resultWords = (c: Ctx, entry: Pick<DiaryEntry, 'status' | 'ms' | 'added' | 'removed' | 'isNew'>) => {
  if (entry.status === 'run') return c.t.running
  if (entry.status === 'err') return c.t.failedShort
  if (entry.isNew === true) return c.t.isNew
  if (entry.added !== undefined && entry.added + (entry.removed ?? 0) > 0) return `+${entry.added} −${entry.removed ?? 0}`
  if (entry.ms !== undefined && entry.ms >= 1000) return `${(entry.ms / 1000).toFixed(1)}s`
  return ''
}

export const groupHeadView = (c: Ctx, entries: readonly DiaryEntry[], split: () => void): RenderElement => {
  const { Box, Button, Text } = c.ui
  const first = entries[0]
  const cls = first?.cls ?? 'druida'
  const s = groupStats(entries)
  const state = s.failed > 0 ? 'err' : 'ok'
  const parts = [c.t.actions(s.count)]
  if (s.added + s.removed > 0) parts.push(`+${s.added} −${s.removed}`)
  const tip = `${c.t.className[cls]} · ${parts.join(' · ')}`
  return (
    <Box flexDirection="row" gap={1} alignItems="center">
      {svg(c, diaryPet(cls, state, tip, c.palette), 'mark')}
      <Box flexDirection="row" gap={1} flexGrow={1} flexShrink={1}>
        <Text bold color={classColor(cls, c.palette)}>
          {c.t.className[cls]}
        </Text>
        <Text dimColor wrap="truncate-end">
          · {parts.join(' · ')}
        </Text>
      </Box>
      {svg(c, pillOutline(state, `${s.count - s.failed}/${s.count}`, c.palette), 'pill')}
      <Button key={`split-${first?.group ?? ''}`} plain dimColor label={`${c.t.expandGroup} ▾`} onPress={split} />
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
