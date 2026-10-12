// Gera a demo animada do README (docs/assets/demo.svg) a partir da arte real da HUD:
// uma sessão curta em loop, com o chat à esquerda (diário, faixa, guarda, recibo) e o
// painel à direita (palco, objetivo, grupo e recursos). As cenas trocam por CSS, sem
// script, como o GitHub mostra um SVG no README. Dados de exemplo.
//   node <saída do tsc>/scripts/gerar-demo.js     (da raiz do repositório)

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { classColor, dragonArt, petArt, TONE } from '../mods/hero-journey/hooks/core/art'
import { PLACE_OF, stageArt } from '../mods/hero-journey/hooks/core/cenarios'
import type { Art } from '../mods/hero-journey/hooks/core/doc'
import { esc } from '../mods/hero-journey/hooks/core/doc'
import { DICT } from '../mods/hero-journey/hooks/core/i18n'
import type { Pose } from '../mods/hero-journey/hooks/core/sprites'
import type { Cls } from '../mods/hero-journey/types'
import { calm, scopeIds } from './svg-util'

const W = 1200
const H = 680
/** Cada cena dura STEP segundos; o loop inteiro, SCENES.length × STEP. */
const STEP = 3.2
const k = TONE.escuro
const t = DICT.pt
const FONT = "system-ui,-apple-system,'Segoe UI',sans-serif"

type Scene = {
  /** Quem está no palco e o que faz. */
  cls: Cls
  pose: Pose
  doing: string
  file?: string
  /** A linha do diário que esta cena acrescenta. */
  row?: { cls: Cls; pose: Pose; text: string; result: string; bad?: boolean }
  /** A faixa acima do prompt. */
  band: { cls: Cls; pose: Pose; text: string; idle?: boolean }
}

const SCENES: Scene[] = [
  { cls: 'mago', pose: 'work', doing: 'lendo', file: 'src/login/LoginPage.tsx', row: { cls: 'mago', pose: 'work', text: 'LoginPage.tsx', result: '0.8s' }, band: { cls: 'mago', pose: 'work', text: 'login/LoginPage.tsx' } },
  { cls: 'ilusionista', pose: 'work', doing: 'montando', file: 'src/login/LoginForm.tsx', row: { cls: 'ilusionista', pose: 'work', text: 'LoginForm.tsx', result: '+18 −4' }, band: { cls: 'ilusionista', pose: 'work', text: 'login/LoginForm.tsx' } },
  { cls: 'bruxo', pose: 'fail', doing: 'caçando bugs', row: { cls: 'bruxo', pose: 'fail', text: 'Roda os testes do login', result: 'falhou', bad: true }, band: { cls: 'bruxo', pose: 'fail', text: 'Roda os testes do login' } },
  { cls: 'runico', pose: 'work', doing: 'escrevendo', file: 'src/auth/session.ts', row: { cls: 'runico', pose: 'work', text: 'session.ts', result: '+6 −2' }, band: { cls: 'runico', pose: 'work', text: 'auth/session.ts' } },
  { cls: 'bruxo', pose: 'work', doing: 'caçando bugs', row: { cls: 'bruxo', pose: 'work', text: 'Roda os testes do login', result: '4.1s' }, band: { cls: 'bruxo', pose: 'work', text: 'Roda os testes do login' } },
  { cls: 'invocador', pose: 'work', doing: 'invocando', row: { cls: 'invocador', pose: 'work', text: 'Dois agentes revisam a tela', result: '' }, band: { cls: 'invocador', pose: 'work', text: 'Dois agentes revisam a tela' } },
  { cls: 'runico', pose: 'work', doing: 'escrevendo', file: '.env.homologacao', band: { cls: 'runico', pose: 'work', text: '.env.homologacao' } },
  { cls: 'aprendiz', pose: 'idle', doing: 'respondeu às 10:42', band: { cls: 'aprendiz', pose: 'idle', text: t.yourTurn, idle: true } },
]
const T = SCENES.length * STEP

// ---------- montagem ----------

