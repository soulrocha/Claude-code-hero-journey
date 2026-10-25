import { expect, mock, test } from 'claude-code/testing'

const PLUGIN = 'hero-journey'

const pane = {
  plugin: PLUGIN,
  surface: 'desktop',
  component: 'Pane',
  requestId: 'hero-journey',
  props: { title: 'Hero Journey', isFocused: true, bodyColumns: 52, placement: 'dock', scroll: { offset: 0, bodyRows: 60 }, view: {} },
  viewport: { columns: 170, rows: 60, isFullscreen: true },
} as const

/** As inscrições ficam guardadas em silêncio; o 📖 (aqui o /grimorio) chama o Mago acima do prompt. */
/** A inscrição agora é um cartão Svg: procura no alt dele ou num Text. */
const seen = async (ui: { findAll: (q: never) => Promise<{ props: { alt?: unknown } }[]>; find: (q: never) => Promise<unknown> }, re: RegExp) =>
  (await ui.findAll({ type: 'Svg' } as never)).some(s => re.test(String(s.props.alt))) || (await ui.find({ text: re } as never)) !== undefined

const openGrimoire = ($: { command: { run: (e: never) => Promise<unknown> } }) =>
  $.command.run({ command: 'grimorio', args: '', origin: { kind: 'user' } } as never)

