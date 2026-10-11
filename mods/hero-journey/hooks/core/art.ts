// A arte da HUD, num arquivo só: as cores das classes e das raridades, o Clawd
// das 9 classes, os títulos do quest log, a barra do objetivo, as quests, os
// cartões do grupo, o inventário, a linha do diário, a faixa, os recursos do
// rodapé, os ícones do ⚙ e do "Sobre" e o Guardião do Cofre. Tudo é texto de SVG
// sem script: a animação vem de CSS e de SMIL, que o `Svg` interativo do desktop
// toca; o `svg()` de core/ui põe o color-scheme.

import type { Cls, Palette, Rarity } from '../../types'

const COLORS: Record<Palette, Record<Cls, string>> = {
  escuro: {
    druida: '#f0a272',
    mago: '#6cc3ec',
    ilusionista: '#b49cf0',
    artifice: '#e9b75c',
    paladino: '#f08fb8',
    patrulheiro: '#5fc7b5',
    anao: '#d8a65a',
    arauto: '#ee7a8e',
    alquimista: '#a8d07a',
  },
  claro: {
    druida: '#a84e1a',
    mago: '#136b98',
    ilusionista: '#6845bd',
    artifice: '#855a06',
    paladino: '#a83b6c',
    patrulheiro: '#147a69',
    anao: '#7a5714',
    arauto: '#b0324c',
    alquimista: '#427a17',
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

export const esc = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** O que um `Svg` do desktop recebe. */
export type Art = { source: string; width: number; height: number; alt: string }

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

const KEYFRAMES = [
  '.eye{animation:blink 4.4s infinite}@keyframes blink{0%,94%,100%{opacity:1}96%{opacity:0}}',
  '.mag{animation:mag 2.6s ease-in-out infinite}@keyframes mag{50%{transform:translateY(9px)}}',
  '.gearr{transform-box:fill-box;transform-origin:center;animation:gr 4s linear infinite}@keyframes gr{to{transform:rotate(360deg)}}',
  '.bub{animation:bub 2.2s ease-in infinite;opacity:0}@keyframes bub{0%{opacity:0;transform:none}25%{opacity:1}100%{opacity:0;transform:translateY(-14px)}}',
  '.glow{animation:glow 2.6s ease-in-out infinite}@keyframes glow{50%{opacity:.35}}',
  '.bobs{animation:bob 2.2s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-2px)}}',
  '.breath{animation:breath 2.4s ease-in-out infinite}@keyframes breath{50%{opacity:.45}}',
  '.sweep{transform-box:view-box;transform-origin:82px 56px;animation:sweep 3.2s ease-in-out infinite}@keyframes sweep{50%{transform:rotate(-7deg)}}',
  '.pick{transform-box:view-box;transform-origin:96px 66px;animation:pick 1.6s ease-in-out infinite}@keyframes pick{0%,100%{transform:rotate(-28deg)}45%{transform:rotate(22deg)}}',
  '.stamp{animation:stamp 2.6s ease-in-out infinite}@keyframes stamp{0%,30%,80%,100%{transform:translateY(-8px)}45%,60%{transform:none}}',
  '.brush{transform-box:view-box;transform-origin:100px 62px;animation:brush 1.6s ease-in-out infinite}@keyframes brush{50%{transform:rotate(-14deg)}}',
  '.lid{transform-box:fill-box;transform-origin:center bottom;animation:lid 1.8s ease-in-out infinite}@keyframes lid{0%,60%,100%{transform:none}75%{transform:rotate(-10deg) translateY(-3px)}}',
  '@media (prefers-reduced-motion:reduce){*{animation:none!important}}',
].join('')

export const doc = (w: number, h: number, inner: string, alt: string, tip?: string): Art => ({
  source:
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    `<style>text{font-family:'Segoe UI',system-ui,sans-serif}${KEYFRAMES}</style>` +
    (tip ? `<title>${esc(tip)}</title>` : '') +
    inner +
    '</svg>',
  width: w,
  height: h,
  alt,
})

// ---------- Clawd ----------

const BODY = ['..OOOOOOOOOO..', '..OOEOOOOEOO..', 'OOOOOOOOOOOOOO', '..OOOOOOOOOO..', '..OOOOOOOOOO..', '..O.O....O.O..']

const body = () => {
  let out = ''
  BODY.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return
      const X = 30 + x * 5
      const Y = 50 + y * 5
      out += `<rect x="${X}" y="${Y}" width="5.2" height="5.2" rx=".8" fill="#d97757"/>`
      if (ch === 'E') out += `<rect class="eye" x="${X}" y="${Y}" width="5" height="5" rx="1.1" fill="#1a1a1a"/>`
    }),
  )
  return `${out}<rect x="41" y="51" width="22" height="2.2" rx="1.1" fill="#fff" opacity=".22"/>`
}

