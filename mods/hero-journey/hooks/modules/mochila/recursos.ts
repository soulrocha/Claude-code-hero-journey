// Recursos: a Mochila (o contexto), a Mana (a janela de 5 horas) e o Vigor (a
// semanal). As regras vieram de três mods, lidos no código:
// - token-weather (Anthropic, Apache-2.0) e a versão de hamzafer: o estado em
//   palavras e o peso do último turno;
// - context-bar (hamzafer): medir até o ponto em que o Claude Code compacta e
//   dizer o que ocupa a mochila;
// - usage-meter (hamzafer): a contagem do reset que anda, a janela que já virou,
//   a cor pelo que resta e um aviso por janela por período.
// https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather
// https://github.com/hamzafer/claude-code-mods
// Nada aqui chama o modelo: os números vêm do `$.session.usage()`.

import type { Resources, UsageWindow } from '../../../types'

/** Quantas leituras da mochila o histórico guarda (uma por turno). */
export const HISTORY = 12
/** Abaixo disto (do que resta), Mana e Vigor ficam âmbar; abaixo do segundo, vermelhos e avisam. */
export const LOW = 25
export const CRITICAL = 10

const WINDOW_MS: Record<string, number> = { five_hour: 5 * 3600_000, seven_day: 7 * 24 * 3600_000 }

type Category = { name: string; tokens: number; kind: string }

/** O que o `$.session.usage({ breakdown: 'summary' })` devolve, só o que os recursos leem. */
export type UsageReading = {
  context: {
    tokens?: number
    percent?: number
    window: number
    breakdown?: { categories: readonly Category[]; autoCompactThreshold?: number; isAutoCompactEnabled: boolean }
  }
  rateLimits: readonly UsageWindow[]
}

/**
 * Uma leitura nova a partir da anterior. Sem o detalhamento (o `session.measure`
 * não traz), o ponto de compactação e as categorias ficam os da leitura anterior.
 * `turnEnded` acrescenta a leitura ao histórico do peso por turno.
 */
export const readingOf = (u: UsageReading, before: Resources | null, turnEnded: boolean): Resources => {
  const b = u.context.breakdown
  const top =
    b === undefined
      ? (before?.top ?? [])
      : b.categories
          .filter(c => c.kind === 'used' && c.tokens > 0)
          .sort((x, y) => y.tokens - x.tokens)
          .slice(0, 3)
          .map(c => ({ name: c.name, tokens: c.tokens }))
  const compactsAt = b === undefined ? before?.compactsAt : b.isAutoCompactEnabled ? b.autoCompactThreshold : undefined
  // Sem a contagem de tokens (antes da primeira resposta), a porcentagem do motor dá a conta.
  const tokens = u.context.tokens ?? (u.context.percent === undefined ? before?.tokens : Math.round((u.context.percent / 100) * u.context.window))
  const history = before?.history ?? []
  return {
    tokens,
    window: u.context.window,
    compactsAt,
    top,
    windows: u.rateLimits.filter(w => Number.isFinite(w.percentUsed)).map(w => ({ kind: w.kind, percentUsed: w.percentUsed, resetsAt: w.resetsAt })),
    history: turnEnded && tokens !== undefined && tokens > 0 ? [...history, tokens].slice(-HISTORY) : history,
  }
}

export type BagState = 'leve' | 'carregada' | 'pesada' | 'transbordando'

/**
 * A mochila contra o ponto em que o Claude Code compacta sozinho (ou contra a
 * janela, com a compactação automática desligada): 100% é a hora da compactação.
 */
export const bagOf = (r: Resources) => {
  const limit = r.compactsAt ?? r.window
  const percent = r.tokens === undefined || limit <= 0 ? undefined : Math.min(100, Math.round((r.tokens / limit) * 100))
  const state: BagState = percent === undefined || percent < 50 ? 'leve' : percent < 75 ? 'carregada' : percent < 90 ? 'pesada' : 'transbordando'
  const prev = r.history[r.history.length - 2]
  const last = r.history[r.history.length - 1]
  const delta = prev === undefined || last === undefined ? undefined : last - prev
  const left = r.tokens === undefined ? undefined : Math.max(0, limit - r.tokens)
  return { percent, state, delta, left, limit }
}

