// Regressões dos achados do QA adversarial (2026-10-09). Cada teste nomeia o achado.

import { describe, expect, mock, test } from 'claude-code/testing'

import type { Cls } from '../types'
import { crabAt } from '../hooks/core/art'
import { PLACE_OF, stageArt } from '../hooks/core/cenarios'
import { agentClass } from '../hooks/core/classes'
import { DICT } from '../hooks/core/i18n'
import { detect, mentionsPrivate } from '../hooks/modules/grimorio/grimorio'
import { diffOf, makeGuard, shellTargets } from '../hooks/modules/guarda/guarda'

const PLUGIN = 'hero-journey'

const pane = {
  plugin: PLUGIN,
  surface: 'desktop',
  component: 'Pane',
  requestId: 'hero-journey',
  props: { title: 'Hero Journey', isFocused: true, bodyColumns: 52, placement: 'dock', scroll: { offset: 0, bodyRows: 60 }, view: {} },
  viewport: { columns: 170, rows: 60, isFullscreen: true },
} as const

const band = {
  plugin: PLUGIN,
  surface: 'desktop',
  component: 'AbovePrompt',
  requestId: 'band',
  props: { hasSurvey: false, isWorking: false, maxRows: 30, bodyColumns: 100, scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

const usage = () => ({ value: { startedAt: 0, context: { percent: 40, window: 200000 }, rateLimits: [] } }) as never

/** Um store em memória que o teste lê de volta (o `$` do teste não tem `store`). */
const memStore = (on: (...args: never[]) => unknown) => {
  const o = on as unknown as (event: string, hook: (...a: unknown[]) => unknown) => void
  const kept = new Map<string, unknown>()
  o('store.get', (_: unknown, e: unknown) => ({ value: kept.get((e as { key: string }).key) }))
  o('store.set', (_: unknown, e: unknown) => {
    const { key, value } = e as { key: string; value: unknown }
    kept.set(key, value)
    return { value: undefined }
  })
  o('store.delete', (_: unknown, e: unknown) => {
    kept.delete((e as { key: string }).key)
    return { value: undefined }
  })
  o('store.keys', () => ({ value: [...kept.keys()] }))
  return kept
}

/** O motor por baixo dos hooks de turno e de mensagem, para os testes de campanha. */
const engine = (on: (...args: never[]) => unknown) => {
  const o = on as unknown as (event: string, hook: (...a: unknown[]) => unknown) => void
  const kept = memStore(on)
  o('session.usage', usage)
  o('session.id', () => ({ value: 'sessao-qa' }))
  o('prompt.submit', (_: unknown, e: unknown) => ({ text: (e as { text: string }).text }))
  o('turn.start', (_: unknown, e: unknown) => ({ turnId: (e as { turnId: string }).turnId }))
  o('turn.complete', () => ({ text: '' }))
  return kept
}

const complete = (turnId: string, mission: string) =>
  ({ turnId, reason: 'answer', durationMs: 1000, isAborted: false, answer: `**Missão:** ${mission}\n**Resultado:** R-${mission}` }) as never

/** Os relatórios guardados na campanha, capítulo a capítulo. */
const saved = (kept: Map<string, unknown>) =>
  (kept.get('campanha:sessao-qa') as { chapters: { report?: { result?: string } }[] }).chapters.map(ch => ch.report?.result)

describe('QA 2 e 3: o relatório é do capítulo do turno', () => {
  test('uma mensagem digitada no meio do turno não rouba o relatório', { options: { language: 'pt-BR' } }, async ($, on) => {
    const kept = engine(on as never)
    await $.prompt.submit({ text: 'Primeira missão', wait: false } as never)
    await $.turn.start({ text: 'Primeira missão', turnId: 't1' } as never)
    await $.prompt.submit({ text: 'Segunda missão', wait: false } as never)
    await $.turn.complete(complete('t1', 'M1'))
    expect(saved(kept)).toEqual(['R-M1', undefined])

    await $.turn.start({ text: 'Segunda missão', turnId: 't2' } as never)
    await $.turn.complete(complete('t2', 'M2'))
    expect(saved(kept)).toEqual(['R-M1', 'R-M2'])
  })

  test('um turno de continuação não sobrescreve o relatório do capítulo', { options: { language: 'pt-BR' } }, async ($, on) => {
    const kept = engine(on as never)
    await $.prompt.submit({ text: 'Missão única', wait: false } as never)
    await $.turn.start({ text: 'Missão única', turnId: 't1' } as never)
    await $.turn.complete(complete('t1', 'M1'))
    await $.turn.start({ text: '', turnId: 't2' } as never)
    await $.turn.complete(complete('t2', 'OUTRA'))
    expect((saved(kept))[0]).toBe('R-M1')
  })
})

test('QA 4: o Haiku não roda sozinho; só no clique do botão', { options: { language: 'pt-BR' } }, async ($, on) => {
  mock.store(on)
  on('session.usage', usage)
  on('turn.complete', () => ({ text: '' }) as never)
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Box', props: {}, children: [] }) as never)
  on('ui.open', () => ({ value: { isPlaced: true } }) as never)
  let calls = 0
  on('model.complete', () => {
    calls += 1
    return { value: { isAnswered: true, text: 'Listas grandes paginam no servidor.', usage: {} } } as never
  })

  const p = await $.ui.mount(pane)
  await p.press({ key: 'config' })
  await p.press({ key: 'mem-open' })
  await p.press({ key: 'haiku' })
  await p.unmount()

  await $.turn.complete({ turnId: 't1', reason: 'answer', durationMs: 1, isAborted: false, answer: 'Decidimos que listas grandes paginam sempre no servidor.' } as never)
  // As inscrições ficam guardadas em silêncio; o /grimorio abre a página do grimório.
  await $.command.run({ command: 'grimorio', args: '', origin: { kind: 'user' } } as never)
  expect(calls).toBe(0)

  const card = await $.ui.mount(pane)
  await card.press({ key: 'grim-haiku' })
  expect(calls).toBe(1)
  await card.unmount()
})

test('QA 5: sem o agrupamento próprio, a saída de cada ferramenta continua à vista', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('tool.call', { tool: 'Edit' }, () => ({ result: { filePath: 'x', structuredPatch: [] } }) as never)
  on('ui.render', { component: 'ToolResult' }, () => ({ type: 'Text', props: {}, children: ['saída do motor'] }) as never)
  for (const id of ['r1', 'r2']) {
    await $.tool.call({ tool: 'Edit', tool_use_id: id, file_path: '/repo/src/a.ts', old_string: 'a', new_string: 'b' } as never)
  }
  for (const surface of ['desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ plugin: PLUGIN, surface, component: 'ToolResult', requestId: 'r2', props: { tool_use_id: 'r2', tool: 'Edit', output: 'ok', isErrored: false } })
    expect(await ui.find({ text: /saída do motor/ })).toBeDefined()
    await ui.unmount()
  }
})

test('QA 6: o guarda pergunta antes de um comando que escreve no .env', { options: { language: 'pt-BR' } }, async ($, on) => {
  let asked = 0
  on('tool.call', { tool: 'AskUserQuestion' }, ((_: unknown, e: { questions: { question: string }[] }) => {
    asked += 1
    return { result: { questions: e.questions, answers: { [e.questions[0]?.question ?? '']: 'Recusar' } } }
  }) as never)
  on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: '', stderr: '', interrupted: false } }) as never)
  on('tool.call', { tool: 'PowerShell' }, () => ({ result: { stdout: '', stderr: '', interrupted: false } }) as never)

  const write = await $.tool.call({ tool: 'Bash', tool_use_id: 'b1', command: 'echo "X=1" >> .env', description: 'grava' } as never)
  expect(write.deny).toContain('recusou')
  const read = await $.tool.call({ tool: 'Bash', tool_use_id: 'b2', command: 'cat .env', description: 'lê' } as never)
  expect(read.deny).toBeUndefined()
  const psRead = await $.tool.call({ tool: 'PowerShell', tool_use_id: 'p1', command: 'Get-Content .env', description: 'lê' } as never)
  expect(psRead.deny).toBeUndefined()
  expect(asked).toBe(1)
})