const hat = (cls: Cls, p: Palette) => {
  const c = classColor(cls, p)
  switch (cls) {
    case 'mago':
      return `<polygon points="47,50 83,50 70,14" fill="${c}"/><ellipse cx="65" cy="50" rx="22" ry="4" fill="${c}"/><text x="62" y="40" font-size="10" fill="#f2c14e">✦</text>`
    case 'ilusionista':
      return `<ellipse cx="65" cy="49" rx="24" ry="6" fill="${c}"/><rect x="63" y="40" width="4" height="5" fill="${c}"/>`
    case 'artifice': {
      const lens = classColor('patrulheiro', p)
      return `<rect x="40" y="46" width="50" height="3" fill="#8a6a45"/><rect x="47" y="41" width="13" height="9" rx="2" fill="${lens}" stroke="#3b3b45" stroke-width="2"/><rect x="70" y="41" width="13" height="9" rx="2" fill="${lens}" stroke="#3b3b45" stroke-width="2"/>`
    }
    case 'paladino':
      return '<rect x="45" y="51" width="15" height="13" rx="2" fill="#fff" fill-opacity=".3" stroke="#1a1a1a" stroke-width="3"/><rect x="70" y="51" width="15" height="13" rx="2" fill="#fff" fill-opacity=".3" stroke="#1a1a1a" stroke-width="3"/><line x1="60" y1="56" x2="70" y2="56" stroke="#1a1a1a" stroke-width="3"/>'
    case 'patrulheiro':
      return `<path d="M38 52 L65 30 L92 52 Z" fill="${c}"/><path d="M50 52 L65 40 L80 52 Z" fill="#fff" opacity=".25"/>`
    case 'anao':
      return `<path d="M42 52 Q65 30 88 52 Z" fill="${c}"/><rect x="40" y="50" width="50" height="4" fill="#8a6a45"/><circle cx="65" cy="42" r="4" fill="#ffe08a"/>`
    case 'arauto':
      return `<polygon points="52,50 58,40 65,47 72,40 78,50" fill="${c}"/>`
    case 'alquimista':
      return `<rect x="40" y="46" width="50" height="3" fill="#3b3b45"/><circle cx="54" cy="46" r="5" fill="${c}" stroke="#3b3b45" stroke-width="2"/><circle cx="76" cy="46" r="5" fill="${c}" stroke="#3b3b45" stroke-width="2"/>`
    case 'druida':
      return `<text class="glow" x="31" y="32" font-size="11" fill="#f2c14e">✦</text><text class="glow" style="animation-delay:1.3s" x="92" y="28" font-size="9" fill="${classColor('ilusionista', p)}">✧</text>`
  }
}

