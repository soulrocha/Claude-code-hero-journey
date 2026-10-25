# Segurança / Security

**Português** · [English](#english)

## Como relatar uma falha

Não abra issue pública para falha de segurança. Use o relatório privado do GitHub: aba **Security** → **Report a vulnerability**. Diga o que acontece, como reproduzir e qual versão do Claude Code você usa.

A resposta é de um mantenedor só, no tempo livre: a meta é responder em até 7 dias.

## O que conta como falha de segurança

A HUD mexe em três lugares sensíveis. Uma falha em qualquer um deles conta:

- **Guarda dos protegidos:** um jeito de editar `.env`, pipelines, `appsettings` de produção ou outro arquivo protegido sem passar pela pergunta. Isso vale para as ferramentas de edição e para os comandos de terminal. O limite já conhecido (um script que monta o caminho por dentro, sem citá-lo) está no [README do mod](mods/hero-journey/README.md#limites-conhecidos).
- **Grimório:** gravar algo sem o clique em **Selar**, sobrescrever uma nota existente, gravar fora do vault configurado ou levar ao CLAUDE.md e ao AGENTS.md um texto que vire instrução sem você marcar o destino.
- **Projetos:** escrever no `.claude/settings.local.json` sem o seu pedido, ou apagar algo que já estava nele.

## Versões cobertas

O projeto está na **1.0**. Só a versão mais recente da branch `main` recebe correção.

---

## English

### Reporting a vulnerability

Do not open a public issue for a security problem. Use GitHub's private reporting: **Security** tab → **Report a vulnerability**. Say what happens, how to reproduce it and which Claude Code version you run.

This is a one-maintainer, spare-time project: the goal is a reply within 7 days.

### What counts

- **Protected-file guard:** any way to edit `.env`, pipelines, production `appsettings` or another protected file without the prompt, through edit tools or terminal commands. The known limit (a script that builds the path internally without naming it) is in the [mod's README](mods/hero-journey/README.md#limites-conhecidos).
- **Grimoire:** writing without the **Seal** click, overwriting an existing note, writing outside the configured vault, or putting text into CLAUDE.md or AGENTS.md without you ticking that destination.
- **Projects:** writing `.claude/settings.local.json` without your request, or removing anything already in it.

### Supported versions

The project is at **1.0**. Only the latest `main` gets fixes.
