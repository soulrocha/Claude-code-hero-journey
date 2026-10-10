# hero-journey 🦀

**Português** · [English](#english)

Uma HUD de RPG aconchegante para o Claude Code desktop, com os caranguejos Clawd multiclasse. A saída do Claude não muda: a HUD só acrescenta os mascotes, o painel, a faixa e os cartões.

> **Beta.** Feita primeiro para o app desktop. O suporte ao Claude Code CLI (terminal) está pendente e vem depois da versão desktop.

## Instalar

Com o Claude Code (testado no motor 2.1.293):

```
/plugin install hero-journey --marketplace soulrocha/Claude-code-hero-journey
```

O mod instalado pelo terminal no escopo de usuário também carrega nas sessões do app desktop. Depois, digite `/hero`.

As opções da tabela de Configurações podem ficar vazias. Para respondê-las, use `/plugin configure hero-journey@claude-code-hero-journey` dentro do Claude Code, ou `--config chave=valor` no `claude plugin install`. A instalação pelo terminal só avisa quais opções ficaram sem valor. Na primeira vez que o painel abre, a página **Primeiros passos** pergunta de novo a língua, se você usa um vault (onde ele fica e qual a pasta de entrada, conferindo se as pastas existem) e se quer cadastrar a pasta atual como projeto. O ai-memory não pede pasta: o grimório grava nele pelo MCP, quando o MCP está conectado. Sem vault, a tela recomenda o Obsidian; sem o MCP do ai-memory, recomenda o ai-memory. Para voltar a ela, use ⚙ → ✦ Primeiros passos.

## Módulos

Cada módulo liga e desliga no **⚙ do painel → Módulos**. Todos nascem ligados.

| Módulo | O que faz | Gasta tokens? |
|---|---|---|
| **Diário de bordo** | Em cada ferramenta: o Clawd da classe, o trilho colorido e o chip (✓/✗, "novo", +/−, tempo). Chamadas seguidas da mesma classe viram um grupo ("Artífice · 2 ações · ✓ novo · ✓ +42 −8"), e **Separar ›** abre só aquele. | Não |
| **Faixa acima do prompt** | Enquanto o Claude trabalha: o Clawd de 90 px com o acessório animado, "Classe · o que faz" e a intenção que o Claude escreveu antes das ferramentas. Some no fim do turno. | Não |
| **Painel** (`/hero`) | Objetivo → Quests do capítulo → Grupo e Inventário (abas ◆/◇, ⊞/⊟) → Relatório da missão → rodapé com Mochila, Mana, Vigor, 📖, ⇄, ⚙ e ℹ. | Não |
| **Campanha e relatório** | A sessão é a campanha: a 1ª mensagem dá o título e o objetivo, cada mensagem abre um capítulo. No fim de cada turno, o relatório abre sozinho com a linha do tempo, o resultado (lido do formato briefing-de-bordo) e os botões **✓ Aprovar** e **✎ Ajustar**. | Não |
| **Guarda dos protegidos** | Antes de editar `.env*`, pipelines, workflows, `appsettings` de produção e chaves, pergunta. Também pergunta antes de um comando de terminal que escreveria neles (`>>`, `sed -i`, `rm`, `Set-Content`…). Três modos no ⚙: **Diálogo do Claude** (padrão, com a linha de arquivos por cima), **Encontro com chefe** (o Guardião do Cofre com os diffs) e **Só o diálogo nativo**. Se algo falhar, bloqueia. | Não |
| **Mochila** | Quando o contexto passa de 85%, ou quando você clica em Mochila: o cartão leva a instrução do `/compact` ao prompt, ou **Compactar agora** (só com o Claude parado). | Só no **Compactar agora** |
| **Grimório** | No fim de cada turno, acha sem chamar o modelo as decisões técnicas, as conquistas com número e as suas preferências de trabalho com IA. Sugere o destino de cada uma, já marcado e explicado, e grava só quando você clica em **Selar**. | Só no botão opcional **✦ Resumir com Haiku** |
| **Side quest** (`/side-quest` ou ⇄) | Um desvio numa sessão paralela: o cartão monta o resumo da campanha e leva ao prompt o pedido para o Claude abrir a sessão. | Não (a sessão paralela gasta quando roda) |
| **Comemoração** | No fim de uma missão com ação e sem falha, o Clawd festeja num toast. | Não |
| **Projetos** (`/projetos` ou 🗂) | Projetos com várias pastas: os fixados no topo e o da pasta atual em destaque. Cada pasta mostra se o Claude a alcança (✓/✗). **Acesso nesta sessão** leva `/add-dir <pasta>` ao prompt; **Acesso sempre** acrescenta as pastas ao `permissions.additionalDirectories` do `.claude/settings.local.json` da pasta da sessão. **Abrir sessão** pede ao Claude uma sessão nova no projeto. | Não |

### As 9 classes

| Classe | Faz | Acessório |
|---|---|---|
| Clawd druida | Sessão principal, planos e tarefas | brilhos |
| Mago | Leitura, busca e pesquisa | livro |
| Ilusionista | UI, protótipos e design | pincel |
| Artífice | Código | engrenagem |
| Paladino | Testes, lint e revisão | lupa |
| Patrulheiro | Pipeline, deploy e logs | luneta |
| Anão minerador | Banco de dados e migrações | picareta |
| Arauto | Commit, push, PR e merge | carimbo |
| Alquimista | Integrações (MCP, HTTP) | bolhas |

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
| `allow` | Globs que o guarda nunca bloqueia (ex.: `.env.example`). |
| `vaultPath` | Pasta do vault (ex.: `C:\Notas`). Vazia, o grimório não oferece os destinos do vault e da carreira. |
| `vaultInbox` | Subpasta do vault onde o grimório deixa as notas novas. Padrão: `Inbox`. |

**No ⚙ do painel** (guardado entre as sessões):
- língua;
- módulos;
- pele Épico ou Sóbrio;
- perfil do painel (Completo, Foco, Mínimo ou Personalizado) e as seções que aparecem;
- diário Agrupado ou Separado;
- modo da proteção;
- botão do Haiku no grimório.

### Onde o grimório grava

| Tipo | Vem marcado | Onde grava |
|---|---|---|
| Decisão técnica | Vault | `<vault>/<vaultInbox>/decisao-pendente-<data>-<tema>.md` |
| Conquista com número | Carreira | `<vault>/<vaultInbox>/resultado-pendente-<data>-<tema>.md` |
| Preferência de IA | ai-memory | Perfil do ai-memory, pelo MCP: `memory_write_page` com `scope: "profile"` em `workflow/<data>-<tema>-<hora>.md` (`scope: "global"` nas versões sem perfil) |
| Opcional, desmarcado | CLAUDE.md e AGENTS.md | Uma linha sob `## Decisões` na raiz do projeto: uma linha só, sem crase nem tag, até 280 caracteres. Esses arquivos viram instrução permanente do Claude, por isso só com você marcando. |

- **Nota nunca sobrescreve nota:** se o nome já existe, a nova ganha `-2`, `-3`…
- **Só sai da lista o que gravou:** uma inscrição sem nenhum destino gravado continua pendente, com o motivo no aviso.
- **O vault e a pasta de entrada são conferidos antes de gravar,** inclusive quando vêm do `/config` ou do instalador: a pasta de entrada precisa ser uma subpasta do vault.
- **Só aparece o destino que dá para gravar:** o vault com a pasta configurada, o ai-memory com o MCP conectado. Sem nenhum dos dois, o cartão oferece só CLAUDE.md e AGENTS.md, desmarcados, e lembra onde configurar. Selar sem nada marcado só avisa.
- **O destino ai-memory só aparece com o MCP do ai-memory conectado.** O servidor é achado pelo nome da ferramenta (`mcp__<servidor>__memory_write_page`), então funciona mesmo com o servidor renomeado.

**Privacidade:** se o texto cita o vault, o ai-memory ou qualquer caminho pessoal (`C:\…`, `/home/…`, `/Users/…`, `~/`), ele não vai para o CLAUDE.md nem para o AGENTS.md.

## Limites conhecidos

- **Guarda e terminal:** o guarda pergunta sempre que um comando cita um caminho protegido, salvo leituras conhecidas (`cat`, `Get-Content`, `grep`…). Por isso `git add .env` também pergunta. Um script que monta o caminho por dentro, sem citá-lo, passa. O modo **Só o diálogo nativo** apenas avisa no diálogo de permissão do Claude; se as edições estiverem liberadas automaticamente, nada pergunta.
- **Side quest:** a API de mods não abre sessão. O mod prepara o pedido, e o Claude abre a sessão paralela pela ferramenta do app (se houver) ou por um subagente em segundo plano.
- **Mobile:** o app móvel não tem campo de texto para mods. Lá, Projetos e Primeiros passos só mostram; para digitar pastas, use o desktop.
- **Barra lateral nativa:** a API de mods não a alcança (não é um componente que o mod redesenha, e não há chamada para renomear ou agrupar sessões). Os projetos ficam no painel da HUD.
- **Tema automático:** com o tema do Claude em automático, o mod não sabe se o app está claro ou escuro. Os Svgs usam a paleta escura e o painel fica sem o tom quente.
- **Ainda não verificado no app real** (depende do spike, `mods/clawd-hud-spike`):
  - a animação do Svg no desktop;
  - se um grupo recolhido não deixa linha vazia;
  - o rodapé fixo;
  - o `prompt.fill` no desktop;
  - a leitura do tema;
  - o Svg acima do diálogo;
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

A side quest se baseia na ideia do **auto-handoff** e do `/btw`. Os créditos com link entram quando o endereço desses mods estiver confirmado.

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
| `hooks/register.tsx` | Liga os módulos aos eventos. Todo o código que usa `$` fica aqui, porque o motor não segue o `$` através de imports. |
| `hooks/core/` | Arte em Svg, textos pt/en, classes, preferências e o que todas as telas usam |
| `hooks/modules/<módulo>/` | A lógica (`<módulo>.ts`, pura) e a tela (`view.tsx`) de cada módulo |
| `tests/` | 85 testes no motor, em desktop e terminal, incluindo as regressões dos QAs e da revisão do PR |

---

## English

A cozy RPG HUD for the Claude Code desktop app, with the multiclass Clawd crabs. Claude's output stays the same.

> **Beta.** Built for the desktop app first. Claude Code CLI (terminal) support is pending and comes after the desktop version.

**Install** (tested on engine 2.1.293): `/plugin install hero-journey --marketplace soulrocha/Claude-code-hero-journey`, then type `/hero`.

**Modules** (each one toggles in the pane's ⚙ → Modules):

| Module | What it does | Spends tokens? |
|---|---|---|
| Logbook | Class mascot and rail on tool rows, grouped runs | No |
| Band above the prompt | The Clawd and Claude's stated intent while it works | No |
| Pane | Objective, quests, party, inventory, mission report, resource footer | No |
| Campaign and report | Chapters and a mission report with a timeline, Approve and Adjust | No |
| Protected-file guard | Asks before Claude edits `.env`, pipelines and the like, or runs a command that writes them. Dialog, boss-encounter or native-only mode. Fails closed. | No |
| Backpack | Compaction card | Only on **Compact now** |
| Grimoire | Finds decisions, achievements and AI-work preferences, suggests where to store each (CLAUDE.md and AGENTS.md come unticked; ai-memory over its MCP), and writes only when you click **Seal** | Only through the optional **Summarize with Haiku** button |
| Side quest | Drafts a parallel-session request with the campaign summary | No |
| Projects | Pinned projects with several folders; shows and grants Claude's access to each folder | No |
| Celebration | A toast when a mission ends | No |

**Language:** `auto` follows Claude's language. Pin `pt-BR` or `en` in `/config` or in the pane's ⚙.

**Credits:** some code patterns come from Daniel (San) Ávila's [claude-code-templates](https://github.com/davila7/claude-code-templates) mods (MIT). The details are in the Agradecimentos section above and in each module's header.

## Licença / License

[MIT](LICENSE) © 2026 Saulo Rocha. Os trechos adaptados mantêm o aviso em [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