const prop = (cls: Cls) => {
  switch (cls) {
    case 'patrulheiro':
      return '<g class="sweep"><rect x="80" y="51" width="24" height="6" rx="1" fill="#e0af68" transform="rotate(-8 80 54)"/><rect x="100" y="47" width="6" height="9" rx="1" fill="#8a6a45" transform="rotate(-8 103 52)"/></g>'
    case 'paladino':
      return '<g class="mag"><circle cx="17" cy="52" r="7" fill="#7dcfff" fill-opacity=".25" stroke="#e86fa3" stroke-width="2.5"/><line x1="22" y1="57" x2="28" y2="63" stroke="#e86fa3" stroke-width="3"/></g>'
    case 'artifice':
      return `<g class="gearr"><circle cx="16" cy="44" r="7" fill="#e9b75c"/><circle cx="16" cy="44" r="3" fill="#3b3b45"/>${[0, 45, 90, 135]
        .map(a => `<rect x="14.5" y="35" width="3" height="18" fill="#e9b75c" transform="rotate(${a} 16 44)"/>`)
        .join('')}</g>`
    case 'anao':
      return '<g class="pick"><line x1="96" y1="66" x2="110" y2="50" stroke="#8a6a45" stroke-width="3"/><path d="M102 44 Q112 46 118 56" stroke="#9aa0b5" stroke-width="3" fill="none"/></g>'
    case 'arauto':
      return '<g class="stamp"><rect x="104" y="48" width="10" height="11" fill="#8a6a45"/><rect x="102" y="59" width="14" height="5" fill="#d0473b"/></g>'
    case 'mago':
      return '<rect x="53" y="68" width="12" height="9" fill="#e0def4"/><rect x="65" y="68" width="12" height="9" fill="#c0caf5"/>'
    case 'ilusionista':
      return '<g class="brush"><line x1="100" y1="62" x2="110" y2="44" stroke="#e0af68" stroke-width="2.5"/><circle cx="110" cy="44" r="2.5" fill="#ff9ecd"/></g>'
    case 'alquimista':
      return `${[0, 0.7, 1.4]
        .map(d => `<circle class="bub" style="animation-delay:${d}s" cx="${104 + d * 6}" cy="58" r="2.4" fill="#c3e88d"/>`)
        .join('')}<path d="M98 66 L112 66 L115 80 L95 80 Z" fill="#c3e88d" fill-opacity=".6" stroke="#8a8a80"/>`
    case 'druida':
      return ''
  }
}

export const crabAt = (cls: Cls, p: Palette, x: number, y: number, w: number, withProp: boolean) => {
  const vb = withProp ? '0 10 130 76' : '28 12 76 74'
  const h = withProp ? (w * 76) / 130 : (w * 74) / 76
  return `<svg x="${x}" y="${y}" width="${w}" height="${h.toFixed(1)}" viewBox="${vb}"><g class="bobs">${body()}${hat(cls, p)}</g>${withProp ? prop(cls) : ''}</svg>`
}

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

// ---------- quests ----------

export type QuestArt = { name: string; icon: string; sub: string; cls?: Cls }

const iconBox = (x: number, y: number, s: number, glyph: string, color: string, lit: boolean) =>
  `<rect x="${x + 0.5}" y="${y + 0.5}" width="${s - 1}" height="${s - 1}" rx="4" fill="${lit ? color : 'none'}" fill-opacity="${lit ? 0.16 : 0}" stroke="${color}" stroke-opacity="${lit ? 0.75 : 0.35}"/>` +
  `<text x="${x + s / 2}" y="${y + s / 2 + 4.2}" text-anchor="middle" font-size="${s * 0.5}" fill="${color}" fill-opacity="${lit ? 1 : 0.55}">${esc(glyph)}</text>`

/** Ícone de uma quest pelo que ela faz: teste, deploy, banco, PR, tela, pesquisa ou código. */
const ROTATION = ['⚙', '⌕', '✎', '◈', '✦', '⚑', '◆']

/** O ícone de uma quest; sem pista no título, varia pela posição para a fileira não sair toda ⚙. */
export const questIconAt = (title: string, i: number) => {
  const found = questIcon(title)
  return found === '⚙' ? (ROTATION[i % ROTATION.length] ?? '⚙') : found
}

const questIcon = (title: string) =>
  /test|lint|qa|valid|verific/i.test(title)
    ? '✓'
    : /deploy|pipeline|publica|build/i.test(title)
      ? '⚑'
      : /banco|sql|migra|database/i.test(title)
        ? '⛁'
        : /\bpr\b|merge|commit|release/i.test(title)
          ? '✉'
          : /tela|ui\b|layout|design|protót|prototyp/i.test(title)
            ? '✎'
            : /pesquis|ler\b|lê|investig|research|read|entend/i.test(title)
              ? '⌕'
              : '⚙'

