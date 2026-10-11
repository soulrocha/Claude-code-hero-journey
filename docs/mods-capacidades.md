# O que a API de mods entrega para o Hero Journey

Mapa de referência para decidir o que dá para fazer antes de desenhar. Base: Claude Code **2.1.295** (tipos do motor, `reference.md` da skill `plugin-authoring` e as 10 páginas de code.claude.com/docs/en/plugins/mods, lidas em 2026-10-10). A API é *early access* e muda entre versões: quando o motor atualizar, conferir o diff dos tipos antes de prometer algo.

Legenda: **Dá** = funciona no app desktop. **Aproxima** = dá com outra forma ou com ressalva. **Não dá** = a API não permite.

## Onde o mod desenha

| Lugar | Desktop | Observação |
|---|---|---|
| Painel (`Pane`, via `$.ui.open`) | Dá | Uma instância por `id`; com mais de um aberto vira abas. Largura em `e.props.bodyColumns`, altura em `scroll.bodyRows`. Árvore mais alta que o painel rola inteira. |
| Faixa acima do prompt (`AbovePrompt`) | Dá | Uma só, dividida com outros mods; cede quando `hasSurvey`. O motor desenha `[-]` e "n more" por conta própria. |
| Mensagens (`UserMessage`, `AssistantMessage`) | Dá | Reescrever muda só o que aparece; o que o modelo leu fica igual. |
| Linhas de ferramenta (`ToolUse`, `ToolResult`, `ToolGroup`) | Aproxima | Os sites existem, mas no desktop o fim do turno recolhe tudo em "Executado N ações" e nenhum `ToolGroup` chega ao mod (visto no laboratório). O diário no chat só vive durante o turno. |
| Spinner | Dá | No desktop é a linha com a marca do turno; `word` diz o passo ("Creating notes.md"). Pode trocar texto ou desenhar árvore própria. |
| `SessionMode`, `PromptHint` | Dá | `PromptHint.tail` só o terminal desenha por enquanto. |
| `CommandOutput` | Dá | A resposta de um comando nosso pode virar árvore no transcript. |
| `AskUserQuestion` | Dá | A árvore tem de conter a referência do motor exatamente uma vez, com nossos elementos acima. |
| `ToolProgress`, `TurnDuration`, `InfoNotice` | Não dá | Só terminal. |
| Pedido de permissão | Não dá | Não é site de desenho; nenhum mod muda o que ele mostra. |
| Toast, linha de status, linha de log | Dá | `$.ui.toast`, `$.ui.status` (começa com ⚠ e o nome do mod), `$.ui.log` (linha fraca no transcript, o modelo não lê). |
| Notificação nativa (`$.ui.notify`, novo na 2.1.295) | Não dá | Sem terminal (caso do desktop) só os hooks rodam; volta `no-surface`. |
| Som (`$.audio.play`, `speak`) | Não dá | Só toca no macOS; Windows não tem player. |

Fora do desktop: no painel de chat da extensão VS Code e no `claude -p` os hooks rodam mas nada aparece; sessão WSL do desktop não carrega plugin. O comando `/plugin install` não existe na aba Code do desktop: instalação é pelo terminal.

## Elementos no desktop

| Elemento | Situação | O que importa |
|---|---|---|
| `Box` | Dá | Flex, `gap`, padding, margin, `width/height` (número ou %), `borderStyle` (só os 10 nomes: `single`, `double`, `round`, `bold`, `singleDouble`, `doubleSingle`, `classic`, `arrow`, `dashed`, `quote`), `borderColor`, `backgroundColor`, `overflow`, `display`, `position: absolute` com `top/left/right/bottom` em células. |
| `Text` | Dá | `color`, `backgroundColor`, `bold`, `italic`, `underline`, `strikethrough`, `dimColor`, `inverse`, `wrap`. Sem fonte, tamanho de letra ou espaçamento próprios. |
| `Button` | Dá | Botão nativo do desktop (com ou sem `plain`). Novo na 2.1.295: aceita filhos de texto e `Text` (um chip, uma parte fraca) e vira uma linha inteira clicável. `variant="primary"`, `role="dismiss"`, `hotkey`, `autoFocus`. |
| `Svg` | Dá | Único lugar com liberdade visual (gradiente, raio, ilustração). Até 131.072 caracteres. Com `isInteractive`: `:hover` em CSS, animação SMIL e tooltip `<title>`. Sem script e sem clique dentro: o clique vai num elemento em volta. Declarar `color-scheme` para o frame não ficar branco no tema escuro. |
| `Markdown`, `Code` (com diff), `Link` | Dá | `Link` no desktop só vira âncora com `https:` (ou `http://localhost`) e `@` escrito como `%40`. |
| `Input`, `Select` | Dá | Campo de texto e lista de opções. |
| `Client` | Aproxima | Arquivo nosso que desenha uma região com estado local, relógio próprio (`every`), ponteiro e teclas, e conversa com os hooks por `ui.message`. A doc online marca Desktop ✓; os tipos dizem que o desktop "leva como dado". Testar no app antes de apostar nele. |
| `Raster`, `Image` | Não dá | Só terminal. |

Cor: chave do tema (`claude`, `success`, `warning`, `error`, `subtle`, `suggestion`, `permission`, `planMode`, `autoAccept`, `diffAdded`...) segue o tema da pessoa; qualquer outra string é cor crua (nome ou hex). Hex de 8 dígitos no desktop ainda não confirmado.

