// Os cenários do palco, sem o Clawd: um por classe e o acampamento (parado,
// acordado ou dormindo). Na medida do palco do mod: 350 px de largura, 320 px
// de altura com o painel livre e 170 px quando o painel tem plano, grupo ou
// inventário. O nome de cada lugar sai em português; quem desenha pode passar
// os nomes na língua da HUD.

import type { Art } from './doc'
import { doc, esc } from './doc'
import type { Hero, Pose } from './sprites'
import { FEET, SPRITE_H, SPRITE_W, spriteInner } from './sprites'

export type Place = 'treino' | 'biblioteca' | 'runas' | 'oficina' | 'pantano' | 'acampamento' | 'trono' | 'teatro' | 'torre' | 'floresta' | 'beco' | 'forja' | 'santuario' | 'muralha' | 'laboratorio' | 'tenda' | 'salao' | 'camara' | 'portal' | 'atelie'

export const PLACE_OF: Record<Hero, Place> = { aprendiz: 'treino', mago: 'biblioteca', runico: 'runas', engenheiro: 'oficina', bruxo: 'pantano', rei: 'trono', ilusionista: 'teatro', sabio: 'torre', cacador: 'floresta', ladino: 'beco', artifice: 'forja', oraculo: 'santuario', geomante: 'muralha', alquimista: 'laboratorio', cartomante: 'tenda', invocador: 'salao', cronomante: 'camara', paladino: 'portal', pintor: 'atelie' }
const ACCENT: Record<Place, string> = {
  treino: '#efe6cf',
  biblioteca: '#6cc3ec',
  runas: '#5fe3cf',
  oficina: '#9b7bff',
  pantano: '#c9ccd6',
  acampamento: '#d9b26a',
  trono: '#e2b54a',
  teatro: '#b49cf0',
  torre: '#2f8a8f',
  floresta: '#8fd3ff',
  beco: '#e6b450',
  forja: '#ffb35c',
  santuario: '#8fd3ff',
  muralha: '#9bc46a',
  laboratorio: '#a8d07a',
  tenda: '#c9a8ff',
  salao: '#a78bfa',
  camara: '#d9a95a',
  portal: '#f2c14e',
  atelie: '#d9534f',
}
const LABEL: Record<Place, string> = {
  treino: 'Campo de treino',
  biblioteca: 'Biblioteca',
  runas: 'Círculo de runas',
  oficina: 'Oficina',
  pantano: 'Pântano',
  acampamento: 'Acampamento',
  trono: 'Sala do trono',
  teatro: 'Teatro das ilusões',
  torre: 'Torre do sábio',
  floresta: 'Floresta da lua',
  beco: 'Beco',
  forja: 'Forja',
  santuario: 'Santuário',
  muralha: 'Muralha de pedra',
  laboratorio: 'Laboratório',
  tenda: 'Tenda das cartas',
  salao: 'Salão arcano',
  camara: 'Câmara do tempo',
  portal: 'Portal',
  atelie: 'Ateliê',
}

const BG_CSS = [
  '.tw{animation:tw 3.2s ease-in-out infinite}@keyframes tw{50%{opacity:.25}}',
  '.flk{transform-box:fill-box;transform-origin:50% 100%;animation:flk .9s ease-in-out infinite}@keyframes flk{0%,100%{transform:scale(1,1)}35%{transform:scale(.92,1.1)}70%{transform:scale(1.06,.9)}}',
  '.halo{animation:halo 1.8s ease-in-out infinite}@keyframes halo{50%{opacity:.55}}',
  '.smk{opacity:0;animation:smk 3.6s ease-out infinite}@keyframes smk{0%{opacity:0;transform:none}20%{opacity:.45}100%{opacity:0;transform:translate(6px,-34px)}}',
  '.mote{opacity:0;animation:mote 6s linear infinite}@keyframes mote{0%{opacity:0;transform:none}20%{opacity:.7}100%{opacity:0;transform:translateY(-70px)}}',
  '.flag{transform-box:fill-box;transform-origin:0% 50%;animation:flag 1.6s ease-in-out infinite}@keyframes flag{50%{transform:skewY(8deg) scaleX(.9)}}',
  '.petal{opacity:0;animation:petal 7s linear infinite}@keyframes petal{0%{opacity:0;transform:translate(0,0) rotate(0)}10%{opacity:.9}100%{opacity:0;transform:translate(-90px,150px) rotate(300deg)}}',
  '.needle{transform-box:view-box;animation:needle 2.2s ease-in-out infinite}@keyframes needle{50%{transform:rotate(70deg)}}',
  '.steam{opacity:0;animation:steam 2.8s ease-out infinite}@keyframes steam{0%{opacity:0;transform:none}25%{opacity:.4}100%{opacity:0;transform:translate(-4px,-30px) scale(1.8)}}',
  '.fog{animation:fog 14s ease-in-out infinite}@keyframes fog{50%{transform:translateX(26px)}}',
  '.eyes{animation:eyes 5s infinite}@keyframes eyes{0%,46%,54%,100%{opacity:1}50%{opacity:0}}',
  '.dash{animation:dash 6s linear infinite}@keyframes dash{to{stroke-dashoffset:-60}}',
  '.vanish{transform-box:fill-box;transform-origin:center;animation:vanish 4s ease-in infinite}@keyframes vanish{0%,28%{opacity:1;transform:none}46%{opacity:0;transform:translateX(26px) scale(.4)}90%{opacity:0;transform:none}100%{opacity:1}}',
  '.spin{transform-box:fill-box;transform-origin:center;animation:spin 20s linear infinite}.spinr{transform-box:fill-box;transform-origin:center;animation:spin 14s linear infinite reverse}@keyframes spin{to{transform:rotate(360deg)}}',
  '.flt{animation:flt 2.8s ease-in-out infinite}@keyframes flt{50%{transform:translateY(-4px)}}',
  '.rise{opacity:0;animation:rise 5.2s ease-out infinite}@keyframes rise{0%{opacity:0;transform:none}15%{opacity:.9}100%{opacity:0;transform:translate(12px,-90px) rotate(220deg)}}',
  '.trace{animation:trace 4s ease-in-out infinite}@keyframes trace{0%,15%{opacity:0}45%,70%{opacity:.6}100%{opacity:0}}',
  '.lit{animation:lit 4s infinite}@keyframes lit{0%,100%{fill-opacity:.3}8%,24%{fill-opacity:1}34%{fill-opacity:.3}}',
  '@media (prefers-reduced-motion:reduce){*{animation:none!important}}',
].join('')

