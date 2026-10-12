// Os Clawds das classes, sem fundo: o mesmo desenho serve no chat (36 px), na
// linha do grupo (64 px) e no palco. Cada classe tem a pose de trabalho e a de
// falha; o Aprendiz tem também acordado (esperando você) e dormindo. Caixa de
// 140×100, patas em y=80. Personagens de jogos são só referência: quem veste a
// classe é sempre o Clawd.

import type { Cls } from '../../types'
import type { Art } from './doc'
import { doc } from './doc'

/** Quem veste a classe é sempre o Clawd: um herói por classe. */
export type Hero = Cls
export type Pose = 'work' | 'fail' | 'idle' | 'sleep'

export const SPRITE_W = 140
export const SPRITE_H = 100
/** Onde ficam as patas, em fração da altura. */
export const FEET = 0.8

const ORANGE = '#d97757'
const INK = '#1a1a1a'
const GRID = ['..OOOOOOOOOO..', '..OOEOOOOEOO..', 'OOOOOOOOOOOOOO', '..OOOOOOOOOO..', '..OOOOOOOOOO..', '..O.O....O.O..']
const X0 = 35
const Y0 = 50
const C = 5

export const SPRITE_CSS = [
  '.bob{animation:bob 2.2s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-2px)}}',
  '.blink{animation:blink 4.4s infinite}@keyframes blink{0%,94%,100%{opacity:1}96%{opacity:0}}',
  '.shk{animation:shk .45s ease-in-out infinite}@keyframes shk{25%{transform:translateX(-1.8px)}75%{transform:translateX(1.8px)}}',
  '.flt{animation:flt 2.8s ease-in-out infinite}@keyframes flt{50%{transform:translateY(-4px)}}',
  '.glw{animation:glw 2s ease-in-out infinite}@keyframes glw{50%{opacity:.3}}',
  '.cyc{opacity:0;animation:cyc 6s infinite}@keyframes cyc{0%{opacity:0}4%,22%{opacity:1}27%,100%{opacity:0}}',
  '.zz{opacity:0;animation:zz 3s ease-out infinite}@keyframes zz{0%{opacity:0;transform:none}30%{opacity:.9}100%{opacity:0;transform:translate(8px,-16px)}}',
  '.puff{opacity:0;animation:puff 2.4s ease-out infinite}@keyframes puff{0%{opacity:0;transform:none}20%{opacity:.55}100%{opacity:0;transform:translate(4px,-22px) scale(1.6)}}',
  '.sway{transform-box:view-box;animation:sway 1.8s ease-in-out infinite}@keyframes sway{50%{transform:rotate(9deg)}}',
  '.turn{transform-box:view-box;animation:turn 1.4s ease-in-out infinite}@keyframes turn{50%{transform:rotate(-28deg)}}',
  '.slash{transform-box:view-box;animation:slash 1.3s cubic-bezier(.6,0,.3,1) infinite}@keyframes slash{0%,30%{transform:rotate(-62deg)}55%,100%{transform:rotate(38deg)}}',
  '.trail{opacity:0;animation:trail 1.3s ease-out infinite}@keyframes trail{0%,42%{opacity:0}52%{opacity:.85}80%,100%{opacity:0}}',
  '.dash{animation:dash 4s linear infinite}@keyframes dash{to{stroke-dashoffset:-40}}',
  '.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 1.2s ease-in-out infinite}@keyframes pulse{50%{transform:scale(1.3);opacity:.75}}',
  '.zap{animation:zap 1.2s steps(1) infinite}@keyframes zap{0%,100%{opacity:0}10%,30%{opacity:1}35%{opacity:0}60%,70%{opacity:1}75%{opacity:0}}',
  '.lit{animation:lit 4s infinite}@keyframes lit{0%,100%{fill-opacity:.3}8%,24%{fill-opacity:1}34%{fill-opacity:.3}}',
  '.vib{animation:vib .16s linear infinite}@keyframes vib{50%{transform:translateX(.9px)}}',
  '.dizzy{transform-box:view-box;transform-origin:70px 40px;animation:dizzy 2.2s linear infinite}@keyframes dizzy{to{transform:rotate(360deg)}}',
  '.flip{transform-box:fill-box;transform-origin:0% 50%;animation:flip 2.6s ease-in-out infinite}@keyframes flip{0%,45%{transform:scaleX(1)}60%,100%{transform:scaleX(-1)}}',
  '.hit{animation:hit 1.3s ease-out infinite}@keyframes hit{0%,50%{transform:none;opacity:1}56%{transform:translate(4px,-2px) rotate(25deg) scale(.8);opacity:1}75%{transform:translate(8px,2px) rotate(70deg) scale(.6);opacity:0}100%{opacity:0}}',
  '.stamp{animation:stamp 1.8s ease-in-out infinite}@keyframes stamp{0%,20%{transform:translateY(-10px)}40%,55%{transform:translateY(4px)}75%,100%{transform:translateY(-10px)}}',
  '.sealA{opacity:0;animation:sealA 3.6s infinite}@keyframes sealA{0%,20%{opacity:0}23%,46%{opacity:1}50%,100%{opacity:0}}',
  '.sealB{opacity:0;animation:sealB 3.6s infinite}@keyframes sealB{0%,70%{opacity:0}73%,96%{opacity:1}100%{opacity:0}}',
  '.write{stroke-dasharray:24;stroke-dashoffset:24;animation:write 3.2s linear infinite}@keyframes write{55%,100%{stroke-dashoffset:0}}',
  '.flap{transform-box:fill-box;transform-origin:50% 0%;animation:flap .35s ease-in-out infinite}@keyframes flap{50%{transform:scaleY(.4)}}',
  '.arrive{animation:arrive 4.5s ease-out infinite}@keyframes arrive{0%{transform:translate(40px,-40px);opacity:0}12%{opacity:1}50%,100%{transform:none;opacity:1}}',
  '.ants{animation:ants .8s linear infinite}@keyframes ants{to{stroke-dashoffset:-10}}',
  '.carry{animation:carry 3s ease-in-out infinite}@keyframes carry{0%,25%{transform:none;opacity:1}75%{transform:translate(-88px,42px) scale(.5);opacity:1}82%,100%{transform:translate(-88px,42px) scale(.5);opacity:0}}',
  '.siren{animation:siren .6s steps(1) infinite}@keyframes siren{50%{opacity:.2}}',
  '.poof{transform-box:fill-box;transform-origin:center;animation:poof 4s ease-out infinite}@keyframes poof{0%{opacity:0;transform:scale(.3)}12%{opacity:1}35%{opacity:1;transform:scale(1.1)}50%,100%{opacity:0;transform:scale(1.4)}}',
  '.reveal{transform-box:fill-box;transform-origin:center;animation:reveal 4s ease-out infinite}@keyframes reveal{0%,35%{opacity:0;transform:scale(.6)}50%,88%{opacity:1;transform:none}100%{opacity:0}}',
  '.vanish{transform-box:fill-box;transform-origin:center;animation:vanish 4s ease-in infinite}@keyframes vanish{0%,28%{opacity:1;transform:none}46%{opacity:0;transform:translateX(26px) scale(.4)}90%{opacity:0;transform:none}100%{opacity:1}}',
  '.hmr{transform-box:view-box;animation:hmr 1.2s ease-in infinite}@keyframes hmr{0%,55%,100%{transform:rotate(-40deg)}75%{transform:rotate(6deg)}}',
  '.spk{opacity:0;animation:spk 1.2s ease-out infinite}@keyframes spk{0%,72%{opacity:0;transform:none}76%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}',
  '.ship{opacity:0;animation:ship 2.4s ease-out infinite}@keyframes ship{0%,35%{opacity:0;transform:none}50%{opacity:1}100%{opacity:0;transform:translateY(-22px)}}',
  '.logs{animation:logs 4s linear infinite}@keyframes logs{to{transform:translateY(-24px)}}',
  '.lift{animation:lift 3.2s ease-in-out infinite}@keyframes lift{0%{transform:translateY(18px);opacity:.2}35%,80%{transform:none;opacity:1}100%{transform:translateY(18px);opacity:.2}}',
  '.cflip{transform-box:fill-box;transform-origin:center;animation:cflip 4s ease-in-out infinite}@keyframes cflip{0%,8%{transform:scaleX(1)}14%{transform:scaleX(0)}20%,92%{transform:scaleX(1)}96%{transform:scaleX(0)}100%{transform:scaleX(1)}}',
  '.cback{animation:cback 4s steps(1) infinite}@keyframes cback{0%{opacity:1}14%{opacity:0}96%{opacity:1}}',
  '.cface{opacity:0;animation:cface 4s steps(1) infinite}@keyframes cface{0%{opacity:0}14%{opacity:1}96%{opacity:0}}',
  '.hop{opacity:0;transform-box:fill-box;transform-origin:50% 100%;animation:hop 3s ease-in-out infinite}@keyframes hop{0%,8%{opacity:0;transform:translateY(8px) scale(.4)}22%{opacity:1;transform:translateY(-6px) scale(1)}32%,74%{opacity:1;transform:none}88%,100%{opacity:0;transform:translateY(8px) scale(.4)}}',
  '.tick{transform-box:view-box;animation:tick 8s linear infinite}.tickslow{transform-box:view-box;animation:tick 48s linear infinite}.back{transform-box:view-box;animation:tick 1s linear infinite reverse}@keyframes tick{to{transform:rotate(360deg)}}',
  '.sand{animation:sand .6s linear infinite}@keyframes sand{to{stroke-dashoffset:-3}}',
  '.boltL{animation:boltL 2.2s ease-in infinite}@keyframes boltL{0%{opacity:0;transform:translate(-30px,-8px)}10%{opacity:1}40%{opacity:1;transform:none}55%{opacity:0;transform:translate(-16px,-26px) rotate(-60deg)}100%{opacity:0}}',
  '.paint{stroke-dasharray:60;stroke-dashoffset:60;animation:paint 4s ease-out infinite}@keyframes paint{0%,10%{stroke-dashoffset:60;opacity:1}45%,85%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}',
  '.lunge{animation:lunge 2s ease-in-out infinite}@keyframes lunge{0%,35%{transform:none}50%{transform:translate(8px,-3px)}70%,100%{transform:none}}',
  '.raise{animation:raise 3s ease-in-out infinite}@keyframes raise{0%,10%{transform:none}45%,80%{transform:translateY(-16px)}100%{transform:none}}',
  '.holy{animation:holy 3s ease-in-out infinite}@keyframes holy{0%,100%{opacity:.5}50%{opacity:1}}',
  '.bless{animation:bless 3s ease-in-out infinite}@keyframes bless{0%,100%{opacity:.2;transform:translateY(2px)}50%{opacity:1;transform:none}}',
  '.ray{opacity:0;animation:ray 2.4s ease-out infinite}@keyframes ray{0%{opacity:0;transform:translateY(6px)}30%{opacity:.8}100%{opacity:0;transform:translateY(-26px)}}',
  '.pop{animation:pop 2.4s ease-in-out infinite}@keyframes pop{50%{transform:translateY(-2px)}}',
  '@media (prefers-reduced-motion:reduce){*{animation:none!important}}',
].join('')