const band = {
  plugin: PLUGIN,
  surface: 'desktop',
  component: 'AbovePrompt',
  requestId: 'band',
  props: { hasSurvey: false, isWorking: false, maxRows: 30, bodyColumns: 100, scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

const usage = () => ({ value: { startedAt: 0, context: { percent: 40, window: 200000 }, rateLimits: [] } }) as never
// No Windows o motor de testes entrega '/repo/x' como 'C:\repo\x'; os mocks comparam a forma Unix.
const at = (e: unknown) => (e as { path: string }).path.replace(/^[A-Za-z]:/, '').replace(/\\/g, '/')
const emptyBand = () => ({ type: 'Box', props: {}, children: [] }) as never
const edited = () => ({ result: { filePath: 'x', structuredPatch: [] } }) as never

/** Responde o diálogo com um rótulo e guarda o que foi perguntado. */
const answering = (label: string, seen: { question?: string; options?: string[] }) =>
  ((_$: unknown, e: { questions: { question: string; options: { label: string }[] }[] }) => {
    seen.question = e.questions[0]?.question
    seen.options = e.questions[0]?.options.map(o => o.label)
    return { result: { questions: e.questions, answers: { [e.questions[0]?.question ?? '']: label } } }
  }) as never

const editEnv = ($: { tool: { call: (x: never) => Promise<{ deny?: string }> } }) =>
  $.tool.call({ tool: 'Edit', tool_use_id: 'g1', file_path: '/repo/.env.homologacao', old_string: 'A=1', new_string: 'A=2' } as never)

test('guarda, diálogo: Recusar bloqueia e entra no relatório; Aprovar deixa passar', { options: { language: 'pt-BR' } }, async ($, on) => {
  const seen: { question?: string; options?: string[] } = {}
  let answer = 'Recusar'
  on('tool.call', { tool: 'AskUserQuestion' }, ((x: unknown, e: never) => answering(answer, seen)(x as never, e)) as never)
  on('tool.call', { tool: 'Edit' }, edited)

  const refused = await editEnv($ as never)
  expect(refused.deny).toContain('recusou')
  expect(seen.options).toEqual(['Aprovar', 'Editar no chat', 'Recusar'])
  expect(seen.question).toContain('.env.homologacao')

  answer = 'Aprovar'
  const approved = await editEnv($ as never)
  expect(approved.deny).toBeUndefined()

  const free = await $.tool.call({ tool: 'Edit', tool_use_id: 'g2', file_path: '/repo/src/app.ts', old_string: 'a', new_string: 'b' } as never)
  expect(free.deny).toBeUndefined()
})

test('guarda, diálogo: Editar no chat bloqueia e leva o rascunho ao prompt', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('tool.call', { tool: 'AskUserQuestion' }, answering('Editar no chat', {}))
  on('tool.call', { tool: 'Edit' }, edited)
  let filled = ''
  on('prompt.fill', ($$, e) => {
    filled = e.text
    return { isFilled: true } as never
  })
  const r = await editEnv($ as never)
  expect(r.deny).toContain('ajustar')
  expect(filled).toBe('Sobre a mudança em .env.homologacao: ')
})

test('guarda: o dragão barra em inglês também; no ⚙ só Perguntar e Só avisar', { options: { language: 'en' } }, async ($, on) => {
  mock.store(on)
  on('session.usage', usage)
  const seen: { question?: string; options?: string[] } = {}
  on('tool.call', { tool: 'AskUserQuestion' }, answering('Approve', seen))
  on('tool.call', { tool: 'Edit' }, edited)

  const ui = await $.ui.mount(pane)
  await ui.press({ key: 'config' })
  expect((await ui.find({ key: 'guard-dialogo' }))?.text).toContain('◉ Ask')
  expect(await ui.find({ key: 'guard-nativo' })).toBeDefined()
  expect(await ui.find({ key: 'guard-chefe' })).toBeUndefined()
  await ui.unmount()

  const r = await editEnv($ as never)
  expect(seen.question).toContain('The dragon blocks .env.homologacao')
  expect(seen.options).toEqual(['Approve', 'Edit in chat', 'Refuse'])
  expect(r.deny).toBeUndefined()
})

test('guarda desligado no ⚙ não pergunta nada', { options: { language: 'pt-BR' } }, async ($, on) => {
  mock.store(on)
  on('session.usage', usage)
  let asked = 0
  on('tool.call', { tool: 'AskUserQuestion' }, (() => {
    asked += 1
    return { result: { questions: [], answers: {} } }
  }) as never)
  on('tool.call', { tool: 'Edit' }, edited)

  const ui = await $.ui.mount(pane)
  await ui.press({ key: 'config' })
  await ui.press({ key: 'mod-guarda' })
  expect((await ui.find({ key: 'mod-guarda' }))?.text).toContain('☐')
  await ui.unmount()

  const r = await editEnv($ as never)
  expect(r.deny).toBeUndefined()
  expect(asked).toBe(0)
})

test('campanha: mensagem abre o capítulo, o fim do turno guarda o relatório', { options: { language: 'pt-BR' } }, async ($, on) => {
  const kept = new Map<string, unknown>()
  on('store.get', ($, e) => ({ value: kept.get(e.key) }) as never)
  on('store.set', ($, e) => {
    kept.set(e.key, e.value)
    return { value: undefined } as never
  })
  on('store.delete', ($, e) => {
    kept.delete(e.key)
    return { value: undefined } as never
  })
  on('store.keys', () => ({ value: [...kept.keys()] }) as never)
  on('session.usage', usage)
  on('session.id', () => ({ value: 'sessao-1' }) as never)
  on('prompt.submit', ($$, e) => ({ text: (e as { text: string }).text }) as never)
  on('turn.start', () => ({ turnId: 't1' }) as never)
  on('turn.complete', () => ({ text: '' }) as never)
  on('tool.call', { tool: 'Edit' }, edited)

  await $.prompt.submit({ text: 'Implementar o login com Azure AD', wait: false } as never)
  await $.turn.start({ text: 'Implementar o login com Azure AD', turnId: 't1' } as never)
  await $.tool.call({ tool: 'Edit', tool_use_id: 'c1', file_path: '/repo/src/login.ts', old_string: 'a', new_string: 'b' } as never)
  await $.turn.complete({
    turnId: 't1',
    reason: 'answer',
    durationMs: 42000,
    isAborted: false,
    answer: '**Missão:** Login com Azure AD\n**Resultado:** 12 testes passando\n**Próximo:** abrir o PR',
  } as never)

  // O relatório saiu do painel (o detalhe fica na resposta final), mas continua guardado na campanha.
  const saved = kept.get('campanha:sessao-1') as { objective: string; chapters: { report?: { title: string; result?: string } }[] }
  expect(saved.objective).toBe('Implementar o login com Azure AD')
  expect(saved.chapters[0]?.report?.title).toBe('Login com Azure AD')
  expect(saved.chapters[0]?.report?.result).toContain('12 testes passando')
  const ui = await $.ui.mount(pane)
  expect(await ui.find({ key: 'report-approve' })).toBeUndefined()
  // O turno acabou: o acampamento, a sua vez e o objetivo curto saído da Missão.
  expect(String((await ui.find({ type: 'Svg' }))?.props.alt)).toContain('Sua vez')
  expect(await ui.find({ text: /^Login com Azure AD$/ })).toBeDefined()
  // Sem o título do app, o ✦ Recalibrar fica à mão.
  expect(await ui.find({ key: 'recalibrate' })).toBeDefined()
  await ui.unmount()
})

test('palco: a classe da ferramenta em curso no cenário dela; na falha, tropeça', { options: { language: 'pt-BR' } }, async ($, on) => {
  mock.store(on)
  on('session.usage', usage)
  on('turn.start', () => ({ turnId: 't1' }) as never)
  on('tool.call', { tool: 'Edit' }, edited)
  on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: '', stderr: 'erro', interrupted: false }, isError: true }) as never)

  // Antes de qualquer ferramenta, o Aprendiz pensa no campo de treino.
  await $.turn.start({ text: 'Implementar o login', turnId: 't1' } as never)
  let ui = await $.ui.mount(pane)
  expect(String((await ui.find({ type: 'Svg' }))?.props.alt)).toBe('Aprendiz pensando')
  await ui.unmount()

  await $.tool.call({ tool: 'Edit', tool_use_id: 'c1', file_path: '/repo/src/login.ts', old_string: 'a', new_string: 'b' } as never)
  ui = await $.ui.mount(pane)
  expect(String((await ui.find({ type: 'Svg' }))?.props.alt)).toBe('Rúnico escrevendo')
  expect(await ui.find({ text: /src\/login\.ts/ })).toBeDefined()
  await ui.unmount()

  await $.tool.call({ tool: 'Bash', tool_use_id: 'c2', command: 'npm install', description: 'Instala as dependências' } as never)
  ui = await $.ui.mount(pane)
  expect(String((await ui.find({ type: 'Svg' }))?.props.alt)).toBe('Engenheiro tropeçou')
  expect(await ui.find({ text: /Instala as dependências falhou/ })).toBeDefined()
  await ui.unmount()
})

test('o spinner do turno diz quem age e o que faz', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('tool.call', { tool: 'Read' }, () => ({ result: { type: 'text', file: { content: '' } } }) as never)
  let message: string | null | undefined
  on('ui.render', { component: 'Spinner' }, ($$, e) => {
    message = (e as { props: { message: string | null } }).props.message
    return { type: 'Text', props: {}, children: [message ?? ''] } as never
  })
  const spinner = (mode: string) =>
    $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Spinner', requestId: 'sp', props: { word: 'Reading', message: null, suffix: '…', mode } } as never)

  let ui = await spinner('thinking')
  expect(message).toBe('Aprendiz pensando')
  await ui.unmount()
  await $.tool.call({ tool: 'Read', tool_use_id: 'r1', file_path: '/repo/hooks/core/art.ts' } as never)
  ui = await spinner('tool-use')
  expect(message).toBe('Mago lendo art.ts')
  await ui.unmount()
  // O que o motor não diferencia (requesting) fica com a palavra dele.
  ui = await spinner('requesting')
  expect(message).toBeNull()
  await ui.unmount()
})

