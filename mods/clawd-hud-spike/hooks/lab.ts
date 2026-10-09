// Catálogo das sondas e o texto do relatório. Só funções puras: o que usa `$`
// fica no register.tsx, porque o motor não segue o `$` através de um import.

import type { Measures, Placement, ProbeId, TurnSeen, Verdict } from '../types'

type Probe = { id: ProbeId; item: string; title: string; how: string; action?: string }

export const PROBES: readonly Probe[] = [
  {
    id: 'svg',
    item: '1',
    title: 'Svg interativo',
    how: 'O Clawd pisca (CSS), as estrelas pulsam (SMIL), a engrenagem gira e o tooltip aparece ao parar o mouse.',
  },
  {
    id: 'tema',
    item: '2',
    title: 'Tema',
    how: 'Troque o tema em /config e depois o claro/escuro do app. As cores do Clawd acompanham?',
  },
  {
    id: 'ask',
    item: '3',
    title: 'Diálogo + linha de arquivos',
    how: 'A linha com ícones e +/− aparece acima do diálogo do Claude?',
    action: 'Testar diálogo',
  },
  {
    id: 'protecao',
    item: '3b',
    title: 'Proteção de verdade',
    how: 'Peça ao Claude: "mude API_URL em spike-sandbox/.env.teste". O diálogo aparece com a linha? O diálogo nativo de permissão aparece também?',
  },
  {
    id: 'fill',
    item: '4',
    title: 'Levar ao prompt',
    how: 'O texto de teste aparece na caixa de digitação?',
    action: 'Levar ao prompt',
  },
  {
    id: 'turno',
    item: '6',
    title: 'Fim do turno',
    how: 'Depois de uma resposta, o motivo e o começo da resposta final aparecem aqui?',
  },
  {
    id: 'rodape',
    item: '7',
    title: 'Rodapé fixo',
    how: 'Ao paginar com ‹ ›, o rodapé (Mochila · Mana · Vigor) fica parado embaixo?',
  },
  {
    id: 'tooluse',
    item: '8',
    title: 'Linhas de ferramenta',
    how: 'Cada ferramenta no chat ganha o Clawd à esquerda? Com "Recolher leituras", as leituras e a saída delas somem sem deixar linha vazia?',
    action: 'Recolher leituras',
  },
  {
    id: 'ferramentas',
    item: '9/10',
    title: 'Sessão paralela e ccd_*',
    how: 'Lista as ferramentas do app que abrem sessão ou painel. Nenhuma é chamada.',
    action: 'Listar',
  },
  {
    id: 'painel',
    item: '11',
    title: 'Painel sem pedido',
    how: 'O Laboratório abriu sozinho no início da sessão? A largura medida entra no relatório quando você marca ✓ ou ✗.',
  },
  {
    id: 'store',
    item: '12',
    title: '$.store entre sessões',
    how: 'Abra outra sessão e rode /spike. O número de sessões subiu?',
  },
  {
    id: 'faixa',
    item: '+',
    title: 'Faixa acima do prompt',
    how: 'Enquanto o Claude trabalha aparece o Clawd de 90 px com a atividade, e a faixa some no fim do turno?',
  },
]

/** O que o Pane e o relatório leem do estado, num retrato só. */
export type Snapshot = {
  measures: Measures
  turn: TurnSeen | null
  collapseReads: boolean
  placement: Placement
}

export const describePlacement = (p: Placement) => {
  const parts: string[] = []
  if (p.isPlaced !== undefined) parts.push(p.isPlaced ? 'abriu sozinho' : `não abriu (${p.reason ?? 'sem motivo'})`)
  if (p.placement !== undefined) parts.push(p.placement)
  if (p.columns !== undefined) parts.push(`${p.columns}×${p.rows ?? '?'} células`)
  if (p.isFullscreen !== undefined) parts.push(p.isFullscreen ? 'docka' : 'não docka')
  if (p.bodyRows !== undefined) parts.push(`corpo ${p.bodyColumns ?? '?'}×${p.bodyRows}`)
  return parts.length === 0 ? undefined : parts.join(' · ')
}

/** O valor que cada sonda mediu, em uma linha. */
export const measuredLine = (snap: Snapshot, id: ProbeId): string | undefined => {
  const m = snap.measures
  switch (id) {
    case 'tema':
      return m.theme === undefined ? undefined : `tema lido: ${m.theme}`
    case 'ask':
      return m.ask === undefined ? undefined : `resposta: ${m.ask}`
    case 'fill':
      return m.fill
    case 'turno': {
      const t = snap.turn
      return t === null
        ? undefined
        : `${t.reason} · ${Math.round(t.durationMs / 100) / 10}s · ${t.answerChars} car. · "${t.answerHead}"`
    }
    case 'tooluse':
      return snap.collapseReads ? 'leituras recolhidas' : 'leituras visíveis'
    case 'ferramentas':
      return m.tools
    case 'painel':
      return describePlacement(snap.placement)
    case 'store':
      return m.sessions === undefined ? undefined : `sessões contadas: ${m.sessions}`
    default:
      return undefined
  }
}

const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n/g, ' ')

/** O Markdown que o /spike-relatorio devolve. */
export const reportText = (snap: Snapshot, marks: Partial<Record<ProbeId, Verdict>>) => {
  const m = snap.measures
  const lines = [
    '## Spike clawd-hud-spike: resultado no app real',
    '',
    `- Motor: ${m.version ?? '?'} · superfície: ${m.surface ?? '?'} · tema lido: ${m.theme ?? '?'}`,
    '',
    '| Item | Sonda | Veredito | Medido |',
    '|---|---|---|---|',
  ]
  for (const probe of PROBES) {
    const verdict = marks[probe.id] ?? 'não verificado'
    lines.push(`| ${probe.item} | ${probe.title} | ${verdict} | ${cell(measuredLine(snap, probe.id) ?? '')} |`)
  }
  lines.push('| 5 | Client como botão | descartado pelos tipos | Client não aceita Svg (2.1.295) |')
  return lines.join('\n')
}

/** Rodapé do protótipo: o que resta das janelas de uso. */
export const footerText = (usage: {
  context: { percent?: number }
  rateLimits: readonly { kind: string; percentUsed: number; resetsAt?: string }[]
}) => {
  const left = (kind: string) => {
    const w = usage.rateLimits.find(r => r.kind === kind)
    if (w === undefined) return '—'
    const at = w.resetsAt === undefined ? '' : ` (renova ${w.resetsAt.slice(11, 16)} UTC)`
    return `${Math.round(100 - w.percentUsed)}%${at}`
  }
  const ctx = usage.context.percent
  return `Mochila ${ctx === undefined ? '—' : `${Math.round(ctx)}%`} · Mana ${left('five_hour')} · Vigor ${left('seven_day')}`
}
