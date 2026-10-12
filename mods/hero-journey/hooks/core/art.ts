// A arte da HUD que não é o Clawd nem o cenário: as cores das 19 classes e das
// raridades, o Clawd recortado (dos sprites aprovados) para o chat, a faixa e o
// grupo, os títulos do quest log, a barra do objetivo, a trilha e as barras dos
// recursos, os ícones do ⚙ e do "Sobre", o desfile, a galeria das classes e o dragão da guarda. Tudo
// é texto de SVG sem script: a animação vem de CSS e de SMIL, que o `Svg`
// interativo do desktop toca; o `svg()` de core/ui põe o color-scheme.

import type { Cls, Palette, Rarity } from '../../types'
import type { Art } from './doc'
import { doc, esc } from './doc'
import type { Pose } from './sprites'
import { spriteInner } from './sprites'

export type { Art } from './doc'
export { doc, esc } from './doc'

const COLORS: Record<Palette, Record<Cls, string>> = {
  escuro: {
    aprendiz: '#f0a272',
    mago: '#6c9ff0',
    cacador: '#6fcf8e',
    ladino: '#a9adc4',
    runico: '#5fe3cf',
    ilusionista: '#b49cf0',
    sabio: '#8b8ff5',
    engenheiro: '#d98a6a',
    bruxo: '#c9ccd6',
    rei: '#ee7a8e',
    artifice: '#e9b75c',
    oraculo: '#8fd3ff',
    geomante: '#c8a57a',
    alquimista: '#a8d07a',
    cartomante: '#e3a8f0',
    invocador: '#a78bfa',
    cronomante: '#d7954a',
    paladino: '#f2c14e',
    pintor: '#f2715f',
  },
  claro: {
    aprendiz: '#a84e1a',
    mago: '#2a5bb0',
    cacador: '#22784a',
    ladino: '#4d5470',
    runico: '#137a6b',
    ilusionista: '#6845bd',
    sabio: '#3f45b8',
    engenheiro: '#8a4630',
    bruxo: '#535866',
    rei: '#b0324c',
    artifice: '#855a06',
    oraculo: '#1b6aa0',
    geomante: '#7a5a2a',
    alquimista: '#427a17',
    cartomante: '#8a3a9e',
    invocador: '#5b3fc4',
    cronomante: '#8a5418',
    paladino: '#8a6400',
    pintor: '#b23a28',
  },
}

/** Tons da pele e da raridade, nas duas paletas do protótipo. */
// `card` é translúcido (hex de 8 dígitos): destaca a linha sobre qualquer fundo do app.
export const TONE: Record<Palette, Record<'text' | 'muted' | 'gild' | 'gildDim' | 'ok' | 'bad' | 'warn' | 'pane' | 'card', string>> = {
  escuro: { text: '#ece9df', muted: '#b3b0a6', gild: '#d9b26a', gildDim: '#8a7346', ok: '#8fc46a', bad: '#ee7a8e', warn: '#e6b450', pane: '#2b2a27', card: '#d9b26a17' },
  claro: { text: '#1f1e1d', muted: '#57554f', gild: '#7a5310', gildDim: '#c9b48a', ok: '#3d7a1a', bad: '#b23450', warn: '#8a5e00', pane: '#f3f1ea', card: '#7a531014' },
}

const RARITY: Record<Palette, Record<Rarity, string>> = {
  escuro: { lendario: '#f0a272', raro: '#6cb6ec', incomum: '#8fc46a', comum: '#d8d5cc', pobre: '#9a988f' },
  claro: { lendario: '#a84e1a', raro: '#1b6aa0', incomum: '#3d7a1a', comum: '#4a4842', pobre: '#66645d' },
}

export const classColor = (cls: Cls, palette: Palette) => COLORS[palette][cls]
export const rarityColor = (rarity: Rarity, palette: Palette) => RARITY[palette][rarity]

type Tone = { text: string; muted: string; dim: string; gild: string; line: string; track: string; ok: string; bad: string; warn: string; hole: string }

