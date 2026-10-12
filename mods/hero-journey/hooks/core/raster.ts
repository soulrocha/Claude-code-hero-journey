// As artes no terminal: cada pixel vira meia célula (▀/▄), num `Raster`.
// Os pixels são os Clawds desenhados para o terminal (core/tsprites.ts).

/** As props de um `Raster`: o que o terminal pinta. */
export type RasterArt = { key: string; columns: number; rows: number; cells: string }

const DEFAULT = 0x01000000
const UPPER = 0x2580
const LOWER = 0x2584
const SPACE = 0x20

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const base64 = (bytes: Uint8Array) => {
  let s = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!
    const b = bytes[i + 1] ?? 0
    const c = bytes[i + 2] ?? 0
    s += B64[a >> 2]! + B64[((a & 3) << 4) | (b >> 4)]!
    s += i + 1 < bytes.length ? B64[((b & 15) << 2) | (c >> 6)]! : '='
    s += i + 2 < bytes.length ? B64[c & 63]! : '='
  }
  return s
}

/**
 * Pixels prontos (os Clawds do terminal) em células, ampliados `scale` vezes sem suavizar:
 * cada pixel vira `scale` colunas e `scale` meias-linhas.
 */
export const rasterOfPixels = (px: readonly (number | undefined)[], pw: number, ph: number, key: string, scale = 1): RasterArt => {
  const w = pw * scale
  const hpx = ph * scale
  const at = (x: number, y: number) => (y < hpx ? px[Math.floor(y / scale) * pw + Math.floor(x / scale)] : undefined)
  const h = Math.ceil(hpx / 2)
  const words = new Uint32Array(w * h * 3)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const top = at(x, y * 2)
      const bottom = at(x, y * 2 + 1)
      const o = (y * w + x) * 3
      if (top === undefined && bottom === undefined) words.set([SPACE, DEFAULT, DEFAULT], o)
      else if (top === undefined) words.set([LOWER, bottom!, DEFAULT], o)
      else words.set([UPPER, top, bottom ?? DEFAULT], o)
    }
  return { key, columns: w, rows: h, cells: base64(new Uint8Array(words.buffer)) }
}