/** As animações da arte rodam mais devagar que na HUD; a troca de cenas tem o próprio ritmo. */
const SLOW = 1.6
const styles = new Set<string>()
let pieces = 0
/**
 * Põe uma arte do mod dentro da demo, na posição e no tamanho pedidos: o <style>
 * dela vai para um só, os IDs dela (o céu e o brilho de cada cenário) ganham um
 * prefixo próprio, e o SMIL dela fica no ritmo mais calmo do README.
 */
const place = (a: Art, x: number, y: number, w = a.width, h = a.height) =>
  calm(
    scopeIds(
      a.source
        .replace(/<style>([\s\S]*?)<\/style>/g, (_, rule: string) => {
          styles.add(rule)
          return ''
        })
        .replace(/<title>[\s\S]*?<\/title>/, '')
        .replace(/^<svg ([^>]*)>/, (_, attrs: string) => `<svg ${attrs.replace(/\swidth="[^"]*"|\sheight="[^"]*"|xmlns="[^"]*"/g, '')} x="${x}" y="${y}" width="${w}" height="${h}">`),
      `p${pieces++}-`,
    ),
    SLOW,
  )

/** Mostra um grupo da cena `from` até a `to` (exclusive), com um fade curto. */
const keyframes: string[] = []
let seq = 0
const during = (from: number, to: number, inner: string, slide = false) => {
  const id = `dm${seq++}`
  const pct = (s: number) => Math.max(0, Math.min(100, (s / T) * 100))
  const a = pct(from * STEP)
  const b = pct(to * STEP)
  const fade = 1.2
  const hidden = slide ? 'opacity:0;transform:translateY(8px)' : 'opacity:0'
  const shown = slide ? 'opacity:1;transform:none' : 'opacity:1'
  const frames =
    a === 0
      ? `0%,${(b - fade).toFixed(2)}%{${shown}}${b.toFixed(2)}%,100%{${hidden}}`
      : `0%,${a.toFixed(2)}%{${hidden}}${(a + fade).toFixed(2)}%,${b >= 100 ? '98.5' : (b - fade).toFixed(2)}%{${shown}}${b >= 100 ? '100' : b.toFixed(2)}%${b >= 100 ? '' : ',100%'}{${hidden}}`
  keyframes.push(`@keyframes ${id}{${frames}}.${id}{animation:${id} ${T}s linear infinite}`)
  // Com "reduzir movimento", sem animação: fica parada a cena final, inteira e coerente.
  const end = from <= SCENES.length - 1 && to >= SCENES.length
  return `<g class="${id} dm${end ? ' dm-end' : ''}">${inner}</g>`
}

/** O nome da classe em negrito, na cor dela, e o texto logo depois. */
const pair = (x: number, y: number, name: string, color: string, rest: string, restColor: string = k.text, size = 14, restDim = false) =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}"><tspan font-weight="700" fill="${color}">${esc(name)}</tspan><tspan dx="8" fill="${restColor}"${restDim ? ' opacity=".65"' : ''}>${esc(rest)}</tspan></text>`

const text = (x: number, y: number, s: string, o: { size?: number; color?: string; bold?: boolean; anchor?: string; dim?: boolean } = {}) =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${o.size ?? 14}" fill="${o.color ?? k.text}"${o.bold ? ' font-weight="700"' : ''}${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.dim ? ' opacity=".65"' : ''}>${esc(s)}</text>`

// ---------- chat (esquerda) ----------

const CHAT_X = 28
const CHAT_W = 740
let chat = ''
chat += `<rect x="${CHAT_X + 330}" y="28" width="${CHAT_W - 330}" height="40" rx="12" fill="#33312d"/>`
chat += text(CHAT_X + CHAT_W - 18, 54, 'Revise a tela de login e rode os testes antes do commit', { anchor: 'end' })
const rows = SCENES.map((s, i) => ({ s, i })).filter(x => x.s.row !== undefined)
rows.forEach(({ s, i }, n) => {
  const r = s.row!
  const y = 92 + n * 54
  const pet = petArt(r.cls, r.pose, 44, r.text)
  let row = place(pet, CHAT_X, y)
  row += pair(CHAT_X + pet.width + 10, y + 27, t.className[r.cls], r.bad ? k.bad : classColor(r.cls, 'escuro'), r.text)
  const mark = r.bad ? '✗' : '✓'
  row += text(CHAT_X + CHAT_W - 4, y + 27, mark, { anchor: 'end', bold: true, color: r.bad ? k.bad : k.ok })
  if (r.result !== '') row += text(CHAT_X + CHAT_W - 22, y + 27, r.result, { anchor: 'end', color: r.bad ? k.bad : k.muted })
  chat += during(i, SCENES.length, row, true)
})

