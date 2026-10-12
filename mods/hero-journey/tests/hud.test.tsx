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
    // A Mochila é o botão de compactar.
    expect(await ui.find({ key: 'compact' })).toBeDefined()

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
