// Que classe faz cada coisa e como resumir uma chamada. Regras puras, sem `$`.

import type { Cls } from '../../types'

const has = (re: RegExp, text: unknown) => typeof text === 'string' && re.test(text)

const TEST = /\b(test|tests|jest|vitest|karma|pytest|xunit|nunit|lint|eslint|tsc\b|prettier|ng test|dotnet test|playwright|cypress)\b/i
const PIPELINE = /\b(az pipelines|az devops|gh run|gh workflow|docker|kubectl|helm|logs?\b|tail -f|journalctl|terraform)\b/i
const DB = /\b(psql|sqlcmd|mysql|sqlite3?|mongo(sh)?|redis-cli|dotnet ef|prisma|migrat\w*|flyway|liquibase)\b/i
const PR = /\b(git (commit|push|merge|rebase|tag)|gh pr|az repos pr)\b/i
const HTTP = /\b(curl|wget|http(ie)?|grpcurl|az rest)\b/i
const UI_FILE = /\.(html|css|scss|sass|less|svg|figma)$|\.component\.(ts|html|scss)$|\.(tsx|jsx|vue|svelte)$/i
const DB_FILE = /\.(sql|prisma)$|[\\/]migrations?[\\/]/i
const PIPE_FILE = /pipelines?.*\.ya?ml$|[\\/]\.github[\\/]workflows[\\/]|dockerfile$|\.tf$/i
const TEST_FILE = /\.(spec|test)\.\w+$|[\\/](tests?|__tests__)[\\/]/i

/**
 * A classe de uma chamada de ferramenta. Segue a tabela do handoff: Mago
 * pesquisa, Ilusionista desenha, Artífice codifica, Paladino testa,
 * Patrulheiro cuida de pipeline e logs, Anão do banco, Arauto de PR e merge,
 * Alquimista de integrações. O resto fica com o Clawd druida.
 */
export const classOf = (tool: string, input: Record<string, unknown>): Cls => {
  if (/^mcp__/.test(tool)) return /pull_request|merge|review/i.test(tool) ? 'arauto' : 'alquimista'
  if (/^(Read|Grep|Glob|LS|WebFetch|WebSearch|ToolSearch|NotebookRead)$/.test(tool)) return 'mago'
  if (tool === 'Agent' || tool === 'Task') return agentClass(String(input.subagent_type ?? ''), String(input.description ?? ''))
  if (/^(TodoWrite|TaskCreate|TaskUpdate|TaskList|TaskGet|EnterPlanMode|ExitPlanMode)$/.test(tool)) return 'druida'
  if (tool === 'Bash' || tool === 'PowerShell') {
    const cmd = `${String(input.command ?? '')} ${String(input.description ?? '')}`
    if (TEST.test(cmd)) return 'paladino'
    if (PR.test(cmd)) return 'arauto'
    if (DB.test(cmd)) return 'anao'
    if (PIPELINE.test(cmd)) return 'patrulheiro'
    if (HTTP.test(cmd)) return 'alquimista'
    return 'artifice'
  }
  if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(tool)) {
    const path = String(input.file_path ?? input.notebook_path ?? '')
    if (has(PIPE_FILE, path)) return 'patrulheiro'
    if (has(DB_FILE, path)) return 'anao'
    if (has(TEST_FILE, path)) return 'paladino'
    if (has(UI_FILE, path)) return 'ilusionista'
    return 'artifice'
  }
  return 'druida'
}

/** A classe de um subagente pelo tipo e pela descrição. */
export const agentClass = (type: string, description: string): Cls => {
  const text = `${type} ${description}`
  if (/explore|research|pesquis|context|search|busca/i.test(text)) return 'mago'
  if (/plan|architect|design|\bui\b|\bux\b|prototip|protot/i.test(text)) return 'ilusionista'
  if (/\bqa\b|review|revis|test|lint|audit/i.test(text)) return 'paladino'
  if (/pipeline|deploy|\blogs?\b|\bci\b|\bbuild\b/i.test(text)) return 'patrulheiro'
  if (/database|banco|sql|migra/i.test(text)) return 'anao'
  if (/\bpr\b|pull request|merge|release/i.test(text)) return 'arauto'
  if (/integra|\bapi\b|\bmcp\b|webhook/i.test(text)) return 'alquimista'
  return 'artifice'
}

/** Uma linha humana do que a chamada faz, para o diário e a faixa. */
export const summaryOf = (tool: string, input: Record<string, unknown>) => {
  for (const field of ['description', 'file_path', 'notebook_path', 'pattern', 'url', 'query', 'subject', 'command']) {
    const value = input[field]
    if (typeof value === 'string' && value.trim() !== '') {
      const text = field === 'file_path' || field === 'notebook_path' ? baseName(value) : value.trim()
      return text.length > 90 ? `${text.slice(0, 89)}…` : text
    }
  }
  return tool
}

export const baseName = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path

/** +/− de um patch estruturado (Edit/Write). */
export const patchStats = (patch: unknown) => {
  let added = 0
  let removed = 0
  if (!Array.isArray(patch)) return undefined
  for (const hunk of patch) {
    const lines = (hunk as { lines?: unknown }).lines
    if (!Array.isArray(lines)) continue
    for (const line of lines) {
      if (typeof line !== 'string') continue
      if (line.startsWith('+')) added += 1
      else if (line.startsWith('-')) removed += 1
    }
  }
  return { added, removed }
}

/** Porcentagem legível, sem casa decimal. */
export const pct = (value: number | undefined) => (value === undefined ? '—' : `${Math.round(value)}%`)

/** Hora local de um ISO (HH:MM), ou vazio. */
export const clockOf = (iso: string | undefined) => {
  if (iso === undefined) return ''
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`
}

/** Quanto falta para um ISO, em "2h14" ou "38min"; vazio quando já passou ou não há. */
export const untilOf = (iso: string | undefined, now: number) => {
  if (iso === undefined) return ''
  const ms = new Date(iso).getTime() - now
  if (Number.isNaN(ms) || ms <= 0) return ''
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  return h >= 48 ? `${Math.round(h / 24)}d` : `${h}h${String(min % 60).padStart(2, '0')}`
}

const KNOWN_TYPES: Record<string, string> = {
  explore: 'Explorador',
  plan: 'Arquiteto',
  'claude-code-guide': 'Guia do Claude Code',
  'statusline-setup': 'Status line',
}
const ACRONYM = /^(qa|ui|ux|api|pr|db|sql|ci|cd|mcp|hud)$/i

/**
 * O nome de um subagente para a tela: "acme-qa-reviewer" vira "QA reviewer",
 * "claude-council:council-advisor" vira "Council advisor". Vazio quando o tipo
 * não diz nada (general-purpose): aí quem chama mostra a classe.
 */
export const humanType = (type: string, known: Readonly<Record<string, string>> = KNOWN_TYPES) => {
  const t = (type.split(':').pop() ?? type).trim()
  if (t === '' || /^general(-purpose)?$/i.test(t)) return ''
  const named = known[t.toLowerCase()]
  if (named !== undefined) return named
  let parts = t.split(/[-_\s]+/).filter(Boolean)
  // Três palavras ou mais: a primeira costuma ser o prefixo da organização (acme-, org-).
  if (parts.length >= 3) parts = parts.slice(1)
  return parts.map((w, i) => (ACRONYM.test(w) ? w.toUpperCase() : i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join(' ')
}
