// Gera as imagens do README a partir da arte real da HUD (mods/clawd-hud/hooks/core/art.ts):
// o banner animado e o ícone animado de cada classe, nas versões escura e clara.
//   bun run scripts/gerar-assets.ts
// A demo animada e os prints vêm de scripts/gravar-demo.cjs (protótipo + Playwright + ffmpeg).

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { CLASSES, crab, esc } from '../mods/clawd-hud/hooks/core/art'
import { DICT } from '../mods/clawd-hud/hooks/core/i18n'
import type { Palette } from '../mods/clawd-hud/types'

const OUT = join(import.meta.dir, '..', 'docs', 'assets')
mkdirSync(join(OUT, 'classes'), { recursive: true })

const THEME = {
  escuro: { bg: '#1f1e1d', panel: '#2b2a27', line: '#45433e', text: '#ece9df', muted: '#b3b0a6', gild: '#d9b26a', gildDim: '#8a7346' },
  claro: { bg: '#faf9f5', panel: '#f3f1ea', line: '#dcd8cc', text: '#1f1e1d', muted: '#57554f', gild: '#7a5310', gildDim: '#c9b48a' },
} as const

/** Tira o <svg> de fora de uma arte, para encaixá-la num quadro maior. */
const inner = (source: string) => {
  const open = source.indexOf('>') + 1
  const viewBox = /viewBox="([^"]+)"/.exec(source)?.[1] ?? '0 0 100 100'
  return { viewBox, body: source.slice(open, source.lastIndexOf('</svg>')) }
}

// ---------- Ícones das classes ----------

for (const palette of ['escuro', 'claro'] as const) {
  for (const cls of CLASSES) {
    const art = crab(cls, 120, palette, `${DICT.pt.className[cls]} / ${DICT.en.className[cls]}`, true)
    writeFileSync(join(OUT, 'classes', `${cls}-${palette}.svg`), art.source)
  }
}

// ---------- Banner ----------

const banner = (palette: Palette) => {
  const t = THEME[palette]
  const W = 1200
  const H = 350
  const size = 132
  const step = (W - 140) / (CLASSES.length - 1)
  const crabs = CLASSES.map((cls, i) => {
    const { viewBox, body } = inner(crab(cls, size, palette, DICT.pt.className[cls], true).source)
    const x = 70 + i * step - size / 2
    // Cada um balança com um atraso diferente, como um grupo em marcha.
    return `<g style="animation:hop 2.4s ease-in-out ${(i * 0.18).toFixed(2)}s infinite"><svg x="${x.toFixed(1)}" y="186" width="${size}" height="${Math.round((size * 76) / 130)}" viewBox="${viewBox}">${body}</svg></g>`
  }).join('')
  const sparkles = [
    [120, 40, 0],
    [1070, 36, 0.8],
    [60, 120, 1.6],
    [1130, 118, 2.2],
    [600, 30, 1.1],
  ]
    .map(([x, y, d]) => `<text x="${x}" y="${y}" font-size="16" fill="${t.gild}" style="animation:twinkle 3s ease-in-out ${d}s infinite">✦</text>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>Claude Code Hero Journey</title>
<style>
@keyframes hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes twinkle{0%,100%{opacity:1}50%{opacity:.25}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
g,text{transform-box:fill-box}
</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="${t.panel}" stroke="${t.line}" stroke-width="2"/>
<line x1="80" y1="58" x2="440" y2="58" stroke="${t.gildDim}"/><path d="M448 58 l7 -7 l7 7 l-7 7 Z" fill="${t.gild}"/>
<path d="M738 58 l7 -7 l7 7 l-7 7 Z" fill="${t.gild}"/><line x1="760" y1="58" x2="1120" y2="58" stroke="${t.gildDim}"/>
<text x="600" y="66" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="22" letter-spacing="6" fill="${t.gild}">! QUEST LOG !</text>
<text x="600" y="128" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="50" font-weight="700" fill="${t.text}">Claude Code Hero Journey</text>
<text x="600" y="168" text-anchor="middle" font-family="system-ui,-apple-system,'Segoe UI',sans-serif" font-size="19" fill="${t.muted}">${esc('Uma HUD de RPG aconchegante para o Claude Code · A cozy RPG HUD for Claude Code')}</text>
${sparkles}
${crabs}
<line x1="60" y1="300" x2="${W - 60}" y2="300" stroke="${t.line}" stroke-width="2"/>
<text x="600" y="330" text-anchor="middle" font-family="system-ui,-apple-system,'Segoe UI',sans-serif" font-size="15" fill="${t.muted}">${esc(CLASSES.map(c => DICT.pt.className[c]).join(' · '))}</text>
</svg>
`
}

for (const palette of ['escuro', 'claro'] as const) writeFileSync(join(OUT, `banner-${palette}.svg`), banner(palette))

console.log(`assets em ${OUT}`)
