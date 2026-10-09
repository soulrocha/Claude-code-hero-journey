// Arte do Clawd portada do protótipo final (prototype/hud-prototype-final.html):
// corpo em pixel, chapéus e acessórios por classe. Só texto de SVG, sem script:
// a animação vem de CSS (<style>) e de SMIL (<animate>), que o Svg interativo do
// desktop deve tocar. É isso que a sonda 1 confere.

import type { Cls, GuardFile } from '../types'

export type Palette = 'escuro' | 'claro'

const CLASS_COLOR: Record<Palette, Record<Cls, string>> = {
  escuro: { druida: '#f0a272', mago: '#6cc3ec', artifice: '#e9b75c', paladino: '#f08fb8' },
  claro: { druida: '#a84e1a', mago: '#136b98', artifice: '#855a06', paladino: '#a83b6c' },
}

const RANGER: Record<Palette, string> = { escuro: '#5fc7b5', claro: '#147a69' }

export const CLASS_NAME: Record<Cls, string> = {
  druida: 'Clawd',
  mago: 'Mago',
  artifice: 'Artífice',
  paladino: 'Paladino',
}

export const classColor = (cls: Cls, palette: Palette) => CLASS_COLOR[palette][cls]

/** Paleta pelo valor de tema que o Claude Code guarda (`dark`, `light`, `light-ansi`...). */
export const paletteOf = (theme: string | undefined): Palette =>
  theme !== undefined && /light/i.test(theme) ? 'claro' : 'escuro'

const BODY = [
  '..OOOOOOOOOO..',
  '..OOEOOOOEOO..',
  'OOOOOOOOOOOOOO',
  '..OOOOOOOOOO..',
  '..OOOOOOOOOO..',
  '..O.O....O.O..',
]

const KEYFRAMES = [
  '.eye{animation:blink 4.4s infinite}',
  '@keyframes blink{0%,94%,100%{opacity:1}96%{opacity:0}}',
  '.gearr{transform-box:fill-box;transform-origin:center;animation:gr 4s linear infinite}',
  '@keyframes gr{to{transform:rotate(360deg)}}',
  '.mag{animation:mag 2.6s ease-in-out infinite}',
  '@keyframes mag{50%{transform:translateY(9px)}}',
  '.page{transform-box:fill-box;transform-origin:left center;animation:page 2.2s ease-in-out infinite}',
  '@keyframes page{50%{transform:scaleX(-1)}}',
].join('')

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
  return out + '<rect x="41" y="51" width="22" height="2.2" rx="1.1" fill="#fff" opacity=".22"/>'
}

const hat = (cls: Cls, palette: Palette) => {
  const c = classColor(cls, palette)
  switch (cls) {
    case 'mago':
      return `<polygon points="47,50 83,50 70,14" fill="${c}"/><ellipse cx="65" cy="50" rx="22" ry="4" fill="${c}"/><text x="62" y="40" font-size="10" fill="#f2c14e">✦</text>`
    case 'artifice':
      return `<rect x="40" y="46" width="50" height="3" fill="#8a6a45"/><rect x="47" y="41" width="13" height="9" rx="2" fill="${RANGER[palette]}" stroke="#3b3b45" stroke-width="2"/><rect x="70" y="41" width="13" height="9" rx="2" fill="${RANGER[palette]}" stroke="#3b3b45" stroke-width="2"/>`
    case 'paladino':
      return '<rect x="45" y="51" width="15" height="13" rx="2" fill="#fff" fill-opacity=".3" stroke="#1a1a1a" stroke-width="3"/><rect x="70" y="51" width="15" height="13" rx="2" fill="#fff" fill-opacity=".3" stroke="#1a1a1a" stroke-width="3"/><line x1="60" y1="56" x2="70" y2="56" stroke="#1a1a1a" stroke-width="3"/>'
    case 'druida':
      // O brilho do druida usa SMIL, e não CSS, para a sonda 1 ver os dois tipos.
      return `<text x="31" y="32" font-size="11" fill="#f2c14e">✦<animate attributeName="opacity" values="1;.3;1" dur="2.6s" repeatCount="indefinite"/></text><text x="92" y="28" font-size="9" fill="${c}">✧<animate attributeName="opacity" values=".3;1;.3" dur="2.6s" repeatCount="indefinite"/></text>`
  }
}

