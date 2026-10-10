// Mochila: o cartão de compactação.

import type { RenderElement } from 'claude-code'

import type { Ctx } from '../../core/ui'

export type CompactActions = { fill: () => void; now: () => void; dismiss: () => void }

export const compactCard = (c: Ctx, context: string, instruction: string, isWorking: boolean, act: CompactActions): RenderElement => {
  const { Box, Button, Text } = c.ui
  return (
    <Box key="card-compactar" flexDirection="column" borderStyle="round" borderColor="warning" paddingX={1}>
      <Text bold color="warning">
        🎒 {c.t.compactTitle}
      </Text>
      <Text wrap="wrap">{c.t.compactBody(context)}</Text>
      <Text dimColor wrap="wrap">
        /compact {instruction}
      </Text>
      <Box flexDirection="row" gap={1}>
        <Button key="card-fill" variant="primary" label={c.t.toPrompt} onPress={act.fill} />
        {!isWorking && <Button key="card-now" label={c.t.compactNow} onPress={act.now} />}
        <Button key="card-dismiss" label={c.t.notNow} onPress={act.dismiss} />
      </Box>
    </Box>
  )
}
