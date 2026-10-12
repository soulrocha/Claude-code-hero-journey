// Gera as imagens do README a partir da arte real da HUD (mods/hero-journey/hooks/core):
// o banner animado (escuro e claro), o Clawd de cada classe sem fundo (serve nos
// dois temas) e o acampamento, acordado e dormindo.
//   bun run scripts/gerar-assets.ts          (da raiz do repositório)
// A demo animada e os prints vêm do protótipo de referência, fora deste repositório.

import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { esc } from '../mods/hero-journey/hooks/core/doc'
import { stageArt } from '../mods/hero-journey/hooks/core/cenarios'
import { spriteArt, spriteInner, SPRITE_H, SPRITE_W } from '../mods/hero-journey/hooks/core/sprites'
import { DICT } from '../mods/hero-journey/hooks/core/i18n'
import type { Cls, Palette } from '../mods/hero-journey/types'

const OUT = join(process.cwd(), 'docs', 'assets')
mkdirSync(join(OUT, 'classes'), { recursive: true })

/** As 19 classes, na ordem do README (a do mapa em docs/classes.md). */
const CLASSES = Object.keys(DICT.pt.className) as Cls[]

const THEME = {
  escuro: { panel: '#2b2a27', line: '#45433e', text: '#ece9df', muted: '#b3b0a6', gild: '#d9b26a', gildDim: '#8a7346' },
  claro: { panel: '#f3f1ea', line: '#dcd8cc', text: '#1f1e1d', muted: '#57554f', gild: '#7a5310', gildDim: '#c9b48a' },
} as const

// ---------- O Clawd de cada classe e o acampamento ----------

// Os ícones antigos (um por tema) dão lugar a um só por classe.
for (const f of readdirSync(join(OUT, 'classes'))) rmSync(join(OUT, 'classes', f))
for (const cls of CLASSES) {
  const alt = `${DICT.pt.className[cls]} / ${DICT.en.className[cls]}`
  writeFileSync(join(OUT, 'classes', `${cls}.svg`), spriteArt(cls, 'work', 168, alt).source)
}
writeFileSync(join(OUT, 'acampamento.svg'), stageArt('aprendiz', 'idle', 'acampamento', 350, 220, 'Acampamento: esperando você / Camp: waiting for you').source)
writeFileSync(join(OUT, 'acampamento-noite.svg'), stageArt('aprendiz', 'sleep', 'acampamento', 350, 220, 'Acampamento: dormindo / Camp: asleep').source)

// ---------- Banner ----------

const banner = (palette: Palette) => {
  const t = THEME[palette]
  const W = 1200
  const H = 432
  // Duas fileiras (10 e 9), em quincôncio: o sprite tem margem dos lados, então os acessórios cabem entre vizinhos.
  const size = 132
  const h = (size * SPRITE_H) / SPRITE_W
  const perRow = 10
  const step = (W - 160) / (perRow - 1)
  const crabs = CLASSES.map((cls, i) => {
    const row = i < perRow ? 0 : 1
    const col = row === 0 ? i : i - perRow + 0.5
    const x = 80 + col * step - size / 2
    const y = row === 0 ? 190 : 276
    // Cada um balança com um atraso diferente, como um grupo em marcha.
    return `<g style="animation:hop 2.4s ease-in-out ${(i * 0.14).toFixed(2)}s infinite"><svg x="${x.toFixed(1)}" y="${y}" width="${size}" height="${h.toFixed(1)}" viewBox="0 0 ${SPRITE_W} ${SPRITE_H}" overflow="visible">${spriteInner(cls, 'work')}</svg></g>`
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
<line x1="60" y1="386" x2="${W - 60}" y2="386" stroke="${t.line}" stroke-width="2"/>
<text x="600" y="413" text-anchor="middle" font-family="system-ui,-apple-system,'Segoe UI',sans-serif" font-size="15" fill="${t.muted}">${esc(`${CLASSES.length} classes: cada tarefa do Claude veste uma · ${CLASSES.length} classes: every Claude task wears one`)}</text>
</svg>
`
}

for (const palette of ['escuro', 'claro'] as const) writeFileSync(join(OUT, `banner-${palette}.svg`), banner(palette))

console.log(`assets em ${OUT}`)
