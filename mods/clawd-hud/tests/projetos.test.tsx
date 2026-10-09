import { describe, expect, mock, test } from 'claude-code/testing'

import { addProject, currentProject, hasAccess, isInside, loadProjects, sorted, togglePin, withDirectories } from '../hooks/modules/projetos/projetos'

const PLUGIN = 'clawd-hud'

const pane = {
  plugin: PLUGIN,
  surface: 'desktop',
  component: 'Pane',
  requestId: 'clawd-hud',
  props: { title: 'Clawd HUD', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 80 }, view: {} },
  viewport: { columns: 170, rows: 80, isFullscreen: true },
} as const

const usage = () => ({ value: { startedAt: 0, context: { percent: 10, window: 200000 }, rateLimits: [] } }) as never
// No Windows o motor de testes entrega '/repo/x' como 'C:\repo\x'; os mocks comparam a forma Unix.
const at = (e: unknown) => (e as { path: string }).path.replace(/^[A-Za-z]:/, '').replace(/\\/g, '/')

describe('projetos: regras puras', () => {
  test('caminhos do Windows e do Linux, com e sem barra no fim', async () => {
    expect(isInside('C:\\Projetos\\loja\\src', 'c:/projetos/loja/')).toBe(true)
    expect(isInside('/repo/lojinha', '/repo/loja')).toBe(false)
    expect(hasAccess('/repo/api', '/repo/loja', ['/repo/api'])).toBe(true)
    expect(hasAccess('/repo/web', '/repo/loja', ['/repo/api'])).toBe(false)
  })

  test('fixados primeiro; ids únicos; o que vem do $.store é saneado', async () => {
    let list = addProject([], 'Loja Online', '/repo/loja')
    list = addProject(list, 'Loja Online')
    expect(list.map(p => p.id)).toEqual(['loja-online', 'loja-online-2'])
    list = togglePin(list, 'loja-online-2')
    expect(sorted(list)[0]?.id).toBe('loja-online-2')
    expect(loadProjects([{ id: 'x', name: 'X', folders: ['/a', 3], pinned: 'sim' }, null, 'lixo'])).toEqual([
      { id: 'x', name: 'X', folders: ['/a'], pinned: false },
    ])
  })

  test('settings.local.json: acrescenta sem repetir e sem apagar o resto; JSON quebrado não é sobrescrito', async () => {
    const current = JSON.stringify({ model: 'opus', permissions: { allow: ['Bash(ls)'], additionalDirectories: ['/repo/api'] } })
    const next = JSON.parse(withDirectories(current, ['/repo/web', '/repo/api/']))
    expect(next.model).toBe('opus')
    expect(next.permissions.allow).toEqual(['Bash(ls)'])
    expect(next.permissions.additionalDirectories).toEqual(['/repo/api', '/repo/web'])
    expect(JSON.parse(withDirectories('', ['/x'])).permissions.additionalDirectories).toEqual(['/x'])
    expect(() => withDirectories('{ quebrado', ['/x'])).toThrow()
  })
})

test('projetos no painel: cadastrar a pasta, somar outra, liberar o acesso', { options: { language: 'pt-BR' } }, async ($, on) => {
  mock.store(on)
  on('session.usage', usage)
  on('session.cwd', () => ({ value: '/repo/loja' }) as never)
  on('settings.read', () => ({ value: { permissions: { additionalDirectories: ['/repo/api'] } } }) as never)
  const files: Record<string, string> = {}
  on('fs.exists', ($$, e) => ({ value: ['/repo/api', '/repo/web'].includes(at(e)) || at(e) in files }) as never)
  on('fs.stat', ($$, e) => (['/repo/api', '/repo/web'].includes(at(e)) ? ({ value: { kind: 'dir', size: 0, mtimeMs: 0, isLink: false, realPath: at(e) } } as never) : ({ deny: 'not found' } as never)))
  on('fs.read', ($$, e) => ({ value: files[at(e)] ?? '' }) as never)
  on('fs.write', ($$, e) => {
    const w = e as { path: string; text: string }
    files[at(w)] = w.text
    return { value: undefined } as never
  })
  let filled = ''
  on('prompt.fill', ($$, e) => {
    filled = e.text
    return { isFilled: true } as never
  })

  const ui = await $.ui.mount(pane)
  await ui.press({ key: 'projects' })
  await ui.press({ key: 'proj-add-cwd' })
  expect(await ui.find({ text: /^loja$/ })).toBeDefined()

  await ui.input({ key: 'p:add:loja', text: '/repo/api' })
  await ui.input({ key: 'p:add:loja', text: '/repo/web' })
  await ui.input({ key: 'p:add:loja', text: '/nao/existe' })
  expect(await ui.find({ text: '/nao/existe' })).toBeUndefined()

  await ui.press({ key: 'p:now:loja:/repo/web' })
  expect(filled).toBe('/add-dir /repo/web')

  await ui.press({ key: 'p:always:loja' })
  const saved = JSON.parse(files['/repo/loja/.claude/settings.local.json'] ?? '{}')
  expect(saved.permissions.additionalDirectories).toEqual(['/repo/web'])

  await ui.press({ key: 'p:pin:loja' })
  expect((await ui.find({ key: 'p:pin:loja' }))?.text).toContain('Desafixar')
  await ui.unmount()
})

