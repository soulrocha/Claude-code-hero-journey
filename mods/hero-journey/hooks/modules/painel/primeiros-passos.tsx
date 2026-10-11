// Primeiros passos: aparece sozinho na primeira vez. Pergunta a língua e se a
// pessoa usa um vault (onde e qual a pasta de entrada, digitando ou pelo
// seletor de pasta do sistema). As respostas viram as opções do mod (as mesmas
// de /config). O ai-memory não pede pasta: o grimório grava nele pelo MCP, quando
// ele está conectado. Sem vault, a tela recomenda o Obsidian; o ai-memory é
// sempre lembrado, para quem não tem e para quem já usa e quer apoiar o autor.

import type { RenderElement } from 'claude-code'

import type { Setup } from '../../../types'
import { parade, stepBadge } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { inputOf, pxOf, svg, title } from '../../core/ui'
import type { Dests } from '../grimorio/grimorio'

export type SetupActions = {
  lang: (value: 'auto' | 'pt-BR' | 'en') => void
  answer: (yes: boolean) => void
  path: (value: string) => void
  inbox: (value: string) => void
  /** O seletor de pasta do sistema, para o vault e para a pasta de entrada. */
  pickVault: () => void
  pickInbox: () => void
  /** Abre no Explorer/Finder a pasta onde o grimório deixa as decisões. */
  openDecisions: () => void
  done: () => void
}

const AI_MEMORY_URL = 'https://github.com/akitaonrails/ai-memory'
const OBSIDIAN_URL = 'https://obsidian.md'

const radio = (on: boolean) => (on ? '◉' : '○')

export const setupView = (
  c: Ctx,
  setup: Setup,
  langOption: string,
  paths: Dests,
  act: SetupActions,
): RenderElement => {
  const { Box, Button, Link, Text } = c.ui
  const Input = inputOf(c.ui)
  const said = setup.vault
  const yes = said === 'sim' || (said === undefined && paths.vault !== '')
  return (
    <Box flexDirection="column" gap={1}>
      {/* O desfile do README: os 9 Clawds em fila e o título embaixo. */}
      {c.desktop ? svg(c, parade(pxOf(c), c.t.setupTitle, c.palette, c.t.setupTagline), 'setup-parade') : title(c, c.t.setupTitle)}
      {!c.desktop && (
        <Text dimColor wrap="wrap">
          {c.t.setupTagline}
        </Text>
      )}
      <Box key="setup-lang" flexDirection="column">
        <Box flexDirection="row" gap={1} alignItems="center">
          {c.desktop && svg(c, stepBadge(1, langOption !== 'auto', c.palette), 'step-1')}
          <Text bold>{c.t.language}</Text>
        </Box>
        <Box flexDirection="row" columnGap={1} flexWrap="wrap" paddingLeft={c.desktop ? 3 : 0}>
          <Button key="setup-lang-auto" plain label={`${radio(langOption === 'auto')} ${c.t.langAutoShort}`} onPress={() => act.lang('auto')} />
          <Button key="setup-lang-pt" plain label={`${radio(langOption === 'pt-BR')} Português`} onPress={() => act.lang('pt-BR')} />
          <Button key="setup-lang-en" plain label={`${radio(langOption === 'en')} English`} onPress={() => act.lang('en')} />
        </Box>
      </Box>
      <Box key="setup-vault" flexDirection="column">
        <Box flexDirection="row" gap={1} alignItems="center">
          {c.desktop && svg(c, stepBadge(2, said !== undefined || paths.vault !== '', c.palette), 'step-2')}
          <Text bold wrap="wrap">
            {c.t.setupVaultQ}
          </Text>
        </Box>
        <Box flexDirection="row" gap={1}>
          <Button key="setup-vault-sim" plain label={`${radio(yes)} ${c.t.setupYes}`} onPress={() => act.answer(true)} />
          <Button key="setup-vault-nao" plain label={`${radio(said === 'nao')} ${c.t.setupNo}`} onPress={() => act.answer(false)} />
        </Box>
        {/* O campo e, ao lado, o seletor de pasta do sistema. Onde não há campo (mobile), também não há seletor: */}
        {/* o diálogo abriria no computador, longe de quem está no celular. */}
        {yes && Input !== undefined && (
          <Box flexDirection="row" gap={1} alignItems="center">
            <Box flexGrow={1}>
              <Input
                key="setup-vault-path"
                placeholder={c.t.setupPathVault}
                value={paths.vault}
                submitLabel={c.t.setupSave}
                onSubmit={(value: string) => act.path(value)}
              />
            </Box>
            <Button key="setup-vault-pick" plain label={c.t.setupPick} onPress={act.pickVault} />
          </Box>
        )}
        {yes && paths.vault !== '' && <Text color="success">{c.t.setupSaved(paths.vault)}</Text>}
        {yes && paths.vault !== '' && Input !== undefined && (
          <Box flexDirection="row" gap={1} alignItems="center">
            <Box flexGrow={1}>
              <Input
                key="setup-vault-inbox"
                placeholder={c.t.setupPathInbox}
                value={paths.inbox ?? 'Inbox'}
                submitLabel={c.t.setupSave}
                onSubmit={(value: string) => act.inbox(value)}
              />
            </Box>
            <Button key="setup-inbox-pick" plain label={c.t.setupPick} onPress={act.pickInbox} />
          </Box>
        )}
        {yes && paths.vault !== '' && Input !== undefined && (
          <Button key="setup-open-decisions" plain dimColor label={c.t.openDecisions} onPress={act.openDecisions} />
        )}
        {said === 'nao' && <Text dimColor>{c.t.setupSkipped}</Text>}
        {paths.vault === '' && (
          <Box key="setup-obsidian" flexDirection="column">
            <Text dimColor wrap="wrap">
              {c.t.setupObsidianTip}
            </Text>
            <Link href={OBSIDIAN_URL}>{c.t.setupObsidianLink}</Link>
          </Box>
        )}
      </Box>
      <Box key="setup-aimemory" flexDirection="column">
        <Box flexDirection="row" gap={1} alignItems="center">
          {c.desktop && svg(c, stepBadge(3, paths.memory !== undefined, c.palette), 'step-3')}
          <Text bold>{c.t.setupMemoryTitle}</Text>
        </Box>
        {/* Com o ai-memory conectado, o crédito continua: um convite a apoiar quem fez. */}
        {paths.memory !== undefined ? (
          <Box flexDirection="column">
            <Text color="success">{c.t.setupMemoryOk}</Text>
            <Text dimColor wrap="wrap">
              {c.t.setupMemoryThanks}
            </Text>
            <Link href={AI_MEMORY_URL}>{c.t.setupMemoryStar}</Link>
          </Box>
        ) : (
          <Box flexDirection="column">
            <Text dimColor wrap="wrap">
              {c.t.setupMemoryTip}
            </Text>
            <Link href={AI_MEMORY_URL}>{c.t.setupMemoryLink}</Link>
          </Box>
        )}
      </Box>
      {setup.msg !== undefined && <Text color="warning">{setup.msg}</Text>}
      <Button key="setup-done" variant="primary" label={c.t.setupDone} onPress={act.done} />
    </Box>
  )
}
