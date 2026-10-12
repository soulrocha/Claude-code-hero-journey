// O palco do painel: quem está em cena (a classe da ferramenta em curso, o
// Aprendiz pensando ou o acampamento) e quanto espaço cada seção ganha. Regras
// puras, sem `$`; o desenho fica em view.tsx.

import type { Cls, DiaryEntry, Turn, Working } from '../../../types'
import type { Place } from '../../core/cenarios'
import { PLACE_OF } from '../../core/cenarios'
import type { Pose } from '../../core/sprites'
import type { Step } from '../../core/art'

/** Parado há mais que isto, o Aprendiz dorme no acampamento (o cache do prompt já esfriou). */
export const NAP_MS = 5 * 60_000

/**
 * `work`: uma ferramenta em curso; `fail`: a última do turno falhou; `think`:
 * o turno roda sem ferramenta; `wait`: o turno acabou e é a sua vez; `sleep`:
 * parado há mais de NAP_MS; `fresh`: nenhum turno ainda.
 */
export type SceneMode = 'work' | 'fail' | 'think' | 'wait' | 'sleep' | 'fresh'

/** `sage`: o Sábio de visita ao acampamento (algo anotado, ou o progresso por salvar antes de dormir). */
export type Scene = { mode: SceneMode; hero: Cls; pose: Pose; place: Place; file?: string; summary?: string; endedAt?: number; actions: number; sage?: boolean }

/** A cena de agora. `entries`: as linhas do diário do turno em curso. */
export const sceneOf = (turn: Turn, working: Working | null, entries: readonly DiaryEntry[], now: number): Scene => {
  if (turn.busy && working !== null) {
    const failed = entries[entries.length - 1]?.status === 'err'
    return {
      mode: failed ? 'fail' : 'work',
      hero: working.cls,
      pose: failed ? 'fail' : 'work',
      place: PLACE_OF[working.cls],
      file: working.file,
      summary: working.summary,
      actions: entries.length,
    }
  }
  if (turn.busy) return { mode: 'think', hero: 'aprendiz', pose: 'work', place: 'treino', actions: entries.length }
  const camp = { hero: 'aprendiz' as const, place: 'acampamento' as const, endedAt: turn.endedAt, actions: 0 }
  if (turn.endedAt === undefined) return { ...camp, mode: 'fresh', pose: 'idle' }
  return now - turn.endedAt > NAP_MS ? { ...camp, mode: 'sleep', pose: 'sleep' } : { ...camp, mode: 'wait', pose: 'idle' }
}

/** Os passos à vista: com muitos, os feitos viram uma linha só ("✓ 4 feitos") e sobra lugar para o atual e os próximos. */
export const stepWindow = (steps: readonly Step[], max: number) => {
  if (steps.length <= max) return { hidden: 0, shown: [...steps] }
  const now = Math.max(0, steps.findIndex(s => s.state !== 'done'))
  // Um feito antes do atual, para mostrar de onde veio; os outros feitos ficam na linha de resumo.
  const start = Math.max(0, Math.min(now - 1, steps.length - (max - 1)))
  return { hidden: start, shown: steps.slice(start, start + max - 1) }
}

/** A altura de uma linha de texto do painel desktop, em px de Svg. */
export const ROW_PX = 19
export const STAGE_MIN = 170
export const STAGE_MAX = 320
/** Passos do plano à vista, no máximo. */
export const MAX_STEPS = 5

/**
 * Quanto cabe no painel com o rodapé preso no fim. O palco cresce quando não há
 * plano, grupo nem inventário (o espaço que antes ficava vazio); com eles, fica
 * em 170 px e as listas ganham o resto. Sem o mínimo, o painel solta o rodapé.
 */
export const layoutOf = (rows: number, d: { goal: boolean; steps: number; party: number; items: number }) => {
  const plan = d.steps >= 2
  const stepRows = plan ? Math.min(MAX_STEPS, d.steps) : 0
  // O agora (2 linhas e o espaço), o objetivo (título, texto e a barra com os passos, ou a nota) e o rodapé.
  const goalRows = d.goal ? 1 + 1 + 2 + (plan ? 2 + stepRows : 1) : 0
  const fixed = 3 + goalRows + 6
  const roomy = !plan && d.party === 0 && d.items === 0
  const stage = roomy ? Math.max(STAGE_MIN, Math.min(STAGE_MAX, (rows - fixed - 1) * ROW_PX)) : STAGE_MIN
  let left = rows - fixed - Math.ceil(stage / ROW_PX)
  // O grupo: título e duas linhas por herói; o inventário: título e uma linha por item.
  const maxCards = d.party === 0 ? 0 : Math.max(1, Math.min(d.party, 4, Math.floor((left - 2) / 2)))
  if (d.party > 0) left -= 2 + 2 * maxCards + (d.party > maxCards ? 1 : 0)
  const maxItems = d.items === 0 ? 0 : Math.max(1, Math.min(d.items, 6, left - 3))
  if (d.items > 0) left -= 2 + maxItems + (d.items > maxItems ? 1 : 0)
  return { stage, maxCards, maxItems, pinned: left >= 0 }
}
