// Mochila: o cartão de compactação, curto. Com o salvar progresso ligado e um
// objetivo na sessão, oferece salvar o progresso antes, porque é quando o
// contexto se perde.

import type { RenderElement } from 'claude-code'

import type { Ctx } from '../../core/ui'
import { progressBlock } from '../grimorio/view'

export type CompactActions = {
  /** Só compactar: agora, com o Claude parado; trabalhando, leva o /compact ao prompt. */
  only: () => void
  /** Salvar o progresso e compactar. */
  both: () => void
  dismiss: () => void
}

/** O que o bloco de salvar progresso mostra; ausente com o recurso desligado ou sem objetivo. */
export type SaveOffer = { task: string; next: string; dest: string; onVerify: (value: string) => void; failed?: string }

export const compactCard = (c: Ctx, context: string, save: SaveOffer | undefined, act: CompactActions): RenderElement => {
  const { Box, Button, Text } = c.ui
  return (
    <Box key="card-compactar" flexDirection="column" rowGap={1} borderStyle="round" borderColor="warning" paddingX={1}>
      <Box flexDirection="row" columnGap={1}>
        <Text bold color="warning">
          {c.t.bagAt(context)}
        </Text>
        <Text dimColor wrap="truncate-end">
          {c.t.timeToCompact}
        </Text>
      </Box>
      {save !== undefined && progressBlock(c, save.task, save.next, save.dest, save.onVerify)}
      {save?.failed !== undefined && (
        <Text key="card-save-failed" color="error" wrap="wrap">
          {c.t.saveNotDone(save.failed)}
        </Text>
      )}
      <Box flexDirection="row" columnGap={3} alignItems="center" flexWrap="wrap">
        <Button key="card-dismiss" plain dimColor label={c.t.notNow} onPress={act.dismiss} />
        <Box flexGrow={1} />
        {save !== undefined &&
          (save.failed === undefined ? (
            <Button key="card-only" plain label={c.t.onlyCompact} onPress={act.only} />
          ) : (
            <Button key="card-anyway" plain label={c.t.compactAnyway} onPress={act.only} />
          ))}
        {save !== undefined ? (
          <Button key="card-both" variant="primary" label={c.t.saveAndCompact} onPress={act.both} />
        ) : (
          <Button key="card-now" variant="primary" label={c.t.compactNow} onPress={act.only} />
        )}
      </Box>
    </Box>
  )
}
