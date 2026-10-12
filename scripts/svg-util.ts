// O que os geradores do README (gerar-assets e gerar-demo) fazem com a arte da HUD
// ao juntar várias peças num SVG só.

/**
 * Dá IDs próprios a uma arte embutida: cada cenário e cada sprite define os seus
 * (`sky`, `glow`, `orb`…), únicos só enquanto ele é um documento sozinho. Juntos,
 * `url(#sky)` pegaria o de outra peça. O prefixo vale para as definições e as referências.
 */
export const scopeIds = (svg: string, prefix: string) => {
  const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]!))
  if (ids.size === 0) return svg
  return svg
    .replace(/\sid="([^"]+)"/g, (_, id: string) => ` id="${prefix}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (m, id: string) => (ids.has(id) ? `url(#${prefix}${id})` : m))
    .replace(/(href)="#([^"]+)"/g, (m, attr: string, id: string) => (ids.has(id) ? `${attr}="#${prefix}${id}"` : m))
}

const scaleTimes = (text: string, factor: number) => text.replace(/(-?\d*\.?\d+)s\b/g, (_, n: string) => `${(Number(n) * factor).toFixed(2)}s`)

/**
 * O README é a vitrine de quem acabou de chegar: as animações rodam mais devagar que
 * na HUD. Vale para o CSS (duração e atraso) e para o SMIL (`dur` e `begin` do
 * `<animate…>`), como as órbitas do Mago e do Rúnico.
 */
export const calm = (svg: string, factor: number) =>
  svg
    .replace(/animation(-delay)?:([^;}"]*)/g, (_, delay: string | undefined, decl: string) => `animation${delay ?? ''}:${scaleTimes(decl, factor)}`)
    .replace(/\s(dur|begin)="([^"]*)"/g, (_, attr: string, value: string) => ` ${attr}="${scaleTimes(value, factor)}"`)
