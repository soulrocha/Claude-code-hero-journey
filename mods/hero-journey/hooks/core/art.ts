// Arte da HUD: os caranguejos Clawd das 9 classes, os ornamentos da pele Épico,
// os ícones de arquivo e os do "Sobre". Tudo é texto de SVG, sem script: a
// animação vem de CSS (<style>) e de SMIL, que o `Svg` interativo do desktop toca.
// Portado de prototype/hud-prototype-final.html.

import type { Beat, Cls, Palette, Rarity } from '../../types'

export const CLASSES: readonly Cls[] = [
  'druida',
  'mago',
  'ilusionista',
  'artifice',
  'paladino',
  'patrulheiro',
  'anao',
  'arauto',
  'alquimista',
]

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

const KEYFRAMES = [
  '.eye{animation:blink 4.4s infinite}@keyframes blink{0%,94%,100%{opacity:1}96%{opacity:0}}',
  '.sweep{transform-box:view-box;transform-origin:82px 56px;animation:sweep 3.2s ease-in-out infinite}@keyframes sweep{50%{transform:rotate(-7deg)}}',
  '.mag{animation:mag 2.6s ease-in-out infinite}@keyframes mag{50%{transform:translateY(9px)}}',
  '.gearr{transform-box:fill-box;transform-origin:center;animation:gr 4s linear infinite}@keyframes gr{to{transform:rotate(360deg)}}',
  '.pick{transform-box:view-box;transform-origin:96px 66px;animation:pick 1.6s ease-in-out infinite}@keyframes pick{0%,100%{transform:rotate(-28deg)}45%{transform:rotate(22deg)}}',
  '.stamp{animation:stamp 2.6s ease-in-out infinite}@keyframes stamp{0%,30%,80%,100%{transform:translateY(-8px)}45%,60%{transform:none}}',
  '.page{transform-box:fill-box;transform-origin:left center;animation:page 2.2s ease-in-out infinite}@keyframes page{50%{transform:scaleX(-1)}}',
  '.brush{transform-box:view-box;transform-origin:100px 62px;animation:brush 1.6s ease-in-out infinite}@keyframes brush{50%{transform:rotate(-14deg)}}',
  '.bub{animation:bub 2.2s ease-in infinite;opacity:0}@keyframes bub{0%{opacity:0;transform:none}25%{opacity:1}100%{opacity:0;transform:translateY(-14px)}}',
  '.glow{animation:glow 2.6s ease-in-out infinite}@keyframes glow{50%{opacity:.35}}',
  '.bobs{animation:bob 2.2s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-2px)}}',
  '.lid{transform-box:fill-box;transform-origin:center bottom;animation:lid 1.8s ease-in-out infinite}@keyframes lid{0%,60%,100%{transform:none}75%{transform:rotate(-10deg) translateY(-3px)}}',
  '.rune{animation:rune 3s ease-in-out infinite}@keyframes rune{50%{opacity:.25}}',
  '@media (prefers-reduced-motion:reduce){*{animation:none!important}}',
].join('')

