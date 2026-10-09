// Diário de bordo: como as chamadas se agrupam e o que o resumo do grupo diz.
// Padrão de embrulhar o ToolUse e medir o tempo: tool-timing-badge, de Daniel
// Ávila (claude-code-templates, MIT) — https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/ui/tool-timing-badge

import type { Cls, DiaryEntry, Prefs } from '../../../types'

/**
 * O grupo de uma nova linha: entra no grupo da linha anterior quando é da
 * mesma classe, do mesmo turno, e esse grupo não foi separado pela pessoa.
 */
export const groupFor = (diary: readonly DiaryEntry[], cls: Cls, turnId: string, id: string, expanded: readonly string[]) => {
  const last = diary[diary.length - 1]
  if (last !== undefined && last.cls === cls && last.turnId === turnId && !expanded.includes(last.group)) return last.group
  return id
}

export type GroupView =
  | { kind: 'single' }
  | { kind: 'head'; entries: DiaryEntry[] }
  | { kind: 'hidden' }

/**
 * Como desenhar a linha `id` no modo agrupado: sozinha, como cabeça do grupo
 * (com o resumo) ou escondida (dentro de um grupo recolhido). Um grupo com
 * alguma chamada ainda rodando fica aberto, para não esconder o que acontece.
 */
export const groupView = (diary: readonly DiaryEntry[], id: string, mode: Prefs['diary'], expanded: readonly string[]): GroupView => {
  if (mode === 'separado') return { kind: 'single' }
  const entry = diary.find(e => e.id === id)
  if (entry === undefined || expanded.includes(entry.group)) return { kind: 'single' }
  const entries = diary.filter(e => e.group === entry.group)
  if (entries.length < 2 || entries.some(e => e.status === 'run')) return { kind: 'single' }
  return entries[0]?.id === id ? { kind: 'head', entries } : { kind: 'hidden' }
}

/** Resumo do grupo pelos resultados: "2 ações · ✓ novo · ✓ +42 −8". */
export const groupStats = (entries: readonly DiaryEntry[]) => {
  const created = entries.filter(e => e.isNew === true).length
  const failed = entries.filter(e => e.status === 'err').length
  const added = entries.reduce((n, e) => n + (e.added ?? 0), 0)
  const removed = entries.reduce((n, e) => n + (e.removed ?? 0), 0)
  return { count: entries.length, created, failed, added, removed }
}