// A guarda: o dragão barra o .env (cena 6).
const GY = 420
let guard = `<rect x="${CHAT_X}" y="${GY}" width="${CHAT_W}" height="126" rx="10" fill="#2b2a27" stroke="${k.warn}"/>`
guard += place(dragonArt('Arquivo crítico'), CHAT_X + 14, GY + 12)
guard += text(CHAT_X + 110, GY + 32, `${t.guardTitle('.env.homologacao')}`, { bold: true, color: k.warn })
guard += text(CHAT_X + 110, GY + 54, 'Um dragão guarda este arquivo. Mal configurado, ele derruba a aplicação,', { dim: true })
guard += text(CHAT_X + 110, GY + 74, 'o banco ou a API. Nada passa sem a sua ordem.', { dim: true })
guard += text(CHAT_X + 18, GY + 106, '− API_URL=https://hml.loja', { color: k.bad, size: 13 })
guard += text(CHAT_X + 260, GY + 106, '+ API_URL=https://prod.loja', { color: k.ok, size: 13 })
guard += `<rect x="${CHAT_X + CHAT_W - 250}" y="${GY + 92}" width="76" height="24" rx="6" fill="#d97757"/>` + text(CHAT_X + CHAT_W - 212, GY + 109, 'Aprovar', { anchor: 'middle', color: '#1f1e1c', bold: true, size: 13 })
guard += text(CHAT_X + CHAT_W - 120, GY + 109, 'Editar no chat', { anchor: 'middle', size: 13 }) + text(CHAT_X + CHAT_W - 30, GY + 109, 'Recusar', { anchor: 'middle', size: 13 })
chat += during(6, 7, guard)

// O recibo do turno, embaixo da resposta (cena final).
const recibo = text(CHAT_X, 440, 'O login passou a validar a sessão antes de redirecionar; os testes passam.', {}) + text(CHAT_X, 470, '🦀 ✦ Missão cumprida: revisar a tela de login · Bruxo 2× · 6 ações · +24 −6 · 1 falha · 1min12s', { color: k.gild, size: 13 })
chat += during(7, 8, recibo, true)

// A faixa acima do prompt e o prompt.
const BY = 566
SCENES.forEach((s, i) => {
  const b = s.band
  const pet = petArt(b.cls, b.pose, 40, b.text)
  let band = place(pet, CHAT_X + 6, BY)
  if (b.idle) band += text(CHAT_X + pet.width + 16, BY + 26, b.text, { dim: true })
  else band += pair(CHAT_X + pet.width + 16, BY + 26, t.className[b.cls], b.pose === 'fail' ? k.bad : classColor(b.cls, 'escuro'), b.text, b.text.includes('/') ? '#8fc46a' : b.text.startsWith('.') ? '#f0a272' : k.muted)
  if (i >= 2 && i <= 5) band += text(CHAT_X + CHAT_W - 80, BY + 26, `◆◆◇◇◇ ${Math.min(i - 1, 4)}/5`, { color: k.gild, anchor: 'end', size: 13 })
  band += text(CHAT_X + CHAT_W - 6, BY + 26, t.panelToggle, { anchor: 'end', dim: true, size: 13 })
  chat += during(i, i + 1, band)
})
chat += `<rect x="${CHAT_X}" y="${BY + 52}" width="${CHAT_W}" height="44" rx="12" fill="none" stroke="#4a473f"/>` + text(CHAT_X + 16, BY + 79, 'Responder…', { dim: true })

// ---------- painel (direita) ----------

