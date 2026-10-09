// O que toda tela usa: os elementos da superfície, o Svg só no desktop e o
// título de seção nas duas peles. Nenhuma função aqui usa `$`.

import type { EngineInterface } from 'claude-code'

import type { Palette, Skin } from '../../types'
import type { Art } from './art'
import { sectionTitle } from './art'
import type { Dict } from './i18n'

export type Ui = ReturnType<EngineInterface['ui']['resolve']>
type DesktopUi = Extract<Ui, { Svg: unknown }>

export const GITHUB_URL = 'https://github.com/soulrocha/Claude-code-hero-journey'
/** O LinkedIn do Saulo, no "Sobre". */
export const LINKEDIN_URL = 'https://www.linkedin.com/in/soulrocha'
export const VERSION = '0.4.0'

export type Ctx = {
  ui: Ui
  desktop: boolean
  t: Dict
  palette: Palette
  skin: Skin
  width: number
  /** O tom quente do painel; ausente quando o tema do Claude é automático (não dá para saber se é claro). */
  bg?: string
}

/** Svg só no desktop; nas outras superfícies, nada (quem chama põe o texto). */
export const svg = (ui: Ui, desktop: boolean, a: Art, key?: string) => {
  if (!desktop) return null
  const { Svg } = ui as DesktopUi
  return <Svg key={key ?? a.alt} source={a.source} width={a.width} height={a.height} alt={a.alt} isInteractive />
}

/** A largura útil em px, a partir das colunas do painel. */
export const pxOf = (c: Ctx) => Math.min(c.width * 7.6, 420)

export const title = (c: Ctx, text: string, mark?: '!' | '?') => {
  const { Text } = c.ui
  return c.desktop ? (
    svg(c.ui, true, sectionTitle(text, c.palette, c.skin, pxOf(c), mark), `title-${text}`)
  ) : (
    <Text bold color="claude">
      {c.skin === 'epico' ? `◆ ${mark === undefined ? '' : `${mark} `}${text} ◆` : text.toUpperCase()}
    </Text>
  )
}

type InputUi = Extract<Ui, { Input: unknown }>

/** O campo de texto, nas superfícies que têm (desktop e terminal); senão, nada. */
export const inputOf = (ui: Ui): InputUi['Input'] | undefined => ('Input' in ui ? (ui as InputUi).Input : undefined)
