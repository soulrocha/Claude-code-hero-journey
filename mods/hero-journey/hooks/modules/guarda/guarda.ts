// Guarda dos arquivos protegidos (.env, pipelines, appsettings de produção).
//
// Créditos: a lista em globs, o `globToRegExp` e o `.catch` que falha fechado vêm
// do protected-paths-guard; perguntar pelo `$.ui.ask` dentro do `tool.call`, não
// aceitar o texto livre do "Outro" como aprovação e negar quando ninguém pode
// responder vêm do large-edit-confirmation. Os dois são de Daniel Ávila
// (claude-code-templates, MIT, © 2025 Daniel (San) Ávila):
// https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/security

import type { GuardFile, GuardMode, Lang } from '../../../types'

/** "**" = qualquer profundidade, "*" = qualquer coisa menos "/". Do protected-paths-guard. */
export function globToRegExp(glob: string): RegExp {
  const source = glob.replace(/\*\*\/|\*\*|\*|[.+^${}()|[\]\\]/g, m =>
    m === '**/' ? '(?:.*/)?' : m === '**' ? '.*' : m === '*' ? '[^/]*' : `\\${m}`,
  )
  return new RegExp(`(^|/)${source}$`, 'i')
}

/** Os protegidos do handoff: segredos e pipelines. */
export const DEFAULT_PROTECTED: readonly string[] = [
  '.env',
  '.env.*',
  '**/azure-pipelines*.yml',
  '**/azure-pipelines*.yaml',
  '**/*pipeline*.yml',
  '**/*pipeline*.yaml',
  '.github/workflows/*.yml',
  '.github/workflows/*.yaml',
  '**/appsettings.Production.json',
  '**/appsettings.Prod.json',
  '**/appsettings.Homolog*.json',
  '**/*.pem',
  '**/*.key',
]

/** Uma opção de lista: texto separado por vírgula. */
export const listOption = (value: unknown) =>
  typeof value === 'string'
    ? value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : []

export const makeGuard = (protect: readonly string[] = [], allow: readonly string[] = []) => {
  const protectedRes = [...DEFAULT_PROTECTED, ...protect].map(globToRegExp)
  const allowRes = allow.map(globToRegExp)
  return (rawPath: string) => {
    const path = rawPath.replace(/\\/g, '/')
    if (path === '' || allowRes.some(re => re.test(path))) return false
    return protectedRes.some(re => re.test(path))
  }
}

/** O guarda com a lista padrão, para quem não tem as opções à mão (o inventário). */
export const isProtected = makeGuard()

// `\r?\n`: no Windows o texto chega com CRLF, e o `Code` não aceita `\r`.
const lines = (text: string) => (text === '' ? [] : text.split(/\r?\n/))

/** O diff que o modo chefe mostra, montado do input da ferramenta, sem ler o disco. */
export const diffOf = (path: string, input: { old_string?: unknown; new_string?: unknown; content?: unknown }): GuardFile => {
  const name = path.split(/[\\/]/).pop() ?? path
  const content = typeof input.content === 'string' ? input.content : undefined
  const before = content === undefined && typeof input.old_string === 'string' ? lines(input.old_string) : []
  const after = content !== undefined ? lines(content) : typeof input.new_string === 'string' ? lines(input.new_string) : []
  const shownBefore = before.slice(0, 30)
  const shownAfter = after.slice(0, 30)
  const diff = [
    `--- a/${name}`,
    `+++ b/${name}`,
    `@@ -1,${shownBefore.length} +1,${shownAfter.length} @@`,
    ...shownBefore.map(l => `-${l}`),
    ...shownAfter.map(l => `+${l}`),
  ].join('\n')
  return { name, path, added: after.length, removed: before.length, diff }
}

/** Os rótulos de cada modo. A ordem importa: o primeiro é o que libera. */
export const LABELS: Record<Lang, Record<Exclude<GuardMode, 'nativo'>, readonly [string, string, string]>> = {
  pt: { dialogo: ['Aprovar', 'Editar no chat', 'Recusar'], chefe: ['Abrir o portão', 'Negociar', 'Recuar'] },
  en: { dialogo: ['Approve', 'Edit in chat', 'Refuse'], chefe: ['Open the gate', 'Negotiate', 'Retreat'] },
}

