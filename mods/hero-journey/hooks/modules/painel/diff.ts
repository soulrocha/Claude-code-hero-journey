// Painel: leitura pura de `git diff HEAD -- <caminho>` e de arquivos novos (não
// rastreados) para a página de diff do inventário. Sem `$`, sem shell.

export const DIFF_MAX_SHOWN = 40
export const DIFF_MAX_READ = 200

/** Comando git por argv, sem shell, para ler o diff de um item do inventário. */
export const diffArgv = (path: string) =>
  ['git', '--literal-pathspecs', 'diff', 'HEAD', '--', path] as const

export type DiffKind = 'add' | 'del' | 'hunk' | 'ctx' | 'meta'

export type DiffLine = {
  kind: DiffKind
  text: string
}

export type ParsedDiff = {
  lines: DiffLine[]
  added: number
  removed: number
  binary: boolean
  isNew: boolean
  isDeleted: boolean
  renamedFrom?: string
  renamedTo?: string
  /** Quantas linhas de diff não mostradas ficaram de fora por passar de `max` (hunk, contexto e meta incluídos; `added`/`removed` contam só `+` e `-`). */
  more: number
  /** Indica se os totais são aproximados (ex.: quando a entrada já veio truncada pelo chamador). */
  approximate?: boolean
  /** Indica que o item é um diretório não rastreado (sem conteúdo de arquivo). */
  directory?: boolean
}

/** Decodifica caminhos que o Git coloca entre aspas com escapes octais UTF-8 (`\303\247`). */
export function unquoteGitPath(raw: string): string {
  const s = raw.trim()
  if (s.length < 2 || !s.startsWith('"') || !s.endsWith('"')) return s
  const inner = s.slice(1, -1)
  const bytes: number[] = []
  const enc = new TextEncoder()
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i]!
    if (ch === '\\' && i + 1 < inner.length) {
      const next = inner[i + 1]!
      if (next >= '0' && next <= '7' && i + 3 < inner.length && inner[i + 2]! >= '0' && inner[i + 2]! <= '7' && inner[i + 3]! >= '0' && inner[i + 3]! <= '7') {
        bytes.push(parseInt(inner.slice(i + 1, i + 4), 8))
        i += 3
        continue
      }
      const esc = next === 'n' ? 10 : next === 't' ? 9 : next === 'r' ? 13 : next === '\\' ? 92 : next === '"' ? 34 : undefined
      if (esc !== undefined) {
        bytes.push(esc)
        i += 1
        continue
      }
    }
    for (const b of enc.encode(ch)) bytes.push(b)
  }
  return new TextDecoder('utf-8').decode(new Uint8Array(bytes))
}

const HEADER_PREFIXES = [
  'diff --git ',
  'index ',
  'similarity index ',
  'dissimilarity index ',
  'old mode ',
  'new mode ',
  'copy from ',
  'copy to ',
]

/**
 * Analisa a saída de `git diff` de um arquivo.
 *
 * `added` e `removed` contam apenas as linhas de adição (+) e remoção (-) do texto recebido.
 * `more` reflete o total real de linhas de diff não mostradas (`total - lines.length`),
 * incluindo hunk (@@), contexto e meta, enquanto `added` e `removed` contam só `+` e `-`.
 * Se o texto recebido já foi cortado (por exemplo, em `DIFF_MAX_READ` pelo chamador),
 * passe `approximate = true`; a função computa os totais reais sobre o que recebeu,
 * marcando o resultado como aproximado sem inventar números.
 */
