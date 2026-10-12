// Que classe faz cada coisa e como resumir uma chamada. Regras puras, sem `$`.

import type { Cls } from '../../types'

const has = (re: RegExp, text: unknown) => typeof text === 'string' && re.test(text)

const TEST = /\b(test|tests|jest|vitest|karma|pytest|xunit|nunit|lint|eslint|tsc\b|prettier|ng test|dotnet test|playwright|cypress)\b/i
// "logs" (docker logs, kubectl logs), arquivo .log ou acompanhar ao vivo; "git log" é leitura do Mago.
const LOGS = /\blogs\b|\.log\b|tail -f|journalctl|Get-EventLog|Get-WinEvent/i
const PIPELINE = /\b(az pipelines|az devops|gh run|gh workflow|docker|podman|kubectl|helm|terraform|deploy\w*|vercel|netlify|fly)\b/i
const DB = /\b(psql|sqlcmd|mysql|sqlite3?|mongo(sh)?|redis-cli|dotnet ef|prisma|migrat\w*|flyway|liquibase)\b/i
const PR = /\b(git (commit|push|merge|rebase|tag|cherry-pick)|gh pr|gh release|az repos pr)\b/i
const HTTP = /\b(curl|wget|http(ie)?|grpcurl|az rest|Invoke-RestMethod|Invoke-WebRequest)\b/i
// Comandos que só leem: cada pedaço da linha começa com um deles e nada é gravado com `>`.
const READS = /^(ls|dir|cat|type|head|tail|less|more|wc|grep|rg|find|fd|tree|pwd|echo|which|where|file|stat|du|df|sort|uniq|cut|awk|sed -n|jq|git (status|log|diff|show|branch|blame|remote|rev-parse|ls-files)|gh (pr|issue|run) (view|list|status|diff|checks)|Get-ChildItem|Get-Content|Get-Item|Select-String|Test-Path|Resolve-Path|Get-Location|Measure-Object|Select-Object|Where-Object|Sort-Object|Format-\w+)\b/i
const UI_FILE = /\.(html|css|scss|sass|less|svg)$|\.component\.(ts|html|scss)$|\.(tsx|jsx|vue|svelte)$/i
const DOC_FILE = /\.(md|mdx|txt|rst|adoc)$|[\\/]docs?[\\/]/i
const DB_FILE = /\.(sql|prisma)$|[\\/]migrations?[\\/]/i
const PIPE_FILE = /pipelines?.*\.ya?ml$|[\\/]\.github[\\/]workflows[\\/]|dockerfile$|\.tf$/i
const TEST_FILE = /\.(spec|test)\.\w+$|[\\/](tests?|__tests__)[\\/]/i

/** Um comando de terminal que só lê (ls, cat, git status, Get-Content...). */
export const readsOnly = (command: string) => {
  const c = command.trim()
  if (c === '' || /(^|[^2&])>/.test(c) || /\s-(delete|exec|execdir)\b|\bsed\b.*\s-i\b/.test(c)) return false
  return c.split(/\s*(?:&&|\|\||;|\|)\s*/).every(part => READS.test(part.replace(/^(cd\s+\S+\s*$)/, 'pwd')))
}

/**
 * Entrega de verdade, o que conta como marco do grimório: commit, push, merge, tag
 * ou PR (pelo terminal ou pelo MCP). O Rei também manda mensagens e arquivos, e
 * isso não é marco.
 */
export const delivers = (tool: string, input: Record<string, unknown>) =>
  tool === 'Bash' || tool === 'PowerShell' ? PR.test(String(input.command ?? '')) : /pull_request_(create|merge)|create_pull_request|merge_pull_request/i.test(tool)

/** Os MCPs pela ferramenta: navegador, design, PR, mensagem, agenda, banco, memória e docs; o resto é integração. */
const mcpClass = (tool: string): Cls => {
  if (/browser|chrome|playwright|puppeteer|reticle/i.test(tool)) return 'ladino'
  if (/figma|design|visualize|show_widget|canva|shader/i.test(tool)) return 'pintor'
  if (/pull_request|merge|review|repo_create_branch/i.test(tool)) return 'rei'
  if (/gmail|send_message|reply|forward|draft|slack|notify|calendar|event/i.test(tool)) return 'rei'
  if (/schedul|cron|trigger/i.test(tool)) return 'cronomante'
  if (/sql|postgres|supabase|database|mongo|redis/i.test(tool)) return 'geomante'
  if (/memory_|docs?_|wiki|notion|obsidian/i.test(tool)) return 'sabio'
  if (/context7|search_documentation|query-docs|web_search|fetch/i.test(tool)) return 'cacador'
  if (/pipeline|build|deploy/i.test(tool)) return 'artifice'
  return 'alquimista'
}

