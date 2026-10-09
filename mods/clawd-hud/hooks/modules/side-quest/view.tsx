// Side quest: o cartão com o resumo da campanha que vai ao prompt.

import type { RenderElement } from 'claude-code'

import { crab } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { svg } from '../../core/ui'

export type SideQuestActions = { fill: () => void; copy: () => void; dismiss: () => void }

export const sideQuestCard = (c: Ctx, brief: string, act: SideQuestActions): RenderElement => {
  const { Box, Button, Text } = c.ui
  return (
    <Box key="card-sideQuest" flexDirection="column" borderStyle="round" borderColor="suggestion" paddingX={1}>
      <Box flexDirection="row" gap={2} alignItems="center">
        {svg(c.ui, c.desktop, crab('patrulheiro', 64, c.palette, c.t.sqTitle, true), 'sq-crab')}
        <Box flexDirection="column" flexGrow={1}>
          <Text bold color="suggestion">
            ⇄ {c.t.sqTitle}
          </Text>
          <Text wrap="wrap">{c.t.sqBody}</Text>
        </Box>
      </Box>
      <Text dimColor wrap="wrap">
        {brief}
      </Text>
      <Box flexDirection="row" gap={1}>
        <Button key="sq-fill" variant="primary" label={c.t.toPrompt} onPress={act.fill} />
        <Button key="sq-copy" label={c.t.copy} onPress={act.copy} />
        <Button key="sq-dismiss" label={c.t.notNow} onPress={act.dismiss} />
      </Box>
    </Box>
  )
}
