// Side quest: uma sessão paralela para um desvio, sem perder a campanha.
// O mod não abre sessão (a API não tem essa chamada): ele monta o resumo da
// campanha e leva ao prompt o pedido para o Claude abrir a sessão paralela,
// pela ferramenta do app se houver, ou por um subagente em segundo plano.
// Ideia de base: auto-handoff e /btw (citados no handoff do projeto).

import type { Campaign, Inventory, Lang, Quest, Report } from '../../../types'

export type Brief = {
  campaign: Campaign | null
  quests: readonly Quest[]
  inventory: Inventory
  last?: Report
}

/** O resumo que a side quest leva: objetivo, capítulo, quests abertas, arquivos e o último relatório. */
export const briefOf = (b: Brief, lang: Lang) => {
  const pt = lang === 'pt'
  const lines: string[] = []
  if (b.campaign !== null) {
    lines.push(`${pt ? 'Campanha' : 'Campaign'}: ${b.campaign.title}`)
    lines.push(`${pt ? 'Objetivo' : 'Objective'}: ${b.campaign.objective}`)
    const ch = b.campaign.chapters[b.campaign.chapters.length - 1]
    if (ch !== undefined) lines.push(`${pt ? 'Capítulo' : 'Chapter'} ${ch.n}: ${ch.prompt}`)
  }
  const open = b.quests.filter(q => q.status !== 'completed').map(q => q.title)
  if (open.length > 0) lines.push(`${pt ? 'Quests abertas' : 'Open quests'}: ${open.slice(0, 5).join('; ')}`)
  if (b.inventory.isRepo) {
    const files = b.inventory.items.slice(0, 8).map(i => i.path)
    lines.push(`Branch: ${b.inventory.branch ?? '?'}${files.length > 0 ? ` · ${pt ? 'arquivos mexidos' : 'files touched'}: ${files.join(', ')}` : ''}`)
  }
  if (b.last !== undefined) lines.push(`${pt ? 'Último relatório' : 'Last report'}: ${b.last.title}${b.last.result === undefined ? '' : ` — ${b.last.result}`}`)
  return lines.join('\n')
}

/** O que vai ao prompt: o pedido de abrir a side quest, com o resumo e o espaço para a tarefa. */
export const sideQuestPrompt = (brief: string, lang: Lang) =>
  lang === 'pt'
    ? `Abra uma side quest: uma sessão paralela para a tarefa abaixo, sem mexer nesta. Se o app tiver uma ferramenta para iniciar sessão, use-a; senão, rode um subagente em segundo plano. Passe este contexto e me avise quando ela voltar.\n\n${brief}\n\nTarefa da side quest: `
    : `Start a side quest: a parallel session for the task below, leaving this one untouched. If the app has a tool to start a session, use it; otherwise run a background subagent. Hand it this context and tell me when it comes back.\n\n${brief}\n\nSide quest task: `