/** Um grimório com vault em /vault (se a opção pedir) e o ai-memory opcional, para os testes de gravação. */
const grimEngine = (on: Parameters<Parameters<typeof test>[2]>[1], files: Record<string, string>, toasts: string[], vaultOk = true, writes: string[] = [], store: Record<string, unknown> = {}) => {
  mock.store(on, store)
  on('session.usage', usage)
  on('session.cwd', () => ({ value: '/repo' }) as never)
  on('turn.complete', () => ({ text: '' }) as never)
  on('ui.render', { component: 'AbovePrompt' }, emptyBand)
  on('ui.open', () => ({ value: { isPlaced: true } }) as never)
  on('ui.toast', ((_: unknown, e: { text: string }) => {
    toasts.push(e.text)
    return { value: undefined }
  }) as never)
  on('fs.stat', ($$, e) =>
    vaultOk && at(e) === '/vault' ? ({ value: { kind: 'dir', size: 0, mtimeMs: 0, isLink: false, realPath: '/vault' } } as never) : ({ deny: 'not found' } as never),
  )
  on('fs.exists', ($$, e) => ({ value: at(e) in files }) as never)
  on('fs.read', ($$, e) => ({ value: files[at(e)] ?? '' }) as never)
  on('fs.list', ($$, e) => {
    const dir = at(e).replace(/\/$/, '')
    const names = Object.keys(files)
      .filter(k => k.startsWith(`${dir}/`) && !k.slice(dir.length + 1).includes('/'))
      .map(k => ({ name: k.slice(dir.length + 1), kind: 'file', size: 0, mtimeMs: 0, isLink: false }))
    return { value: names } as never
  })
  // Gravação lenta, para dois cliques seguidos em Selar se cruzarem de verdade.
  on('fs.write', async ($$, e) => {
    writes.push(at(e))
    await new Promise(r => setTimeout(r, 20))
    files[at(e)] = (e as { text: string }).text
    return { value: undefined } as never
  })
}

const answerTurn = (answer: string) => ({ turnId: 't9', reason: 'answer', durationMs: 1000, isAborted: false, answer }) as never
const DECISION_ID = 't9-0-decidimos-que-listas-grandes-paginam-sem'

test('grimório: guarda em silêncio, pergunta onde guardar a primeira decisão e só grava no Selar', { options: { language: 'pt-BR' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  grimEngine(on, files, toasts)
  on('turn.start', ($$, e) => ({ turnId: (e as { turnId: string }).turnId }) as never)
  await $.turn.start({ text: 'A partir de agora, sempre rode os testes antes do commit.', turnId: 't9' } as never)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  expect(Object.keys(files)).toEqual([])

  await openGrimoire($)
  const page = await $.ui.mount(pane)
  expect(await seen(page, /paginam sempre no servidor/)).toBe(true)
  // Sem vault, a decisão ainda não tem destino: a página pergunta; a regra já vai para o AGENTS.md.
  expect(await page.find({ text: /Onde guardo suas decisões/ })).toBeDefined()
  expect(await page.find({ text: /→ AGENTS\.md/ })).toBeDefined()
  expect((await page.find({ key: 'grim-seal' }))?.text).toContain('Selar no grimório · 2')
  await page.press({ key: 'grim-home-projeto' })
  await page.press({ key: 'grim-seal' })
  await page.unmount()

  expect(files['/repo/AGENTS.md']).toContain('## Regras')
  expect(files['/repo/AGENTS.md']).toContain('sempre rode os testes antes do commit')
  expect(Object.keys(files).some(k => k.startsWith('/repo/docs/decisoes/') && files[k]!.includes('paginam sempre no servidor'))).toBe(true)
  expect(toasts.some(t => t.includes('2 inscrições seladas'))).toBe(true)
})

test('grimório: duas notas com o mesmo começo não se sobrescrevem, nem a de outra sessão', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const day = new Date().toISOString().slice(0, 10)
  const base = `/vault/Inbox/decisao-pendente-${day}-decidimos-que-listas-grandes-paginam-sem`
  const files: Record<string, string> = { [`${base}.md`]: 'ANTIGA' }
  grimEngine(on, files, [])
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor. Decidimos que listas grandes paginam sempre no cliente.'))
  await openGrimoire($)
  const page = await $.ui.mount(pane)
  await page.press({ key: 'grim-seal' })
  await page.unmount()
  expect(files[`${base}.md`]).toBe('ANTIGA')
  expect(files[`${base}-2.md`]).toContain('servidor')
  expect(files[`${base}-3.md`]).toContain('cliente')
})

test('grimório: dois cliques seguidos em Selar gravam uma vez só e avisam no segundo', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  const writes: string[] = []
  grimEngine(on, files, toasts, true, writes)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  await openGrimoire($)
  const page = await $.ui.mount(pane)
  await Promise.all([page.press({ key: 'grim-seal' }), page.press({ key: 'grim-seal' })])
  await page.unmount()
  expect(writes.length).toBe(1)
  expect(toasts.filter(t => t.includes('selada')).length).toBe(1)
  expect(toasts.some(t => t.includes('O grimório já está gravando'))).toBe(true)
})

