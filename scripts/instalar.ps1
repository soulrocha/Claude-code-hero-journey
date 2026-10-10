# Instala a HUD (hero-journey) a partir de um clone local do repositório (Windows, PowerShell).
# Clona ou atualiza o repo, roda o verificar.ps1 e instala pelo marketplace local,
# que não depende do branch padrão do GitHub. Não gasta tokens.
#
#   powershell -ExecutionPolicy Bypass -File scripts\instalar.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\instalar.ps1 -Vault 'C:\Notas' -VaultInbox 'Entrada' -Lingua pt-BR
#   powershell -ExecutionPolicy Bypass -File scripts\instalar.ps1 -Desinstalar

param(
  # Padrão: o clone onde este script está.
  [string]$Pasta = (Split-Path -Parent $PSScriptRoot),
  [string]$Branch = 'main',
  [string]$Vault = '',
  # Subpasta do vault onde o grimório deixa as notas novas. Vazia, fica o padrão (Inbox).
  [string]$VaultInbox = '',
  # Obsoleto: o grimório grava no ai-memory pelo MCP. Aceito só para não quebrar quem já o usa.
  [string]$AiMemory = '',
  [ValidateSet('auto', 'pt-BR', 'en')][string]$Lingua = 'auto',
  [switch]$SemTestes,
  [switch]$Desinstalar
)

$ErrorActionPreference = 'Stop'
# A pasta de entrada fica dentro do vault: nada de caminho absoluto, drive, rede ou "..".
if ($VaultInbox -match '^([a-zA-Z]:|[\\/])' -or ($VaultInbox -split '[\\/]') -contains '..') {
  throw "-VaultInbox precisa ser uma subpasta do vault, sem caminho absoluto nem '..': $VaultInbox"
}
if ($AiMemory -ne '') {
  Write-Warning '-AiMemory foi ignorado: o grimório grava no ai-memory pelo MCP dele, sem caminho de pasta.'
}
$marketplace = 'claude-code-hero-journey'
$plugin = "hero-journey@$marketplace"

function Passo($texto) { Write-Host "`n== $texto" -ForegroundColor Cyan }
function Rodar([string]$exe, [string[]]$argumentos) {
  & $exe @argumentos
  if ($LASTEXITCODE -ne 0) { throw "Falhou: $exe $($argumentos -join ' ')" }
}

if ($Desinstalar) {
  Passo 'Desinstalando'
  claude plugin uninstall $plugin
  claude plugin marketplace remove $marketplace
  Write-Host 'Feito. Reinicie o Claude Code.' -ForegroundColor Green
  exit 0
}

Passo 'Claude Code'
Rodar claude @('--version')

Passo "Repositório em $Pasta ($Branch)"
if (Test-Path (Join-Path $Pasta '.git')) {
  # Só atualiza se o clone já estiver na branch pedida: nunca troca a branch de quem está trabalhando nele.
  $atual = (git -C $Pasta rev-parse --abbrev-ref HEAD).Trim()
  if ($atual -eq $Branch) {
    Rodar git @('-C', $Pasta, 'pull', '--ff-only', 'origin', $Branch)
  } else {
    Write-Warning "O clone está na branch '$atual', não em '$Branch': instalo como está, sem atualizar."
  }
} elseif ((Test-Path $Pasta) -and (Get-ChildItem $Pasta -Force | Select-Object -First 1)) {
  # Pasta com arquivos e sem .git (um zip baixado, por exemplo): instala o que está nela.
  Write-Warning "$Pasta não é um clone do git: instalo a partir dos arquivos como estão."
} else {
  Rodar git @('clone', '--branch', $Branch, 'https://github.com/soulrocha/Claude-code-hero-journey.git', $Pasta)
}

if (-not $SemTestes) {
  Passo 'Validador e testes (verificar.ps1)'
  & powershell -ExecutionPolicy Bypass -File (Join-Path $Pasta 'scripts\verificar.ps1')
  if ($LASTEXITCODE -ne 0) { throw 'Os testes falharam: cole a saída na conversa antes de instalar.' }
}

Passo 'Marketplace local'
$lista = (claude plugin marketplace list) -join "`n"
if ($lista -match [regex]::Escape($marketplace)) {
  Rodar claude @('plugin', 'marketplace', 'update', $marketplace)
} else {
  Rodar claude @('plugin', 'marketplace', 'add', $Pasta)
}

Passo 'Instalando hero-journey'
$config = @('--config', "language=$Lingua")
if ($Vault -ne '') { $config += @('--config', "vaultPath=$Vault") }
if ($VaultInbox -ne '') { $config += @('--config', "vaultInbox=$VaultInbox") }
$instalados = (claude plugin list) -join "`n"
if ($instalados -match 'hero-journey') {
  if ($Vault -ne '' -or $VaultInbox -ne '') {
    Write-Warning 'Já instalado: -Vault e -VaultInbox não são reaplicados na atualização. Ajuste em ⚙ → ✦ Primeiros passos.'
  }
  Rodar claude @('plugin', 'update', $plugin)
} else {
  Rodar claude (@('plugin', 'install', $plugin) + $config)
}

Write-Host "`nInstalado. Feche e abra o Claude Code (terminal ou app desktop) e digite /hero." -ForegroundColor Green
Write-Host 'Achou algo estranho? Abra uma issue: https://github.com/soulrocha/Claude-code-hero-journey/issues' -ForegroundColor Green
