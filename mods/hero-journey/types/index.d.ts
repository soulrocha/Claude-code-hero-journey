export type Cls =
  | 'druida'
  | 'mago'
  | 'ilusionista'
  | 'artifice'
  | 'paladino'
  | 'patrulheiro'
  | 'anao'
  | 'arauto'
  | 'alquimista'

export type Palette = 'escuro' | 'claro'
export type Lang = 'pt' | 'en'
export type Skin = 'epico' | 'sobrio'
export type Rarity = 'lendario' | 'raro' | 'incomum' | 'comum' | 'pobre'

/** Os módulos da HUD, cada um liga e desliga no ⚙. */
export type ModuleId =
  | 'diario'
  | 'faixa'
  | 'painel'
  | 'guarda'
  | 'campanha'
  | 'grimorio'
  | 'mochila'
  | 'recibo'

/** Uma linha do diário de bordo: uma chamada de ferramenta da sessão principal. */
export type DiaryEntry = {
  id: string
  tool: string
  cls: Cls
  turnId: string
  summary: string
  status: 'run' | 'ok' | 'err'
  isNew?: boolean
  added?: number
  removed?: number
  ms?: number
  at?: number
}

export type Quest = { id: string; title: string; status: 'pending' | 'in_progress' | 'completed' }

export type Member = {
  id: string
  cls: Cls
  description: string
  type: string
  status: 'run' | 'ok' | 'err'
  agentId?: string
}

export type Item = { path: string; rarity: Rarity; code: string; added?: number; removed?: number }

export type Inventory = {
  branch?: string
  ahead: number
  behind: number
  items: Item[]
  isRepo: boolean
  /** Os últimos commits, para o inventário limpo ter o que mostrar. */
  recent?: { hash: string; subject: string; when: string }[]
}

export type GuardMode = 'nativo' | 'dialogo' | 'chefe'

export type Prefs = {
  partyJoined: boolean
  skin: Skin
  modules: Partial<Record<ModuleId, boolean>>
  guardMode: GuardMode
  grimorioHaiku: boolean
}

/** A ferramenta em curso; `file` é o arquivo que ela toca, se houver (o item na mão do pet). */
export type Working = { tool: string; cls: Cls; summary: string; file?: string }
export type Card = 'grimorio' | 'compactar'
export type View = 'main' | 'config' | 'sobre' | 'grimorio' | 'boasVindas'

/** Uma janela de uso do plano (5 horas, semanal), como o motor a mede. */
export type UsageWindow = { kind: string; percentUsed: number; resetsAt?: string }

/** Os recursos lidos do motor: a mochila (contexto) e as janelas de uso. */
export type Resources = {
  /** Tokens no contexto agora; ausente antes da primeira resposta. */
  tokens?: number
  /** A janela do modelo, em tokens. */
  window: number
  /** Onde o Claude Code compacta sozinho; ausente com a compactação automática desligada. */
  compactsAt?: number
  /** As maiores categorias do contexto, para o "o que tem na mochila". */
  top: { name: string; tokens: number }[]
  windows: UsageWindow[]
  /** Os tokens no fim de cada turno, os 12 últimos. */
  history: number[]
}

/** As respostas da página Primeiros passos. */
export type Setup = { vault?: 'sim' | 'nao'; msg?: string }

/** Um arquivo protegido na hora da pergunta, com o diff para o modo chefe. */
export type GuardFile = { name: string; path: string; added: number; removed: number; diff: string }

export type Report = {
  chapter: number
  title: string
  /** A linha **Missão:** da resposta; ausente quando o Claude não escreveu uma. */
  mission?: string
  result?: string
  risk?: string
  next?: string
  waits?: string
  durationMs: number
  reason: string
  actions: number
  files: number
  added: number
  removed: number
  created: number
  failed: number
  refusals: string[]
}

export type Chapter = { n: number; prompt: string; turnId?: string; report?: Report }

export type Campaign = {
  id: string
  title: string
  objective: string
  /** O objetivo curto: o título da sessão no app ou a Missão da 1ª resposta. */
  short?: string
  /** De onde veio o curto: o título do app, a Missão da 1ª resposta ou o ✦ Recalibrar (que nada sobrescreve). */
  shortFrom?: 'app' | 'missao' | 'haiku'
  startedAt: number
  achieved: boolean
  chapters: Chapter[]
}

export type InscriptionKind = 'decisao' | 'conquista' | 'preferencia'
export type Destination = 'claudeMd' | 'agentsMd' | 'vaultDecisao' | 'carreira' | 'aiMemory'

export type Inscription = {
  id: string
  kind: InscriptionKind
  text: string
  source: string
  destinations: Destination[]
  sealed?: Destination[]
}

declare module 'claude-code' {
  interface PluginState {
    'hero-journey': {
      lang: Lang
      theme: string
      turnId: string
      diary: DiaryEntry[]
      quests: Quest[]
      party: Member[]
      inventory: Inventory
      prefs: Prefs
      working: Working | null
      cards: Card[]
      view: View
      partyTab: 'grupo' | 'inventario'
      campaign: Campaign | null
      guard: GuardFile[]
      refusals: { turnId: string; text: string }[]
      intent: string
      inscriptions: Inscription[]
      setup: Setup
      resources: Resources | null
      /** Sobe a cada minuto enquanto há reset pela frente: redesenha a contagem. */
      tick: number
      /** O reset de cada janela que já avisou, para avisar uma vez por período. */
      warned: Record<string, number>
    }
  }
}