// Um pseudoaleatório fixo: estrelas e livros saem iguais a cada desenho.
const rnd = (seed: number) => {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/** A linha do chão: a mesma conta em todos os cenários, para o Clawd pisar sempre no lugar certo. */
export const groundOf = (h: number) => h - Math.round(Math.max(28, h * 0.13))

const frame = (w: number, h: number, accent: string, top: string, bottom: string) =>
  `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>` +
  `<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb35c" stop-opacity=".55"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="cool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#5fe3cf" stop-opacity=".35"/><stop offset="1" stop-color="#5fe3cf" stop-opacity="0"/></radialGradient>` +
  `<clipPath id="card"><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="10"/></clipPath></defs>` +
  `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="10" fill="url(#sky)"/>`

const border = (w: number, h: number, accent: string) =>
  `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="10" fill="none" stroke="${accent}" stroke-opacity=".35"/>`

const label = (text: string, color = '#d9b26a') =>
  `<text x="14" y="20" font-size="9.5" letter-spacing="2" font-weight="600" fill="${color}" opacity=".75">◆ ${esc(text.toUpperCase())}</text>`

const stars = (w: number, top: number, bottom: number, n: number, seed: number) => {
  const r = rnd(seed)
  return Array.from({ length: n }, (_, i) => {
    const x = 18 + r() * (w - 36)
    const y = top + r() * (bottom - top)
    return `<circle class="tw" style="animation-delay:${(i * 0.37).toFixed(2)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.6 + r() * 0.8).toFixed(2)}" fill="#ece9df"/>`
  }).join('')
}

// ---------- campo de treino: um pouco de cada classe ----------

const treino = (w: number, h: number) => {
  const g = groundOf(h)
  const rack = (x: number) =>
    `<rect x="${x}" y="${g - 46}" width="4" height="46" fill="#6b4a2e"/><rect x="${x + 50}" y="${g - 46}" width="4" height="46" fill="#6b4a2e"/><rect x="${x - 2}" y="${g - 40}" width="58" height="4" rx="1" fill="#7d5636"/>` +
    // cajado do mago
    `<line x1="${x + 10}" y1="${g}" x2="${x + 14}" y2="${g - 54}" stroke="#8a6a45" stroke-width="2.6"/><circle cx="${x + 14}" cy="${g - 57}" r="4" fill="#6cc3ec"/>` +
    // espada de prata do bruxo
    `<line x1="${x + 22}" y1="${g}" x2="${x + 24}" y2="${g - 50}" stroke="#d6dde6" stroke-width="2.4"/><line x1="${x + 18}" y1="${g - 10}" x2="${x + 28}" y2="${g - 10}" stroke="#6b5a45" stroke-width="2.4"/>` +
    // chave do engenheiro
    `<line x1="${x + 34}" y1="${g}" x2="${x + 36}" y2="${g - 38}" stroke="#9aa0b5" stroke-width="3"/><circle cx="${x + 36}" cy="${g - 41}" r="4" fill="none" stroke="#9aa0b5" stroke-width="2.5"/>` +
    // pedra de runa
    `<rect x="${x + 40}" y="${g - 15}" width="13" height="15" rx="4" fill="#5d6b78"/><text x="${x + 46.5}" y="${g - 5}" text-anchor="middle" font-family="Consolas,monospace" font-size="6.5" font-weight="800" fill="#5fe3cf">&lt;/&gt;</text>`
  const dummy = (x: number) =>
    `<rect x="${x - 2}" y="${g - 52}" width="4" height="52" fill="#7d5636"/><rect x="${x - 18}" y="${g - 40}" width="36" height="4" rx="2" fill="#7d5636"/>` +
    `<ellipse cx="${x}" cy="${g - 30}" rx="11" ry="14" fill="#c9a86a"/><circle cx="${x}" cy="${g - 57}" r="8" fill="#d8b878"/>` +
    `<circle cx="${x}" cy="${g - 30}" r="6" fill="none" stroke="#b5452f" stroke-width="2"/><circle cx="${x}" cy="${g - 30}" r="2" fill="#b5452f"/>`
  const flag = (x: number, color: string, d: number) =>
    `<line x1="${x}" y1="${g - 20}" x2="${x}" y2="${g - 70}" stroke="#8a6a45" stroke-width="1.6"/><path class="flag" style="animation-delay:${d}s" d="M${x} ${g - 70} h16 l-4 5 l4 5 h-16 Z" fill="${color}" opacity=".85"/>`
  return (
    frame(w, h, ACCENT.treino, '#2c3350', '#6a5048') +
    `<g clip-path="url(#card)">` +
    stars(w, 26, g * 0.35, 8, 3) +
    // o sol nascendo atrás do morro mais alto
    `<ellipse cx="${w * 0.27}" cy="${g - 34}" rx="70" ry="40" fill="url(#glow)" opacity=".7"/><circle cx="${w * 0.27}" cy="${g - 36}" r="13" fill="#f6c27e" opacity=".85"/>` +
    `<path d="M0 ${g - 20} Q${w * 0.25} ${g - 44} ${w * 0.5} ${g - 22} T${w} ${g - 26} V${g} H0 Z" fill="#2c3a2e"/>` +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#26301f"/><line x1="0" y1="${g + 0.5}" x2="${w}" y2="${g + 0.5}" stroke="#9bc46a" stroke-opacity=".2"/>` +
    Array.from({ length: 9 }, (_, i) => `<path d="M${20 + i * 38} ${g + 6} l2 -6 l2 6 l2 -5 l2 5" stroke="#4a6a34" stroke-width="1.2" fill="none"/>`).join('') +
    // cerca ao fundo e o alvo de flecha
    Array.from({ length: Math.ceil(w / 28) }, (_, i) => `<rect x="${i * 28 + 6}" y="${g - 16}" width="3" height="16" fill="#4a3a2a" opacity=".7"/>`).join('') +
    `<rect x="0" y="${g - 12}" width="${w}" height="2" fill="#4a3a2a" opacity=".7"/>` +
    `<g transform="translate(${w * 0.6} ${g - 30})"><circle r="9" fill="#ece9df" opacity=".85"/><circle r="6" fill="#b5452f"/><circle r="3" fill="#ece9df"/><line x1="-5" y1="9" x2="-8" y2="30" stroke="#6b4a2e" stroke-width="2"/><line x1="5" y1="9" x2="8" y2="30" stroke="#6b4a2e" stroke-width="2"/></g>` +
    rack(12) +
    dummy(w - 34) +
    flag(w * 0.24, '#4f7fd1', 0) +
    flag(w * 0.8, '#2f9e8f', 0.5) +
    label(LABEL.treino) +
    `</g>` +
    border(w, h, ACCENT.treino)
  )
}

// ---------- biblioteca do Mago ----------

const biblioteca = (w: number, h: number) => {
  const g = groundOf(h)
  const r = rnd(11)
  const SPINES = ['#6c5a8a', '#3f6a8a', '#8a5a4a', '#5a7a4a', '#8a7a4a', '#4a5a7a', '#7a4a5e']
  const sw = Math.min(80, w * 0.23)
  const shelf = (x: number) => {
    let out = `<rect x="${x}" y="30" width="${sw}" height="${g - 30}" fill="#2a241f" stroke="#4a3d30"/>`
    const lv = (g - 30) / 3
    for (const sy of [30 + lv, 30 + lv * 2, g].map(Math.round)) {
      let bx = x + 4
      while (bx < x + sw - 8) {
        const bw = 4 + Math.floor(r() * 4)
        const bh = Math.min(lv - 5, 14 + Math.floor(r() * 10))
        out += `<rect x="${bx}" y="${sy - bh}" width="${bw}" height="${bh}" rx=".6" fill="${SPINES[Math.floor(r() * SPINES.length)]}" opacity=".85"/>`
        bx += bw + 1
      }
      out += `<rect x="${x}" y="${sy}" width="${sw}" height="3" fill="#4a3d30"/>`
    }
    return out
  }
  const motes = Array.from({ length: 7 }, (_, i) => `<circle class="mote" style="animation-delay:${i * 0.9}s" cx="${(w * 0.3 + r() * w * 0.4).toFixed(1)}" cy="${g - 6}" r="1.1" fill="#ffe08a"/>`).join('')
  return (
    frame(w, h, ACCENT.biblioteca, '#262230', '#221f1c') +
    `<g clip-path="url(#card)">` +
    `<path d="M${w / 2 - 26} ${Math.min(80, g * 0.4)} V40 a26 26 0 0 1 52 0 V${Math.min(80, g * 0.4)} Z" fill="#1d2233" stroke="#4a3d30" stroke-width="2"/><circle cx="${w / 2 + 9}" cy="36" r="5" fill="#e9e2c8" opacity=".8"/>` +
    shelf(8) +
    shelf(w - 8 - sw) +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#1e1b19"/>` +
    [0.2, 0.45, 0.7].map(f => `<line x1="${w * f}" y1="${g}" x2="${w * f - 8}" y2="${h}" stroke="#2c2722"/>`).join('') +
    `<rect x="${w - 32}" y="18" width="5" height="12" fill="#e9e2c8"/><path class="flk" d="M${w - 29.5} 17 c-3 -4 0 -7 0 -9 c2 3 3 5 0 9 Z" fill="#f2a54a"/><ellipse class="halo" cx="${w - 29.5}" cy="14" rx="16" ry="11" fill="url(#glow)"/>` +
    motes +
    label(LABEL.biblioteca) +
    `</g>` +
    border(w, h, ACCENT.biblioteca)
  )
}

// ---------- círculo de runas do Rúnico ----------

const runas = (w: number, h: number) => {
  const g = groundOf(h)
  const menhir = (x: number, mw: number, mh: number, glyph: string, d: number) =>
    `<path d="M${x} ${g} L${x + 3} ${g - mh + 8} Q${x + mw / 2} ${g - mh - 4} ${x + mw - 3} ${g - mh + 8} L${x + mw} ${g} Z" fill="#3d4650" stroke="#2b323a"/>` +
    `<text class="lit" style="animation-delay:${d}s" x="${x + mw / 2}" y="${g - mh / 2}" text-anchor="middle" font-family="Consolas,monospace" font-size="${Math.round(mw / 3)}" font-weight="800" fill="#5fe3cf">${glyph}</text>`
  const motes = Array.from({ length: 8 }, (_, i) => `<circle class="mote" style="animation-delay:${i * 0.75}s" cx="${(w * 0.2 + ((i * 37) % 60) / 100 * w).toFixed(1)}" cy="${g - 4}" r="1.2" fill="#5fe3cf"/>`).join('')
  return (
    frame(w, h, ACCENT.runas, '#121c24', '#1d2828') +
    `<g clip-path="url(#card)">` +
    stars(w, 26, g * 0.5, 16, 5) +
    `<path d="M0 ${g - 16} Q${w * 0.3} ${g - 30} ${w * 0.6} ${g - 18} T${w} ${g - 20} V${g} H0 Z" fill="#182226"/>` +
    menhir(w * 0.5 - 16, 32, Math.min(90, g * 0.42), '{ }', 0.5) +
    menhir(14, 40, Math.min(120, g * 0.55), '&lt;/&gt;', 0) +
    menhir(w - 54, 40, Math.min(110, g * 0.5), 'λ', 1.5) +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#1a2124"/>` +
    Array.from({ length: Math.ceil(w / 40) }, (_, i) => `<line x1="${i * 40}" y1="${g}" x2="${i * 40 - 10}" y2="${h}" stroke="#232c30"/>`).join('') +
    `<ellipse cx="${w / 2}" cy="${g + (h - g) / 2}" rx="${w * 0.4}" ry="${(h - g) * 0.36}" fill="url(#cool)"/>` +
    `<ellipse cx="${w / 2}" cy="${g + (h - g) / 2}" rx="${w * 0.36}" ry="${(h - g) * 0.3}" fill="none" stroke="#5fe3cf" stroke-opacity=".5" stroke-dasharray="10 6" class="dash"/>` +
    motes +
    label(LABEL.runas) +
    `</g>` +
    border(w, h, ACCENT.runas)
  )
}

// ---------- oficina do Engenheiro: telhados ao entardecer, o monólito pintado e pétalas ----------

const oficina = (w: number, h: number) => {
  const g = groundOf(h)
  const roofs = (() => {
    let d = `M0 ${g}`
    let x = 0
    const r = rnd(21)
    while (x < w) {
      const rw = 30 + r() * 30
      const top = g - 34 - r() * 26
      d += ` L${x} ${top + 8} L${x + 6} ${top} L${x + rw - 6} ${top} L${x + rw} ${top + 8}`
      if (r() > 0.5) d += ` L${x + rw - 10} ${top + 8} L${x + rw - 10} ${top - 8} L${x + rw - 5} ${top - 8} L${x + rw - 5} ${top + 8}`
      x += rw
    }
    return `<path d="${d} L${w} ${g} Z" fill="#241c2a" opacity=".95"/>`
  })()
  const tx = w * 0.22
  const tower =
    `<path d="M${tx - 16} ${g - 30} L${tx} ${g - 120} L${tx + 16} ${g - 30} Z" fill="none" stroke="#1d1722" stroke-width="3"/>` +
    [0.25, 0.5, 0.72].map(f => `<line x1="${tx - 16 * (1 - f) - 2}" y1="${g - 30 - 90 * f}" x2="${tx + 16 * (1 - f) + 2}" y2="${g - 30 - 90 * f}" stroke="#1d1722" stroke-width="2"/>`).join('') +
    `<path d="M${tx - 12} ${g - 30} Q${tx} ${g - 46} ${tx + 12} ${g - 30}" stroke="#1d1722" stroke-width="2" fill="none"/>`
  const mx = w * 0.74
  const monolith =
    `<path d="M${mx - 12} ${g - 30} L${mx - 8} 30 L${mx + 8} 26 L${mx + 12} ${g - 30} Z" fill="#17131c"/>` +
    `<text x="${mx}" y="${Math.max(70, g * 0.42)}" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="14" fill="#f2e6d8" opacity=".6">33</text>`
  const petals = Array.from({ length: 9 }, (_, i) => `<ellipse class="petal" style="animation-delay:${(i * 0.8).toFixed(1)}s" cx="${(w * 0.35 + ((i * 53) % 100) / 100 * w * 0.7).toFixed(1)}" cy="${20 + (i % 3) * 14}" rx="2.6" ry="1.4" fill="#d9534f"/>`).join('')
  const bench =
    `<rect x="10" y="${g - 22}" width="70" height="5" rx="1" fill="#5a4636"/><rect x="14" y="${g - 17}" width="4" height="17" fill="#4a392c"/><rect x="72" y="${g - 17}" width="4" height="17" fill="#4a392c"/>` +
    `<circle cx="30" cy="${g - 36}" r="10" fill="#e9e2c8" stroke="#8d6a3a" stroke-width="2.5"/><line class="needle" style="transform-origin:30px ${g - 36}px" x1="30" y1="${g - 36}" x2="24" y2="${g - 41}" stroke="#b5452f" stroke-width="1.6"/>` +
    `<rect x="48" y="${g - 34}" width="22" height="12" rx="2" fill="#8d96a6"/><circle cx="59" cy="${g - 28}" r="3" fill="#9b7bff" opacity=".8"/>`
  const pipe =
    `<path d="M${w - 18} ${g} V${g - 50} H${w - 46} V${g - 64}" stroke="#7a6a58" stroke-width="5" fill="none"/>` +
    [0, 0.9, 1.8].map(d => `<circle class="steam" style="animation-delay:${d}s" cx="${w - 46}" cy="${g - 70}" r="4" fill="#d8d4cc"/>`).join('')
  return (
    frame(w, h, ACCENT.oficina, '#2b2440', '#9a5a40') +
    `<g clip-path="url(#card)">` +
    `<circle cx="${w * 0.5}" cy="${g - 20}" r="40" fill="#f2a56b" opacity=".2"/>` +
    monolith +
    tower +
    roofs +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#231d22"/>` +
    Array.from({ length: Math.ceil(w / 16) }, (_, i) => `<rect x="${i * 16 + ((i % 2) * 8)}" y="${g + 4}" width="12" height="5" rx="2" fill="#2d262c"/>`).join('') +
    bench +
    pipe +
    petals +
    label(LABEL.oficina) +
    `</g>` +
    border(w, h, ACCENT.oficina)
  )
}

// ---------- pântano do Bruxo: névoa, árvores mortas e o monstro (o bug) espreitando ----------

const pantano = (w: number, h: number) => {
  const g = groundOf(h)
  const tree = (x: number, s: number, flip: boolean) =>
    `<g transform="translate(${x} ${g}) scale(${flip ? -s : s} ${s})"><path d="M-4 0 L-3 -60 Q-14 -72 -26 -74 M-3 -48 Q8 -62 18 -64 M-3 -36 Q-12 -42 -20 -40 M-3 -60 Q0 -76 6 -84" stroke="#0f1514" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-6 0 L-4 -58 L-1 -58 L2 0 Z" fill="#0f1514"/></g>`
  const fog = (y: number, d: number, o: number) => `<ellipse class="fog" style="animation-delay:${d}s" cx="${w / 2}" cy="${y}" rx="${w * 0.7}" ry="9" fill="#cfd8d4" opacity="${o}"/>`
  const mx = w * 0.78
  return (
    frame(w, h, ACCENT.pantano, '#121a20', '#1d2621') +
    `<g clip-path="url(#card)">` +
    stars(w, 26, g * 0.4, 10, 9) +
    `<circle cx="${w * 0.28}" cy="44" r="22" fill="#dfe6e2" opacity=".08"/><circle cx="${w * 0.28}" cy="44" r="11" fill="#dfe6e2" opacity=".75"/>` +
    tree(26, Math.min(1.3, g / 120), false) +
    tree(w - 18, Math.min(1.1, g / 140), true) +
    // o bug-chefe: um besouro gigante na névoa, antenas, seis patas e olhos que brilham
    `<g transform="translate(${mx} ${g - 20})">` +
    `<path d="M-14 -4 l-12 -8 M-15 4 l-14 2 M-13 11 l-11 9 M14 -4 l12 -8 M15 4 l14 2 M13 11 l11 9" stroke="#0c1110" stroke-width="3.2" stroke-linecap="round"/>` +
    `<ellipse cx="0" cy="4" rx="16" ry="18" fill="#0c1110"/><line x1="0" y1="-12" x2="0" y2="22" stroke="#1a2420" stroke-width="1.5"/>` +
    `<circle cx="0" cy="-17" r="8" fill="#0c1110"/><path d="M-4 -23 q-6 -10 -13 -10 M4 -23 q6 -10 13 -10" stroke="#0c1110" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
    `<g class="eyes"><circle cx="-3.4" cy="-18" r="2" fill="#9fe870"/><circle cx="3.4" cy="-18" r="2" fill="#9fe870"/></g></g>` +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#16201d"/>` +
    [0.3, 0.55, 0.8].map(f => `<line x1="${w * 0.1}" y1="${g + (h - g) * f}" x2="${w * 0.9}" y2="${g + (h - g) * f}" stroke="#2a3833" stroke-opacity=".7"/>`).join('') +
    Array.from({ length: 7 }, (_, i) => `<path d="M${30 + i * 46} ${g + 2} q-2 -12 0 -18 M${34 + i * 46} ${g + 2} q2 -10 4 -14" stroke="#2c3b2a" stroke-width="1.5" fill="none"/>`).join('') +
    fog(g - 6, 0, 0.07) +
    fog(g - 22, 4, 0.05) +
    label(LABEL.pantano) +
    `</g>` +
    border(w, h, ACCENT.pantano)
  )
}

// ---------- acampamento: parado, acordado esperando você ou dormindo ----------

const campfire = (cx: number, g: number, level: number) => {
  const s = 0.45 + 0.55 * level
  const flames =
    level <= 0
      ? `<circle cx="${cx}" cy="${g - 5}" r="2.2" fill="#e8743b" opacity=".8"/><circle cx="${cx + 5}" cy="${g - 4}" r="1.6" fill="#e8743b" opacity=".6"/><circle cx="${cx - 4}" cy="${g - 4}" r="1.4" fill="#e8743b" opacity=".5"/>`
      : `<g transform="translate(${cx} ${g - 6}) scale(${s.toFixed(2)})"><path class="flk" d="M-11 0 C-13 -14 -4 -18 -3 -30 C3 -20 12 -16 11 0 Z" fill="#e8743b"/><path class="flk" style="animation-delay:.3s" d="M-7 0 C-8 -10 -1 -13 0 -22 C4 -14 9 -10 7 0 Z" fill="#f2a54a"/><path class="flk" style="animation-delay:.15s" d="M-3.5 0 C-4 -6 0 -8 0 -13 C2.5 -8 4.5 -5 3.5 0 Z" fill="#ffe08a"/></g>`
  return (
    (level > 0 ? `<ellipse class="halo" cx="${cx}" cy="${g - 4}" rx="${50 * s}" ry="${28 * s}" fill="url(#glow)"/>` : '') +
    (level < 0.5 ? [0, 1.2, 2.4].map(d => `<circle class="smk" style="animation-delay:${d}s" cx="${cx}" cy="${g - 14}" r="${3 + d}" fill="#8a877f"/>`).join('') : '') +
    `<rect x="${cx - 14}" y="${g - 5}" width="28" height="5" rx="2.5" fill="#6b4a2e" transform="rotate(-12 ${cx} ${g - 2})"/><rect x="${cx - 14}" y="${g - 5}" width="28" height="5" rx="2.5" fill="#7d5636" transform="rotate(12 ${cx} ${g - 2})"/>` +
    [-17, -9, 9, 17].map(dx => `<ellipse cx="${cx + dx}" cy="${g - 1}" rx="4" ry="2.6" fill="#55524b"/>`).join('') +
    flames
  )
}

const acampamento = (w: number, h: number, asleep: boolean) => {
  const g = groundOf(h)
  return (
    frame(w, h, ACCENT.acampamento, asleep ? '#12141f' : '#1a1d2b', asleep ? '#1f1d1a' : '#2b2822') +
    `<g clip-path="url(#card)">` +
    stars(w, 26, g - 50, asleep ? 22 : 14, 7) +
    `<circle cx="${w - 40}" cy="32" r="11" fill="#e9e2c8" opacity=".9"/><circle cx="${w - 34}" cy="29" r="10" fill="${asleep ? '#141724' : '#1c1f2c'}"/>` +
    `<path d="M0 ${g - 14} Q${w * 0.18} ${g - 34} ${w * 0.38} ${g - 16} T${w * 0.8} ${g - 20} T${w} ${g - 12} V${g} H0 Z" fill="#23242c"/>` +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#24211d"/><line x1="0" y1="${g + 0.5}" x2="${w}" y2="${g + 0.5}" stroke="#d9b26a" stroke-opacity=".16"/>` +
    `<path d="M8 ${g} L40 ${g - 44} L72 ${g} Z" fill="#3a332b"/><path d="M40 ${g - 44} L52 ${g} L28 ${g} Z" fill="#191714"/>` +
    `<line x1="40" y1="${g - 44}" x2="40" y2="${g - 51}" stroke="#8a6a45" stroke-width="2"/><path d="M40 ${g - 51} l10 3 l-10 3 Z" fill="#efe6cf"/>` +
    campfire(w * 0.8, g, asleep ? 0 : 0.8) +
    label(LABEL.acampamento) +
    `</g>` +
    border(w, h, ACCENT.acampamento)
  )
}

// ---------- sala do trono do Rei: colunas, tochas, tapete e as duas flâmulas do git ----------

const trono = (w: number, h: number) => {
  const g = groundOf(h)
  const col = (x: number) =>
    `<rect x="${x}" y="34" width="22" height="${g - 34}" fill="#3a2f33"/><rect x="${x - 3}" y="30" width="28" height="7" rx="1" fill="#4a3c40"/><rect x="${x - 3}" y="${g - 6}" width="28" height="6" fill="#4a3c40"/>` +
    [6, 12].map(dx => `<line x1="${x + dx}" y1="38" x2="${x + dx}" y2="${g - 8}" stroke="#2c2327"/>`).join('') +
    // a tocha
    `<rect x="${x + 9}" y="${Math.round(g * 0.45)}" width="4" height="10" fill="#6b4a2e"/><path class="flk" d="M${x + 11} ${Math.round(g * 0.45) - 1} c-4 -5 0 -9 0 -12 c3 4 4 7 0 12 Z" fill="#f2a54a"/>` +
    `<ellipse class="halo" cx="${x + 11}" cy="${Math.round(g * 0.45) - 6}" rx="18" ry="13" fill="url(#glow)"/>`
  // As flâmulas do git: o símbolo de branch grande.
  const banner = (cx: number, color: string) => {
    const bh = Math.min(92, g * 0.42)
    const ey = 24 + bh * 0.36
    return (
      `<rect x="${cx - 19}" y="21" width="38" height="4" rx="2" fill="#6b4a2e"/><path d="M${cx - 16} 24 h32 v${bh} l-16 -9 l-16 9 Z" fill="${color}"/>` +
      `<g transform="translate(${cx} ${ey}) scale(1.35)" stroke="#e2b54a" stroke-width="1.8" fill="none"><line x1="-4" y1="-8" x2="-4" y2="8"/><path d="M-4 3 q0 -7 8 -7 v-1"/><circle cx="-4" cy="-9" r="2.2" fill="#e2b54a"/><circle cx="-4" cy="9" r="2.2" fill="#e2b54a"/><circle cx="4" cy="-7.5" r="2.2" fill="#e2b54a"/></g>`
    )
  }
  const tx = w / 2
  const throne =
    `<path d="M${tx - 26} ${g} V${g - 50} Q${tx - 26} ${g - 92} ${tx} ${g - 100} Q${tx + 26} ${g - 92} ${tx + 26} ${g - 50} V${g} Z" fill="#7a2a2a" stroke="#c99a3a" stroke-width="2"/>` +
    `<circle cx="${tx}" cy="${g - 86}" r="4" fill="#e2b54a"/>`
  return (
    frame(w, h, '#e2b54a', '#2a1c22', '#1f1a1c') +
    `<g clip-path="url(#card)">` +
    banner(w * 0.26, '#8f2522') +
    banner(w * 0.74, '#2f4a8f') +
    throne +
    col(12) +
    col(w - 34) +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#231b1e"/>` +
    `<path d="M${w / 2 - 34} ${g} L${w / 2 + 34} ${g} L${w / 2 + 60} ${h} L${w / 2 - 60} ${h} Z" fill="#8f2522"/><path d="M${w / 2 - 30} ${g} L${w / 2 - 54} ${h} M${w / 2 + 30} ${g} L${w / 2 + 54} ${h}" stroke="#e2b54a" stroke-width="1.2" opacity=".7"/>` +
    label('Sala do trono') +
    `</g>` +
    border(w, h, '#e2b54a')
  )
}

// ---------- teatro das ilusões do Ilusionista: cortinas e componentes de interface soltos ----------

const teatro = (w: number, h: number) => {
  const g = groundOf(h)
  const curtain = (x: number, flip: boolean) => {
    const cw = Math.min(70, w * 0.2)
    const s = flip ? -1 : 1
    let folds = ''
    for (let i = 0; i < 4; i++) folds += `<path d="M${x + s * (i * cw) / 4} 14 q${s * 4} ${(g - 14) / 2} ${s * 8} ${g - 14}" stroke="#4a2a5e" stroke-width="2" fill="none"/>`
    return `<path d="M${x} 10 H${x + s * cw} Q${x + s * cw * 0.6} ${g * 0.55} ${x + s * cw * 0.9} ${g} H${x} Z" fill="#6a3a86"/>` + folds
  }
  // Os componentes soltos: botão, toggle, slider, checkbox, card e amostras de cor.
  const x0 = Math.min(78, w * 0.22)
  const row = (f: number) => Math.round(28 + (g - 70) * f)
  const float = (d: number, inner: string) => `<g class="flt" style="animation-delay:${d}s"><g class="vanish">${inner}</g></g>`
  const parts =
    float(0, `<rect x="${x0}" y="${row(0)}" width="36" height="12" rx="4" fill="#5b8fd9"/><text x="${x0 + 18}" y="${row(0) + 8.4}" text-anchor="middle" font-size="6.5" font-weight="700" fill="#fff">Enviar</text>`) +
    float(0.7, `<rect x="${x0 + 46}" y="${row(0) + 1}" width="22" height="11" rx="5.5" fill="#5fc7b5"/><circle cx="${x0 + 62}" cy="${row(0) + 6.5}" r="4" fill="#fff"/>`) +
    float(1.4, `<rect x="${x0}" y="${row(0.33)}" width="40" height="30" rx="3" fill="#2b2540" stroke="#b49cf0"/><rect x="${x0 + 4}" y="${row(0.33) + 4}" width="32" height="11" rx="2" fill="#6c5a8a"/><rect x="${x0 + 4}" y="${row(0.33) + 19}" width="26" height="2.4" rx="1" fill="#d8d0f0"/><rect x="${x0 + 4}" y="${row(0.33) + 24}" width="18" height="2.4" rx="1" fill="#a99fc8"/>`) +
    float(0.4, `<line x1="${x0 + 50}" y1="${row(0.36) + 6}" x2="${x0 + 86}" y2="${row(0.36) + 6}" stroke="#a99fc8" stroke-width="2.4" stroke-linecap="round"/><line x1="${x0 + 50}" y1="${row(0.36) + 6}" x2="${x0 + 70}" y2="${row(0.36) + 6}" stroke="#f08fb8" stroke-width="2.4" stroke-linecap="round"/><circle cx="${x0 + 70}" cy="${row(0.36) + 6}" r="4" fill="#fff"/>`) +
    float(1.1, `<rect x="${x0 + 52}" y="${row(0.36) + 16}" width="10" height="10" rx="2" fill="#e9b75c"/><path d="M${x0 + 54} ${row(0.36) + 21} l2.4 2.4 l4 -5" stroke="#2b2540" stroke-width="1.6" fill="none"/>`) +
    float(1.8, ['#f08fb8', '#5fc7b5', '#e9b75c', '#6cc3ec'].map((c, i) => `<circle cx="${x0 + 6 + i * 12}" cy="${row(0.72)}" r="4.5" fill="${c}"/>`).join(''))
  const r = rnd(13)
  const sparks = Array.from({ length: 12 }, (_, i) => `<text class="tw" style="animation-delay:${(i * 0.3).toFixed(1)}s" x="${(30 + r() * (w - 60)).toFixed(0)}" y="${(30 + r() * (g - 60)).toFixed(0)}" font-size="6" fill="#d8c8ff">✦</text>`).join('')
  return (
    frame(w, h, '#b49cf0', '#1d1830', '#241c2c') +
    `<g clip-path="url(#card)">` +
    sparks +
    parts +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#3a2a22"/>` +
    Array.from({ length: Math.ceil(w / 22) }, (_, i) => `<line x1="${i * 22}" y1="${g}" x2="${i * 22}" y2="${h}" stroke="#2c201a"/>`).join('') +
    `<rect x="0" y="${g}" width="${w}" height="3" fill="#d9b26a" opacity=".5"/>` +
    curtain(0, false) +
    curtain(w, true) +
    `<path d="M0 0 H${w} V18 Q${w * 0.75} 30 ${w / 2} 20 Q${w * 0.25} 30 0 18 Z" fill="#7a4496"/>` +
    label('Teatro das ilusões') +
    `</g>` +
    border(w, h, '#b49cf0')
  )
}

// ---------- torre do Sábio: janela de estrelas, telescópio, mapa celeste e a mesa com vela ----------

const torre = (w: number, h: number) => {
  const g = groundOf(h)
  const wx = w / 2
  const wr = Math.min(52, g * 0.3)
  const wy = 40 + wr
  const r = rnd(17)
  const winStars = Array.from({ length: 10 }, (_, i) => {
    const a = r() * Math.PI * 2
    const d = r() * (wr - 6)
    return `<circle class="tw" style="animation-delay:${(i * 0.4).toFixed(1)}s" cx="${(wx + Math.cos(a) * d).toFixed(1)}" cy="${(wy + Math.sin(a) * d).toFixed(1)}" r="${(0.6 + r() * 0.7).toFixed(2)}" fill="#ece9df"/>`
  }).join('')
  const chart =
    `<g transform="translate(${w * 0.16} ${g * 0.38})"><rect x="-22" y="-26" width="44" height="52" rx="2" fill="#d6cfb4" opacity=".85"/><circle r="16" fill="none" stroke="#6c5a8a" stroke-width="1"/>` +
    `<path d="M-10 -6 L-2 -10 L6 -2 L10 8 M-2 -10 L-4 6" stroke="#2f5d62" stroke-width="1" fill="none"/>` +
    [[-10, -6], [-2, -10], [6, -2], [10, 8], [-4, 6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#2f5d62"/>`).join('') +
    `</g>`
  const scope =
    `<g transform="translate(${w - 46} ${g})"><line x1="0" y1="0" x2="10" y2="-34" stroke="#6b4a2e" stroke-width="2.4"/><line x1="22" y1="0" x2="10" y2="-34" stroke="#6b4a2e" stroke-width="2.4"/>` +
    `<rect x="-8" y="-52" width="36" height="9" rx="3" fill="#c99a3a" transform="rotate(-28 10 -40)"/></g>`
  const desk =
    `<rect x="10" y="${g - 24}" width="64" height="5" rx="1" fill="#5a4636"/><rect x="14" y="${g - 19}" width="4" height="19" fill="#4a392c"/><rect x="66" y="${g - 19}" width="4" height="19" fill="#4a392c"/>` +
    [0, 1, 2].map(i => `<rect x="${44 + i}" y="${g - 30 - i * 5}" width="22" height="5" rx="1" fill="${['#6c5a8a', '#3f6a8a', '#8a5a4a'][i]}"/>`).join('') +
    `<rect x="22" y="${g - 36}" width="5" height="12" fill="#e9e2c8"/><path class="flk" d="M24.5 ${g - 37} c-3 -4 0 -7 0 -9 c2 3 3 5 0 9 Z" fill="#f2a54a"/><ellipse class="halo" cx="24.5" cy="${g - 41}" rx="18" ry="12" fill="url(#glow)"/>`
  return (
    frame(w, h, '#2f8a8f', '#24222a', '#1f1c1a') +
    `<g clip-path="url(#card)">` +
    Array.from({ length: Math.ceil((g - 28) / 18) }, (_, row) =>
      Array.from({ length: Math.ceil(w / 36) + 1 }, (_, i) => `<rect x="${i * 36 - (row % 2) * 18}" y="${28 + row * 18}" width="34" height="16" rx="2" fill="none" stroke="#33302e" stroke-opacity=".7"/>`).join(''),
    ).join('') +
    `<circle cx="${wx}" cy="${wy}" r="${wr + 4}" fill="#4a3d30"/><circle cx="${wx}" cy="${wy}" r="${wr}" fill="#141b2e"/>` +
    winStars +
    `<circle cx="${wx + wr * 0.4}" cy="${wy - wr * 0.35}" r="7" fill="#e9e2c8" opacity=".9"/><circle cx="${wx + wr * 0.4 + 4}" cy="${wy - wr * 0.35 - 2}" r="6.4" fill="#141b2e"/>` +
    `<line x1="${wx - wr}" y1="${wy}" x2="${wx + wr}" y2="${wy}" stroke="#4a3d30" stroke-width="3"/><line x1="${wx}" y1="${wy - wr}" x2="${wx}" y2="${wy + wr}" stroke="#4a3d30" stroke-width="3"/>` +
    chart +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#1e1b19"/>` +
    desk +
    scope +
    label('Torre do sábio') +
    `</g>` +
    border(w, h, '#2f8a8f')
  )
}

// ---------- floresta da lua do Caçador: árvores roxas, fogos-fátuos e cogumelos que brilham ----------

const floresta = (w: number, h: number) => {
  const g = groundOf(h)
  const r = rnd(29)
  const tree = (x: number, s: number, color: string) =>
    `<g transform="translate(${x} ${g}) scale(${s})"><rect x="-5" y="-70" width="10" height="70" fill="${color}"/>` +
    `<ellipse cx="0" cy="-82" rx="30" ry="22" fill="${color}"/><ellipse cx="-18" cy="-70" rx="18" ry="13" fill="${color}"/><ellipse cx="18" cy="-68" rx="18" ry="13" fill="${color}"/></g>`
  const wisps = Array.from({ length: 8 }, (_, i) => `<circle class="mote" style="animation-delay:${(i * 0.8).toFixed(1)}s" cx="${(20 + r() * (w - 40)).toFixed(0)}" cy="${(g - 4 - r() * 30).toFixed(0)}" r="1.6" fill="${i % 2 ? '#8fd3ff' : '#c9a8ff'}"/>`).join('')
  const shroom = (x: number, c: string) =>
    `<rect x="${x - 1.2}" y="${g - 7}" width="2.4" height="7" fill="#d8d0e8"/><path d="M${x - 6} ${g - 6} q6 -9 12 0 Z" fill="${c}"/><ellipse class="glw" cx="${x}" cy="${g - 6}" rx="9" ry="5" fill="${c}" opacity=".25"/>`
  return (
    frame(w, h, '#8fd3ff', '#1a1838', '#241d36') +
    `<g clip-path="url(#card)">` +
    stars(w, 24, g * 0.35, 12, 23) +
    `<circle cx="${w * 0.68}" cy="48" r="28" fill="#e9e6ff" opacity=".1"/><circle cx="${w * 0.68}" cy="48" r="17" fill="#ece9ff" opacity=".85"/>` +
    tree(w * 0.12, Math.min(1.2, g / 150), '#2a2450') +
    tree(w * 0.5, Math.min(1, g / 170), '#2a2450') +
    tree(w * 0.9, Math.min(1.25, g / 140), '#2a2450') +
    tree(w * 0.3, Math.min(0.9, g / 190), '#1c1838') +
    tree(w * 0.75, Math.min(0.85, g / 200), '#1c1838') +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#1a1630"/><line x1="0" y1="${g + 0.5}" x2="${w}" y2="${g + 0.5}" stroke="#8fd3ff" stroke-opacity=".18"/>` +
    shroom(30, '#8fd3ff') +
    shroom(44, '#c9a8ff') +
    shroom(w - 40, '#8fd3ff') +
    wisps +
    label('Floresta da lua') +
    `</g>` +
    border(w, h, '#8fd3ff')
  )
}

// ---------- beco do Ladino: paredes de tijolo com cartazes que são páginas da web e a lanterna ----------

const beco = (w: number, h: number) => {
  const g = groundOf(h)
  const wallW = w * 0.3
  const poster = (x: number, y: number, pw: number, ph: number, rot: number, tone: string) =>
    `<g transform="rotate(${rot} ${x + pw / 2} ${y + ph / 2})"><rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="2" fill="#d8d4cc" opacity=".85"/><rect x="${x}" y="${y}" width="${pw}" height="5" rx="2" fill="#8a877f"/>` +
    `<circle cx="${x + 3}" cy="${y + 2.5}" r=".9" fill="#ee7a8e"/><circle cx="${x + 6}" cy="${y + 2.5}" r=".9" fill="#e6b450"/><circle cx="${x + 9}" cy="${y + 2.5}" r=".9" fill="#8fc46a"/>` +
    `<rect x="${x + 4}" y="${y + 9}" width="${pw * 0.6}" height="3" rx="1" fill="${tone}"/><rect x="${x + 4}" y="${y + 15}" width="${pw * 0.75}" height="2" rx="1" fill="#8a877f"/><rect x="${x + 4}" y="${y + 20}" width="${pw * 0.5}" height="6" rx="1.5" fill="#5b8fd9"/></g>`
  const bricks = (x0: number, x1: number) =>
    Array.from({ length: Math.ceil((g - 10) / 12) }, (_, row) =>
      Array.from({ length: Math.ceil((x1 - x0) / 24) + 1 }, (_, i) => `<rect x="${x0 + i * 24 - (row % 2) * 12}" y="${10 + row * 12}" width="22" height="10" rx="1.5" fill="none" stroke="#3a3030" stroke-opacity=".8"/>`).join(''),
    ).join('')
  return (
    frame(w, h, '#e6b450', '#16182a', '#1c1a22') +
    `<g clip-path="url(#card)">` +
    stars(w, 22, 60, 8, 31) +
    `<path d="M${w * 0.5 + 10} 26 a9 9 0 1 0 9 9 a7 7 0 1 1 -9 -9 Z" fill="#e9e2c8" opacity=".85"/>` +
    // o fundo do beco
    `<rect x="${wallW}" y="${g * 0.45}" width="${w - 2 * wallW}" height="${g - g * 0.45}" fill="#2a2430"/>` +
    poster(w * 0.42, g * 0.55, 30, 32, -3, '#6c5a8a') +
    // paredes laterais
    `<path d="M0 0 H${wallW} L${wallW} ${g} H0 Z" fill="#2c2426"/><path d="M${w} 0 H${w - wallW} L${w - wallW} ${g} H${w} Z" fill="#2c2426"/>` +
    `<g clip-path="url(#card)">${bricks(0, wallW)}${bricks(w - wallW, w)}</g>` +
    poster(10, g * 0.3, 40, 44, -4, '#c4344f') +
    poster(w - wallW + 14, g * 0.4, 38, 40, 5, '#3d9a5a') +
    // a lanterna pendurada
    `<line x1="${w - wallW}" y1="${g * 0.18}" x2="${w - wallW - 22}" y2="${g * 0.18}" stroke="#3a3030" stroke-width="2"/><line x1="${w - wallW - 18}" y1="${g * 0.18}" x2="${w - wallW - 18}" y2="${g * 0.18 + 8}" stroke="#3a3030"/>` +
    `<rect x="${w - wallW - 24}" y="${g * 0.18 + 8}" width="12" height="14" rx="2" fill="#e6b450"/><ellipse class="halo" cx="${w - wallW - 18}" cy="${g * 0.18 + 15}" rx="34" ry="26" fill="url(#glow)"/>` +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#1a1820"/>` +
    `<ellipse cx="${w * 0.6}" cy="${g + (h - g) * 0.55}" rx="40" ry="5" fill="#e6b450" opacity=".12"/>` +
    label('Beco') +
    `</g>` +
    border(w, h, '#e6b450')
  )
}

// ---------- forja do Artífice: fornalha, chaminé, caixas do deploy e a esteira ----------

const forja = (w: number, h: number) => {
  const g = groundOf(h)
  const bricks = Array.from({ length: Math.ceil((g - 26) / 16) }, (_, row) =>
    Array.from({ length: Math.ceil(w / 34) + 1 }, (_, i) => `<rect x="${i * 34 - (row % 2) * 17}" y="${26 + row * 16}" width="32" height="14" rx="2" fill="none" stroke="#3a322b" stroke-opacity=".7"/>`).join(''),
  ).join('')
  const fh = Math.min(70, g * 0.45)
  const crate = (x: number, y: number) =>
    `<rect x="${x}" y="${y}" width="24" height="20" rx="1.5" fill="#8a6a45" stroke="#5a4636"/><path d="M${x} ${y} l24 20 M${x + 24} ${y} l-24 20" stroke="#6b4f33" stroke-width="1.2"/>` +
    `<path d="M${x + 12} ${y + 4} l-4 5 h2.6 v5 h2.8 v-5 h2.6 Z" fill="#8fc46a"/>`
  return (
    frame(w, h, '#ffb35c', '#2b2521', '#221e1b') +
    `<g clip-path="url(#card)">` +
    bricks +
    `<rect x="26" y="0" width="16" height="${g - fh}" fill="#3a2f27"/>` +
    `<path d="M8 ${g} V${g - fh + 24} a26 26 0 0 1 52 0 V${g} Z" fill="#3a2f27" stroke="#4d4036" stroke-width="2"/>` +
    `<path d="M18 ${g} V${g - fh + 30} a16 16 0 0 1 32 0 V${g} Z" fill="#7a3a1c"/>` +
    `<ellipse class="halo" cx="34" cy="${g - 20}" rx="44" ry="32" fill="url(#glow)"/>` +
    `<g transform="translate(34 ${g - 2}) scale(.85)"><path class="flk" d="M-11 0 C-13 -14 -4 -18 -3 -30 C3 -20 12 -16 11 0 Z" fill="#e8743b"/><path class="flk" style="animation-delay:.3s" d="M-6 0 C-7 -9 -1 -12 0 -20 C4 -13 8 -9 6 0 Z" fill="#ffd27a"/></g>` +
    crate(w - 60, g - 20) +
    crate(w - 34, g - 20) +
    crate(w - 47, g - 40) +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#1f1b18"/>` +
    `<line x1="70" y1="${g + 6}" x2="${w - 70}" y2="${g + 6}" stroke="#55565e" stroke-width="4" stroke-dasharray="6 5" class="dash"/>` +
    label('Forja') +
    `</g>` +
    border(w, h, '#ffb35c')
  )
}

// ---------- santuário do Oráculo: colunas antigas, braseiros e sinais flutuando ----------

const santuario = (w: number, h: number) => {
  const g = groundOf(h)
  const ch = Math.min(150, g * 0.7)
  const col = (x: number, broken: boolean) => {
    const top = g - (broken ? ch * 0.6 : ch)
    return (
      `<rect x="${x}" y="${top}" width="20" height="${g - top}" fill="#8a8798"/>` +
      [5, 10, 15].map(dx => `<line x1="${x + dx}" y1="${top + 4}" x2="${x + dx}" y2="${g - 6}" stroke="#6e6b7c"/>`).join('') +
      (broken ? `<path d="M${x} ${top} l5 -5 l4 4 l6 -6 l5 5 Z" fill="#8a8798"/>` : `<rect x="${x - 4}" y="${top - 6}" width="28" height="6" rx="1" fill="#9a97a8"/>`) +
      `<rect x="${x - 4}" y="${g - 6}" width="28" height="6" fill="#9a97a8"/>`
    )
  }
  const brazier = (x: number) =>
    `<path d="M${x - 8} ${g} l8 -22 l8 22 M${x} ${g} v-22" stroke="#6b4a2e" stroke-width="1.6" fill="none"/><path d="M${x - 10} ${g - 24} h20 l-4 6 h-12 Z" fill="#c99a3a"/>` +
    `<path class="flk" d="M${x} ${g - 26} c-6 -6 -1 -12 0 -16 c4 5 6 10 0 16 Z" fill="#8fd3ff"/><ellipse class="halo" cx="${x}" cy="${g - 32}" rx="18" ry="14" fill="url(#cool)"/>` +
    [0, 1.2, 2.4].map(d => `<circle class="steam" style="animation-delay:${d}s" cx="${x}" cy="${g - 44}" r="3" fill="#c9c4dd"/>`).join('')
  const sigils = ['✦', '☽', '◇', '✧'].map((s, i) => `<text class="lit" style="animation-delay:${i}s" x="${w * (0.3 + i * 0.13)}" y="${40 + (i % 2) * 18}" font-size="11" fill="#8fd3ff">${s}</text>`).join('')
  return (
    frame(w, h, '#8fd3ff', '#1c1830', '#241f2a') +
    `<g clip-path="url(#card)">` +
    stars(w, 24, g * 0.4, 12, 41) +
    sigils +
    col(16, false) +
    col(56, true) +
    col(w - 36, false) +
    `<rect x="12" y="${g - ch - 12}" width="68" height="7" rx="1" fill="#9a97a8"/>` +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#22202a"/>` +
    brazier(w * 0.3) +
    brazier(w * 0.74) +
    label('Santuário') +
    `</g>` +
    border(w, h, '#8fd3ff')
  )
}

// ---------- muralha de pedra do Geomante: a muralha, telhados verdes por trás e pilares de terra ----------

const muralha = (w: number, h: number) => {
  const g = groundOf(h)
  const wallTop = g - Math.min(110, g * 0.5)
  const roof = (cx: number, rw: number, y: number) =>
    `<path d="M${cx - rw / 2 - 8} ${y} Q${cx - rw / 2} ${y - 4} ${cx - rw / 2 + 6} ${y - 10} H${cx + rw / 2 - 6} Q${cx + rw / 2} ${y - 4} ${cx + rw / 2 + 8} ${y} Z" fill="#2f6a4a"/>` +
    `<rect x="${cx - rw / 2 + 8}" y="${y}" width="${rw - 16}" height="10" fill="#5a3a2a"/><path d="M${cx} ${y - 10} v-6" stroke="#e2b54a" stroke-width="2"/>`
  const blocks = Array.from({ length: Math.ceil((g - wallTop) / 14) }, (_, row) =>
    Array.from({ length: Math.ceil(w / 30) + 1 }, (_, i) => `<rect x="${i * 30 - (row % 2) * 15}" y="${wallTop + row * 14}" width="28" height="12" rx="1" fill="none" stroke="#5a5444" stroke-opacity=".8"/>`).join(''),
  ).join('')
  // Os bancos de dados de pedra: três discos empilhados.
  const bigDb = (x: number, rx: number, hh: number) => {
    const ry = rx * 0.32
    let out = ''
    for (let i = 0; i < 3; i++) {
      const y = g - (i + 1) * (hh + 2)
      out +=
        `<path d="M${x - rx} ${y} v${hh} a${rx} ${ry} 0 0 0 ${2 * rx} 0 v${-hh} Z" fill="#77684f"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#9a8a6e"/>` +
        `<path d="M${x - rx} ${y + hh} a${rx} ${ry} 0 0 0 ${2 * rx} 0" stroke="#5a4e3a" stroke-width="1.2" fill="none"/>`
    }
    return out
  }
  return (
    frame(w, h, '#9bc46a', '#2a3a40', '#4a3c2a') +
    `<g clip-path="url(#card)">` +
    roof(w * 0.3, 70, wallTop - 4) +
    roof(w * 0.72, 90, wallTop - 10) +
    `<rect x="0" y="${wallTop}" width="${w}" height="${g - wallTop}" fill="#6a6450"/>` +
    blocks +
    Array.from({ length: Math.ceil(w / 22) }, (_, i) => `<rect x="${i * 22}" y="${wallTop - 8}" width="13" height="8" fill="#6a6450"/>`).join('') +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#3a3226"/>` +
    Array.from({ length: Math.ceil(w / 28) }, (_, i) => `<line x1="${i * 28}" y1="${g}" x2="${i * 28 - 8}" y2="${h}" stroke="#2c2620"/>`).join('') +
    bigDb(34, 22, Math.min(16, g * 0.08)) +
    bigDb(w - 32, 18, Math.min(13, g * 0.065)) +
    label('Muralha de pedra') +
    `</g>` +
    border(w, h, '#9bc46a')
  )
}

// ---------- laboratório do Alquimista: prateleira de frascos ligados por tubos e o caldeirão ----------

const laboratorio = (w: number, h: number) => {
  const g = groundOf(h)
  const sy = Math.max(58, Math.min(70, g * 0.35))
  const jar = (x: number, c: string) =>
    `<rect x="${x}" y="${sy - 18}" width="12" height="18" rx="3" fill="${c}" opacity=".7"/><rect x="${x + 2}" y="${sy - 22}" width="8" height="4" rx="1" fill="#8a7a6a"/><ellipse class="glw" cx="${x + 6}" cy="${sy - 9}" rx="9" ry="10" fill="${c}" opacity=".15"/>`
  const jars = ['#6cb6ec', '#a8d07a', '#e9d36a', '#c9a8ff', '#ee7a8e'].map((c, i) => jar(20 + i * 22, c)).join('')
  const pipes =
    `<path d="M26 ${sy - 22} V${sy - 34} H${w - 60} V${g - 40}" stroke="#7a6a58" stroke-width="4" fill="none"/>` +
    `<path d="M26 ${sy - 22} V${sy - 34} H${w - 60} V${g - 40}" stroke="#a8d07a" stroke-width="1.6" fill="none" stroke-dasharray="4 6" class="dash"/>` +
    `<path d="M70 ${sy - 22} V${sy - 34}" stroke="#7a6a58" stroke-width="4"/>`
  const cx = w - 60
  const cauldron =
    `<path d="M${cx - 22} ${g - 30} h44 q0 28 -22 28 q-22 0 -22 -28 Z" fill="#2c2a30" stroke="#4a4650"/><ellipse cx="${cx}" cy="${g - 30}" rx="22" ry="5" fill="#7ac74f"/>` +
    [0, 0.8, 1.6].map(d => `<circle class="mote" style="animation-delay:${d}s" cx="${cx - 8 + d * 8}" cy="${g - 32}" r="2.2" fill="#a8e070"/>`).join('') +
    `<g transform="translate(${cx} ${g}) scale(.6)"><path class="flk" d="M-11 0 C-13 -14 -4 -18 -3 -30 C3 -20 12 -16 11 0 Z" fill="#e8743b"/></g>`
  const herbs = [w * 0.42, w * 0.5].map((x, i) => `<line x1="${x}" y1="0" x2="${x}" y2="${20 + i * 6}" stroke="#5a4636"/><path d="M${x} ${20 + i * 6} q-6 6 0 14 q6 -8 0 -14 Z" fill="#5a7a4a"/>`).join('')
  return (
    frame(w, h, '#a8d07a', '#1e2a22', '#1f1d1a') +
    `<g clip-path="url(#card)">` +
    herbs +
    `<rect x="12" y="${sy}" width="${w * 0.36}" height="4" fill="#5a4636"/>` +
    jars +
    pipes +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#1c1a18"/>` +
    cauldron +
    label('Laboratório') +
    `</g>` +
    border(w, h, '#a8d07a')
  )
}

// ---------- tenda da Cartomante: cortinas, céu com constelações, astrolábio e a mesinha das cartas ----------

const tenda = (w: number, h: number) => {
  const g = groundOf(h)
  const consts =
    `<path d="M${w * 0.36} 50 L${w * 0.44} 40 L${w * 0.52} 52 L${w * 0.6} 44 M${w * 0.44} 40 L${w * 0.48} 30" stroke="#c9a8ff" stroke-opacity=".5" fill="none"/>` +
    [
      [0.36, 50],
      [0.44, 40],
      [0.52, 52],
      [0.6, 44],
      [0.48, 30],
    ]
      .map(([x, y]) => `<circle class="tw" cx="${w * (x as number)}" cy="${y}" r="1.6" fill="#fff6c8"/>`)
      .join('')
  const ay = Math.max(36, Math.min(70, g * 0.28))
  const ar = Math.min(30, g * 0.19)
  const astro =
    `<g class="spin"><ellipse cx="${w / 2}" cy="${ay}" rx="${ar}" ry="${ar}" fill="none" stroke="#e2b54a" stroke-opacity=".6" stroke-width="1.4"/><circle cx="${w / 2 + ar}" cy="${ay}" r="2.4" fill="#e2b54a"/></g>` +
    `<g class="spinr"><ellipse cx="${w / 2}" cy="${ay}" rx="${ar * 0.74}" ry="${ar * 0.74}" fill="none" stroke="#c9a8ff" stroke-opacity=".6" stroke-width="1.2" stroke-dasharray="3 3"/><circle cx="${w / 2}" cy="${ay - ar * 0.74}" r="2" fill="#c9a8ff"/></g>`
  const drape = (flip: boolean) => {
    const s = flip ? -1 : 1
    const x0 = flip ? w : 0
    return `<path d="M${x0} 0 H${x0 + s * w * 0.5} Q${x0 + s * w * 0.2} ${g * 0.3} ${x0 + s * w * 0.18} ${g} H${x0} Z" fill="#4a2a6a"/><path d="M${x0 + s * w * 0.5} 0 Q${x0 + s * w * 0.2} ${g * 0.3} ${x0 + s * w * 0.18} ${g}" stroke="#e2b54a" stroke-width="2" fill="none"/>`
  }
  // O 33 desenhado com estrelas e ligado de leve, dentro do astrolábio.
  const three = [
    [-6, -8],
    [0, -8],
    [1, -3],
    [-4, 0],
    [1, 3],
    [0, 8],
    [-6, 8],
  ].map(([x, y]) => [(x as number) * 1.5 * (ar / 30), (y as number) * 1.3 * (ar / 30)])
  const thirty = [-5.8 * (ar / 30), 9.2 * (ar / 30)]
    .map(
      dx =>
        `<polyline points="${three.map(([x, y]) => `${w / 2 + dx + (x as number)},${ay + (y as number)}`).join(' ')}" stroke="#fff6c8" stroke-width=".9" fill="none" class="trace"/>` +
        three.map(([x, y]) => `<circle class="tw" cx="${w / 2 + dx + (x as number)}" cy="${ay + (y as number)}" r="1.6" fill="#fff6c8"/>`).join(''),
    )
    .join('')
  // A foice da Sciel, pequena, do tamanho do Clawd, encostada no canto direito: haste fina, lâmina curva em cada ponta e a treliça de quadradinhos.
  const scythe = (() => {
    const L = Math.min(84, g * 0.5)
    const lattice = (cx: number, cy: number) =>
      [-4, 0, 4]
        .flatMap(dx => [-4, 0, 4].map(dy => (dx === 0 && dy === 0 ? '' : `<rect x="${cx + dx - 1.6}" y="${cy + dy - 1.6}" width="3.2" height="3.2" fill="#1f1b18" stroke="#c9a070" stroke-width=".8"/>`)))
        .join('')
    const inner =
      `<line x1="24" y1="80" x2="78" y2="24" stroke="#3a322a" stroke-width="2.6"/><line x1="24" y1="80" x2="78" y2="24" stroke="#9a8a70" stroke-width=".7"/>` +
      [38, 51, 64].map(p => `<circle cx="${p}" cy="${104 - p}" r="1.6" fill="#c9a070"/>`).join('') +
      lattice(81, 20) +
      lattice(20, 83) +
      `<path d="M84 13 C70 0 50 -1 32 8 C52 4 64 8 75 18 Z" fill="#2a2622" stroke="#c9a070" stroke-width="1"/><path d="M72 13 l6 -3 l-2 5 Z" fill="#c9a070"/>` +
      `<path d="M17 89 C30 101 50 102 68 93 C48 97 36 92 25 82 Z" fill="#2a2622" stroke="#c9a070" stroke-width="1"/><path d="M28 91 l-6 3 l2 -5 Z" fill="#c9a070"/>`
    return `<g transform="translate(${w - 26} ${g}) rotate(-30) scale(${(L / 100).toFixed(3)}) translate(-24 -86)">${inner}</g>`
  })()
  const tx = w - 92
  const table =
    `<rect x="${tx - 20}" y="${g - 14}" width="3" height="14" fill="#3a2440"/><rect x="${tx + 17}" y="${g - 14}" width="3" height="14" fill="#3a2440"/><rect x="${tx - 1.5}" y="${g - 14}" width="3" height="14" fill="#33203a"/>` +
    `<ellipse cx="${tx}" cy="${g - 22}" rx="28" ry="6" fill="#6a3a86"/><path d="M${tx - 28} ${g - 22} v10 q28 8 56 0 v-10" fill="#5a2f74"/>` +
    [-14, 0, 14].map((dx, i) => `<rect x="${tx + dx - 4}" y="${g - 27}" width="8" height="10" rx="1" fill="${i === 1 ? '#f4efe2' : '#3a2d6b'}" stroke="#e2b54a" stroke-width=".6" transform="rotate(${dx / 2} ${tx + dx} ${g - 22})"/>`).join('') +
    `<rect x="${tx - 24}" y="${g - 36}" width="4" height="9" fill="#e9e2c8"/><path class="flk" d="M${tx - 22} ${g - 37} c-2 -3 0 -5 0 -6 c2 2 2 4 0 6 Z" fill="#f2a54a"/>`
  return (
    frame(w, h, '#c9a8ff', '#141634', '#2a1f3a') +
    `<g clip-path="url(#card)">` +
    stars(w, 20, g * 0.6, 18, 47) +
    consts +
    astro +
    thirty +
    drape(false) +
    drape(true) +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#2a1d36"/>` +
    table +
    scythe +
    label('Tenda das cartas') +
    `</g>` +
    border(w, h, '#c9a8ff')
  )
}

// ---------- salão arcano do Invocador: janelas em arco, cristais flutuando, velas e o grande círculo de invocação ----------

const salao = (w: number, h: number) => {
  const g = groundOf(h)
  const ah = Math.min(110, g * 0.5)
  const arch = (x: number) =>
    `<path d="M${x - 16} ${g - 18} V${g - ah + 16} a16 16 0 0 1 32 0 V${g - 18} Z" fill="#1d2244" stroke="#3a3260" stroke-width="3"/>` +
    `<line x1="${x}" y1="${g - ah}" x2="${x}" y2="${g - 18}" stroke="#3a3260" stroke-width="2"/><circle cx="${x + 6}" cy="${g - ah + 14}" r="3" fill="#dfe6ff" opacity=".7"/>`
  const crystal = (x: number, y: number, d: number) =>
    `<g class="flt" style="animation-delay:${d}s"><path d="M${x} ${y - 9} l5 9 l-5 9 l-5 -9 Z" fill="#c4b5fd"/><circle class="glw" cx="${x}" cy="${y}" r="11" fill="#a78bfa" opacity=".25"/></g>`
  const candle = (x: number) =>
    `<rect x="${x - 2.5}" y="${g - 12}" width="5" height="12" fill="#e9e2c8"/><path class="flk" d="M${x} ${g - 13} c-3 -4 0 -7 0 -9 c2 3 3 5 0 9 Z" fill="#f2a54a"/><ellipse class="halo" cx="${x}" cy="${g - 17}" rx="12" ry="9" fill="url(#glow)"/>`
  const cy = g + (h - g) / 2
  const rx = w * 0.42
  const ry = (h - g) * 0.4
  const circle =
    `<ellipse cx="${w / 2}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#a78bfa" fill-opacity=".08" stroke="#a78bfa" stroke-opacity=".7" stroke-width="1.6"/>` +
    `<ellipse cx="${w / 2}" cy="${cy}" rx="${rx * 0.78}" ry="${ry * 0.78}" fill="none" stroke="#c4b5fd" stroke-opacity=".5" stroke-dasharray="6 4" class="dash"/>` +
    `<path d="M${w / 2} ${cy - ry * 0.74} L${w / 2 + rx * 0.64} ${cy + ry * 0.4} L${w / 2 - rx * 0.64} ${cy + ry * 0.4} Z" fill="none" stroke="#a78bfa" stroke-opacity=".45"/>`
  return (
    frame(w, h, '#a78bfa', '#151328', '#221c33') +
    `<g clip-path="url(#card)">` +
    Array.from({ length: Math.ceil((g - 10) / 18) }, (_, row) =>
      Array.from({ length: Math.ceil(w / 36) + 1 }, (_, i) => `<rect x="${i * 36 - (row % 2) * 18}" y="${10 + row * 18}" width="34" height="16" rx="2" fill="none" stroke="#2a2440"/>`).join(''),
    ).join('') +
    arch(w * 0.22) +
    arch(w * 0.5) +
    arch(w * 0.78) +
    crystal(w * 0.36, g * 0.32, 0) +
    crystal(w * 0.64, g * 0.26, 1) +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#1a1626"/>` +
    circle +
    candle(18) +
    candle(w - 18) +
    label('Salão arcano') +
    `</g>` +
    border(w, h, '#a78bfa')
  )
}

// ---------- câmara do tempo do Cronomante: a ampulheta gigante, engrenagens e o grande relógio ----------

const camara = (w: number, h: number) => {
  const g = groundOf(h)
  const gear = (x: number, y: number, r: number, cls: string) =>
    `<g class="${cls}"><circle cx="${x}" cy="${y}" r="${r}" fill="#8a6a35" opacity=".55"/>` +
    Array.from({ length: 8 }, (_, i) => `<rect x="${x - 2.5}" y="${y - r - 4}" width="5" height="${8}" fill="#8a6a35" opacity=".55" transform="rotate(${i * 45} ${x} ${y})"/>`).join('') +
    `<circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="#2a2016"/></g>`
  const hx = w * 0.78
  const hh = Math.min(120, g * 0.55)
  const top = g - hh
  const glass =
    `<rect x="${hx - 20}" y="${top - 4}" width="40" height="5" rx="2" fill="#c98a3a"/><rect x="${hx - 20}" y="${g - 6}" width="40" height="5" rx="2" fill="#c98a3a"/>` +
    `<path d="M${hx - 16} ${top} L${hx + 16} ${top} L${hx + 3} ${top + hh / 2} L${hx + 16} ${g - 6} L${hx - 16} ${g - 6} L${hx - 3} ${top + hh / 2} Z" fill="#e8f0f4" opacity=".15" stroke="#e8f0f4" stroke-opacity=".5"/>` +
    `<path d="M${hx - 12} ${top + 6} L${hx + 12} ${top + 6} L${hx} ${top + hh / 2 - 4} Z" fill="#e8c06a" opacity=".8"/><path d="M${hx - 14} ${g - 7} L${hx + 14} ${g - 7} L${hx} ${g - hh * 0.25} Z" fill="#e8c06a" opacity=".8"/>` +
    `<line x1="${hx}" y1="${top + hh / 2 - 4}" x2="${hx}" y2="${g - hh * 0.25}" stroke="#e8c06a" stroke-width="1.6" stroke-dasharray="2 2" class="dash"/>`
  const cy = Math.min(70, g * 0.34)
  const clock =
    `<circle cx="${w * 0.32}" cy="${cy}" r="28" fill="#2a2016" stroke="#d9a95a" stroke-width="2"/>` +
    Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6
      return `<line x1="${w * 0.32 + Math.cos(a) * 22}" y1="${cy + Math.sin(a) * 22}" x2="${w * 0.32 + Math.cos(a) * 26}" y2="${cy + Math.sin(a) * 26}" stroke="#d9a95a" stroke-width="1.4"/>`
    }).join('') +
    `<g class="spin" style="transform-origin:${w * 0.32}px ${cy}px;transform-box:view-box"><line x1="${w * 0.32}" y1="${cy}" x2="${w * 0.32}" y2="${cy - 20}" stroke="#ffe08a" stroke-width="2"/></g>`
  return (
    frame(w, h, '#d9a95a', '#3a2a1a', '#2a2016') +
    `<g clip-path="url(#card)">` +
    gear(28, 40, 14, 'spin') +
    gear(w - 30, 30, 10, 'spinr') +
    clock +
    glass +
    `<path d="M0 ${g} Q${w * 0.25} ${g - 10} ${w * 0.5} ${g} T${w} ${g - 4} V${h} H0 Z" fill="#8a6a35"/>` +
    `<rect x="0" y="${g + 4}" width="${w}" height="${h - g}" fill="#6a5028"/>` +
    [0, 1, 2, 3].map(d => `<circle class="mote" style="animation-delay:${d}s" cx="${w * (0.2 + d * 0.15)}" cy="${g - 4}" r="1.2" fill="#ffe08a"/>`).join('') +
    label('Câmara do tempo') +
    `</g>` +
    border(w, h, '#d9a95a')
  )
}

// ---------- portal do Paladino: o arco de pedra com runas douradas, a porta fechada com luz vazando, tochas e estandartes ----------

const portal = (w: number, h: number) => {
  const g = groundOf(h)
  const pw = Math.min(110, w * 0.32)
  const ph = Math.min(150, g * 0.72)
  const px = w / 2
  const archOut = `M${px - pw / 2 - 12} ${g} V${g - ph + pw / 2} a${pw / 2 + 12} ${pw / 2 + 12} 0 0 1 ${pw + 24} 0 V${g} Z`
  const archIn = `M${px - pw / 2} ${g} V${g - ph + pw / 2} a${pw / 2} ${pw / 2} 0 0 1 ${pw} 0 V${g} Z`
  const runes = Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI + (i * Math.PI) / 6
    return `<text class="lit" style="animation-delay:${i * 0.4}s" x="${(px + Math.cos(a) * (pw / 2 + 6)).toFixed(1)}" y="${(g - ph + pw / 2 + Math.sin(a) * (pw / 2 + 6) + 3).toFixed(1)}" text-anchor="middle" font-size="7" fill="#f2c14e">✦</text>`
  }).join('')
  const door =
    `<path d="${archIn}" fill="#ffe08a" opacity=".35" class="glw"/>` +
    `<path d="M${px - pw / 2 + 4} ${g} V${g - ph + pw / 2 + 2} a${pw / 2 - 4} ${pw / 2 - 4} 0 0 1 ${pw - 8} 0 V${g} Z" fill="#5a3a24"/>` +
    [0.3, 0.55, 0.8].map(f => `<rect x="${px - pw / 2 + 4}" y="${g - ph * f}" width="${pw - 8}" height="4" fill="#3a3e48"/>`).join('') +
    `<line x1="${px}" y1="${g - ph + 6}" x2="${px}" y2="${g}" stroke="#3a2416" stroke-width="2"/><circle cx="${px - 8}" cy="${g - ph * 0.42}" r="3" fill="none" stroke="#c9ccd6" stroke-width="1.6"/><circle cx="${px + 8}" cy="${g - ph * 0.42}" r="3" fill="none" stroke="#c9ccd6" stroke-width="1.6"/>`
  const torch = (x: number) =>
    `<rect x="${x - 2}" y="${g * 0.45}" width="4" height="12" fill="#6b4a2e"/><path class="flk" d="M${x} ${g * 0.45 - 1} c-4 -5 0 -9 0 -12 c3 4 4 7 0 12 Z" fill="#f2a54a"/><ellipse class="halo" cx="${x}" cy="${g * 0.45 - 6}" rx="18" ry="13" fill="url(#glow)"/>`
  const banner = (x: number) =>
    `<path d="M${x - 13} 22 h26 v${Math.min(70, g * 0.32)} l-13 -8 l-13 8 Z" fill="#2f4a8f"/><path d="M${x - 7} 36 h14 v7 q0 8 -7 11 q-7 -3 -7 -11 Z" fill="#e2b54a"/>`
  return (
    frame(w, h, '#f2c14e', '#1e2230', '#1c1c22') +
    `<g clip-path="url(#card)">` +
    Array.from({ length: Math.ceil((g - 10) / 18) }, (_, row) =>
      Array.from({ length: Math.ceil(w / 36) + 1 }, (_, i) => `<rect x="${i * 36 - (row % 2) * 18}" y="${10 + row * 18}" width="34" height="16" rx="2" fill="none" stroke="#2c303a"/>`).join(''),
    ).join('') +
    banner(28) +
    banner(w - 28) +
    torch(64) +
    torch(w - 64) +
    `<path d="${archOut}" fill="#5a606e" stroke="#7d8796" stroke-width="2"/>` +
    runes +
    door +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#191a20"/>` +
    label('Portal') +
    `</g>` +
    border(w, h, '#f2c14e')
  )
}

