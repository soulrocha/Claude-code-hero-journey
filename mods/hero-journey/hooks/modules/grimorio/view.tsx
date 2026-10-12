// Grimório na tela: a página 📖 (o Sábio na torre, o que há para guardar, o que
// foi guardado hoje e o que ele lembra), o cartão de fim de marco, o bloco de
// salvar progresso do cartão de compactar, o Continuar do acampamento, o aviso
// do Sábio no palco e as linhas do ⚙ Memória. Nada aqui usa `$`.

import type { RenderElement } from 'claude-code'

import type { Inscription, MemoryPrefs, Progress, ProgressState } from '../../../types'
import { classColor, petArt, sparkleArt, TONE, toneOf } from '../../core/art'
import { stageArt } from '../../core/cenarios'
import type { MemoryToggle } from '../../core/prefs'
import type { Ctx } from '../../core/ui'
import { inputOf, pxOf, svg, title } from '../../core/ui'
import { optionsFor } from './grimorio'
import type { Dests } from './grimorio'

/** A cor de cada intenção: decisão em azul, conquista em rosa, regra em dourado. */
const kindColor = (c: Ctx, kind: Inscription['kind']) =>
  kind === 'decisao' ? classColor('mago', c.palette) : kind === 'conquista' ? classColor('rei', c.palette) : toneOf(c.palette).gild

export type InscriptionActions = { cycle: (id: string) => void }

/** Uma inscrição: a intenção, o destino (um só; o clique troca) e o texto. */
export const inscriptionRow = (c: Ctx, i: Inscription, d: Dests, act?: InscriptionActions) => {
  const { Box, Button, Text } = c.ui
  const dest = i.destinations[0]
  const many = optionsFor(i.kind, d).length > 1
  const label = dest === undefined ? '→ ?' : `→ ${c.t.dest[dest]}${many && act !== undefined ? ' ▾' : ''}`
  return (
    <Box key={`ins-${i.id}`} flexDirection="column">
      <Box flexDirection="row" columnGap={1}>
        <Text bold color={kindColor(c, i.kind)}>
          {c.t.grimKind[i.kind].toUpperCase()}
        </Text>
        <Box flexGrow={1} />
        {act !== undefined && many ? (
          <Button key={`dest-${i.id}`} plain dimColor label={label} onPress={() => act.cycle(i.id)} />
        ) : (
          <Text dimColor>{label}</Text>
        )}
      </Box>
      <Text wrap="wrap">{i.text}</Text>
    </Box>
  )
}

/** O botão de selar do grimório: moldura dourada, estrelas e o verbo do Sábio. */
export const sealButton = (c: Ctx, n: number, onPress: () => void) => {
  const { Box, Button, Text } = c.ui
  const gild = toneOf(c.palette).gild
  const label = `✦ ${c.t.seal} · ${n}`
  return (
    <Box key="grim-seal-box" flexDirection="row" columnGap={1} alignItems="center">
      {svg(c, sparkleArt(c.palette), 'grim-sparkle')}
      <Box borderStyle={c.desktop ? 'round' : undefined} borderColor={gild} paddingX={c.desktop ? 1 : 0}>
        <Button key="grim-seal" plain label={label} onPress={onPress}>
          <Text bold color={gild}>
            {label}
          </Text>
        </Button>
      </Box>
    </Box>
  )
}

export type SealActions = InscriptionActions & {
  seal: () => void
  /** "Agora não" no cartão; "Descartar" na página. */
  dismiss: () => void
  /** Sem vault configurado, a primeira crônica pergunta onde guardar. */
  chooseHome: (home: 'projeto' | 'vault') => void
}

/** "Onde guardo suas decisões?": só quando alguma crônica ainda não tem destino. */
const whereQuestion = (c: Ctx, act: SealActions) => {
  const { Box, Button, Text } = c.ui
  return (
    <Box key="grim-where" flexDirection="column">
      <Text bold>{c.t.whereDecisions}</Text>
      <Box flexDirection="row" columnGap={2} flexWrap="wrap">
        <Button key="grim-home-projeto" label={c.t.inProject} onPress={() => act.chooseHome('projeto')} />
        <Button key="grim-home-vault" plain label={c.t.myVault} onPress={() => act.chooseHome('vault')} />
      </Box>
      <Text dimColor>{c.t.askOnce}</Text>
    </Box>
  )
}