export const questsArt = (w: number, done: readonly QuestArt[], now: QuestArt | undefined, next: readonly QuestArt[], fog: string, p: Palette, doneLabel: string): Art => {
  const k = TONES[p]
  let y = 0
  let inner = ''
  const shown = done.slice(-10)
  shown.forEach((q, i) => {
    inner += `<g><title>${esc(q.name)}</title>${iconBox(i * 24, y, 20, q.icon, k.gild, true)}</g>`
  })
  if (shown.length) inner += `<text x="${shown.length * 24 + 4}" y="${y + 14}" font-size="10.5" fill="${k.dim}">${esc(doneLabel)}</text>`
  y += shown.length ? 28 : 0
  if (now) {
    const c = now.cls ? classColor(now.cls, p) : k.gild
    inner +=
      `<g><title>${esc(now.name)}</title><rect x=".5" y="${y + 0.5}" width="${w - 1}" height="42" rx="6" fill="${k.gild}" fill-opacity=".06" stroke="${k.line}"/>` +
      `<text x="11" y="${y + 27}" font-size="16" font-weight="800" fill="${k.warn}">!</text>` +
      iconBox(24, y + 9, 24, now.icon, c, true) +
      `<text x="58" y="${y + 19}" font-size="12.5" font-weight="700" fill="${k.text}">${esc(fit(now.name, w - 66, 12.5))}</text>` +
      `<text x="58" y="${y + 34}" font-size="10.5" fill="${k.muted}">${esc(fit(now.sub, w - 66, 10.5))}</text></g>`
    y += 48
  }
  next.forEach(q => {
    inner += `<g><title>${esc(q.name)}</title>${iconBox(24, y + 1, 20, q.icon, k.muted, false)}<text x="54" y="${y + 15}" font-size="11.5" fill="${k.muted}">${esc(fit(q.name, w - 60, 11.5))}</text></g>`
    y += 24
  })
  if (fog) {
    inner += `<text x="54" y="${y + 12}" font-size="10.5" fill="${k.dim}" font-style="italic">${esc(fog)}</text>`
    y += 18
  }
  return doc(w, Math.max(y, 1), inner, now ? now.name : doneLabel)
}

// ---------- grupo ----------

/** `idle`: o Clawd parado, cochilando no acampamento (sem barra cheia, que diria "concluído"). */
export type MemberArt = { name: string; cls: Cls; sub: string; status: string; busy: boolean; failed?: boolean; idle?: boolean }

export const memberArt = (w: number, m: MemberArt, p: Palette): Art => {
  const k = TONES[p]
  const c = classColor(m.cls, p)
  const bar = w - 66
  const inner =
    `<rect x=".5" y="4.5" width="54" height="54" rx="7" fill="${c}" fill-opacity=".06" stroke="${c}" stroke-opacity=".45"/>` +
    crabAt(m.cls, p, 3, 14, 49, true) +
    `<text x="66" y="21" font-size="12.5" font-weight="700" fill="${c}">${esc(fit(m.name, bar - 70, 12.5))}</text>` +
    `<text x="${w}" y="21" text-anchor="end" font-size="10.5" fill="${k.muted}">${esc(m.status)}</text>` +
    `<text x="66" y="37" font-size="11" fill="${k.muted}">${esc(fit(m.sub, bar, 11))}</text>` +
    `<rect x="66" y="47" width="${bar}" height="3" rx="1.5" fill="${k.track}"/>` +
    (m.idle
      ? `<text class="glow" x="46" y="16" font-size="10" fill="${k.muted}">z</text>`
      : m.busy
      ? `<rect class="breath" x="66" y="47" width="${bar * 0.62}" height="3" rx="1.5" fill="${c}"/>`
      : `<rect x="66" y="47" width="${bar}" height="3" rx="1.5" fill="${m.failed ? k.bad : k.ok}" fill-opacity=".7"/>`)
  return doc(w, 62, inner, `${m.name}: ${m.sub}`, `${m.name} · ${m.status} — ${m.sub}`)
}