/**
 * A classe de uma chamada de ferramenta, pelo mapa de docs/classes.md: Mago lê
 * o projeto, Caçador pesquisa na web, Ladino navega, Rúnico escreve código,
 * Ilusionista monta telas, Sábio escreve textos e guarda o saber, Engenheiro
 * roda comandos, Bruxo testa, Rei cuida de commit e PR e fala com o mundo,
 * Artífice publica, Oráculo lê os logs, Geomante cuida do banco, Alquimista
 * integra, Cartomante planeja, Invocador chama ajudantes, Cronomante agenda,
 * Paladino revisa a segurança e Pintor cuida do design. O resto fica com o
 * Aprendiz.
 */
export const classOf = (tool: string, input: Record<string, unknown>): Cls => {
  if (/^mcp__/.test(tool)) return mcpClass(tool)
  if (/^(Read|Grep|Glob|LS|LSP|ToolSearch|NotebookRead)$/.test(tool)) return 'mago'
  if (/^(WebFetch|WebSearch)$/.test(tool)) return 'cacador'
  if (/^(Agent|Task|SendMessage|ListAgents|Workflow)$/.test(tool)) return 'invocador'
  if (/^(TodoWrite|TaskCreate|TaskUpdate|TaskList|TaskGet|EnterPlanMode|ExitPlanMode|ProposeGoal)$/.test(tool)) return 'cartomante'
  if (/^(CronCreate|CronDelete|CronList|ScheduleWakeup|RemoteTrigger)$/.test(tool)) return 'cronomante'
  if (/^(Monitor|TaskStop|TaskOutput)$/.test(tool)) return 'oraculo'
  if (/^(SendUserFile|PushNotification)$/.test(tool)) return 'rei'
  if (/^(Skill|ListSkills|SearchSkills|Artifact|ArtifactComments|ArtifactData)$/.test(tool)) return 'sabio'
  if (/^(ReportFindings)$/.test(tool)) return 'paladino'
  if (/^(DesignSync)$/.test(tool)) return 'pintor'
  if (tool === 'Bash' || tool === 'PowerShell') {
    const command = String(input.command ?? '')
    const cmd = `${command} ${String(input.description ?? '')}`
    if (TEST.test(cmd)) return 'bruxo'
    if (PR.test(cmd)) return 'rei'
    if (DB.test(cmd)) return 'geomante'
    if (LOGS.test(command)) return 'oraculo'
    if (PIPELINE.test(cmd)) return 'artifice'
    if (HTTP.test(cmd)) return 'alquimista'
    if (readsOnly(command)) return 'mago'
    return 'engenheiro'
  }
  if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(tool)) {
    const path = String(input.file_path ?? input.notebook_path ?? '')
    if (has(PIPE_FILE, path)) return 'artifice'
    if (has(DB_FILE, path)) return 'geomante'
    if (has(TEST_FILE, path)) return 'bruxo'
    if (has(UI_FILE, path)) return 'ilusionista'
    if (has(DOC_FILE, path)) return 'sabio'
    return 'runico'
  }
  return 'aprendiz'
}

/** A classe de um subagente pelo tipo e pela descrição; sem pista, ele escreve código (Rúnico). */
export const agentClass = (type: string, description: string): Cls => {
  const text = `${type} ${description}`
  if (/security|segura|guard|protec/i.test(text)) return 'paladino'
  if (/\bweb\b|internet|online|docs? (oficial|official)/i.test(text)) return 'cacador'
  if (/explore|research|pesquis|context|search|busca|investig/i.test(text)) return 'mago'
  // Tela e design vencem o tipo "Plan": desenhar o fluxo de uma tela é trabalho do Ilusionista.
  if (/figma|design visual|visual design|ilustra|arte\b/i.test(text)) return 'pintor'
  if (/design|\bui\b|\bux\b|prototip|protot|layout|tela/i.test(text)) return 'ilusionista'
  if (/plan|architect|arquitet|roadmap/i.test(text)) return 'cartomante'
  if (/\bqa\b|test|lint|bug|adversar/i.test(text)) return 'bruxo'
  if (/review|revis|audit/i.test(text)) return 'paladino'
  if (/\blogs?\b|monitor|observ/i.test(text)) return 'oraculo'
  if (/pipeline|deploy|\bci\b|\bbuild\b|infra/i.test(text)) return 'artifice'
  if (/database|banco|sql|migra/i.test(text)) return 'geomante'
  if (/\bpr\b|pull request|merge|release|commit/i.test(text)) return 'rei'
  if (/integra|\bapi\b|\bmcp\b|webhook/i.test(text)) return 'alquimista'
  if (/\bdocs?\b|readme|escrev|write-?up|changelog|memór|memory/i.test(text)) return 'sabio'
  if (/agend|schedul|cron/i.test(text)) return 'cronomante'
  if (/\bcomand|shell|terminal|install/i.test(text)) return 'engenheiro'
  return 'runico'
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