type EyeStyle = 'normal' | 'x' | 'closed' | 'look' | 'cat' | 'happy'

/** O corpo de pixel do Clawd, com o estilo de olho pedido. */
const body = (eyes: EyeStyle) => {
  let out = ''
  GRID.forEach((row, ry) =>
    [...row].forEach((ch, rx) => {
      if (ch === '.') return
      const x = X0 + rx * C
      const y = Y0 + ry * C
      out += `<rect x="${x}" y="${y}" width="5.2" height="5.2" rx=".8" fill="${ORANGE}"/>`
      if (ch !== 'E') return
      if (eyes === 'x') out += `<path d="M${x} ${y}l5 5M${x + 5} ${y}l-5 5" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`
      else if (eyes === 'closed') out += `<rect x="${x}" y="${y + 2.4}" width="5" height="1.5" rx=".7" fill="${INK}"/>`
      else if (eyes === 'look') out += `<rect class="blink" x="${x + 1.8}" y="${y}" width="3.4" height="5" rx="1" fill="${INK}"/>`
      else if (eyes === 'happy') out += `<path d="M${x} ${y + 4} l2.5 -3.2 l2.5 3.2" stroke="${INK}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
      else if (eyes === 'cat')
        out += `<rect x="${x}" y="${y}" width="5" height="5" rx="1.1" fill="#f2c14e"/><rect class="blink" x="${x + 1.9}" y="${y + 0.4}" width="1.3" height="4.2" rx=".6" fill="${INK}"/>`
      else out += `<rect class="blink" x="${x}" y="${y}" width="5" height="5" rx="1.1" fill="${INK}"/>`
    }),
  )
  return `${out}<rect x="46" y="51" width="22" height="2.2" rx="1.1" fill="#fff" opacity=".22"/>`
}

const failBubble = `<g class="pop"><rect x="108" y="6" width="20" height="16" rx="6" fill="#ece9df"/><path d="M112 21 l-3 6 l8 -6 Z" fill="#ece9df"/><text x="118" y="18.5" text-anchor="middle" font-size="12" font-weight="800" fill="#c4344f">!</text></g>`
const askBubble = `<g class="pop"><rect x="104" y="14" width="20" height="16" rx="6" fill="#ece9df"/><path d="M108 29 l-3 6 l8 -6 Z" fill="#ece9df"/><text x="114" y="26.5" text-anchor="middle" font-size="12" font-weight="800" fill="#c98a1e">?</text></g>`
const smoke = (x: number, y: number, color = '#8a877f') =>
  [0, 0.8, 1.6].map(d => `<circle class="puff" style="animation-delay:${d}s" cx="${x}" cy="${y}" r="${3 + d * 1.5}" fill="${color}"/>`).join('')
const zz = `<text class="zz" x="98" y="44" font-size="12" font-weight="700" fill="#b3b0a6">z</text><text class="zz" style="animation-delay:1.5s" x="106" y="34" font-size="9" font-weight="700" fill="#b3b0a6">z</text>`

// ---------- Aprendiz: a faixa de treino, a espada de madeira e a cabeça cheia de classes ----------

const woodSword = (pose: Pose) => {
  const blade = `<rect x="102" y="24" width="5.5" height="38" rx="2" fill="#c08d55" stroke="#7a5530" stroke-width="1"/><rect x="104" y="26" width="1.4" height="32" rx=".7" fill="#e2b882" opacity=".7"/><rect x="96.5" y="58" width="16" height="4" rx="1.2" fill="#7a5530"/><rect x="102.8" y="62" width="4" height="9" rx="1" fill="#5a3d22"/>`
  if (pose === 'fail' || pose === 'sleep') return `<g transform="rotate(84 104 64) translate(14 -6)">${blade}</g>`
  if (pose === 'idle') return `<g transform="translate(14 8)">${blade}</g>`
  return `<g class="sway" style="transform-origin:104px 66px"><g transform="rotate(18 104 66)">${blade}</g></g>`
}

const thought = () => {
  const icons = [
    // Mago: o livro
    `<path d="M10 14 q5 -3 10 0 v10 q-5 -3 -10 0Z" fill="#8fc7ef"/><path d="M20 14 q5 -3 10 0 v10 q-5 -3 -10 0Z" fill="#5b9fd0"/>`,
    // Rúnico: a runa de código
    `<rect x="11" y="11" width="18" height="17" rx="4" fill="#5d6b78"/><text x="20" y="23.5" text-anchor="middle" font-family="Consolas,monospace" font-size="9" font-weight="800" fill="#5fe3cf">&lt;/&gt;</text>`,
    // Engenheiro: a engrenagem
    `<g transform="translate(20 19)">${[0, 45, 90, 135].map(a => `<rect x="-1.6" y="-8" width="3.2" height="16" rx="1" fill="#c9965f" transform="rotate(${a})"/>`).join('')}<circle r="5.5" fill="#c9965f"/><circle r="2.2" fill="#ece9df"/></g>`,
    // Bruxo: a espada de prata
    `<line x1="13" y1="26" x2="27" y2="12" stroke="#c9d1dc" stroke-width="3" stroke-linecap="round"/><line x1="14" y1="20" x2="20" y2="26" stroke="#6b5a45" stroke-width="2.5"/>`,
  ]
  return (
    `<circle cx="40" cy="47" r="2" fill="#ece9df" opacity=".9"/><circle cx="34" cy="40" r="3" fill="#ece9df" opacity=".9"/>` +
    `<rect x="3" y="5" width="34" height="28" rx="13" fill="#ece9df" opacity=".95"/>` +
    icons.map((g, i) => `<g class="cyc" style="animation-delay:${i * 1.5}s">${g}</g>`).join('')
  )
}

const aprendiz = (pose: Pose) => {
  const eyes: EyeStyle = pose === 'fail' ? 'x' : pose === 'sleep' ? 'closed' : pose === 'idle' ? 'look' : 'normal'
  const tails = `<g class="sway" style="transform-origin:96px 53px"><path d="M95 52 q9 -3 15 3 q-7 0 -13 0 Z" fill="#e6dcc2"/><path d="M95 54 q8 2 12 9 q-6 -3 -12 -6 Z" fill="#d8ccad"/></g>`
  const band = `<rect x="44" y="49.6" width="52" height="3.4" rx="1" fill="#efe6cf"/><rect x="92.5" y="48.6" width="4.5" height="5.6" rx="1" fill="#d8ccad"/>`
  const wrap = pose === 'fail' ? 'shk' : pose === 'sleep' ? '' : 'bob'
  const stars =
    pose === 'fail'
      ? `<g class="dizzy">${[0, 120, 240].map(a => `<text x="${70 + 18 * Math.cos((a * Math.PI) / 180)}" y="${40 + 7 * Math.sin((a * Math.PI) / 180)}" font-size="8" fill="#f2c14e" text-anchor="middle">✦</text>`).join('')}</g>`
      : ''
  return (
    `<g class="${wrap}">${tails}${body(eyes)}${band}</g>` +
    woodSword(pose) +
    (pose === 'work' ? thought() : '') +
    (pose === 'idle' ? askBubble : '') +
    (pose === 'sleep' ? zz : '') +
    stars
  )
}

// ---------- Mago: chapéu pontudo, livro que vira página e os quatro elementos (toque da Lune) ----------

const ORBIT = 'M16 66 a54 13 0 1 0 108 0 a54 13 0 1 0 -108 0'
const ELEMENTS = ['#ff7b4a', '#8fd3ff', '#9bc46a', '#ffe066']

const mago = (pose: Pose) => {
  const fail = pose === 'fail'
  const hat =
    `<path d="M47 53 Q64 32 77 7 Q81 32 93 53 Z" fill="#4f7fd1"/><path d="M58 40 Q70 37 84 40 L86 45 Q70 42 56 45 Z" fill="#3d68b5"/>` +
    `<ellipse cx="70" cy="53" rx="28" ry="4.6" fill="#3d68b5"/><text x="73" y="33" font-size="9" fill="#f2c14e">✦</text>`
  const orbs = fail
    ? ELEMENTS.map((c, i) => `<circle cx="${[26, 42, 100, 116][i]}" cy="78" r="3.6" fill="${c}" opacity=".45"/>`).join('') + smoke(42, 72) + smoke(100, 72)
    : ELEMENTS.map(
        (c, i) =>
          `<circle r="7" fill="${c}" opacity=".25"><animateMotion dur="5s" repeatCount="indefinite" begin="-${(i * 1.25).toFixed(2)}s" path="${ORBIT}"/></circle>` +
          `<circle r="3.8" fill="${c}"><animateMotion dur="5s" repeatCount="indefinite" begin="-${(i * 1.25).toFixed(2)}s" path="${ORBIT}"/></circle>`,
      ).join('')
  const book = fail
    ? `<path d="M12 76 h20 v4 h-20 Z" fill="#5b9fd0"/><path d="M12 75 h20 v1.5 h-20 Z" fill="#e9e2c8"/>`
    : `<g class="flt"><path d="M8 52 q9 -5 18 0 v14 q-9 -5 -18 0 Z" fill="#e9e2c8"/><path d="M26 52 q9 -5 18 0 v14 q-9 -5 -18 0 Z" fill="#d6cfb4"/>` +
      `<path class="flip" d="M26 52 q8 -4 15 0 v13 q-7 -4 -15 0 Z" fill="#f4efdd"/><line x1="12" y1="56" x2="22" y2="54.5" stroke="#4f7fd1" stroke-width="1"/><line x1="12" y1="60" x2="21" y2="58.5" stroke="#4f7fd1" stroke-width="1"/></g>`
  return (
    `<g class="${fail ? 'shk' : 'bob'}">${body(fail ? 'x' : 'normal')}<g ${fail ? 'transform="rotate(-18 70 53)"' : ''}>${hat}</g></g>` +
    book +
    orbs +
    (fail ? failBubble : '')
  )
}

// ---------- Rúnico: as pedras de runa orbitando, as mãos brilhando e o círculo sob os pés ----------

const RUNE_ORBIT = 'M12 58 a58 20 0 1 0 116 0 a58 20 0 1 0 -116 0'
const GLYPHS = ['&lt;/&gt;', '{ }', 'λ', 'TS']

const runeStone = (glyph: string, size = 18) =>
  `<rect x="${-size / 2 - 3}" y="${-size / 2 - 3}" width="${size + 6}" height="${size + 8}" rx="8" fill="#5fe3cf" opacity=".14"/>` +
  `<rect x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size + 2}" rx="5" fill="#5d6b78" stroke="#3c4650"/>` +
  `<text x="0" y="4.5" text-anchor="middle" font-family="Consolas,monospace" font-size="8" font-weight="800" fill="#5fe3cf">${glyph}</text>`

const runico = (pose: Pose) => {
  const fail = pose === 'fail'
  // A marca rúnica na testa, no lugar do capuz.
  const mark = `<path d="M67 51.5 l3 -4 l3 4 l-3 3 Z" fill="#5fe3cf" ${fail ? 'opacity=".35"' : 'class="glw"'}/>`
  const circle = fail
    ? `<ellipse cx="70" cy="81" rx="42" ry="7" fill="none" stroke="#ee7a8e" stroke-opacity=".35" stroke-dasharray="6 9"/>`
    : `<ellipse cx="70" cy="81" rx="42" ry="7" fill="none" stroke="#5fe3cf" stroke-opacity=".75" stroke-dasharray="6 4" class="dash"/><ellipse cx="70" cy="81" rx="30" ry="4.6" fill="none" stroke="#5fe3cf" stroke-opacity=".35"/>`
  if (fail) {
    const fallen = GLYPHS.map((g, i) => {
      const x = [20, 36, 104, 120][i] as number
      return (
        `<g transform="translate(${x} 72) rotate(${[-24, 18, -12, 28][i]})"><rect x="-9" y="-9" width="18" height="20" rx="5" fill="#4d5863" stroke="#353e47"/>` +
        (i === 1 ? `<path d="M-5 -7 l5 7 l-3 4 l6 6" stroke="#ee7a8e" stroke-width="1.4" fill="none"/>` : '') +
        `<text x="0" y="4.5" text-anchor="middle" font-family="Consolas,monospace" font-size="8" font-weight="800" fill="${i === 1 ? '#ee7a8e' : '#5fe3cf'}" fill-opacity=".45">${i === 1 ? '✗' : g}</text></g>`
      )
    }).join('')
    return circle + `<g class="shk">${body('x')}${mark}</g>` + fallen + smoke(36, 66) + failBubble
  }
  // As mãos (as pontas do corpo) acesas, puxando as runas.
  const hands =
    `<circle cx="37" cy="62.5" r="6" fill="#5fe3cf" opacity=".35" class="pulse"/><circle cx="103" cy="62.5" r="6" fill="#5fe3cf" opacity=".35" class="pulse" style="animation-delay:.6s"/>` +
    `<path class="glw" d="M37 60 Q28 48 30 36" stroke="#5fe3cf" stroke-width="1.2" fill="none" stroke-dasharray="2 3"/><path class="glw" style="animation-delay:1s" d="M103 60 Q112 48 110 36" stroke="#5fe3cf" stroke-width="1.2" fill="none" stroke-dasharray="2 3"/>`
  const orbit = GLYPHS.map(
    (g, i) => `<g>${runeStone(g)}<animateMotion dur="7s" repeatCount="indefinite" begin="-${(i * 1.75).toFixed(2)}s" path="${RUNE_ORBIT}"/></g>`,
  ).join('')
  // Um glifo sendo escrito no ar entre as mãos.
  const casting = `<text class="lit" x="70" y="40" text-anchor="middle" font-family="Consolas,monospace" font-size="10" font-weight="800" fill="#5fe3cf">&lt;/&gt;</text>`
  return circle + `<g class="bob">${body('normal')}${mark}</g>` + hands + orbit + casting
}

// ---------- Engenheiro: boina vermelha, bigode e a manopla mecânica com a espada carregada (homenagem ao Gustave) ----------

const engenheiro = (pose: Pose) => {
  const fail = pose === 'fail'
  const beret =
    `<ellipse cx="72" cy="49" rx="27" ry="7.5" fill="#b8322f" transform="rotate(-7 72 49)"/><ellipse cx="70" cy="52" rx="24" ry="3" fill="#8f2522"/>` +
    `<rect x="74" y="39.5" width="3" height="4" rx="1.4" fill="#8f2522"/>`
  const stache = `<path d="M60 62.2 q5 -3 10 0 q5 -3 10 0 q-5 3.6 -10 1 q-5 2.6 -10 -1 Z" fill="#3a2e27"/>`
  const core = fail ? '#ee7a8e' : '#9b7bff'
  // A manopla: braço inteiro de metal sobre a ponta direita do corpo, com rebites e o núcleo de energia.
  const gauntlet =
    `<path d="M93 57 h12 q6 0 7 6 v4 q-1 5 -7 5 h-12 Z" fill="#7d8798" stroke="#4b5260"/>` +
    `<rect x="104" y="54" width="14" height="16" rx="4" fill="#a4adbd" stroke="#5b6372"/>` +
    [58, 62, 66].map(y => `<circle cx="97" cy="${y}" r=".9" fill="#4b5260"/>`).join('') +
    `<circle cx="111" cy="62" r="7.5" fill="${core}" opacity=".28" class="${fail ? 'zap' : 'glw'}"/><circle cx="111" cy="62" r="3.4" fill="${core}" class="${fail ? 'zap' : 'pulse'}"/>`
  const sword = (bolts: boolean) =>
    `<rect x="109.5" y="12" width="4" height="42" rx="1" fill="#d6dde6" stroke="#8d96a6" stroke-width=".6"/><rect x="110.8" y="14" width="1.2" height="36" fill="#fff" opacity=".7"/>` +
    `<path d="M104 52 h15 v3 h-15 Z" fill="#b8322f"/>` +
    (bolts
      ? `<polyline class="zap" points="111,18 106,26 112,28 107,38" stroke="#c9b8ff" stroke-width="1.5" fill="none"/><polyline class="zap" style="animation-delay:.5s" points="113,30 118,36 112,40 117,48" stroke="#c9b8ff" stroke-width="1.4" fill="none"/>`
      : '')
  const blade = fail ? `<g transform="translate(-14 25) rotate(90 111 54)">${sword(false)}</g>` : sword(true)
  const sparks = fail
    ? `<polyline class="zap" points="118,56 124,52 121,50 128,46" stroke="#ee7a8e" stroke-width="1.6" fill="none"/>` + smoke(108, 52, '#c9c6bd')
    : ''
  return (fail ? blade : '') + `<g class="${fail ? 'shk' : 'bob'}">${body(fail ? 'x' : 'normal')}${beret}${stache}${fail ? '' : blade}${gauntlet}</g>` + sparks + (fail ? failBubble : '')
}

// ---------- Bruxo: olhos de gato, espada de prata nas costas, medalhão de lobo e o bug encontrado na espadada ----------

/** O bug: o ícone de inseto (corpo, cabeça, antenas e seis patas). */
export const bugIcon = (fill = '#e06c75', leg = '#5a2a2e') =>
  `<path d="M-6 -3 l-6 -3 M-6 1 l-7 0 M-6 5 l-6 3 M6 -3 l6 -3 M6 1 l7 0 M6 5 l6 3" stroke="${leg}" stroke-width="1.6" stroke-linecap="round"/>` +
  `<ellipse cx="0" cy="2" rx="7" ry="9" fill="${fill}"/><line x1="0" y1="-6" x2="0" y2="11" stroke="${leg}" stroke-width="1.2"/>` +
  `<circle cx="0" cy="-9" r="4.2" fill="${leg}"/><path d="M-2 -12 q-3 -5 -6 -5 M2 -12 q3 -5 6 -5" stroke="${leg}" stroke-width="1.3" fill="none" stroke-linecap="round"/>` +
  `<circle cx="-1.6" cy="-9.5" r="1" fill="#ffd27a"/><circle cx="1.6" cy="-9.5" r="1" fill="#ffd27a"/>`

const bruxo = (pose: Pose) => {
  const fail = pose === 'fail'
  const back = `<line x1="47" y1="51" x2="36" y2="30" stroke="#5a4a38" stroke-width="3" stroke-linecap="round"/><line x1="39" y1="43" x2="47" y2="37" stroke="#8a7a5e" stroke-width="2.2"/><circle cx="35.5" cy="29" r="2.2" fill="#c9ccd6"/>`
  // O medalhão: só a cabeça de lobo, que vibra quando sente o bug.
  const wolf =
    `<path d="M62 64 L70 69 L78 64" stroke="#8a8f9c" stroke-width="1" fill="none"/>` +
    `<g class="${fail ? '' : 'vib'}"><path d="M64.5 69 l2 -5 l2.5 3.2 h2 l2.5 -3.2 l2 5 l-1 4 l-3.5 4 h-2 l-3.5 -4 Z" fill="#c9ccd6" stroke="#6b707c" stroke-width=".8"/>` +
    `<circle cx="68.2" cy="71" r=".9" fill="#b5452f"/><circle cx="71.8" cy="71" r=".9" fill="#b5452f"/></g>`
  const sword =
    `<rect x="103" y="8" width="4" height="52" rx="1" fill="#e1e7ef" stroke="#9aa3b0" stroke-width=".6"/><rect x="104.4" y="10" width="1.1" height="46" fill="#fff" opacity=".7"/>` +
    `<rect x="96.5" y="58" width="17" height="3.2" rx="1" fill="#6b5a45"/><rect x="103.5" y="61" width="3" height="9" rx="1" fill="#3a2e27"/>`
  if (fail) {
    // O bug venceu: ele está em cima, a espada no chão e as marcas da mordida.
    const claws = [0, 7, 14].map(d => `<path d="M${52 + d} 52 l12 22" stroke="#ee7a8e" stroke-width="2" stroke-linecap="round" opacity=".85"/>`).join('')
    return (
      `<g class="shk">${back}${body('x')}${wolf}</g>` +
      `<g transform="rotate(-96 105 64) translate(-26 -20)">${sword}</g>` +
      claws +
      `<g transform="translate(124 46) scale(1.3)"><g class="pop">${bugIcon()}</g></g>` +
      failBubble
    )
  }
  // O bug encontrado à direita: a espada passa e acerta, com o clarão do golpe.
  const bug = `<g transform="translate(128 70)"><g class="hit">${bugIcon()}</g></g>`
  const flash = `<g class="trail"><path d="M128 58 l2 6 l6 1 l-5 4 l2 6 l-5 -3 l-5 3 l2 -6 l-5 -4 l6 -1 Z" fill="#fff6c8"/></g>`
  return (
    `<g class="bob">${back}${body('cat')}${wolf}</g>` +
    `<g class="slash" style="transform-origin:105px 64px">${sword}</g>` +
    `<path class="trail" d="M110 10 A58 58 0 0 1 134 64" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>` +
    bug +
    flash
  )
}


// ---------- Rei: coroa, manto de arminho e o selo real no pergaminho (o commit); na falha, conflito de merge ----------

const rei = (pose: Pose) => {
  const fail = pose === 'fail'
  const cape =
    `<path d="M41 57 L31 78 L109 78 L99 57 Z" fill="#8f2522"/><path d="M41 57 L31 78 L36 78 L45 57 Z M99 57 L109 78 L104 78 L95 57 Z" fill="#f1ece0"/>` +
    [[38, 66], [35, 73], [102, 66], [105, 73]].map(([x, y]) => `<rect x="${x}" y="${y}" width="1.4" height="2" fill="#1a1a1a"/>`).join('')
  const crown =
    `<path d="M50 50 L52 36 L60 44 L65 31 L70 43 L75 31 L80 44 L88 36 L90 50 Z" fill="#e2b54a" stroke="#a87c22" stroke-width=".8"/>` +
    `<rect x="50" y="46" width="40" height="5" fill="#d4a53c"/><circle cx="60" cy="48.5" r="1.6" fill="#c4344f"/><circle cx="70" cy="48.5" r="1.8" fill="#4f7fd1"/><circle cx="80" cy="48.5" r="1.6" fill="#3d9a5a"/>`
  if (fail) {
    const half = (x: number, rot: number, mark: string) =>
      `<g transform="rotate(${rot} ${x + 8} 76)"><path d="M${x} 71 h16 l-2 3 l2 3 l-2 3 l2 2 h-16 Z" fill="#e9e2c8"/><text x="${x + 7}" y="79" text-anchor="middle" font-family="Consolas,monospace" font-size="5.5" font-weight="800" fill="#c4344f">${mark}</text></g>`
    return (
      cape +
      `<g class="shk">${body('x')}</g>` +
      `<g transform="rotate(-28 70 46) translate(-14 10)">${crown}</g>` +
      half(100, -12, '&lt;&lt;&lt;') +
      half(120, 14, '&gt;&gt;&gt;') +
      failBubble
    )
  }
  // O papel do PR: num carimbo sai aprovado (selo verde ✓), no seguinte recusado (selo vermelho ✗).
  const scroll =
    `<rect x="102" y="70" width="32" height="11" rx="1" fill="#e9e2c8"/><rect x="100" y="69" width="4" height="13" rx="2" fill="#d6cfb4"/><rect x="132" y="69" width="4" height="13" rx="2" fill="#d6cfb4"/>` +
    `<text x="106" y="77.5" font-family="Consolas,monospace" font-size="5.5" font-weight="800" fill="#3a2e27">PR</text>`
  const seal =
    `<g class="sealA"><circle cx="124" cy="75.5" r="4.4" fill="#3d9a5a"/><path d="M121.8 75.6 l1.6 1.6 l3 -3.4" stroke="#fff" stroke-width="1.3" fill="none"/></g>` +
    `<g class="sealB"><circle cx="124" cy="75.5" r="4.4" fill="#c4344f"/><path d="M122.2 73.7 l3.6 3.6 M125.8 73.7 l-3.6 3.6" stroke="#fff" stroke-width="1.3"/></g>`
  const stamp = `<g class="stamp"><circle cx="124" cy="52" r="3" fill="#7a5530"/><rect x="121.5" y="53" width="5" height="9" rx="1" fill="#7a5530"/><rect x="118" y="62" width="12" height="5" rx="1.5" fill="#8a7a6a"/></g>`
  return cape + `<g class="bob">${body('normal')}${crown}</g>` + scroll + seal + stamp
}

// ---------- Ilusionista: chapéu de aba larga com pena e a varinha que projeta formas de interface ----------

const ilusionista = (pose: Pose) => {
  const fail = pose === 'fail'
  const hat =
    `<ellipse cx="70" cy="50" rx="31" ry="6" fill="#7a5cc4"/><path d="M55 50 Q56 33 70 31 Q84 33 85 50 Z" fill="#9b7fe0"/>` +
    `<rect x="55.5" y="44" width="29" height="4" fill="#5d43a6"/><path d="M84 45 q10 -6 12 -20 q-6 6 -13 16 Z" fill="#ff9ecd"/>`
  const win = (x: number, y: number, stroke: string, extra = '') =>
    `<g transform="translate(${x} ${y})" ${extra}><rect width="30" height="20" rx="3" fill="${stroke}" fill-opacity=".16" stroke="${stroke}"/><line x1="0" y1="5.5" x2="30" y2="5.5" stroke="${stroke}"/>` +
    `<circle cx="3.5" cy="2.8" r="1" fill="${stroke}"/><circle cx="6.8" cy="2.8" r="1" fill="${stroke}"/><circle cx="10.1" cy="2.8" r="1" fill="${stroke}"/>` +
    `<rect x="4" y="9" width="14" height="2.4" rx="1" fill="${stroke}" opacity=".7"/><rect x="4" y="13.5" width="20" height="2.4" rx="1" fill="${stroke}" opacity=".45"/></g>`
  if (fail) {
    const shards = [
      [18, 76, '#f08fb8'],
      [30, 79, '#5fc7b5'],
      [112, 78, '#e9b75c'],
    ]
      .map(([x, y, c]) => `<path d="M${x} ${y} l5 -4 l2 5 Z" fill="${c}" opacity=".7"/>`)
      .join('')
    return (
      `<g class="shk">${body('x')}${hat}</g>` +
      `<g transform="rotate(70 103 63)"><line x1="103" y1="63" x2="121" y2="43" stroke="#2f2540" stroke-width="3" stroke-linecap="round"/></g>` +
      `<g class="zap">${win(97, 8, '#ee7a8e', 'opacity=".8"')}</g>${win(101, 8, '#5fe3cf', 'opacity=".55"')}${win(99, 10, '#b49cf0')}` +
      shards +
      smoke(112, 70) +
      failBubble
    )
  }
  const wand =
    `<g class="sway" style="transform-origin:103px 63px"><line x1="103" y1="63" x2="121" y2="43" stroke="#2f2540" stroke-width="3" stroke-linecap="round"/>` +
    `<path class="glw" d="M122 37 l1.6 3.4 l3.6 .6 l-2.6 2.6 l.6 3.6 l-3.2 -1.8 l-3.2 1.8 l.6 -3.6 l-2.6 -2.6 l3.6 -.6 Z" fill="#fff6c8"/></g>`
  // A fumaça que sai da varinha e vira uma tela montada com os componentes.
  const smokeCloud =
    `<g class="poof">${[
      [112, 26, 7],
      [122, 20, 8],
      [130, 28, 6],
      [118, 32, 6],
    ]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#cfc4ea" opacity=".75"/>`)
      .join('')}</g>`
  const screen =
    `<g class="reveal"><rect x="104" y="8" width="32" height="26" rx="3" fill="#2b2540" stroke="#b49cf0"/><line x1="104" y1="13.5" x2="136" y2="13.5" stroke="#b49cf0"/>` +
    `<circle cx="107.5" cy="10.8" r="1" fill="#ee7a8e"/><circle cx="110.8" cy="10.8" r="1" fill="#e6b450"/><circle cx="114.1" cy="10.8" r="1" fill="#8fc46a"/>` +
    `<rect x="107" y="16.5" width="12" height="9" rx="1.5" fill="#6c5a8a"/><rect x="121" y="17" width="12" height="2" rx="1" fill="#d8d0f0"/><rect x="121" y="21" width="9" height="2" rx="1" fill="#a99fc8"/>` +
    `<rect x="107" y="28" width="11" height="4" rx="1.5" fill="#5b8fd9"/><rect x="124" y="28" width="9" height="4.4" rx="2.2" fill="#5fc7b5"/><circle cx="130.8" cy="30.2" r="1.7" fill="#fff"/></g>`
  // Componentes soltos do lado esquerdo: botão e toggle.
  const loose =
    `<g class="flt" style="animation-delay:.6s"><g class="vanish"><rect x="8" y="34" width="20" height="7" rx="2.5" fill="#5b8fd9"/><rect x="12" y="36.6" width="12" height="1.8" rx=".9" fill="#fff" opacity=".85"/></g></g>` +
    `<g class="flt" style="animation-delay:1.3s"><g class="vanish"><rect x="14" y="48" width="14" height="7" rx="3.5" fill="#e9b75c"/><circle cx="24.5" cy="51.5" r="2.6" fill="#fff"/></g></g>`
  return `<g class="bob">${body('normal')}${hat}</g>` + wand + loose + smokeCloud + screen
}

// ---------- Sábio: chapéu de Merlin com estrelas e luas, a pena escrevendo no pergaminho ----------

const sabio = (pose: Pose) => {
  const fail = pose === 'fail'
  // O chapéu de Merlin: alto, índigo, ponta dobrada, coberto de estrelas e luas.
  const cap =
    `<g transform="translate(0 -3.5)">` +
    `<path d="M45 53 Q59 42 64 24 Q68 8 88 3 Q78 12 76 26 Q79 42 95 53 Z" fill="#3a2d6b"/>` +
    `<ellipse cx="70" cy="53" rx="30" ry="5" fill="#2c2154"/>` +
    [
      [58, 46, 7],
      [74, 38, 6],
      [80, 49, 5.5],
      [68, 28, 5],
      [80, 12, 4.5],
    ]
      .map(([x, y, s]) => `<text x="${x}" y="${y}" font-size="${s}" fill="#e2b54a">✦</text>`)
      .join('') +
    `<circle cx="65" cy="40" r="3.4" fill="#e2b54a"/><circle cx="66.6" cy="39" r="3" fill="#3a2d6b"/>` +
    `<circle cx="76" cy="22" r="2.4" fill="#e2b54a"/><circle cx="77.2" cy="21.3" r="2.1" fill="#3a2d6b"/>` +
    `<circle class="glw" cx="88" cy="3.5" r="1.8" fill="#fff6c8"/></g>`
  const beard = ''
  const page =
    `<rect x="6" y="32" width="30" height="34" fill="#e9e2c8"/><rect x="4" y="29" width="34" height="5" rx="2.5" fill="#d6cfb4"/><rect x="4" y="64" width="34" height="5" rx="2.5" fill="#d6cfb4"/>`
  if (fail) {
    return (
      page +
      `<path d="M14 42 q6 -6 12 0 q8 4 4 12 q-2 8 -10 6 q-10 2 -9 -8 q-3 -6 3 -10 Z" fill="#1f1d2b"/><path d="M20 60 q1 6 0 10" stroke="#1f1d2b" stroke-width="2.4" stroke-linecap="round"/>` +
      `<g class="shk">${body('x')}${cap}${beard}</g>` +
      `<g transform="rotate(70 22 78)"><path d="M16 78 h10" stroke="#f4efe2" stroke-width="3" stroke-linecap="round"/></g><path d="M30 80 h8" stroke="#cfcabc" stroke-width="2.4" stroke-linecap="round"/>` +
      failBubble
    )
  }
  const lines = [0, 1, 2, 3, 4]
    .map(i => `<line class="write" style="animation-delay:${(i * 0.55).toFixed(2)}s" x1="10" y1="${38 + i * 5}" x2="${[30, 26, 31, 24, 28][i]}" y2="${38 + i * 5}" stroke="#3a3a4a" stroke-width="1.2" stroke-linecap="round"/>`)
    .join('')
  const quill = `<g class="sway" style="transform-origin:37px 62px"><path d="M37 62 L31 50" stroke="#5a4a38" stroke-width="1.4"/><path d="M31 50 Q24 38 33 30 Q35 41 32 50 Z" fill="#f4efe2" stroke="#cfcabc" stroke-width=".8"/></g>`
  const glyphs = ['A', '✦', '∑'].map((t, i) => `<text class="zz" style="animation-delay:${i}s" x="${14 + i * 9}" y="28" font-size="8" font-weight="700" fill="#d9b26a">${t}</text>`).join('')
  return page + lines + `<g class="bob">${body('normal')}${cap}${beard}</g>` + quill + glyphs
}

// ---------- Caçador: orelhas de elfo, arco, aljava e a coruja que volta com a página da web ----------

/** A página da web que a coruja traz: barra do navegador, três pontos e linhas. */
const webPage = (x: number, y: number, torn = false) =>
  `<g transform="translate(${x} ${y})"><rect width="24" height="18" rx="2" fill="#ece9df"/><rect width="24" height="4.5" rx="2" fill="#b3b0a6"/>` +
  `<circle cx="3" cy="2.2" r=".9" fill="#ee7a8e"/><circle cx="5.8" cy="2.2" r=".9" fill="#e6b450"/><circle cx="8.6" cy="2.2" r=".9" fill="#8fc46a"/>` +
  (torn
    ? `<text x="12" y="14" text-anchor="middle" font-family="Consolas,monospace" font-size="7" font-weight="800" fill="#c4344f">404</text><path d="M16 4.5 l2 4 l-3 3 l3 3 l-2 3.5" stroke="#1f1e1c" stroke-width="1.2" fill="none"/>`
    : `<rect x="3" y="7" width="12" height="2" rx="1" fill="#6c5a8a"/><rect x="3" y="11" width="17" height="1.6" rx=".8" fill="#a9a69c"/><rect x="3" y="14" width="14" height="1.6" rx=".8" fill="#a9a69c"/>`) +
  `</g>`

const owl = (x: number, y: number, dizzy = false) =>
  `<g transform="translate(${x} ${y})">` +
  `<path class="${dizzy ? '' : 'flap'}" d="M-6 -2 q-9 2 -11 10 q6 -2 11 -4 Z" fill="#6f6152"/><path class="${dizzy ? '' : 'flap'}" d="M6 -2 q9 2 11 10 q-6 -2 -11 -4 Z" fill="#6f6152"/>` +
  `<ellipse cx="0" cy="2" rx="7" ry="9" fill="#8a7a6a"/><ellipse cx="0" cy="-1" rx="5.5" ry="4.6" fill="#e8dcc8"/>` +
  `<path d="M-5 -6 l-1.5 -4 l3.5 2.5 Z M5 -6 l1.5 -4 l-3.5 2.5 Z" fill="#6f6152"/>` +
  (dizzy
    ? `<path d="M-4 -2.5 l2.4 2.4 M-1.6 -2.5 l-2.4 2.4 M1.6 -2.5 l2.4 2.4 M4 -2.5 l-2.4 2.4" stroke="#1a1a1a" stroke-width="1"/>`
    : `<circle cx="-2.4" cy="-1.4" r="1.9" fill="#ffd34d"/><circle cx="2.4" cy="-1.4" r="1.9" fill="#ffd34d"/><circle cx="-2.4" cy="-1.4" r=".8" fill="#1a1a1a"/><circle cx="2.4" cy="-1.4" r=".8" fill="#1a1a1a"/>`) +
  `<path d="M-1 1 l1 2 l1 -2 Z" fill="#c98a1e"/></g>`

const cacador = (pose: Pose) => {
  const fail = pose === 'fail'
  const ears = `<path d="M45 57 L20 40 L44 52 Z" fill="#c0603f"/><path d="M95 57 L120 40 L96 52 Z" fill="#c0603f"/>`
  const leaves = `<path d="M48 50 q22 -7 44 0" stroke="#3d9a5a" stroke-width="2.2" fill="none"/><path d="M60 46 q3 -5 6 -1 q-3 3 -6 1 Z M74 45 q3 -5 6 -1 q-3 3 -6 1 Z" fill="#5fc78a"/>`
  const quiver =
    `<g transform="rotate(-24 44 46)"><rect x="40" y="30" width="8" height="24" rx="3" fill="#6b4a2e"/>` +
    [41.5, 44, 46.5].map(x => `<path d="M${x} 30 l-1.4 -5 l2.8 0 Z" fill="#e9e2c8"/>`).join('') +
    `</g>`
  const bow = `<path d="M33 40 Q18 62 33 84" stroke="#8a6a45" stroke-width="2.6" fill="none" stroke-linecap="round"/><line x1="33" y1="40" x2="33" y2="84" stroke="#e9e2c8" stroke-width=".7"/>`
  if (fail) {
    return (
      quiver +
      `<g class="shk">${body('x')}${ears}${leaves}</g>` +
      `<g transform="rotate(-70 30 78)">${bow}</g>` +
      owl(122, 70, true) +
      `<g transform="rotate(12 112 60)">${webPage(98, 52, true)}</g>` +
      failBubble
    )
  }
  return quiver + `<g class="bob">${body('normal')}${ears}${leaves}</g>` + bow + `<g class="arrive">${owl(120, 18)}${webPage(108, 26)}</g>`
}

// ---------- Ladino: máscara, adaga e o elemento recortado da página, levado para o saco (referência: o Verso) ----------

const ladino = (pose: Pose) => {
  const fail = pose === 'fail'
  const mask = `<rect x="43" y="53.5" width="54" height="7.5" rx="2" fill="#2a2730"/>`
  const eyes = fail
    ? `<path d="M55 55 l5 4 M60 55 l-5 4 M80 55 l5 4 M85 55 l-5 4" stroke="#ece9df" stroke-width="1.4" stroke-linecap="round"/>`
    : `<rect class="blink" x="55" y="56" width="5.2" height="2.4" rx="1.2" fill="#ece9df"/><rect class="blink" x="80" y="56" width="5.2" height="2.4" rx="1.2" fill="#ece9df"/>`
  const tails = `<g class="sway" style="transform-origin:97px 57px"><path d="M96 55 q10 -1 15 5 q-7 -1 -14 -2 Z" fill="#2a2730"/><path d="M96 58 q8 3 11 10 q-5 -4 -11 -7 Z" fill="#3a3640"/></g>`
  const dagger = `<path d="M104 63 L121 51 L123 54 Z" fill="#d6dde6" stroke="#9aa3b0" stroke-width=".5"/><rect x="100" y="61" width="7" height="3" rx="1" fill="#3a2e27" transform="rotate(-35 103 62)"/>`
  const win = (y: number, alarm: boolean) =>
    `<rect x="94" y="${y}" width="42" height="32" rx="3" fill="#2b2d36" stroke="${alarm ? '#ee7a8e' : '#6b6f80'}"/><rect x="94" y="${y}" width="42" height="6" rx="3" fill="#3a3d48"/>` +
    `<circle cx="98" cy="${y + 3}" r="1" fill="#ee7a8e"/><circle cx="101.5" cy="${y + 3}" r="1" fill="#e6b450"/><circle cx="105" cy="${y + 3}" r="1" fill="#8fc46a"/>` +
    `<rect x="98" y="${y + 9}" width="22" height="2" rx="1" fill="#6b6f80"/><rect x="98" y="${y + 13}" width="30" height="2" rx="1" fill="#4b4f5c"/>`
  const sack = (x: number, y: number) =>
    `<path d="M${x} ${y} q-8 4 -6 14 q2 8 12 8 q10 0 12 -8 q2 -10 -6 -14 Z" fill="#7a5a3a"/><path d="M${x - 1} ${y} q6 -3 12 0" stroke="#4a3622" stroke-width="2" fill="none"/>`
  if (fail) {
    return (
      win(16, true) +
      `<rect x="108" y="30" width="14" height="11" rx="2" fill="#e6b450"/><path d="M110 30 v-4 a5 5 0 0 1 10 0 v4" stroke="#e6b450" stroke-width="2.2" fill="none"/>` +
      `<text x="129" y="46" text-anchor="middle" font-family="Consolas,monospace" font-size="6" font-weight="800" fill="#ee7a8e">403</text>` +
      `<circle class="siren" cx="115" cy="12" r="4" fill="#ee7a8e"/>` +
      `<g class="shk">${tails}${body('x')}${mask}${eyes}</g>` +
      `<g transform="rotate(-80 20 74)">${sack(20, 66)}</g>` +
      failBubble
    )
  }
  const button = `<rect x="104" y="22" width="20" height="8" rx="2" fill="#5b8fd9"/><text x="114" y="28.2" text-anchor="middle" font-size="5.5" font-weight="700" fill="#fff">OK</text>`
  return (
    win(6, false) +
    button +
    `<rect class="ants" x="101.5" y="19.5" width="25" height="13" rx="2" fill="none" stroke="#ffe066" stroke-dasharray="3 2"/>` +
    `<g class="carry">${button}</g>` +
    sack(16, 60) +
    `<g class="bob">${tails}${body('normal')}${mask}${eyes}</g>` +
    dagger
  )
}

// ---------- Artífice: óculos de forja, avental e o martelo forjando o pacote do deploy na bigorna ----------

const artifice = (pose: Pose) => {
  const fail = pose === 'fail'
  const goggles =
    `<rect x="44" y="50.5" width="52" height="3" fill="#5a4636"/>` +
    `<circle cx="59" cy="51.5" r="4.6" fill="#6cc3ec" opacity=".85" stroke="#3b3b45" stroke-width="1.6"/><circle cx="81" cy="51.5" r="4.6" fill="#6cc3ec" opacity=".85" stroke="#3b3b45" stroke-width="1.6"/>`
  const apron = `<rect x="50" y="63" width="40" height="15" rx="2" fill="#7a5a3a"/><rect x="62" y="67" width="16" height="6" rx="1" fill="#6a4c30"/>`
  const anvil = `<rect x="106" y="66" width="28" height="4" rx="1" fill="#7a7c86"/><path d="M111 70 h18 v3 h-4 v7 h-10 v-7 h-4 Z" fill="#55565e"/>`
  const box = (c: string) =>
    `<rect x="114" y="57" width="13" height="9" rx="1" fill="${c}"/><line x1="114" y1="61.5" x2="127" y2="61.5" stroke="#7a3a1c" stroke-width=".8"/><line x1="120.5" y1="57" x2="120.5" y2="66" stroke="#7a3a1c" stroke-width=".8"/>`
  if (fail) {
    return (
      anvil +
      box('#c4344f') +
      `<path d="M117 57 l3 4 l-2 2 l4 3" stroke="#1f1d2b" stroke-width="1.2" fill="none"/>` +
      smoke(120, 52) +
      `<g class="shk">${body('x')}${goggles}${apron}</g>` +
      `<g transform="rotate(80 30 78)"><rect x="18" y="76" width="22" height="3" rx="1.5" fill="#6b4a2e"/><rect x="36" y="71" width="8" height="12" rx="2" fill="#7a7c86"/></g>` +
      failBubble
    )
  }
  const sparks = [
    [-12, -16],
    [8, -20],
    [16, -8],
    [-4, -24],
    [20, -18],
  ]
    .map(([dx, dy], i) => `<circle class="spk" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${(i * 0.02).toFixed(2)}s" cx="120" cy="57" r="1.5" fill="#ffd27a"/>`)
    .join('')
  const hammer = `<g class="hmr" style="transform-origin:103px 62px"><line x1="103" y1="62" x2="121" y2="49" stroke="#6b4a2e" stroke-width="3" stroke-linecap="round"/><rect x="116" y="42" width="9" height="13" rx="2" fill="#7a7c86" transform="rotate(-36 120.5 48.5)"/></g>`
  const ship = `<g class="ship"><path d="M120.5 44 l-4 5 h2.6 v5 h2.8 v-5 h2.6 Z" fill="#8fc46a"/></g>`
  return anvil + `<g class="glw">${box('#ffb35c')}</g>` + ship + sparks + `<g class="bob">${body('normal')}${goggles}${apron}</g>` + hammer
}

// ---------- Oráculo: o terceiro olho e a bola de cristal com os logs rolando ----------

const LOG_COLORS = ['#8fc46a', '#8fc46a', '#e6b450', '#8fc46a', '#ee7a8e', '#8fc46a', '#6cb6ec', '#8fc46a']

const oraculo = (pose: Pose) => {
  const fail = pose === 'fail'
  const diadem =
    `<rect x="46" y="49.5" width="48" height="2.4" rx="1.2" fill="#e2b54a"/>` +
    `<path d="M62 46 Q70 40 78 46 Q70 52 62 46 Z" fill="#e8f6ff" stroke="#e2b54a" stroke-width="1"/><circle cx="70" cy="46" r="2.4" fill="${fail ? '#c4344f' : '#6c5a8a'}" ${fail ? '' : 'class="glw"'}/>`
  const stand = `<path d="M113 80 h18 l-3 -5 h-12 Z" fill="#c99a3a"/>`
  const lines = (color: (i: number) => string) =>
    Array.from({ length: 16 }, (_, i) => `<rect x="${113 + (i % 3) * 2}" y="${54 + i * 3}" width="${12 - (i % 3) * 3}" height="1.6" rx=".8" fill="${color(i)}"/>`).join('')
  const ball = (inner: string, glow: string) =>
    `<defs><clipPath id="orb"><circle cx="122" cy="64" r="10"/></clipPath></defs>` +
    `<circle cx="122" cy="64" r="14" fill="${glow}" opacity=".18" class="glw"/><circle cx="122" cy="64" r="11" fill="#1d2a44" stroke="${glow}" stroke-opacity=".7"/>` +
    `<g clip-path="url(#orb)">${inner}</g><path d="M115 58 q3 -4 8 -4" stroke="#fff" stroke-width="1.2" fill="none" opacity=".5"/>`
  if (fail) {
    return (
      stand +
      ball(`<g class="zap">${lines(() => '#ee7a8e')}</g>`, '#ee7a8e') +
      `<path d="M118 55 l3 6 l-3 3 l5 7" stroke="#e8f6ff" stroke-width="1.2" fill="none"/>` +
      smoke(122, 50) +
      `<g class="shk">${body('x')}${diadem}</g>` +
      failBubble
    )
  }
  return (
    stand +
    ball(`<g class="logs">${lines(i => LOG_COLORS[i % LOG_COLORS.length] as string)}</g>`, '#8fd3ff') +
    `<path class="glw" d="M103 62 q5 -4 8 -1" stroke="#8fd3ff" stroke-width="1.2" fill="none" stroke-dasharray="2 2"/>` +
    `<g class="bob">${body('normal')}${diadem}</g>`
  )
}

// ---------- Geomante: faixa do Reino da Terra e o bloco de pedra em forma de banco de dados subindo do chão ----------

/** Um disco do banco de dados de pedra: cilindro curto, topo claro e a borda de baixo. */
const dbDisk = (x: number, y: number, rx: number, ry: number, hh: number) =>
  `<path d="M${x - rx} ${y} v${hh} a${rx} ${ry} 0 0 0 ${2 * rx} 0 v${-hh} Z" fill="#77684f"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#9a8a6e"/>` +
  `<path d="M${x - rx} ${y + hh} a${rx} ${ry} 0 0 0 ${2 * rx} 0" stroke="#5a4e3a" stroke-width="1" fill="none"/>`

const geomante = (pose: Pose) => {
  const fail = pose === 'fail'
  const band = `<rect x="44" y="50.5" width="52" height="3" fill="#3d7a3a"/><path d="M70 49 l3 3 l-3 3 l-3 -3 Z" fill="#e2b54a"/>`
  // A pilha: dois discos no chão; o terceiro é o que ele dobra.
  const stack = dbDisk(122, 72, 11, 3.6, 6) + dbDisk(122, 64.5, 11, 3.6, 6)
  if (fail) {
    const piece = (x: number, y: number, r: number) =>
      `<g transform="rotate(${r} ${x} ${y})"><path d="M${x - 6} ${y} v4 a6 2.2 0 0 0 6 2.2 l1 -3 l-1 -3.2 Z" fill="#77684f"/><path d="M${x - 6} ${y} a6 2.2 0 0 1 6 -2.2 l1 2.6 l-1 2.6 a6 2.2 0 0 1 -6 -3 Z" fill="#9a8a6e"/></g>`
    return (
      stack +
      `<path d="M116 66 l3 4 l-2 3" stroke="#3a3226" stroke-width="1" fill="none"/>` +
      piece(102, 78, -12) +
      piece(136, 77, 18) +
      smoke(122, 60, '#a8977a') +
      `<g class="shk">${body('x')}${band}</g>` +
      failBubble
    )
  }
  const pebbles = [
    [108, 46],
    [136, 42],
    [112, 34],
    [134, 54],
  ]
    .map(([x, y], i) => `<rect class="flt" style="animation-delay:${i * 0.5}s" x="${x}" y="${y}" width="4" height="3" rx="1" fill="#8a7a62"/>`)
    .join('')
  return (
    stack +
    `<g class="raise">${dbDisk(122, 57, 11, 3.6, 6)}<ellipse class="glw" cx="122" cy="67" rx="12" ry="3" fill="#9bc46a" opacity=".35"/></g>` +
    smoke(112, 58, '#a8977a') +
    pebbles +
    `<g class="bob">${body('normal')}${band}</g>` +
    `<path class="glw" d="M104 60 q6 -4 7 -10" stroke="#9bc46a" stroke-width="1.2" fill="none" stroke-dasharray="2 2"/>`
  )
}

// ---------- Alquimista: óculos redondos e duas retortas ligadas por um tubo (a integração) ----------

const alquimista = (pose: Pose) => {
  const fail = pose === 'fail'
  const goggles =
    `<rect x="44" y="49.5" width="52" height="3" fill="#3b3b45"/>` +
    `<circle cx="58" cy="50" r="5" fill="#a8d07a" opacity=".85" stroke="#3b3b45" stroke-width="2"/><circle cx="82" cy="50" r="5" fill="#a8d07a" opacity=".85" stroke="#3b3b45" stroke-width="2"/>`
  const flask = (cx: number, liquid: string) =>
    `<rect x="${cx - 3}" y="52" width="6" height="10" fill="#cfd8e0" opacity=".35" stroke="#cfd8e0" stroke-opacity=".7"/>` +
    `<circle cx="${cx}" cy="70" r="10" fill="#cfd8e0" opacity=".2" stroke="#cfd8e0" stroke-opacity=".7"/><path d="M${cx - 9} 72 a9 9 0 0 0 18 0 Z" fill="${liquid}" opacity=".85"/>`
  const tube = `<path d="M18 52 Q18 22 70 20 Q122 22 122 52" stroke="#cfd8e0" stroke-width="3" fill="none" opacity=".45"/>`
  if (fail) {
    const shards = [
      [116, 74, 20],
      [126, 77, -30],
      [132, 72, 60],
    ]
      .map(([x, y, r]) => `<path d="M${x} ${y} l5 -3 l1 5 Z" fill="#cfd8e0" opacity=".7" transform="rotate(${r} ${x} ${y})"/>`)
      .join('')
    const cloud = [
      [118, 54, 9],
      [128, 48, 8],
      [110, 46, 7],
    ]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#9a7ad0" opacity=".55"/>`)
      .join('')
    return (
      tube +
      flask(18, '#6cb6ec') +
      shards +
      cloud +
      smoke(120, 48, '#9a7ad0') +
      `<g class="shk">${body('x')}${goggles}<circle cx="64" cy="70" r="1.6" fill="#2a2730"/><circle cx="84" cy="66" r="1.2" fill="#2a2730"/></g>` +
      failBubble
    )
  }
  const bubbles = [0, 0.7, 1.4]
    .map(d => `<circle class="bub" style="animation-delay:${d}s" cx="${18 + d * 3}" cy="62" r="1.8" fill="#8fd3ff"/><circle class="bub" style="animation-delay:${d + 0.35}s" cx="${122 - d * 3}" cy="62" r="1.8" fill="#f2e38a"/>`)
    .join('')
  return (
    tube +
    `<path d="M18 52 Q18 22 70 20 Q122 22 122 52" stroke="#a8d07a" stroke-width="2" fill="none" stroke-dasharray="5 6" class="dash"/>` +
    `<text class="zz" x="64" y="16" font-family="Consolas,monospace" font-size="8" font-weight="800" fill="#a8d07a">{ }</text>` +
    flask(18, '#6cb6ec') +
    flask(122, '#e9d36a') +
    bubbles +
    `<g class="bob">${body('normal')}${goggles}</g>`
  )
}

// ---------- Cartomante: tiara de estrelas, cartas do plano virando uma a uma e o globo estelar (Sciel + Astrólogo) ----------

const CARDS: [number, number, string, string][] = [
  [24, 30, '✓', '#3d9a5a'],
  [52, 18, '★', '#c98a1e'],
  [88, 18, '☾', '#6c5a8a'],
  [116, 30, '☀', '#d9534f'],
]

const card = (cx: number, cy: number, mark: string, color: string, i: number) =>
  `<g class="cflip" style="animation-delay:${i}s">` +
  `<g class="cback" style="animation-delay:${i}s"><rect x="${cx - 7}" y="${cy - 10}" width="14" height="20" rx="2" fill="#3a2d6b" stroke="#e2b54a" stroke-width=".8"/><text x="${cx}" y="${cy + 3}" text-anchor="middle" font-size="7" fill="#e2b54a">✦</text></g>` +
  `<g class="cface" style="animation-delay:${i}s"><rect x="${cx - 7}" y="${cy - 10}" width="14" height="20" rx="2" fill="#f4efe2" stroke="#e2b54a" stroke-width=".8"/><text x="${cx}" y="${cy + 3.5}" text-anchor="middle" font-size="9" font-weight="800" fill="${color}">${mark}</text></g></g>`

const cartomante = (pose: Pose) => {
  const fail = pose === 'fail'
  const tiara =
    `<rect x="48" y="50" width="44" height="2" rx="1" fill="#e2b54a"/>` +
    `<text x="58" y="49" font-size="6" fill="#c9a8ff">✦</text><text x="67" y="46" font-size="8" fill="#e2b54a">✦</text><text x="78" y="49" font-size="6" fill="#c9a8ff">✦</text>`
  const globe = `<g class="flt"><circle cx="112" cy="58" r="6" fill="#3a2d6b" stroke="#c9a8ff"/><ellipse cx="112" cy="58" rx="9" ry="3" fill="none" stroke="#e2b54a" stroke-width=".9"/><circle cx="110" cy="56" r=".9" fill="#fff6c8"/><circle cx="114" cy="60" r=".7" fill="#fff6c8"/></g>`
  if (fail) {
    const fallen = CARDS.map(([, , mark, color], i) => {
      const x = [14, 30, 104, 122][i] as number
      const face = i === 1
      return `<g transform="rotate(${[-30, 12, -8, 34][i]} ${x + 7} 76)"><rect x="${x}" y="70" width="14" height="10" rx="1.5" fill="${face ? '#f4efe2' : '#3a2d6b'}" stroke="#e2b54a" stroke-width=".7"/>${face ? `<text x="${x + 7}" y="78" text-anchor="middle" font-size="7" font-weight="800" fill="#c4344f">✗</text>` : ''}</g>`
    }).join('')
    return fallen + `<g class="shk">${body('x')}${tiara}</g>` + failBubble
  }
  return CARDS.map(([x, y, m, c], i) => card(x, y, m, c, i)).join('') + `<g class="bob">${body('normal')}${tiara}</g>` + globe
}

// ---------- Invocador: invocador clássico de RPG; tiara com gema, cajado de cristal e os agentes da guilda saindo dos portais ----------

/** Um agente invocado: o Clawd daquela classe, pequeno, saindo de um portal (o subagente). */
const summon = (hero: Hero, x: number, y: number, d: number, pose: Pose = 'work') =>
  `<ellipse class="pulse" cx="${x + 18}" cy="${y + 21.5}" rx="13" ry="3.4" fill="#a78bfa" fill-opacity=".18" stroke="#a78bfa" stroke-opacity=".8"/>` +
  (pose === 'work'
    ? `<g class="hop" style="animation-delay:${d}s"><svg x="${x}" y="${y}" width="36" height="26" viewBox="0 0 140 100" overflow="visible">${DRAW[hero](pose)}</svg></g>`
    : `<svg x="${x}" y="${y}" width="36" height="26" viewBox="0 0 140 100" overflow="visible" opacity=".7">${DRAW[hero](pose)}</svg>`)

const invocador = (pose: Pose) => {
  const fail = pose === 'fail'
  const circlet = `<rect x="46" y="49.6" width="48" height="2.4" rx="1.2" fill="#c99a3a"/><path d="M70 44 l3.4 4.4 l-3.4 4 l-3.4 -4 Z" fill="#a78bfa" ${fail ? 'opacity=".4"' : 'class="glw"'}/>`
  const staff = (lit: boolean) =>
    `<line x1="104" y1="66" x2="112" y2="44" stroke="#5a4636" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M112 31 l5 8 l-5 8 l-5 -8 Z" fill="${lit ? '#c4b5fd' : '#6a5a8a'}"/>` +
    (lit ? `<circle class="glw" cx="112" cy="39" r="10" fill="#a78bfa" opacity=".3"/>` : `<path d="M110 34 l3 5 l-2 4" stroke="#1a1a1a" stroke-width="1" fill="none"/>`)
  const ring = (broken: boolean) =>
    broken
      ? `<ellipse cx="70" cy="81" rx="40" ry="6" fill="none" stroke="#ee7a8e" stroke-opacity=".35" stroke-dasharray="7 10"/>`
      : `<ellipse cx="70" cy="81" rx="40" ry="6" fill="#a78bfa" fill-opacity=".1" stroke="#a78bfa" stroke-opacity=".8"/>` +
        `<ellipse cx="70" cy="81" rx="30" ry="4.2" fill="none" stroke="#c4b5fd" stroke-opacity=".6" stroke-dasharray="4 3" class="dash"/>`
  if (fail) {
    return (
      ring(true) +
      summon('mago', 0, 54, 0, 'fail') +
      summon('bruxo', 104, 54, 0, 'fail') +
      smoke(18, 70, '#a78bfa') +
      smoke(122, 70, '#a78bfa') +
      `<g class="shk">${body('x')}${circlet}</g>` +
      `<g transform="rotate(64 104 66)">${staff(false)}</g>` +
      failBubble
    )
  }
  return (
    ring(false) +
    summon('mago', 0, 22, 0) +
    summon('engenheiro', 0, 54, 0.75) +
    summon('runico', 52, 0, 1.5) +
    summon('bruxo', 104, 2, 2.25) +
    `<g class="bob">${body('normal')}${circlet}</g>` +
    staff(true)
  )
}

// ---------- Cronomante: crista de dragão de bronze, o relógio atrás e a ampulheta na mão ----------

const cronomante = (pose: Pose) => {
  const fail = pose === 'fail'
  const crest =
    `<path d="M48 51 Q42 42 36 38 Q44 40 52 49 Z" fill="#c98a3a"/><path d="M92 51 Q98 42 104 38 Q96 40 88 49 Z" fill="#c98a3a"/>` +
    `<rect x="48" y="49.6" width="44" height="2.4" rx="1.2" fill="#d9a95a"/><path d="M67 45 h6 l-3 4 l3 4 h-6 l3 -4 Z" fill="#ffe08a"/>`
  const dial =
    `<circle cx="70" cy="34" r="24" fill="#d9a95a" opacity=".1" stroke="#d9a95a" stroke-opacity=".55" stroke-width="1.4"/>` +
    Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6
      return `<line x1="${(70 + Math.cos(a) * 20).toFixed(1)}" y1="${(34 + Math.sin(a) * 20).toFixed(1)}" x2="${(70 + Math.cos(a) * 23).toFixed(1)}" y2="${(34 + Math.sin(a) * 23).toFixed(1)}" stroke="#d9a95a" stroke-opacity=".7" stroke-width="1.2"/>`
    }).join('') +
    `<g class="${fail ? 'back' : 'tick'}" style="transform-origin:70px 34px"><line x1="70" y1="34" x2="70" y2="16" stroke="#ffe08a" stroke-width="1.6" stroke-linecap="round"/></g>` +
    `<g class="${fail ? 'back' : 'tickslow'}" style="transform-origin:70px 34px"><line x1="70" y1="34" x2="82" y2="34" stroke="#ffe08a" stroke-width="2" stroke-linecap="round"/></g>`
  const glass = (cracked: boolean) =>
    `<rect x="11" y="44" width="18" height="3" rx="1" fill="#c98a3a"/><rect x="11" y="71" width="18" height="3" rx="1" fill="#c98a3a"/>` +
    `<path d="M13 47 L27 47 L21 59 L27 71 L13 71 L19 59 Z" fill="#e8f0f4" opacity=".25" stroke="#e8f0f4" stroke-opacity=".7"/>` +
    (cracked
      ? `<path d="M15 50 l4 4 l-2 3 l4 4" stroke="#ee7a8e" stroke-width="1.1" fill="none"/>`
      : `<path d="M15.5 49 L24.5 49 L20 57 Z" fill="#e8c06a"/><path d="M14.5 70 L25.5 70 L20 64 Z" fill="#e8c06a"/><line class="sand" x1="20" y1="57" x2="20" y2="66" stroke="#e8c06a" stroke-width="1.2" stroke-dasharray="1.5 1.5"/>`)
  if (fail) {
    return (
      dial +
      `<g transform="rotate(-70 20 76)">${glass(true)}</g><path d="M8 80 q10 -5 22 0 Z" fill="#e8c06a"/>` +
      `<g class="shk">${body('x')}${crest}</g>` +
      failBubble
    )
  }
  const motes = [0, 1, 2].map(d => `<circle class="puff" style="animation-delay:${d * 0.8}s" cx="${110 + d * 8}" cy="60" r="1.4" fill="#ffe08a"/>`).join('')
  return dial + `<g class="flt">${glass(false)}</g>` + motes + `<g class="bob">${body('normal')}${crest}</g>`
}

