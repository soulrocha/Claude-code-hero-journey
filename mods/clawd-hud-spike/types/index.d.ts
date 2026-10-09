export type Verdict = 'ok' | 'falhou'

export type ProbeId =
  | 'svg'
  | 'tema'
  | 'ask'
  | 'protecao'
  | 'fill'
  | 'turno'
  | 'rodape'
  | 'tooluse'
  | 'ferramentas'
  | 'painel'
  | 'store'
  | 'faixa'

export type Cls = 'druida' | 'mago' | 'artifice' | 'paladino'

/** Linha de arquivo protegido desenhada acima do diálogo (sonda 3/3b). */
export type GuardFile = { name: string; added: number; removed: number }

/** O que está rodando agora, para a faixa acima do prompt. */
export type Working = { tool: string; cls: Cls; summary: string }

/** O que a sonda 6 viu no último `turn.complete`. */
export type TurnSeen = {
  reason: string
  durationMs: number
  answerHead: string
  answerChars: number
}

/** O que a sonda 11 viu ao abrir o Pane sem pedido e ao desenhá-lo. */
export type Placement = {
  isPlaced?: boolean
  reason?: string
  placement?: string
  columns?: number
  rows?: number
  isFullscreen?: boolean
  bodyRows?: number
  bodyColumns?: number
}

export type Measures = {
  theme?: string
  ask?: string
  fill?: string
  tools?: string
  sessions?: number
  version?: string
  surface?: string
}

declare module 'claude-code' {
  interface PluginState {
    'clawd-hud-spike': {
      verdicts: Partial<Record<ProbeId, Verdict>>
      measures: Measures
      guard: GuardFile[]
      working: Working | null
      turn: TurnSeen | null
      placement: Placement
      collapseReads: boolean
      page: number
    }
  }
}
