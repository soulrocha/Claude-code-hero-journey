// Os Clawds do terminal: pixel art desenhada para o meio-bloco (▀), não reduzida do SVG.
// Tela de 24×13 pixels; o corpo é a grade do Clawd (14×6) em x=5, y=7. Cada classe veste
// as peças que a identificam no desktop (chapéu, arma, objeto), chapadas e sem fundo.

import type { Cls } from '../../types'

export type TPose = 'work' | 'fail' | 'idle' | 'sleep'

export const TW = 24
export const TH = 13

const INK: Record<string, number> = {
  O: 0xd97757, // corpo
  E: 0x1a1a1a, // olhos
  K: 0x45454e, // escuro (claro o bastante para o fundo preto do terminal)
  k: 0x55555c, // cinza escuro
  W: 0xf2ead8, // branco
  C: 0xe9dcb8, // pergaminho
  Y: 0xf0c04a, // ouro
  y: 0xb8862c, // ouro escuro
  B: 0x4a7fd4, // azul
  b: 0x9cc8f2, // azul claro
  D: 0x2c2a63, // azul noite
  P: 0x8a63d2, // roxo
  p: 0xc4a8f5, // lilás
  R: 0xc8383a, // vermelho
  r: 0xf08090, // rosa
  G: 0x3f9e4a, // verde
  g: 0xa6dc6a, // verde claro
  N: 0x7a4a24, // marrom
  n: 0xc4904e, // madeira
  S: 0xc9d1dc, // aço
  s: 0x7d8694, // aço escuro
  T: 0x35c2b0, // turquesa
  F: 0xff8a2a, // fogo
  f: 0xffd75a, // chama
}

/** Uma peça: canto (x, y) e as linhas, um caractere por pixel ('.' é vazio). */
type Piece = readonly [number, number, readonly string[]]

const BODY: Piece = [5, 7, ['..OOOOOOOOOO..', '..OOEOOOOEOO..', 'OOOOOOOOOOOOOO', '..OOOOOOOOOO..', '..OOOOOOOOOO..', '..O.O....O.O..']]
/** Olhos fechados (dormindo) e o balão de susto da falha. */
const SHUT: Piece = [9, 8, ['O....O']]
const OOPS: Piece = [20, 0, ['WWW', 'WRW', 'WRW', 'WWW', 'W..']]

type Look = { work: Piece[]; fail: Piece[] }

