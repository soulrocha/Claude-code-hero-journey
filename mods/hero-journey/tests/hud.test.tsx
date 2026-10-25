import { expect, mock, test } from 'claude-code/testing'

const PLUGIN = 'hero-journey'

const pane = (surface: 'desktop' | 'terminal') =>
  ({
    plugin: PLUGIN,
    surface,
    component: 'Pane',
    requestId: 'hero-journey',
    props: { title: 'Hero Journey', isFocused: true, bodyColumns: 52, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
    viewport: { columns: 170, rows: 45, isFullscreen: true },
  }) as const

const band = (isWorking: boolean) =>
  ({
    plugin: PLUGIN,
    surface: 'desktop',
    component: 'AbovePrompt',
    requestId: 'band',
    props: { hasSurvey: false, isWorking, maxRows: 12, bodyColumns: 100, scroll: { offset: 0, bodyRows: 12 }, view: {} },
  }) as const

/** O uso que o motor relataria: 34% de contexto, 28% gastos da janela de 5h. */
const usage = () =>
  ({
    value: {
      startedAt: 0,
      context: { percent: 34, window: 200000 },
      rateLimits: [{ kind: 'five_hour', percentUsed: 28 }],
    },
  }) as never

/** Uma edição que o motor teria feito, com o patch estruturado. */
const edited = () =>
  ({
    result: {
      filePath: 'x',
      structuredPatch: [{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 2, lines: ['-a', '+b', '+c'] }],
    },
  }) as never

const engineRow = () => ({ type: 'Text', props: {}, children: ['linha do motor'] }) as never

for (const [option, mochila, about, camp] of [
  ['pt-BR', 'Mochila', 'Projeto no GitHub', 'Sua vez'],
  ['en', 'Backpack', 'Project on GitHub', 'Your turn'],
] as const) {
  test(`painel em ${option}: rodapé, configurações e Sobre`, { options: { language: option } }, async ($, on) => {
    on('session.usage', usage)
    mock.store(on)
    let asked: unknown
    on('config.set', ($$, e) => {
      asked = e.value
      return { value: e.value } as never
    })

    const ui = await $.ui.mount(pane('desktop'))
    expect(await ui.find({ key: 'grimorio' })).toBeDefined()
    // O palco no topo: sem turno ainda, o acampamento; os recursos em texto nativo, com a barra no meio.
    expect(String((await ui.find({ type: 'Svg' }))?.props.alt)).toContain(camp)
    expect(await ui.find({ text: new RegExp(mochila) })).toBeDefined()
    expect(await ui.find({ text: /34%/ })).toBeDefined()
    // A Mochila é o botão de compactar; o ícone fica fora dele, alinhado com o da Mana e o do Vigor.
    expect(await ui.find({ key: 'compact' })).toBeDefined()
    expect(String((await ui.find({ key: 'compact' }))?.props.label)).not.toContain('🎒')

    await ui.press({ key: 'config' })
    await ui.press({ key: 'lang-en' })
    expect(asked).toBe('en')
    await ui.press({ key: 'skin-sobrio' })
    expect((await ui.find({ key: 'skin-sobrio' }))?.text).toContain('◉')

    await ui.press({ key: 'back' })
    await ui.press({ key: 'config' })
    await ui.press({ key: 'about' })
    const links = await ui.findAll({ type: 'Link' })
    expect(links.map(l => l.props.href)).toEqual(['https://www.linkedin.com/in/soulrocha', 'https://github.com/soulrocha/Claude-code-hero-journey'])
    expect(links[1]?.text).toContain(about)
    await ui.unmount()
  })
}

test('todo Svg do painel declara o esquema de cor (sem ele o frame pinta fundo branco)', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('session.usage', usage)
  const ui = await $.ui.mount(pane('desktop'))
  const svgs = await ui.findAll({ type: 'Svg' })
  expect(svgs.length).toBeGreaterThan(0)
  for (const s of svgs) expect(String(s.props.source)).toContain('<style>:root{color-scheme:dark}</style>')
  await ui.unmount()
})

