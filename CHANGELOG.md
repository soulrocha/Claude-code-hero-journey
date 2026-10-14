# Changelog

As mudanças de cada versão. O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [0.6.0] - 2026-10-11

O Clawd ganhou 19 classes, o painel virou um palco e o grimório passou a salvar o progresso para continuar depois, em qualquer agente. O mapa das classes está em [docs/classes.md](docs/classes.md).

### Adicionado
- **19 classes**, uma por família de tarefa do Claude (o Mago lê, o Rúnico escreve código, o Bruxo caça bugs, o Rei faz commit e PR…), cada uma com o Clawd sem fundo nas poses de trabalho e de falha e com o seu cenário. Comando que só lê vira Mago, navegador vira Ladino, Figma vira Pintor, agendamento vira Cronomante.
- **Palco** no topo do painel: a classe em ação no cenário dela, o Aprendiz pensando ou o acampamento (acordado na sua vez, dormindo depois de 5 minutos parado). Sem plano, grupo nem inventário, o palco cresce.
- **Grimório novo:**
  - **Salvar progresso:** a tarefa num arquivo (no vault, em `.tarefas/<projeto>`, ou no projeto, em `.hero/tarefas`, fora do git) e, com o ai-memory, o handoff com o ID e o caminho da tarefa;
  - **Continuar** no acampamento: as tarefas abertas e os handoffs pendentes, com um clique;
  - **crônica** (decisões e conquistas) e **regras** (uma linha no `AGENTS.md`), um destino por inscrição, só com o **✦ Selar no grimório**, e **Desfazer**;
  - o Sábio avisa no palco; cartões acima do prompt só no fim de um marco (plano fechado, commit, push ou PR) e antes de compactar;
  - **⚙ Memória:** liga e desliga cada recurso e aviso; com vault e ai-memory, já vem configurado;
  - toda chamada ao ai-memory leva o `workspace` (do `.ai-memory.toml`) e o `project` (do marcador ou do remoto do git), e cada página leva data, origem e o lembrete de conferir no código.
- **Sobre** com a galeria das 19 classes; o tooltip de cada Clawd diz o que ele faz.
- **Guarda:** o dragão vermelho barra o arquivo crítico e mostra a mudança. Entram na lista `appsettings.Staging.json`, `*.pfx`, `*.p12` e o estado do Terraform (`*.tfstate`).

### Mudou
- **Faixa:** uma linha, sem repetir a frase do chat; parada, diz "Sua vez"; "Painel ›" no lugar do ◈. O **spinner** diz a classe ("Mago lendo art.ts").
- **Diário de bordo:** a linha é do mod, sem o trilho do app: o Clawd com 44 px, quem agiu e o quê, e o resultado em texto à direita, sem borda, com o símbolo sempre na mesma coluna.
- **Mochila:** clicar nela abre o cartão de compactar, que oferece salvar o progresso antes. Saiu o botão "Compactar" do rodapé e do ⚙.
- **Primeiros passos:** só a língua e o que foi detectado (vault e ai-memory); nada de caminho de pasta na primeira vez. A pasta de entrada vem sozinha (`00-Inbox`, se existir, senão `Inbox`).
- **⚙:** duas categorias, Geral e Recursos; o modo da guarda e o ⚙ Memória ficam embaixo do recurso deles. "Pele" virou "Estilo".
- **Barra inferior** sempre presa no fim do painel, com o Grimório num canto e o ⚙ no outro.
- **README:** as 19 classes, o acampamento, o banner e a galeria com telas desenhadas pelo próprio mod.

### Removido
- **Modo chefe** da guarda (o Guardião do Cofre): quem usava passa ao Perguntar. Ficam dois modos: Perguntar e Só avisar.
- Os modelos `.env.example`, `.env.sample` e `.env.template` saíram da lista de protegidos.
- O campo da pasta de entrada, o seletor dela e o atalho "Abrir a pasta das decisões" dos Primeiros passos.
- A pílula do diário, os selos dos passos, o cabeçalho antigo do grimório e as outras artes da 0.5 que nada usava.