// ---------- Paladino: elmo com pluma, escudo com o cadeado no centro, espada e a aura divina com a mão dourada ----------

const paladino = (pose: Pose) => {
  const fail = pose === 'fail'
  const helm =
    `<path d="M95 41 q10 -10 6 -22 q-6 8 -14 12 Z" fill="#c4344f"/>` +
    `<path d="M44 55 Q44 38 70 36 Q96 38 96 55 Z" fill="#b8c0cc" stroke="#7d8796"/><rect x="44" y="51" width="52" height="3" fill="#9aa3b0"/><rect x="68.5" y="51" width="3" height="9" rx="1" fill="#9aa3b0"/>`
  // O escudo e o cadeado alinhados no mesmo centro.
  const SX = 25
  const SY = 67
  const shield = (cracked: boolean) =>
    `<path d="M${SX - 14} ${SY - 15} h28 v14 q0 15 -14 22 q-14 -7 -14 -22 Z" fill="#2f4a8f" stroke="#c9ccd6" stroke-width="2"/>` +
    `<rect x="${SX - 5}" y="${SY - 2}" width="10" height="8" rx="1.5" fill="#e2b54a"/><path d="M${SX - 3} ${SY - 2} v-3 a3 3 0 0 1 6 0 v3" stroke="#e2b54a" stroke-width="1.6" fill="none"/><circle cx="${SX}" cy="${SY + 2}" r="1" fill="#2f4a8f"/>` +
    (cracked ? `<path d="M${SX} ${SY - 15} l-3 9 l5 6 l-4 9 l3 7" stroke="#1a1a1a" stroke-width="1.4" fill="none"/>` : '')
  const sword = `<rect x="106" y="16" width="4" height="44" rx="1" fill="#e1e7ef" stroke="#9aa3b0" stroke-width=".6"/><rect x="100" y="58" width="16" height="3.2" rx="1" fill="#e2b54a"/><rect x="106.5" y="61" width="3" height="8" rx="1" fill="#6b4a2e"/>`
  if (fail) {
    return `<g class="shk">${body('x')}${helm}</g>` + `<g transform="rotate(-12 25 70)">${shield(true)}</g>` + `<g transform="rotate(95 108 64) translate(-16 -30)">${sword}</g>` + failBubble
  }
  // A aura: brilho dourado atrás dele, raios de luz subindo e a mão dourada sobre a cabeça, que acende e apaga junto.
  const aura =
    `<defs><radialGradient id="holy" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".75"/><stop offset=".6" stop-color="#f2c14e" stop-opacity=".25"/><stop offset="1" stop-color="#f2c14e" stop-opacity="0"/></radialGradient></defs>` +
    `<ellipse class="holy" cx="70" cy="58" rx="46" ry="36" fill="url(#holy)"/>` +
    [46, 58, 82, 94].map((x, i) => `<line class="ray" style="animation-delay:${i * 0.6}s" x1="${x}" y1="80" x2="${x}" y2="66" stroke="#ffe08a" stroke-width="1.6" stroke-linecap="round"/>`).join('')
  const hand =
    `<g class="bless"><circle cx="70" cy="22" r="11" fill="#ffe08a" opacity=".25"/>` +
    `<path d="M64.5 28 v-7 q0 -1.4 1.3 -1.4 q1.3 0 1.3 1.4 v-4.4 q0 -1.4 1.3 -1.4 q1.3 0 1.3 1.4 v-1 q0 -1.4 1.3 -1.4 q1.3 0 1.3 1.4 v1.6 q0 -1.4 1.3 -1.4 q1.3 0 1.3 1.4 v6 l2.4 -2.6 q1 -1 2 0 q.8 .9 0 2 l-4.6 6 q-1.6 2 -4.2 2 h-2.4 q-3.8 0 -3.8 -4 Z" fill="#f2c14e" stroke="#c98a1e" stroke-width=".7"/></g>`
  const sparks = [0, 1, 2].map(d => `<circle class="puff" style="animation-delay:${d * 0.8}s" cx="${52 + d * 16}" cy="58" r="1.3" fill="#ffe08a"/>`).join('')
  return aura + hand + `<g class="bob">${body('normal')}${helm}</g>` + sparks + shield(false) + sword
}

