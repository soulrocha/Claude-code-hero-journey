// Painel: quests (da lista de tarefas do Claude) e inventário (git).
// Git por argv, sem shell, como no git-sidebar de Daniel Ávila
// (claude-code-templates, MIT) — https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/ui/git-sidebar

import type { Inventory, Item, Member, Quest, Rarity } from '../../../types'
import { isProtected } from '../guarda/guarda'

/** Arquivos que mudam o build ou a execução, mesmo sendo .json. */
const CRITICAL_FILE = /(^|[\\/])(package\.json|dockerfile|tsconfig\.json|angular\.json|program\.cs|startup\.cs)$|\.(sql|prisma|csproj|sln)$/i
/** Pastas e nomes de API, banco e auth: `src/api/x.ts`, `src/api.ts`, `auth.service.ts`. */
const CRITICAL = /(^|[\\/])(api|controllers?|migrations?|auth\w*|db|database)([\\/]|$)|(^|[\\/])(api|auth|db|database)[.-][^\\/]*$/i
const LIGHT = /\.(spec|test)\.\w+$|(^|[\\/])(tests?|__tests__|docs?)([\\/]|$)|\.(md|txt|json|ya?ml|toml|ini)$|(^|[\\/])\.(gitignore|editorconfig|prettierrc)$/i

/**
 * Raridade de um arquivo pelo impacto da mudança: protegido > excluído >
 * arquivo de build > teste/doc/config > pasta ou nome crítico > código.
 * Teste e doc vêm antes da pasta crítica: `tests/api/a.test.ts` é comum.
 */
export const rarityOf = (path: string, code = ' M', guarded: (path: string) => boolean = isProtected): Rarity =>
  guarded(path)
    ? 'lendario'
    : code.includes('D')
      ? 'pobre'
      : CRITICAL_FILE.test(path)
        ? 'raro'
        : LIGHT.test(path)
          ? 'comum'
          : CRITICAL.test(path)
            ? 'raro'
            : 'incomum'

/** Quests a partir da lista de tarefas do Claude (TodoWrite). */
export const questsFromTodos = (todos: unknown): Quest[] | undefined => {
  if (!Array.isArray(todos)) return undefined
  return todos
    .map(t => t as { content?: unknown; status?: unknown })
    .filter(t => typeof t.content === 'string')
    .map((t, i) => ({
      id: `todo-${i}`,
      title: String(t.content),
      status: t.status === 'completed' || t.status === 'in_progress' ? t.status : 'pending',
    }))
}

/** O que o painel mostra das quests: concluídas, a atual, as 2 próximas e o resto na névoa. */
export const questView = (quests: readonly Quest[]) => {
  const done = quests.filter(q => q.status === 'completed')
  const open = quests.filter(q => q.status !== 'completed')
  const current = open.find(q => q.status === 'in_progress') ?? open[0]
  const rest = open.filter(q => q !== current)
  return { done, current, next: rest.slice(0, 2), mist: Math.max(0, rest.length - 2) }
}

/**
 * Lê `git status --porcelain=v1 --branch -z` e `git diff --numstat -z HEAD`.
 * Com `-z` o git não põe aspas nem escapa caminho com espaço ou acento; numa
 * renomeação o status traz o destino e depois a origem, e o numstat traz um
 * campo vazio seguido da origem e do destino.
 * A raridade de cada item sai do `rarityOf`.
 */
export const parseInventory = (status: string, numstat: string, guarded: (path: string) => boolean = isProtected): Inventory => {
  const recs = status.split('\0').filter(l => l !== '')
  const head = recs[0]?.startsWith('## ') === true ? recs.shift() ?? '' : ''
  const branch = head === '' ? undefined : head.slice(3).split('...')[0]?.replace(/^No commits yet on /, '')
  const ahead = Number(/ahead (\d+)/.exec(head)?.[1] ?? 0)
  const behind = Number(/behind (\d+)/.exec(head)?.[1] ?? 0)
  const stats = new Map<string, { added: number; removed: number }>()
  const rows = numstat.split('\0')
  for (let k = 0; k < rows.length; k++) {
    const [a, r, ...rest] = (rows[k] ?? '').replace(/^\n/, '').split('\t')
    if (a === undefined || r === undefined || rest.length === 0) continue
    // Um tab no nome do arquivo também é separador: junta de volta.
    const p = rest.join('\t')
    const path = p === '' ? rows[(k += 2)] : p
    if (path !== undefined && path !== '') stats.set(path, { added: Number(a) || 0, removed: Number(r) || 0 })
  }
  const lines: string[] = []
  for (let k = 0; k < recs.length; k++) {
    const line = recs[k] ?? ''
    lines.push(line)
    // R e C trazem a origem no registro seguinte: o inventário mostra só o destino.
    if (/[RC]/.test(line.slice(0, 2))) k++
  }
  const items: Item[] = lines.map(line => {
    const code = line.slice(0, 2)
    const path = line.slice(3)
    return { path, rarity: rarityOf(path, code, guarded), code, ...stats.get(path) }
  })
  const order = { lendario: 0, raro: 1, incomum: 2, comum: 3, pobre: 4 }
  items.sort((a, b) => order[a.rarity] - order[b.rarity] || a.path.localeCompare(b.path))
  return { branch, ahead, behind, items, isRepo: true }
}

// `--untracked-files=normal`: uma pasta nova aparece como um item, sem varrer o que há dentro.
export const STATUS_ARGV = ['git', 'status', '--porcelain=v1', '--branch', '--untracked-files=normal', '-z'] as const
export const NUMSTAT_ARGV = ['git', 'diff', '--numstat', '-z', 'HEAD'] as const

/** Os 3 últimos commits: hash curto, assunto e quando (segundos desde 1970, formatado pelo i18n), separados por \x1f. */
export const LOG_ARGV = ['git', 'log', '-3', '--format=%h%x1f%s%x1f%ct'] as const

export const parseLog = (out: string) =>
  out
    .split(/\r?\n/)
    .map(line => line.split('\x1f'))
    .filter((f): f is [string, string, string] => f.length === 3 && f[0] !== '')
    .map(([hash, subject, when]) => ({ hash, subject, when }))

export const EMPTY_INVENTORY: Inventory = { ahead: 0, behind: 0, items: [], isRepo: false }


/**
 * Junta a última leitura do grupo com o que um `agent.spawn` ou um `tool.call`
 * de Agent trouxe. Acompanhar os subagentes pelo `agent.spawn` vem do
 * agent-flow, de Daniel Ávila (claude-code-templates, MIT) —
 * https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/ui/agent-flow
 */
export const upsertMember = (party: readonly Member[], member: Member) => {
  const others = party.filter(m => m.id !== member.id)
  return [...others, member].slice(-30)
}
