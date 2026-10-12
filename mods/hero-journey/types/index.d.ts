/** As 19 classes do Clawd; o mapa de cada uma está em docs/classes.md. */
export type Cls =
  | 'aprendiz'
  | 'mago'
  | 'cacador'
  | 'ladino'
  | 'runico'
  | 'ilusionista'
  | 'sabio'
  | 'engenheiro'
  | 'bruxo'
  | 'rei'
  | 'artifice'
  | 'oraculo'
  | 'geomante'
  | 'alquimista'
  | 'cartomante'
  | 'invocador'
  | 'cronomante'
  | 'paladino'
  | 'pintor'

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
  /** Commit, push, merge ou PR: o que conta como marco do grimório. */
  delivers?: boolean
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

/** `dialogo`: o Paladino pergunta acima do diálogo do Claude; `nativo`: só avisa no diálogo de permissão. */
export type GuardMode = 'nativo' | 'dialogo'

/**
 * O ⚙ Memória: cada recurso e aviso do grimório liga e desliga. `decisoesEm`:
 * onde caem as decisões e conquistas; em `auto`, no vault se houver e, sem ele,
 * a primeira crônica pergunta.
 */
export type MemoryPrefs = {
  progresso: boolean
  cronica: boolean
  regras: boolean
  lembra: boolean
  avisoPalco: boolean
  avisoMarco: boolean
  avisoCompactar: boolean
  decisoesEm: 'auto' | 'vault' | 'projeto'
}

export type Prefs = {
  skin: Skin
  modules: Partial<Record<ModuleId, boolean>>
  guardMode: GuardMode
  grimorioHaiku: boolean
  memory: MemoryPrefs
}

/** O turno: se o Claude está trabalhando e quando terminou o último (o acampamento dorme depois de um tempo parado). */
export type Turn = { busy: boolean; endedAt?: number }

/** A ferramenta em curso;`file` é o arquivo que ela toca, se houver (o item na mão do pet). */
export type Working = { tool: string; cls: Cls; summary: string; file?: string }
/** Os cartões acima do prompt: só o fim de marco e o de compactar (com o salvar progresso). */
export type Card = 'marco' | 'compactar'
export type View = 'main' | 'config' | 'memoria' | 'sobre' | 'grimorio' | 'boasVindas'

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

/** Um arquivo protegido na hora da pergunta, com o diff que o Paladino mostra. */
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

/** Decisão e conquista vão para a crônica; regra vira linha do AGENTS.md. */
export type InscriptionKind = 'decisao' | 'conquista' | 'regra'
/** `projeto`: docs/decisoes do próprio projeto, para quem não tem vault. */
export type Destination = 'agentsMd' | 'vaultDecisao' | 'carreira' | 'projeto' | 'aiMemory'

/** O que um Selar gravou, para o Desfazer: arquivo novo, linha acrescentada ou página do ai-memory. */
export type Written = { dest: Destination; path: string; mode: 'novo' | 'linha' | 'pagina'; line?: string }

export type Inscription = {
  id: string
  kind: InscriptionKind
  text: string
  source: string
  /** Um destino só, já sugerido; vazio quando a pessoa ainda não disse onde guardar as decisões. */
  destinations: Destination[]
  sealed?: Destination[]
  written?: Written[]
}

/** Um progresso salvo: a tarefa num arquivo ou o handoff no ai-memory. */
export type Progress = {
  id: string
  title: string
  next: string
  updated: string
  /** Quem salvou e onde, para a linha "ontem 18:40 · Claude Code". */
  by: string
  path?: string
  handoffId?: string
}

/** O progresso desta sessão: o último salvamento (com o texto de antes, para o Desfazer) e o que dá para continuar. */
export type ProgressState = { saved?: { at: number; path: string; id: string; handoffId?: string; created: boolean; before?: string }; list: Progress[] }

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
      campaign: Campaign | null
      guard: GuardFile[]
      refusals: { turnId: string; text: string }[]
      turn: Turn
      inscriptions: Inscription[]
      progress: ProgressState
      /** O que o Sábio lembra (páginas do ai-memory, ou as notas da memória automática do Claude). */
      remembered: { kind: string; text: string; path: string }[]
      setup: Setup
      resources: Resources | null
      /** Sobe a cada minuto enquanto há reset pela frente: redesenha a contagem. */
      tick: number
      /** O reset de cada janela que já avisou, para avisar uma vez por período. */
      warned: Record<string, number>
    }
  }
}
