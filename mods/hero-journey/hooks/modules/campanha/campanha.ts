// Campanha e relatório da missão. A campanha é a sessão: o título e o objetivo
// vêm da primeira mensagem, cada mensagem nova abre um capítulo, e o fim de cada
// turno fecha o capítulo com um relatório. A linha do tempo do relatório se
// inspira no session-time-machine, de Daniel Ávila (claude-code-templates, MIT) —
// https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/mods/productivity/session-time-machine

import type { Beat, Campaign, Chapter, DiaryEntry, Report } from '../../../types'

const clean = (text: string) => text.replace(/\s+/g, ' ').trim()

export const newCampaign = (id: string, prompt: string, at: number): Campaign => ({
  id,
  title: titleOf(prompt),
  objective: cutAtWord(prompt, 280),
  startedAt: at,
  achieved: false,
  chapters: [{ n: 1, prompt: clean(prompt).slice(0, 140) }],
})

/** Corta na palavra, com reticências: nunca "…rode os test". */
export const cutAtWord = (text: string, max: number) => {
  const t = clean(text)
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.5 ? cut.slice(0, space) : cut).replace(/[\s,;:.\-–—]+$/, '')}…`
}

// Aberturas que não dizem o objetivo ("Ok.", "Por favor", "Primeiro").
const OPENERS = /^(ok|okay|beleza|certo|bom|então|entao|oi|olá|ola|e aí|e ai|por favor|please|hey|hi|primeiro|first)[\s,.!:]+/i

/**
 * O objetivo curto, sem gastar tokens: a primeira frase do pedido sem as
 * aberturas, cortada na palavra em até 70 caracteres. O inteiro vai no tooltip.
 */
export const shortGoal = (prompt: string) => {
  let t = clean(prompt)
  for (let i = 0; i < 3 && OPENERS.test(t); i++) t = t.replace(OPENERS, '')
  const first = t.split(/(?<=[.!?])\s/)[0] ?? t
  const goal = first.length >= 12 ? first : t
  return cutAtWord(goal.charAt(0).toUpperCase() + goal.slice(1), 70)
}

/** O objetivo para mostrar: o título que o app deu à sessão, a Missão da 1ª resposta ou o shortGoal. */
export const goalOf = (c: Campaign) => c.short ?? shortGoal(c.objective)

/** Título curto: a primeira frase da mensagem, até 60 caracteres. */
export const titleOf = (prompt: string) => {
  const first = clean(prompt).split(/(?<=[.!?])\s/)[0] ?? ''
  return first.length > 60 ? `${first.slice(0, 59)}…` : first
}

/** Uma mensagem nova: a primeira cria a campanha, as outras abrem capítulos. */
export const onPrompt = (c: Campaign | null, id: string, prompt: string, at: number): Campaign => {
  if (c === null) return newCampaign(id, prompt, at)
  const n = c.chapters.length + 1
  return { ...c, chapters: [...c.chapters, { n, prompt: clean(prompt).slice(0, 140) }] }
}

export const currentChapter = (c: Campaign | null): Chapter | undefined => c?.chapters[c.chapters.length - 1]

/** O capítulo de um turno. Um turno sem mensagem nova (continuação) não tem capítulo. */
export const chapterOf = (c: Campaign | null, turnId: string): Chapter | undefined => c?.chapters.find(ch => ch.turnId === turnId)

/**
 * Liga o turno que começa ao capítulo da mensagem dele: o primeiro capítulo sem
 * turno cujo texto bate com o do turno. Uma mensagem digitada durante outro
 * turno espera o seu próprio; um turno de continuação não pega capítulo nenhum.
 */
export const assignTurn = (c: Campaign, turnId: string, text: string): Campaign => {
  const said = clean(text)
  const ch = c.chapters.find(x => x.turnId === undefined && said !== '' && said.startsWith(x.prompt.replace(/…$/, '')))
  return ch === undefined ? c : { ...c, chapters: c.chapters.map(x => (x.n === ch.n ? { ...x, turnId } : x)) }
}

/** As linhas do formato briefing-de-bordo: Missão, Resultado, Risco, Próximo, Aguarda você. */
export const briefingOf = (answer: string) => {
  const field = (...names: string[]) => {
    for (const name of names) {
      const m = new RegExp(`\\*\\*${name}:\\*\\*\\s*(.+)`, 'i').exec(answer)
      if (m?.[1] !== undefined) return clean(m[1]).slice(0, 200)
    }
    return undefined
  }
  return {
    mission: field('Missão', 'Mission'),
    result: field('Resultado', 'Result'),
    risk: field('Risco', 'Risk'),
    next: field('Próximo', 'Next'),
    waits: field('Aguarda você', 'Waiting on you'),
  }
}

/** O relatório de um capítulo, montado do diário do turno e da resposta final. */
export const buildReport = (
  chapter: Chapter,
  entries: readonly DiaryEntry[],
  answer: string,
  durationMs: number,
  reason: string,
  refusals: readonly string[],
): Report => {
  const b = briefingOf(answer)
  const files = new Set(entries.filter(e => /^(Edit|Write|MultiEdit|NotebookEdit)$/.test(e.tool)).map(e => e.summary))
  const beats: Beat[] = entries.map(e => ({ cls: e.cls, tool: e.tool, summary: e.summary, status: e.status, ms: e.ms }))
  return {
    chapter: chapter.n,
    title: b.mission ?? chapter.prompt.slice(0, 80),
    mission: b.mission,
    result: b.result,
    risk: b.risk,
    next: b.next,
    waits: b.waits,
    durationMs,
    reason,
    actions: entries.length,
    files: files.size,
    added: entries.reduce((n, e) => n + (e.added ?? 0), 0),
    removed: entries.reduce((n, e) => n + (e.removed ?? 0), 0),
    created: entries.filter(e => e.isNew === true).length,
    failed: entries.filter(e => e.status === 'err').length,
    refusals: [...refusals],
    beats: beats.slice(-40),
  }
}

/** Fecha o capítulo atual com o relatório. */
export const closeChapter = (c: Campaign, report: Report): Campaign => ({
  ...c,
  chapters: c.chapters.map(ch => (ch.n === report.chapter ? { ...ch, report } : ch)),
})

export const reports = (c: Campaign | null): Report[] =>
  (c?.chapters ?? []).map(ch => ch.report).filter((r): r is Report => r !== undefined)

export const setVerdict = (c: Campaign, chapter: number, verdict: Report['verdict']): Campaign => ({
  ...c,
  chapters: c.chapters.map(ch => (ch.n === chapter && ch.report !== undefined ? { ...ch, report: { ...ch.report, verdict } } : ch)),
})

/** Cada campanha numa chave própria do `$.store`, para duas sessões não sobrescreverem uma à outra. */
export const storeKey = (id: string) => `campanha:${id}`

/** As chaves de campanha a apagar para guardar só as 20 mais recentes. */
export const prune = (stored: readonly { key: string; startedAt: number }[], keep = 20) =>
  [...stored].sort((a, b) => b.startedAt - a.startedAt).slice(keep).map(x => x.key)

export const fmtDuration = (ms: number) => {
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}min ${String(s % 60).padStart(2, '0')}s`
}
