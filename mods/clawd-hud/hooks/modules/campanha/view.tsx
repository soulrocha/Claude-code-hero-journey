// Relatório da missão, fixo embaixo do painel: recolhido durante a missão,
// aberto sozinho no fim, com a linha do tempo e Aprovar/Ajustar.

import type { RenderElement } from 'claude-code'

import type { Report } from '../../../types'
import { timeline } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { pxOf, svg, title } from '../../core/ui'
import { fmtDuration } from './campanha'

export type ReportActions = {
  toggle: () => void
  prev: () => void
  next: () => void
  approve: (chapter: number) => void
  adjust: (report: Report) => void
}

export const reportView = (
  c: Ctx,
  list: readonly Report[],
  at: number,
  open: boolean,
  running: boolean,
  act: ReportActions,
): RenderElement => {
  const { Box, Button, Text } = c.ui
  const r = list[at]
  const head = (
    <Box flexDirection="row" gap={1} alignItems="center">
      <Button key="report-toggle" plain label={`${open ? '▾' : '▸'} ${c.t.section.relatorio}`} onPress={act.toggle} />
      {running && <Text dimColor>· {c.t.reportRunning} ⏳</Text>}
      {list.length > 1 && (
        <Box flexDirection="row" gap={1}>
          <Button key="report-prev" plain label="‹" onPress={act.prev} />
          <Text dimColor>{c.t.reportOf(at + 1, list.length)}</Text>
          <Button key="report-next" plain label="›" onPress={act.next} />
        </Box>
      )}
    </Box>
  )
  if (!open || r === undefined) {
    return (
      <Box key="report" flexDirection="column">
        {head}
        {open && r === undefined && <Text dimColor>{c.t.reportNone}</Text>}
      </Box>
    )
  }
  const line = (label: string, value: string | undefined, color?: string) =>
    value === undefined ? null : (
      <Text key={`r-${label}`} wrap="wrap" color={color}>
        <Text bold>{label}:</Text> {value}
      </Text>
    )
  return (
    <Box key="report" flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1}>
      {head}
      {title(c, `${c.t.chapter(r.chapter)} · ${r.title}`, r.verdict === 'aprovado' ? '?' : '!')}
      {c.desktop && r.beats.length > 0
        ? svg(c, timeline(r.beats, c.palette, b => `${c.t.className[b.cls]} · ${b.summary}`, pxOf(c)), 'timeline')
        : r.beats.length > 0 && <Text dimColor>{r.beats.map(b => (b.status === 'err' ? '✗' : '•')).join('─')}</Text>}
      <Text dimColor>{c.t.stats(r.actions, r.files, r.added, r.removed, fmtDuration(r.durationMs))}</Text>
      {line(c.t.result, r.result)}
      {line(c.t.risk, r.risk, 'warning')}
      {r.refusals.length > 0 && line(c.t.refused, r.refusals.join(', '), 'error')}
      {line(c.t.next, r.next)}
      {line(c.t.waits, r.waits, 'suggestion')}
      <Box flexDirection="row" gap={1}>
        {r.verdict === 'aprovado' ? (
          <Text color="success">{c.t.approved}</Text>
        ) : (
          <Button key="report-approve" variant="primary" label={c.t.approve} onPress={() => act.approve(r.chapter)} />
        )}
        <Button key="report-adjust" label={c.t.adjust} onPress={() => act.adjust(r)} />
      </Box>
    </Box>
  )
}
