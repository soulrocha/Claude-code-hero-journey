// O que toda tela usa: os elementos da superfície, o Svg só no desktop e o
// título de seção nas duas peles. Nenhuma função aqui usa `$`.

import type { EngineInterface } from 'claude-code'

import type { Palette, Skin } from '../../types'
import type { Art } from './art'
import { heroTitle } from './hero-art'
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

/**
 * O frame isolado do `Svg` interativo pinta o fundo branco quando o esquema de
 * cor dele difere do app. Com o tema automático, segue o do sistema, como o app.
 */
export const withScheme = (source: string, c: Pick<Ctx, 'palette' | 'bg'>) => {
  const scheme = c.bg === undefined ? 'light dark' : c.palette === 'claro' ? 'light' : 'dark'
  return source.replace(/^<svg[^>]*>/, tag => `${tag}<style>:root{color-scheme:${scheme}}</style>`)
}

/** Svg só no desktop; nas outras superfícies, nada (quem chama põe o texto). */
export const svg = (c: Ctx, a: Art, key?: string) => {
  if (!c.desktop) return null
  const { Svg } = c.ui as DesktopUi
  return <Svg key={key ?? a.alt} source={withScheme(a.source, c)} width={a.width} height={a.height} alt={a.alt} isInteractive />
}

/**
 * A largura útil em px: as colunas menos o recuo de 1 de cada lado, a 7,6 px
 * por coluna (medido com a régua do laboratório no app desktop).
 */
export const pxOf = (c: Ctx) => Math.max(160, Math.round((c.width - 2) * 7.6))

/** Título do quest log; `right` é um contador à direita (ex.: "3/8"). */
export const title = (c: Ctx, text: string, mark?: '!' | '?', right?: string) => {
  const { Text } = c.ui
  return c.desktop ? (
    svg(c, heroTitle(pxOf(c), text, c.palette, mark, right), `title-${text}`)
  ) : (
    <Text bold color="claude">
      {c.skin === 'epico' ? `◆ ${mark === undefined ? '' : `${mark} `}${text} ◆` : text.toUpperCase()}
    </Text>
  )
}

type InputUi = Extract<Ui, { Input: unknown }>

/** O campo de texto, nas superfícies que têm (desktop e terminal); senão, nada. */
export const inputOf = (ui: Ui): InputUi['Input'] | undefined => ('Input' in ui ? (ui as InputUi).Input : undefined)
