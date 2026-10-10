// Arte do desenho decidido no laboratório (2026-10-09): títulos com fio fino,
// barra fina com losangos, quests, cartões do grupo, inventário, recursos, a
// linha do diário (pet de 28 px, símbolo sem pílula) e a faixa compacta.
// Tudo é texto de SVG sem script; o `svg()` de core/ui põe o color-scheme.

import type { Cls, Palette, Rarity } from '../../types'
import { classColor, esc } from './art'
import type { Art } from './art'

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
export const MAX_MARKS = 12

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

export const questIcon = (title: string) =>
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

export type ItemArt = { name: string; rarity: Rarity; glyph: string; diff: string; tip: string }

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

// ---------- recursos do rodapé ----------

const ICONS = {
  mochila: (x: number) =>
    `<rect x="${x + 2}" y="4" width="10" height="10" rx="2" fill="#a8794a"/><rect x="${x + 4}" y="1.5" width="6" height="4" rx="1.5" fill="none" stroke="#a8794a" stroke-width="1.4"/><rect x="${x + 4}" y="8" width="6" height="3" rx="1" fill="#6e4f2f"/>`,
  mana: (x: number) => `<path d="M${x + 7} 1 C ${x + 3} 7, ${x + 2} 9, ${x + 2} 10 A 5 5 0 0 0 ${x + 12} 10 C ${x + 12} 9, ${x + 11} 7, ${x + 7} 1 Z" fill="#6cb6ec"/>`,
  vigor: (x: number) => `<path d="M${x + 7} 13 L ${x + 1.5} 7 A 3.2 3.2 0 0 1 ${x + 7} 3.2 A 3.2 3.2 0 0 1 ${x + 12.5} 7 Z" fill="#8fc46a"/>`,
}

export type ResArt = { key: keyof typeof ICONS; label: string; value?: number; color: string; reset: string; tip: string }

export const resourcesArt = (w: number, rs: readonly ResArt[], p: Palette): Art => {
  const k = TONES[p]
  const col = w / rs.length
  let inner = ''
  rs.forEach((r, i) => {
    const x = i * col
    const bw = col - 14
    const v = r.value === undefined ? '—' : `${Math.round(r.value)}%`
    inner +=
      `<g><title>${esc(r.tip)}</title><rect x="${x}" y="0" width="${col}" height="24" fill="transparent"/>` +
      ICONS[r.key](x) +
      `<text x="${x + 17}" y="11" font-size="10.5" fill="${k.muted}">${esc(r.label)}</text>` +
      `<text x="${x + bw}" y="11" text-anchor="end" font-size="10.5" font-weight="700" fill="${k.text}">${v}${r.reset ? `<tspan font-weight="400" fill="${k.dim}"> ↻${esc(r.reset)}</tspan>` : ''}</text>` +
      `<rect x="${x}" y="18" width="${bw}" height="4" rx="2" fill="${k.track}"/>` +
      (r.value === undefined ? '' : `<rect x="${x}" y="18" width="${(bw * Math.min(100, Math.max(0, r.value))) / 100}" height="4" rx="2" fill="${r.color}"/>`) +
      '</g>'
  })
  return doc(w, 24, inner, rs.map(r => `${r.label} ${r.value === undefined ? '—' : `${Math.round(r.value)}%`}`).join(', '))
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

/** O resultado em símbolo, sem pílula: ✓, ✗ ou o anel girando. */
export const statusIcon = (state: 'run' | 'ok' | 'err', tip: string, p: Palette): Art => {
  const k = TONES[p]
  const c = state === 'run' ? classColor('druida', p) : state === 'err' ? k.bad : k.ok
  const inner =
    state === 'run'
      ? `<circle cx="9" cy="9" r="5.5" fill="none" stroke="${c}" stroke-opacity=".3" stroke-width="1.6"/><path d="M9 3.5 A5.5 5.5 0 0 1 14.5 9" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 9 9" to="360 9 9" dur="1s" repeatCount="indefinite"/></path>`
      : `<text x="9" y="13.5" text-anchor="middle" font-size="12" font-weight="700" fill="${c}">${state === 'err' ? '✗' : '✓'}</text>`
  return doc(18, 18, inner, tip, tip)
}

export const statusColor = (state: 'run' | 'ok' | 'err', p: Palette) =>
  state === 'run' ? classColor('druida', p) : state === 'err' ? TONES[p].bad : TONES[p].ok

// ---------- faixa compacta ----------

export type BandNow = { cls: Cls; name: string; text: string; file?: string; rarity?: Rarity } | null

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