const L: Record<Cls, Look> = {
  aprendiz: {
    work: [[7, 7, ['WWWWWWWWWW']], [16, 6, ['..W', '.WW']], [20, 1, ['..n', '..n', '.n.', '.n.', 'n..', 'n..']], [18, 7, ['NNN', '.N.']]],
    fail: [[7, 7, ['WWWWWWWWWW']], [17, 12, ['NNnnnnn']]],
  },
  mago: {
    work: [
      [12, 0, ['B']], [11, 1, ['BB']], [11, 2, ['BYB']], [10, 3, ['BBBB']], [10, 4, ['BBBBB']], [9, 5, ['bbbbbbb']], [6, 6, ['BBBBBBBBBBBBB']],
      [0, 8, ['NNNNN', 'NYYNN', 'NNNNN']],
      [20, 9, ['.g.', 'ggg', '.g.']],
    ],
    fail: [
      [13, 0, ['B']], [12, 1, ['BB']], [12, 2, ['BYB']], [11, 3, ['BBBB']], [11, 4, ['BBBBB']], [10, 5, ['bbbbbbb']], [7, 6, ['BBBBBBBBBBBBB']],
      [0, 12, ['NNYNN']],
    ],
  },
  runico: {
    work: [
      [9, 1, ['.T....T.', 'T..T...T', '.T.T..T.', '...T....']],
      [0, 5, ['kkkk', 'kTTk', 'kT.k', 'kkkk']],
      [20, 3, ['kkkk', 'kgTk', 'kTgk', 'kkkk']],
    ],
    fail: [[0, 10, ['kkkk', 'kRTk', 'kkkk']], [20, 10, ['kkkk', 'kTRk', 'kkkk']]],
  },
  engenheiro: {
    work: [[8, 5, ['RRRRRRR']], [6, 6, ['RRRRRRRRRRR.R']], [10, 9, ['KKKK']], [21, 1, ['S', 'S', 'S', 'S', 'S', 's']], [19, 7, ['ssss', 'sPPs', 'ssss']]],
    fail: [[8, 5, ['RRRRRRR']], [6, 6, ['RRRRRRRRRRR.R']], [10, 9, ['KKKK']], [19, 11, ['ssss', 'sPss']], [18, 9, ['f.']]],
  },
  bruxo: {
    work: [[9, 8, ['Y']], [14, 8, ['Y']], [5, 2, ['N.', 'N.', '.S', '.S', '..']], [22, 2, ['S', 'S']], [21, 4, ['S']], [20, 5, ['S']], [19, 6, ['N']], [18, 7, ['NN']], [11, 10, ['ss']]],
    fail: [[9, 8, ['Y']], [14, 8, ['Y']], [5, 2, ['N.', 'N.', '.S', '.S']], [11, 10, ['ss']], [20, 6, ['.rr.', 'rrrr', 'rKKr', '.rr.']], [17, 12, ['SSSN']]],
  },
  rei: {
    work: [[8, 3, ['Y...Y...Y']], [8, 4, ['YY.YYY.YY']], [8, 5, ['YRYYBYYGY']], [8, 6, ['YYYYYYYYY']], [3, 8, ['RR', 'RR', 'RR', 'RR', 'R.']], [19, 8, ['RR', 'RR', 'RR', 'RR', '.R']], [20, 10, ['CCCC', 'CKKC', 'CCCC']]],
    fail: [[11, 3, ['....Y', '..YYY', 'YYRYY', 'YYYY.']], [3, 8, ['RR', 'RR', 'RR', 'RR', 'R.']], [19, 11, ['CC.C', 'C.CC']]],
  },
  ilusionista: {
    work: [[17, 1, ['.r', 'rr', 'r.']], [10, 4, ['PPPPP']], [9, 5, ['PPPPPPP']], [5, 6, ['ppppppppppppppp']], [19, 9, ['..K', '.K.', 'K..']], [22, 7, ['Y']], [21, 6, ['f']]],
    fail: [[17, 1, ['.r', 'rr', 'r.']], [10, 4, ['PPPPP']], [9, 5, ['PPPPPPP']], [5, 6, ['ppppppppppppppp']], [19, 12, ['KKK']], [1, 10, ['p.T', '.Y.']]],
  },
  sabio: {
    work: [[13, 0, ['D']], [12, 1, ['DD']], [12, 2, ['DYD']], [11, 3, ['DDDD']], [10, 4, ['DDYDD']], [9, 5, ['DDDDDDD']], [6, 6, ['DDDDDDDDDDDDD']], [0, 6, ['CCCCC', 'CKKKC', 'CCCCC', 'CKKCC', 'CCCCC', 'nnnnn']]],
    fail: [[13, 0, ['D']], [12, 1, ['DD']], [12, 2, ['DYD']], [11, 3, ['DDDD']], [10, 4, ['DDYDD']], [9, 5, ['DDDDDDD']], [6, 6, ['DDDDDDDDDDDDD']], [0, 11, ['CCCCC', 'CKCCK']]],
  },
  cacador: {
    work: [[6, 6, ['.G.g..G.g.G.']], [6, 7, ['GGGGGGGGGGGG']], [1, 4, ['.N', 'N.', 'NW', 'NW', 'NW', 'N.', '.N']], [19, 2, ['nnnn', 'nYYn', 'nnnn', '.CC.', '.CK.']]],
    fail: [[6, 6, ['.G.g..G.g.G.']], [6, 7, ['GGGGGGGGGGGG']], [0, 12, ['NNNNN']], [19, 10, ['CCCC', 'CRRC']]],
  },
  ladino: {
    work: [[5, 8, ['KKKKWKKKKWKKKK']], [0, 8, ['.NN.', 'NNNN', 'NnNN', 'NNNN', '.NN.']], [19, 10, ['..S', '.S.', 'K..']], [19, 1, ['kkkkk', 'kBBBk', 'kWBWk', 'kkkkk']]],
    fail: [[5, 8, ['KKKKWKKKKWKKKK']], [0, 8, ['.NN.', 'NNNN', 'NnNN', 'NNNN', '.NN.']], [19, 1, ['kkkkk', 'kYYYk', 'kYKYk', 'kkkkk']]],
  },
  artifice: {
    work: [[7, 7, ['ssbsssssbsss']], [8, 10, ['NNNNNNNN', 'NNNNNNNN']], [19, 3, ['ssss', 'ssss', '.N..', '.N..', '.N..', '.N..']], [19, 11, ['kkkk', '.kk.']]],
    fail: [[7, 7, ['ssbsssssbsss']], [8, 10, ['NNNNNNNN', 'NNNNNNNN']], [0, 11, ['ss..', 'ssNN']], [19, 11, ['kkkk', '.kk.']]],
  },
  oraculo: {
    work: [[11, 5, ['WWW']], [11, 6, ['WBW']], [7, 7, ['YYYYYYYYYY']], [19, 7, ['.bb.', 'bTTb', 'bTbb', '.bb.', 'nnnn']]],
    fail: [[11, 5, ['WWW']], [11, 6, ['WRW']], [7, 7, ['YYYYYYYYYY']], [19, 7, ['.bb.', 'bKTb', 'bTKb', '.bb.', 'nnnn']]],
  },
  geomante: {
    work: [[12, 6, ['Y']], [5, 7, ['GGGgGGGGgGGG']], [19, 4, ['nnnn', 'NNNN']], [19, 8, ['ssss', 'kkkk', 'ssss', 'kkkk', 'ssss']]],
    fail: [[12, 6, ['Y']], [5, 7, ['GGGgGGGGgGGG']], [19, 10, ['s.ss', 'kk.k', 'ssss']]],
  },
  alquimista: {
    work: [[3, 1, ['..gggggggggggggggg', '.g................g', 'g..................g']], [7, 7, ['KgKKKKKKgKKK']], [0, 4, ['g', 'g', 'g']], [0, 7, ['.k.', 'kBk', 'BBB', '.B.']], [20, 4, ['g', 'g', 'g']], [19, 7, ['.k.', 'kYk', 'YYY', '.Y.']]],
    fail: [[7, 7, ['KgKKKKKKgKKK']], [0, 9, ['.k.', 'kBk', 'BBB']], [19, 6, ['pp..', 'ppp.', '.pp.']], [19, 10, ['.k.', 'k.k', 'YYY']]],
  },
  cartomante: {
    work: [[7, 7, ['YYYYYYYYYY']], [0, 3, ['WWW', 'WGW', 'GWW', 'WWW']], [6, 0, ['WWW', 'WYW', 'WWW', 'WWW']], [15, 0, ['DDD', 'DYD', 'DDD', 'DDD']], [20, 3, ['DDD', 'DYD', 'DDD', 'DDD']], [20, 10, ['.pp', 'pPp', 'pp.']]],
    fail: [[7, 7, ['YYYYYYYYYY']], [0, 11, ['WWWDDD', 'WRWDYD']], [19, 11, ['DDDW', 'DYDW']]],
  },
  invocador: {
    work: [[7, 7, ['YYYYYYYYYY']], [11, 6, ['P']], [19, 2, ['.p.', 'pPp', 'PPP', '.P.']], [20, 6, ['N', 'N', 'N', 'N', 'N', 'N']], [0, 3, ['.B.', 'BBB', 'OOO', 'O.O']], [3, 12, ['p..']], [17, 12, ['..p']]],
    fail: [[7, 7, ['YYYYYYYYYY']], [11, 6, ['P']], [18, 11, ['NNNNN', '..PP.']], [1, 12, ['p..p']]],
  },
  cronomante: {
    work: [[8, 0, ['..KKKKKKK..', '.KK..Y..KK.', 'KK...Y...KK', 'KK...YYY.KK', '.KK.....KK.', '..KKKKKKK..']], [5, 5, ['yy..........yy']], [6, 6, ['.y..........y.']], [0, 6, ['yyyy', '.nn.', '..n.', '.nn.', 'yyyy']]],
    fail: [[8, 0, ['..KKKKKKK..', '.KK.....KK.', 'KK...YYY.KK', 'KK..Y....KK', '.KK.....KK.', '..KKKKKKK..']], [5, 5, ['yy..........yy']], [6, 6, ['.y..........y.']], [0, 11, ['yyyy.', '.nnyy']]],
  },
  paladino: {
    work: [[17, 0, ['.R', 'RR', 'R.']], [9, 3, ['SSSSS']], [7, 4, ['SSSSSSSSS']], [6, 5, ['SSSSSSSSSSS']], [6, 6, ['sssssssssss']], [0, 7, ['BBBBB', 'BBYBB', 'BYYYB', 'BBYBB', '.BBB.', '..B..']], [21, 1, ['S', 'S', 'S', 'S', 'S', 'S', 'S']], [20, 8, ['YYY', '.N.']]],
    fail: [[17, 0, ['.R', 'RR', 'R.']], [9, 3, ['SSSSS']], [7, 4, ['SSSSSSSSS']], [6, 5, ['SSSSSSSSSSS']], [6, 6, ['sssssssssss']], [0, 7, ['BBBK.', 'BBYKB', 'BYKYB', 'BKYBB', '.KBB.', '..B..']]],
  },
  pintor: {
    work: [[13, 4, ['K']], [8, 5, ['KKKKKKK']], [7, 6, ['KKKKKKKKK']], [17, 0, ['RRRR', 'YYYYY', '.GGGGG']], [0, 8, ['.nnn.', 'nRnBn', 'nnGnn', '.nYn.']], [19, 9, ['..K', '.K.', 'Y..']]],
    fail: [[13, 4, ['K']], [8, 5, ['KKKKKKK']], [7, 6, ['KKKKKKKKK']], [0, 8, ['.nnn.', 'nRnBn', 'nnGnn', '.nYn.']], [8, 10, ['R...Y..T']], [19, 12, ['YKKK']]],
  },
}

