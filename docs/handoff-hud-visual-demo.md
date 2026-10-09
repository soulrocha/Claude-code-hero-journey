# Handoff: HUD igual à demo (branch `fix/hud-visual-demo`)

Atualizado em 2026-10-09. Feito para outra sessão do Claude Code continuar daqui, em outra máquina.

## Estado em uma linha

As correções visuais estão no código e passam no validador e nos testes do motor (87/87). **Ainda falta ver no app desktop** e rodar o QA adversarial, que caiu por limite de uso antes de terminar.

## O problema

Instalada, a HUD carregava (painel, faixa e classe certa), mas ficava "completamente diferente" da demo (`docs/assets/demo.webp`):

1. **Todo `Svg` aparecia com fundo branco no tema escuro:** títulos ◆ OBJETIVO ◆, o texto do objetivo, o Clawd da faixa e as barras.
   - Causa: com `isInteractive`, o `Svg` do desktop é desenhado num frame isolado (sandbox). Sem `color-scheme` declarado, o Chromium pinta o fundo desse frame de branco opaco quando o app está escuro.
   - Reproduzido num navegador: com o mesmo SVG, sem `color-scheme` o fundo sai branco, e com `:root{color-scheme:dark}` sai transparente.
2. **Título da pele Épico em Georgia serifada,** enquanto a demo usa sans-serif pequena e espaçada.
3. **O objetivo era um `Svg` de texto,** sem a linha do capítulo e sem a barra de progresso.
4. **O painel, a faixa e o diário não tinham a estrutura da demo:** cartões, molduras, chips e rodapé.

## O que mudou (`mods/clawd-hud`)

| Arquivo | Mudança |
|---|---|
| `hooks/core/ui.tsx` | `svg(c, art, key)` recebe o `Ctx`. O `withScheme` injeta `<style>:root{color-scheme:…}</style>` logo após a tag `<svg>` externa: `dark` ou `light` pela paleta, ou `light dark` no tema automático. É o ponto único por onde passam todos os desenhos; as 21 chamadas foram trocadas. |
| `hooks/core/art.ts` | Títulos em `system-ui` com letter-spacing `.28em`. `meter()` é a barra genérica e `resourceBar` passou a usá-la. `questBox` é novo. `doneQuestsArt` desenha quadrados. `TONE.card` é translúcido (hex de 8 dígitos). A bolinha do diário vira anel quando a ação termina. `objectiveArt` foi removido. |
| `hooks/modules/painel/view.tsx` | Objetivo como `Text` em negrito. Linha "cap. N · começou como: …" e barra N/M. Com mais de um capítulo, o objetivo passa a ser o título do capítulo atual. Quest atual em cartão destacado. Grupo em cartões com retrato emoldurado, incluindo o Clawd principal (vem do atom `working`). Aba ativa como botão com borda. Rodapé no formato da demo, com ↻ e o contador do grimório. |
| `hooks/modules/faixa/view.tsx` | Cartão com borda na cor da classe. |
| `hooks/modules/diario/view.tsx` | Chips com borda (`✓ +31 −6`, `em execução…`), linha em execução com fundo, grupo com chip `N/N` e botão `▾`. |
| `hooks/register.tsx` | `usageNow` ganhou `manaIn` e `vigorIn`. O painel recebe `working` e `pendingInscriptions`. |
| `hooks/core/i18n.ts` | Chaves novas em pt e en: `chapterLine`, `questsDone`, `inProgress`, `inAction`, `mainSession`, `missionDone`, `doneHint`, `splitHint`. |
| `tests/` | Teste de que todo `Svg` do painel declara o `color-scheme`. Teste puro do `withScheme`. O teste da faixa foi ajustado para a estrutura nova. |

## Como rodar na outra máquina

1. Clone e entre na branch:
   ```bash
   git clone https://github.com/soulrocha/Claude-code-hero-journey.git
   ```
   ```bash
   git -C Claude-code-hero-journey switch fix/hud-visual-demo
   ```
2. Cadastre o clone como marketplace de pasta e instale. Com marketplace de pasta, o plugin é **lido direto do clone**: editar e rodar `/reload-plugins` já basta, sem reinstalar.
   ```bash
   claude plugin marketplace add ./Claude-code-hero-journey
   ```
   ```bash
   claude plugin install clawd-hud@claude-code-hero-journey
   ```
3. No app desktop: `/reload-plugins` e depois `/hud`.
4. Verificação sem tokens, na raiz do clone:
   ```bash
   claude plugin validate mods/clawd-hud
   ```
   ```bash
   claude plugin test mods/clawd-hud
   ```
5. Checagem de tipos: os tipos do motor (`mods/clawd-hud/.claude-plugin/types/`, fora do git) aparecem quando o motor carrega o mod.
   - Crie um `mods/clawd-hud/tsconfig.json` temporário com `{ "extends": "./.claude-plugin/types/tsconfig.json" }`.
   - Rode `npx -y tsc -p mods/clawd-hud --noEmit` e apague o arquivo depois.
   - Já existiam na `main`: o erro em `register.tsx` (~linha 321) e os de `tests/modules.test.tsx` e `tests/projetos.test.tsx`.

## Verificado e não verificado

- **Verificado:** `claude plugin validate` passou e `claude plugin test` deu 87/87. Nos tipos, nenhum erro novo em `hooks/`. A causa do fundo branco foi reproduzida num navegador.
- **Não verificado:**
  - a aparência no app desktop depois do `/reload-plugins`;
  - se o desktop aceita hex de 8 dígitos (`TONE.card`) em `backgroundColor`;
  - se a borda dos `Box` (molduras, chips, faixa) fica como na demo;
  - o tema claro e o automático no app.
- **QA adversarial:** começou e parou por limite de uso, antes de dar veredito.

## Próximos passos, em ordem

1. `/reload-plugins` e `/hud` no app. Comparar com os quadros da demo; para extrair, abra `docs/assets/demo.webp` com Pillow e salve alguns quadros em PNG. Conferir:
   - nenhum quadro branco;
   - títulos sem serifa;
   - cartões e molduras.
2. Se `TONE.card` não aparecer, trocar por tons sólidos (`#36322a` escuro, `#ebe4d3` claro).
3. Rodar o QA adversarial com os casos:
   - terminal sem `Svg`;
   - objetivo de 280 caracteres;
   - 0 e 12 quests;
   - 8 subagentes;
   - tema claro e automático;
   - painel com 40 colunas.
4. Deixados de fora de propósito:
   - cronômetro ao vivo na faixa (precisa de timer);
   - recolher quests (▴);
   - ▾ nas linhas simples do diário;
   - progresso real de subagente (não existe no estado; a barra só "respira").
5. Abrir o PR da branch para a `main`.
