# Verifica os mods do Claude Code Hero Journey no seu PC (Windows, PowerShell).
# Roda o validador e os testes do próprio Claude Code; não gasta tokens.
#   powershell -ExecutionPolicy Bypass -File scripts\verificar.ps1

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

Write-Host "== Claude Code" -ForegroundColor Cyan
claude --version

$falhas = 0
foreach ($alvo in @('.', 'mods/clawd-hud', 'mods/clawd-hud-spike')) {
  Write-Host "`n== validate $alvo" -ForegroundColor Cyan
  claude plugin validate $alvo
  if ($LASTEXITCODE -ne 0) { $falhas++ }
}
foreach ($mod in @('mods/clawd-hud', 'mods/clawd-hud-spike')) {
  Write-Host "`n== test $mod" -ForegroundColor Cyan
  claude plugin test $mod
  if ($LASTEXITCODE -ne 0) { $falhas++ }
}

if ($falhas -eq 0) {
  Write-Host "`nTudo verde. Próximo passo: o roteiro em mods/clawd-hud-spike/README.md no app." -ForegroundColor Green
} else {
  Write-Host "`n$falhas verificação(ões) falharam. Cole a saída na conversa." -ForegroundColor Red
  exit 1
}