### Corrigido
- O desfile dos Clawds no Sobre e nos Primeiros passos estava invisível: a animação dele usava a mesma classe `.hop` de uma animação dos sprites.
- Mandar um arquivo, um e-mail ou um aviso (ações do Rei) não abre mais o cartão de marco: só commit, push, merge e PR contam.
- No ⚙ Memória, "Trocar" agora troca a pasta do vault (antes só mudava onde as decisões caem), e o vault escolhido vale na hora, sem reiniciar.

## [0.5.0] - 2026-10-10 (ainda não publicada)

A HUD ficou menor: oito módulos que respondem a "o que o Claude está fazendo", "onde estou no objetivo", "quanto fôlego tenho" e "o que precisa de mim". O porquê de cada corte está em [docs/escopo.md](docs/escopo.md).

### Adicionado
- **Recibo do turno:** uma linha embaixo da resposta com a classe que mais agiu, as ações, +/−, arquivos novos, falhas, bloqueios do guarda e o tempo; com a missão cumprida sem falha, "🦀 ✦ Missão cumprida: …" abre a linha. Fica no chat depois que o app recolhe o diário. Zero tokens. Ideia do [Flightdeck](https://github.com/scasella/claude-flightdeck).
- **Recursos aprimorados**, a partir do [token-weather](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather), do [usage-meter e do context-bar](https://github.com/hamzafer/claude-code-mods):
  - a Mochila mede o contexto até o ponto da compactação automática (antes, contra a janela inteira, e o cartão dos 85% podia nunca aparecer), diz o estado em palavras (Leve, Carregada, Pesada, Transbordando) e, no tooltip, o peso do último turno e o que ocupa espaço;
  - Mana e Vigor mostram o que resta, com a contagem até renovar atualizada a cada minuto, "recarregada" quando a janela vira, o ritmo de gasto (⚡ quando acaba antes de renovar) e um aviso por período a 10%;
  - um selo na faixa só quando um recurso entra em alerta;
  - os recursos são lidos de novo depois de um `/compact`, também o automático.
- **Vault:** o **📁 Escolher pasta** abre o seletor de pastas do sistema para o vault e para a pasta de entrada, ao lado do campo de texto. O **📂 Abrir a pasta das decisões** abre no Explorer (ou no Finder) a pasta onde o grimório deixa as decisões, nos Primeiros passos e na página do grimório.
- **ai-memory:** com o MCP conectado, os Primeiros passos convidam a apoiar o Fabio Akita com uma estrela no repositório.

### Mudou
- **Painel:** os botões e os recursos ficam presos no fim; cartões do grupo e itens do inventário que não cabem viram "+N", para o rodapé não sair do lugar. Os recursos ganharam uma linha cada, sem texto por cima de texto. O espaço entre as seções caiu pela metade, as abas Grupo e Inventário alinham à esquerda e os botões do objetivo e do rodapé ganharam o glifo dourado e quebram de linha em vez de cortar.
- **Diário de bordo:** só o mascote, o trilho e o selo em cada linha. O app desktop já recolhe as linhas no fim do turno.
- **⚙:** módulos, língua, pele, modo da proteção e o Haiku do grimório.
- **Arte:** os três arquivos (`art.ts`, `hero-art.ts`, `polish-art.ts`) viraram um, sem as funções que nada chamava e sem a segunda cópia do desenho do Clawd.

### Removido
- **Projetos** (`/projetos`) e o acesso às pastas pelo `settings.local.json`.
- **Side quest** (`/side-quest`): o [ctx-handoff](https://github.com/cablate/ctx-handoff-mod) e o [claude-auto-handoff](https://github.com/alexknowshtml/claude-auto-handoff) fazem a passagem de sessão.
- **Comemoração em toast**, que virou o recibo do turno.
- O agrupamento do diário (Separar ›, modo Agrupado/Separado), os perfis do painel e a escolha de seções.
- O código do relatório da missão, que não aparecia desde a revisão de 2026-10-09.

### Corrigido
- **`/clear`, `/resume` e `/branch`:** zeravam o estado da sessão sem rodar o início do mod, e a HUD voltava para o inglês e para as preferências padrão até recarregar. Agora ela se recarrega no `SessionStart` desses três.

## [0.4.0] - 2026-10-09

Primeira versão pública. **Beta:** feita primeiro para o app desktop; o suporte ao Claude Code CLI (terminal) vem depois.

### Mudou
- **Grimório:** CLAUDE.md e AGENTS.md vêm **desmarcados**, porque viram instrução permanente do Claude. A decisão técnica vem marcada só para o vault. A linha gravada nesses arquivos é uma só, sem crase nem tag, com até 280 caracteres.
- **Grimório e ai-memory:** o destino ai-memory grava pelo MCP do [ai-memory](https://github.com/akitaonrails/ai-memory) (`memory_write_page`), e a preferência vai para o perfil (`scope: "profile"`). O destino só aparece quando o MCP está conectado.
- **Grimório:** só aparecem os destinos que dá para gravar nesta sessão. Sem vault e sem ai-memory, o cartão oferece só CLAUDE.md e AGENTS.md, desmarcados, com a dica de onde configurar.
- **Guarda do terminal:** qualquer comando que cite um caminho protegido pergunta antes, salvo leituras conhecidas (`cat`, `Get-Content`, `grep`…). Escritores que o guarda não conhecia, como `python -c` e `curl -o`, passavam sem pergunta.

### Adicionado
- Opção `vaultInbox`: a subpasta do vault onde o grimório deixa as notas novas (padrão `Inbox`). Os Primeiros passos perguntam por ela, e o `instalar.ps1` aceita `-VaultInbox`.
- **Primeiros passos recomendam o que falta:** sem vault, o Obsidian; sem o MCP do ai-memory, o ai-memory. Com o MCP conectado, mostram "✓ ai-memory conectado".

### Removido
- A opção `aiMemoryPath`, a pergunta do ai-memory nos Primeiros passos e o parâmetro `-AiMemory` do `scripts/instalar.ps1`. Um valor que já esteja gravado é ignorado.

### Corrigido
- **Grimório:** Selar sem nenhum destino marcado agora avisa, e uma sugestão de destino indisponível não prende mais a inscrição que já foi selada em outro destino.
- **Grimório:** duas notas com o mesmo começo, no mesmo dia, se sobrescreviam, inclusive notas de sessões anteriores. Agora a nova ganha `-2`, `-3`…
- **Grimório:** uma inscrição sem destino disponível sumia como "selada" sem ter gravado nada. Agora ela continua pendente, com o motivo no aviso, e a falha de um destino não impede os outros.
- **Grimório:** um caminho do vault vindo do `/config` não era conferido antes de gravar. A pasta de entrada também é conferida: fora do vault, o destino fica desligado.
- **Inventário:** caminhos com espaço ou acento chegavam com aspas do git, perdiam o +/− e escapavam da raridade "lendário" dos protegidos. O git agora é lido com `-z`.
- **Língua:** voltar de uma língua fixa para `auto` usa a língua certa.
- **Compatibilidade:** botões com rótulo composto eram recusados pelo motor e a tela não aparecia.
- **Testes:** os mocks de arquivo funcionam no Windows, onde o kit de testes entrega `/repo/x` como `C:\repo\x`.

## [0.3.0] - 2026-10-09

Primeira versão completa, ainda privada: 10 módulos (diário de bordo, faixa, painel, campanha e relatório, guarda dos protegidos, mochila, grimório, side quest, projetos, comemoração), duas peles, português e inglês, Primeiros passos e licença MIT.

[0.4.0]: https://github.com/soulrocha/Claude-code-hero-journey/releases/tag/v0.4.0
