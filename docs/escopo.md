# Escopo do Hero Journey

O que a HUD deve fazer, o que ela faz hoje e o que sai para ela ficar menor e melhor. Escrito em 2026-10-10, a partir do código da `main` (ba15904, 96 testes passando no motor 2.1.295), da documentação de mods (ver [mods-capacidades.md](mods-capacidades.md)) e da comparação com outros mods públicos.

## Estado em 2026-10-10 (noite)

Feito na versão 0.5.0, com 102 testes passando no motor 2.1.295:

- **Saiu:** Projetos, Side quest, a comemoração em toast, o agrupamento do diário, os perfis e seções do painel, o código do relatório e as artes sem uso. As três artes viraram `core/art.ts`.
- **Entrou:** o recibo do turno, os recursos aprimorados (a tabela "O que muda", menos o mini gráfico dos turnos, o toast depois do `/compact` automático, a Fogueira e o Ouro; o peso do último turno ficou no tooltip), o seletor de pasta do sistema para o vault e o atalho para a pasta das decisões.
- **Corrigido:** a HUD volta certa depois de `/clear`, `/resume` e `/branch`.
- **Mudou em relação a este plano:** o **grimório e os Primeiros passos ficam**, porque o vault com o seletor de pasta e o apoio ao ai-memory continuam no produto; só o passo de projeto saiu dos Primeiros passos. A **divisão do `register.tsx` não dá**: o motor recusa o `$` passado para uma função importada ("$ is followed only into a function declared in this same file"); a lógica pura já mora nos módulos.
- **A conferir no app:** a linha do recibo embaixo da resposta no desktop, a animação de alerta das barras e o seletor de pasta abrindo na frente do app.

## A promessa

> **Bata o olho e saiba o que o Claude está fazendo, sem perder o objetivo.**

Toda função da HUD tem de responder a uma destas perguntas. O que não responde a nenhuma vai para outro mod ou sai.

1. **O que o Claude está fazendo agora?** Quem age (a classe), em quê (o arquivo ou o comando) e por quê (a frase de intenção).
2. **Onde estou no objetivo?** O pedido que abriu a sessão, os passos feitos e os que faltam.
3. **Quanto fôlego ainda tenho?** Contexto, janela de 5 horas e janela semanal.
4. **O que precisa de mim?** Um arquivo protegido prestes a mudar, um recurso no fim, uma pergunta do Claude.

O tema de RPG é o jeito de responder: a classe dá cor e mascote à ação, a quest dá forma ao objetivo, a mochila, a mana e o vigor dão forma aos limites, e o chefe dá peso ao arquivo protegido.

## Fica, sai, refatora

### Fica

| O quê | Como fica |
|---|---|
| **Faixa acima do prompt** | Uma linha: classe e intenção durante o turno, trilha do objetivo, subagentes em expedição, ◈ para o painel. Ganha um selo de recurso **só quando algum entra em alerta**. |
| **Painel** (`/hero`) | Objetivo com a barra de passos (com ✦ Recalibrar e Marcar como alcançado), quests, grupo ou inventário, rodapé de recursos. |
| **Recursos: Mochila, Mana e Vigor** | Viram um módulo só, aprimorado (seção abaixo). |
| **Guarda dos protegidos** | Dois modos: o diálogo do Claude com a linha de arquivos (o Guardião do Cofre na pele Épico) e só o diálogo nativo. |
| **Selo no diário** | O mascote e o chip de resultado em cada linha de ferramenta durante o turno. |
| **Campanha** | Por dentro: guarda o objetivo e os capítulos que alimentam a barra, a faixa e o recibo. |
| **Peles Épico e Sóbrio, português e inglês** | Como estão. |
| **Grimório e Primeiros passos** | Ficam (decidido em 2026-10-10): o vault ganha o seletor de pasta do sistema e o atalho para a pasta das decisões, e o ai-memory continua recomendado, também para quem já usa. Os Primeiros passos perdem só o passo de projeto. |

### Sai da HUD

