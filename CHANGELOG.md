# Changelog

As mudanças de cada versão. O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

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
