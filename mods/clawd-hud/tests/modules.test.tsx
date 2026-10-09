import { expect, mock, test } from 'claude-code/testing'

const PLUGIN = 'clawd-hud'

const pane = {
  plugin: PLUGIN,
  surface: 'desktop',
  component: 'Pane',
  requestId: 'clawd-hud',
  props: { title: 'Clawd HUD', isFocused: true, bodyColumns: 52, placement: 'dock', scroll: { offset: 0, bodyRows: 60 }, view: {} },
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

test('guarda, chefe: os rótulos do Guardião do Cofre; em inglês também', { options: { language: 'en' } }, async ($, on) => {
  mock.store(on)
  on('session.usage', usage)
  const seen: { options?: string[] } = {}
  on('tool.call', { tool: 'AskUserQuestion' }, answering('Open the gate', seen))
  on('tool.call', { tool: 'Edit' }, edited)

  const ui = await $.ui.mount(pane)
  await ui.press({ key: 'config' })
  await ui.press({ key: 'guard-chefe' })
  expect((await ui.find({ key: 'guard-chefe' }))?.text).toContain('◉')
  await ui.unmount()

  const r = await editEnv($ as never)
  expect(seen.options).toEqual(['Open the gate', 'Negotiate', 'Retreat'])
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

test('campanha: mensagem abre o capítulo, o fim do turno fecha com o relatório', { options: { language: 'pt-BR' } }, async ($, on) => {
  mock.store(on)
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

  const ui = await $.ui.mount(pane)
  expect(await ui.find({ text: /12 testes passando/ })).toBeDefined()
  expect(await ui.find({ key: 'report-approve' })).toBeDefined()
  await ui.press({ key: 'report-approve' })
  expect(await ui.find({ text: /✓ Aprovado/ })).toBeDefined()
  expect(await ui.find({ key: 'achieved' })).toBeDefined()
  await ui.unmount()
})

test('grimório: acha a decisão, mostra o cartão e só grava no Selar', { options: { language: 'pt-BR' } }, async ($, on) => {
  mock.store(on)
  on('session.usage', usage)
  on('session.cwd', () => ({ value: '/repo' }) as never)
  on('turn.complete', () => ({ text: '' }) as never)
  on('ui.render', { component: 'AbovePrompt' }, emptyBand)
  const files: Record<string, string> = { '/repo/CLAUDE.md': '# Projeto\n' }
  on('fs.exists', ($$, e) => ({ value: at(e) in files }) as never)
  on('fs.read', ($$, e) => ({ value: files[at(e)] ?? '' }) as never)
  on('fs.write', ($$, e) => {
    const w = e as { path: string; text: string }
    files[at(w)] = w.text
    return { value: undefined } as never
  })

  await $.turn.complete({
    turnId: 't9',
    reason: 'answer',
    durationMs: 1000,
    isAborted: false,
    answer: 'Decidimos que listas grandes paginam sempre no servidor.',
  } as never)
  expect(files['/repo/AGENTS.md']).toBeUndefined()

  const card = await $.ui.mount(band)
  expect(await card.find({ text: /paginam sempre no servidor/ })).toBeDefined()
  expect((await card.find({ key: 'grim-seal' }))?.text).toContain('Selar')
  // Sem vault e com CLAUDE.md/AGENTS.md desmarcados, selar não grava nada e a inscrição fica.
  await card.press({ key: 'grim-seal' })
  expect(files['/repo/CLAUDE.md']).toBe('# Projeto\n')
  expect(await card.find({ text: /paginam sempre no servidor/ })).toBeDefined()

  const id = 't9-0-decidimos-que-listas-grandes-paginam-sem'
  await card.press({ key: `dest-${id}-claudeMd` })
  await card.press({ key: `dest-${id}-agentsMd` })
  await card.press({ key: 'grim-seal' })
  await card.unmount()

  expect(files['/repo/CLAUDE.md']).toContain('## Decisões')
  expect(files['/repo/CLAUDE.md']).toContain('listas grandes paginam sempre no servidor')
  expect(files['/repo/AGENTS.md']).toContain('listas grandes paginam sempre no servidor')
})

/** Um grimório com vault em /vault e o ai-memory opcional, para os testes de gravação. */
const grimEngine = (on: Parameters<Parameters<typeof test>[2]>[1], files: Record<string, string>, toasts: string[], vaultOk = true, writes: string[] = []) => {
  mock.store(on)
  on('session.usage', usage)
  on('session.cwd', () => ({ value: '/repo' }) as never)
  on('turn.complete', () => ({ text: '' }) as never)
  on('ui.render', { component: 'AbovePrompt' }, emptyBand)
  on('ui.toast', ((_: unknown, e: { text: string }) => {
    toasts.push(e.text)
    return { value: undefined }
  }) as never)
  on('fs.stat', ($$, e) =>
    vaultOk && at(e) === '/vault' ? ({ value: { kind: 'dir', size: 0, mtimeMs: 0, isLink: false, realPath: '/vault' } } as never) : ({ deny: 'not found' } as never),
  )
  on('fs.exists', ($$, e) => ({ value: at(e) in files }) as never)
  on('fs.read', ($$, e) => ({ value: files[at(e)] ?? '' }) as never)
  // Gravação lenta, para dois cliques seguidos em Selar se cruzarem de verdade.
  on('fs.write', async ($$, e) => {
    writes.push(at(e))
    await new Promise(r => setTimeout(r, 20))
    files[at(e)] = (e as { text: string }).text
    return { value: undefined } as never
  })
}

const answerTurn = (answer: string) => ({ turnId: 't9', reason: 'answer', durationMs: 1000, isAborted: false, answer }) as never

test('grimório: duas notas com o mesmo começo não se sobrescrevem, nem a de outra sessão', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const day = new Date().toISOString().slice(0, 10)
  const base = `/vault/Inbox/decisao-pendente-${day}-decidimos-que-listas-grandes-paginam-sem`
  const files: Record<string, string> = { [`${base}.md`]: 'ANTIGA' }
  grimEngine(on, files, [])
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor. Decidimos que listas grandes paginam sempre no cliente.'))
  const card = await $.ui.mount(band)
  await card.press({ key: 'grim-seal' })
  await card.unmount()
  expect(files[`${base}.md`]).toBe('ANTIGA')
  expect(files[`${base}-2.md`]).toContain('servidor')
  expect(files[`${base}-3.md`]).toContain('cliente')
})

test('grimório: dois cliques seguidos em Selar gravam uma vez só', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  const writes: string[] = []
  grimEngine(on, files, toasts, true, writes)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  const card = await $.ui.mount(band)
  await Promise.all([card.press({ key: 'grim-seal' }), card.press({ key: 'grim-seal' })])
  await card.unmount()
  expect(writes.length).toBe(1)
  expect(toasts.filter(t => t.includes('selada')).length).toBe(1)
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
  on('ui.render', { component: 'AbovePrompt' }, emptyBand)
}

for (const [language, seal] of [['en', 'Seal'], ['auto', 'Selar'], ['pt-BR', 'Selar']] as const) {
  test(`língua ${language}: a fixada vence o sistema; auto segue o sistema`, { options: { language } }, async ($, on) => {
    langEngine(on)
    await $.session.start({ cwd: '/repo', surface: 'desktop', isInteractive: true } as never)
    await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
    const card = await $.ui.mount(band)
    expect((await card.find({ key: 'grim-seal' }))?.text).toContain(seal)
    await card.unmount()
  })
}

test('grimório: vault da configuração que não existe não recebe gravação', { options: { language: 'pt-BR', vaultPath: '/nao/existe' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  grimEngine(on, files, toasts, false)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  const card = await $.ui.mount(band)
  await card.press({ key: 'grim-seal' })
  expect(Object.keys(files).some(k => k.startsWith('/nao/existe'))).toBe(false)
  expect(toasts.some(t => t.includes('A pasta não existe'))).toBe(true)
  expect(toasts.some(t => t.includes('pendente'))).toBe(true)
  expect(await card.find({ text: /paginam sempre no servidor/ })).toBeDefined()
  await card.unmount()
})

test('grimório: falha parcial deixa pendente só o destino que falhou, e o próximo Selar tenta de novo', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  grimEngine(on, files, toasts)
  on('tool.list', () => ({ value: [{ name: 'mcp__ai-memory__memory_write_page', description: '', mcp: true }] }) as never)
  let mode: 'erro' | 'excecao' | 'ok' = 'erro'
  let calls = 0
  on('mcp.call', () => {
    calls += 1
    if (mode === 'excecao') return { deny: 'servidor caiu' } as never
    return { value: { content: [{ type: 'text', text: mode === 'erro' ? 'disco cheio' : '{}' }], isError: mode === 'erro' } } as never
  })
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  const id = 't9-0-decidimos-que-listas-grandes-paginam-sem'
  const card = await $.ui.mount(band)
  await card.press({ key: `dest-${id}-aiMemory` })

  // isError do MCP: o vault grava, o ai-memory fica pendente com o motivo.
  await card.press({ key: 'grim-seal' })
  const vaultNotes = () => Object.keys(files).filter(k => k.startsWith('/vault/Inbox/decisao-pendente-'))
  expect(vaultNotes().length).toBe(1)
  expect(toasts.some(t => t.includes('pendente') && t.includes('disco cheio'))).toBe(true)
  expect(await card.find({ text: /paginam sempre no servidor/ })).toBeDefined()

  // Exceção do MCP: continua pendente, e o vault não é gravado de novo.
  mode = 'excecao'
  await card.press({ key: 'grim-seal' })
  expect(vaultNotes().length).toBe(1)
  expect(await card.find({ text: /paginam sempre no servidor/ })).toBeDefined()

  // MCP de volta: grava só o que faltava e a inscrição sai da lista.
  mode = 'ok'
  await card.press({ key: 'grim-seal' })
  await card.unmount()
  expect(calls).toBe(3)
  expect(vaultNotes().length).toBe(1)
  expect(toasts.some(t => t.includes('1 inscrição selada'))).toBe(true)
})

const DECISION_ID = 't9-0-decidimos-que-listas-grandes-paginam-sem'

test('grimório: sem vault e sem ai-memory, só CLAUDE.md e AGENTS.md, desmarcados, com a dica', { options: { language: 'pt-BR' } }, async ($, on) => {
  grimEngine(on, {}, [])
  on('tool.list', () => ({ value: [] }) as never)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  const card = await $.ui.mount(band)
  expect((await card.find({ key: `dest-${DECISION_ID}-claudeMd` }))?.text).toContain('☐')
  expect((await card.find({ key: `dest-${DECISION_ID}-agentsMd` }))?.text).toContain('☐')
  expect(await card.find({ key: `dest-${DECISION_ID}-vaultDecisao` })).toBeUndefined()
  expect(await card.find({ key: `dest-${DECISION_ID}-aiMemory` })).toBeUndefined()
  expect(await card.find({ text: /configure um vault ou o ai-memory/ })).toBeDefined()
  await card.unmount()
})

test('grimório: Selar sem destino visível marcado não grava nem some', { options: { language: 'pt-BR' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  grimEngine(on, files, toasts)
  on('tool.list', () => ({ value: [] }) as never)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  const card = await $.ui.mount(band)
  await card.press({ key: 'grim-seal' })
  expect(Object.keys(files)).toEqual([])
  expect(toasts.some(t => t.includes('Marque ao menos um destino'))).toBe(true)
  expect(await card.find({ text: /paginam sempre no servidor/ })).toBeDefined()
  await card.unmount()
})

test('grimório: sugestão escondida não segura a inscrição selada no CLAUDE.md', { options: { language: 'pt-BR' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  grimEngine(on, files, toasts)
  on('tool.list', () => ({ value: [] }) as never)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  const card = await $.ui.mount(band)
  await card.press({ key: `dest-${DECISION_ID}-claudeMd` })
  await card.press({ key: 'grim-seal' })
  await card.unmount()
  expect(files['/repo/CLAUDE.md']).toContain('listas grandes paginam sempre no servidor')
  expect(toasts.some(t => t.includes('1 inscrição selada'))).toBe(true)
  const again = await $.ui.mount(band)
  expect(await again.find({ text: /paginam sempre no servidor/ })).toBeUndefined()
  await again.unmount()
})

test('grimório: com vault, a dica não aparece', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  grimEngine(on, {}, [])
  on('tool.list', () => ({ value: [] }) as never)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  const card = await $.ui.mount(band)
  // Busca pelo texto: o `find` por key não acha um Text.
  expect(await card.find({ text: /configure um vault ou o ai-memory/ })).toBeUndefined()
  expect((await card.find({ key: `dest-${DECISION_ID}-vaultDecisao` }))?.text).toContain('☑')
  await card.unmount()
})

test('grimório: com o MCP do ai-memory, a dica não aparece', { options: { language: 'pt-BR' } }, async ($, on) => {
  grimEngine(on, {}, [])
  on('tool.list', () => ({ value: [{ name: 'mcp__ai-memory__memory_write_page', description: '', mcp: true }] }) as never)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  const card = await $.ui.mount(band)
  expect(await card.find({ text: /configure um vault ou o ai-memory/ })).toBeUndefined()
  expect((await card.find({ key: `dest-${DECISION_ID}-aiMemory` }))?.text).toContain('☐')
  await card.unmount()
})

test('grimório: MCP que cai entre o cartão e o Selar deixa o ai-memory pendente, com aviso', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  grimEngine(on, files, toasts)
  let mcpOn = true
  on('tool.list', () => ({ value: mcpOn ? [{ name: 'mcp__ai-memory__memory_write_page', description: '', mcp: true }] : [] }) as never)
  let calls = 0
  on('mcp.call', () => {
    calls += 1
    return { value: { content: [{ type: 'text', text: '{}' }], isError: false } } as never
  })
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  const card = await $.ui.mount(band)
  await card.press({ key: `dest-${DECISION_ID}-aiMemory` })
  mcpOn = false
  await card.press({ key: 'grim-seal' })
  expect(Object.keys(files).filter(k => k.startsWith('/vault/Inbox/')).length).toBe(1)
  expect(calls).toBe(0)
  expect(toasts.some(t => t.includes('continua pendente'))).toBe(true)
  // Enquanto o MCP está fora, o destino pendente fica à vista, esperando.
  await card.unmount()
  const waiting = await $.ui.mount(band)
  expect(await waiting.find({ text: /⏳ ai-memory: indisponível agora/ })).toBeDefined()
  await waiting.unmount()
  // Com o MCP de volta, o próximo Selar grava só o que faltava.
  mcpOn = true
  const again = await $.ui.mount(band)
  expect((await again.find({ key: `dest-${DECISION_ID}-aiMemory` }))?.text).toContain('☑')
  await again.press({ key: 'grim-seal' })
  await again.unmount()
  expect(calls).toBe(1)
  expect(Object.keys(files).filter(k => k.startsWith('/vault/Inbox/')).length).toBe(1)
})

test('grimório: pasta de entrada do /config que sai do vault não recebe gravação', { options: { language: 'pt-BR', vaultPath: '/vault', vaultInbox: '../fora' } }, async ($, on) => {
  const files: Record<string, string> = {}
  const toasts: string[] = []
  grimEngine(on, files, toasts)
  on('tool.list', () => ({ value: [] }) as never)
  await $.turn.complete(answerTurn('Decidimos que listas grandes paginam sempre no servidor.'))
  const card = await $.ui.mount(band)
  await card.press({ key: 'grim-seal' })
  expect(Object.keys(files)).toEqual([])
  expect(toasts.some(t => t.includes('precisa ser uma subpasta'))).toBe(true)
  expect(await card.find({ text: /paginam sempre no servidor/ })).toBeDefined()
  await card.unmount()
})

test('grimório: preferência vai ao perfil do ai-memory pelo MCP; sem MCP o destino não aparece', { options: { language: 'pt-BR' } }, async ($, on) => {
  const files: Record<string, string> = {}
  grimEngine(on, files, [])
  on('turn.start', ($$, e) => ({ turnId: (e as { turnId: string }).turnId }) as never)
  let mcpOn = false
  on('tool.list', () => ({ value: mcpOn ? [{ name: 'mcp__ai-memory__memory_write_page', description: 'pass `scope: "profile"` for a preference', mcp: true }] : [] }) as never)
  const calls: { server: string; tool: string; args: Record<string, unknown> }[] = []
  on('mcp.call', ($$, e) => {
    calls.push(e as never)
    return { value: { content: [{ type: 'text', text: '{}' }], isError: false } } as never
  })
  await $.turn.start({ text: 'Prefiro respostas curtas, sem rodeio.', turnId: 't9' } as never)
  await $.turn.complete(answerTurn('Feito.'))

  const off = await $.ui.mount(band)
  // O grimWhy da preferência também cita o ai-memory: procura o botão, com ☐/☑.
  expect(await off.find({ text: /[☐☑] ai-memory/ })).toBeUndefined()
  await off.unmount()

  // A sugestão nasceu sem o MCP; com ele conectado, o destino aparece e a pessoa marca.
  mcpOn = true
  const card = await $.ui.mount(band)
  await card.press({ key: 'dest-t9-0-prefiro-respostas-curtas-sem-rodeio-aiMemory' })
  await card.press({ key: 'grim-seal' })
  await card.unmount()
  expect(calls.length).toBe(1)
  expect(calls[0]?.server).toBe('ai-memory')
  expect(calls[0]?.tool).toBe('memory_write_page')
  expect(calls[0]?.args.scope).toBe('profile')
  expect(String(calls[0]?.args.path)).toStartWith('workflow/')
  expect(String(calls[0]?.args.body)).toContain('Prefiro respostas curtas')
})

test('side quest: o botão do rodapé põe o cartão e o pedido vai ao prompt', { options: { language: 'pt-BR' } }, async ($, on) => {
  mock.store(on)
  on('session.usage', usage)
  on('ui.render', { component: 'AbovePrompt' }, emptyBand)
  let filled = ''
  on('prompt.fill', ($$, e) => {
    filled = e.text
    return { isFilled: true } as never
  })

  const p = await $.ui.mount(pane)
  expect((await p.find({ key: 'side-quest' }))?.text).toContain('Side quest')
  await p.press({ key: 'side-quest' })
  await p.unmount()

  const card = await $.ui.mount(band)
  await card.press({ key: 'sq-fill' })
  expect(filled).toStartWith('Abra uma side quest')
  expect(filled).toContain('Tarefa da side quest:')
  await card.unmount()
})

test('mochila: Compactar agora só com o Claude parado', { options: { language: 'pt-BR' } }, async ($, on) => {
  mock.store(on)
  on('session.usage', usage)
  on('ui.render', { component: 'AbovePrompt' }, emptyBand)
  let compacted = ''
  on('session.compact', ($$, e) => {
    compacted = String((e as { instructions?: string }).instructions)
    return { messages: [{ role: 'user', text: 'resumo', toolUses: [] }], tokensBefore: 180000, tokensAfter: 40000 } as never
  })

  const p = await $.ui.mount(pane)
  await p.press({ key: 'mochila' })
  await p.unmount()

  const busy = await $.ui.mount({ ...band, props: { ...band.props, isWorking: true } })
  expect(await busy.find({ key: 'card-now' })).toBeUndefined()
  await busy.unmount()

  const idle = await $.ui.mount(band)
  await idle.press({ key: 'card-now' })
  expect(compacted).toContain('Mantenha o objetivo')
  await idle.unmount()
})