test('cada edição ganha o pet, quem agiu e o resultado em texto; nada se esconde (o app já agrupa no fim do turno)', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('tool.call', { tool: 'Edit' }, edited)
  on('ui.render', { component: 'ToolUse' }, engineRow)
  const call = (id: string) =>
    $.tool.call({ tool: 'Edit', tool_use_id: id, file_path: '/repo/src/app.ts', old_string: 'a', new_string: 'b\nc' } as never)
  await call('e1')
  await call('e2')

  const row = (id: string) =>
    $.ui.mount({
      plugin: PLUGIN,
      surface: 'desktop',
      component: 'ToolUse',
      requestId: id,
      props: { tool_use_id: id, tool: 'Edit', input: { file_path: '/repo/src/app.ts' }, isRunning: false, isErrored: false, isInterrupted: false },
    })

  for (const id of ['e1', 'e2']) {
    const ui = await row(id)
    // A linha é do mod (sem o trilho do app): o pet, a classe, o arquivo e o resultado em texto nativo.
    expect(await ui.find({ text: /linha do motor/ })).toBeUndefined()
    expect(await ui.find({ text: /^Rúnico$/ })).toBeDefined()
    expect(await ui.find({ text: /^app\.ts$/ })).toBeDefined()
    expect(await ui.find({ text: /^\+2 −1$/ })).toBeDefined()
    expect(await ui.find({ text: /^✓$/ })).toBeDefined()
    expect((await ui.findAll({ type: 'Svg' })).length).toBe(1)
    expect(await ui.find({ key: `split-${id}` })).toBeUndefined()
    await ui.unmount()
  }
})

test('a faixa mostra a classe e o que ela faz enquanto o Claude trabalha', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: '', stderr: '', interrupted: false } }) as never)
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Box', props: {}, children: [] }) as never)
  on('session.usage', usage)
  await $.tool.call({ tool: 'Bash', tool_use_id: 'b1', command: 'npm test', description: 'Roda os testes do módulo' } as never)

  // A faixa, em uma linha: o pet da classe, quem age e o que faz, e o ◈ que abre e fecha o painel.
  const working = await $.ui.mount(band(true))
  expect(String((await working.find({ type: 'Svg' }))?.props.alt)).toBe('Bruxo · Roda os testes do módulo')
  expect(await working.find({ text: /^Bruxo$/ })).toBeDefined()
  expect(await working.find({ text: /Roda os testes do módulo/ })).toBeDefined()
  expect(await working.find({ key: 'hero-toggle' })).toBeDefined()
  await working.unmount()

  // Parado e sem campanha, não há o que mostrar: nada de faixa.
  const idle = await $.ui.mount(band(false))
  expect(await idle.find({ type: 'Svg' })).toBeUndefined()
  await idle.unmount()
})

test('a mochila leva a instrução do /compact ao prompt, sem gastar tokens', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('session.usage', usage)
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Box', props: {}, children: [] }) as never)
  let filled = ''
  on('prompt.fill', ($$, e) => {
    filled = e.text
    return { isFilled: true } as never
  })

  // A Mochila do rodapé é o botão de compactar.
  const p = await $.ui.mount(pane('desktop'))
  await p.press({ key: 'compact' })
  await p.unmount()

  // Com o Claude trabalhando, o Compactar leva a instrução ao prompt.
  const card = await $.ui.mount(band(true))
  expect(await card.find({ text: /Mochila em/ })).toBeDefined()
  await card.press({ key: 'card-now' })
  expect(filled).toStartWith('/compact ')
  await card.unmount()
})