test('QA 11: o recibo do turno funciona com a campanha desligada', { options: { language: 'pt-BR' } }, async ($, on) => {
  engine(on as never)
  // O app desktop desenha (e hospeda a sessão pelo SDK, com isInteractive falso): o recibo aparece.
  let surfaces: string[] = ['desktop']
  on('session.surfaces', () => ({ value: surfaces }) as never)
  on('tool.call', { tool: 'Edit' }, () => ({ result: { filePath: 'x', structuredPatch: [{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 1, lines: ['-a', '+b'] }] } }) as never)

  const p = await $.ui.mount(pane)
  await p.press({ key: 'config' })
  await p.press({ key: 'mod-campanha' })
  await p.unmount()

  await $.prompt.submit({ text: 'Uma missão', wait: false } as never)
  await $.turn.start({ text: 'Uma missão', turnId: 't1' } as never)
  await $.tool.call({ tool: 'Edit', tool_use_id: 'e1', file_path: '/repo/a.ts', old_string: 'a', new_string: 'b' } as never)
  const done = (await $.turn.complete(complete('t1', 'Feito'))) as { text: string }
  expect(done.text).toContain('Missão cumprida: Feito')
  expect(done.text).toContain('Rúnico · 1 ação · +1 −1')

  // Num `claude -p` nada desenha: o texto do turno continua sendo a resposta.
  surfaces = []
  await $.prompt.submit({ text: 'Outra missão', wait: false } as never)
  await $.turn.start({ text: 'Outra missão', turnId: 't2' } as never)
  await $.tool.call({ tool: 'Edit', tool_use_id: 'e2', file_path: '/repo/b.ts', old_string: 'a', new_string: 'b' } as never)
  const headless = (await $.turn.complete(complete('t2', 'Outra'))) as { text: string }
  expect(headless.text).toBe('')
})

