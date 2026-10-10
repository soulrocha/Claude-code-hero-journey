// Comemoração: o Clawd festeja no fim de um turno que trabalhou de verdade.
// Toast, não som: no Windows o `$.audio` não toca (handoff, seção 4).

import type { Lang, Report } from '../../../types'

/**
 * Só comemora uma missão declarada (a linha **Missão:** da resposta, nunca o
 * pedido da pessoa) que mexeu em arquivos, sem falha. Turno que só conversou,
 * leu ou lançou um subagente não vira "Missão cumprida".
 */
export const celebrate = (r: Report, lang: Lang) => {
  if (r.reason !== 'answer' || r.failed > 0 || r.mission === undefined) return undefined
  if (r.files === 0 && r.added + r.removed === 0 && r.created === 0) return undefined
  const stats = [r.added + r.removed > 0 ? `+${r.added} −${r.removed}` : '', r.created > 0 ? `${r.created} ${lang === 'pt' ? 'novo(s)' : 'new'}` : '']
    .filter(Boolean)
    .join(' · ')
  return `🦀✦ ${lang === 'pt' ? 'Missão cumprida' : 'Mission complete'}: ${r.mission}${stats === '' ? '' : ` (${stats})`}`
}