test('diff do inventário no painel (D3): abrir, voltar, diretório não rastreado e binário', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('session.usage', usage)
  on('session.start', () => ({ cwd: '/repo' }) as never)
  const fsReads: string[] = []
  on('fs.read', ($$, e) => {
    const p = (e as { path?: string }).path ?? ''
    fsReads.push(p)
    if (p.endsWith('bin-untracked.dat')) return { value: '\0PNG\r\n\x1a\n' } as never
    return { value: 'conteúdo texto\n' } as never
  })
  on('fs.stat', ($$, e) => {
    const p = (e as { path?: string }).path ?? ''
    if (p.endsWith('docs/') || p.endsWith('docs')) return { value: { kind: 'dir' } } as never
    return { value: { kind: 'file' } } as never
  })
  on('process.run', ($$, e) => {
    const argv = (e as { argv: readonly string[] }).argv
    const cmd = argv.join(' ')
    if (cmd.includes('status')) {
      return {
        value: {
          exitCode: 0,
          stdout: '## main\0 M src/app.ts\0 M bin-tracked.png\0?? docs/\0?? bin-untracked.dat\0',
          stderr: '',
        },
      } as never
    }
    if (cmd.includes('diff') && cmd.includes('--numstat')) {
      return {
        value: {
          exitCode: 0,
          stdout: '3\t1\tsrc/app.ts\0',
          stderr: '',
        },
      } as never
    }
    if (cmd.includes('log')) {
      return {
        value: {
          exitCode: 0,
          stdout: 'a1b2c3d\x1fCommit teste\x1f1700000000\n',
          stderr: '',
        },
      } as never
    }
    if (cmd.includes('--literal-pathspecs') && cmd.includes('src/app.ts')) {
      return {
        value: {
          exitCode: 0,
          stdout: 'diff --git a/src/app.ts b/src/app.ts\nindex 111..222 100644\n--- a/src/app.ts\n+++ b/src/app.ts\n@@ -1,3 +1,5 @@\n const a = 1\n-const b = 2\n+const b = 3\n+const c = 4\n',
          stderr: '',
        },
      } as never
    }
    if (cmd.includes('--literal-pathspecs') && cmd.includes('bin-tracked.png')) {
      return {
        value: {
          exitCode: 0,
          stdout: 'Binary files a/bin-tracked.png and b/bin-tracked.png differ\n',
          stderr: '',
        },
      } as never
    }
    return { value: { exitCode: 0, stdout: '', stderr: '' } } as never
  })

  on('tool.call', { tool: 'Edit' }, () => ({ result: { filePath: 'x' } }) as never)
  await $.tool.call({ tool: 'Edit', tool_use_id: 'init-inv', file_path: 'x' } as never)

  // 1. Abre o painel no desktop: inventário visível com os itens.
  const ui = await $.ui.mount(pane('desktop'))
  expect(await ui.find({ key: 'item-src/app.ts' })).toBeDefined()
  expect(await ui.find({ key: 'item-docs/' })).toBeDefined()
  expect(await ui.find({ key: 'item-bin-tracked.png' })).toBeDefined()
  expect(await ui.find({ key: 'item-bin-untracked.dat' })).toBeDefined()

  // 2. Abrir diff de arquivo rastreado: mostra diff com linhas + e -, e botão de voltar.
  await ui.press({ key: 'item-src/app.ts' })
  expect(await ui.find({ key: 'back' })).toBeDefined()
  expect((await ui.find({ key: 'back' }))?.text).toContain('‹ Inventário')
  expect(await ui.find({ text: /src\/app\.ts/ })).toBeDefined()
  expect(await ui.find({ text: /\+const b = 3/ })).toBeDefined()
  expect(await ui.find({ text: /-const b = 2/ })).toBeDefined()

  // 3. Voltar: volta para a tela principal (main).
  await ui.press({ key: 'back' })
  expect(await ui.find({ key: 'item-src/app.ts' })).toBeDefined()
  expect(await ui.find({ key: 'back' })).toBeUndefined()

  // 4. Diretório não rastreado: mostra aviso e NÃO chama $.fs.read.
  await ui.press({ key: 'item-docs/' })
  expect(await ui.find({ key: 'diff-dir' })).toBeDefined()
  expect((await ui.find({ key: 'diff-dir' }))?.text).toContain('Diretório (sem prévia em texto).')
  expect(fsReads.some(f => f.endsWith('docs/') || f.endsWith('docs'))).toBe(false)
  await ui.press({ key: 'back' })

  // 5. Arquivo binário rastreado e não rastreado: mostra aviso de binário.
  await ui.press({ key: 'item-bin-tracked.png' })
  expect(await ui.find({ key: 'diff-binary' })).toBeDefined()
  expect((await ui.find({ key: 'diff-binary' }))?.text).toContain('Arquivo binário (sem prévia em texto).')
  await ui.press({ key: 'back' })

  await ui.press({ key: 'item-bin-untracked.dat' })
  expect(await ui.find({ key: 'diff-binary' })).toBeDefined()
  expect((await ui.find({ key: 'diff-binary' }))?.text).toContain('Arquivo binário (sem prévia em texto).')
  await ui.press({ key: 'back' })

  await ui.unmount()

  // 6. No terminal, a mesma página em texto puro, sem Svg.
  const tui = await $.ui.mount(pane('terminal'))
  await tui.press({ key: 'item-src/app.ts' })
  expect(await tui.find({ key: 'back' })).toBeDefined()
  expect(await tui.find({ text: /src\/app\.ts/ })).toBeDefined()
  expect(await tui.find({ text: /\+const b = 3/ })).toBeDefined()
  expect(await tui.find({ type: 'Svg' })).toBeUndefined()
  await tui.press({ key: 'back' })
  expect(await tui.find({ key: 'item-src/app.ts' })).toBeDefined()
  await tui.unmount()
})
