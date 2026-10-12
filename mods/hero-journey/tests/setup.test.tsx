// Primeiros passos: só a língua e o que foi detectado (vault e ai-memory). O campo do
// vault aparece só quando o seletor de pasta do sistema não abre.

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

test('primeiros passos: sem seletor, o campo aparece e o vault só é gravado se a pasta existir', { options: { language: 'pt-BR' } }, async ($, on) => {
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
  // Sem seletor de pasta no sistema (nenhum programa responde), o campo de texto aparece.
  expect(await ui.find({ key: 'setup-vault-path' })).toBeUndefined()
  await ui.press({ key: 'setup-vault-pick' })
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

test('primeiros passos: sem nada, tudo funciona e a memória é opcional', { options: { language: 'pt-BR' } }, async ($, on) => {
  const { ui } = await openSetup($, on, false)
  expect(await ui.find({ text: /Tudo já funciona/ })).toBeDefined()
  expect(await ui.find({ text: /sem vault/ })).toBeDefined()
  expect(await ui.find({ key: 'setup-vault-pick' })).toBeDefined()
  expect(await ui.find({ text: /não encontrado/ })).toBeDefined()
  expect(await ui.find({ text: /O que é\?/ })).toBeDefined()
  expect(await ui.find({ text: /Opcional/ })).toBeDefined()
  // Nada de caminho na primeira vez: o campo só aparece se o seletor do sistema não abrir.
  expect(await ui.find({ key: 'setup-vault-path' })).toBeUndefined()
  await ui.unmount()
})

test('primeiros passos: com ai-memory conectado, convida a apoiar o Akita', { options: { language: 'pt-BR' } }, async ($, on) => {
  const { ui } = await openSetup($, on, true)
  expect(await ui.find({ text: /conectado/ })).toBeDefined()
  expect(await ui.find({ text: /⭐ Apoiar/ })).toBeDefined()
  expect(await ui.find({ text: /O que é\?/ })).toBeUndefined()
  await ui.unmount()
})

test('primeiros passos: com vault, mostra a pasta e oferece trocar', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const { ui } = await openSetup($, on, false, ['/vault'])
  expect(await ui.find({ text: /\/vault/ })).toBeDefined()
  expect((await ui.find({ key: 'setup-vault-pick' }))?.text).toContain('Trocar')
  expect(await ui.find({ text: /Opcional/ })).toBeUndefined()
  await ui.unmount()
})