const prop = (cls: Cls) => {
  switch (cls) {
    case 'artifice':
      return `<g class="gearr"><circle cx="16" cy="44" r="7" fill="#e9b75c"/><circle cx="16" cy="44" r="3" fill="#3b3b45"/>${[0, 45, 90, 135]
        .map(a => `<rect x="14.5" y="35" width="3" height="18" fill="#e9b75c" transform="rotate(${a} 16 44)"/>`)
        .join('')}</g>`
    case 'paladino':
      return '<g class="mag"><circle cx="17" cy="52" r="7" fill="#7dcfff" fill-opacity=".25" stroke="#e86fa3" stroke-width="2.5"/><line x1="22" y1="57" x2="28" y2="63" stroke="#e86fa3" stroke-width="3"/></g>'
    case 'mago':
      return '<rect x="53" y="68" width="12" height="9" fill="#e0def4"/><rect class="page" x="65" y="68" width="12" height="9" fill="#c0caf5"/>'
    case 'druida':
      return ''
  }
}

const esc = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export type Crab = { source: string; width: number; height: number; alt: string }

/** O Clawd de uma classe; com `withProp`, o acessório animado entra no quadro. */
export const crab = (
  cls: Cls,
  width: number,
  palette: Palette,
  { withProp = false, tip = CLASS_NAME[cls] }: { withProp?: boolean; tip?: string } = {},
): Crab => {
  const viewBox = withProp ? '0 10 130 76' : '28 12 76 74'
  const height = Math.round(withProp ? (width * 76) / 130 : (width * 74) / 76)
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">` +
    `<title>${esc(tip)}</title><style>${KEYFRAMES}</style>` +
    body() +
    hat(cls, palette) +
    (withProp ? prop(cls) : '') +
    '</svg>'
  return { source, width, height, alt: tip }
}

const FILE_ICON = {
  env: (c: string) =>
    `<rect x="1" y="1" width="14" height="18" rx="2" fill="none" stroke="${c}" stroke-width="1.6"/><circle cx="6.5" cy="12" r="2.6" fill="none" stroke="${c}" stroke-width="1.6"/><line x1="9" y1="12" x2="13" y2="12" stroke="${c}" stroke-width="1.6"/><line x1="11.5" y1="12" x2="11.5" y2="14.5" stroke="${c}" stroke-width="1.6"/>`,
  pipeline: (c: string) =>
    `<circle cx="3.5" cy="4" r="2.5" fill="${c}"/><circle cx="12.5" cy="10" r="2.5" fill="${c}"/><circle cx="3.5" cy="16" r="2.5" fill="${c}"/><path d="M3.5 6.5 V13.5 M5.5 5 L10.5 9 M5.5 15 L10.5 11" stroke="${c}" stroke-width="1.4" fill="none"/>`,
}

/**
 * A linha que vai acima do diálogo de proteção: ícone, nome e +/− de cada
 * arquivo. Com `<title>` por arquivo, para a sonda 3 conferir o tooltip.
 */
export const guardLine = (files: readonly GuardFile[], palette: Palette) => {
  const text = palette === 'escuro' ? '#e8e2d6' : '#2b2724'
  const add = palette === 'escuro' ? '#8fc46a' : '#3d7a1a'
  const del = palette === 'escuro' ? '#ee7a8e' : '#b0324c'
  const legendary = palette === 'escuro' ? '#f0a272' : '#a84e1a'
  let x = 0
  let out = ''
  for (const file of files) {
    const kind = /pipelines?.*\.ya?ml$/i.test(file.name) ? 'pipeline' : 'env'
    const delta =
      `<tspan fill="${add}">+${file.added}</tspan>` + (file.removed > 0 ? ` <tspan fill="${del}">−${file.removed}</tspan>` : '')
    const label = `${esc(file.name)} `
    const width = 26 + (label.length + String(file.added).length + (file.removed > 0 ? String(file.removed).length + 3 : 1)) * 7.2
    out +=
      `<g transform="translate(${x} 4)"><title>${esc(file.name)}: protegido</title>` +
      `<g>${FILE_ICON[kind](legendary)}</g>` +
      `<text x="22" y="14" font-family="system-ui,sans-serif" font-size="12.5" fill="${text}">${label}${delta}</text></g>`
    x += width + 14
  }
  const width = Math.max(1, Math.ceil(x))
  return {
    source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 26" width="${width}" height="26">${out}</svg>`,
    width,
    height: 26,
    alt: files.map(f => `${f.name} +${f.added}${f.removed > 0 ? ` −${f.removed}` : ''}`).join(', '),
  }
}

/** Classe da linha do diário pela ferramenta (o mapa completo fica para a Fase 1). */
export const classOf = (tool: string): Cls => {
  if (/^(Read|Grep|Glob|WebFetch|WebSearch)$/.test(tool)) return 'mago'
  if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(tool)) return 'artifice'
  if (tool === 'Bash') return 'artifice'
  return 'druida'
}