| O quê | Para onde |
|---|---|
| **Projetos** (`/projetos`, acesso às pastas) | Mod próprio, ou recomendar o [claude-console](https://github.com/SaM-runtime/claude-console). |
| **Side quest** (`/side-quest`) | Recomendar o [ctx-handoff](https://github.com/cablate/ctx-handoff-mod) ou o [claude-auto-handoff](https://github.com/alexknowshtml/claude-auto-handoff). |
| **Relatório da missão** | Já não aparecia; o código morto sai. |
| **Comemoração em toast** | Vira o **recibo do turno**: uma linha embaixo da resposta (`turn.complete` → `{ text }`) com a classe que mais agiu, +/−, arquivos novos, falhas e duração. Zero tokens, e fica no chat depois que o diário some. |
| **Agrupamento do diário** (Separar ›, modo Agrupado/Separado) | O app desktop já recolhe as linhas no fim do turno. |
| **Perfis do painel** (Completo, Foco, Mínimo, Personalizado) e a escolha de seções | O ⚙ fica com módulos, pele, língua e modo do guarda. |

### Refatora

| O quê | Por quê |
|---|---|
| **Recarregar o estado em `classic.SessionStart`** | Defeito: depois de `/clear`, `/resume` e `/branch` a HUD volta para inglês e para as preferências padrão. |
| **Recursos lidos em átomo**, por `session.measure`, `session.compact` e um relógio de 1 minuto | Hoje o rodapé lê `$.session.usage()` a cada desenho e a contagem "↻ 2h" fica parada entre os turnos. |
| **Três arquivos de arte em um** (`art.ts`, `hero-art.ts`, `polish-art.ts`) e as artes sem uso apagadas | `diaryMark`, `sectionTitle`, `doneQuestsArt`, `questBox`, `meter`, `resourceBar`, `book`, `statusIcon`, `campaignCard`, `tabRail`, `resourceRows` e `reportView` não são chamadas. |
| **`register.tsx` (1.286 linhas) dividido por módulo** | Só se o validador seguir o `$` passado para funções importadas; testar essa premissa antes. |
| **`i18n.ts`, `types` e testes** | Saem os textos, os tipos e os testes dos módulos que deixam a HUD. |

Resultado: cerca de mil linhas a menos (Projetos, Side quest, agrupamento, perfis, relatório, artes duplicadas e 62 textos sem uso); o mod deixa de gravar no `settings.local.json`.

## Recursos: Mochila, Mana e Vigor

Referências lidas no código: [token-weather oficial](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather), [token-weather com o relógio do cache](https://github.com/hamzafer/claude-code-mods/tree/main/mods/token-weather), [usage-meter](https://github.com/hamzafer/claude-code-mods/tree/main/mods/usage-meter) e [context-bar](https://github.com/hamzafer/claude-code-mods/tree/main/mods/context-bar).

### Como está hoje

- Três barras em `Svg` no rodapé do painel, com o valor e o "↻" do reset; no terminal, uma linha de texto.
- A Mochila mede a porcentagem da janela do modelo; o cartão de compactar entra a 85% dela.
- A leitura acontece a cada desenho do painel. Nada redesenha entre os turnos, então o "↻ 2h" envelhece.
- Mana e Vigor não avisam quando acabam e mostram o número velho depois que a janela já virou.

### O que muda

Legenda: **Dá** = funciona no desktop com a API atual. **Aproxima** = dá com ressalva.

| Melhoria | Inspiração | Situação |
|---|---|---|
| **Mochila mede até o ponto de compactação**, não até o fim da janela: "faltam 42k para compactar". A barra ganha a marca do ponto. O cartão de 85% passa a contar contra esse ponto (hoje ele pode nunca aparecer, porque o Claude Code compacta antes). | context-bar (`$.session.usage({ breakdown: 'summary' })`, estimado localmente, sem tokens) | Dá |
| **Estado da mochila em palavras**: Leve, Carregada, Pesada, Transbordando, com a cor indo de verde a vermelho. | token-weather (Clear → Compact soon) | Dá |
| **Peso do último turno**: "▲ +18k no último turno" e um mini gráfico dos últimos 12 turnos dentro do `Svg`. Mostra qual pedido encheu a mochila. | token-weather (sparkline e tendência) | Dá. Feito só o "▲ +18k", no tooltip; o mini gráfico fica para depois (os 12 valores já são guardados). |
| **O que tem na mochila**: passar o mouse mostra as maiores categorias (mensagens, ferramentas MCP, arquivos de memória, skills, sistema). | context-bar (legenda por categoria) | Dá (`<title>` do `Svg` interativo) |
| **Atualiza depois de um `/compact`**, também o automático, com um toast "Mochila esvaziada: 160k → 40k". | context-bar (`session.compact`) | Dá. Feita a nova leitura; o toast só existe no Compactar agora. |
| **Contagem do reset que anda**: relógio de 1 minuto, só enquanto houver reset pela frente. | usage-meter | Dá |
| **Janela que já virou** mostra "recarregada" em vez do número velho até a próxima leitura. | usage-meter (`isStale`) | Dá |
| **Cor pelo que resta**: Mana e Vigor ficam âmbar abaixo de 25% e vermelhos abaixo de 10%. | usage-meter | Dá |
| **Aviso uma vez por período**: "Mana em 10%: recarrega às 15h40 (em 1h12)". | usage-meter (um toast por janela por período) | Dá |
| **Ritmo**: compara o que foi gasto com o tempo que já passou da janela e diz "no ritmo" ou "gastando rápido: acaba antes do reset". | ideia nova | Dá (conta simples) |
| **Selo na faixa só em alerta**: 🎒 Pesada, 💧 Mana 8%. Fora disso a faixa continua enxuta. | — | Dá |
| **Fogueira (cache de prompt)**: depois da última resposta, o cache fica quente por 5 minutos (ou 1 hora). A fogueira mostra o tempo que falta; apagada, avisa que a próxima mensagem relê tudo pelo preço cheio. O pavio pode queimar por animação SMIL, sem redesenhar a cada segundo. | token-weather do hamzafer (relógio do cache) | Aproxima: a API não diz se o cache é de 5 min ou 1 h. O mod de referência lê o transcript; no Windows teria de ser por `$.fs.read` e `USERPROFILE`. Alternativa: opção 5m/1h. A animação SMIL no desktop ainda não foi confirmada. |
| **Ouro (custo da sessão em US$)**, opcional, para quem usa chave de API. | usage-meter | Dá; desligado por padrão |

### Ordem sugerida

1. Leitura em átomo, relógio de 1 minuto, janela virada e cor pelo que resta (base de tudo).
2. Mochila contra o ponto de compactação, estado em palavras e atualização depois do `/compact`.
3. Peso do último turno, mini gráfico e o que tem na mochila.
4. Avisos por período, ritmo e selo na faixa.
5. Fogueira, depois de confirmar a animação SMIL e o jeito de saber a duração do cache.

## Comparação com outros mods

| Mod | O que faz | O que o Hero Journey aprende |
|---|---|---|
| [where-am-i](https://github.com/hamzafer/claude-code-mods) | Objetivo, o que faz agora, o que espera de você e o próximo passo, numa linha. | É a nossa promessa sem o RPG. Falta à HUD o **"esperando você"**. |
| [Flightdeck](https://github.com/scasella/claude-flightdeck) | Painel de agentes: contexto e custo, checagens de permissão, subagentes em cartões, recibo do turno. | O recibo do turno em uma linha embaixo da resposta. |
| [token-weather](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather), [usage-meter](https://github.com/hamzafer/claude-code-mods), [context-bar](https://github.com/hamzafer/claude-code-mods) | Contexto, janelas de uso, cache e categorias. | Base das melhorias dos Recursos. |
| [inbox](https://github.com/petekp/inbox) | Junta perguntas, tarefas e achados; uma chamada ao Sonnet por resposta. | Bom modelo de "o que precisa de mim", mas paga tokens em todo turno; a HUD continua sem tokens por padrão. |
| [ctx-handoff](https://github.com/cablate/ctx-handoff-mod), [claude-auto-handoff](https://github.com/alexknowshtml/claude-auto-handoff) | Passa a sessão para uma nova com resumo, lembra preferências. | Cobrem a side quest e parte do grimório. |
| [blast-radius](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/blast-radius) | Segura comandos destrutivos e mostra o que seria apagado. | O guarda já mostra o diff do protegido no modo Épico. |
| [replay-theater](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/replay-theater) | Passa pelas edições do último turno, um diff por vez. | Ideia futura: clicar no item do inventário e ver o diff. |

O que só o Hero Journey tem: o tema de RPG e o desenho feito para o app desktop (`Svg` com animação, hover, raridade). Quase todos os outros foram feitos para o terminal.

## Depois do núcleo

- **"Sua vez"** na faixa quando o Claude termina com uma pergunta ou espera uma permissão.
- **Spinner com a classe**: "Artífice forjando…" no lugar da palavra do spinner (o site `Spinner` funciona no desktop).
- **Diff no inventário** com `Code format="diff"`.
- **Suporte ao terminal**, com os recursos numa linha de texto como a do usage-meter.