/** O Claude Code sem língua configurada, num sistema em português: só a opção do mod decide. */
const langEngine = (on: Parameters<Parameters<typeof test>[2]>[1]) => {
  mock.store(on)
  on('session.start', () => ({ cwd: '/repo' }) as never)
  on('session.usage', usage)
  on('session.cwd', () => ({ value: '/repo' }) as never)
  on('settings.read', () => ({ value: {} }) as never)
  on('env.get', ($$, e) => ({ value: (e as { name: string }).name === 'LANG' ? 'pt_BR.UTF-8' : undefined }) as never)
  on('process.run', () => ({ value: { exitCode: 1, stdout: '', stderr: '' } }) as never)
  on('config.list', () => ({ value: [] }) as never)
  on('ui.open', () => ({ value: { isPlaced: true } }) as never)
  on('command.register', () => ({ value: undefined }) as never)
  on('session.id', () => ({ value: 's1' }) as never)
  on('turn.complete', () => ({ text: '' }) as never)
  on('fs.list', () => ({ value: [] }) as never)
  on('ui.render', { component: 'AbovePrompt' }, emptyBand)
}

for (const [language, seal] of [['en', 'Seal in the grimoire'], ['auto', 'Selar no grimório'], ['pt-BR', 'Selar no grimório']] as const) {
  test(`língua ${language}: a fixada vence o sistema; auto segue o sistema`, { options: { language } }, async ($, on) => {
    langEngine(on)
    await $.session.start({ cwd: '/repo', surface: 'desktop', isInteractive: true } as never)
    await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
    await openGrimoire($)
    const page = await $.ui.mount(pane)
    expect((await page.find({ key: 'grim-seal' }))?.text).toContain(seal)
    await page.unmount()
  })
}

test('grimório: vault da configuração que não existe não recebe gravação', { options: { language: 'pt-BR', vaultPath: '/nao/existe' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  grimEngine(on, files, toasts, false)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  await openGrimoire($)
  const page = await $.ui.mount(pane)
  await page.press({ key: 'grim-seal' })
  expect(Object.keys(files).some(k => k.startsWith('/nao/existe'))).toBe(false)
  expect(toasts.some(t => t.includes('A pasta não existe'))).toBe(true)
  expect(toasts.some(t => t.includes('pendente'))).toBe(true)
  expect(await seen(page, /paginam sempre no servidor/)).toBe(true)
  await page.unmount()
})

test('grimório: o ai-memory que falha deixa a inscrição pendente, e o próximo Selar tenta de novo', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  grimEngine(on, files, toasts)
  on('tool.list', () => ({ value: [{ name: 'mcp__ai-memory__memory_write_page', description: '', mcp: true }] }) as never)
  let mode: 'erro' | 'excecao' | 'ok' = 'erro'
  let calls = 0
  on('mcp.call', ($$, e) => {
    if ((e as { tool: string }).tool !== 'memory_write_page') return { value: { content: [{ type: 'text', text: '{}' }], isError: false } } as never
    calls += 1
    if (mode === 'excecao') return { deny: 'servidor caiu' } as never
    return { value: { content: [{ type: 'text', text: mode === 'erro' ? 'disco cheio' : '{}' }], isError: mode === 'erro' } } as never
  })
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  await openGrimoire($)
  const page = await $.ui.mount(pane)
  // Um destino só: o clique troca vault → projeto → ai-memory.
  await page.press({ key: `dest-${DECISION_ID}` })
  await page.press({ key: `dest-${DECISION_ID}` })
  expect((await page.find({ key: `dest-${DECISION_ID}` }))?.text).toContain('ai-memory')

  await page.press({ key: 'grim-seal' })
  expect(toasts.some(t => t.includes('pendente') && t.includes('disco cheio'))).toBe(true)
  expect(await seen(page, /paginam sempre no servidor/)).toBe(true)
  mode = 'excecao'
  await page.press({ key: 'grim-seal' })
  expect(await seen(page, /paginam sempre no servidor/)).toBe(true)
  mode = 'ok'
  await page.press({ key: 'grim-seal' })
  await page.unmount()
  expect(calls).toBe(3)
  expect(Object.keys(files).filter(k => k.startsWith('/vault/')).length).toBe(0)
  expect(toasts.some(t => t.includes('1 inscrição selada'))).toBe(true)
})

test('grimório: toda chamada ao ai-memory leva o workspace do marcador e o projeto do remoto', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const files: Record<string, string> = { '/home/eu/.ai-memory.toml': 'workspace = "pessoal"\n\n[recall]\ndefault_global = true\n' }
  const toasts: string[] = []
  grimEngine(on, files, toasts)
  mock.env(on, { HOME: '/home/eu' })
  on('process.run', ($$, e) => {
    const argv = (e as { argv: readonly string[] }).argv.join(' ')
    if (argv === 'git remote get-url origin') return { value: { exitCode: 0, stdout: 'https://github.com/soulrocha/Claude-code-hero-journey.git\n', stderr: '' } } as never
    return { value: { exitCode: 1, stdout: '', stderr: '' } } as never
  })
  on('tool.list', () => ({ value: [{ name: 'mcp__ai-memory__memory_write_page', description: '', mcp: true }] }) as never)
  const args: Record<string, unknown>[] = []
  on('mcp.call', ($$, e) => {
    args.push((e as { args: Record<string, unknown> }).args)
    return { value: { content: [{ type: 'text', text: '{}' }], isError: false } } as never
  })
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  await openGrimoire($)
  const page = await $.ui.mount(pane)
  await page.press({ key: `dest-${DECISION_ID}` })
  await page.press({ key: `dest-${DECISION_ID}` })
  await page.press({ key: 'grim-seal' })
  await page.unmount()
  expect(args.length).toBeGreaterThan(0)
  for (const a of args) expect(a).toMatchObject({ workspace: 'pessoal', project: 'soulrocha-claude-code-hero-journey' })
})

