# hero-journey 🦀

**Português** · [English](#english)

Uma HUD de RPG aconchegante para o Claude Code desktop, com os caranguejos Clawd multiclasse. A saída do Claude não muda: a HUD só acrescenta os mascotes, o painel, a faixa e os cartões.

> **1.0, estável.** Funciona no app desktop e no Claude Code CLI (terminal). No terminal, os Clawds são pixel art própria e cada classe tem um ícone; veja [No terminal](#no-terminal).

## Instalar

Com o Claude Code (testado no motor 2.1.295):

```
/plugin install hero-journey --marketplace soulrocha/Claude-code-hero-journey
```

O mod instalado pelo terminal no escopo de usuário também carrega nas sessões do app desktop. Depois, digite `/hero`.

As opções da tabela de Configurações podem ficar vazias. Para respondê-las, use `/plugin configure hero-journey@claude-code-hero-journey` dentro do Claude Code, ou `--config chave=valor` no `claude plugin install`. A instalação pelo terminal só avisa quais opções ficaram sem valor. Na primeira vez que o painel abre, a página **Primeiros passos** pergunta de novo a língua, se você usa um vault (onde ele fica e qual a pasta de entrada, digitando ou pelo **📁 Escolher pasta**, que abre o seletor de pastas do sistema; as pastas são conferidas antes de salvar). Com o vault salvo, **📂 Abrir a pasta das decisões** abre a pasta onde o grimório deixa as decisões. O ai-memory não pede pasta: o grimório grava nele pelo MCP, quando o MCP está conectado. Sem vault, a tela recomenda o Obsidian; sem o MCP do ai-memory, recomenda o ai-memory, e com ele conectado convida a apoiar o autor. Para voltar a ela, use ⚙ → ✦ Primeiros passos.

## Módulos

Cada módulo liga e desliga no **⚙ do painel → Recursos**. Todos nascem ligados.

| Módulo | O que faz | Gasta tokens? |
|---|---|---|
| **Diário de bordo** | Em cada ferramenta, uma linha do mod no lugar da do app (sem o trilho): o Clawd da classe com 44 px (na falha, com a pose de falha), quem agiu e o quê, e o resultado à direita em texto nativo, sem borda ("novo", +/−, tempo, "falhou"), com o ✓/✗ sempre na mesma coluna; rodando, um anel gira. Vale durante o turno: no fim, o próprio app recolhe as linhas em "Executado N ações". | Não |
| **Faixa acima do prompt** | Uma linha. Durante o turno: o Clawd da classe, quem age e o arquivo em uso, na cor da raridade (ou o resumo da ferramenta); com plano, a trilha dos passos. Parado: **Sua vez**, ou os subagentes "em expedição". Nunca repete a frase do chat. O spinner do turno também diz a classe ("Mago lendo art.ts"). Em alerta, o selo do recurso (🎒 Mochila 92%, 💧 Mana 8%). O **Painel ›** abre e fecha o painel. | Não |
| **Painel** (`/hero`) | O palco no topo (a classe em ação no seu cenário, o Aprendiz pensando ou o acampamento, acordado na sua vez e dormindo depois de 5 min parado) → quem age e o arquivo → o objetivo (o título que o app dá à sessão; sem ele, ✦ Recalibrar) → só quando existem: o plano, o grupo em expedição e o inventário → presos no fim: os recursos, 📖 Grimório, 🎒 Compactar (só com a mochila pesada) e ⚙. Heróis e itens que não cabem viram "+N". | Só no **✦ Recalibrar** (Haiku) |
| **Campanha** | A sessão é a campanha: a 1ª mensagem dá o título e o objetivo, cada mensagem abre um capítulo, e o capítulo fecha no fim do turno com a missão (lida do formato briefing-de-bordo), os números e as falhas. Alimenta a barra do objetivo e o recibo. | Não |
| **Recibo do turno** | Uma linha embaixo da resposta: a classe que mais agiu, as ações, +/−, arquivos novos, falhas, bloqueios do guarda e o tempo. Com a missão cumprida sem falha, "🦀 ✦ Missão cumprida: …" abre a linha. | Não |
| **Guarda dos protegidos** | Antes de editar um arquivo crítico (a lista abaixo), um dragão vermelho barra o Claude: o cartão mostra o arquivo, o caminho e a mudança, e o diálogo do Claude pergunta (Aprovar, Editar no chat, Recusar). Também pergunta antes de um comando de terminal que escreveria neles (`>>`, `sed -i`, `rm`, `Set-Content`…). Dois modos no ⚙: **Perguntar** (padrão, vale até no modo automático) e **Só avisar** (uma nota no diálogo de permissão, quando ele aparece). Se algo falhar, bloqueia. | Não |
| **Mochila** (e os recursos) | No rodapé, uma linha por recurso. A Mochila mede o contexto até o ponto da compactação automática (estado em palavras e, no tooltip, o peso do último turno e o que ocupa espaço). Mana e Vigor mostram o que resta, a contagem até renovar a cada minuto, o ritmo e um aviso por período a 10%. A partir de 85% da mochila, ou ao clicar na Mochila do rodapé, o cartão oferece salvar o progresso e compactar: com o Claude trabalhando, leva o `/compact` ao prompt; parado, compacta na hora. | Só ao compactar |
| **Grimório** | O Sábio guarda o **progresso** (a tarefa num arquivo e o handoff no ai-memory, para **Continuar** no acampamento), a **crônica** (decisões e conquistas) e as **regras** (`AGENTS.md`). Acha sem chamar o modelo; um destino por inscrição; grava só no **✦ Selar no grimório**, e desfaz. Avisa no palco; acima do prompt só no fim de um marco e antes de compactar. O ⚙ Memória liga e desliga cada recurso e aviso. | Só no botão opcional **✦ Resumir com Haiku** |

### As 19 classes

Cada tipo de tarefa do Claude veste uma classe; o mapa completo, com as famílias de ferramentas, está em [docs/classes.md](../../docs/classes.md). Cada Clawd tem a pose de trabalho e a de falha, e um cenário.

| Classe | Faz | Cenário |
|---|---|---|
| Aprendiz | Pensa e responde (o principal) | Campo de treino; parado, o acampamento |
| Mago | Lê e busca no projeto, inclusive comandos só de leitura | Biblioteca |
| Caçador | Pesquisa na web | Floresta da lua |
| Ladino | Navega em sites | Beco |
| Rúnico | Escreve código | Círculo de runas |
| Ilusionista | Telas e estilo | Teatro das ilusões |
| Sábio | Docs e textos; guarda o grimório | Torre do sábio |
| Engenheiro | Comandos de terminal | Oficina |
| Bruxo | Testes, lint e tipos | Pântano |
| Rei | Commit, PR e merge; mensagens e avisos | Sala do trono |
| Artífice | Pipeline, deploy e infra | Forja |
| Oráculo | Logs e monitoramento | Santuário |
| Geomante | Banco de dados e migrações | Muralha de pedra |
| Alquimista | APIs e integrações (MCP, HTTP) | Laboratório |
| Cartomante | Planos e tarefas | Tenda das cartas |
| Invocador | Chama subagentes | Salão arcano |
| Cronomante | Agenda e automatiza | Câmara do tempo |
| Paladino | Segurança e revisão | Portal |
| Pintor | Design visual | Ateliê |

### O que a guarda protege

Só o que, mal configurado, derruba a aplicação, o banco ou a API e quase nunca se edita à mão. A lista é curta de propósito: se tudo for protegido, o aviso perde o peso.

| Protege | Globs |
|---|---|
| Segredos e ambientes | `.env`, `.env.*`, `appsettings.Production.json`, `appsettings.Prod.json`, `appsettings.Homolog*.json`, `appsettings.Staging.json` |
| Pipelines e workflows | `azure-pipelines*.yml`, `*pipeline*.yml`, `.github/workflows/*.yml` (e `.yaml`) |
| Chaves e certificados | `*.pem`, `*.key`, `*.pfx`, `*.p12` |
| Estado do Terraform | `*.tfstate`, `*.tfstate.backup` |

Nunca perguntam: os modelos `.env.example`, `.env.sample` e `.env.template`. Ficam de fora de propósito migrações de banco, `docker-compose`, `package.json` e configs de build, que o Claude mexe o tempo todo. Para acrescentar ou liberar, use `protect` e `allow` no `/config`.

### Inventário: raridade pelo impacto

| Raridade | Arquivo |
|---|---|
| **Lendário** | Protegido (segue a lista do guarda) |
| **Raro** | Criado |
| **Incomum** | Modificado |
| **Pobre** | Excluído |

O topo mostra o branch, ↑commits à frente e ● arquivos sem commit.

## Configurações

**Em `/config`** (linhas do mod):

| Opção | Para quê |
|---|---|
| `language` | `auto` (padrão) segue a língua do Claude: a configuração `language` do Claude Code, depois o LANG do sistema, depois a sua primeira mensagem. `pt-BR` ou `en` fixam a língua. |
| `protect` | Globs extras protegidos, separados por vírgula (ex.: `**/secrets.json`). |
| `allow` | Globs que o guarda nunca bloqueia, além dos modelos de `.env`, que já vêm liberados. |
| `vaultPath` | Pasta do vault (ex.: `C:\Notas`). Vazia, o grimório não oferece os destinos do vault e da carreira. |
| `vaultInbox` | Subpasta do vault onde o grimório deixa as notas novas. Escolhendo o vault pelo painel, ela vem sozinha: `00-Inbox` se existir, senão `Inbox` (o padrão). |

**No ⚙ do painel** (guardado entre as sessões), em duas categorias:
- **Geral:** língua e estilo (Épico ou Sóbrio);
- **Recursos:** cada módulo, por onde aparece (no chat, no painel, memória, proteção). Embaixo do Grimório, o **⚙ Memória ›** (cada recurso e aviso do grimório, os destinos, as integrações e o botão do Haiku); embaixo da Guarda, o modo.

No pé ficam **Primeiros passos** (a língua e o que foi detectado para a memória, sem perguntar caminho de pasta) e **Sobre** (os recursos, as 19 classes com o que cada uma faz ao passar o mouse, e os créditos).

### Onde o grimório grava

| O que | Destino sugerido | Onde grava |
|---|---|---|
| Salvar progresso | Tarefa (+ ai-memory) | Com vault: `<vault>/.tarefas/<projeto>/<ID>.md`. Sem vault: `<projeto>/.hero/tarefas/<ID>.md`, fora do git. Com o MCP do ai-memory, também `memory_handoff_begin`. |
| Decisão técnica | Vault · decisões | `<vault>/<vaultInbox>/decisao-pendente-<data>-<tema>.md`; sem vault, `docs/decisoes/<data>-<tema>.md` (a primeira pergunta antes) |
| Conquista com número | Vault · carreira | `<vault>/<vaultInbox>/resultado-pendente-<data>-<tema>.md`; sem vault, `docs/decisoes` |
| Regra que você estabeleceu | AGENTS.md | Uma linha sob `## Regras` no `AGENTS.md` do projeto: uma linha só, sem crase nem tag, até 280 caracteres |

- **Um destino por inscrição:** o clique no destino troca entre os disponíveis (vault, projeto, ai-memory).
- **Nota nunca sobrescreve nota:** se o nome já existe, a nova ganha `-2`, `-3`…
- **Só sai da lista o que gravou;** o resto continua pendente, com o motivo no aviso. O **Desfazer** tira a linha do AGENTS.md, apaga a nota nova ou a página do ai-memory, e devolve a inscrição.
- **O vault e a pasta de entrada são conferidos antes de gravar,** inclusive quando vêm do `/config` ou do instalador: a pasta de entrada precisa ser uma subpasta do vault.
- **O ai-memory só entra com o MCP dele conectado.** O servidor é achado pelo nome da ferramenta (`mcp__<servidor>__memory_write_page`), então funciona mesmo com o servidor renomeado.

**Privacidade:** se o texto cita o vault, o ai-memory ou qualquer caminho pessoal (`C:\…`, `/home/…`, `/Users/…`, `~/`), ele não vai para o repositório (nem `AGENTS.md`, nem `docs/decisoes`).

## No terminal

O terminal não desenha Svg, então a HUD usa o que ele tem:

| Onde | No terminal |
|---|---|
| Palco | Os Clawds em pixel art própria (Raster de meio-bloco ▀), sem fundo; o acampamento com a fogueira. Grande (48×13 células) com o painel livre, 24×7 com plano, grupo ou inventário. Anima em dois quadros. Só no painel encaixado (tela cheia, 110+ colunas). |
| Faixa, diário, spinner, recibo | O ícone da classe e o nome na cor dela. O diário mantém a linha do motor (o ctrl+o continua abrindo o resultado). O recibo entra no lugar do "Baked for 3s". |
| Recursos | Uma linha por recurso com barra em texto; em alerta, também no fim da linha de dicas do prompt. |
| Guarda | 🐉, o arquivo e até 4 linhas da mudança (o motor só aceita 12 linhas em volta do diálogo). |
| Grimório, Primeiros passos, Sobre | O Sábio, o acampamento e dois Clawds em pixel art; as 19 classes em lista com ícone. |

## Limites conhecidos

- **Guarda e terminal:** o guarda pergunta sempre que um comando cita um caminho protegido, salvo leituras conhecidas (`cat`, `Get-Content`, `grep`…). Por isso `git add .env` também pergunta. Um script que monta o caminho por dentro, sem citá-lo, passa. O modo **Só o diálogo nativo** apenas avisa no diálogo de permissão do Claude; se as edições estiverem liberadas automaticamente, nada pergunta.
- **Terminal:** sem o painel encaixado (tela cheia) não há palco. O spinner é desenhado pelo mod, que conta o tempo, e não mostra os tokens. Os ícones das classes são emoji: num terminal sem emoji coloridos, aparecem como símbolos.
- **Mobile:** o app móvel não tem campo de texto para mods. Lá, os Primeiros passos só mostram o que foi detectado; para escolher a pasta do vault, use o desktop.
- **Seletor de pasta:** a API de mods não tem diálogo de pasta. O mod abre o do sistema (PowerShell no Windows, osascript no macOS, zenity ou kdialog no Linux); onde nenhum abre, a tela avisa e mostra um campo para digitar o caminho.
- **Recibo do turno:** o motor desenha embaixo da resposta o texto que o hook do fim do turno devolve; a aparência dessa linha no app desktop ainda precisa ser conferida.
- **Barra lateral nativa:** a API de mods não a alcança (não é um componente que o mod redesenha, e não há chamada para renomear ou agrupar sessões).
- **Diário no fim do turno:** o app desktop recolhe as linhas de ferramenta em "Executado N ações" quando o turno termina, e nenhum grupo dele chega ao mod. O diário só aparece durante o turno; o recibo fica.
- **Linha do diário:** para tirar o trilho do app, o mod desenha a linha inteira da ferramenta. Ainda falta confirmar no app que o clique para abrir o resultado continua funcionando.
- **Tema automático:** com o tema do Claude em automático, o mod não sabe se o app está claro ou escuro. Os Svgs usam a paleta escura e o painel fica sem o tom quente.
- **Ainda não verificado no app real** (depende do spike, `mods/clawd-hud-spike`):
  - a animação do Svg no desktop;
  - se um grupo recolhido não deixa linha vazia;
  - o rodapé fixo;
  - o `prompt.fill` no desktop;
  - a leitura do tema;
  - o dragão acima do diálogo;
  - a descrição das opções do diálogo.

## Agradecimentos

O código desta HUD é próprio. Alguns padrões vieram dos mods do **[claude-code-templates](https://github.com/davila7/claude-code-templates)**, de **Daniel (San) Ávila**, sob licença MIT (aviso em [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)). Cada módulo cita de onde veio o padrão.

| Mod de origem | O que veio dele | Onde está aqui |
|---|---|---|
| [protected-paths-guard](https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/security/protected-paths-guard) | Globs, o `globToRegExp` e o `.catch` que falha fechado | `modules/guarda` |
| [large-edit-confirmation](https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/security/large-edit-confirmation) | O `$.ui.ask` dentro do `tool.call`, o "Outro" não aprovar e negar sem ninguém | `modules/guarda` |
| [tool-timing-badge](https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/ui/tool-timing-badge) | Embrulhar o `ToolUse` e medir o tempo | `modules/diario` |
| [agent-flow](https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/ui/agent-flow) | Acompanhar subagentes pelo `agent.spawn` | `modules/painel` (Grupo) |
| [git-sidebar](https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/ui/git-sidebar) | Git por argv, sem shell | `modules/painel` (Inventário) |
| [session-time-machine](https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/productivity/session-time-machine) | A linha do tempo da sessão | `modules/campanha` |

O recibo do turno se baseia no recibo do [Flightdeck](https://github.com/scasella/claude-flightdeck), de scasella, e os recursos, no [token-weather](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather) (Anthropic) e nos [usage-meter e context-bar](https://github.com/hamzafer/claude-code-mods), de hamzafer.

### Mods de outros autores que combinam com a HUD

Estes não fazem parte da HUD: instale direto do repositório de quem fez, depois de ler o código.

| Mod | Para quê | Como instalar |
|---|---|---|
| [secret-redactor](https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/security/secret-redactor) | Esconde segredos | `npx claude-code-templates --mod security/secret-redactor` |
| [prompt-cache-control](https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/observability/prompt-cache-control) | Mede o cache | `npx claude-code-templates --mod observability/prompt-cache-control` |
| rulebook-guard, blast-radius / Launch Codes, session-saver, md-preview | Adotados no handoff | Links a confirmar |

**Não instale o protected-paths-guard junto com o guarda da HUD:** ele nega direto, e a HUD pergunta.

## Desenvolvimento

```sh
claude plugin validate mods/hero-journey
claude plugin test mods/hero-journey
# ou tudo de uma vez: scripts/verificar.ps1 (Windows) / scripts/verificar.sh
```

Estrutura:

| Caminho | Conteúdo |
|---|---|
| `hooks/register.tsx` | Liga os módulos aos eventos. Todo o código que usa `$` fica aqui: o motor recusa o `$` passado para uma função importada (conferido no 2.1.295). |
| `hooks/core/` | A arte em Svg (os Clawds das 19 classes em `sprites.ts`, os cenários do palco em `cenarios.ts` e o resto em `art.ts`), textos pt/en, classes, preferências, pastas do sistema e o que todas as telas usam |
| `hooks/modules/<módulo>/` | A lógica (`<módulo>.ts`, pura) e a tela (`view.tsx`) de cada módulo |
| `tests/` | 145 testes no motor, em desktop e terminal, incluindo as regressões dos QAs e da revisão do PR |

---

## English

A cozy RPG HUD for the Claude Code desktop app, with the multiclass Clawd crabs. Claude's output stays the same.

> **1.0, stable.** Works in the desktop app and in the Claude Code CLI (terminal). In the terminal the Clawds are purpose-made pixel art (no background, animated stage in the docked pane), each class has an icon in the band, logbook, spinner and receipt, and the guard shows 🐉 within the 12 rows the engine allows around the dialog.

**Install** (tested on engine 2.1.295): `/plugin install hero-journey --marketplace soulrocha/Claude-code-hero-journey`, then type `/hero`.

**Modules** (each one toggles in the pane's ⚙ → Features):

| Module | What it does | Spends tokens? |
|---|---|---|
| Logbook | On every tool row, during the turn: the class Clawd up front (failure pose when something fails), who acted and on what, and the result on the right as plain text, with the ✓/✗ always in the same column | No |
| Band above the prompt | One line: the class Clawd, who acts and the file in use, and the plan trail; **Your turn** when idle; never the chat sentence. The turn spinner names the class too. **Panel ›** opens the pane | No |
| Pane | The stage on top (the class at work in its scene, the Apprentice thinking or the camp), the objective, and only when they exist the plan, party and inventory; resources and buttons pinned to the bottom | Only on **✦ Recalibrate** (Haiku) |
| Campaign | Objective and chapters that feed the objective bar and the receipt | No |
| Turn receipt | One line under the answer: who acted, actions, +/−, new files, failures and time | No |
| Protected-file guard | A red dragon stops Claude before it edits a critical file (`.env`, pipelines and workflows, production and staging `appsettings`, keys, certificates, Terraform state) or runs a command that writes one, shows the change and asks. **Ask** or **Only warn** mode. The `.env` templates are never blocked. Fails closed. | No |
| Backpack (and resources) | Backpack against the auto-compaction point, its state, and (in the tooltip) last-turn weight and what fills it; Mana and Vigor with what is left, a live countdown, pace and a warning at 10%; the compaction card, also opened by clicking the Backpack, offers to save progress first | Only when compacting |
| Grimoire | Save progress (task file plus ai-memory handoff) and Continue at camp; decisions and achievements to the chronicle; rules to AGENTS.md. One destination each, written only on **Seal**, undoable; ⚙ Memory toggles each feature and prompt | Only through the optional **Summarize with Haiku** button |

**Classes:** 19, one per kind of Claude task (Apprentice, Mage, Hunter, Rogue, Rune Caster, Illusionist, Sage, Engineer, Witcher, King, Artificer, Oracle, Geomancer, Alchemist, Cartomancer, Summoner, Chronomancer, Paladin, Painter), each with a work pose, a failure pose and its own scene.

**Language:** `auto` follows Claude's language. Pin `pt-BR` or `en` in `/config` or in the pane's ⚙.

**Credits:** some code patterns come from Daniel (San) Ávila's [claude-code-templates](https://github.com/davila7/claude-code-templates) mods (MIT). The details are in the Agradecimentos section above and in each module's header.

## Licença / License

[MIT](LICENSE) © 2026 Saulo Rocha. Os trechos adaptados mantêm o aviso em [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