## Interação sem hook

- **Hover**: um `Box` com `key` vira escopo; `hover={{ ... }}` troca estilo sob o ponteiro, sem rodar hook.
- **Grupo de hover entre sites** (`scope`): acender o mesmo grupo no painel e no transcript ao mesmo tempo.
- **Cartão sobreposto**: `Box position="absolute" display="none" hover={{ display: 'flex' }}` aparece por cima sem empurrar nada. É o caminho para o "cartão de raridade" e para tooltips fora do `Svg`.

## Redesenho e animação

- O motor redesenha quando as props do site mudam ou a largura muda. Fora isso: `$.ui.invalidate('ui.render')`, ou ler valores de `$.state` (gravar redesenha só quem leu).
- Limite: **10 redesenhos por segundo** no desktop (30 no terminal para painel visível e faixa). Animação mais fluida que isso só por SMIL no `Svg` ou num `Client`.
- `ui.render` nunca grava estado; grava-se de `onPress`, `onSubmit` ou de outro evento.

## Estado

| Onde | Dura até | Uso no Hero Journey |
|---|---|---|
| Variável do módulo | o próximo reload | cache descartável |
| `$.state` | fim da sessão, `/clear`, `/resume`, `/branch` | o que o painel e a faixa desenham |
| `$.store` | apagar ou ficar sem uso por `cleanupPeriodDays` (4 MiB no total, compartilhado entre sessões) | preferências, campanha, histórico |

Depois de `/clear`, `/resume` e `/branch` o `session.start` **não** roda de novo: recarregar do `$.store` num hook `classic.SessionStart` com `source` em `clear`, `resume` ou `fork`.

## Eventos e poderes que ainda não usamos

O mod hoje usa `tool.call`, `turn.start/step/complete`, `prompt.submit`, `session.start/measure`, `agent.spawn`, `command.run`, `config.set` e 5 `ui.render`. Fica disponível:

| Poder | Para quê no Hero Journey | Custo |
|---|---|---|
| `$.model.fork({ prompt })` | Resumo do capítulo ou relatório a partir do transcript real, servido do cache de prompt | tokens (barato pelo cache) |
| `$.model.classify` | Classificar a intenção de uma ação na classe certa quando a regra fixa não decide | tokens |
| `$.tool.register` | Dar ao Claude uma ferramenta própria (ex.: marcar passo da quest como feito), em vez de adivinhar pelo texto | tokens por chamada; aparece como `mcp__hero-journey__<nome>` |
| `$.agent.register` | Classes do grupo como tipos de subagente reais (`hero-journey:mago`) | tokens ao usar |
| `prompt.compose` | Uma seção no prompt de sistema (ex.: pedir que o Claude declare a intenção antes das ferramentas) | tokens em todo turno |
| `turn.complete` devolvendo `{ text }` | Uma linha embaixo da resposta ao fim do turno (ex.: "+1 quest · Artífice") | zero |
| `session.append` | Reescrever ou acrescentar linhas que a conversa guarda | zero; cuidado, muda o que o modelo lê |
| `session.send` / `session.receive` | Falar com outras sessões e subagentes; ver mensagens que chegam | zero |
| `$.ui.ask` dentro de `tool.call` | Segurar a ferramenta até a pessoa decidir (o guarda já usa) | zero |
| `$.ui.selection()` | Ler o que a pessoa selecionou na página do desktop (ex.: "guardar no grimório") | zero |
| `$.ui.copy` | Copiar texto do relatório | zero |
| Comando com `immediate: true` | Abrir o painel mesmo com o Claude trabalhando | zero |
| `classic.*` | Ouvir os hooks de settings (`Stop`, `PostToolUse`...) | zero |

## Limites que mordem

- Hook: 10 s do próprio tempo por evento (esperar `next` ou `$` não conta; `$.clock.sleep` conta). `.catch`: 1 s. Hook que estoura é pulado; guarda sem `.catch` deixa passar.
- Painel aberto pelo mod sozinho (timer, `turn.start`) só aparece a partir de 144 colunas (110 depois que a pessoa abriu uma vez). Aberto por comando ou clique aparece em qualquer largura.
- Árvore: desenha os primeiros 100.000 caracteres. `$.store`: 4 MiB. `$.session.messages()`: últimas 4.096 entradas. `$.fs`: 4 MiB por arquivo. `$.process.run`: 30 s (máx. 10 min).
- Tab e setas não podem ser remapeadas; teclas só chegam com o painel ou a faixa em foco.
- Módulo sem `import()` dinâmico, sem DOM e sem Node; tudo fora dele passa por `$`.
- Árvore inválida (elemento que o desktop não tem, prop desconhecida) não aparece: o motor desenha o dele e a linha fraca no transcript diz o motivo.

## Fontes

- Tipos do motor: `.claude-plugin/types/claude-code/index.d.ts` ao lado do mod carregado (cerca de 21.500 linhas).
- Doc online: https://code.claude.com/docs/en/plugins/mods/overview (índice em https://code.claude.com/docs/llms.txt).
- Mods de exemplo: `anthropics/claude-code` (pasta `mods/`: `diff`, `agents-md`, `sec-default`, `telemetry`) e `anthropics/claude-code-playground` (`claude-code/mods/`: `token-weather`, `blast-radius`, `replay-theater`).
