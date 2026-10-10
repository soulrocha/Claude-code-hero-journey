// Arte do polimento (2026-10-09): o desfile de pets dos Primeiros passos e do
// Sobre, os cabeçalhos de categoria do ⚙, o cartão da campanha no topo do
// painel, o trilho das abas Grupo/Inventário, os recursos em linhas (sem
// sobreposição) e a lista de recursos do Sobre. Mesmo contrato do hero-art:
// SVG sem script; o `svg()` de core/ui põe o color-scheme.

import type { Cls, Palette } from '../../types'
import { classColor, esc } from './art'
import type { Art } from './art'
import type { Step, StepWords } from './hero-art'
import { crabAt, doc, fit, toneOf } from './hero-art'

const PARADE: Cls[] = ['mago', 'ilusionista', 'artifice', 'paladino', 'druida', 'patrulheiro', 'anao', 'arauto', 'alquimista']

/** Losango de ornamento. */
const dia = (x: number, y: number, r: number, fill: string, op = 0.75) =>
  `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" fill="${fill}" opacity="${op}" transform="rotate(45 ${x} ${y})"/>`

/**
 * O desfile do README: os 9 Clawds em fila, saltitando em ondas, e o título
 * embaixo com ornamentos. `subtitle` é opcional (o Sobre põe a versão).
 */
export const parade = (w: number, title: string, p: Palette, subtitle?: string): Art => {
  const k = toneOf(p)
  const size = Math.min(40, Math.floor((w - 16) / PARADE.length))
  const rowW = size * PARADE.length
  const x0 = (w - rowW) / 2
  let inner = '<style>.hop{animation:hop 2.4s ease-in-out infinite}@keyframes hop{0%,100%{transform:none}50%{transform:translateY(-4px)}}</style>'
  PARADE.forEach((cls, i) => {
    inner += `<g class="hop" style="animation-delay:${(i * 0.18).toFixed(2)}s">${crabAt(cls, p, x0 + i * size, 6, size - 2, false)}</g>`
  })
  const ty = size + 26
  const tw = title.length * 10
  inner +=
    `<line x1="${w / 2 - tw / 2 - 70}" y1="${ty - 4}" x2="${w / 2 - tw / 2 - 14}" y2="${ty - 4}" stroke="${k.line}"/>` +
    dia(w / 2 - tw / 2 - 8, ty - 4, 3, k.gild) +
    `<text x="${w / 2}" y="${ty}" text-anchor="middle" font-size="12" letter-spacing="2.6" font-weight="700" fill="${k.gild}">${esc(title.toUpperCase())}</text>` +
    dia(w / 2 + tw / 2 + 8, ty - 4, 3, k.gild) +
    `<line x1="${w / 2 + tw / 2 + 14}" y1="${ty - 4}" x2="${w / 2 + tw / 2 + 70}" y2="${ty - 4}" stroke="${k.line}"/>`
  let h = ty + 8
  if (subtitle) {
    inner += `<text x="${w / 2}" y="${ty + 18}" text-anchor="middle" font-size="10.5" fill="${k.muted}">${esc(subtitle)}</text>`
    h = ty + 26
  }
  return doc(w, h, inner, title)
}

