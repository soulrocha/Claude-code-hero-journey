# Contribuindo / Contributing

**Português** · [English](#english)

Obrigado por querer ajudar. O projeto está em **beta**, feito primeiro para o app desktop do Claude Code. O suporte ao CLI (terminal) vem depois.

## Antes de começar

- **Bug:** abra uma issue com o que você fez, o que esperava, o que aconteceu, a versão do Claude Code (`claude --version`) e, se for de tela, um print.
- **Ideia ou mudança grande:** abra uma issue antes do código, para combinarmos o desenho.
- **Falha de segurança:** não abra issue pública. Siga a [política de segurança](SECURITY.md).

## Rodando localmente

```sh
./scripts/verificar.sh                                           # macOS/Linux
powershell -ExecutionPolicy Bypass -File scripts\verificar.ps1   # Windows
```

O script roda o validador (`claude plugin validate`) e os testes no motor do próprio Claude Code (`claude plugin test`), sem gastar tokens. Para carregar o mod direto da pasta enquanto você mexe, veja "Rodar direto da pasta" no [README](README.md#-instalação).

## Como o código é organizado

- **Todo código que usa `$`** (a interface do motor) fica em `mods/clawd-hud/hooks/register.tsx`, em funções no topo do arquivo, porque o motor não segue o `$` através de imports.
- **Cada módulo** fica em `hooks/modules/<módulo>/`: a lógica pura em `<módulo>.ts` e a tela em `view.tsx`.
- **Textos** ficam em `hooks/core/i18n.ts`, sempre em português e em inglês.
- **`<Button>`** recebe a prop `label` ou um único filho de texto. O motor recusa filhos compostos.

## Pull requests

1. Um assunto por PR, com um título que diga o que muda.
2. Para comportamento novo ou bug corrigido, inclua um teste que falha sem a sua mudança.
3. O `verificar` precisa passar.
4. Nada de token, credencial, caminho pessoal ou dado de terceiros em código, teste ou print.
5. A HUD não chama o modelo sozinha. Se a sua mudança gasta tokens, ela precisa de um clique da pessoa e de um aviso no ⚙.
6. Mudou algo visível? Atualize os READMEs (pt-BR e inglês) e o [CHANGELOG](CHANGELOG.md).

Ao contribuir, você concorda que o seu código entra sob a [licença MIT](LICENSE) do projeto.

---

## English

Thanks for helping. The project is in **beta** and targets the Claude Code desktop app first; CLI (terminal) support comes later.

- **Bugs:** open an issue with what you did, what you expected, what happened, your Claude Code version (`claude --version`) and, for screen issues, a screenshot.
- **Big ideas or changes:** open an issue before writing code so we can agree on the design.
- **Security issues:** never in a public issue. Follow the [security policy](SECURITY.md).

**Run locally:** `./scripts/verificar.sh` (macOS/Linux) or `powershell -ExecutionPolicy Bypass -File scripts\verificar.ps1` (Windows). It runs the validator and the engine tests, spending no tokens.

**Code layout:** everything that uses `$` lives in `hooks/register.tsx` (top-level functions); each module keeps pure logic in `<module>.ts` and its screen in `view.tsx`; strings live in `hooks/core/i18n.ts` in both languages; a `<Button>` takes a `label` prop or one string child.

**Pull requests:** one topic per PR; a test that fails without your change; `verificar` green; no tokens, credentials, personal paths or third-party data; nothing that calls the model without a click; update both READMEs and the [CHANGELOG](CHANGELOG.md) for visible changes. Contributions are licensed under the project's [MIT license](LICENSE).