export type Verdict = 'liberar' | 'negociar' | 'recusar'

/** Só o rótulo exato libera: texto livre no "Outro" não é aprovação. */
export const verdictOf = (answer: string, labels: readonly [string, string, string]): Verdict =>
  answer === labels[0] ? 'liberar' : answer === labels[1] ? 'negociar' : 'recusar'

/** Comandos que escrevem, movem ou apagam arquivo (Bash e PowerShell). */
const WRITES =
  /(>>?|\btee\b|\bsed\s+-i|\brm\b|\bmv\b|\bcp\b|\btruncate\b|\bchmod\b|\bdd\b|\bSet-Content\b|\bAdd-Content\b|\bOut-File\b|\bRemove-Item\b|\bMove-Item\b|\bCopy-Item\b|\bNew-Item\b|\bdel\b|\bcopy\b|\bmove\b)/i

/**
 * Leitores conhecidos (Bash e PowerShell): só estes passam sem pergunta. `echo`,
 * `true` e afins entram porque só escrevem arquivo com `>`, que WRITES já pega.
 */
const READ =
  /^(cat|type|less|more|head|tail|grep|egrep|rg|findstr|wc|ls|dir|stat|file|diff|sha256sum|md5sum|echo|printf|true|false|git\s+(diff|log|show|status|blame)|Get-Content|gc|Select-String|sls|Test-Path|Get-Item|Get-ChildItem|Get-FileHash|Measure-Object|Write-Host|Write-Output)\b/i

/** Mandar só o erro para outro lugar (`2>&1`, `2>/dev/null`, `2>$null`) não escreve no arquivo citado. */
const QUIET = /\d>&\d|\b2>\s*(\/dev\/null|\$null|nul)\b/gi

/**
 * Só leitura: nenhum verbo de escrita, nenhum subcomando, nenhum `--output`
 * (o `git diff --output=.env` escreve), e todo trecho começa por um leitor conhecido.
 */
const onlyReads = (command: string) => {
  const c = command.replace(QUIET, ' ')
  return !WRITES.test(c) && !/\$\(|`|<\(|--output\b/.test(c) && c.split(/[|&;\r\n]+/).every(s => READ.test(s.trim()))
}

/**
 * Os arquivos protegidos que um comando de terminal pode escrever. Regra: todo
 * comando que cita um caminho protegido pede aprovação, salvo se for só
 * leitura conhecida (`cat`, `Get-Content`, `grep`…). Escritor que o guarda não
 * conhece (`python -c`, `curl -o`) também pergunta. O caminho conta também
 * entre aspas com espaço (`"pasta x/.env"`) e colado à flag (`-o.env`,
 * `-Path:.env`, `--output=.env`). Um script que monta o caminho por dentro, sem
 * citá-lo, ainda passa; o README diz isso.
 */
export const shellTargets = (command: string, guarded: (path: string) => boolean) => {
  const quoted = [...command.matchAll(/"([^"]*)"|'([^']*)'/g)].map(m => m[1] ?? m[2] ?? '')
  const words = command.split(/[\s;|&<>()"'`=,]+/).map(t => t.replace(/^[>]+/, ''))
  // Do menos ao mais preciso: o último candidato de cada nome é o que o diálogo mostra.
  const candidates = [...words, ...quoted]
    .flatMap(t => [t, t.replace(/^-[A-Za-z]/, ''), t.replace(/^-{1,2}[\w-]+[:=]/, '')])
    .filter(t => t !== '' && guarded(t))
  // Um nome por arquivo, e vence o último citado: `cp a/.env b/.env` mostra o destino,
  // `-Path:C:\repo\.env` mostra o caminho sem a flag e `"C:\Minha Pasta\.env"` não vira `Pasta\.env`.
  const byName = new Map<string, string>()
  for (const t of candidates) byName.set(t.split(/[\\/]/).pop() ?? t, t)
  const targets = [...byName.values()]
  return targets.length === 0 || onlyReads(command) ? [] : targets
}
