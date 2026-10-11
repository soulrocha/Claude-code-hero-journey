// Primeiros passos: a língua, o vault (pelo campo ou pelo seletor de pasta) e o ai-memory.

import { expect, mock, test } from 'claude-code/testing'

const PLUGIN = 'hero-journey'

const pane = {
  plugin: PLUGIN,
  surface: 'desktop',
  component: 'Pane',
  requestId: 'hero-journey',
  props: { title: 'Hero Journey', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 80 }, view: {} },
  viewport: { columns: 170, rows: 80, isFullscreen: true },
} as const

const usage = () => ({ value: { startedAt: 0, context: { percent: 10, window: 200000 }, rateLimits: [] } }) as never
// No Windows o motor de testes entrega '/repo/x' como 'C:\repo\x'; os mocks comparam a forma Unix.
const at = (e: unknown) => (e as { path: string }).path.replace(/^[A-Za-z]:/, '').replace(/\\/g, '/')

test('primeiros passos: o vault só é gravado se a pasta existir', { options: { language: 'pt-BR' } }, async ($, on) => {
  mock.store(on)
  on('session.usage', usage)
  on('session.cwd', () => ({ value: '/repo/loja' }) as never)
  on('fs.stat', ($$, e) => (at(e) === '/home/eu/vault' ? ({ value: { kind: 'dir', size: 0, mtimeMs: 0, isLink: false, realPath: at(e) } } as never) : ({ deny: 'not found' } as never)))
  const set: { key: string; value: unknown }[] = []
  on('config.set', ($$, e) => {
    set.push({ key: e.key, value: e.value })
    return { value: e.value } as never
  })

  const ui = await $.ui.mount(pane)
  await ui.press({ key: 'config' })
  await ui.press({ key: 'setup-open' })
  await ui.press({ key: 'setup-vault-sim' })
  await ui.input({ key: 'setup-vault-path', text: '/errado' })
  expect(set).toEqual([])
  expect(await ui.find({ text: /A pasta não existe \(ou é um arquivo\): \/errado/ })).toBeDefined()
  await ui.input({ key: 'setup-vault-path', text: '/home/eu/vault' })
  expect(set).toEqual([{ key: 'hero-journey.vaultPath', value: '/home/eu/vault' }])

  await ui.press({ key: 'setup-done' })
  expect(await ui.find({ key: 'grimorio' })).toBeDefined()
  await ui.unmount()
})

/** Abre os Primeiros passos pelo ⚙, com o ai-memory conectado ou não. */
const openSetup = async ($: Parameters<Parameters<typeof test>[2]>[0], on: Parameters<Parameters<typeof test>[2]>[1], memory: boolean, dirs: string[] = []) => {
  mock.store(on)
  on('session.usage', usage)
  on('session.cwd', () => ({ value: '/repo/loja' }) as never)
  on('tool.list', () => ({ value: memory ? [{ name: 'mcp__ai-memory__memory_write_page', description: '', mcp: true }] : [] }) as never)
  on('fs.stat', ($$, e) =>
    dirs.includes(at(e)) ? ({ value: { kind: 'dir', size: 0, mtimeMs: 0, isLink: false, realPath: at(e) } } as never) : ({ deny: 'not found' } as never),
  )
  const set: { key: string; value: unknown }[] = []
  on('config.set', ($$, e) => {
    set.push({ key: e.key, value: e.value })
    return { value: e.value } as never
  })
  const ui = await $.ui.mount(pane)
  await ui.press({ key: 'config' })
  await ui.press({ key: 'setup-open' })
  return { ui, set }
}

test('primeiros passos: sem MCP recomenda o ai-memory', { options: { language: 'pt-BR' } }, async ($, on) => {
  const { ui } = await openSetup($, on, false)
  expect(await ui.find({ text: /Fabio Akita/ })).toBeDefined()
  expect(await ui.find({ text: /ai-memory no GitHub/ })).toBeDefined()
  expect(await ui.find({ text: /✓ ai-memory conectado/ })).toBeUndefined()
  await ui.unmount()
})

test('primeiros passos: com MCP mostra o ai-memory conectado e convida a apoiar o Akita', { options: { language: 'pt-BR' } }, async ($, on) => {
  const { ui } = await openSetup($, on, true)
  expect(await ui.find({ text: /✓ ai-memory conectado/ })).toBeDefined()
  expect(await ui.find({ text: /Apoie o Fabio Akita/ })).toBeDefined()
  expect(await ui.find({ text: /⭐ ai-memory no GitHub/ })).toBeDefined()
  // A recomendação de instalar some: quem já tem recebe o convite a apoiar.
  expect(await ui.find({ text: /Recomendado: o ai-memory/ })).toBeUndefined()
  await ui.unmount()
})

test('primeiros passos: sem vault recomenda o Obsidian', { options: { language: 'pt-BR' } }, async ($, on) => {
  const { ui } = await openSetup($, on, false)
  expect(await ui.find({ text: /obsidian\.md/ })).toBeDefined()
  await ui.unmount()
})

test('primeiros passos: com vault não recomenda o Obsidian', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const { ui } = await openSetup($, on, false, ['/vault'])
  expect(await ui.find({ text: /obsidian\.md/ })).toBeUndefined()
  await ui.unmount()
})

test('primeiros passos: pasta de entrada só vale como subpasta existente do vault', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const { ui, set } = await openSetup($, on, false, ['/vault', '/vault/Entrada'])
  await ui.input({ key: 'setup-vault-inbox', text: '../fora' })
  expect(set).toEqual([])
  expect(await ui.find({ text: /precisa ser uma subpasta/ })).toBeDefined()
  await ui.input({ key: 'setup-vault-inbox', text: 'C:\\x' })
  await ui.input({ key: 'setup-vault-inbox', text: '\\\\srv\\x' })
  await ui.input({ key: 'setup-vault-inbox', text: 'Nada' })
  expect(set).toEqual([])
  await ui.input({ key: 'setup-vault-inbox', text: 'Entrada' })
  expect(set).toEqual([{ key: 'hero-journey.vaultInbox', value: 'Entrada' }])
  await ui.unmount()
})