test('grimório: MCP que cai antes do Selar deixa a inscrição pendente; com ele de volta, grava', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  grimEngine(on, files, toasts)
  let mcpOn = true
  on('tool.list', () => ({ value: mcpOn ? [{ name: 'mcp__ai-memory__memory_write_page', description: '', mcp: true }] : [] }) as never)
  let calls = 0
  on('mcp.call', ($$, e) => {
    if ((e as { tool: string }).tool === 'memory_write_page') calls += 1
    return { value: { content: [{ type: 'text', text: '{}' }], isError: false } } as never
  })
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  await openGrimoire($)
  const page = await $.ui.mount(pane)
  await page.press({ key: `dest-${DECISION_ID}` })
  await page.press({ key: `dest-${DECISION_ID}` })
  mcpOn = false
  await page.press({ key: 'grim-seal' })
  expect(calls).toBe(0)
  expect(toasts.some(t => t.includes('continua pendente'))).toBe(true)
  mcpOn = true
  await page.press({ key: 'grim-seal' })
  await page.unmount()
  expect(calls).toBe(1)
})

test('grimório: pasta de entrada do /config que sai do vault não recebe gravação', { options: { language: 'pt-BR', vaultPath: '/vault', vaultInbox: '../fora' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  grimEngine(on, files, toasts)
  on('tool.list', () => ({ value: [] }) as never)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  await openGrimoire($)
  const page = await $.ui.mount(pane)
  await page.press({ key: 'grim-seal' })
  expect(Object.keys(files)).toEqual([])
  expect(toasts.some(t => t.includes('precisa ser uma subpasta'))).toBe(true)
  expect(await seen(page, /paginam sempre no servidor/)).toBe(true)
  await page.unmount()
})

test('grimório: Desfazer tira a linha do AGENTS.md e devolve a regra para guardar', { options: { language: 'pt-BR' } }, async ($, on) => {
  const files: Record<string, string> = { '/repo/AGENTS.md': '# Projeto\n' }
  const toasts: string[] = []
  grimEngine(on, files, toasts)
  on('turn.start', ($$, e) => ({ turnId: (e as { turnId: string }).turnId }) as never)
  await $.turn.start({ text: 'A partir de agora, sempre rode os testes antes do commit.', turnId: 't9' } as never)
  await $.turn.complete(answerTurn('Feito.'))
  await openGrimoire($)
  const page = await $.ui.mount(pane)
  await page.press({ key: 'grim-seal' })
  expect(files['/repo/AGENTS.md']).toContain('sempre rode os testes')
  await page.press({ key: 'undo-t9-0-a-partir-de-agora-sempre-rode-os-testes-' })
  await page.unmount()
  expect(files['/repo/AGENTS.md']).not.toContain('sempre rode os testes')
  expect(toasts.some(t => t.includes('Desfeito'))).toBe(true)
  const again = await $.ui.mount(pane)
  expect((await again.find({ key: 'grim-seal' }))?.text).toContain('· 1')
  await again.unmount()
})

test('grimório: Desfazer não apaga a regra que já estava no AGENTS.md antes do Selar', { options: { language: 'pt-BR' } }, async ($, on) => {
  const files: Record<string, string> = { '/repo/AGENTS.md': '# Projeto\n' }
  const toasts: string[] = []
  grimEngine(on, files, toasts)
  on('turn.start', ($$, e) => ({ turnId: (e as { turnId: string }).turnId }) as never)
  await $.turn.start({ text: 'A partir de agora, sempre rode os testes antes do commit.', turnId: 't9' } as never)
  await $.turn.complete(answerTurn('Feito.'))
  await openGrimoire($)
  const page = await $.ui.mount(pane)
  const undo = 'undo-t9-0-a-partir-de-agora-sempre-rode-os-testes-'
  // A linha exata que o Selar grava (com a data de hoje), para ela já existir antes do próximo Selar.
  await page.press({ key: 'grim-seal' })
  const withRule = files['/repo/AGENTS.md']!
  await page.press({ key: undo })
  files['/repo/AGENTS.md'] = withRule
  await page.press({ key: 'grim-seal' })
  expect(files['/repo/AGENTS.md']).toBe(withRule)
  // O Selar não gravou nada (a regra já estava lá): não há o que desfazer, e a linha de antes fica.
  expect(await page.find({ key: undo })).toBeUndefined()
  await page.unmount()
  expect(files['/repo/AGENTS.md']).toBe(withRule)
})

test('grimório: desligado no ⚙ Memória, a crônica não junta mais decisões', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  grimEngine(on, {}, [])
  const p = await $.ui.mount(pane)
  await p.press({ key: 'config' })
  await p.press({ key: 'mem-open' })
  await p.press({ key: 'mem-cronica' })
  await p.unmount()
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  await openGrimoire($)
  const page = await $.ui.mount(pane)
  expect(await seen(page, /paginam sempre no servidor/)).toBe(false)
  expect(await page.find({ text: /Nada para guardar/ })).toBeDefined()
  await page.unmount()
})

