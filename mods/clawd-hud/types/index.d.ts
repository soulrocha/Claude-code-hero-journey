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
export type Rarity = 'lendario' | 'raro' | 'incomum' | 'pobre'

/** Os módulos da HUD, cada um liga e desliga no ⚙. */
export type ModuleId =
  | 'diario'
  | 'faixa'
  | 'painel'
  | 'guarda'
  | 'campanha'
  | 'grimorio'
  | 'sideQuest'
  | 'mochila'
  | 'comemoracao'
  | 'projetos'

/** Uma linha do diário de bordo: uma chamada de ferramenta da sessão principal. */
export type DiaryEntry = {
  id: string
  tool: string
  cls: Cls
  group: string
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
}

export type Section = 'objetivo' | 'quests' | 'grupo' | 'inventario' | 'relatorio' | 'rodape'
export type Profile = 'completo' | 'foco' | 'minimo' | 'personalizado'
export type GuardMode = 'nativo' | 'dialogo' | 'chefe'

export type Prefs = {
  profile: Profile
  hidden: Section[]
  diary: 'agrupado' | 'separado'
  partyJoined: boolean
  skin: Skin
  modules: Partial<Record<ModuleId, boolean>>
  guardMode: GuardMode
  grimorioHaiku: boolean
}

export type Working = { tool: string; cls: Cls; summary: string }
export type Card = 'grimorio' | 'compactar' | 'sideQuest'
export type View = 'main' | 'config' | 'sobre' | 'grimorio' | 'projetos' | 'boasVindas'

/** Um projeto: um nome e as pastas a que o Claude deve ter acesso nele. */
export type Project = { id: string; name: string; folders: string[]; pinned: boolean }

/** As respostas da página Primeiros passos. */
export type Setup = { vault?: 'sim' | 'nao'; msg?: string }

/** Um arquivo protegido na hora da pergunta, com o diff para o modo chefe. */
export type GuardFile = { name: string; path: string; added: number; removed: number; diff: string }

/** Uma ação do capítulo na linha do tempo do relatório. */
export type Beat = { cls: Cls; tool: string; summary: string; status: 'ok' | 'err' | 'run'; ms?: number }

export type Report = {
  chapter: number
  title: string
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
  beats: Beat[]
  verdict?: 'aprovado' | 'ajustar'
}

export type Chapter = { n: number; prompt: string; turnId?: string; report?: Report }

export type Campaign = {
  id: string
  title: string
  objective: string
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
    'clawd-hud': {
      lang: Lang
      theme: string
      turnId: string
      diary: DiaryEntry[]
      expanded: string[]
      quests: Quest[]
      party: Member[]
      inventory: Inventory
      prefs: Prefs
      working: Working | null
      cards: Card[]
      view: View
      partyTab: 'grupo' | 'inventario'
      campaign: Campaign | null
      reportAt: number
      reportOpen: boolean
      guard: GuardFile[]
      refusals: { turnId: string; text: string }[]
      intent: string
      inscriptions: Inscription[]
      projects: Project[]
      sessionDirs: string[]
      setup: Setup
      confirmDel: string
    }
  }
}
