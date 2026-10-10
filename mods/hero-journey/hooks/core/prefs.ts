// Preferências da HUD: perfis, seções do painel e os módulos que ligam e desligam.

import type { ModuleId, Prefs, Profile, Section } from '../../types'

/** Ordem em que o ⚙ mostra os módulos; `tokens` marca quem pode gastar. */
export const MODULES: readonly { id: ModuleId; tokens: boolean }[] = [
  { id: 'diario', tokens: false },
  { id: 'faixa', tokens: false },
  { id: 'painel', tokens: false },
  { id: 'campanha', tokens: true },
  { id: 'guarda', tokens: false },
  { id: 'mochila', tokens: true },
  { id: 'grimorio', tokens: true },
  { id: 'sideQuest', tokens: false },
  { id: 'comemoracao', tokens: false },
  { id: 'projetos', tokens: false },
]

export const DEFAULT_PREFS: Prefs = {
  profile: 'completo',
  hidden: [],
  diary: 'agrupado',
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

// O relatório saiu do painel (2026-10-09): a seção fica no tipo só para ler prefs antigas.
export const SECTIONS: readonly Section[] = ['objetivo', 'quests', 'grupo', 'inventario', 'rodape']

/** O que cada perfil esconde do painel. O Personalizado guarda a escolha da pessoa. */
export const PROFILE_HIDDEN: Record<Exclude<Profile, 'personalizado'>, Section[]> = {
  completo: [],
  foco: ['grupo', 'inventario'],
  minimo: ['objetivo', 'quests', 'grupo', 'inventario'],
}

export const withProfile = (prefs: Prefs, profile: Profile): Prefs =>
  profile === 'personalizado' ? { ...prefs, profile } : { ...prefs, profile, hidden: [...PROFILE_HIDDEN[profile]] }

export const toggleSection = (prefs: Prefs, section: Section): Prefs => ({
  ...prefs,
  profile: 'personalizado',
  hidden: prefs.hidden.includes(section) ? prefs.hidden.filter(s => s !== section) : [...prefs.hidden, section],
})

export const isShown = (prefs: Prefs, section: Section) => !prefs.hidden.includes(section)

/** Preferências guardadas de uma versão antiga ganham os campos novos. */
export const migratePrefs = (stored: unknown): Prefs => {
  const s = (stored ?? {}) as Partial<Prefs>
  const hidden = Array.isArray(s.hidden) ? s.hidden.filter((x): x is Section => SECTIONS.includes(x as Section)) : []
  return { ...DEFAULT_PREFS, ...s, hidden, modules: { ...(s.modules ?? {}) } }
}