// ---------- ateliê do Pintor (Expedition 33): o monólito com o número pintado, pedras flutuando, chão de pétalas e pétalas subindo ----------

const atelie = (w: number, h: number) => {
  const g = groundOf(h)
  const r = rnd(61)
  const mx = w * 0.7
  const monolith =
    `<ellipse cx="${mx}" cy="${g * 0.35}" rx="46" ry="${g * 0.3}" fill="#d9534f" opacity=".06"/>` +
    `<path d="M${mx - 14} ${g - 4} L${mx - 9} 26 L${mx + 9} 22 L${mx + 14} ${g - 4} Z" fill="#1a1420"/><ellipse cx="${mx}" cy="${g - 3}" rx="22" ry="3" fill="#120e16" opacity=".7"/>` +
    `<text class="glw" x="${mx}" y="${Math.max(66, g * 0.4)}" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="15" fill="#f6e6d8">33</text>`
  const rocks = ([
    [w * 0.28, g * 0.3, 10],
    [w * 0.45, g * 0.18, 7],
    [w * 0.88, g * 0.5, 8],
  ] as [number, number, number][])
    .map(([x, y, s], i) => `<path class="flt" style="animation-delay:${i * 0.9}s" d="M${x} ${y} l${s} -3 l${s * 0.6} ${s * 0.8} l-${s * 0.8} ${s * 0.6} Z" fill="#2a2030"/>`)
    .join('')
  const groundPetals = Array.from({ length: 40 }, () => {
    const x = 6 + r() * (w - 12)
    const y = g + 3 + r() * (h - g - 6)
    return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="2.4" ry="1.2" fill="#d9534f" opacity="${(0.55 + r() * 0.4).toFixed(2)}" transform="rotate(${Math.floor(r() * 180)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`
  }).join('')
  const rising = Array.from({ length: 8 }, (_, i) => `<ellipse class="rise" style="animation-delay:${(i * 0.65).toFixed(2)}s" cx="${(20 + ((i * 41) % 100) / 100 * (w - 40)).toFixed(0)}" cy="${g + 4}" rx="2.4" ry="1.3" fill="#e8746a"/>`).join('')
  const ex = 46
  const ch = Math.min(50, g * 0.3)
  const easel =
    `<line x1="${ex - 16}" y1="${g}" x2="${ex}" y2="${g - ch - 28}" stroke="#7a5530" stroke-width="3"/><line x1="${ex + 16}" y1="${g}" x2="${ex}" y2="${g - ch - 28}" stroke="#7a5530" stroke-width="3"/>` +
    `<rect x="${ex - 22}" y="${g - ch - 20}" width="44" height="${ch}" fill="#e6ddd2" stroke="#7a5530" stroke-width="2"/>` +
    // A pintura: a torre de Paris quebrada, com o topo retorcido e os destroços no ar.
    (() => {
      const top = g - ch - 20
      const bot = g - 22
      const mid = top + ch * 0.5
      return (
        `<path d="M${ex - 20} ${top + ch * 0.32} q10 -8 22 -2 q10 -6 18 2" stroke="#a9a29a" stroke-width="5" fill="none" opacity=".5"/>` +
        `<path d="M${ex - 11} ${bot} L${ex - 2} ${mid} M${ex + 11} ${bot} L${ex + 2} ${mid} M${ex - 6} ${bot - 6} q6 -7 12 0" stroke="#3a3430" stroke-width="2" fill="none"/>` +
        `<path d="M${ex - 2} ${mid} L${ex - 1} ${top + 12} Q${ex} ${top + 4} ${ex + 8} ${top + 5} Q${ex + 15} ${top + 6} ${ex + 17} ${top + 12}" stroke="#3a3430" stroke-width="2.2" fill="none"/>` +
        `<line x1="${ex - 7}" y1="${mid + 6}" x2="${ex + 7}" y2="${mid + 6}" stroke="#3a3430" stroke-width="1.4"/>` +
        ([
          [8, 9],
          [12, 15],
          [5, 17],
          [15, 20],
        ] as [number, number][])
          .map(([dx, dy]) => `<rect x="${ex + dx}" y="${top + dy}" width="1.8" height="1.8" fill="#3a3430"/>`)
          .join('')
      )
    })()
  return (
    frame(w, h, '#d9534f', '#2c2240', '#b0605a') +
    `<g clip-path="url(#card)">` +
    rocks +
    `<path d="M0 ${g - 10} Q${w * 0.3} ${g - 26} ${w * 0.6} ${g - 12} T${w} ${g - 14} V${g} H0 Z" fill="#3a2430"/>` +
    monolith +
    `<rect x="0" y="${g}" width="${w}" height="${h - g}" fill="#3a2226"/>` +
    groundPetals +
    easel +
    rising +
    label('Ateliê') +
    `</g>` +
    border(w, h, '#d9534f')
  )
}