export type WindowView = {
  kind: string
  /** O que resta, de 0 a 100; 100 numa janela que já virou. */
  left: number
  /** A janela passou do reset e espera uma leitura nova. */
  refilled: boolean
  /** Milissegundos até o reset; undefined sem horário de reset. */
  resetIn?: number
  /** Gastando mais rápido que o tempo passa: acaba antes do reset nesse ritmo. */
  fast: boolean
  level: 'ok' | 'baixo' | 'critico'
}

/** Uma janela de uso como o rodapé a mostra, no instante `now`. */
export const windowOf = (w: UsageWindow, now: number): WindowView => {
  const reset = w.resetsAt === undefined ? NaN : Date.parse(w.resetsAt)
  const hasReset = Number.isFinite(reset)
  const refilled = hasReset && reset <= now
  const left = refilled ? 100 : Math.max(0, Math.min(100, 100 - w.percentUsed))
  const length = WINDOW_MS[w.kind]
  // O ritmo: a fração gasta contra a fração da janela que já passou. Só depois de
  // 10% da janela e de 20% gastos, para o começo da janela não acender o alarme.
  const elapsed = hasReset && length !== undefined ? 1 - (reset - now) / length : undefined
  const fast = !refilled && elapsed !== undefined && elapsed > 0.1 && w.percentUsed >= 20 && w.percentUsed / 100 > elapsed + 0.1
  return {
    kind: w.kind,
    left,
    refilled,
    resetIn: hasReset && !refilled ? reset - now : undefined,
    fast,
    level: left <= CRITICAL ? 'critico' : left <= LOW ? 'baixo' : 'ok',
  }
}

/** "agora", "42m", "3h56", "4d2h": a contagem até o reset. */
export const countdown = (ms: number) => {
  const minutes = Math.max(0, Math.ceil(ms / 60_000))
  if (minutes < 1) return '0m'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h${String(minutes % 60).padStart(2, '0')}`
  return `${Math.floor(hours / 24)}d${hours % 24}h`
}

/** 1234 → "1.2k", 160000 → "160k", 1000000 → "1M". */
export const short = (n: number) => {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${+(n / 1000).toFixed(1)}k`
  return String(n)
}

/**
 * As janelas que acabam de ficar críticas e ainda não avisaram neste período.
 * Um reset que andou mais de meia hora é um período novo; sem horário de reset,
 * voltar para acima do limite rearma o aviso.
 */
export const warningsOf = (windows: readonly UsageWindow[], warned: Readonly<Record<string, number>>, now: number) => {
  const fire: { kind: string; left: number; resetIn?: number }[] = []
  const next: Record<string, number> = { ...warned }
  for (const w of windows) {
    const v = windowOf(w, now)
    const reset = w.resetsAt === undefined ? 0 : Date.parse(w.resetsAt) || 0
    if (v.level !== 'critico') {
      if (reset === 0) delete next[w.kind]
      continue
    }
    const last = warned[w.kind]
    if (last !== undefined && reset <= last + 30 * 60_000) continue
    next[w.kind] = reset
    fire.push({ kind: w.kind, left: v.left, resetIn: v.resetIn })
  }
  return { fire, warned: next }
}

/** Se algum recurso pede atenção na faixa: a mochila transbordando ou uma janela crítica. */
export const alertOf = (r: Resources | null, now: number) => {
  if (r === null) return undefined
  const bag = bagOf(r)
  if (bag.state === 'transbordando') return { kind: 'mochila' as const, percent: bag.percent ?? 100 }
  const low = r.windows.map(w => windowOf(w, now)).find(w => w.level === 'critico')
  return low === undefined ? undefined : { kind: low.kind === 'seven_day' ? ('vigor' as const) : ('mana' as const), percent: Math.round(low.left) }
}