/** A fogueira do acampamento (acesa, ou só as brasas com a sessão parada). */
const FIRE: Piece = [19, 7, ['..f..', '.fFf.', '.FfF.', 'FFfFF', 'NnNnN', '.N.N.']]
/** O segundo quadro da chama, que tremula. */
const FIRE2: Piece = [19, 7, ['.f...', '.Ff..', 'FfFf.', 'FFfFF', 'NnNnN', '.N.N.']]
const EMBERS: Piece = [19, 10, ['..F..', '.RFR.', 'NnNnN', '.N.N.']]
const ZZ: Piece = [15, 1, ['...WWWW', '.....W.', '....W..', '...WWWW', 'WW.....', '.W.....', 'WW.....']]

const paint = (pieces: readonly Piece[]) => {
  const px: (number | undefined)[] = new Array(TW * TH).fill(undefined)
  for (const [x0, y0, rows] of pieces)
    rows.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) {
        const c = INK[row[dx]!]
        const x = x0 + dx
        const y = y0 + dy
        if (c !== undefined && x >= 0 && x < TW && y >= 0 && y < TH) px[y * TW + x] = c
      }
    })
  return px
}

/** Sobe as peças do personagem `dy` pixels (o quadro 1 da animação). */
const lift = (pieces: readonly Piece[], dy: number): Piece[] => pieces.map(([x, y, rows]) => [x, y - dy, rows])

