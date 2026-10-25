// Recibo do turno: uma linha embaixo da resposta com quem mais agiu, os números
// e o tempo. Fica no chat depois que o app recolhe o diário no fim do turno, e
// não gasta tokens. Substitui a comemoração em toast e o relatório do painel.
// A ideia do recibo veio do Flightdeck, de scasella (MIT) — https://github.com/scasella/claude-flightdeck

import type { Cls, DiaryEntry, Lang, Report } from '../../../types'

/** A classe que mais agiu no turno; num empate, a que agiu primeiro. */
export const leadOf = (entries: readonly Pick<DiaryEntry, 'cls'>[]): Cls | undefined => {
  const count = new Map<Cls, number>()
  for (const e of entries) count.set(e.cls, (count.get(e.cls) ?? 0) + 1)
  let lead: Cls | undefined
  for (const [cls, n] of count) if (lead === undefined || n > (count.get(lead) ?? 0)) lead = cls
  return lead
}

export const durationOf = (ms: number) => {
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}min ${String(s % 60).padStart(2, '0')}s`
}

/**
 * A linha do recibo, ou undefined num turno que só conversou (sem ação):
 * "🦀 ✦ Missão cumprida: Corrige o login · Artífice · 4 ações · +42 −8 · 1 novo · 1min 12s".
 * A missão só entra quando o turno mexeu em arquivos, sem falha e sem interrupção.
 */
export const receiptOf = (r: Report, lead: string | undefined, lang: Lang) => {
  const p = receiptParts(r, lead, lang)
  return p === undefined ? undefined : `🦀 ${p.head}${p.parts.join(' · ')}`
}

/** As peças do recibo: a missão cumprida (ou vazio) e o resto; o terminal pinta cada uma. */
export const receiptParts = (r: Report, lead: string | undefined, lang: Lang) => {
  if (r.actions === 0) return undefined
  const pt = lang === 'pt'
  const changed = r.files > 0 || r.added + r.removed > 0 || r.created > 0
  const won = r.reason === 'answer' && r.failed === 0 && changed && r.mission !== undefined
  const parts = [
    lead,
    pt ? `${r.actions} ${r.actions === 1 ? 'ação' : 'ações'}` : `${r.actions} ${r.actions === 1 ? 'action' : 'actions'}`,
    r.added + r.removed > 0 ? `+${r.added} −${r.removed}` : '',
    r.created > 0 ? (pt ? `${r.created} ${r.created === 1 ? 'novo' : 'novos'}` : `${r.created} new`) : '',
    r.failed > 0 ? (pt ? `✗ ${r.failed} ${r.failed === 1 ? 'falha' : 'falhas'}` : `✗ ${r.failed} failed`) : '',
    r.refusals.length > 0 ? (pt ? `🛡 ${r.refusals.length} barrado` : `🛡 ${r.refusals.length} blocked`) : '',
    r.reason === 'aborted' ? (pt ? 'interrompido' : 'interrupted') : '',
    durationOf(r.durationMs),
  ].filter(Boolean)
  const head = won ? `✦ ${pt ? 'Missão cumprida' : 'Mission complete'}: ${r.mission} · ` : ''
  return { head, parts: parts as string[] }
}