export const doneMembersArt = (w: number, ms: readonly MemberArt[], hint: string, p: Palette): Art => {
  const k = TONES[p]
  const shown = ms.slice(-8)
  let inner = ''
  shown.forEach((m, i) => {
    const c = classColor(m.cls, p)
    inner += `<g><title>${esc(`${m.failed ? '✗' : '✓'} ${m.name} — ${m.sub}`)}</title><rect x="${i * 34 + 0.5}" y=".5" width="29" height="29" rx="5" fill="${c}" fill-opacity=".06" stroke="${c}" stroke-opacity=".4"/>${crabAt(m.cls, p, i * 34 + 2, 4, 26, false)}</g>`
  })
  inner += `<text x="${shown.length * 34 + 6}" y="19" font-size="10.5" fill="${k.dim}">${esc(hint)}</text>`
  return doc(w, 30, inner, hint)
}

// ---------- inventário ----------

type ItemArt = { name: string; rarity: Rarity; glyph: string; diff: string; tip: string }

export const itemsArt = (w: number, list: readonly ItemArt[], p: Palette): Art => {
  const k = TONES[p]
  let inner = ''
  list.forEach((it, i) => {
    const y = i * 24
    const c = RAR[p][it.rarity]
    const struck = it.rarity === 'pobre'
    inner +=
      `<g><title>${esc(it.tip)}</title>` +
      `<rect x=".5" y="${y + 2.5}" width="19" height="19" rx="4" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-opacity=".55"/>` +
      `<text x="10" y="${y + 16}" text-anchor="middle" font-size="${it.glyph.length > 2 ? 7.5 : 9}" font-weight="700" fill="${c}">${esc(it.glyph)}</text>` +
      `<text x="28" y="${y + 16}" font-size="11.5" fill="${c}"${struck ? ' text-decoration="line-through" fill-opacity=".7"' : ''}>${esc(fit(it.name, w - 100, 11.5))}</text>` +
      `<text x="${w}" y="${y + 16}" text-anchor="end" font-size="10.5" fill="${it.diff.startsWith('+') ? k.ok : k.dim}">${esc(it.diff)}</text></g>`
  })
  return doc(w, Math.max(list.length * 24, 1), inner, list.map(i => i.name).join(', '))
}

export const glyphOf = (file: string) => {
  const base = file.split(/[\\/]/).pop() ?? file
  if (/^\.env/i.test(base)) return 'ENV'
  const ext = base.includes('.') ? (base.split('.').pop() ?? '') : ''
  return ext.slice(0, 3).toUpperCase() || '·'
}

// ---------- diário no chat ----------

/** O pet de 28 px e o trilho na cor da classe, com a bolinha no meio. */
export const diaryPet = (cls: Cls, state: 'run' | 'ok' | 'err', tip: string, p: Palette): Art => {
  const k = TONES[p]
  const c = classColor(cls, p)
  const dot = state === 'err' ? k.bad : c
  const inner =
    crabAt(cls, p, 0, 3, 28, false) +
    `<line x1="35" y1="0" x2="35" y2="34" stroke="${c}" stroke-opacity=".4" stroke-width="1.5"/>` +
    (state === 'run'
      ? `<circle cx="35" cy="17" r="3.5" fill="${dot}"><animate attributeName="r" values="3;4.5;3" dur="1.4s" repeatCount="indefinite"/></circle>`
      : `<circle cx="35" cy="17" r="3.2" fill="${k.hole}" stroke="${dot}" stroke-width="1.5"/>`)
  return doc(40, 34, inner, tip, tip)
}

export const statusColor = (state: 'run' | 'ok' | 'err', p: Palette) =>
  state === 'run' ? classColor('druida', p) : state === 'err' ? TONES[p].bad : TONES[p].ok

