# Changelog

As mudanças de cada versão. O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

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
