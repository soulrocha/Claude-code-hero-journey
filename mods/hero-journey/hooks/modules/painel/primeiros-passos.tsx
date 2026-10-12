// Primeiros passos: aparece sozinho na primeira vez. Diz que tudo já funciona,
// pergunta só a língua e mostra o que foi encontrado para a memória (o vault e o
// ai-memory), com um clique para escolher a pasta. Nada aqui é obrigatório: sem
// vault, o progresso e as decisões ficam no projeto, e o grimório pergunta quando
// precisar (configurar quando precisa). O ai-memory não pede pasta: o grimório
// grava nele pelo MCP, quando ele está conectado; o crédito ao autor continua.

import type { RenderElement } from 'claude-code'

import type { Setup } from '../../../types'
import { parade } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { inputOf, pxOf, svg, title } from '../../core/ui'
import type { Dests } from '../grimorio/grimorio'

export type SetupActions = {
  lang: (value: 'auto' | 'pt-BR' | 'en') => void
  /** O caminho digitado, quando o seletor de pasta do sistema não abre. */
  path: (value: string) => void
  /** O seletor de pasta do sistema, para o vault. */
  pickVault: () => void
  done: () => void
}

const AI_MEMORY_URL = 'https://github.com/akitaonrails/ai-memory'

const radio = (on: boolean) => (on ? '◉' : '○')

export const setupView = (c: Ctx, setup: Setup, langOption: string, paths: Dests, act: SetupActions): RenderElement => {
  const { Box, Button, Link, Text } = c.ui
  const Input = inputOf(c.ui)
  const hasVault = paths.vault !== ''
  const hasMemory = paths.memory !== undefined
  // O campo de texto só aparece quando o seletor do sistema não abriu (ou a pasta digitada não serviu).
  const typing = setup.msg !== undefined && Input !== undefined
  const line = (label: string, children: RenderElement[]) => (
    <Box key={`setup-${label}`} flexDirection="row" gap={1}>
      <Box width={10} flexShrink={0}>
        <Text dimColor>{label}</Text>
      </Box>
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        {children}
      </Box>
    </Box>
  )
  const item = (key: string, name: string, ok: boolean, state: string, action: RenderElement) => (
    <Box key={key} flexDirection="row" columnGap={1}>
      <Box flexShrink={0} flexDirection="row" columnGap={1}>
        <Text color={ok ? 'success' : undefined} dimColor={!ok}>
          {ok ? '✓' : '○'}
        </Text>
        <Text>{name}</Text>
      </Box>
      <Box flexGrow={1} flexShrink={1}>
        <Text dimColor wrap="truncate-start">
          {state}
        </Text>
      </Box>
      <Box flexShrink={0}>{action}</Box>
    </Box>
  )
  return (
    <Box flexDirection="column" gap={1}>
      {c.desktop ? svg(c, parade(pxOf(c), 'Hero Journey', c.palette, c.t.setupTagline), 'setup-parade') : title(c, 'Hero Journey')}
      <Text wrap="wrap">{c.t.setupWelcome}</Text>
      {line(c.t.language, [
        <Box key="setup-langs" flexDirection="row" columnGap={2} flexWrap="wrap">
          <Button key="setup-lang-auto" plain dimColor={langOption !== 'auto'} label={`${radio(langOption === 'auto')} ${c.t.langAutoShort}`} onPress={() => act.lang('auto')} />
          <Button key="setup-lang-pt" plain dimColor={langOption !== 'pt-BR'} label={`${radio(langOption === 'pt-BR')} Português`} onPress={() => act.lang('pt-BR')} />
          <Button key="setup-lang-en" plain dimColor={langOption !== 'en'} label={`${radio(langOption === 'en')} English`} onPress={() => act.lang('en')} />
        </Box>,
      ])}
      {line(c.t.setupMemoryRow, [
        item(
          'setup-vault',
          'Vault',
          hasVault,
          hasVault ? paths.vault : c.t.setupNone,
          <Button key="setup-vault-pick" plain dimColor={hasVault} label={hasVault ? c.t.change : c.t.setupPick} onPress={act.pickVault} />,
        ),
        item(
          'setup-memory',
          'ai-memory',
          hasMemory,
          hasMemory ? c.t.memConnected : c.t.setupMemoryNone,
          <Link key="setup-memory-link" href={AI_MEMORY_URL}>
            {hasMemory ? c.t.setupStar : c.t.whatIs}
          </Link>,
        ),
        <Text key="setup-optional" dimColor wrap="wrap">
          {hasVault || hasMemory ? c.t.setupLater : c.t.setupOptional}
        </Text>,
      ])}
      {typing && (
        <Input key="setup-vault-path" placeholder={c.t.setupPathVault} value={paths.vault} submitLabel={c.t.setupSave} onSubmit={(value: string) => act.path(value)} />
      )}
      {setup.msg !== undefined && <Text color="warning">{setup.msg}</Text>}
      <Button key="setup-done" variant="primary" label={c.t.setupStart} onPress={act.done} />
    </Box>
  )
}
