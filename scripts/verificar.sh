#!/usr/bin/env sh
# Verifica os mods do Claude Code Hero Journey (macOS/Linux). Não gasta tokens.
set -u
cd "$(dirname "$0")/.."
claude --version
falhas=0
for alvo in . mods/hero-journey mods/clawd-hud-spike; do
  echo "== validate $alvo"; claude plugin validate "$alvo" || falhas=$((falhas + 1))
done
for mod in mods/hero-journey mods/clawd-hud-spike; do
  echo "== test $mod"; claude plugin test "$mod" || falhas=$((falhas + 1))
done
[ "$falhas" -eq 0 ] && echo "Tudo verde." || { echo "$falhas verificação(ões) falharam."; exit 1; }