const BODY = [
  '..OOOOOOOOOO..',
  '..OOEOOOOEOO..',
  'OOOOOOOOOOOOOO',
  '..OOOOOOOOOO..',
  '..OOOOOOOOOO..',
  '..O.O....O.O..',
]

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
    case 'ilusionista':
      return `<ellipse cx="65" cy="49" rx="24" ry="6" fill="${c}"/><rect x="63" y="40" width="4" height="5" fill="${c}"/>`
    case 'artifice': {
      const lens = classColor('patrulheiro', palette)
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
      return `<text class="glow" x="31" y="32" font-size="11" fill="#f2c14e">✦</text><text class="glow" style="animation-delay:1.3s" x="92" y="28" font-size="9" fill="${classColor('ilusionista', palette)}">✧</text>`
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
      return '<rect x="53" y="68" width="12" height="9" fill="#e0def4"/><rect class="page" x="65" y="68" width="12" height="9" fill="#c0caf5"/>'
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

export const esc = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** O que um `Svg` do desktop recebe. */
export type Art = { source: string; width: number; height: number; alt: string }

/** O Clawd de uma classe; com `withProp`, o acessório animado entra no quadro. */
export const crab = (cls: Cls, width: number, palette: Palette, tip: string, withProp = false): Art => {
  const viewBox = withProp ? '0 10 130 76' : '28 12 76 74'
  const height = Math.round(withProp ? (width * 76) / 130 : (width * 74) / 76)
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">` +
    `<title>${esc(tip)}</title><style>${KEYFRAMES}</style><g class="bobs">${body()}${hat(cls, palette)}</g>` +
    (withProp ? prop(cls) : '') +
    '</svg>'
  return { source, width, height, alt: tip }
}

/**
 * A linha do diário: o Clawd à esquerda e o trilho na cor da classe, com a
 * bolinha centralizada. Linhas seguidas encostam os trilhos.
 */
export const diaryMark = (cls: Cls, palette: Palette, tip: string, state: 'run' | 'ok' | 'err'): Art => {
  const c = classColor(cls, palette)
  const dot = state === 'err' ? TONE[palette].bad : c
  const pulse =
    state === 'run' ? '<animate attributeName="r" values="4;6;4" dur="1.4s" repeatCount="indefinite"/>' : ''
  const source =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 44" width="56" height="44">' +
    `<title>${esc(tip)}</title><style>${KEYFRAMES}</style>` +
    `<svg x="0" y="2" width="40" height="40" viewBox="28 12 76 74"><g class="bobs">${body()}${hat(cls, palette)}</g></svg>` +
    `<line x1="49" y1="0" x2="49" y2="44" stroke="${c}" stroke-opacity=".55" stroke-width="2"/>` +
    (state === 'run'
      ? `<circle cx="49" cy="22" r="4.5" fill="${dot}">${pulse}</circle></svg>`
      : `<circle cx="49" cy="22" r="4.5" fill="${TONE[palette].pane}" stroke="${dot}" stroke-width="2"/></svg>`)
  return { source, width: 56, height: 44, alt: tip }
}

/**
 * Título de seção. Pele Épico: centralizado, com ornamentos ◆ e o "!" ou "?"
 * do quest log. Pele Sóbrio: alinhado à esquerda, sem ornamento.
 */
export const sectionTitle = (
  title: string,
  palette: Palette,
  skin: 'epico' | 'sobrio',
  width: number,
  mark?: '!' | '?',
): Art => {
  const t = TONE[palette]
  const w = Math.max(160, Math.round(width))
  if (skin === 'sobrio') {
    return {
      source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 20" width="${w}" height="20"><text x="0" y="14" font-family="system-ui,sans-serif" font-size="11" font-weight="700" letter-spacing=".12em" fill="${t.muted}">${esc(title.toUpperCase())}</text></svg>`,
      width: w,
      height: 20,
      alt: title,
    }
  }
  const label = (mark === undefined ? '' : `${mark} `) + title.toUpperCase()
  const half = w / 2
  const textW = label.length * 9.2
  const left = Math.max(8, half - textW / 2 - 12)
  const right = Math.min(w - 8, half + textW / 2 + 12)
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 22" width="${w}" height="22">` +
    `<line x1="4" y1="11" x2="${left - 8}" y2="11" stroke="${t.gildDim}"/>` +
    `<path d="M${left - 8} 11 l4 -4 l4 4 l-4 4 Z" fill="${t.gild}"/>` +
    `<text x="${half}" y="15" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10.5" font-weight="700" letter-spacing=".28em" fill="${t.gild}">${esc(label)}</text>` +
    `<path d="M${right} 11 l4 -4 l4 4 l-4 4 Z" fill="${t.gild}"/>` +
    `<line x1="${right + 8}" y1="11" x2="${w - 4}" y2="11" stroke="${t.gildDim}"/></svg>`
  return { source, width: w, height: 22, alt: label }
}

/** Fileira de quests concluídas: quadrados como os da demo, cada um com o nome no tooltip. */
export const doneQuestsArt = (titles: readonly string[], palette: Palette): Art => {
  const t = TONE[palette]
  const shown = titles.slice(-8)
  const w = Math.max(26, shown.length * 26)
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 24" width="${w}" height="24">` +
    shown
      .map(
        (title, i) =>
          `<g transform="translate(${i * 26 + 1} 1)"><title>✓ ${esc(title)}</title><rect x=".5" y=".5" width="21" height="21" rx="4" fill="${t.muted}" fill-opacity=".1" stroke="${t.muted}" stroke-opacity=".55"/></g>`,
      )
      .join('') +
    '</svg>'
  return { source, width: w, height: 24, alt: shown.map(s => `✓ ${s}`).join(', ') }
}

/** O quadrado de uma quest aberta: dourado na atual, apagado nas próximas. */
export const questBox = (current: boolean, palette: Palette, tip: string): Art => {
  const t = TONE[palette]
  const stroke = current ? t.gild : t.muted
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>${esc(tip)}</title>` +
    `<rect x="1.5" y="1.5" width="21" height="21" rx="4" fill="${t.muted}" fill-opacity=".08" stroke="${stroke}" stroke-opacity="${current ? 1 : 0.55}" stroke-width="${current ? 1.6 : 1}"/></svg>`
  return { source, width: 24, height: 24, alt: tip }
}

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

/** Barra fina, como a da demo: trilho escuro e o preenchido na cor dada. */
export const meter = (fraction: number | undefined, color: string, palette: Palette, tip: string, width = 64, extra = ''): Art => {
  const t = TONE[palette]
  const w = Math.max(24, Math.round(width))
  const f = fraction === undefined ? 0 : Math.max(0, Math.min(1, fraction))
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 8" width="${w}" height="8"><title>${esc(tip)}</title>` +
    `<rect x="0" y="1" width="${w}" height="6" rx="3" fill="${t.muted}" fill-opacity=".22"/>` +
    `<rect x="0" y="1" width="${Math.round(w * f)}" height="6" rx="3" fill="${color}">${extra}</rect></svg>`
  return { source, width: w, height: 8, alt: tip }
}

/** Barra de recurso do rodapé: preenchida pelo que resta, com o rótulo no tooltip. */
export const resourceBar = (
  kind: 'mochila' | 'mana' | 'vigor',
  fraction: number | undefined,
  palette: Palette,
  tip: string,
): Art => {
  const color = kind === 'mochila' ? '#b49cf0' : kind === 'mana' ? '#6cb6ec' : '#8fc46a'
  // A mochila "respira" quando está cheia (o que se usa, não o que resta).
  const breathe =
    kind === 'mochila' && (fraction ?? 0) >= 0.8
      ? '<animate attributeName="opacity" values="1;.55;1" dur="2.4s" repeatCount="indefinite"/>'
      : ''
  return meter(fraction, color, palette, tip, 40, breathe)
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

/** O livro do grimório, aberto, com runas que pulsam. */
export const book = (palette: Palette, tip: string, width = 84): Art => {
  const t = TONE[palette]
  const page = palette === 'escuro' ? '#e9e2cf' : '#fffaf0'
  const height = Math.round((width * 56) / 84)
  const lines = [0, 1, 2, 3]
    .map(i => `<line x1="${12}" y1="${18 + i * 7}" x2="${36 - (i % 2) * 6}" y2="${18 + i * 7}" stroke="${t.muted}" stroke-width="1.6"/>`)
    .join('')
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 56" width="${width}" height="${height}"><title>${esc(tip)}</title><style>${KEYFRAMES}</style>` +
    `<path d="M4 10 Q22 4 42 10 L42 50 Q22 44 4 50 Z" fill="${page}" stroke="${t.gild}" stroke-width="1.6"/>` +
    `<path d="M80 10 Q62 4 42 10 L42 50 Q62 44 80 50 Z" fill="${page}" stroke="${t.gild}" stroke-width="1.6"/>${lines}` +
    `<text class="rune" x="50" y="26" font-size="12" fill="${classColor('mago', palette)}">ᚱ</text>` +
    `<text class="rune" style="animation-delay:1s" x="62" y="38" font-size="12" fill="${classColor('ilusionista', palette)}">ᛟ</text></svg>`
  return { source, width, height, alt: tip }
}

/** A linha do tempo do relatório: uma bolinha por ação, na cor da classe, com o tooltip. */
export const timeline = (beats: readonly Beat[], palette: Palette, label: (b: Beat) => string, width = 300): Art => {
  const t = TONE[palette]
  const w = Math.max(120, Math.round(width))
  const n = Math.max(1, beats.length)
  const step = (w - 20) / Math.max(1, n - 1)
  const dots = beats
    .map((b, i) => {
      const x = n === 1 ? w / 2 : 10 + i * step
      const fill = b.status === 'err' ? t.bad : classColor(b.cls, palette)
      return `<g><title>${esc(label(b))}</title><circle cx="${x.toFixed(1)}" cy="10" r="${b.status === 'err' ? 5 : 4}" fill="${fill}"/></g>`
    })
    .join('')
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 20" width="${w}" height="20">` +
    `<line x1="6" y1="10" x2="${w - 6}" y2="10" stroke="${t.gildDim}" stroke-width="1.5"/>${dots}</svg>`
  return { source, width: w, height: 20, alt: beats.map(label).join(' · ') }
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
