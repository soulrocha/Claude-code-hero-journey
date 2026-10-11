import { describe, expect, mock, test } from 'claude-code/testing'

import { joinPath, openArgv, pickArgvs, pickedOf, subfolderOf } from '../hooks/core/pasta'

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
const unix = (p: string) => p.replace(/^[A-Za-z]:/, '').replace(/\\/g, '/')

describe('pastas do sistema: regras puras', () => {
  test('o título e a pasta inicial nunca entram no script', () => {
    const [win] = pickArgvs('windows')
    expect(win?.[0]).toBe('powershell')
    expect(win?.join(' ')).toContain('$env:HJ_TITLE')
    expect(win?.join(' ')).toContain('$env:HJ_START')
    expect(pickArgvs('mac')[0]?.join(' ')).toContain('system attribute "HJ_TITLE"')
    expect(pickArgvs('linux').map(a => a[0])).toEqual(['zenity', 'kdialog'])
  })

  test('a saída do seletor: cancelar, raiz do disco e barra no fim', () => {
    expect(pickedOf('')).toBeUndefined()
    expect(pickedOf('  \r\n')).toBeUndefined()
    expect(pickedOf('C:\\Notas\\\r\n')).toBe('C:\\Notas')
    expect(pickedOf('D:\\')).toBe('D:\\')
    expect(pickedOf('/Users/eu/Vault/\n')).toBe('/Users/eu/Vault')
    expect(pickedOf('/')).toBe('/')
  })

  test('a subpasta do vault: dentro, fora, o próprio vault e maiúsculas do Windows', () => {
    expect(subfolderOf('C:\\Notas', 'c:\\notas\\Entrada\\Decisões')).toBe('Entrada/Decisões')
    expect(subfolderOf('/vault', '/vault/Inbox')).toBe('Inbox')
    expect(subfolderOf('/vault', '/vault')).toBeUndefined()
    expect(subfolderOf('/vault', '/vaultinho/Inbox')).toBeUndefined()
    expect(subfolderOf('/vault', '/outro')).toBeUndefined()
  })

  test('revisão do Devin: vault na raiz e maiúsculas só iguais no Windows', () => {
    expect(subfolderOf('/', '/Notas')).toBe('Notas')
    expect(subfolderOf('/', '/')).toBeUndefined()
    // No Linux e no macOS sensível a maiúsculas, /vault não é /Vault.
    expect(subfolderOf('/Vault', '/vault/Inbox')).toBeUndefined()
    expect(subfolderOf('/Vault', '/Vault/Inbox')).toBe('Inbox')
    expect(subfolderOf('D:\\Notas', 'd:\\NOTAS\\Inbox')).toBe('Inbox')
  })

  test('juntar caminhos com a barra que o vault já usa; abrir no Explorer com barras do Windows', () => {
    expect(joinPath('C:\\Notas', 'Inbox/Decisões')).toBe('C:\\Notas\\Inbox\\Decisões')
    expect(joinPath('/vault/', 'Inbox')).toBe('/vault/Inbox')
    expect(joinPath('/vault', '')).toBe('/vault')
    expect(openArgv('windows', 'C:/Notas/Inbox')).toEqual(['explorer.exe', 'C:\\Notas\\Inbox'])
    expect(openArgv('mac', '/vault')).toEqual(['open', '/vault'])
  })
})

type Run = { argv: readonly string[]; env?: Record<string, string> }
type Answer = { exitCode: number; stdout: string } | 'missing'

/**
 * Primeiros passos no Windows, com o seletor e o Explorer simulados: `pick`
 * responde ao seletor de pasta; todo o resto (git, Get-Culture) sai com 1.
 */
const setupOnWindows = async (
  $: Parameters<Parameters<typeof test>[2]>[0],
  on: Parameters<Parameters<typeof test>[2]>[1],
  pick: Answer,
  dirs: string[],
) => {
  mock.store(on)
  mock.env(on, { OS: 'Windows_NT' })
  on('session.usage', usage)
  on('session.cwd', () => ({ value: '/repo/loja' }) as never)
  on('tool.list', () => ({ value: [] }) as never)
  on('fs.stat', ($$, e) => {
    const path = unix((e as { path: string }).path)
    return dirs.includes(path) ? ({ value: { kind: 'dir', size: 0, mtimeMs: 0, isLink: false, realPath: path } } as never) : ({ deny: 'not found' } as never)
  })
  const runs: Run[] = []
  on('process.run', ($$, e) => {
    const run = e as unknown as { argv: readonly string[]; init?: { env?: Record<string, string> } }
    runs.push({ argv: run.argv, env: run.init?.env })
    const isPicker = run.argv.join(' ').includes('FolderBrowserDialog')
    if (isPicker && pick === 'missing') return { deny: 'powershell not found' } as never
    if (isPicker && pick !== 'missing') return { value: { ...pick, stderr: '' } } as never
    return { value: { exitCode: 1, stdout: '', stderr: '' } } as never
  })
  const set: { key: string; value: unknown }[] = []
  on('config.set', ($$, e) => {
    set.push({ key: e.key, value: e.value })
    return { value: e.value } as never
  })
  const ui = await $.ui.mount(pane)
  await ui.press({ key: 'config' })
  await ui.press({ key: 'setup-open' })
  return { ui, set, runs }
}