/** As inscrições pendentes, a pergunta (se precisar) e a linha de ações, com espaço entre elas. */
const sealBlock = (c: Ctx, list: readonly Inscription[], d: Dests, act: SealActions, dismissLabel: string) => {
  const { Box, Button } = c.ui
  const asks = list.some(i => i.destinations.length === 0)
  return [
    asks ? whereQuestion(c, act) : null,
    ...list.map(i => inscriptionRow(c, i, d, act)),
    <Box key="grim-actions" flexDirection="row" columnGap={3} alignItems="center" flexWrap="wrap">
      <Button key="grim-dismiss" plain dimColor label={dismissLabel} onPress={act.dismiss} />
      <Box flexGrow={1} />
      {sealButton(c, list.length, act.seal)}
    </Box>,
  ].filter((x): x is RenderElement => x !== null)
}

/** O cartão de fim de marco, acima do prompt: celebra e pergunta. */
export const marcoCard = (c: Ctx, name: string, sub: string, list: readonly Inscription[], d: Dests, act: SealActions): RenderElement => {
  const { Box, Text } = c.ui
  const gild = toneOf(c.palette)
  return (
    <Box key="card-marco" flexDirection="column" rowGap={1} borderStyle="round" borderColor={TONE[c.palette].gildDim} paddingX={1}>
      <Box flexDirection="row" columnGap={1} alignItems="center">
        {svg(c, petArt('sabio', 'work', 34, c.t.className.sabio), 'marco-pet')}
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          <Text bold color={gild.gild} wrap="truncate-end">
            {c.t.marcoTitle(name)}
          </Text>
          <Text dimColor wrap="truncate-end">
            {sub}
          </Text>
        </Box>
      </Box>
      {sealBlock(c, list, d, act, c.t.notNow)}
    </Box>
  )
}

/** O bloco "Antes, salvar o progresso?" do cartão de compactar. */
export const progressBlock = (c: Ctx, task: string, next: string, destLabel: string, onVerify: (value: string) => void) => {
  const { Box, Text } = c.ui
  const Input = inputOf(c.ui)
  const sabio = classColor('sabio', c.palette)
  return (
    <Box key="save-block" flexDirection="column" borderStyle="round" borderColor={sabio} paddingX={1}>
      <Box flexDirection="row" columnGap={1} alignItems="center">
        {svg(c, petArt('sabio', 'work', 28, c.t.className.sabio), 'save-pet')}
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          <Text bold color={sabio} wrap="truncate-end">
            {c.t.saveFirst}
          </Text>
          <Text dimColor wrap="truncate-end">
            {next === '' ? task : `${task} · ${c.t.nextStep(next)}`}
          </Text>
        </Box>
      </Box>
      {Input !== undefined && (
        <Box flexDirection="row" columnGap={1} alignItems="center">
          <Text dimColor>{c.t.verify}</Text>
          <Input key="save-verify" placeholder={c.t.verifyHint} onInput={v => onVerify(v)} onSubmit={v => onVerify(v)} />
        </Box>
      )}
      <Text dimColor wrap="truncate-end">
        → {destLabel}
      </Text>
    </Box>
  )
}

/** O aviso suave do Sábio no palco: uma frase, um detalhe e as ações embaixo. */
export const sageNudge = (c: Ctx, key: string, line: string, sub: string | undefined, action: { label: string; onPress: () => void }, secondary?: { label: string; onPress: () => void }) => {
  const { Box, Button, Text } = c.ui
  const k = toneOf(c.palette)
  const sabio = classColor('sabio', c.palette)
  return (
    <Box key={key} flexDirection="column" marginTop={1} borderStyle={c.desktop ? 'round' : undefined} borderColor={TONE[c.palette].gildDim} paddingX={c.desktop ? 1 : 0}>
      <Box flexDirection="row" columnGap={1} alignItems="center">
        {svg(c, petArt('sabio', 'work', 30, c.t.className.sabio), `${key}-pet`)}
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          <Text bold color={sabio} wrap="truncate-end">
            {line}
          </Text>
          {sub !== undefined && (
            <Text dimColor wrap="truncate-end">
              {sub}
            </Text>
          )}
        </Box>
      </Box>
      <Box flexDirection="row" columnGap={2}>
        <Box flexGrow={1} />
        {secondary !== undefined && <Button key={`${key}-no`} plain dimColor label={secondary.label} onPress={secondary.onPress} />}
        <Button key={`${key}-go`} plain label={action.label} onPress={action.onPress}>
          <Text color={k.gild}>{action.label}</Text>
        </Button>
      </Box>
    </Box>
  )
}