// Ícones pequenos, desenhados (16 px), para cabeçalhos e listas.
const ICON: Record<string, (c: string) => string> = {
  geral: c => `<circle cx="8" cy="8" r="6" fill="none" stroke="${c}" stroke-width="1.4"/><path d="M2 8h12M8 2c2.5 2.6 2.5 9.4 0 12M8 2c-2.5 2.6-2.5 9.4 0 12" fill="none" stroke="${c}" stroke-width="1.1"/>`,
  modulos: c => `<rect x="2" y="2" width="5" height="5" rx="1" fill="${c}"/><rect x="9" y="2" width="5" height="5" rx="1" fill="${c}" opacity=".6"/><rect x="2" y="9" width="5" height="5" rx="1" fill="${c}" opacity=".6"/><rect x="9" y="9" width="5" height="5" rx="1" fill="${c}"/>`,
  painel: c => `<rect x="2" y="2" width="12" height="12" rx="2" fill="none" stroke="${c}" stroke-width="1.4"/><path d="M9 2v12" stroke="${c}" stroke-width="1.4"/><path d="M10.5 5h2M10.5 8h2M10.5 11h2" stroke="${c}"/>`,
  diario: c => `<path d="M3 2h8l2 2v10H3z" fill="none" stroke="${c}" stroke-width="1.4"/><path d="M5 6h6M5 9h6M5 12h4" stroke="${c}"/>`,
  protecao: c => `<path d="M8 1.5 13.5 4v4c0 3.2-2.4 5.6-5.5 6.5C4.9 13.6 2.5 11.2 2.5 8V4z" fill="${c}" fill-opacity=".2" stroke="${c}" stroke-width="1.4"/><path d="M5.5 8l2 2 3-3.5" fill="none" stroke="${c}" stroke-width="1.4"/>`,
  memoria: c => `<path d="M2 3.5C4.5 2.5 6.5 2.8 8 4c1.5-1.2 3.5-1.5 6-.5v9c-2.5-1-4.5-.7-6 .5-1.5-1.2-3.5-1.5-6-.5z" fill="${c}" fill-opacity=".2" stroke="${c}" stroke-width="1.3"/><path d="M8 4v9" stroke="${c}"/>`,
  atalhos: c => `<path d="M9.5 1.5 4 9h4l-1.5 5.5L12 7H8z" fill="${c}"/>`,
  objetivo: c => `<circle cx="8" cy="8" r="6" fill="none" stroke="${c}" stroke-width="1.3"/><circle cx="8" cy="8" r="3" fill="none" stroke="${c}" stroke-width="1.3"/><circle cx="8" cy="8" r="1" fill="${c}"/>`,
  grupo: c => `<path d="M3 13 13 3M3 3l10 10" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/><path d="M2 11.5 4.5 14M11.5 14 14 11.5" stroke="${c}" stroke-width="1.6"/>`,
  inventario: c => `<rect x="3" y="5" width="10" height="9" rx="2" fill="${c}" fill-opacity=".25" stroke="${c}" stroke-width="1.3"/><path d="M6 5V3.5h4V5" fill="none" stroke="${c}" stroke-width="1.3"/>`,
  grimorio: c => `<rect x="3" y="2" width="10" height="12" rx="1.5" fill="${c}" fill-opacity=".25" stroke="${c}" stroke-width="1.3"/><path d="M8 5l.9 1.8 2 .3-1.4 1.4.3 2L8 9.6 6.2 10.5l.3-2L5.1 7.1l2-.3z" fill="${c}"/>`,
  sidequest: c => `<path d="M2 5h9l-2.5-2.5M14 11H5l2.5 2.5" fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  vault: c => `<path d="M2 4h4l1.5 1.5H14V13H2z" fill="${c}" fill-opacity=".25" stroke="${c}" stroke-width="1.3"/>`,
  lingua: c => `<path d="M2 3h7M5.5 1.5V3M3.5 3c.5 2.5 2.5 4.5 5 5.5M7.5 3c-.5 2.5-2.5 4.5-5 5.5" fill="none" stroke="${c}" stroke-width="1.2"/><path d="M8 14l3-7 3 7M9.2 11.5h3.6" fill="none" stroke="${c}" stroke-width="1.2"/>`,
  projeto: c => `<path d="M2 5h12v8H2z" fill="none" stroke="${c}" stroke-width="1.3"/><path d="M2 5l2-2.5h4L9 5" fill="none" stroke="${c}" stroke-width="1.3"/><path d="M6 9h4M8 7v4" stroke="${c}" stroke-width="1.3"/>`,
}

export type IconName = keyof typeof ICON

export const iconSvg = (name: IconName, color: string, x = 0, y = 0) => `<g transform="translate(${x} ${y})">${ICON[name]?.(color) ?? ''}</g>`

/** Ícone sozinho (16 px), com tooltip. */
export const icon = (name: IconName, p: Palette, tip: string, tone: 'gild' | 'muted' = 'gild'): Art => {
  const k = toneOf(p)
  return doc(16, 16, iconSvg(name, tone === 'gild' ? k.gild : k.muted), tip, tip)
}

/** Cabeçalho de categoria do ⚙: ícone, rótulo em versalete e um fio fino até a borda. */
export const categoryHeader = (w: number, name: IconName, label: string, p: Palette, tip?: string): Art => {
  const k = toneOf(p)
  const text = label.toUpperCase()
  const tw = text.length * 7.6
  const inner =
    iconSvg(name, k.gild, 0, 2) +
    `<text x="24" y="14.5" font-size="11" letter-spacing="1.8" font-weight="700" fill="${k.gild}">${esc(text)}</text>` +
    `<line x1="${24 + tw + 10}" y1="10" x2="${w - (tip ? 22 : 0)}" y2="10" stroke="${k.line}"/>` +
    (tip ? `<circle cx="${w - 8}" cy="10" r="7" fill="none" stroke="${k.gild}" stroke-opacity=".6"/><text x="${w - 8}" y="14" text-anchor="middle" font-size="10" font-weight="700" fill="${k.gild}">?</text>` : '')
  return doc(w, 20, inner, label, tip)
}

/** Selo numerado dos Primeiros passos: aceso quando a etapa está feita. */
export const stepBadge = (n: number, done: boolean, p: Palette): Art => {
  const k = toneOf(p)
  const inner = done
    ? `<circle cx="10" cy="10" r="8.5" fill="${k.ok}" fill-opacity=".18" stroke="${k.ok}"/><path d="M6 10.5l2.6 2.5L14 7.5" fill="none" stroke="${k.ok}" stroke-width="1.8" stroke-linecap="round"/>`
    : `<circle cx="10" cy="10" r="8.5" fill="${k.gild}" fill-opacity=".12" stroke="${k.gild}" stroke-opacity=".7"/><text x="10" y="14" text-anchor="middle" font-size="11" font-weight="700" fill="${k.gild}">${n}</text>`
  return doc(20, 20, inner, done ? `${n} ✓` : String(n))
}

/** Quebra o texto em até `max` linhas pelo tamanho aproximado; a última ganha "…". */
const wrap = (text: string, px: number, size: number, max: number) => {
  const per = Math.max(8, Math.floor(px / (size * 0.56)))
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const word of words) {
    const next = cur === '' ? word : `${cur} ${word}`
    if (next.length <= per) cur = next
    else {
      if (cur !== '') lines.push(cur)
      cur = word
    }
  }
  if (cur !== '') lines.push(cur)
  if (lines.length <= max) return lines
  const kept = lines.slice(0, max)
  kept[max - 1] = fit(`${kept[max - 1]} …`, px, size)
  return kept
}

/**
 * O topo do painel: o Clawd numa moldura (na forma da classe que age, ou
 * cochilando), "CAMPANHA · CAP. N", o objetivo em até 3 linhas (inteiro no
 * tooltip) e a barra fina por baixo, de canto a canto.
 */
export const campaignCard = (
  w: number,
  cls: Cls | null,
  label: string,
  objective: string,
  steps: readonly Step[],
  p: Palette,
  words: StepWords,
  chapter: number,
  full = objective,
): Art => {
  const k = toneOf(p)
  const c = cls ? classColor(cls, p) : k.gild
  const lines = objective === '' ? [] : wrap(objective, w - 64, 12.5, 3)
  const top = 22 + lines.length * 17
  const barY = Math.max(top, 56) + 6
  let inner =
    `<rect x=".5" y=".5" width="46" height="46" rx="8" fill="${c}" fill-opacity=".07" stroke="${c}" stroke-opacity=".5"/>` +
    crabAt(cls ?? 'druida', p, 4, 8, 39, false) +
    (cls ? '' : `<text class="glow" x="36" y="11" font-size="9" fill="${k.muted}">z</text>`) +
    `<text x="58" y="11" font-size="9.5" letter-spacing="1.6" font-weight="700" fill="${k.gild}">${esc(label.toUpperCase())}</text>` +
    lines.map((l, i) => `<text x="58" y="${28 + i * 17}" font-size="12.5" font-weight="700" fill="${k.text}">${esc(l)}</text>`).join('')
  // a barra fina do objetivo, embaixo e de canto a canto
  const done = steps.filter(s => s.state === 'done').length
  if (steps.length > 0) {
    const pad = 5
    const inner0 = w - pad * 2
    const pct = Math.round(((done + (steps.some(s => s.state === 'now') ? 0.5 : 0)) / steps.length) * 100)
    inner +=
      `<rect x="${pad}" y="${barY + 8.5}" width="${inner0}" height="3" rx="1.5" fill="${k.track}"/>` +
      `<rect x="${pad}" y="${barY + 8.5}" width="${(inner0 * pct) / 100}" height="3" rx="1.5" fill="${k.gild}"/>`
    ;(steps.length <= 30 ? steps : []).forEach((s, i) => {
      const x = pad + (inner0 * (i + 1)) / steps.length
      const lit = s.state === 'done'
      inner += `<g><title>${esc(words.step(i + 1, s.name, s.state))}</title><rect class="${s.state === 'now' ? 'breath' : ''}" x="${x - 3.5}" y="${barY + 6.5}" width="7" height="7" transform="rotate(45 ${x} ${barY + 10})" fill="${lit || s.state === 'now' ? k.gild : k.hole}" stroke="${k.gild}" stroke-opacity="${lit ? 1 : 0.55}" stroke-width="1.2"/></g>`
    })
    inner +=
      `<text x="0" y="${barY + 31}" font-size="10.5" fill="${k.muted}"><tspan fill="${k.gild}" font-weight="700">${done}/${steps.length}</tspan> ${esc(words.steps(done, steps.length))} · ${esc(words.chapter(chapter))}</text>`
    return doc(w, barY + 36, inner, objective, full || undefined)
  }
  return doc(w, Math.max(top, 50), inner, objective || label, full || undefined)
}

/**
 * O trilho embaixo das abas Grupo/Inventário: metade acesa (com losango) sob a
 * aba ativa, metade apagada sob a outra. As abas ficam em duas metades iguais.
 */
export const tabRail = (w: number, active: 0 | 1, p: Palette): Art => {
  const k = toneOf(p)
  const half = w / 2
  const on = active * half
  const off = (1 - active) * half
  const inner =
    `<line x1="${off + 10}" y1="4" x2="${off + half - 10}" y2="4" stroke="${k.line}"/>` +
    `<line x1="${on + 10}" y1="4" x2="${on + half - 10}" y2="4" stroke="${k.gild}" stroke-width="1.6"/>` +
    dia(on + half / 2, 4, 3.2, k.gild, 1)
  return doc(w, 8, inner, active === 0 ? 'grupo' : 'inventario')
}

export type ResRow = { key: 'mochila' | 'mana' | 'vigor'; label: string; value?: number; color: string; reset: string; tip: string }

const RES_ICON = {
  mochila: `<rect x="3" y="5" width="10" height="9" rx="2" fill="#a8794a"/><rect x="5" y="2.5" width="6" height="4" rx="1.5" fill="none" stroke="#a8794a" stroke-width="1.4"/><rect x="5" y="9" width="6" height="3" rx="1" fill="#6e4f2f"/>`,
  mana: `<path d="M8 1.5C4.5 6.5 3.5 8.5 3.5 10a4.5 4.5 0 0 0 9 0c0-1.5-1-3.5-4.5-8.5z" fill="#6cb6ec"/>`,
  vigor: `<path d="M8 14 2.5 8.4a3.2 3.2 0 0 1 5.5-3.4 3.2 3.2 0 0 1 5.5 3.4z" fill="#8fc46a"/>`,
}

/**
 * Os recursos do rodapé em linhas: ícone, nome, barra que estica, valor e o
 * tempo até renovar. Uma linha por recurso: nada se sobrepõe, em qualquer largura.
 */
export const resourceRows = (w: number, rs: readonly ResRow[], p: Palette): Art => {
  const k = toneOf(p)
  const rowH = 17
  const labelW = 62
  const valueW = 92
  let inner = ''
  rs.forEach((r, i) => {
    const y = i * rowH
    const bx = 20 + labelW
    const bw = Math.max(30, w - bx - valueW - 6)
    const v = r.value === undefined ? '—' : `${Math.round(r.value)}%`
    inner +=
      `<g><title>${esc(r.tip)}</title><rect x="0" y="${y}" width="${w}" height="${rowH}" fill="transparent"/>` +
      `<g transform="translate(0 ${y})">${RES_ICON[r.key]}</g>` +
      `<text x="20" y="${y + 12}" font-size="10.5" fill="${k.muted}">${esc(r.label)}</text>` +
      `<rect x="${bx}" y="${y + 6.5}" width="${bw}" height="4" rx="2" fill="${k.track}"/>` +
      (r.value === undefined ? '' : `<rect x="${bx}" y="${y + 6.5}" width="${(bw * Math.min(100, Math.max(0, r.value))) / 100}" height="4" rx="2" fill="${r.color}"/>`) +
      `<text x="${bx + bw + 8}" y="${y + 12}" font-size="10.5" font-weight="700" fill="${k.text}">${v}</text>` +
      (r.reset ? `<text x="${w}" y="${y + 12}" text-anchor="end" font-size="10" fill="${k.dim}">↻ ${esc(r.reset)}</text>` : '') +
      '</g>'
  })
  return doc(w, rs.length * rowH, inner, rs.map(r => `${r.label} ${r.value === undefined ? '—' : `${Math.round(r.value)}%`}`).join(', '))
}

export type Feature = { icon: IconName; title: string; text: string }

/** A lista do Sobre: ícone, título curto e uma linha. */
export const featureList = (w: number, items: readonly Feature[], p: Palette): Art => {
  const k = toneOf(p)
  let inner = ''
  items.forEach((f, i) => {
    const y = i * 36
    inner +=
      `<rect x=".5" y="${y + 2.5}" width="27" height="27" rx="6" fill="${k.gild}" fill-opacity=".08" stroke="${k.line}"/>` +
      iconSvg(f.icon, k.gild, 6, y + 8) +
      `<text x="38" y="${y + 14}" font-size="12" font-weight="700" fill="${k.text}">${esc(f.title)}</text>` +
      `<text x="38" y="${y + 28}" font-size="10.5" fill="${k.muted}">${esc(fit(f.text, w - 40, 10.5))}</text>`
  })
  return doc(w, items.length * 36, inner, items.map(f => f.title).join(', '))
}

/**
 * O topo do cartão do grimório: o Mago numa moldura dourada (com o livro e o
 * pergaminho), "GRIMÓRIO" em versalete e quantas inscrições esperam o Selar.
 */
export const grimHeader = (w: number, title: string, subtitle: string, p: Palette): Art => {
  const k = toneOf(p)
  const inner =
    `<rect x=".75" y=".75" width="54" height="46" rx="8" fill="${k.gild}" fill-opacity=".07" stroke="${k.gild}" stroke-opacity=".55"/>` +
    crabAt('mago', p, 2, 10, 51, true) +
    iconSvg('grimorio', k.gild, 66, 6) +
    `<text x="88" y="18" font-size="12" letter-spacing="2.2" font-weight="700" fill="${k.gild}">${esc(title.toUpperCase())}</text>` +
    `<line x1="${92 + title.length * 9.4}" y1="14" x2="${w}" y2="14" stroke="${k.line}"/>` +
    `<text x="66" y="38" font-size="11" fill="${k.muted}">${esc(fit(subtitle, w - 70, 11))}</text>`
  return doc(w, 48, inner, title)
}

/**
 * Uma inscrição: barra na cor do tipo, a etiqueta (Decisão, Conquista,
 * Preferência) em pílula sem fundo, o texto em até 3 linhas e, embaixo, por que
 * ela vai para os destinos sugeridos. O texto inteiro fica no tooltip.
 */
export const inscriptionArt = (w: number, kind: string, color: string, text: string, why: string, p: Palette): Art => {
  const k = toneOf(p)
  const lines = wrap(text, w - 22, 12, 3)
  const kw = kind.length * 6.6 + 16
  const whyLines = why === '' ? [] : wrap(why, w - 22, 10.5, 2)
  const h = 30 + lines.length * 16 + whyLines.length * 14 + 6
  const inner =
    `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="7" fill="${color}" fill-opacity=".05" stroke="${color}" stroke-opacity=".3"/>` +
    `<rect x="0" y="6" width="3" height="${h - 12}" rx="1.5" fill="${color}"/>` +
    `<rect x="12.5" y="7.5" width="${kw}" height="16" rx="8" fill="none" stroke="${color}" stroke-opacity=".7"/>` +
    `<text x="${12.5 + kw / 2}" y="19" text-anchor="middle" font-size="9.5" letter-spacing="1.2" font-weight="700" fill="${color}">${esc(kind.toUpperCase())}</text>` +
    lines.map((l, i) => `<text x="12" y="${42 + i * 16}" font-size="12" fill="${k.text}">${esc(l)}</text>`).join('') +
    whyLines.map((l, i) => `<text x="12" y="${42 + lines.length * 16 + i * 14}" font-size="10.5" fill="${k.dim}">${esc(l)}</text>`).join('')
  return doc(w, h, inner, `${kind}: ${text}`, text)
}

/** Um fio fino com losango no meio, para separar as partes de um cartão. */
export const divider = (w: number, p: Palette): Art => {
  const k = toneOf(p)
  return doc(w, 8, `<line x1="0" y1="4" x2="${w / 2 - 8}" y2="4" stroke="${k.line}"/>${dia(w / 2, 4, 2.5, k.gild, 0.7)}<line x1="${w / 2 + 8}" y1="4" x2="${w}" y2="4" stroke="${k.line}"/>`, '')
}