describe('QA: regras puras', () => {
  test('9: a privacidade pega caminhos pessoais de qualquer sistema', async () => {
    const paths = { vault: '' }
    expect(mentionsPrivate('Guardei em /home/ana/notas', paths)).toBe(true)
    expect(mentionsPrivate('Ver /Users/ana/x', paths)).toBe(true)
    expect(mentionsPrivate('Ver ~/notas', paths)).toBe(true)
    expect(mentionsPrivate('Fica em D:\\dados', paths)).toBe(true)
    expect(mentionsPrivate('Listas grandes paginam no servidor.', paths)).toBe(false)
  })

  test('10: regra da pessoa vira regra; "decisão" solta na resposta do Claude não é', async () => {
    expect(detect('', 'Regra: nada de any no core.', 't')[0]?.kind).toBe('regra')
    expect(detect('Decision: use pnpm in every package.', '', 't')).toEqual([])
  })

  test('10b: o falso positivo do app (2026-10-09) não vira inscrição', async () => {
    const answer = [
      '**Missão:** juntar o arquiteto e o QA.',
      '**Resultado:** o uso de contexto aumentou para 60%.',
      '| Item | Decisão |',
      '**Sua vez:**',
      '1. Decisão QA: monta as telas reais em dois cenários e marca cada decisão como atende.',
      'Aguardo sua decisão sobre o PR antes de seguir.',
    ].join(String.fromCharCode(10))
    expect(detect(answer, '', 't')).toEqual([])
    expect(detect('**Resultado:** o build caiu de 40s para 12s.', '', 't')[0]?.kind).toBe('conquista')
  })

  test('12: CRLF não chega ao diff da guarda', async () => {
    expect(diffOf('/r/.env', { old_string: 'A=1\r\nB=2', new_string: 'A=3\r\n' }).diff).not.toContain('\r')
  })

  test('13: singular nas estatísticas do relatório', async () => {
    expect(DICT.pt.stats(1, 1, 2, 0, '3s')).toStartWith('1 ação · 1 arquivo')
    expect(DICT.en.stats(1, 1, 2, 0, '3s')).toStartWith('1 action · 1 file')
  })

  test('14: "build" e "require" não viram Ilusionista', async () => {
    expect(agentClass('general-purpose', 'require the new build step')).not.toBe('ilusionista')
    expect(agentClass('Plan', 'Design the UI flow')).toBe('ilusionista')
  })

  test('6: comandos que escrevem um protegido; ler não conta', async () => {
    const g = makeGuard()
    expect(shellTargets('sed -i s/a/b/ .env.homologacao', g)).toEqual(['.env.homologacao'])
    expect(shellTargets('Set-Content -Path azure-pipelines.yml -Value x', g)).toEqual(['azure-pipelines.yml'])
    expect(shellTargets('cat .env', g)).toEqual([])
    expect(shellTargets('echo oi > notas.txt', g)).toEqual([])
  })

  test('6b: escritor desconhecido que cita um protegido pede aprovação; leituras não', async () => {
    const g = makeGuard()
    expect(shellTargets(`python -c "open('.env','w').write('X')"`, g)).toEqual(['.env'])
    expect(shellTargets('curl -o .env https://exemplo.com/x', g)).toEqual(['.env'])
    expect(shellTargets('curl --output=.env https://exemplo.com/x', g)).toEqual(['.env'])
    expect(shellTargets('cat $(curl -o .env x)', g)).toEqual(['.env'])
    expect(shellTargets('cat .env & curl -o .env x', g)).toEqual(['.env'])
    expect(shellTargets('Get-Content .env', g)).toEqual([])
    expect(shellTargets('cat .env | grep API', g)).toEqual([])
    expect(shellTargets('git diff -- .env', g)).toEqual([])
  })

  test('6c: caminho colado à flag, --output do git e protegido com espaço entre aspas pedem aprovação', async () => {
    const g = makeGuard()
    for (const cmd of [
      'Set-Content -Path:.env -Value x',
      'Out-File -FilePath:.env',
      'echo x | Out-File -FilePath:.env',
      'curl -o.env http://x',
      'wget -O.env http://x',
      'git diff --output=.env',
      'git diff HEAD --output .env',
      'git log -p --output=.env',
      'git show HEAD:x --output=.env',
      // `source` executa um script: não é leitura.
      'source ./limpa.sh .env',
      'source .env',
    ]) {
      expect([cmd, shellTargets(cmd, g)]).toEqual([cmd, ['.env']])
    }
    // O diálogo mostra o arquivo que vai ser escrito, sem a flag colada.
    expect(shellTargets('cp a/.env b/.env', g)).toEqual(['b/.env'])
    expect(shellTargets('Set-Content -Path:C:\\repo\\.env x', g)).toEqual(['C:\\repo\\.env'])
    expect(shellTargets('echo x > "config/azure-pipelines prod.yml"', g)).toEqual(['config/azure-pipelines prod.yml'])
    expect(shellTargets('Set-Content "C:\\Minha Pasta\\.env" x', g)).toEqual(['C:\\Minha Pasta\\.env'])
  })

  test('6d: leitura com o erro redirecionado ou seguida de echo continua sem pergunta', async () => {
    const g = makeGuard()
    for (const cmd of ['cat .env 2>&1', 'cat .env 2>/dev/null', 'Get-Content .env 2>$null', 'grep KEY .env || true', 'cat .env && echo ok']) {
      expect([cmd, shellTargets(cmd, g)]).toEqual([cmd, []])
    }
    expect(shellTargets('cat .env 2>&1 > .env.bak', g)).toEqual(['.env', '.env.bak'])
  })
})

