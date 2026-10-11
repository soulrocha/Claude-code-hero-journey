// Grimório: o cartão acima do prompt (livro, o Mago escrevendo, as inscrições e
// os destinos pré-marcados com a sugestão explicada) e a página no painel.

import type { RenderElement } from 'claude-code'

import type { Destination, Inscription } from '../../../types'
import { classColor, divider, grimHeader, inscriptionArt, TONE } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { inputOf, pxOf, svg, title } from '../../core/ui'
import { available } from './grimorio'
import type { Dests } from './grimorio'

export type GrimActions = {
  toggle: (id: string, dest: Destination) => void
  seal: () => void
  discard: () => void
  /** Só existe com o botão do Haiku ligado no ⚙: gasta tokens, e só no clique. */
  haiku?: () => void
  /** Abre no Explorer/Finder a pasta do vault onde as decisões caem. */
  openDecisions?: () => void
}

const ALL: readonly Destination[] = ['claudeMd', 'agentsMd', 'vaultDecisao', 'carreira', 'aiMemory']

const inscriptionView = (c: Ctx, i: Inscription, paths: Dests, act?: GrimActions) => {
  const { Box, Button, Text } = c.ui
  const kindColor = i.kind === 'decisao' ? classColor('mago', c.palette) : i.kind === 'conquista' ? classColor('arauto', c.palette) : classColor('ilusionista', c.palette)
  return (
    <Box key={`ins-${i.id}`} flexDirection="column">
      {c.desktop ? (
        svg(c, inscriptionArt(pxOf(c), c.t.grimKind[i.kind], kindColor, i.text, act !== undefined ? c.t.grimWhy[i.kind] : '', c.palette), `ins-art-${i.id}`)
      ) : (
        <Text wrap="wrap">
          <Text bold color={kindColor}>
            {c.t.grimKind[i.kind].toUpperCase()}
          </Text>{' '}
          {i.text}
        </Text>
      )}
      {act !== undefined && (
        <Box flexDirection="column" paddingLeft={1}>
          {!c.desktop && (
            <Text dimColor wrap="wrap">
              {c.t.grimWhy[i.kind]}
            </Text>
          )}
          <Box flexDirection="row" columnGap={2} flexWrap="wrap">
            {/* Só o que dá para gravar nesta sessão aparece; o que falta se configura nos Primeiros passos. */}
            {ALL.filter(d => available(d, paths)).map(d => (
              <Button
                key={`dest-${i.id}-${d}`}
                plain
                label={`${i.destinations.includes(d) ? '☑' : '☐'} ${c.t.dest[d]}`}
                onPress={() => act.toggle(i.id, d)}
              />
            ))}
            {/* Marcado e fora do ar agora (o MCP caiu, a pasta sumiu): fica à vista, esperando. */}
            {i.destinations
              .filter(d => !available(d, paths))
              .map(d => (
                <Text key={`wait-${i.id}-${d}`} dimColor>
                  {c.t.destWaiting(c.t.dest[d])}
                </Text>
              ))}
          </Box>
        </Box>
      )}
      {i.sealed !== undefined && <Text color="success">✓ {i.sealed.map(d => c.t.dest[d]).join(', ')}</Text>}
    </Box>
  )
}

export const grimCard = (c: Ctx, list: readonly Inscription[], paths: Dests, act: GrimActions): RenderElement => {
  const { Box, Button, Text } = c.ui
  return (
    <Box key="card-grimorio" flexDirection="column" gap={1} borderStyle="round" borderColor={c.desktop ? TONE[c.palette].gildDim : undefined} paddingX={1}>
      {c.desktop ? (
        svg(c, grimHeader(pxOf(c), c.t.grimTitle, c.t.grimCount(list.length), c.palette), 'grim-header')
      ) : (
        <Text bold color="claude">
          📖 {c.t.grimTitle} · {c.t.grimCount(list.length)}
        </Text>
      )}
      {list.map(i => inscriptionView(c, i, paths, act))}
      {paths.vault === '' && paths.memory === undefined && (
        <Text key="grim-no-safe" dimColor wrap="wrap">
          {c.t.grimNoSafeDest}
        </Text>
      )}
      {c.desktop && svg(c, divider(pxOf(c), c.palette), 'grim-divider')}
      <Box flexDirection="row" gap={2} alignItems="center">
        {act.haiku !== undefined && <Button key="grim-haiku" plain label={c.t.haikuButton} onPress={act.haiku} />}
        <Box flexGrow={1} />
        <Button key="grim-discard" plain dimColor label={c.t.discard} onPress={act.discard} />
        <Button key="grim-seal" variant="primary" label={c.t.seal} onPress={act.seal} />
      </Box>
    </Box>
  )
}

export const grimPage = (c: Ctx, pendingList: readonly Inscription[], sealedList: readonly Inscription[], paths: Dests, back: () => void, act: GrimActions): RenderElement => {
  const { Box, Button, Text } = c.ui
  return (
    <Box flexDirection="column" gap={1}>
      <Button key="back" plain label={c.t.back} onPress={back} />
      {title(c, c.t.grimTitle)}
      {/* Só onde há campo de texto: no celular, a pasta abriria no computador. */}
      {paths.vault !== '' && act.openDecisions !== undefined && inputOf(c.ui) !== undefined && (
        <Button key="grim-open-decisions" plain dimColor label={c.t.openDecisions} onPress={act.openDecisions} />
      )}
      {pendingList.length === 0 ? <Text dimColor>{c.t.grimEmpty}</Text> : grimCard(c, pendingList, paths, act)}
      {sealedList.length > 0 && (
        <Box flexDirection="column">
          <Text bold>{c.t.grimSealedList}</Text>
          {sealedList.map(i => inscriptionView(c, i, paths))}
        </Box>
      )}
    </Box>
  )
}