export function parseDiff(raw: string, max = DIFF_MAX_SHOWN, maxRead = DIFF_MAX_READ, approximate = false): ParsedDiff {
  const base: ParsedDiff = {
    lines: [],
    added: 0,
    removed: 0,
    binary: false,
    isNew: false,
    isDeleted: false,
    more: 0,
    approximate: Boolean(approximate),
  }
  if (raw.includes('\0')) return { ...base, binary: true }

  const norm = raw.replace(/\r\n/g, '\n').replace(/\r/g, '')
  if (norm.trim() === '') return base

  const allLines = norm.split('\n')
  if (allLines[allLines.length - 1] === '') allLines.pop()

  const body: DiffLine[] = []
  let totalDiffLines = 0
  let inHunk = false

  for (const line of allLines) {
    if (!inHunk) {
      if (line.startsWith('new file mode ')) {
        base.isNew = true
        continue
      }
      if (line.startsWith('deleted file mode ')) {
        base.isDeleted = true
        continue
      }
      if (line === '--- /dev/null') {
        base.isNew = true
        continue
      }
      if (line === '+++ /dev/null') {
        base.isDeleted = true
        continue
      }
      if (line.startsWith('rename from ')) {
        base.renamedFrom = unquoteGitPath(line.slice('rename from '.length))
        continue
      }
      if (line.startsWith('rename to ')) {
        base.renamedTo = unquoteGitPath(line.slice('rename to '.length))
        continue
      }
      if (/^(Binary files .+ and .+ differ|GIT binary patch)\b/.test(line)) {
        return { ...base, lines: [], added: 0, removed: 0, binary: true, more: 0 }
      }
      if (line.startsWith('--- ') || line.startsWith('+++ ') || HEADER_PREFIXES.some(p => line.startsWith(p))) {
        continue
      }
    }

    if (line.startsWith('@@')) {
      inHunk = true
      totalDiffLines += 1
      if (body.length < maxRead) body.push({ kind: 'hunk', text: line })
      continue
    }
    if (line.startsWith('\\ No newline at end of file')) {
      continue
    }

    if (line.startsWith('+')) {
      inHunk = true
      base.added += 1
      totalDiffLines += 1
      if (body.length < maxRead) body.push({ kind: 'add', text: line })
    } else if (line.startsWith('-')) {
      inHunk = true
      base.removed += 1
      totalDiffLines += 1
      if (body.length < maxRead) body.push({ kind: 'del', text: line })
    } else if (line.startsWith(' ') || (inHunk && line === '')) {
      inHunk = true
      totalDiffLines += 1
      if (body.length < maxRead) body.push({ kind: 'ctx', text: line })
    } else if (inHunk) {
      totalDiffLines += 1
      if (body.length < maxRead) body.push({ kind: 'meta', text: line })
    }
  }

  const limit = Math.max(0, max)
  base.lines = body.slice(0, limit)
  base.more = Math.max(0, totalDiffLines - base.lines.length)
  return base
}

/**
 * Converte o conteúdo de um arquivo não rastreado em um diff sintético de adição.
 *
 * `added` reflete o total de linhas do conteúdo recebido.
 * `more` reflete quantas linhas do arquivo não estão em `lines`.
 * Se a entrada já veio cortada externamente, passe `approximate = true`.
 */
export function untrackedDiff(content: string, max = DIFF_MAX_SHOWN, maxRead = DIFF_MAX_READ, approximate = false): ParsedDiff {
  const base: ParsedDiff = {
    lines: [],
    added: 0,
    removed: 0,
    binary: false,
    isNew: true,
    isDeleted: false,
    more: 0,
    approximate: Boolean(approximate),
  }
  if (content.includes('\0')) return { ...base, binary: true }

  const norm = content.replace(/\r\n/g, '\n').replace(/\r/g, '')
  if (norm === '') return base

  const rawLines = (norm.endsWith('\n') ? norm.slice(0, -1) : norm).split('\n')
  const capped = rawLines.slice(0, Math.max(0, maxRead)).map((l): DiffLine => ({ kind: 'add', text: `+${l}` }))
  const limit = Math.max(0, max)
  base.added = rawLines.length
  base.lines = capped.slice(0, limit)
  base.more = Math.max(0, rawLines.length - base.lines.length)
  return base
}