describe('Auditoria de falsos positivos (2026-10-09)', () => {
  test('privacidade: caminhos pessoais em qualquer posição e de qualquer sistema', async () => {
    const paths = { vault: '' }
    for (const leak of ['ver/mnt/c/Users/ana/x', 'em \\\\srv\\share\\ana', 'notas em /root/notas', 'arquivo:C:\\dados\\x']) {
      expect(mentionsPrivate(leak, paths)).toBe(true)
    }
    expect(mentionsPrivate('Veja https://exemplo.com/docs para detalhes.', paths)).toBe(false)
  })

  test('cada uma das 19 classes tem pose de trabalho e de falha, e o seu cenário traduzido', async () => {
    const all = Object.keys(DICT.pt.className) as Cls[]
    expect(all.length).toBe(19)
    for (const cls of all) {
      expect(crabAt(cls, 0, 0, 36, 'work')).not.toBe(crabAt(cls, 0, 0, 36, 'fail'))
      const place = PLACE_OF[cls]
      const stage = stageArt(cls, 'work', place, 350, 170, cls, DICT.en.placeName).source
      expect(stage).toContain(`◆ ${DICT.en.placeName[place].toUpperCase()}`)
    }
    // O acampamento: acordado e dormindo são desenhos diferentes.
    expect(stageArt('aprendiz', 'idle', 'acampamento', 350, 320, 'x').source).not.toBe(stageArt('aprendiz', 'sleep', 'acampamento', 350, 320, 'x').source)
  })

  test('/hero abre nos Primeiros passos até eles serem concluídos', { options: { language: 'pt-BR' } }, async ($, on) => {
    mock.store(on)
    on('session.usage', usage)
    on('session.cwd', () => ({ value: '/repo/loja' }) as never)
    on('ui.open', () => ({ value: { isPlaced: true } }) as never)
    on('config.list', () => ({ value: [] }) as never)
    await $.command.run({ command: 'hero', args: '', origin: { kind: 'user' } } as never)
    const first = await $.ui.mount(pane)
    expect(await first.find({ key: 'setup-done' })).toBeDefined()
    await first.press({ key: 'setup-done' })
    await first.unmount()

    await $.command.run({ command: 'hero', args: '', origin: { kind: 'user' } } as never)
    const after = await $.ui.mount(pane)
    expect(await after.find({ key: 'setup-done' })).toBeUndefined()
    expect(await after.find({ key: 'grimorio' })).toBeDefined()
    await after.unmount()
  })
})

