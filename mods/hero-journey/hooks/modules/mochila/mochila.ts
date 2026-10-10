// Mochila: o contexto. O cartão leva a instrução do /compact ao prompt (não
// gasta nada até a pessoa enviar) ou, com o Claude parado, compacta na hora
// pelo `$.session.compact` (aí gasta tokens, só com o clique).

import type { Campaign, Quest } from '../../../types'

/** A partir de quanto o cartão entra sozinho na fila. */
export const COMPACT_AT = 85

export const compactInstruction = (lang: 'pt' | 'en', campaign: Campaign | null, quests: readonly Quest[]) => {
  const goal = campaign?.objective.slice(0, 120) ?? ''
  const open = quests.filter(q => q.status !== 'completed').slice(0, 3).map(q => q.title).join('; ')
  return lang === 'pt'
    ? `Mantenha o objetivo da campanha${goal === '' ? '' : ` ("${goal}")`}${open === '' ? '' : `, as quests abertas (${open})`}, os arquivos mexidos e as decisões tomadas. Descarte saídas longas de ferramentas.`
    : `Keep the campaign objective${goal === '' ? '' : ` ("${goal}")`}${open === '' ? '' : `, the open quests (${open})`}, the files touched and the decisions made. Drop long tool outputs.`
}

/** Se o cartão deve entrar agora: só uma vez por subida acima do limite. */
export const shouldWarn = (percent: number, warned: boolean) =>
  percent >= COMPACT_AT && !warned ? 'warn' : percent < COMPACT_AT - 10 ? 'reset' : 'keep'
