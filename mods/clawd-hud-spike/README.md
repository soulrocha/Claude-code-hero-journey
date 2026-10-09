# clawd-hud-spike

Um mod mínimo que testa no app real o que os testes do motor não alcançam (os itens "A VALIDAR" do desenho), antes da Fase 1. **Não gasta tokens:** não chama `$.model`, `agent.spawn`, `compact` nem `prompt.submit`.

Ele foi escrito e testado contra os tipos da **build 2.1.295**. Os testes cobrem as superfícies `terminal` e `desktop` no motor. Só não sabem se o **desktop de verdade** desenha como esperado, e é para isso que serve o roteiro abaixo.

## O que ele mexe

- **Pane "Laboratório"** (`/spike`): uma linha por sonda, com `✓ ok` e `✗ falhou`. Os vereditos ficam no `$.store`.
- **Linhas de ferramenta no chat:** ganham o Clawd de 40 px à esquerda.
- **Faixa acima do prompt:** mostra o Clawd de 90 px enquanto o Claude trabalha.
- **Proteção:** só para `spike-sandbox/.env*` e `spike-sandbox/*pipelines*.yml`. Antes de editar um desses arquivos, abre o diálogo do Claude com a linha de arquivos por cima. Se der erro, bloqueia.

## Roteiro no app desktop (Windows)

1. Confira a versão do Claude Code do app. Se for anterior à 2.1.295, rode antes `claude plugin validate C:\Projetos\Claude-code-hero-journey\mods\clawd-hud-spike` num terminal.
2. Atualize o repositório: `git pull` em `C:\Projetos\Claude-code-hero-journey`.
3. Em `%USERPROFILE%\.claude\settings.json`, acrescente ao bloco `"env"`:
   ```json
   "CLAUDE_CODE_PLUGIN_DIRS": "C:\\Projetos\\Claude-code-hero-journey\\mods\\clawd-hud-spike",
   "CLAUDE_CODE_PLUGIN_DIR_WATCH": "1"
   ```
   Depois, feche e abra o app. A pasta `dev-mods` fica intocada.
4. Na aba Code, abra uma sessão **neste repositório** e digite `/spike`.
5. Percorra o Laboratório (‹ › mudam a página):

   | Item | O que fazer | O que observar |
   |---|---|---|
   | 1 | Olhe os dois Clawds no topo e pare o mouse sobre eles | Piscam (CSS), as estrelas pulsam (SMIL), a engrenagem gira, o tooltip aparece |
   | 2 | Troque o tema em `/config` e depois o claro/escuro do app | As cores dos Clawds mudam? O "tema lido" muda? |
   | 3 | **Testar diálogo** | A linha com ícones e `.env.homologacao +1 · azure-pipelines.yml +3 −1` aparece acima do diálogo? As opções têm descrição? |
   | 3b | Peça ao Claude: *"mude API_URL em spike-sandbox/.env.teste para https://outro.invalid"* | Aparece o diálogo com a linha? **O diálogo nativo de permissão aparece também?** Recusar bloqueia? |
   | 4 | **Levar ao prompt** | O texto aparece na caixa de digitação? Qual é o resultado gravado? |
   | 6 | Mande qualquer pergunta e espere a resposta | O motivo e o começo da resposta aparecem no item 6 |
   | 7 | Pagine com ‹ › | O rodapé "Mochila · Mana · Vigor" fica parado embaixo? Os números batem com o uso real? |
   | 8 | Peça ao Claude para ler um arquivo; depois clique em **Recolher leituras** e peça outra leitura | O Clawd aparece à esquerda das linhas? Recolhida, a leitura some sem deixar uma linha vazia? |
   | 9/10 | **Listar** | Quais ferramentas do app aparecem (`mcp__ccd_*`, sessão, diff)? |
   | 11 | Repare se o Laboratório abriu sozinho ao começar a sessão | Veja a largura medida e se "docka" |
   | 12 | Abra uma **segunda sessão** e rode `/spike` | O número de sessões subiu? |
   | + | Mande o Claude rodar algo demorado | A faixa com o Clawd de 90 px aparece enquanto ele trabalha e some no fim? |

   O item 5 (`Client` como botão estilizado) foi descartado pelos tipos: o `Client` não aceita Svg dentro.
6. Rode `/spike-relatorio` e cole a saída na conversa do `/plan`. Acrescente o que viu e que o relatório não captura, por exemplo se o diálogo nativo apareceu em dobro.

## Desligar

Remova as duas chaves do bloco `"env"` e reinicie o app.

## Desenvolvimento

```sh
claude plugin validate mods/clawd-hud-spike
claude plugin test mods/clawd-hud-spike
```

O código que usa `$` fica todo em `hooks/register.tsx`, porque o motor não segue o `$` através de um import. `art.ts`, `guard.ts` e `lab.ts` são funções puras: a arte do Clawd, os padrões de proteção e o catálogo das sondas.