test('/clear, /resume e /branch recarregam as preferências guardadas (o session.start não roda de novo)', { options: { language: 'pt-BR' } }, async ($, on) => {
  const kept = memStore(on as never)
  on('session.usage', usage)
  on('config.list', () => ({ value: [] }) as never)
  // A pessoa escolheu a pele Sóbrio e o modo chefe; o /clear zerou o estado desta sessão.
  kept.set('prefs', { partyJoined: true, skin: 'sobrio', modules: {}, guardMode: 'chefe', grimorioHaiku: false })
  kept.set('setupDone', true)
  // Sem hooks de settings por baixo, o do teste é o fundo da cadeia.
  on('classic.SessionStart', () => ({}) as never)
  await $.classic.SessionStart({ source: 'clear' } as never)
  const ui = await $.ui.mount(pane)
  await ui.press({ key: 'config' })
  expect((await ui.find({ key: 'skin-sobrio' }))?.text).toContain('◉')
  // O modo chefe saiu na 0.6: quem o tinha guardado volta como Perguntar.
  expect((await ui.find({ key: 'guard-dialogo' }))?.text).toContain('◉')
  await ui.unmount()
})

test('revisão do Devin: depois de uma compactação que esvazia a mochila, o cartão de compactar sai', { options: { language: 'pt-BR' } }, async ($, on) => {
  const kept = memStore(on as never)
  kept.set('setupDone', true)
  let tokens = 150_000
  const breakdown = { categories: [], autoCompactThreshold: 160_000, isAutoCompactEnabled: true }
  on('session.usage', () => ({ value: { startedAt: 0, context: { tokens, window: 200_000, breakdown }, rateLimits: [] } }) as never)
  on('config.list', () => ({ value: [] }) as never)
  on('classic.SessionStart', () => ({}) as never)
  on('session.compact', () => ({ messages: [{ role: 'user', text: 'resumo', toolUses: [] }], tokensBefore: 150_000, tokensAfter: 30_000 }) as never)
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Box', props: {}, children: [] }) as never)
  const band = {
    plugin: PLUGIN,
    surface: 'desktop',
    component: 'AbovePrompt',
    requestId: 'band',
    props: { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 100, scroll: { offset: 0, bodyRows: 12 }, view: {} },
  } as const

  // 150k de 160k: a mochila passa de 85% e o cartão entra.
  await $.classic.SessionStart({ source: 'resume' } as never)
  const before = await $.ui.mount(band)
  expect(await before.find({ key: 'card-now' })).toBeDefined()
  await before.unmount()

  // O Claude Code compacta sozinho: a próxima leitura traz a mochila em 30k e o cartão sai.
  tokens = 30_000
  await $.classic.SessionStart({ source: 'resume' } as never)
  const after = await $.ui.mount(band)
  expect(await after.find({ key: 'card-now' })).toBeUndefined()
  await after.unmount()
})
