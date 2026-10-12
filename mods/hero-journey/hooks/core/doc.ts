// A base de toda arte da HUD: o tipo que o `Svg` do desktop recebe, o escape de
// texto e o documento SVG com a fonte e as animações comuns. Fica separado para
// sprites.ts e cenarios.ts não dependerem de art.ts (que depende deles).

export const esc = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** O que um `Svg` do desktop recebe. */
export type Art = { source: string; width: number; height: number; alt: string }

export const KEYFRAMES = [
  '.eye{animation:blink 4.4s infinite}@keyframes blink{0%,94%,100%{opacity:1}96%{opacity:0}}',
  '.mag{animation:mag 2.6s ease-in-out infinite}@keyframes mag{50%{transform:translateY(9px)}}',
  '.gearr{transform-box:fill-box;transform-origin:center;animation:gr 4s linear infinite}@keyframes gr{to{transform:rotate(360deg)}}',
  '.bub{animation:bub 2.2s ease-in infinite;opacity:0}@keyframes bub{0%{opacity:0;transform:none}25%{opacity:1}100%{opacity:0;transform:translateY(-14px)}}',
  '.glow{animation:glow 2.6s ease-in-out infinite}@keyframes glow{50%{opacity:.35}}',
  '.bobs{animation:bob 2.2s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-2px)}}',
  '.breath{animation:breath 2.4s ease-in-out infinite}@keyframes breath{50%{opacity:.45}}',
  '.sweep{transform-box:view-box;transform-origin:82px 56px;animation:sweep 3.2s ease-in-out infinite}@keyframes sweep{50%{transform:rotate(-7deg)}}',
  '.pick{transform-box:view-box;transform-origin:96px 66px;animation:pick 1.6s ease-in-out infinite}@keyframes pick{0%,100%{transform:rotate(-28deg)}45%{transform:rotate(22deg)}}',
  '.stamp{animation:stamp 2.6s ease-in-out infinite}@keyframes stamp{0%,30%,80%,100%{transform:translateY(-8px)}45%,60%{transform:none}}',
  '.brush{transform-box:view-box;transform-origin:100px 62px;animation:brush 1.6s ease-in-out infinite}@keyframes brush{50%{transform:rotate(-14deg)}}',
  '.lid{transform-box:fill-box;transform-origin:center bottom;animation:lid 1.8s ease-in-out infinite}@keyframes lid{0%,60%,100%{transform:none}75%{transform:rotate(-10deg) translateY(-3px)}}',
  '@media (prefers-reduced-motion:reduce){*{animation:none!important}}',
].join('')

export const doc = (w: number, h: number, inner: string, alt: string, tip?: string): Art => ({
  source:
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    `<style>text{font-family:'Segoe UI',system-ui,sans-serif}${KEYFRAMES}</style>` +
    (tip ? `<title>${esc(tip)}</title>` : '') +
    inner +
    '</svg>',
  width: w,
  height: h,
  alt,
})