const TONES: Record<Palette, Tone> = {
  escuro: {
    text: '#ece9df',
    muted: '#a9a69c',
    dim: '#7d7a72',
    gild: '#d9b26a',
    line: 'rgba(217,178,106,.26)',
    track: 'rgba(255,255,255,.08)',
    ok: '#8fc46a',
    bad: '#ee7a8e',
    warn: '#e6b450',
    hole: 'rgba(0,0,0,.35)',
  },
  claro: {
    text: '#1f1e1d',
    muted: '#57554f',
    dim: '#7a776f',
    gild: '#8a6216',
    line: 'rgba(138,98,22,.32)',
    track: 'rgba(0,0,0,.08)',
    ok: '#3d7a1a',
    bad: '#b23450',
    warn: '#8a5e00',
    hole: 'rgba(255,255,255,.7)',
  },
}

export const toneOf = (p: Palette) => TONES[p]

const RAR: Record<Palette, Record<Rarity, string>> = {
  escuro: { lendario: '#f0a272', raro: '#6cb6ec', incomum: '#8fc46a', comum: '#d8d5cc', pobre: '#9a988f' },
  claro: { lendario: '#a84e1a', raro: '#1b6aa0', incomum: '#3d7a1a', comum: '#4a4842', pobre: '#7a776f' },
}
export const rarityTone = (r: Rarity, p: Palette) => RAR[p][r]