// ---------- faixa compacta ----------

type BandNow = { cls: Cls; name: string; text: string; file?: string; rarity?: Rarity } | null

/**
 * A faixa: o pet (com o acessório enquanto trabalha), o item na mão (o arquivo,
 * na cor da raridade), a ação curta e o objetivo em miniatura à direita.
 * `reserve`: px livres no canto direito para o botão ◈.
 */
export const bandArt = (
  w: number,
  now: BandNow,
  idleText: string,
  goal: { label: string; current: string; tip: string; steps: readonly Step[] } | null,
  p: Palette,
  reserve = 26,
  idleTip?: string,
): Art => {
  const k = TONES[p]
  const h = 34
  let inner = ''
  // Parado sem ninguém em expedição, o Clawd cochila; com agentes de fundo, fica acordado.
  if (now) inner += crabAt(now.cls, p, 0, 3, 50, true)
  else if (idleTip) inner += `${crabAt('druida', p, 8, 4, 30, false)}<text class="glow" x="38" y="12" font-size="10" fill="${k.warn}">⚑</text>`
  else inner += `${crabAt('druida', p, 8, 4, 30, false)}<text class="glow" x="38" y="11" font-size="9" fill="${k.muted}">z</text>`
  let x = 56
  if (now?.file && now.rarity) {
    const c = RAR[p][now.rarity]
    const g = glyphOf(now.file)
    inner += `<g><title>${esc(now.file)}</title><rect x="${x + 0.5}" y="9.5" width="17" height="17" rx="4" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-opacity=".6"/><text x="${x + 9}" y="21.5" text-anchor="middle" font-size="${g.length > 2 ? 6.5 : 7.5}" font-weight="700" fill="${c}">${esc(g)}</text></g>`
    x += 24
  }
  let right = w - reserve
  if (goal) {
    const bw = Math.min(180, Math.round(w * 0.34))
    const x0 = w - bw - 4 - reserve
    right = x0
    inner += `<g><title>${esc(goal.tip)}</title><rect x="${x0 - 6}" y="2" width="${bw + 10}" height="30" fill="transparent"/>`
    inner += `<text x="${x0}" y="13" font-size="10" fill="${k.muted}"><tspan fill="${k.gild}" font-weight="700">${esc(goal.label)}</tspan>${goal.current ? ` · ${esc(fit(goal.current, bw - 34, 10))}` : ''}</text>`
    const steps = goal.steps
    if (steps.length > 0) {
      const pct = pctOf(steps)
      const marks = steps.slice(-MAX_MARKS)
      inner += `<rect x="${x0}" y="23" width="${bw}" height="2.5" rx="1.25" fill="${k.track}"/><rect x="${x0}" y="23" width="${(bw * pct) / 100}" height="2.5" rx="1.25" fill="${k.gild}"/>`
      marks.forEach((s, i) => {
        const sx = x0 + (bw * (i + 1)) / marks.length - 2.5
        const lit = s.state !== 'next'
        inner += `<rect class="${s.state === 'now' ? 'breath' : ''}" x="${sx - 2.5}" y="21.75" width="5" height="5" transform="rotate(45 ${sx} 24.25)" fill="${lit ? k.gild : k.hole}" stroke="${k.gild}" stroke-opacity="${lit ? 1 : 0.5}"/>`
      })
    }
    inner += '</g>'
  }
  const room = right - x - 14
  inner += now
    ? `<text x="${x}" y="22" font-size="12"><tspan font-weight="700" fill="${classColor(now.cls, p)}">${esc(now.name)}</tspan><tspan fill="${k.muted}"> · ${esc(fit(now.text, room - now.name.length * 7, 12))}</tspan></text>`
    : `<g>${idleTip ? `<title>${esc(idleTip)}</title><rect x="${x}" y="8" width="${Math.max(0, room)}" height="20" fill="transparent"/>` : ''}<text x="${x}" y="22" font-size="12" fill="${idleTip ? k.warn : k.dim}">${esc(fit(idleText, room, 12))}</text></g>`
  return doc(w, h, inner, now ? `${now.name} · ${now.text}` : idleText)
}