test('📁 ao lado do vault: a pasta escolhida passa pela mesma conferência do campo', { options: { language: 'pt-BR' } }, async ($, on) => {
  const { ui, set, runs } = await setupOnWindows($, on, { exitCode: 0, stdout: '/home/eu/vault\r\n' }, ['/home/eu/vault'])
  await ui.press({ key: 'setup-vault-sim' })
  await ui.press({ key: 'setup-vault-pick' })
  expect(set).toEqual([{ key: 'hero-journey.vaultPath', value: '/home/eu/vault' }])
  const picker = runs.find(r => r.argv.join(' ').includes('FolderBrowserDialog'))
  expect(picker?.env?.HJ_TITLE).toBe('Escolha a pasta do seu vault')
  await ui.unmount()
})

test('📁 cancelado não grava nada nem avisa', { options: { language: 'pt-BR' } }, async ($, on) => {
  const { ui, set } = await setupOnWindows($, on, { exitCode: 0, stdout: '' }, [])
  await ui.press({ key: 'setup-vault-sim' })
  await ui.press({ key: 'setup-vault-pick' })
  expect(set).toEqual([])
  expect(await ui.find({ text: /seletor de pastas/ })).toBeUndefined()
  await ui.unmount()
})

test('📁 sem seletor no sistema: avisa e o campo continua valendo', { options: { language: 'pt-BR' } }, async ($, on) => {
  const { ui, set } = await setupOnWindows($, on, 'missing', [])
  await ui.press({ key: 'setup-vault-sim' })
  await ui.press({ key: 'setup-vault-pick' })
  expect(set).toEqual([])
  expect(await ui.find({ text: /O seletor de pastas do sistema não abriu aqui/ })).toBeDefined()
  expect(await ui.find({ key: 'setup-vault-path' })).toBeDefined()
  await ui.unmount()
})

test('📁 da pasta de entrada: só vale uma subpasta do vault', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const fora = await setupOnWindows($, on, { exitCode: 0, stdout: '/outro/Inbox' }, ['/vault', '/outro/Inbox'])
  await fora.ui.press({ key: 'setup-inbox-pick' })
  expect(fora.set).toEqual([])
  expect(await fora.ui.find({ text: /não está dentro do vault/ })).toBeDefined()
  await fora.ui.unmount()
})

test('📁 da pasta de entrada: dentro do vault, grava o caminho relativo', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const { ui, set } = await setupOnWindows($, on, { exitCode: 0, stdout: '/vault/Entrada' }, ['/vault', '/vault/Entrada'])
  await ui.press({ key: 'setup-inbox-pick' })
  expect(set).toEqual([{ key: 'hero-journey.vaultInbox', value: 'Entrada' }])
  await ui.unmount()
})

test('📂 abre no Explorer a pasta onde as decisões caem', { options: { language: 'pt-BR', vaultPath: '/vault', vaultInbox: 'Entrada' } }, async ($, on) => {
  const { ui, runs } = await setupOnWindows($, on, 'missing', ['/vault', '/vault/Entrada'])
  await ui.press({ key: 'setup-open-decisions' })
  const opened = runs.find(r => r.argv[0] === 'explorer.exe')
  expect(opened !== undefined && unix(opened.argv[1] ?? '')).toBe('/vault/Entrada')
  await ui.unmount()
})

test('📂 sem a pasta de entrada criada, abre o próprio vault', { options: { language: 'pt-BR', vaultPath: '/vault' } }, async ($, on) => {
  const { ui, runs } = await setupOnWindows($, on, 'missing', ['/vault'])
  await ui.press({ key: 'setup-open-decisions' })
  const opened = runs.find(r => r.argv[0] === 'explorer.exe')
  expect(opened !== undefined && unix(opened.argv[1] ?? '')).toBe('/vault')
  await ui.unmount()
})
