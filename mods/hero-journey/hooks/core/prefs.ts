// Preferências da HUD: os módulos que ligam e desligam, a pele e o modo da guarda.

import type { ModuleId, Prefs } from '../../types'

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

export const DEFAULT_PREFS: Prefs = {
  partyJoined: true,
  skin: 'epico',
  modules: {},
  guardMode: 'dialogo',
  grimorioHaiku: false,
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
    partyJoined: typeof s.partyJoined === 'boolean' ? s.partyJoined : DEFAULT_PREFS.partyJoined,
    skin: s.skin === 'sobrio' ? 'sobrio' : 'epico',
    modules,
    guardMode: s.guardMode === 'nativo' || s.guardMode === 'chefe' ? s.guardMode : 'dialogo',
    grimorioHaiku: s.grimorioHaiku === true,
  }
}