test('grimório: o plano que fecha com algo anotado abre o cartão de fim de marco', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  grimEngine(on, {}, [])
  on('tool.call', { tool: 'TodoWrite' }, () => ({ result: {} }) as never)
  await $.tool.call({
    tool: 'TodoWrite',
    tool_use_id: 'td',
    todos: [
      { content: 'Remapear as classes', status: 'completed', activeForm: '' },
      { content: 'Painel com o palco', status: 'completed', activeForm: '' },
    ],
  } as never)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  const card = await $.ui.mount(band)
  expect(await card.find({ text: /Marco fechado/ })).toBeDefined()
  expect(await card.find({ text: /2 de 2 passos/ })).toBeDefined()
  expect((await card.find({ key: 'grim-seal' }))?.text).toContain('Selar no grimório · 1')
  await card.unmount()
})

test('salvar progresso: a tarefa vai para o projeto (fora do git) e o Continuar a lê na sessão seguinte', { options: { language: 'pt-BR' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  grimEngine(on, files, toasts)
  on('session.id', () => ({ value: 'sessao-1' }) as never)
  on('prompt.submit', ($$, e) => ({ text: (e as { text: string }).text }) as never)
  on('turn.start', ($$, e) => ({ turnId: (e as { turnId: string }).turnId }) as never)
  on('classic.SessionStart', () => ({}) as never)
  let compacted = false
  on('session.compact', () => {
    compacted = true
    return { messages: [{ role: 'user', text: 'resumo', toolUses: [] }], tokensBefore: 180000, tokensAfter: 40000 } as never
  })
  let filled = ''
  on('prompt.fill', ($$, e) => {
    filled = (e as { text: string }).text
    return { isFilled: true } as never
  })
  await $.prompt.submit({ text: 'Implementar o login com Azure AD', wait: false } as never)
  await $.turn.start({ text: 'Implementar o login com Azure AD', turnId: 't1' } as never)
  await $.turn.complete({ turnId: 't1', reason: 'answer', durationMs: 1000, isAborted: false, answer: '**Missão:** Login com Azure AD\n**Próximo:** abrir o PR' } as never)

  // A Mochila leva ao cartão de compactar, que oferece salvar o progresso antes.
  const p = await $.ui.mount(pane)
  await p.press({ key: 'compact' })
  await p.unmount()
  const card = await $.ui.mount(band)
  expect(await card.find({ text: /Antes, salvar o progresso/ })).toBeDefined()
  await card.press({ key: 'card-both' })
  await card.unmount()

  const task = Object.keys(files).find(k => /^\/repo\/\.hero\/tarefas\/R-001\.md$/.test(k))
  expect(task).toBeDefined()
  expect(files[task!]).toContain('# R-001: Login com Azure AD')
  expect(files[task!]).toContain('## Próximo passo\nabrir o PR')
  expect(files['/repo/.hero/.gitignore']).toBe('*\n')
  expect(compacted).toBe(true)
  expect(toasts.some(t => t.includes('Progresso salvo: R-001'))).toBe(true)

})

test('continuar: na sessão nova, o acampamento lista a tarefa salva e leva ao prompt o pedido de retomá-la', { options: { language: 'pt-BR' } }, async ($, on) => {
  const task = [
    '---',
    'id: R-003',
    'status: em-andamento',
    'projeto: repo',
    'atualizado: 2026-10-11 18:40',
    '---',
    '',
    '# R-003: Login com Azure AD',
    '',
    '## Objetivo',
    'Implementar o login.',
    '',
    '## Próximo passo',
    'abrir o PR',
    '',
    '## Como verificar',
    'npm test',
    '',
    '## Já tentado e falhou',
    '- (vazio)',
    '',
    '## Log',
    '- 2026-10-11 18:40 | pc-casa | Claude Code | 4 ações',
    '',
  ].join('\n')
  const files: Record<string, string> = { '/repo/.hero/tarefas/R-003.md': task, '/repo/.hero/tarefas/R-004.md': task.replace('em-andamento', 'concluida').replace(/R-003/g, 'R-004') }
  grimEngine(on, files, [], true, [], { setupDone: true })
  on('classic.SessionStart', () => ({}) as never)
  let filled = ''
  on('prompt.fill', ($$, e) => {
    filled = (e as { text: string }).text
    return { isFilled: true } as never
  })
  await $.classic.SessionStart({ source: 'clear' } as never)
  const camp = await $.ui.mount(pane)
  expect(await camp.find({ text: /Login com Azure AD/ })).toBeDefined()
  expect(await camp.find({ text: /próximo: abrir o PR/ })).toBeDefined()
  // A tarefa concluída não aparece para continuar.
  expect(await camp.find({ key: 'cont-go-R-004' })).toBeUndefined()
  // Sem ai-memory, a dica de continuar em outro agente aparece aqui, quando faz sentido.
  expect(await camp.find({ text: /O ai-memory faz isso/ })).toBeDefined()
  await camp.press({ key: 'cont-go-R-003' })
  await camp.unmount()
  expect(filled).toContain('Continue a tarefa "Login com Azure AD"')
  expect(filled).toContain('R-003.md')
})

test('mochila: Compactar agora só com o Claude parado', { options: { language: 'pt-BR' } }, async ($, on) => {
  mock.store(on)
  on('session.usage', usage)
  let filled = ''
  on('prompt.fill', ($$, e) => {
    filled = (e as { text: string }).text
    return { isFilled: true } as never
  })
  on('ui.render', { component: 'AbovePrompt' }, emptyBand)
  let compacted = ''
  on('session.compact', ($$, e) => {
    compacted = String((e as { instructions?: string }).instructions)
    return { messages: [{ role: 'user', text: 'resumo', toolUses: [] }], tokensBefore: 180000, tokensAfter: 40000 } as never
  })

  // A Mochila do rodapé é o botão de compactar.
  const p = await $.ui.mount(pane)
  await p.press({ key: 'compact' })
  await p.unmount()

  // Trabalhando, o Compactar leva o /compact ao prompt em vez de compactar.
  const busy = await $.ui.mount({ ...band, props: { ...band.props, isWorking: true } })
  await busy.press({ key: 'card-now' })
  expect(filled).toStartWith('/compact ')
  expect(compacted).toBe('')
  await busy.unmount()
  await $.ui.mount(pane).then(async x => {
    await x.press({ key: 'compact' })
    await x.unmount()
  })

  const idle = await $.ui.mount(band)
  await idle.press({ key: 'card-now' })
  expect(compacted).toContain('Mantenha o objetivo')
  await idle.unmount()
})

test('grimório (B2b): arquivo já existente com conteúdo idêntico é tratado como idempotente sem criar -2.md', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const day = new Date().toISOString().slice(0, 10)
  const base = `/vault/Inbox/decisao-pendente-${day}-decidimos-que-listas-grandes-paginam-sem.md`
  const exact = `---\ntipo: decisao\ndata: ${day}\norigem: hero-journey\n---\n\nDecidimos que listas grandes paginam sempre no servidor.\n`
  const files: Record<string, string> = { [base]: exact }
  const toasts: string[] = []
  const writes: string[] = []
  grimEngine(on, files, toasts, true, writes)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  await openGrimoire($)
  const page = await $.ui.mount(pane)
  await page.press({ key: 'grim-seal' })
  await page.unmount()
  expect(writes).toEqual([])
  expect(files[base]).toBe(exact)
  expect(Object.keys(files).some(k => k.endsWith('-2.md'))).toBe(false)
  expect(toasts.some(t => t.includes('1 inscrição selada'))).toBe(true)
})