/** O Continuar do acampamento: os jogos salvos, cada um com o seu botão. */
export const continueSection = (c: Ctx, list: readonly Progress[], hint: boolean, act: { go: (p: Progress) => void; how: () => void }) => {
  const { Box, Button, Text } = c.ui
  return (
    <Box key="continue" flexDirection="column" marginTop={1}>
      {title(c, c.t.continueTitle, undefined, String(list.length))}
      {list.slice(0, 4).map(p => (
        <Box key={`cont-${p.id}`} flexDirection="row" columnGap={1} alignItems="center">
          <Box flexDirection="column" flexGrow={1} flexShrink={1}>
            <Text bold wrap="truncate-end">
              {p.title}
            </Text>
            <Text dimColor wrap="truncate-end">
              {[p.next === '' ? '' : c.t.nextStep(p.next), p.updated, p.by].filter(Boolean).join(' · ')}
            </Text>
          </Box>
          <Button key={`cont-go-${p.id}`} label={c.t.continueBtn} onPress={() => act.go(p)} />
        </Box>
      ))}
      {hint && (
        <Box flexDirection="row" columnGap={1} marginTop={1}>
          <Box flexGrow={1} flexShrink={1}>
            <Text dimColor wrap="wrap">
              {c.t.continueHint}
            </Text>
          </Box>
          <Button key="cont-how" plain dimColor label={c.t.seeHow} onPress={act.how} />
        </Box>
      )}
    </Box>
  )
}

export type GrimData = {
  pending: readonly Inscription[]
  sealed: readonly Inscription[]
  dests: Dests
  memory: MemoryPrefs
  progress: ProgressState
  /** Para onde o progresso vai: "Tarefa + ai-memory", "Tarefa no projeto"... */
  progressLabel: string
  remembered: readonly { kind: string; text: string; path: string }[]
  /** Sem ai-memory: quantas notas a memória automática do Claude tem neste projeto. */
  autoNotes?: number
}

export type GrimActions = SealActions & {
  back: () => void
  config: () => void
  undoSeal: (id: string) => void
  undoProgress: () => void
  forget: (path: string) => void
  openNotes: () => void
  /** Só existe com o botão do Haiku ligado no ⚙: gasta tokens, e só no clique. */
  haiku?: () => void
}

