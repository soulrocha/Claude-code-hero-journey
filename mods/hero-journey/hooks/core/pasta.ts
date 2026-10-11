// Pastas do sistema: o seletor de pasta nativo e o "abrir no Explorer/Finder".
// A API de mods não tem diálogo de pasta: o mod roda o do próprio sistema por
// `$.process.run` (PowerShell no Windows, osascript no macOS, zenity ou kdialog
// no Linux). Aqui ficam só os argv e as contas de caminho; quem roda é o register.

export type Os = 'windows' | 'mac' | 'linux'

/** `OS=Windows_NT` existe em todo Windows; fora dele, o register tenta o macOS e depois o Linux. */
export const isWindows = (envOs: string | undefined) => envOs === 'Windows_NT'

// O título e a pasta inicial vão por variável de ambiente, nunca no texto do
// script: um caminho com aspas ou `$` não vira código.
const WINDOWS_PICK = [
  "$ErrorActionPreference='Stop'",
  '[Console]::OutputEncoding=[Text.Encoding]::UTF8',
  'Add-Type -AssemblyName System.Windows.Forms',
  '[System.Windows.Forms.Application]::EnableVisualStyles()',
  '$d=New-Object System.Windows.Forms.FolderBrowserDialog',
  '$d.Description=$env:HJ_TITLE',
  '$d.ShowNewFolderButton=$true',
  'if($env:HJ_START -and (Test-Path -LiteralPath $env:HJ_START)){$d.SelectedPath=$env:HJ_START}',
  // Um dono "sempre no topo": sem ele, o diálogo pode abrir atrás do app.
  "$o=New-Object System.Windows.Forms.Form -Property @{TopMost=$true}",
  'if($d.ShowDialog($o) -eq [System.Windows.Forms.DialogResult]::OK){[Console]::Out.Write($d.SelectedPath)}',
  '$o.Dispose()',
].join(';')

/** Os comandos que abrem o seletor de pasta, na ordem de tentativa. */
export const pickArgvs = (os: Os): string[][] =>
  os === 'windows'
    ? [['powershell', '-NoProfile', '-NonInteractive', '-STA', '-Command', WINDOWS_PICK]]
    : os === 'mac'
      ? [['osascript', '-e', 'POSIX path of (choose folder with prompt (system attribute "HJ_TITLE"))']]
      : [
          ['zenity', '--file-selection', '--directory', '--title=Hero Journey'],
          ['kdialog', '--getexistingdirectory', '.'],
        ]

/** O que abre a pasta no gerenciador de arquivos do sistema. */
export const openArgv = (os: Os, path: string): string[] =>
  os === 'windows' ? ['explorer.exe', path.replace(/\//g, '\\')] : os === 'mac' ? ['open', path] : ['xdg-open', path]

/** A saída do seletor: o caminho escolhido, ou undefined se a pessoa cancelou. */
export const pickedOf = (stdout: string) => {
  const path = stdout.trim()
  if (path === '') return undefined
  // A raiz fica com a barra: "C:" sozinho não é a raiz do disco.
  if (/^[a-z]:[\\/]?$/i.test(path)) return `${path.slice(0, 2)}\\`
  if (path === '/') return path
  return path.replace(/[\\/]+$/, '')
}

const norm = (p: string) => p.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()

/**
 * A subpasta de `root` que `picked` é, com as barras do sistema, ou undefined
 * quando `picked` está fora de `root` ou é o próprio `root`.
 */
export const subfolderOf = (root: string, picked: string) => {
  const r = norm(root)
  const p = norm(picked)
  if (r === '' || p === r || !p.startsWith(`${r}/`)) return undefined
  return picked
    .replace(/\\/g, '/')
    .slice(r.length + 1)
    .replace(/\/+$/, '')
}

/** Junta a pasta e a subpasta com a barra que a pasta já usa (C:\Vault\Inbox, /vault/Inbox). */
export const joinPath = (root: string, sub: string) => {
  const sep = root.includes('\\') ? '\\' : '/'
  const clean = sub.replace(/[\\/]+/g, sep).replace(/^[\\/]+|[\\/]+$/g, '')
  return clean === '' ? root : `${root.replace(/[\\/]+$/, '')}${sep}${clean}`
}