/** O cenário sozinho, sem o Clawd. */
export const placeInner = (place: Place, w: number, h: number, asleep = false, names?: Readonly<Record<Place, string>>) =>
  translated(place, names, sceneOf(place, w, h, asleep))

/** Troca o nome do lugar desenhado pelo da língua da HUD. */
const translated = (place: Place, names: Readonly<Record<Place, string>> | undefined, inner: string) => {
  const to = names?.[place]
  if (to === undefined || to === LABEL[place]) return inner
  return inner.replace(`◆ ${esc(LABEL[place].toUpperCase())}`, `◆ ${esc(to.toUpperCase())}`)
}

const sceneOf = (place: Place, w: number, h: number, asleep: boolean) =>
  `<style>${BG_CSS}</style>` +
  (place === 'treino'
    ? treino(w, h)
    : place === 'biblioteca'
      ? biblioteca(w, h)
      : place === 'runas'
        ? runas(w, h)
        : place === 'oficina'
          ? oficina(w, h)
          : place === 'pantano'
            ? pantano(w, h)
            : place === 'trono'
              ? trono(w, h)
              : place === 'teatro'
                ? teatro(w, h)
                : place === 'torre'
                  ? torre(w, h)
                  : place === 'floresta'
                    ? floresta(w, h)
                    : place === 'beco'
                      ? beco(w, h)
                      : place === 'forja'
                        ? forja(w, h)
                      : place === 'santuario'
                        ? santuario(w, h)
                      : place === 'muralha'
                        ? muralha(w, h)
                      : place === 'laboratorio'
                        ? laboratorio(w, h)
                      : place === 'tenda'
                        ? tenda(w, h)
                      : place === 'salao'
                        ? salao(w, h)
                      : place === 'camara'
                        ? camara(w, h)
                      : place === 'portal'
                        ? portal(w, h)
                      : place === 'atelie'
                        ? atelie(w, h)
                      : acampamento(w, h, asleep))

