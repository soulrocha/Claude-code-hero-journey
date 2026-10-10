// Projetos: a "barra lateral" da HUD. A barra lateral nativa do app não é
// editável por mods (ela não está entre os componentes que um mod redesenha, e
// não há chamada para renomear ou agrupar sessões). Então os projetos vivem no
// painel: cada um com várias pastas, fixados no topo, e o acesso do Claude a
// cada pasta, dado na sessão (/add-dir) ou de vez no .claude/settings.local.json.

import type { Lang, Project } from '../../../types'

/** Caminho comparável: barras normais, sem barra no fim, sem diferença de caixa. */
export const norm = (path: string) => path.trim().replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()

/** `path` é a pasta `folder` ou fica dentro dela. */
export const isInside = (path: string, folder: string) => {
  const p = norm(path)
  const f = norm(folder)
  return f !== '' && (p === f || p.startsWith(`${f}/`))
}

/** O projeto da pasta da sessão: o de pasta mais específica (B=/repo/loja vence A=/repo). */
export const currentProject = (projects: readonly Project[], cwd: string) => {
  let best: Project | undefined
  let depth = -1
  for (const p of projects)
    for (const f of p.folders)
      if (isInside(cwd, f) && norm(f).length > depth) {
        best = p
        depth = norm(f).length
      }
  return best
}

/** O Claude alcança a pasta: é a pasta da sessão (ou fica dentro dela) ou foi liberada. */
export const hasAccess = (folder: string, cwd: string, dirs: readonly string[]) =>
  isInside(folder, cwd) || dirs.some(d => isInside(folder, d))

const slugId = (name: string, taken: readonly string[]) => {
  const base =
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'projeto'
  let id = base
  for (let n = 2; taken.includes(id); n += 1) id = `${base}-${n}`
  return id
}

export const baseFolderName = (path: string) => path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() ?? path

export const addProject = (list: readonly Project[], name: string, folder?: string): Project[] => {
  const clean = name.trim()
  if (clean === '') return [...list]
  const id = slugId(clean, list.map(p => p.id))
  return [...list, { id, name: clean, folders: folder === undefined ? [] : [folder.trim()], pinned: false }]
}

export const addFolder = (list: readonly Project[], id: string, folder: string): Project[] =>
  list.map(p =>
    p.id !== id || folder.trim() === '' || p.folders.some(f => norm(f) === norm(folder)) ? p : { ...p, folders: [...p.folders, folder.trim()] },
  )

export const removeFolder = (list: readonly Project[], id: string, folder: string): Project[] =>
  list.map(p => (p.id !== id ? p : { ...p, folders: p.folders.filter(f => norm(f) !== norm(folder)) }))

export const togglePin = (list: readonly Project[], id: string): Project[] => list.map(p => (p.id === id ? { ...p, pinned: !p.pinned } : p))

export const removeProject = (list: readonly Project[], id: string): Project[] => list.filter(p => p.id !== id)

/** Fixados primeiro, depois por nome. */
export const sorted = (list: readonly Project[]) =>
  [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.name.localeCompare(b.name))

/** Projetos guardados de outra versão: só o que tem a forma certa. */
export const loadProjects = (stored: unknown): Project[] =>
  Array.isArray(stored)
    ? stored
        .filter((p): p is Project => p !== null && typeof p === 'object' && typeof (p as Project).id === 'string' && typeof (p as Project).name === 'string')
        .map(p => ({ id: p.id, name: p.name, folders: Array.isArray(p.folders) ? p.folders.filter(f => typeof f === 'string') : [], pinned: p.pinned === true }))
    : []

/**
 * Acrescenta pastas a `permissions.additionalDirectories` de um settings.json,
 * sem mexer no resto. Texto que não é JSON lança erro: o arquivo não é sobrescrito.
 */
export const withDirectories = (current: string, dirs: readonly string[]) => {
  // Sem o BOM que o Bloco de Notas antigo põe no começo do arquivo.
  const text = current.replace(/^\uFEFF/, '')
  const data = text.trim() === '' ? {} : (JSON.parse(text) as Record<string, unknown>)
  if (data === null || typeof data !== 'object' || Array.isArray(data)) throw new Error('settings.local.json não é um objeto JSON')
  const permissions = (typeof data.permissions === 'object' && data.permissions !== null ? data.permissions : {}) as Record<string, unknown>
  const existing = Array.isArray(permissions.additionalDirectories) ? (permissions.additionalDirectories as unknown[]).filter((d): d is string => typeof d === 'string') : []
  const merged = [...existing]
  for (const d of dirs) if (!merged.some(x => norm(x) === norm(d))) merged.push(d)
  return `${JSON.stringify({ ...data, permissions: { ...permissions, additionalDirectories: merged } }, null, 2)}\n`
}

/** As pastas que `settings.permissions.additionalDirectories` já libera. */
export const settingsDirs = (settings: unknown) => {
  const permissions = (settings as { permissions?: { additionalDirectories?: unknown } } | null)?.permissions
  return Array.isArray(permissions?.additionalDirectories) ? permissions.additionalDirectories.filter((d): d is string => typeof d === 'string') : []
}

/** O pedido de abrir uma sessão no projeto: a API de mods não abre sessão, quem abre é o Claude. */
export const openSessionPrompt = (p: Project, lang: Lang) => {
  const folders = p.folders.map(f => `- ${f}`).join('\n')
  return lang === 'pt'
    ? `Abra uma nova sessão do Claude Code no projeto "${p.name}", na pasta ${p.folders[0] ?? '(sem pasta)'}, com acesso também a:\n${folders}\nSe o app tiver uma ferramenta para iniciar sessão, use-a; senão, me diga o comando para abrir.`
    : `Open a new Claude Code session for the project "${p.name}", in the folder ${p.folders[0] ?? '(no folder)'}, with access to:\n${folders}\nIf the app has a tool to start a session, use it; otherwise tell me the command to open it.`
}
