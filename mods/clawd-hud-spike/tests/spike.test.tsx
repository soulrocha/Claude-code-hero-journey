import { expect, mock, test } from 'claude-code/testing'

const PLUGIN = 'clawd-hud-spike'

const PANE = {
  plugin: PLUGIN,
  component: 'Pane',
  requestId: 'clawd-spike',
  props: {
    title: 'Laboratório',
    isFocused: false,
    bodyColumns: 70,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
  viewport: { columns: 160, rows: 45, isFullscreen: true },
} as const

const answerWith = (label: string) => (_$: unknown, e: { questions: { question: string }[] }) => ({
  result: { questions: e.questions, answers: { [e.questions[0]?.question ?? '']: label } },
})

/** O uso que o motor relataria: 34% de contexto, 28% gastos da janela de 5h. */
const usage = () =>
  ({
    value: {
      startedAt: 0,
      context: { percent: 34, window: 200000 },
      rateLimits: [{ kind: 'five_hour', percentUsed: 28, resetsAt: '2026-10-09T14:00:00Z' }],
    },
  }) as never

/** A linha que o motor desenharia por baixo do hook do mod. */
const engineRow = () => ({ type: 'Text', props: {}, children: ['linha do motor'] }) as never

test('o Laboratório desenha o Clawd com tooltip no desktop e texto no terminal', async ($, on) => {
  on('session.usage', usage)
  const desktop = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const svgs = await desktop.findAll({ type: 'Svg' })
  expect(svgs.length).toBeGreaterThanOrEqual(2)
  expect(String(svgs[0]?.props.source)).toContain('<title>')
  expect(String(svgs[0]?.props.source)).toContain('<animate')
  expect(await desktop.find({ text: 'Mochila 34% · Mana 72% (renova 14:00 UTC) · Vigor —' })).toBeDefined()
  await desktop.unmount()

  const terminal = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await terminal.find({ text: /Svg só no desktop/ })).toBeDefined()
  await terminal.unmount()
})

test('marcar ✓ grava o veredito e o relatório o traz', async ($, on) => {
  on('session.usage', usage)
  mock.store(on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'ok-svg' })
  await ui.unmount()

  const { text } = await $.command.run({ command: 'spike-relatorio', args: '', origin: { kind: 'user' } } as never)
  expect(String(text)).toContain('| 1 | Svg interativo | ok |')
  expect(String(text)).toContain('não verificado')
  expect(String(text)).toContain('160×45 células')
})

test('Recusar no diálogo bloqueia a edição do .env do sandbox', async ($, on) => {
  on('tool.call', { tool: 'AskUserQuestion' }, answerWith('Recusar') as never)
  on('tool.call', { tool: 'Edit' }, () => ({ result: { filePath: 'x' } }) as never)

  const ran = await $.tool.call({
    tool: 'Edit',
    file_path: '/repo/spike-sandbox/.env.teste',
    old_string: 'API_URL=a',
    new_string: 'API_URL=b',
  } as never)
  expect(ran.deny).toContain('recusada (Recusar)')
})

test('Aprovar deixa a edição seguir, e arquivos fora do sandbox nem perguntam', async ($, on) => {
  let asked = 0
  on('tool.call', { tool: 'AskUserQuestion' }, (($: unknown, e: { questions: { question: string }[] }) => {
    asked += 1
    return answerWith('Aprovar')($, e)
  }) as never)
  on('tool.call', { tool: 'Edit' }, () => ({ result: { filePath: 'x' } }) as never)

  const approved = await $.tool.call({
    tool: 'Edit',
    file_path: '/repo/spike-sandbox/azure-pipelines.yml',
    old_string: 'a',
    new_string: 'b\nc',
  } as never)
  expect(approved.deny).toBeUndefined()
  expect(asked).toBe(1)

  const free = await $.tool.call({ tool: 'Edit', file_path: '/repo/src/app.ts', old_string: 'a', new_string: 'b' } as never)
  expect(free.deny).toBeUndefined()
  expect(asked).toBe(1)
})

test('a linha de ferramenta ganha o Clawd à esquerda no desktop', async ($, on) => {
  on('ui.render', { component: 'ToolUse' }, engineRow)
  const props = {
    tool_use_id: 't1',
    tool: 'Bash',
    input: { command: 'ls', description: 'Lista a pasta' },
    isRunning: false,
    isErrored: false,
    isInterrupted: false,
  }
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'ToolUse', requestId: 't1', props })
  const svg = await ui.find({ type: 'Svg' })
  expect(String(svg?.props.alt)).toContain('Artífice')
  expect(await ui.find({ text: /linha do motor/ })).toBeDefined()
  await ui.unmount()
})