/** Onde o Clawd fica em cada cenário, para não pisar no que é do fundo. */
const CENTER: Record<Place, number> = { treino: 0.47, biblioteca: 0.5, runas: 0.5, oficina: 0.52, pantano: 0.42, acampamento: 0.5, trono: 0.5, teatro: 0.48, torre: 0.5, floresta: 0.45, beco: 0.5, forja: 0.5, santuario: 0.5, muralha: 0.48, laboratorio: 0.46, tenda: 0.46, salao: 0.5, camara: 0.42, portal: 0.5, atelie: 0.55 }

/** O palco inteiro: o cenário com o Clawd por cima, patas no chão. */
export const stageArt = (hero: Hero, pose: Pose, place: Place, w: number, h: number, alt: string, names?: Readonly<Record<Place, string>>): Art => {
  const g = groundOf(h)
  const cw = Math.min(w * 0.62, h * 1.05)
  const ch = (cw * SPRITE_H) / SPRITE_W
  const x = w * CENTER[place] - cw / 2
  const y = g - ch * FEET
  const sprite = `<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" viewBox="0 0 ${SPRITE_W} ${SPRITE_H}" overflow="visible">${spriteInner(hero, pose)}</svg>`
  return doc(w, h, placeInner(place, w, h, pose === 'sleep', names) + sprite, alt, alt)
}