// O /add-dir usa o argumento inteiro como caminho e não tira aspas: com aspas, o caminho
// deixa de ser absoluto e o comando falha. Este teste impede que alguém "corrija" com aspas.
test('acesso nesta sessão: pasta com espaço vai sem aspas', { options: { language: 'pt-BR' } }, async ($, on) => {
  mock.store(on)
  on('session.usage', usage)
  on('session.cwd', () => ({ value: '/repo/loja' }) as never)
  on('settings.read', () => ({ value: {} }) as never)
  on('fs.stat', ($$, e) =>
    at(e).endsWith('/Projetos/Minha Loja')
      ? ({ value: { kind: 'dir', size: 0, mtimeMs: 0, isLink: false, realPath: 'C:\\Projetos\\Minha Loja' } } as never)
      : ({ deny: 'not found' } as never),
  )
  let filled = ''
  on('prompt.fill', ($$, e) => {
    filled = e.text
    return { isFilled: true } as never
  })

  const ui = await $.ui.mount(pane)
  await ui.press({ key: 'projects' })
  await ui.press({ key: 'proj-add-cwd' })
  await ui.input({ key: 'p:add:loja', text: 'C:\\Projetos\\Minha Loja' })
  await ui.press({ key: 'p:now:loja:C:\\Projetos\\Minha Loja' })
  expect(filled).toBe('/add-dir C:\\Projetos\\Minha Loja')
  await ui.unmount()
})

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
  expect(set).toEqual([{ key: 'clawd-hud.vaultPath', value: '/home/eu/vault' }])

  await ui.press({ key: 'setup-done' })
  expect(await ui.find({ key: 'mochila' })).toBeDefined()
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

test('primeiros passos: com MCP mostra o ai-memory conectado', { options: { language: 'pt-BR' } }, async ($, on) => {
  const { ui } = await openSetup($, on, true)
  expect(await ui.find({ text: /✓ ai-memory conectado/ })).toBeDefined()
  expect(await ui.find({ text: /ai-memory no GitHub/ })).toBeUndefined()
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
  expect(set).toEqual([{ key: 'clawd-hud.vaultInbox', value: 'Entrada' }])
  await ui.unmount()
})

describe('QA da auditoria: projetos', () => {
  test('o projeto atual é o de pasta mais específica', async () => {
    const list = [
      { id: 'a', name: 'A', folders: ['/repo'], pinned: false },
      { id: 'b', name: 'B', folders: ['/repo/loja'], pinned: false },
    ]
    expect(currentProject(list, '/repo/loja/src')?.id).toBe('b')
    expect(currentProject(list, '/repo/outra')?.id).toBe('a')
  })

  test('settings.local.json com BOM do Bloco de Notas é lido', async () => {
    const next = JSON.parse(withDirectories('﻿{"permissions":{}}', ['/x']))
    expect(next.permissions.additionalDirectories).toEqual(['/x'])
  })
})

test('duas sessões: criar um projeto aqui não apaga o que a outra gravou; ✕ pede confirmação; pasta relativa vira absoluta; arquivo não entra', { options: { language: 'pt-BR' } }, async ($, on) => {
  const store: Record<string, unknown> = {}
  on('store.get', ($$, e) => ({ value: store[(e as { key: string }).key] }) as never)
  on('store.set', ($$, e) => {
    store[(e as { key: string }).key] = (e as { value: unknown }).value
    return { value: undefined } as never
  })
  on('session.usage', usage)
  on('session.cwd', () => ({ value: '/repo/loja' }) as never)
  on('settings.read', () => ({ value: {} }) as never)
  on('fs.stat', ($$, e) => {
    const path = at(e)
    // O motor resolve o relativo antes de entregar: 'docs' chega como <pasta do processo>/docs.
    if (path.endsWith('/docs')) return { value: { kind: 'dir', size: 0, mtimeMs: 0, isLink: false, realPath: '/repo/loja/docs' } } as never
    if (path.endsWith('/README.md')) return { value: { kind: 'file', size: 1, mtimeMs: 0, isLink: false, realPath: '/repo/loja/README.md' } } as never
    return { deny: 'not found' } as never
  })

  const ui = await $.ui.mount(pane)
  await ui.press({ key: 'projects' })
  await ui.press({ key: 'proj-add-cwd' })
  // Outra sessão grava um projeto no meio do caminho.
  store.projetos = [...(store.projetos as unknown[]), { id: 'api', name: 'API', folders: ['/repo/api'], pinned: false }]
  await ui.input({ key: 'proj-new', text: 'Web' })
  expect((store.projetos as { id: string }[]).map(p => p.id).sort()).toEqual(['api', 'loja', 'web'])

  await ui.input({ key: 'p:add:loja', text: 'docs' })
  await ui.input({ key: 'p:add:loja', text: 'README.md' })
  const loja = (store.projetos as { id: string; folders: string[] }[]).find(p => p.id === 'loja')
  expect(loja?.folders).toEqual(['/repo/loja', '/repo/loja/docs'])

  await ui.press({ key: 'p:del:web' })
  expect((store.projetos as { id: string }[]).some(p => p.id === 'web')).toBe(true)
  expect((await ui.find({ key: 'p:del:web' }))?.text).toContain('Confirmar')
  await ui.press({ key: 'p:del:web' })
  expect((store.projetos as { id: string }[]).some(p => p.id === 'web')).toBe(false)
  await ui.unmount()
})
