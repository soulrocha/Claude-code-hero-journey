// Comemoração: o Clawd festeja no fim de um turno que trabalhou de verdade.
// Toast, não som: no Windows o `$.audio` não toca (handoff, seção 4).

import type { Lang, Report } from '../../../types'

/** Só comemora turnos com ação e sem falha, para não virar ruído. */
export const celebrate = (r: Report, lang: Lang) => {
  if (r.reason !== 'answer' || r.actions === 0 || r.failed > 0) return undefined
  const stats = [r.added + r.removed > 0 ? `+${r.added} −${r.removed}` : '', r.created > 0 ? `${r.created} ${lang === 'pt' ? 'novo(s)' : 'new'}` : '']
    .filter(Boolean)
    .join(' · ')
  return `🦀✦ ${lang === 'pt' ? 'Missão cumprida' : 'Mission complete'}: ${r.title}${stats === '' ? '' : ` (${stats})`}`
}