/** Um Clawd dentro do palco, patas no chão, centrado em `cx` (fração da largura). */
const actorAt = (hero: Hero, pose: Pose, w: number, h: number, cx: number, scale = 1) => {
  const cw = Math.min(w * 0.62, h * 1.05) * scale
  const ch = (cw * SPRITE_H) / SPRITE_W
  const x = w * cx - cw / 2
  const y = groundOf(h) - ch * FEET
  return `<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" viewBox="0 0 ${SPRITE_W} ${SPRITE_H}" overflow="visible">${spriteInner(hero, pose)}</svg>`
}

/**
 * O acampamento com o Sábio: de visita, com o pergaminho, quando o turno acabou
 * com algo anotado; ao lado da fogueira, quando a sessão adormece. Montagem
 * provisória com os sprites aprovados; a arte final entra numa leva.
 */
export const campWithSageArt = (w: number, h: number, asleep: boolean, alt: string, names?: Readonly<Record<Place, string>>): Art =>
  doc(
    w,
    h,
    placeInner('acampamento', w, h, asleep, names) +
      actorAt('aprendiz', asleep ? 'sleep' : 'idle', w, h, 0.36) +
      actorAt('sabio', 'work', w, h, 0.86, 0.66) +
      (asleep ? '' : `<text x="${(w * 0.86).toFixed(0)}" y="${(groundOf(h) - h * 0.55).toFixed(0)}" text-anchor="middle" font-size="15" class="flt">📜</text>`),
    alt,
    alt,
  )