const PX = 800
const PW = 372
let pane = `<rect x="${PX - 12}" y="16" width="${PW + 24}" height="${H - 32}" rx="12" fill="${k.pane}" stroke="#3a3833"/>`
pane += text(PX, 42, 'Hero Journey', { dim: true, size: 13 })
SCENES.forEach((s, i) => {
  const place_ = s.cls === 'aprendiz' && s.pose === 'idle' ? 'acampamento' : PLACE_OF[s.cls]
  const stage = stageArt(s.cls, s.pose, place_, 350, 220, s.doing, t.placeName)
  let g = place(stage, PX + 11, 56, 350, 220)
  g += s.cls === 'aprendiz' ? pair(PX, 300, t.yourTurn, k.gild, s.doing, k.text, 14, true) : pair(PX, 300, t.className[s.cls], classColor(s.cls, 'escuro'), s.doing, k.text, 14, true)
  if (s.file !== undefined) g += text(PX, 320, s.file, { color: s.file.startsWith('.env') ? '#f0a272' : '#8fc46a', size: 13 })
  pane += during(i, i + 1, g)
})
// O objetivo.
const ornament = (y: number, label: string) =>
  `<line x1="${PX}" y1="${y - 4}" x2="${PX + 110}" y2="${y - 4}" stroke="${k.gildDim}"/>` +
  text(PX + PW / 2, y, `◆ ${label} ◆`, { anchor: 'middle', color: k.gild, size: 11, bold: true }) +
  `<line x1="${PX + PW - 110}" y1="${y - 4}" x2="${PX + PW}" y2="${y - 4}" stroke="${k.gildDim}"/>`
pane += ornament(356, 'OBJETIVO')
pane += text(PX, 380, 'Revisar a tela de login', { bold: true })
pane += text(PX, 400, 'cap. 1 · começou às 10:41', { dim: true, size: 13 })
// O grupo em expedição (cena 5).
let party = ornament(436, 'EM EXPEDIÇÃO · 2')
for (const [n, cls, name, what] of [
  [0, 'mago', 'Explorador', 'Procura outros usos da sessão'],
  [1, 'paladino', 'Revisor', 'Revisa a segurança do login'],
] as const) {
  const y = 450 + n * 44
  party += place(petArt(cls, 'work', 30, name), PX, y)
  party += text(PX + 50, y + 14, name, { bold: true, color: classColor(cls, 'escuro'), size: 13 }) + text(PX + PW, y + 14, 'em expedição', { anchor: 'end', dim: true, size: 12 })
  party += text(PX + 50, y + 32, `${t.className[cls]} · ${what}`, { dim: true, size: 12 })
}
pane += during(5, 7, party)
// Os recursos e a barra de baixo.
const bar = (y: number, icon: string, name: string, pct: number, color: string, right: string) =>
  text(PX, y, `${icon} ${name}`, { size: 13, color: name === 'Mochila' ? '#e6b450' : k.text }) +
  `<rect x="${PX + 90}" y="${y - 7}" width="150" height="4" rx="2" fill="#3a3833"/><rect x="${PX + 90}" y="${y - 7}" width="${1.5 * pct}" height="4" rx="2" fill="${color}"/>` +
  text(PX + 285, y, `${pct}%`, { anchor: 'end', bold: true, size: 13 }) +
  text(PX + PW, y, right, { anchor: 'end', dim: true, size: 13 })
pane += bar(584, '🎒', 'Mochila', 62, '#e6b450', 'Carregada') + bar(604, '💧', 'Mana', 81, '#6cb6ec', '↻ 3h10') + bar(624, '💚', 'Vigor', 74, '#8fc46a', '↻ 4d')
pane += text(PX, 654, '📖 Grimório', { size: 13 }) + text(PX + PW, 654, '⚙', { anchor: 'end', dim: true })
pane += during(7, 8, text(PX + 92, 654, '· 1', { size: 13, color: k.gild }))

// ---------- documento ----------

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>Hero Journey: uma sessão do Claude Code com a HUD (demonstração com dados de exemplo)</title>
<style>${calm([...styles].join(''), SLOW)}
${keyframes.join('')}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.dm{opacity:0}.dm-end{opacity:1}}</style>
<rect width="${W}" height="${H}" rx="16" fill="#1f1e1c"/>
${chat}
${pane}
</svg>
`
writeFileSync(join(process.cwd(), 'docs', 'assets', 'demo.svg'), svg)
console.log(`demo.svg: ${(svg.length / 1024).toFixed(0)} KB, ${T.toFixed(1)} s em loop`)