/** A página 📖: o Sábio na torre, para guardar, guardado hoje, o que ele lembra e o estado dos destinos. */
export const grimPage = (c: Ctx, d: GrimData, act: GrimActions): RenderElement => {
  const { Box, Button, Text } = c.ui
  const k = toneOf(c.palette)
  const saved = d.progress.saved
  const status = [
    d.dests.vault !== '' ? 'vault ✓' : 'vault —',
    'AGENTS.md ✓',
    d.dests.memory !== undefined ? 'ai-memory ✓' : 'ai-memory —',
  ].join(' · ')
  return (
    <Box flexDirection="column">
      <Box key="grim-top" flexDirection="row">
        <Button key="back" plain label={c.t.back} onPress={act.back} />
        <Box flexGrow={1} />
        {act.haiku !== undefined && d.pending.length > 0 && <Button key="grim-haiku" plain dimColor label={c.t.haikuButton} onPress={act.haiku} />}
      </Box>
      {svg(c, stageArt('sabio', 'work', 'torre', pxOf(c), 170, `${c.t.className.sabio} · ${c.t.grimTitle}`, c.t.placeName), 'grim-stage')}
      {d.pending.length > 0 ? (
        <Box key="grim-pending" flexDirection="column" rowGap={1} marginTop={1}>
          {title(c, c.t.toKeep, undefined, String(d.pending.length))}
          {sealBlock(c, d.pending, d.dests, act, c.t.discard)}
        </Box>
      ) : (
        <Box key="grim-empty" marginTop={1}>
          <Text dimColor>{c.t.grimEmpty}</Text>
        </Box>
      )}
      {(saved !== undefined || d.sealed.length > 0) && (
        <Box key="grim-kept" flexDirection="column" marginTop={1}>
          {title(c, c.t.keptToday, undefined, String(d.sealed.length + (saved === undefined ? 0 : 1)))}
          {saved !== undefined && (
            <Box key="kept-progress" flexDirection="column">
              <Box flexDirection="row" columnGap={1}>
                <Text color="success">✓</Text>
                <Text wrap="truncate-end">
                  {c.t.progressSaved} · {saved.id}
                </Text>
                <Box flexGrow={1} />
                <Button key="undo-progress" plain dimColor label={c.t.undo} onPress={act.undoProgress} />
              </Box>
              <Text dimColor wrap="truncate-start">
                {saved.path}
              </Text>
            </Box>
          )}
          {d.sealed.map(i => (
            <Box key={`kept-${i.id}`} flexDirection="row" columnGap={1}>
              <Text color="success">✓</Text>
              <Text color={kindColor(c, i.kind)}>{c.t.grimKind[i.kind]}</Text>
              <Text dimColor wrap="truncate-end">
                {i.text}
              </Text>
              <Box flexGrow={1} />
              {i.written !== undefined && i.written.length > 0 && <Button key={`undo-${i.id}`} plain dimColor label={c.t.undo} onPress={() => act.undoSeal(i.id)} />}
            </Box>
          ))}
        </Box>
      )}
      {d.memory.lembra && (d.remembered.length > 0 || d.autoNotes !== undefined) && (
        <Box key="grim-remembers" flexDirection="column" marginTop={1}>
          {title(c, c.t.remembers)}
          {d.remembered.slice(0, 4).map(r => (
            <Box key={`mem-${r.path}`} flexDirection="row" columnGap={1}>
              <Text color={classColor('sabio', c.palette)}>{r.kind}</Text>
              <Text dimColor wrap="truncate-end">
                {r.text}
              </Text>
              <Box flexGrow={1} />
              <Button key={`forget-${r.path}`} plain dimColor label={c.t.forget} onPress={() => act.forget(r.path)} />
            </Box>
          ))}
          {d.remembered.length === 0 && d.autoNotes !== undefined && (
            <Box flexDirection="row" columnGap={1}>
              <Text dimColor wrap="truncate-end">
                {c.t.autoMemoryNotes(d.autoNotes)}
              </Text>
              <Box flexGrow={1} />
              <Button key="open-notes" plain dimColor label={c.t.openIt} onPress={act.openNotes} />
            </Box>
          )}
        </Box>
      )}
      <Box key="grim-status" flexDirection="row" columnGap={2} marginTop={1}>
        <Text dimColor wrap="truncate-end">
          {status}
        </Text>
        <Box flexGrow={1} />
        <Button key="grim-config" plain dimColor label={c.t.memoryCfg} onPress={act.config}>
          <Text color={k.muted}>{c.t.memoryCfg}</Text>
        </Button>
      </Box>
    </Box>
  )
}

export type MemoryConfigActions = {
  toggle: (k: MemoryToggle) => void
  home: (h: MemoryPrefs['decisoesEm']) => void
  pickVault: () => void
  testMemory: () => void
  whatIs: () => void
  restore: () => void
}