// ---------- Pintor: laço preto, paleta e o pincel-florete deixando pinceladas no ar (Expedition 33; a Maelle como referência) ----------

const pintor = (pose: Pose) => {
  const fail = pose === 'fail'
  const bow = `<rect x="44" y="50" width="52" height="3" fill="#2a2730"/><path d="M94 51.5 l8 -5 v10 Z M94 51.5 l-2 0" fill="#2a2730"/><circle cx="94" cy="51.5" r="1.8" fill="#d9534f"/>`
  const palette =
    `<path d="M8 60 q4 -10 18 -8 q10 2 8 10 q-2 5 -7 3 q-4 -2 -6 3 q-3 5 -9 1 q-6 -3 -4 -9 Z" fill="#c9a86a"/>` +
    [
      [14, 58, '#d9534f'],
      [20, 55, '#e2b54a'],
      [27, 57, '#5fc7b5'],
      [13, 63, '#6c5a8a'],
    ]
      .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="2" fill="${c}"/>`)
      .join('')
  const brush = `<line x1="104" y1="62" x2="132" y2="42" stroke="#d6dde6" stroke-width="1.6"/><circle cx="106" cy="60.5" r="3" fill="none" stroke="#e2b54a" stroke-width="1.4"/><path d="M131 43 l5 -4 l1.5 2.5 l-5 3 Z" fill="#d9534f"/>`
  if (fail) {
    const splat = [
      [60, 64, '#d9534f'],
      [78, 70, '#5fc7b5'],
      [70, 58, '#e2b54a'],
    ]
      .map(([x, y, c]) => `<path d="M${x} ${y} q3 -4 6 0 q3 3 -1 6 q-4 3 -6 -1 q-3 -3 1 -5 Z" fill="${c}"/>`)
      .join('')
    return `<g class="shk">${body('x')}${bow}${splat}</g>` + palette + `<g transform="rotate(80 110 70) translate(-6 6)">${brush}</g>` + failBubble
  }
  const strokes =
    `<path class="paint" d="M100 34 q10 -16 22 -8 q8 6 16 -4" stroke="#d9534f" stroke-width="3" fill="none" stroke-linecap="round"/>` +
    `<path class="paint" style="animation-delay:.6s" d="M104 22 q12 -8 26 0" stroke="#e2b54a" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
    `<path class="paint" style="animation-delay:1.2s" d="M108 12 q8 -6 18 -2" stroke="#5fc7b5" stroke-width="2" fill="none" stroke-linecap="round"/>`
  const petals = [0, 1, 2].map(d => `<ellipse class="zz" style="animation-delay:${d * 0.9}s" cx="${112 + d * 8}" cy="34" rx="2.4" ry="1.3" fill="#d9534f"/>`).join('')
  return strokes + petals + palette + `<g class="bob">${body('normal')}${bow}</g>` + `<g class="lunge">${brush}</g>`
}

const DRAW: Record<Hero, (pose: Pose) => string> = { aprendiz, mago, runico, engenheiro, bruxo, rei, ilusionista, sabio, cacador, ladino, artifice, oraculo, geomante, alquimista, cartomante, invocador, cronomante, paladino, pintor }

/** O miolo do Clawd, para pôr dentro de um `<svg viewBox="0 0 140 100">` (sozinho ou no palco). */
export const spriteInner = (hero: Hero, pose: Pose) => `<style>${SPRITE_CSS}</style>${DRAW[hero](pose)}`

/** O Clawd sozinho, sem fundo, na largura pedida. */
export const spriteArt = (hero: Hero, pose: Pose, width: number, alt: string): Art => {
  const h = Math.round((width * SPRITE_H) / SPRITE_W)
  return doc(width, h, `<svg x="0" y="0" width="${width}" height="${h}" viewBox="0 0 ${SPRITE_W} ${SPRITE_H}">${spriteInner(hero, pose)}</svg>`, alt, alt)
}