/** Corta pelo tamanho aproximado do texto em px (sem DOM para medir). */
export const fit = (s: string, px: number, size = 11) => {
  const max = Math.max(3, Math.floor(px / (size * 0.56)))
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`
}

// ---------- Clawd ----------

/** O recorte do sprite com o corpo, o que ele veste e o acessório da mão, sem a caixa vazia em volta. */
const CROP = { x: 14, y: 10, w: 112, h: 80 }

/** O Clawd da classe dentro de outro desenho, recortado, na altura pedida. */
export const crabAt = (cls: Cls, x: number, y: number, h: number, pose: Pose = 'work') => {
  const w = (h * CROP.w) / CROP.h
  return `<svg x="${x}" y="${y}" width="${w.toFixed(1)}" height="${h}" viewBox="${CROP.x} ${CROP.y} ${CROP.w} ${CROP.h}" overflow="visible">${spriteInner(cls, pose)}</svg>`
}

/** A largura do Clawd recortado numa altura. */
export const crabWidth = (h: number) => Math.round((h * CROP.w) / CROP.h)

/** O Clawd sozinho, recortado: o pet do chat, da faixa e das linhas do grupo. */
export const petArt = (cls: Cls, pose: Pose, h: number, tip: string): Art => doc(crabWidth(h), h, crabAt(cls, 0, 0, h, pose), tip, tip)

// ---------- títulos ----------

/** Título do quest log, leve: fio fino, losangos pequenos; `right` é um contador à direita. */
export const heroTitle = (w: number, label: string, p: Palette, mark?: '!' | '?', right?: string): Art => {
  const k = TONES[p]
  const h = 20
  const text = (mark ? `${mark}  ` : '') + label.toUpperCase()
  const tw = text.length * 7.4
  const rightW = right ? right.length * 6.4 + 10 : 0
  const cx = (w - rightW) / 2
  const l1 = Math.max(10, cx - tw / 2 - 12)
  const r1 = Math.min(w - rightW - 10, cx + tw / 2 + 12)
  const dia = (x: number) => `<rect x="${x - 2.5}" y="${h / 2 - 2.5}" width="5" height="5" fill="${k.gild}" opacity=".7" transform="rotate(45 ${x} ${h / 2})"/>`
  const inner =
    (l1 > 16 ? `<line x1="6" y1="${h / 2}" x2="${l1 - 6}" y2="${h / 2}" stroke="${k.line}"/>` : '') +
    dia(l1) +
    `<text x="${cx}" y="${h / 2 + 3.6}" text-anchor="middle" font-size="10.5" letter-spacing="2" font-weight="600" fill="${k.gild}">${esc(text)}</text>` +
    dia(r1) +
    (w - rightW - 6 > r1 + 12 ? `<line x1="${r1 + 6}" y1="${h / 2}" x2="${w - rightW - 6}" y2="${h / 2}" stroke="${k.line}"/>` : '') +
    (right ? `<text x="${w}" y="${h / 2 + 3.6}" text-anchor="end" font-size="10.5" fill="${k.muted}">${esc(right)}</text>` : '')
  return doc(w, h, inner, label)
}

// ---------- progresso do objetivo ----------

export type Step = { name: string; state: 'done' | 'now' | 'next' }

const pctOf = (steps: readonly Step[]) => {
  if (steps.length === 0) return 0
  const done = steps.filter(s => s.state === 'done').length
  return Math.round(((done + (steps.some(s => s.state === 'now') ? 0.5 : 0)) / steps.length) * 100)
}

export type StepWords = { step: (n: number, name: string, state: Step['state']) => string; steps: (done: number, total: number) => string; chapter: (n: number) => string }

/** A barra do objetivo: fina, de canto a canto, um losango por passo (ToxiUI). */
/** Losangos desenhados no máximo: os mais recentes. Contagem e % usam sempre todas as etapas. */
const MAX_MARKS = 12

export const objectiveBar = (w: number, steps: readonly Step[], chapter: number, p: Palette, words: StepWords): Art => {
  const k = TONES[p]
  const h = 36
  const done = steps.filter(s => s.state === 'done').length
  const pct = pctOf(steps)
  const pad = 5
  const inner0 = w - pad * 2
  let marks = ''
  // Só os últimos MAX_MARKS losangos, espaçados pela barra; o número no tooltip é o da etapa real.
  const skip = Math.max(0, steps.length - MAX_MARKS)
  const shown = steps.slice(skip)
  shown.forEach((s, i) => {
    const x = pad + (inner0 * (i + 1)) / shown.length
    const lit = s.state === 'done'
    marks += `<g><title>${esc(words.step(skip + i + 1, s.name, s.state))}</title><rect class="${s.state === 'now' ? 'breath' : ''}" x="${x - 3.5}" y="6.5" width="7" height="7" transform="rotate(45 ${x} 10)" fill="${lit || s.state === 'now' ? k.gild : k.hole}" stroke="${k.gild}" stroke-opacity="${lit ? 1 : 0.55}" stroke-width="1.2"/></g>`
  })
  const inner =
    `<defs><linearGradient id="gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8904a"/><stop offset="1" stop-color="#ecc985"/></linearGradient></defs>` +
    `<rect x="${pad}" y="8.5" width="${inner0}" height="3" rx="1.5" fill="${k.track}"/>` +
    `<rect x="${pad}" y="8.5" width="${(inner0 * pct) / 100}" height="3" rx="1.5" fill="url(#gl)"/>` +
    marks +
    `<text x="0" y="31" font-size="10.5" fill="${k.muted}"><tspan fill="${k.gild}" font-weight="700">${done}/${steps.length}</tspan> ${esc(words.steps(done, steps.length))} · ${esc(words.chapter(chapter))}</text>` +
    `<text x="${w}" y="31" text-anchor="end" font-size="10" fill="${k.dim}">${pct}%</text>`
  return doc(w, h, inner, `${done}/${steps.length}`)
}

// ---------- inventário ----------

// ---------- diário no chat ----------

/** Só o pet, de 36 px de altura: ele é o destaque da linha; na falha, a pose de falha. */
export const diaryPet = (cls: Cls, state: 'run' | 'ok' | 'err', tip: string): Art => petArt(cls, state === 'err' ? 'fail' : 'work', 44, tip)

/** O anel girando do diário, sem contorno: a ferramenta ainda em curso. */
export const spinRing = (color: string, tip: string): Art =>
  doc(
    14,
    14,
    `<circle cx="7" cy="7" r="5" fill="none" stroke="${color}" stroke-opacity=".3" stroke-width="1.6"/><path d="M7 2 A5 5 0 0 1 12 7" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 7 7" to="360 7 7" dur="1s" repeatCount="indefinite"/></path>`,
    tip,
    tip,
  )