/** As linhas do ⚙ Memória: o que foi detectado, os recursos e avisos, os destinos e as integrações. */
export const memoryConfig = (c: Ctx, m: MemoryPrefs, d: Dests, progressLabel: string, act: MemoryConfigActions): RenderElement[] => {
  const { Box, Button, Text } = c.ui
  const k = toneOf(c.palette)
  const full = d.vault !== '' && d.memory !== undefined
  const partial = d.vault !== '' || d.memory !== undefined
  const check = (key: MemoryToggle) => <Button key={`mem-${key}`} plain dimColor={!m[key]} label={`${m[key] ? '☑' : '☐'} ${c.t.memFeature[key]}`} onPress={() => act.toggle(key)} />
  const radio = (home: MemoryPrefs['decisoesEm'], label: string) => (
    <Button key={`home-${home}`} plain dimColor={m.decisoesEm !== home} label={`${m.decisoesEm === home ? '◉' : '○'} ${label}`} onPress={() => act.home(home)} />
  )
  const line = (label: string, kids: (RenderElement | null)[]) => (
    <Box key={`mline-${label}`} flexDirection="row" gap={1}>
      <Box width={12} flexShrink={0}>
        <Text dimColor wrap="truncate-end">
          {label}
        </Text>
      </Box>
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        {kids.filter((x): x is RenderElement => x !== null)}
      </Box>
    </Box>
  )
  const decisionsLabel = m.decisoesEm === 'projeto' || d.vault === '' ? c.t.dest.projeto : c.t.dest.vaultDecisao
  return [
    <Box key="mem-detect" flexDirection="column" borderStyle={c.desktop ? 'round' : undefined} borderColor={full ? TONE[c.palette].gildDim : undefined} paddingX={c.desktop ? 1 : 0}>
      <Text bold color={full ? 'success' : undefined}>
        {full ? c.t.memDetected : c.t.memProject}
      </Text>
      <Text dimColor wrap="wrap">
        {full ? c.t.memDetectedText(d.vault) : partial ? c.t.memPartial(d.vault !== '' ? 'vault' : 'ai-memory') : c.t.memProjectText}
      </Text>
    </Box>,
    line(c.t.rowFeatures, [check('progresso'), check('cronica'), check('regras'), check('lembra')]),
    line(c.t.rowWarnings, [check('avisoPalco'), check('avisoMarco'), check('avisoCompactar')]),
    line(c.t.rowDests, [
      <Text key="d-prog" wrap="truncate-end">
        {c.t.destProgress} <Text color={k.gild}>{progressLabel}</Text>
      </Text>,
      <Text key="d-dec" wrap="truncate-end">
        {c.t.destDecisions} <Text color={k.gild}>{decisionsLabel}</Text>
      </Text>,
      <Box key="d-home" flexDirection="row" columnGap={1} flexWrap="wrap">
        <Text dimColor>{c.t.decisionsIn}</Text>
        {radio('auto', c.t.homeAuto)}
        {radio('vault', c.t.homeVault)}
        {radio('projeto', c.t.homeProject)}
      </Box>,
      <Text key="d-rule" wrap="truncate-end">
        {c.t.destRules} <Text color={k.gild}>AGENTS.md</Text>
      </Text>,
    ]),
    line(c.t.rowIntegrations, [
      <Box key="i-vault" flexDirection="row" columnGap={1}>
        <Text>Vault</Text>
        <Text dimColor wrap="truncate-start">
          {d.vault !== '' ? `${d.vault} ✓` : c.t.notConfigured}
        </Text>
        <Box flexGrow={1} />
        <Button key="mem-pick" plain dimColor label={d.vault !== '' ? c.t.change : c.t.setupPick} onPress={act.pickVault} />
      </Box>,
      <Box key="i-mem" flexDirection="row" columnGap={1}>
        <Text>ai-memory</Text>
        <Text dimColor>{d.memory !== undefined ? `${c.t.memConnected} ✓` : c.t.memMissing}</Text>
        <Box flexGrow={1} />
        {d.memory !== undefined ? (
          <Button key="mem-test" plain dimColor label={c.t.testIt} onPress={act.testMemory} />
        ) : (
          <Button key="mem-what" plain dimColor label={c.t.whatIs} onPress={act.whatIs} />
        )}
      </Box>,
    ]),
    <Box key="mem-restore" flexDirection="row">
      <Box flexGrow={1} />
      <Button key="mem-reset" plain dimColor label={c.t.restoreRecommended} onPress={act.restore} />
    </Box>,
  ]
}
