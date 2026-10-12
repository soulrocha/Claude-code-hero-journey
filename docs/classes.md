# Classes do Hero Journey

Mapa de trabalho: cada coisa que o Claude faz ganha uma classe. Começou em 2026-10-11, depois do protótipo `/palco`. As decisões entram na coluna **Decisão** à medida que forem fechadas.

Referências de classe (decidido em 2026-10-11): universos de RPG, como D&D e Baldur's Gate, World of Warcraft, Diablo, Tree of Savior, The Witcher, Dragon Age e Expedition 33. O Ragnarok só inspira o Aprendiz. Personagens de jogos servem **só de referência**: quem veste cada classe é sempre o Clawd. Nada de nome, logo ou arte copiada dos jogos no produto (o repositório é público); a homenagem fica nos elementos (armas, acessórios, cenário, efeitos).

## O que o Claude faz, em famílias

Base: as ferramentas que o motor 2.1.295 declara (`claude-code-tools`) e os MCPs conectados no PC pessoal. "Hoje" é o que `core/classes.ts` decide.

| # | Família | Ferramentas | Hoje | Decisão |
|---|---|---|---|---|
| 1 | Pensar e responder (sem ferramenta) | — (o spinner diz `thinking`/`responding`) | nenhuma | **Aprendiz**: o principal, em treinamento; o campo de treino tem um elemento de cada classe (inspiração: o Aprendiz do Ragnarok) |
| 2 | Ler e buscar no projeto | Read, Grep, Glob, LSP, NotebookRead, ToolSearch e comandos só de leitura (ls, cat, git status, git log) | Mago | **Mago**: a biblioteca é o palco dele; um toque da Lune (Expedition 33) |
| 3 | Pesquisar na web | WebSearch, WebFetch, context7 | Mago | **Caçador**: volta segurando uma página da web; a coruja voltando com a página, como a caçadora night elf do WoW |
| 4 | Navegar em sites | Claude_Browser, claude-in-chrome | Alquimista | **Ladino** (Rogue): faz o recorte da página e "rouba" os elementos |
| 5 | Editar código | Edit, Write, MultiEdit, NotebookEdit (arquivo de código) | Artífice | **Rúnico** (Rune Caster, Tree of Savior): runas com `</>` e glifos de linguagens e ferramentas (TS, `{ }`, λ, #), desenhados por nós |
| 6 | Editar telas e estilo | Edit/Write em .tsx, .html, .css, .svg | Ilusionista | **Ilusionista**: varinha que projeta formas e cores no lugar do pincel |
| 7 | Escrever docs e textos | Edit/Write em .md, docs, Artifact, docs MCP | Artífice | **Sábio** (Sage, Tree of Savior) |
| 8 | Comandos de terminal gerais | Bash/PowerShell sem regra (npm install, build, scripts) | Artífice | **Engenheiro**: homenagem ao Gustave (Expedition 33), braço mecânico e palco com ecos do jogo |
| 9 | Testes, lint e tipos | Bash com test/lint/tsc, arquivos de teste | Paladino | **Bruxo**: como o Geralt (The Witcher), caçando monstros (bugs) na espadada |
| 10 | Git, commit e PR | Bash com git commit/push, gh pr, MCP de PR | Arauto | **Rei**: o Arauto muda de nome; coroa e selo real ficam |
| 11 | Pipeline, deploy e infraestrutura | az pipelines, docker, kubectl, terraform, arquivos de pipeline | Patrulheiro | **Artífice**: forjando o deploy e a infra (a forja do palco é dele) |
| 12 | Logs e monitoramento | logs, tail, Monitor, TaskStop | Patrulheiro | **Oráculo**: consulta os logs e lê os sinais |
| 13 | Banco de dados | psql, sqlcmd, prisma, migrações, .sql | Anão | **Geomante**: o banco é um bloco de terra com suas fendas; ele dobra a terra e arranca um disco ou um pedaço, como os dobradores de terra de Ba Sing Se (Avatar). O Anão sai, porque é raça e não classe |
| 14 | APIs e integrações | curl/http, MCPs em geral | Alquimista | **Alquimista** |
| 15 | Planejar e organizar tarefas | TaskCreate/Update/List, TodoWrite, Enter/ExitPlanMode, ProposeGoal | Druida | **Cartomante**: mistura da Sciel (Expedition 33, que prevê e colhe depois) com o Astrólogo do Final Fantasy XIV (cartas e estrelas); cada passo do plano é uma carta virada |
| 16 | Liderar subagentes | Agent, SendMessage, ListAgents, Workflow | classe do subagente | **Invocador**, um invocador feliz (nada do necromante sombrio de Diablo) |
| 17 | Agendar e automatizar | CronCreate/Delete/List, ScheduleWakeup, RemoteTrigger, scheduled-tasks | Druida | **Cronomante** (mago do tempo): a forma humanoide dos dragões de bronze do WoW, com efeitos de magia do Tree of Savior e do WoW |
| 18 | Falar com você e com o mundo | SendUserFile, PushNotification, Gmail, Calendar (a pergunta para você é o estado **Sua vez**, não classe) | Druida / Alquimista | **Rei** (o mesmo da família 10: anunciar a mudança e falar com o mundo; o Bardo saiu na fusão) |
| 19 | Memória e saber (grimório) | escrita na memória, Skill, ListSkills, SearchSkills | Druida / Artífice | **Sábio** (o mesmo da família 7, guardião do grimório) |
| 20 | Segurança e revisão | /security-review, ReportFindings | Paladino | **Paladino**, redesenhado: armadura, escudo e espada. A guarda dos protegidos não é classe: quem barra o arquivo crítico é um dragão vermelho (revisão de 2026-10-11) |
| 21 | Design visual | ClaudeDesign, DesignSync, Figma, visualize | Alquimista | **Pintor**: Expedition 33 (a Maelle como referência) |

## Elenco

19 classes, fechadas em 2026-10-11.

| Classe | Famílias | Do desenho de hoje |
|---|---|---|
| Aprendiz | 1 | novo (era o Druida) |
| Mago | 2 | fica; ajuste com toque da Lune |
| Caçador | 3 | novo |
| Ladino | 4 | novo; o Verso (Expedition 33) como referência |
| Rúnico | 5 | novo |
| Ilusionista | 6 | redesenhar (sai o pincel) |
| Sábio | 7, 19 | novo |
| Engenheiro | 8 | novo |
| Bruxo | 9 | novo |
| Rei | 10, 18 | era o Arauto; coroa fica, carimbo vira selo real; também fala com o mundo |
| Artífice | 11 | fica; muda de família |
| Oráculo | 12 | novo |
| Geomante | 13 | novo (o Anão sai) |
| Alquimista | 14 | fica |
| Invocador | 16 | novo |
| Cronomante | 17 | novo |
| Cartomante | 15 | nova; Sciel + Astrólogo do FFXIV |
| Paladino | 20 | redesenhar (sai óculos e lupa) |
| Pintor | 21 | novo |

Saem: Druida (vira o Aprendiz), Patrulheiro, Anão, Arauto (vira o Rei), Bardo (fundido no Rei).

Fusões decididas: Bardo no Rei. Ficam separados Caçador e Ladino, e Artífice e Oráculo.

## Como desenhar

- **O Clawd de cada classe, sem fundo**, com duas animações: trabalhando e falha.
- **Trabalhando, cada classe tem o seu cenário** (biblioteca do Mago, forja do Artífice etc.), como no `/palco`.
- **Parado, o palco é o acampamento**, com duas animações: acordado aguardando (sua vez) e dormindo (a sessão parou).