export const statusColor = (state: 'run' | 'ok' | 'err', p: Palette) =>
  state === 'run' ? classColor('aprendiz', p) : state === 'err' ? TONES[p].bad : TONES[p].ok

// ---------- faixa compacta ----------

/** A trilha do plano em miniatura, para a faixa: um losango por passo. */
export const trailArt = (total: number, done: number, p: Palette, tip: string): Art => {
  const k = TONES[p]
  const shown = Math.min(total, MAX_MARKS)
  const lit = Math.max(0, done - (total - shown))
  const gap = 12
  const w = Math.max(24, (shown - 1) * gap + 10)
  let inner = `<line x1="5" y1="7" x2="${w - 5}" y2="7" stroke="${k.gild}" stroke-opacity=".3"/><line x1="5" y1="7" x2="${5 + Math.min(lit, shown - 1) * gap}" y2="7" stroke="${k.gild}"/>`
  for (let i = 0; i < shown; i++) {
    const x = 5 + i * gap
    const on = i < lit
    const cur = i === lit
    inner += `<rect x="${x - 3}" y="4" width="6" height="6" transform="rotate(45 ${x} 7)" fill="${on ? k.gild : 'none'}" ${on ? '' : `stroke="${k.gild}" stroke-opacity=".6"`} ${cur ? 'class="breath"' : ''}/>`
  }
  return doc(w, 14, inner, tip, tip)
}

/** Barra fina de recurso, entre dois `Text` nativos do rodapé. */
export const barArt = (w: number, pct: number, color: string, tip: string, alert = false, p: Palette = 'escuro'): Art => {
  const fill = Math.max(0, Math.min(100, pct)) / 100
  return doc(
    w,
    12,
    `<rect x="0" y="4" width="${w}" height="4" rx="2" fill="${TONES[p].track}"/><rect ${alert ? 'class="breath" ' : ''}x="0" y="4" width="${(w * fill).toFixed(1)}" height="4" rx="2" fill="${color}"/>`,
    tip,
    tip,
  )
}

// ---------- polimento: ícones, cabeçalhos, desfile, grimório e recursos ----------