/**
 * Os pixels de um Clawd do terminal, 0xRRGGBB ou vazio. `camp` põe a fogueira ao lado.
 * No quadro 1 o personagem sobe 1 pixel e a chama muda; dormindo, só o "Zz" sobe.
 */
export const tsprite = (cls: Cls, pose: TPose, camp = false, frame: 0 | 1 = 0) => {
  const look = L[cls]
  const band = L.aprendiz.work.slice(0, 2)
  const up = frame === 1 ? 1 : 0
  const pieces: Piece[] =
    pose === 'fail'
      ? [BODY, ...look.fail, OOPS]
      : pose === 'idle'
        ? [...lift([BODY, ...(camp ? band : look.work)], up), ...(camp ? [frame === 1 ? FIRE2 : FIRE] : [])]
        : pose === 'sleep'
          ? [BODY, ...band, SHUT, ...(camp ? [EMBERS] : []), ...lift([ZZ], up)]
          : lift([BODY, ...look.work], up)
  return paint(pieces)
}

/** O ícone de cada classe, para onde só cabe uma linha (faixa, diário, spinner, recibo, Sobre). */
export const CLASS_ICON: Record<Cls, string> = {
  aprendiz: '🌱',
  mago: '🔮',
  cacador: '🏹',
  ladino: '🔑',
  runico: '💠',
  ilusionista: '🎭',
  sabio: '📖',
  engenheiro: '🔧',
  bruxo: '🐺',
  rei: '👑',
  artifice: '🔨',
  oraculo: '🧿',
  geomante: '🪨',
  alquimista: '🧪',
  cartomante: '🃏',
  invocador: '🌀',
  cronomante: '⏳',
  paladino: '🛡️',
  pintor: '🎨',
}
