// Projetos: os projetos fixados no topo, o projeto da pasta atual em destaque, as
// pastas de cada um com o acesso do Claude (✓/✗) e as ações de cada pasta.

import type { RenderElement } from 'claude-code'

import type { Project } from '../../../types'
import { crab } from '../../core/art'
import type { Ctx } from '../../core/ui'
import { inputOf, svg, title } from '../../core/ui'
import { hasAccess, sorted } from './projetos'

export type ProjectActions = {
  back: () => void
  addCwd: () => void
  create: (name: string) => void
  addFolder: (id: string, folder: string) => void
  removeFolder: (id: string, folder: string) => void
  pin: (id: string) => void
  remove: (id: string) => void
  /** O projeto esperando a confirmação de remover, se houver. */
  confirming?: string
  open: (id: string) => void
  accessNow: (folder: string) => void
  accessAlways: (id: string) => void
}

const projectView = (c: Ctx, p: Project, current: boolean, cwd: string, dirs: readonly string[], act: ProjectActions) => {
  const { Box, Button, Text } = c.ui
  const Input = inputOf(c.ui)
  const missing = p.folders.filter(f => !hasAccess(f, cwd, dirs))
  return (
    <Box key={`p:${p.id}`} flexDirection="column" borderStyle="round" borderColor={current ? 'claude' : 'subtle'} paddingX={1}>
      <Box flexDirection="row" gap={1} alignItems="center">
        <Text bold color={current ? 'claude' : 'text'}>
          {p.pinned ? '📌 ' : ''}
          {p.name}
        </Text>
        {current && <Text dimColor>· {c.t.projCurrent}</Text>}
        <Box flexGrow={1} />
        <Button key={`p:pin:${p.id}`} plain label={p.pinned ? c.t.unpin : c.t.pin} onPress={() => act.pin(p.id)} />
        {p.folders.length > 0 && <Button key={`p:open:${p.id}`} plain label={c.t.openSession} onPress={() => act.open(p.id)} />}
        <Button key={`p:del:${p.id}`} plain label={act.confirming === p.id ? c.t.confirmRemove : c.t.remove} onPress={() => act.remove(p.id)} />
      </Box>
      {p.folders.map(f => {
        const ok = hasAccess(f, cwd, dirs)
        return (
          <Box key={`p:f:${p.id}:${f}`} flexDirection="row" gap={1}>
            <Text color={ok ? 'success' : 'warning'}>{ok ? '✓' : '✗'}</Text>
            <Text wrap="truncate-start">{f}</Text>
            <Text dimColor>· {ok ? c.t.accessOk : c.t.accessNo}</Text>
            {!ok && <Button key={`p:now:${p.id}:${f}`} plain label={c.t.accessNow} onPress={() => act.accessNow(f)} />}
            <Button key={`p:rmf:${p.id}:${f}`} plain label={c.t.remove} onPress={() => act.removeFolder(p.id, f)} />
          </Box>
        )
      })}
      {missing.length > 0 && current && (
        <Button key={`p:always:${p.id}`} plain label={`${c.t.accessAlways} (${missing.length})`} onPress={() => act.accessAlways(p.id)} />
      )}
      {Input !== undefined && (
        <Input
          key={`p:add:${p.id}`}
          placeholder={c.t.projFolderPlaceholder}
          submitLabel={c.t.projAddFolder}
          onSubmit={(value: string) => act.addFolder(p.id, value)}
        />
      )}
    </Box>
  )
}

export const projectsView = (
  c: Ctx,
  list: readonly Project[],
  cwd: string,
  dirs: readonly string[],
  current: Project | undefined,
  act: ProjectActions,
): RenderElement => {
  const { Box, Button, Text } = c.ui
  const Input = inputOf(c.ui)
  const all = sorted(list)
  const pinned = all.filter(p => p.pinned && p.id !== current?.id)
  const others = all.filter(p => !p.pinned && p.id !== current?.id)
  return (
    <Box flexDirection="column" gap={1}>
      <Button key="back" plain label={c.t.back} onPress={act.back} />
      <Box flexDirection="row" gap={2} alignItems="center">
        {svg(c.ui, c.desktop, crab('patrulheiro', 56, c.palette, c.t.projTitle, true), 'proj-crab')}
        {title(c, c.t.projTitle)}
      </Box>
      <Text dimColor wrap="wrap">
        {c.t.projNote}
      </Text>
      <Text bold>{c.t.projCurrent}</Text>
      {current === undefined ? (
        <Box flexDirection="column">
          <Text dimColor>{c.t.projNone}</Text>
          <Text dimColor wrap="truncate-start">
            {cwd}
          </Text>
          <Button key="proj-add-cwd" variant="primary" label={c.t.projAddCwd} onPress={act.addCwd} />
        </Box>
      ) : (
        projectView(c, current, true, cwd, dirs, act)
      )}
      {pinned.length > 0 && <Text bold>{c.t.projPinned}</Text>}
      {pinned.map(p => projectView(c, p, false, cwd, dirs, act))}
      {others.length > 0 && <Text bold>{c.t.projOthers}</Text>}
      {others.map(p => projectView(c, p, false, cwd, dirs, act))}
      {list.length === 0 && <Text dimColor>{c.t.projEmpty}</Text>}
      {Input !== undefined && (
        <Input key="proj-new" label={c.t.projNew} placeholder={c.t.projNewPlaceholder} submitLabel={c.t.projCreate} onSubmit={(value: string) => act.create(value)} />
      )}
    </Box>
  )
}