const PARADE: Cls[] = ['mago', 'runico', 'bruxo', 'rei', 'aprendiz', 'engenheiro', 'sabio', 'cartomante', 'pintor']

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
  // .parade-hop, não .hop: os sprites têm uma classe .hop própria, que esconderia o desfile.
  let inner = '<style>.parade-hop{animation:phop 2.4s ease-in-out infinite}@keyframes phop{0%,100%{transform:none}50%{transform:translateY(-4px)}}</style>'
  const { lean, css } = sharedStyles()
  PARADE.forEach((cls, i) => {
    inner += `<g class="parade-hop" style="animation-delay:${(i * 0.18).toFixed(2)}s">${lean(crabAt(cls, x0 + i * size + 1, 6, Math.round(((size - 2) * 80) / 112)))}</g>`
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
  return doc(w, h, css() + inner, title)
}

/**
 * Cada sprite traz o próprio <style>, igual em todos; vários num Svg só passariam do
 * limite do motor (128 KB). `lean` tira o estilo de cada um e `css` devolve um de cada.
 */
const sharedStyles = () => {
  const styles = new Set<string>()
  const lean = (svg: string) =>
    svg.replace(/<style>([\s\S]*?)<\/style>/g, (_, rule: string) => {
      styles.add(rule)
      return ''
    })
  return { lean, css: () => `<style>${[...styles].join('')}</style>` }
}

/**
 * A galeria do Sobre: as 19 classes em grade, cada Clawd na pose de trabalho com o
 * nome embaixo; o tooltip de cada um diz o que ele faz. Em blocos de duas fileiras:
 * cada sprite tem uns 6 KB, e 19 num Svg só passariam do limite do motor (128 KB).
 */
export const classGallery = (w: number, classes: readonly Cls[], name: (cls: Cls) => string, role: (cls: Cls) => string, p: Palette): Art[] => {
  const per = 10
  const blocks: Art[] = []
  for (let i = 0; i < classes.length; i += per) blocks.push(galleryBlock(w, classes.slice(i, i + per), name, role, p))
  return blocks
}

const galleryBlock = (w: number, classes: readonly Cls[], name: (cls: Cls) => string, role: (cls: Cls) => string, p: Palette): Art => {
  const cols = 5
  const slot = Math.floor(w / cols)
  const h = Math.min(36, Math.round((slot - 8) / 1.4))
  const rowH = h + 22
  const { lean, css } = sharedStyles()
  let inner = ''
  classes.forEach((cls, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const cx = col * slot + slot / 2
    const y = row * rowH + 2
    inner +=
      `<g><title>${esc(`${name(cls)} · ${role(cls)}`)}</title><rect x="${col * slot}" y="${y - 2}" width="${slot}" height="${rowH}" fill="transparent"/>` +
      lean(crabAt(cls, cx - crabWidth(h) / 2, y, h)) +
      `<text x="${cx}" y="${y + h + 14}" text-anchor="middle" font-size="10.5" fill="${classColor(cls, p)}">${esc(name(cls))}</text></g>`
  })
  return doc(w, Math.ceil(classes.length / cols) * rowH, css() + inner, classes.map(name).join(', '))
}

// Ícones pequenos, desenhados (16 px), para cabeçalhos e listas.
const ICON: Record<string, (c: string) => string> = {
  geral: c => `<circle cx="8" cy="8" r="6" fill="none" stroke="${c}" stroke-width="1.4"/><path d="M2 8h12M8 2c2.5 2.6 2.5 9.4 0 12M8 2c-2.5 2.6-2.5 9.4 0 12" fill="none" stroke="${c}" stroke-width="1.1"/>`,
  modulos: c => `<rect x="2" y="2" width="5" height="5" rx="1" fill="${c}"/><rect x="9" y="2" width="5" height="5" rx="1" fill="${c}" opacity=".6"/><rect x="2" y="9" width="5" height="5" rx="1" fill="${c}" opacity=".6"/><rect x="9" y="9" width="5" height="5" rx="1" fill="${c}"/>`,
  painel: c => `<rect x="2" y="2" width="12" height="12" rx="2" fill="none" stroke="${c}" stroke-width="1.4"/><path d="M9 2v12" stroke="${c}" stroke-width="1.4"/><path d="M10.5 5h2M10.5 8h2M10.5 11h2" stroke="${c}"/>`,
  diario: c => `<path d="M3 2h8l2 2v10H3z" fill="none" stroke="${c}" stroke-width="1.4"/><path d="M5 6h6M5 9h6M5 12h4" stroke="${c}"/>`,
  protecao: c => `<path d="M8 1.5 13.5 4v4c0 3.2-2.4 5.6-5.5 6.5C4.9 13.6 2.5 11.2 2.5 8V4z" fill="${c}" fill-opacity=".2" stroke="${c}" stroke-width="1.4"/><path d="M5.5 8l2 2 3-3.5" fill="none" stroke="${c}" stroke-width="1.4"/>`,
  memoria: c => `<path d="M2 3.5C4.5 2.5 6.5 2.8 8 4c1.5-1.2 3.5-1.5 6-.5v9c-2.5-1-4.5-.7-6 .5-1.5-1.2-3.5-1.5-6-.5z" fill="${c}" fill-opacity=".2" stroke="${c}" stroke-width="1.3"/><path d="M8 4v9" stroke="${c}"/>`,
  objetivo: c => `<circle cx="8" cy="8" r="6" fill="none" stroke="${c}" stroke-width="1.3"/><circle cx="8" cy="8" r="3" fill="none" stroke="${c}" stroke-width="1.3"/><circle cx="8" cy="8" r="1" fill="${c}"/>`,
  grupo: c => `<path d="M3 13 13 3M3 3l10 10" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/><path d="M2 11.5 4.5 14M11.5 14 14 11.5" stroke="${c}" stroke-width="1.6"/>`,
  inventario: c => `<rect x="3" y="5" width="10" height="9" rx="2" fill="${c}" fill-opacity=".25" stroke="${c}" stroke-width="1.3"/><path d="M6 5V3.5h4V5" fill="none" stroke="${c}" stroke-width="1.3"/>`,
  grimorio: c => `<rect x="3" y="2" width="10" height="12" rx="1.5" fill="${c}" fill-opacity=".25" stroke="${c}" stroke-width="1.3"/><path d="M8 5l.9 1.8 2 .3-1.4 1.4.3 2L8 9.6 6.2 10.5l.3-2L5.1 7.1l2-.3z" fill="${c}"/>`,
  projeto: c => `<path d="M2 5h12v8H2z" fill="none" stroke="${c}" stroke-width="1.3"/><path d="M2 5l2-2.5h4L9 5" fill="none" stroke="${c}" stroke-width="1.3"/><path d="M6 9h4M8 7v4" stroke="${c}" stroke-width="1.3"/>`,
}

export type IconName = keyof typeof ICON

const iconSvg = (name: IconName, color: string, x = 0, y = 0) => `<g transform="translate(${x} ${y})">${ICON[name]?.(color) ?? ''}</g>`

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

export type ResRow = {
  key: 'mochila' | 'mana' | 'vigor'
  label: string
  /** 0 a 100: quanto a barra enche; undefined antes da primeira leitura. */
  value?: number
  color: string
  /** O número em destaque ("37%"). */
  text: string
  /** O resto da linha, em tom fraco ("Leve", "↻ 3h56", "recarregada"). */
  sub: string
  tip: string
  /** Recurso em alerta: a barra pulsa devagar. */
  pulse?: boolean
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

// ---------- proteção e "Sobre" ----------

const FILE_ICON = {
  env: (c: string) =>
    `<rect x="1" y="1" width="14" height="18" rx="2" fill="none" stroke="${c}" stroke-width="1.6"/><circle cx="6.5" cy="12" r="2.6" fill="none" stroke="${c}" stroke-width="1.6"/><line x1="9" y1="12" x2="13" y2="12" stroke="${c}" stroke-width="1.6"/><line x1="11.5" y1="12" x2="11.5" y2="14.5" stroke="${c}" stroke-width="1.6"/>`,
  pipeline: (c: string) =>
    `<circle cx="3.5" cy="4" r="2.5" fill="${c}"/><circle cx="12.5" cy="10" r="2.5" fill="${c}"/><circle cx="3.5" cy="16" r="2.5" fill="${c}"/><path d="M3.5 6.5 V13.5 M5.5 5 L10.5 9 M5.5 15 L10.5 11" stroke="${c}" stroke-width="1.4" fill="none"/>`,
  file: (c: string) =>
    `<path d="M2 1 H10 L14 5 V19 H2 Z" fill="none" stroke="${c}" stroke-width="1.6"/><path d="M10 1 V5 H14" fill="none" stroke="${c}" stroke-width="1.4"/>`,
}

export const fileKind = (name: string): keyof typeof FILE_ICON =>
  /pipelines?.*\.ya?ml$/i.test(name) ? 'pipeline' : /(^|[\\/])\.env/i.test(name) ? 'env' : 'file'

/** Um item do inventário: ícone na cor da raridade, com o nome e a raridade no tooltip. */
export const itemIcon = (name: string, rarity: Rarity, palette: Palette, tip: string): Art => {
  const c = rarityColor(rarity, palette)
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -1 20 22" width="18" height="20"><title>${esc(tip)}</title>` +
    `<rect x="-1" y="0" width="18" height="20" rx="3" fill="${c}" fill-opacity=".14"/>${FILE_ICON[fileKind(name)](c)}</svg>`
  return { source, width: 18, height: 20, alt: tip }
}

/** Ícones do "Sobre". Paths simples, desenhados aqui, sem copiar logotipo. */
export const linkIcon = (kind: 'linkedin' | 'github', palette: Palette, tip: string): Art => {
  const c = TONE[palette].text
  const glyph =
    kind === 'linkedin'
      ? `<rect x="1" y="1" width="18" height="18" rx="3.5" fill="none" stroke="${c}" stroke-width="1.6"/><rect x="5" y="8.5" width="2.4" height="7" fill="${c}"/><circle cx="6.2" cy="5.8" r="1.5" fill="${c}"/><path d="M10 15.5 V8.5 H12.3 V9.6 Q13.2 8.3 14.8 8.4 Q16.6 8.6 16.6 11 V15.5 H14.3 V11.6 Q14.3 10.3 13.3 10.3 Q12.3 10.3 12.3 11.6 V15.5 Z" fill="${c}"/>`
      : `<circle cx="10" cy="10" r="8.6" fill="none" stroke="${c}" stroke-width="1.6"/><path d="M7.4 17.6 V14.6 Q6.9 13.6 7.8 12.9 Q5.2 12.4 5.2 9.6 Q5.2 8.4 6 7.6 Q5.7 6.6 6.1 5.6 Q7.2 5.6 8.1 6.4 Q10 5.8 11.9 6.4 Q12.8 5.6 13.9 5.6 Q14.3 6.6 14 7.6 Q14.8 8.4 14.8 9.6 Q14.8 12.4 12.2 12.9 Q13.1 13.6 12.6 14.6 V17.6" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>`
  return {
    source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20"><title>${esc(tip)}</title>${glyph}</svg>`,
    width: 20,
    height: 20,
    alt: tip,
  }
}

// ---------- guarda ----------

/**
 * A cabeça do dragão vermelho da guarda, de perfil para a direita, a partir da
 * referência que o Saulo escolheu: amostrada em grade de 34×38, sem o céu, e
 * reduzida à paleta chapada dos Clawds. K contorno, M/r/R/L do vermelho escuro ao
 * claro, O/o papo, H/h chifre, E olho, T dente.
 */
const DRAGON = [
  '..................................',
  '.KK...........K...................',
  '.KHH..........HHH.................',
  '.KHH..........HHHK................',
  '.KHHK..........KHHKK..............',
  '.KHHHHH....HHH..KHHHHKK...........',
  '..KHHHHK....MMH..HHHHHH...........',
  '..KHHHHHKH..KMM..KKKHHHH..........',
  '...KHHHHhHHHKKMMMKKHHHHHHK........',
  '...KHHHHHHHHHKKMMKKKHHHHHK........',
  '....HHHHHHHhHHHKMMKKKKHHHHK.......',
  '.....KHHHHHHHhHrMMMKrrKKHHH.......',
  '.....KKHHHHHHMRRRMMKMRKKHHH.......',
  '....HMMHHHHHHMMrRrMMMRRMKHKK......',
  '...MMMMKKKHHKMMrrrRRMrRMrKrMH.....',
  '.KMMMKKKKKKKKKMMrRRRRMrrMRMRRK....',
  '.KKKMKMrMKKKMMMMMrRRRrrRMRrrRRK...',
  '...HKKKMrrrrMMMMMrrRRRrRRMRrrRRK..',
  '...HMKKKMMrMrMMKKKKMRRRRMRrRMRRK..',
  '..KMKMKKKKMMMMMMKMrrMRRRMRMrMrrK..',
  '.KMKMKKKKKKMMMrMMEEKHMMRMMMMMMK...',
  'HMKKMKKKKKMMMrrrMoEKKKKMrrrrMK....',
  'KKKMMKMKRRrMMMrrrMKKKKMMMrRRRrK...',
  'K.KMMKKMMrrrMMMMrrrMMMMrMMrRRRM.KH',
  '.KMMMKKKKKMMMMMMMrrrrrrrrrMMRRRKMr',
  '.MMMMMKKKKMMrrMMMMMMMrrrrrMRMRRRRr',
  '.MMMMMMKKKMrMrrMMMMMMMrrrrKMRMRRRM',
  '.MMMMMMKKMMMMrrRRMMMMMMrrrrKRMRRRK',
  'KKKMMMKKKMMMMrrRRRrrHKMMMrrrMMrRrM',
  'KKKMMMMKKKKKMrrrRRRRrrKMMMrrrrrRrM',
  'K.KMMKMKKKKKMMrrRRRRoorMOTrrrrrRrM',
  '..KMKMMMKMKKMMKMMrrRRooMOorrMMrrMH',
  '.HMMKMMMKMMKKKMMMKKKMRRRRooOLKrMK.',
  '.HMMMMMMMKMMMMMMMMMMKKRRRRLLORMK..',
  '.HMKMMMMMKMMMMMMMMMK..KKrrLOOOM...',
  '.HK.MMMMMMMMMrrrMMMM.....KROOoH...',
  '.H..MMKKMMMMrMMrrrrr......MLLK....',
  '....MMKKMMMMMrrMrrrrr.....MLK.....',
]
const DRAGON_INK: Record<string, string> = {
  K: '#1c1012',
  M: '#5c1814',
  r: '#8f2a16',
  R: '#c03c1a',
  L: '#e2602a',
  O: '#e8902e',
  o: '#b5642a',
  H: '#2f343f',
  h: '#6b717e',
  E: '#ffb020',
  T: '#f4efe2',
}

/** Onde a fumaça sai: a frente da boca, em células da grade. */
const MOUTH = [31, 31] as const

/**
 * A guarda dos protegidos: a cabeça do dragão vermelho, pequena (72×57, menor que o
 * baú da 0.5), com fumaça saindo da boca: baforadas que sobem, crescem e somem.
 * Desenhada em células (1 célula = 1,5 px); o olho pisca. Sem animação, a fumaça fica parada.
 */
export const dragonArt = (tip: string): Art => {
  const scale = 1.5
  let head = ''
  DRAGON.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]!
      let end = x
      while (end + 1 < row.length && row[end + 1] === ch) end++
      const fill = DRAGON_INK[ch]
      if (fill !== undefined) head += `<rect x="${x}" y="${y}" width="${end - x + 1}" height="1" fill="${fill}"${ch === 'E' ? ' class="dg-eye"' : ''}/>`
      x = end + 1
    }
  })
  const [mx, my] = MOUTH
  // Cada baforada é um tufo de pixels cinza; três em sequência, com atraso.
  const puff = (d: number, dy: number) =>
    `<g class="dg-smoke" style="--dy:${dy}px;animation-delay:${d}s">` +
    `<rect x="${mx + 1}" y="${my - 2}" width="3" height="1" fill="#b3ada4"/><rect x="${mx}" y="${my - 1}" width="5" height="1" fill="#9a948b"/>` +
    `<rect x="${mx}" y="${my}" width="5" height="1" fill="#8a847c"/><rect x="${mx + 1}" y="${my + 1}" width="3" height="1" fill="#9a948b"/></g>`
  const smoke = puff(0, -5) + puff(0.7, -7) + puff(1.4, -4)
  const gw = DRAGON[0]!.length + 14
  const gh = DRAGON.length
  const css =
    '<style>' +
    '.dg-smoke{transform-box:fill-box;transform-origin:center;opacity:0;animation:dgs 2.1s ease-out infinite}' +
    '@keyframes dgs{0%{opacity:.9;transform:none}100%{opacity:0;transform:translate(11px,var(--dy)) scale(2.2)}}' +
    '.dg-eye{animation:dge 4.4s infinite}@keyframes dge{0%,94%,100%{opacity:1}96%{opacity:.2}}' +
    '@media (prefers-reduced-motion:reduce){.dg-smoke{animation:none;opacity:.6}.dg-eye{animation:none}}' +
    '</style>'
  const w = Math.round(gw * scale)
  const h = Math.round(gh * scale)
  return {
    source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gw} ${gh}" width="${w}" height="${h}" shape-rendering="crispEdges"><title>${esc(tip)}</title>${css}${head}${smoke}</svg>`,
    width: w,
    height: h,
    alt: tip,
  }
}

// ---------- grimório ----------

/** As estrelinhas que piscam ao lado do Selar no grimório. */
export const sparkleArt = (p: Palette): Art => {
  const g = TONES[p].gild
  return doc(
    26,
    20,
    `<text class="glow" x="2" y="14" font-size="11" fill="${g}">✦</text><text class="glow" style="animation-delay:.8s" x="13" y="9" font-size="8" fill="${g}">✧</text><text class="glow" style="animation-delay:1.5s" x="16" y="18" font-size="7" fill="${g}">✦</text>`,
    '✦',
  )
}
