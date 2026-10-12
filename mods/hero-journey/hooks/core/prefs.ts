// Preferências da HUD: os módulos que ligam e desligam, a pele e o modo da guarda.

import type { MemoryPrefs, ModuleId, Prefs } from '../../types'

/** Ordem em que o ⚙ mostra os módulos; `tokens` marca quem pode gastar. */
export const MODULES: readonly { id: ModuleId; tokens: boolean }[] = [
  { id: 'diario', tokens: false },
  { id: 'faixa', tokens: false },
  { id: 'painel', tokens: false },
  { id: 'campanha', tokens: true },
  { id: 'recibo', tokens: false },
  { id: 'mochila', tokens: true },
  { id: 'guarda', tokens: false },
  { id: 'grimorio', tokens: true },
]

/** Tudo ligado: com vault e ai-memory detectados, é a configuração recomendada; sem eles, cada recurso usa o projeto. */
export const DEFAULT_MEMORY: MemoryPrefs = {
  progresso: true,
  cronica: true,
  regras: true,
  lembra: true,
  avisoPalco: true,
  avisoMarco: true,
  avisoCompactar: true,
  decisoesEm: 'auto',
}

export const DEFAULT_PREFS: Prefs = {
  skin: 'epico',
  modules: {},
  guardMode: 'dialogo',
  grimorioHaiku: false,
  memory: DEFAULT_MEMORY,
}

/** Todo módulo nasce ligado; a pessoa desliga no ⚙. */
export const isOn = (prefs: Prefs, id: ModuleId) => prefs.modules[id] !== false

export const toggleModule = (prefs: Prefs, id: ModuleId): Prefs => ({
  ...prefs,
  modules: { ...prefs.modules, [id]: !isOn(prefs, id) },
})

const KNOWN = new Set<string>(MODULES.map(m => m.id))

/**
 * Preferências guardadas de uma versão antiga ganham os campos novos e perdem
 * os que saíram (perfis, seções, modo do diário, módulos que deixaram a HUD).
 */
export const migratePrefs = (stored: unknown): Prefs => {
  const s = (stored ?? {}) as Partial<Prefs> & Record<string, unknown>
  const modules = Object.fromEntries(Object.entries(s.modules ?? {}).filter(([id]) => KNOWN.has(id)))
  return {
    skin: s.skin === 'sobrio' ? 'sobrio' : 'epico',
    modules,
    // O modo chefe saiu na 0.6: quem usava passa a ter o dragão perguntando.
    guardMode: s.guardMode === 'nativo' ? 'nativo' : 'dialogo',
    grimorioHaiku: s.grimorioHaiku === true,
    memory: migrateMemory(s.memory),
  }
}

export type MemoryToggle = Exclude<keyof MemoryPrefs, 'decisoesEm'>

const migrateMemory = (stored: unknown): MemoryPrefs => {
  const m = (stored ?? {}) as Partial<MemoryPrefs>
  const flag = (k: MemoryToggle) => (typeof m[k] === 'boolean' ? (m[k] as boolean) : DEFAULT_MEMORY[k])
  return {
    progresso: flag('progresso'),
    cronica: flag('cronica'),
    regras: flag('regras'),
    lembra: flag('lembra'),
    avisoPalco: flag('avisoPalco'),
    avisoMarco: flag('avisoMarco'),
    avisoCompactar: flag('avisoCompactar'),
    decisoesEm: m.decisoesEm === 'vault' || m.decisoesEm === 'projeto' ? m.decisoesEm : 'auto',
  }
}

export const toggleMemory = (prefs: Prefs, k: MemoryToggle): Prefs => ({ ...prefs, memory: { ...prefs.memory, [k]: !prefs.memory[k] } })
