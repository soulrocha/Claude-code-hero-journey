// Primeiros passos: aparece sozinho na primeira vez. Pergunta a língua, se a
// pessoa usa um vault (onde e qual a pasta de entrada) e oferece cadastrar a
// pasta atual como projeto. As respostas viram as opções do mod (as mesmas de
// /config). O ai-memory não pede pasta: o grimório grava nele pelo MCP, quando
// ele está conectado. Sem vault ou sem ai-memory, a tela recomenda os dois.

import type { RenderElement } from 'claude-code'

import type { Setup } from '../../../types'
import { crab } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { inputOf, svg, title } from '../../core/ui'
import type { Dests } from '../grimorio/grimorio'

export type SetupActions = {
  lang: (value: 'auto' | 'pt-BR' | 'en') => void
  answer: (yes: boolean) => void
  path: (value: string) => void
  inbox: (value: string) => void
  addProject: () => void
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
  hasProject: boolean,
  act: SetupActions,
): RenderElement => {
  const { Box, Button, Link, Text } = c.ui
  const Input = inputOf(c.ui)
  const said = setup.vault
  const yes = said === 'sim' || (said === undefined && paths.vault !== '')
  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="row" gap={2} alignItems="center">
        {svg(c, crab('druida', 64, c.palette, c.t.setupTitle, true), 'setup-crab')}
        {title(c, c.t.setupTitle)}
      </Box>
      <Text dimColor wrap="wrap">
        {c.t.setupIntro}
      </Text>
      <Box key="setup-lang" flexDirection="column">
        <Text bold>{c.t.language}</Text>
        <Box flexDirection="row" gap={1} flexWrap="wrap">
          <Button key="setup-lang-auto" plain label={`${radio(langOption === 'auto')} ${c.t.langAuto}`} onPress={() => act.lang('auto')} />
          <Button key="setup-lang-pt" plain label={`${radio(langOption === 'pt-BR')} Português (Brasil)`} onPress={() => act.lang('pt-BR')} />
          <Button key="setup-lang-en" plain label={`${radio(langOption === 'en')} English`} onPress={() => act.lang('en')} />
        </Box>
      </Box>
      <Box key="setup-vault" flexDirection="column">
        <Text bold wrap="wrap">
          {c.t.setupVaultQ}
        </Text>
        <Box flexDirection="row" gap={1}>
          <Button key="setup-vault-sim" plain label={`${radio(yes)} ${c.t.setupYes}`} onPress={() => act.answer(true)} />
          <Button key="setup-vault-nao" plain label={`${radio(said === 'nao')} ${c.t.setupNo}`} onPress={() => act.answer(false)} />
        </Box>
        {yes && Input !== undefined && (
          <Input
            key="setup-vault-path"
            placeholder={c.t.setupPathVault}
            value={paths.vault}
            submitLabel={c.t.setupSave}
            onSubmit={(value: string) => act.path(value)}
          />
        )}
        {yes && paths.vault !== '' && <Text color="success">{c.t.setupSaved(paths.vault)}</Text>}
        {yes && paths.vault !== '' && Input !== undefined && (
          <Input
            key="setup-vault-inbox"
            placeholder={c.t.setupPathInbox}
            value={paths.inbox ?? 'Inbox'}
            submitLabel={c.t.setupSave}
            onSubmit={(value: string) => act.inbox(value)}
          />
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
        {paths.memory !== undefined ? (
          <Text color="success">{c.t.setupMemoryOk}</Text>
        ) : (
          <Box flexDirection="column">
            <Text dimColor wrap="wrap">
              {c.t.setupMemoryTip}
            </Text>
            <Link href={AI_MEMORY_URL}>{c.t.setupMemoryLink}</Link>
          </Box>
        )}
      </Box>
      {!hasProject && (
        <Box key="setup-project" flexDirection="column">
          <Text bold>{c.t.setupProject}</Text>
          <Button key="setup-add-project" plain label={c.t.projAddCwd} onPress={act.addProject} />
        </Box>
      )}
      {setup.msg !== undefined && <Text color="warning">{setup.msg}</Text>}
      <Button key="setup-done" variant="primary" label={c.t.setupDone} onPress={act.done} />
    </Box>
  )
}