test('salvar progresso (B2c e B2d): cria campanha via turn.start, cria pasta-pai se faltar e avisa erro real de leitura', { options: { language: 'pt-BR' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  const store = new Map<string, unknown>()
  on('store.get', ($$, e) => ({ value: store.get((e as { key: string }).key) }) as never)
  on('store.set', ($$, e) => {
    store.set((e as { key: string }).key, (e as { value: unknown }).value)
    return { value: undefined } as never
  })
  on('session.usage', usage)
  on('session.cwd', () => ({ value: '/repo' }) as never)
  on('session.id', () => ({ value: 'sessao-cli' }) as never)
  on('turn.start', ($$, e) => ({ turnId: (e as { turnId: string }).turnId }) as never)
  on('turn.complete', () => ({ text: '' }) as never)
  on('ui.render', { component: 'AbovePrompt' }, emptyBand)
  on('ui.toast', ((_: unknown, e: { text: string }) => {
    toasts.push(e.text)
    return { value: undefined }
  }) as never)
  let dirCreated = false
  let listError = false
  on('process.run', () => {
    dirCreated = true
    return { value: { exitCode: 0, stdout: '', stderr: '' } } as never
  })
  on('fs.exists', ($$, e) => ({ value: at(e) in files }) as never)
  on('fs.read', ($$, e) => ({ value: files[at(e)] ?? '' }) as never)
  on('fs.list', () => (listError ? ({ deny: 'EACCES: permissão negada' } as never) : ({ value: [] } as never)))
  on('fs.write', ($$, e) => {
    if (!dirCreated) return { deny: 'ENOENT: no such file or directory' } as never
    files[at(e)] = (e as { text: string }).text
    return { value: undefined } as never
  })
  on('session.compact', () => ({ messages: [{ role: 'user', text: 'resumo', toolUses: [] }], tokensBefore: 100000, tokensAfter: 20000 }) as never)

  // Sem prompt.submit prévio: turn.start cria a campanha sozinho.
  await $.turn.start({ text: 'Corrigir o parser de diff', turnId: 't1' } as never)
  await $.turn.complete({ turnId: 't1', reason: 'answer', durationMs: 1000, isAborted: false, answer: '**Missão:** Parser de diff\n**Próximo:** rodar testes' } as never)

  const p = await $.ui.mount(pane)
  await p.press({ key: 'compact' })
  await p.unmount()
  const card = await $.ui.mount(band)
  await card.press({ key: 'card-both' })
  await card.unmount()

  expect(dirCreated).toBe(true)
  expect(files['/repo/.hero/tarefas/R-001.md']).toContain('# R-001: Parser de diff')

  // B2d: se fs.list falhar por permissão, não sobrescreve R-001.md e avisa no toast.
  listError = true
  store.delete('tarefa:sessao-cli')
  const p2 = await $.ui.mount(pane)
  await p2.press({ key: 'compact' })
  await p2.unmount()
  const card2 = await $.ui.mount(band)
  await card2.press({ key: 'card-both' })
  await card2.unmount()
  expect(toasts.some(t => t.includes('Não deu para salvar o progresso') && t.includes('EACCES'))).toBe(true)
})

test('mochila (B3a, B3b e B3c): sem botão duplicado, limpa working órfão, avisa skip e mantém cartão até enviar /compact', { options: { language: 'pt-BR' } }, async ($, on) => {
  mock.store(on)
  on('session.usage', usage)
  const toasts: string[] = []
  on('ui.toast', ((_: unknown, e: { text: string }) => {
    toasts.push(e.text)
    return { value: undefined }
  }) as never)
  on('ui.render', { component: 'AbovePrompt' }, emptyBand)
  on('prompt.fill', () => ({ isFilled: true }) as never)
  on('prompt.submit', ($$, e) => ({ text: (e as { text: string }).text }) as never)
  on('tool.call', { tool: 'Read' }, () => ({ result: { type: 'text', file: { content: '' } } }) as never)
  let compactMode: 'skip' | 'ok' = 'skip'
  on('session.compact', () => {
    if (compactMode === 'skip') return { skip: 'too-short' } as never
    return { messages: [{ role: 'user', text: 'resumo', toolUses: [] }], tokensBefore: 120000, tokensAfter: 30000 } as never
  })

  const p = await $.ui.mount(pane)
  await p.press({ key: 'compact' })
  await p.unmount()

  // B3c: sem campanha ativa (save === undefined), card-only não aparece duplicado ao lado de card-now.
  const busyCard = await $.ui.mount({ ...band, props: { ...band.props, isWorking: true } })
  expect(await busyCard.find({ key: 'card-now' })).toBeDefined()
  expect(await busyCard.find({ key: 'card-only' })).toBeUndefined()
  // B3b: clicar em card-now durante o turno preenche o prompt mas mantém o cartão até enviar /compact.
  await busyCard.press({ key: 'card-now' })
  expect(await busyCard.find({ key: 'card-now' })).toBeDefined()
  await $.prompt.submit({ text: '/compact manter objetivo', wait: false, origin: { kind: 'user' } } as never)
  expect(await busyCard.find({ key: 'card-now' })).toBeUndefined()
  await busyCard.unmount()

  // B3a: working órfão (ferramenta rodou sem turn.complete, mas turn.busy é false) não bloqueia compactNow;
  // skip avisa que não há nada para compactar e mantém o cartão; ok compacta e tira o cartão.
  await $.tool.call({ tool: 'Read', tool_use_id: 'r-orfao', file_path: '/repo/a.ts' } as never)
  const p2 = await $.ui.mount(pane)
  await p2.press({ key: 'compact' })
  await p2.unmount()

  const idleCard = await $.ui.mount(band)
  await idleCard.press({ key: 'card-now' })
  expect(toasts.some(t => t.includes('Nada para compactar agora.'))).toBe(true)
  expect(await idleCard.find({ key: 'card-now' })).toBeDefined()

  compactMode = 'ok'
  await idleCard.press({ key: 'card-now' })
  expect(toasts.some(t => t.includes('120k → 30k'))).toBe(true)
  expect(await idleCard.find({ key: 'card-now' })).toBeUndefined()
  await idleCard.unmount()
})

test('campanha (R1): turno de gatilho ou de subagente sem campanha não cria uma; turno da pessoa cria', { options: { language: 'pt-BR' } }, async ($, on) => {
  const kept = new Map<string, unknown>()
  on('store.get', ($$, e) => ({ value: kept.get((e as { key: string }).key) }) as never)
  on('store.set', ($$, e) => {
    kept.set((e as { key: string }).key, (e as { value: unknown }).value)
    return { value: undefined } as never
  })
  on('store.keys', () => ({ value: [...kept.keys()] }) as never)
  on('session.usage', usage)
  on('session.id', () => ({ value: 'sessao-r1' }) as never)
  on('turn.start', ($$, e) => ({ turnId: (e as { turnId: string }).turnId }) as never)

  await $.turn.start({ text: 'Rodar a rotina agendada das 9h', turnId: 'g1', origin: { kind: 'schedule' } } as never)
  await $.turn.start({ text: 'Tarefa do subagente', turnId: 'g2', agentId: 'ag-1' } as never)
  expect(kept.has('campanha:sessao-r1')).toBe(false)

  await $.turn.start({ text: 'Implementar o login', turnId: 'p1', origin: { kind: 'user' } } as never)
  expect((kept.get('campanha:sessao-r1') as { objective: string }).objective).toBe('Implementar o login')
})

test('grimório (R2): Selar com o ai-memory pendurado falha no prazo com aviso; o seguinte grava uma vez só', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  grimEngine(on, files, toasts)
  // O prazo do Selar dorme no relógio do motor; o teste o acorda sem esperar os 45 s.
  let expire = () => {}
  on('clock.sleep', (() =>
    new Promise(resolve => {
      expire = () => resolve({ value: undefined })
    })) as never)
  on('tool.list', () => ({ value: [{ name: 'mcp__ai-memory__memory_write_page', description: '', mcp: true }] }) as never)
  let hang = true
  let ok = 0
  on('mcp.call', ((_: unknown, e: { tool: string }) => {
    if (e.tool !== 'memory_write_page') return { value: { content: [{ type: 'text', text: '{}' }], isError: false } }
    if (hang) return new Promise(() => {})
    ok += 1
    return { value: { content: [{ type: 'text', text: '{}' }], isError: false } }
  }) as never)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  await openGrimoire($)
  const page = await $.ui.mount(pane)
  await page.press({ key: `dest-${DECISION_ID}` })
  await page.press({ key: `dest-${DECISION_ID}` })

  // Com o primeiro pendurado, o segundo clique só avisa; o prazo (relógio simulado) encerra o primeiro com falha.
  const first = page.press({ key: 'grim-seal' })
  await page.press({ key: 'grim-seal' })
  expect(toasts.some(t => t.includes('O grimório já está gravando'))).toBe(true)
  expire()
  await first
  expect(toasts.some(t => t.includes('Um destino falhou') && t.includes('timeout'))).toBe(true)
  expect(ok).toBe(0)

  // A trava foi solta pela execução que a tinha: o Selar seguinte grava, uma vez.
  hang = false
  await page.press({ key: 'grim-seal' })
  await page.unmount()
  expect(ok).toBe(1)
  expect(toasts.filter(t => t.includes('1 inscrição selada')).length).toBe(1)
})