/**
 * O selo do diário: o contorno de pílula, fino e sem fundo, com o símbolo
 * (✓, ✗ ou o anel girando) e o texto curto ao lado ("novo", "+12 −3", "3/3").
 */
export const pillOutline = (state: 'run' | 'ok' | 'err', text: string, p: Palette): Art => {
  const k = TONES[p]
  const c = state === 'run' ? classColor('druida', p) : state === 'err' ? k.bad : k.ok
  const tw = text === '' ? 0 : text.length * 6.2 + 6
  const w = Math.round(30 + tw)
  const sym =
    state === 'run'
      ? `<circle cx="14" cy="12" r="4.5" fill="none" stroke="${c}" stroke-opacity=".3" stroke-width="1.5"/><path d="M14 7.5 A4.5 4.5 0 0 1 18.5 12" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 14 12" to="360 14 12" dur="1s" repeatCount="indefinite"/></path>`
      : `<text x="14" y="16" text-anchor="middle" font-size="11.5" font-weight="700" fill="${c}">${state === 'err' ? '✗' : '✓'}</text>`
  const inner =
    `<rect x=".75" y="2.75" width="${w - 1.5}" height="18.5" rx="9.25" fill="none" stroke="${c}" stroke-opacity=".55" stroke-width="1.2"/>` +
    sym +
    (text === '' ? '' : `<text x="24" y="16" font-size="10.5" fill="${c}">${esc(text)}</text>`)
  return doc(w, 24, inner, text || (state === 'err' ? '✗' : '✓'), text || undefined)
}

// ---------- polimento: ícones, cabeçalhos, desfile, grimório e recursos ----------

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

const RES_ICON = {
  mochila: `<rect x="3" y="5" width="10" height="9" rx="2" fill="#a8794a"/><rect x="5" y="2.5" width="6" height="4" rx="1.5" fill="none" stroke="#a8794a" stroke-width="1.4"/><rect x="5" y="9" width="6" height="3" rx="1" fill="#6e4f2f"/>`,
  mana: `<path d="M8 1.5C4.5 6.5 3.5 8.5 3.5 10a4.5 4.5 0 0 0 9 0c0-1.5-1-3.5-4.5-8.5z" fill="#6cb6ec"/>`,
  vigor: `<path d="M8 14 2.5 8.4a3.2 3.2 0 0 1 5.5-3.4 3.2 3.2 0 0 1 5.5 3.4z" fill="#8fc46a"/>`,
}

/**
 * Os recursos do rodapé, um por linha: ícone, nome, a barra que estica, o número
 * e o resto (estado ou reset) à direita. Cada coisa tem a sua coluna: nada se
 * sobrepõe, em qualquer largura. O detalhe (o que tem na mochila, o ritmo) fica
 * no tooltip da linha.
 */
