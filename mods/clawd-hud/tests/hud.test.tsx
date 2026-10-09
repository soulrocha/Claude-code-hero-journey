import { expect, mock, test } from 'claude-code/testing'

const PLUGIN = 'clawd-hud'

const pane = (surface: 'desktop' | 'terminal') =>
  ({
    plugin: PLUGIN,
    surface,
    component: 'Pane',
    requestId: 'clawd-hud',
    props: { title: 'Clawd HUD', isFocused: true, bodyColumns: 52, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
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

for (const [option, mochila, about] of [
  ['pt-BR', 'Mochila 34%', 'Projeto no GitHub'],
  ['en', 'Backpack 34%', 'Project on GitHub'],
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
    expect(await ui.find({ key: 'mochila' })).toBeDefined()
    expect((await ui.find({ key: 'mochila' }))?.text).toContain(mochila)
    expect((await ui.findAll({ type: 'Svg' })).length).toBeGreaterThan(2)

    await ui.press({ key: 'config' })
    await ui.press({ key: 'lang-en' })
    expect(asked).toBe('en')
    await ui.press({ key: 'diary-separado' })
    expect((await ui.find({ key: 'diary-separado' }))?.text).toContain('◉')

    await ui.press({ key: 'back' })
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

test('no terminal o painel desenha só texto', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('session.usage', usage)
  const ui = await $.ui.mount(pane('terminal'))
  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
  expect(await ui.find({ text: /OBJETIVO|Objetivo/ })).toBeDefined()
  await ui.unmount()
})

test('duas edições seguidas viram um grupo; Separar abre só aquele', { options: { language: 'pt-BR' } }, async ($, on) => {
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

  const head = await row('e1')
  expect(await head.find({ text: /2 ações · ✓ \+4 −2/ })).toBeDefined()
  const hidden = await row('e2')
  expect(await hidden.find({ text: /linha do motor/ })).toBeUndefined()

  await head.press({ key: 'split-e1' })
  await head.redraw({ tool_use_id: 'e1', tool: 'Edit', input: {}, isRunning: false, isErrored: false, isInterrupted: false })
  expect(await head.find({ text: /linha do motor/ })).toBeDefined()
  expect(await head.find({ type: 'Svg' })).toBeDefined()
  await head.unmount()
  await hidden.unmount()
})

test('a faixa mostra a classe e o que ela faz enquanto o Claude trabalha', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: '', stderr: '', interrupted: false } }) as never)
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Box', props: {}, children: [] }) as never)
  on('session.usage', usage)
  await $.tool.call({ tool: 'Bash', tool_use_id: 'b1', command: 'npm test', description: 'Roda os testes do módulo' } as never)

  const working = await $.ui.mount(band(true))
  expect(await working.find({ text: /^Paladino$/ })).toBeDefined()
  expect(await working.find({ text: /· Roda os testes do módulo/ })).toBeDefined()
  expect((await working.find({ key: 'band' }))?.props.borderStyle).toBe('round')
  expect(String((await working.find({ type: 'Svg' }))?.props.alt)).toContain('Paladino')
  await working.unmount()

  const idle = await $.ui.mount(band(false))
  expect(await idle.find({ text: /Paladino/ })).toBeUndefined()
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

  const p = await $.ui.mount(pane('desktop'))
  await p.press({ key: 'mochila' })
  await p.unmount()

  const card = await $.ui.mount(band(false))
  expect(await card.find({ text: /Mochila cheia/ })).toBeDefined()
  await card.press({ key: 'card-fill' })
  expect(filled).toStartWith('/compact ')
  await card.unmount()
})
