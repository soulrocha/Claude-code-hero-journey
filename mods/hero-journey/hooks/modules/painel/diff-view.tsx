// Página de diff de um item do inventário no painel (D1/D3).
// Respeita docs/mods-capacidades.md: Svg fora de Button, sem cores dentro de Button.

import type { RenderElement } from 'claude-code'

import type { Item } from '../../../types'
import { itemIcon, rarityTone, toneOf } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { svg } from '../../core/ui'
import type { DiffKind, ParsedDiff } from './diff'

export type InventoryItem = Item
export type FileDiff = ParsedDiff

const lineColor = (kind: DiffKind, k: ReturnType<typeof toneOf>): string | undefined =>
  kind === 'add' ? k.ok : kind === 'del' ? k.bad : kind === 'hunk' ? k.dim : undefined

export const diffView = (c: Ctx, item: InventoryItem, diff: FileDiff | string, onBack: () => void): RenderElement => {
  const { Box, Button, Text } = c.ui
  const k = toneOf(c.palette)
  const isErr = typeof diff === 'string'
  const added = isErr ? item.added : diff.added || item.added
  const removed = isErr ? item.removed : diff.removed || item.removed
  return (
    <Box flexDirection="column" gap={1}>
      <Button key="back" plain label={c.t.diffBack} onPress={onBack} />
      <Box key="diff-head" flexDirection="row" columnGap={1} alignItems="center">
        {svg(c, itemIcon(item.path, item.rarity, c.palette, `${item.path} — ${c.t.rarity[item.rarity]}`), `ic-diff-${item.path}`)}
        <Text bold color={rarityTone(item.rarity, c.palette)} wrap="truncate-start">
          {item.path}
        </Text>
        <Box flexGrow={1} />
        {added !== undefined && added > 0 && <Text color={k.ok}>{`+${added}`}</Text>}
        {removed !== undefined && removed > 0 && <Text color={k.bad}>{`−${removed}`}</Text>}
      </Box>
      {isErr ? (
        <Box key="diff-error">
          <Text color={k.bad} wrap="wrap">
            {diff}
          </Text>
        </Box>
      ) : (
        <Box key="diff-content" flexDirection="column">
          {diff.renamedFrom !== undefined && (
            <Text key="diff-renamed" dimColor wrap="truncate-start">
              {c.t.diffRenamed(diff.renamedFrom)}
            </Text>
          )}
          {diff.isNew && !diff.directory && (
            <Box key="diff-new">
              <Text color={k.ok}>{c.t.diffNew}</Text>
            </Box>
          )}
          {diff.isDeleted && (
            <Box key="diff-deleted">
              <Text color={k.bad}>{c.t.diffDeleted}</Text>
            </Box>
          )}
          {diff.directory ? (
            <Box key="diff-dir">
              <Text dimColor>{c.t.diffDir}</Text>
            </Box>
          ) : diff.binary ? (
            <Box key="diff-binary">
              <Text dimColor>{c.t.diffBinary}</Text>
            </Box>
          ) : diff.lines.length === 0 ? (
            <Box key="diff-empty">
              <Text dimColor>{c.t.diffEmpty}</Text>
            </Box>
          ) : (
            diff.lines.map((line, idx) => (
              <Text
                key={`dl-${idx}`}
                color={lineColor(line.kind, k)}
                dimColor={line.kind === 'ctx' || line.kind === 'meta' || line.kind === 'hunk'}
                wrap="truncate-end"
              >
                {line.text}
              </Text>
            ))
          )}
          {diff.more > 0 && (
            <Box key="diff-more">
              <Text dimColor>{c.t.diffMore(diff.more)}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