export const resourceRows = (w: number, rs: readonly ResRow[], p: Palette): Art => {
  const k = toneOf(p)
  const rowH = 18
  const labelW = 58
  // A coluna da direita: o número (até "100%") e o resto, em fonte menor.
  const subW = Math.min(84, Math.max(52, ...rs.map(r => r.sub.length * 5.6)))
  const numW = 34
  const bx = 20 + labelW
  const bw = Math.max(24, w - bx - numW - subW - 10)
  let inner = ''
  rs.forEach((r, i) => {
    const y = i * rowH
    const fill = r.value === undefined ? 0 : (bw * Math.min(100, Math.max(0, r.value))) / 100
    inner +=
      `<g><title>${esc(r.tip)}</title><rect x="0" y="${y}" width="${w}" height="${rowH}" fill="transparent"/>` +
      `<g transform="translate(0 ${y + 0.5})">${RES_ICON[r.key]}</g>` +
      `<text x="20" y="${y + 12.5}" font-size="10.5" fill="${k.muted}">${esc(r.label)}</text>` +
      `<rect x="${bx}" y="${y + 7}" width="${bw}" height="4" rx="2" fill="${k.track}"/>` +
      (fill > 0 ? `<rect${r.pulse ? ' class="breath"' : ''} x="${bx}" y="${y + 7}" width="${fill}" height="4" rx="2" fill="${r.color}"/>` : '') +
      `<text x="${bx + bw + 6 + numW}" y="${y + 12.5}" text-anchor="end" font-size="10.5" font-weight="700" fill="${r.pulse ? r.color : k.text}">${esc(r.text)}</text>` +
      (r.sub ? `<text x="${w}" y="${y + 12.5}" text-anchor="end" font-size="10" fill="${k.dim}">${esc(r.sub)}</text>` : '') +
      '</g>'
  })
  return doc(w, rs.length * rowH, inner, rs.map(r => `${r.label} ${r.text}`).join(', '))
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

/** O Guardião do Cofre: um baú mímico em pixel art, com a tampa que range e os olhos que piscam. */
export const mimic = (palette: Palette, tip: string, width = 96): Art => {
  const wood = palette === 'escuro' ? '#8a5a2b' : '#7a4a1f'
  const band = '#d9b26a'
  const height = Math.round((width * 70) / 96)
  const teeth = [0, 1, 2, 3, 4, 5].map(i => `<path d="M${22 + i * 9} 38 l4.5 7 l4.5 -7 Z" fill="#f4efe2"/>`).join('')
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 70" width="${width}" height="${height}"><title>${esc(tip)}</title><style>${KEYFRAMES}</style>` +
    `<rect x="14" y="38" width="68" height="28" rx="3" fill="${wood}"/><rect x="14" y="48" width="68" height="4" fill="${band}"/>` +
    `<rect x="44" y="44" width="8" height="12" rx="1.5" fill="${band}"/><rect x="46.5" y="48" width="3" height="4" fill="#3b2a14"/>` +
    `<rect x="18" y="38" width="60" height="8" fill="#5a1d1d"/>${teeth}` +
    `<g class="lid"><path d="M12 38 Q48 6 84 38 Z" fill="${wood}"/><path d="M12 38 Q48 6 84 38" fill="none" stroke="${band}" stroke-width="3"/>` +
    `<rect class="eye" x="34" y="24" width="7" height="6" rx="1.5" fill="#f2c14e"/><rect class="eye" x="55" y="24" width="7" height="6" rx="1.5" fill="#f2c14e"/>` +
    `<rect x="36.5" y="25.5" width="2.5" height="3" fill="#1a1a1a"/><rect x="57.5" y="25.5" width="2.5" height="3" fill="#1a1a1a"/></g></svg>`
  return { source, width, height, alt: tip }
}

/** A linha acima do diálogo de proteção: ícone, nome e +/− de cada arquivo, com tooltip. */
export const guardLine = (files: readonly { name: string; added: number; removed: number }[], palette: Palette, tip: (name: string) => string): Art => {
  const t = TONE[palette]
  const legendary = rarityColor('lendario', palette)
  let x = 0
  let out = ''
  for (const file of files) {
    const delta = `<tspan fill="${t.ok}">+${file.added}</tspan>${file.removed > 0 ? ` <tspan fill="${t.bad}">−${file.removed}</tspan>` : ''}`
    const chars = file.name.length + 2 + String(file.added).length + (file.removed > 0 ? String(file.removed).length + 3 : 0)
    out +=
      `<g transform="translate(${x} 3)"><title>${esc(tip(file.name))}</title><g>${FILE_ICON[fileKind(file.name)](legendary)}</g>` +
      `<text x="22" y="14" font-family="system-ui,sans-serif" font-size="12.5" fill="${t.text}">${esc(file.name)} ${delta}</text></g>`
    x += 26 + chars * 7.2 + 14
  }
  const width = Math.max(1, Math.ceil(x))
  return {
    source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 24" width="${width}" height="24">${out}</svg>`,
    width,
    height: 24,
    alt: files.map(f => `${f.name} +${f.added}${f.removed > 0 ? ` −${f.removed}` : ''}`).join(' · '),
  }
}
