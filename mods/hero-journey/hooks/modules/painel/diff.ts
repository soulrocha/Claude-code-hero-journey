// Painel: leitura pura de `git diff HEAD -- <caminho>` e de arquivos novos (não
// rastreados) para a página de diff do inventário. Sem `$`, sem shell.

export const DIFF_MAX_SHOWN = 40
export const DIFF_MAX_READ = 200

/** Comando git por argv, sem shell, para ler o diff de um item do inventário. */
export const diffArgv = (path: string) => ['git', 'diff', 'HEAD', '--', path] as const

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
  /** Quantas linhas lidas (até DIFF_MAX_READ) ficaram de fora por passar de `max`. */
  more: number
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

export function parseDiff(raw: string, max = DIFF_MAX_SHOWN, maxRead = DIFF_MAX_READ): ParsedDiff {
  const base: ParsedDiff = {
    lines: [],
    added: 0,
    removed: 0,
    binary: false,
    isNew: false,
    isDeleted: false,
    more: 0,
  }
  if (raw.includes('\0')) return { ...base, binary: true }

  const norm = raw.replace(/\r\n/g, '\n').replace(/\r/g, '')
  if (norm.trim() === '') return base

  const allLines = norm.split('\n')
  if (allLines[allLines.length - 1] === '') allLines.pop()

  const body: DiffLine[] = []
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
      if (body.length < maxRead) body.push({ kind: 'hunk', text: line })
      continue
    }
    if (line.startsWith('\\ No newline at end of file')) {
      continue
    }
    if (body.length >= maxRead) continue

    if (line.startsWith('+')) {
      inHunk = true
      base.added += 1
      body.push({ kind: 'add', text: line })
    } else if (line.startsWith('-')) {
      inHunk = true
      base.removed += 1
      body.push({ kind: 'del', text: line })
    } else if (line.startsWith(' ')) {
      inHunk = true
      body.push({ kind: 'ctx', text: line })
    } else if (inHunk) {
      body.push({ kind: 'meta', text: line })
    }
  }

  const limit = Math.max(0, max)
  base.lines = body.slice(0, limit)
  base.more = Math.max(0, body.length - base.lines.length)
  return base
}

export function untrackedDiff(content: string, max = DIFF_MAX_SHOWN, maxRead = DIFF_MAX_READ): ParsedDiff {
  const base: ParsedDiff = {
    lines: [],
    added: 0,
    removed: 0,
    binary: false,
    isNew: true,
    isDeleted: false,
    more: 0,
  }
  if (content.includes('\0')) return { ...base, binary: true }

  const norm = content.replace(/\r\n/g, '\n').replace(/\r/g, '')
  if (norm === '') return base

  const rawLines = (norm.endsWith('\n') ? norm.slice(0, -1) : norm).split('\n')
  const capped = rawLines.slice(0, Math.max(0, maxRead)).map((l): DiffLine => ({ kind: 'add', text: `+${l}` }))
  const limit = Math.max(0, max)
  base.added = capped.length
  base.lines = capped.slice(0, limit)
  base.more = Math.max(0, capped.length - base.lines.length)
  return base
}
