// Peças puras da proteção pelo diálogo do Claude (`$.ui.ask`). O fluxo, que
// usa `$`, fica no register.tsx.

export const GUARD_OPTIONS = ['Aprovar', 'Editar no chat', 'Recusar'] as const

export const GUARD_HINT: Record<string, string> = {
  Aprovar: 'O Claude grava a mudança como pediu.',
  'Editar no chat': 'Bloqueia agora e pede para você ajustar a mudança no chat.',
  Recusar: 'Bloqueia; a resposta final e o relatório registram a recusa.',
}

/** Só a pasta do spike: o guarda de verdade (Fase 2) tem a lista completa. */
export const PROTECTED = /(^|[\\/])spike-sandbox[\\/](\.env[^\\/]*|[^\\/]*pipelines?[^\\/]*\.ya?ml)$/i

const lines = (text: string) => (text === '' ? 0 : text.split('\n').length)

/** +/− aproximados pelo input da ferramenta, sem ler o disco. */
export const deltaOf = (input: { old_string?: string; new_string?: string; content?: string }) => {
  if (input.content !== undefined) return { added: lines(input.content), removed: 0 }
  const removed = lines(input.old_string ?? '')
  const added = lines(input.new_string ?? '')
  return { added, removed }
}
