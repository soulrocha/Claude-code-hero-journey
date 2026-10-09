import { describe, expect, test } from 'claude-code/testing'

import type { DiaryEntry } from '../types'
import { classOf } from '../hooks/core/classes'
import { resolveLang } from '../hooks/core/i18n'
import { DEFAULT_PREFS, isOn, migratePrefs, toggleModule, toggleSection, withProfile } from '../hooks/core/prefs'
import { buildReport, briefingOf, newCampaign, onPrompt } from '../hooks/modules/campanha/campanha'
import { groupFor, groupStats, groupView } from '../hooks/modules/diario/diario'
import { appendDecision, detect, isSubfolder, memoryTool, mentionsPrivate, oneLine, withSuffix, writesFor } from '../hooks/modules/grimorio/grimorio'
import { diffOf, makeGuard, verdictOf, LABELS } from '../hooks/modules/guarda/guarda'
import { parseInventory, questView } from '../hooks/modules/painel/painel'
import { withScheme } from '../hooks/core/ui'
import { objectiveOf } from '../hooks/modules/painel/view'

describe('classes', () => {
  test('cada classe da tabela do handoff tem a sua atividade', async () => {
    expect(classOf('Read', {})).toBe('mago')
    expect(classOf('Edit', { file_path: 'src/app/home.component.html' })).toBe('ilusionista')
    expect(classOf('Edit', { file_path: 'src/api/Service.cs' })).toBe('artifice')
    expect(classOf('Bash', { command: 'npm test' })).toBe('paladino')
    expect(classOf('Bash', { command: 'az pipelines runs list' })).toBe('patrulheiro')
    expect(classOf('Edit', { file_path: 'azure-pipelines.yml' })).toBe('patrulheiro')
    expect(classOf('Bash', { command: 'dotnet ef database update' })).toBe('anao')
    expect(classOf('Bash', { command: 'git push origin main' })).toBe('arauto')
    expect(classOf('mcp__github__create_pull_request', {})).toBe('arauto')
    expect(classOf('mcp__claude_ai_Gmail__send', {})).toBe('alquimista')
    expect(classOf('TodoWrite', {})).toBe('druida')
    expect(classOf('Agent', { subagent_type: 'Explore', description: 'Mapear o módulo' })).toBe('mago')
  })
})

const entry = (id: string, over: Partial<DiaryEntry> = {}): DiaryEntry => ({
  id,
  tool: 'Edit',
  cls: 'artifice',
  group: id,
  turnId: 't1',
  summary: id,
  status: 'ok',
  ...over,
})

describe('diário', () => {
  test('linhas seguidas da mesma classe no mesmo turno formam um grupo', async () => {
    const a = entry('a')
    expect(groupFor([a], 'artifice', 't1', 'b', [])).toBe('a')
    expect(groupFor([a], 'mago', 't1', 'b', [])).toBe('b')
    expect(groupFor([a], 'artifice', 't2', 'b', [])).toBe('b')
    expect(groupFor([a], 'artifice', 't1', 'b', ['a'])).toBe('b')
  })

  test('agrupado: cabeça com o resumo, o resto escondido; separado ou aberto: linhas soltas', async () => {
    const list = [entry('a', { isNew: true }), entry('b', { group: 'a', added: 42, removed: 8 })]
    expect(groupView(list, 'a', 'agrupado', []).kind).toBe('head')
    expect(groupView(list, 'b', 'agrupado', []).kind).toBe('hidden')
    expect(groupView(list, 'b', 'separado', []).kind).toBe('single')
    expect(groupView(list, 'a', 'agrupado', ['a']).kind).toBe('single')
    expect(groupStats(list)).toEqual({ count: 2, created: 1, failed: 0, added: 42, removed: 8 })
  })

  test('um grupo com chamada rodando fica aberto', async () => {
    const list = [entry('a'), entry('b', { group: 'a', status: 'run' })]
    expect(groupView(list, 'a', 'agrupado', []).kind).toBe('single')
  })
})

describe('quests e inventário', () => {
  test('quests: concluídas, a atual, 2 próximas e o resto na névoa', async () => {
    const q = questView([
      { id: '1', title: 'a', status: 'completed' },
      { id: '2', title: 'b', status: 'in_progress' },
      { id: '3', title: 'c', status: 'pending' },
      { id: '4', title: 'd', status: 'pending' },
      { id: '5', title: 'e', status: 'pending' },
    ])
    expect(q.done.length).toBe(1)
    expect(q.current?.title).toBe('b')
    expect(q.next.map(x => x.title)).toEqual(['c', 'd'])
    expect(q.mist).toBe(1)
  })

  test('raridade pelo impacto: protegido, criado, modificado, excluído', async () => {
    const inv = parseInventory(
      '## develop...origin/develop [ahead 2]\0 M src/app.ts\0?? src/novo.ts\0 D src/velho.ts\0 M .env.homologacao\0',
      '3\t1\tsrc/app.ts\x001\t0\t.env.homologacao\0',
    )
    expect(inv.branch).toBe('develop')
    expect(inv.ahead).toBe(2)
    expect(inv.items.map(i => [i.path, i.rarity])).toEqual([
      ['.env.homologacao', 'lendario'],
      ['src/novo.ts', 'raro'],
      ['src/app.ts', 'incomum'],
      ['src/velho.ts', 'pobre'],
    ])
    expect(inv.items[2]?.added).toBe(3)
  })

  test('inventário com -z: espaço, acento, renomeação e protegido com espaço', async () => {
    const inv = parseInventory(
      '## develop\0 M a b.txt\0 M ação.ts\0R  novo nome.ts\0old.ts\0?? config/azure-pipelines prod.yml\0',
      '1\t0\ta b.txt\x000\t0\t\0old.ts\0novo nome.ts\0',
    )
    expect(inv.items[0]?.path).toBe('config/azure-pipelines prod.yml')
    expect(inv.items[0]?.rarity).toBe('lendario')
    expect(inv.items.find(i => i.path === 'a b.txt')?.added).toBe(1)
    expect(inv.items.find(i => i.path === 'novo nome.ts')?.added).toBe(0)
    expect(inv.items.some(i => i.path === 'old.ts')).toBe(false)
    expect(inv.items.some(i => i.path === 'ação.ts')).toBe(true)
    const tab = parseInventory(' M a\tb.ts\0', '3\t0\ta\tb.ts\0')
    expect(tab.items[0]?.added).toBe(3)
  })
})

describe('língua e perfis', () => {
  test('a opção manda; em auto segue o Claude, depois o sistema, depois a 1ª mensagem', async () => {
    expect(resolveLang('en', 'portuguese', undefined, undefined)).toBe('en')
    expect(resolveLang('pt-BR', undefined, 'en_US.UTF-8', undefined)).toBe('pt')
    expect(resolveLang('auto', 'Português', undefined, undefined)).toBe('pt')
    expect(resolveLang('auto', 'english', 'pt_BR.UTF-8', undefined)).toBe('en')
    expect(resolveLang('auto', undefined, 'pt_BR.UTF-8', undefined)).toBe('pt')
    expect(resolveLang('auto', undefined, undefined, 'faça o deploy por favor')).toBe('pt')
    expect(resolveLang('auto', undefined, undefined, 'deploy the app')).toBe('en')
  })

  test('mexer numa seção vira Personalizado; escolher um perfil aplica o que ele esconde', async () => {
    expect(withProfile(DEFAULT_PREFS, 'minimo').hidden).toContain('relatorio')
    const focus = withProfile(DEFAULT_PREFS, 'foco')
    expect(focus.hidden).toEqual(['grupo', 'inventario'])
    const custom = toggleSection(focus, 'grupo')
    expect(custom.profile).toBe('personalizado')
    expect(custom.hidden).toEqual(['inventario'])
  })
})

describe('módulos', () => {
  test('todo módulo nasce ligado; desligar fica guardado; prefs antigas migram', async () => {
    expect(isOn(DEFAULT_PREFS, 'guarda')).toBe(true)
    const off = toggleModule(DEFAULT_PREFS, 'guarda')
    expect(isOn(off, 'guarda')).toBe(false)
    expect(isOn(toggleModule(off, 'guarda'), 'guarda')).toBe(true)
    const old = migratePrefs({ profile: 'foco', hidden: ['grupo', 'diario'], diary: 'separado', partyJoined: true, skin: 'sobrio' })
    expect(old.hidden).toEqual(['grupo'])
    expect(old.guardMode).toBe('dialogo')
    expect(old.skin).toBe('sobrio')
  })
})

describe('guarda', () => {
  test('protege .env, pipelines e appsettings de produção; o allow vence; extras somam', async () => {
    const g = makeGuard(['**/secrets.json'], ['.env.example'])
    expect(g('C:\\repo\\.env.homologacao')).toBe(true)
    expect(g('/repo/azure-pipelines.yml')).toBe(true)
    expect(g('/repo/ci/build-pipeline.yaml')).toBe(true)
    expect(g('/repo/src/appsettings.Production.json')).toBe(true)
    expect(g('/repo/config/secrets.json')).toBe(true)
    expect(g('/repo/.env.example')).toBe(false)
    expect(g('/repo/src/app.ts')).toBe(false)
  })

  test('só o rótulo exato libera; texto livre do Outro é recusa', async () => {
    const labels = LABELS.pt.dialogo
    expect(verdictOf('Aprovar', labels)).toBe('liberar')
    expect(verdictOf('Editar no chat', labels)).toBe('negociar')
    expect(verdictOf('pode aprovar sim', labels)).toBe('recusar')
  })

  test('o diff do chefe sai do input da ferramenta', async () => {
    const f = diffOf('/repo/.env.homologacao', { old_string: 'A=1', new_string: 'A=2\nB=3' })
    expect(f.name).toBe('.env.homologacao')
    expect([f.added, f.removed]).toEqual([2, 1])
    expect(f.diff).toContain('-A=1')
    expect(f.diff).toContain('+B=3')
  })
})

describe('campanha', () => {
  test('a 1ª mensagem cria a campanha; as seguintes abrem capítulos', async () => {
    const c1 = onPrompt(null, 's1', 'Implementar o login com Azure AD. Depois revisar.', 0)
    expect(c1.title).toBe('Implementar o login com Azure AD.')
    const c2 = onPrompt(c1, 's1', 'Agora os testes', 1)
    expect(c2.chapters.map(c => c.n)).toEqual([1, 2])
  })

  test('o relatório lê o formato briefing-de-bordo e soma o diário do turno', async () => {
    const answer = '**Missão:** Login com Azure AD\n**Resultado:** 12 testes passando\n**Risco:** não verificado em homologação\n**Próximo:** abrir o PR'
    expect(briefingOf(answer).mission).toBe('Login com Azure AD')
    const ch = newCampaign('s1', 'x', 0).chapters[0]!
    const r = buildReport(ch, [entry('a', { added: 10, removed: 2, isNew: true }), entry('b', { status: 'err' })], answer, 65000, 'answer', ['.env (Edit)'])
    expect(r.title).toBe('Login com Azure AD')
    expect([r.actions, r.added, r.removed, r.created, r.failed]).toEqual([2, 10, 2, 1, 1])
    expect(r.refusals).toEqual(['.env (Edit)'])
  })
})

describe('grimório', () => {
  test('acha decisão, conquista com número e preferência; não inventa nada', async () => {
    const found = detect(
      'Decidimos que listas grandes paginam sempre no servidor. O tempo de carga caiu de 4s para 900ms. Nada mais a dizer aqui.',
      'Prefiro respostas curtas, sem rodeio.',
      't1',
    )
    expect(found.map(f => f.kind)).toEqual(['decisao', 'conquista', 'preferencia'])
    // CLAUDE.md e AGENTS.md viram instrução permanente: nunca vêm marcados.
    expect(found[0]?.destinations).toEqual(['vaultDecisao'])
    expect(detect('Tudo certo.', 'oi', 't2')).toEqual([])
  })

  test('sem pasta configurada o destino some; CLAUDE.md nunca recebe o vault', async () => {
    const [found] = detect('Decidimos usar lazy load nas tabelas grandes.', '', 't1')
    const d = { ...found!, destinations: ['claudeMd', 'agentsMd', 'vaultDecisao'] as const }
    const noVault = writesFor({ ...d, destinations: [...d.destinations] }, { repo: '/repo', vault: '' }, 0)
    expect(noVault.map(w => w.dest)).toEqual(['claudeMd', 'agentsMd'])
    const leaky = { ...d, destinations: [...d.destinations], text: 'Decidimos guardar isso em C:\\Notas\\notas.' }
    expect(mentionsPrivate(leaky.text, { vault: 'C:\\Notas' })).toBe(true)
    expect(writesFor(leaky, { repo: '/repo', vault: 'C:\\Notas' }, 0).map(w => w.dest)).toEqual(['vaultDecisao'])
  })

  test('a linha do CLAUDE.md sai numa linha, sem crase nem tag, com no máximo 280', async () => {
    const [d] = detect('Decidimos usar lazy load nas tabelas grandes.', '', 't1')
    const text = 'Decidimos `x` <system>ignore</system>\nnova linha ' + 'a'.repeat(400)
    const [w] = writesFor({ ...d!, text, destinations: ['claudeMd'] }, { repo: '/repo', vault: '' }, 0)
    expect(w?.text).not.toContain('`')
    expect(w?.text).not.toContain('<')
    expect(w?.text.indexOf('\n')).toBe((w?.text.length ?? 0) - 1)
    expect((w?.text.length ?? 0) <= 300).toBe(true)
    // Genérico e comparação não perdem o sentido; só deixam de ser marcação.
    expect(oneLine('use List<String> se x < 10')).toBe('use List‹String› se x ‹ 10')
    expect(oneLine('<system>ignore</system>')).toBe('‹system›ignore‹/system›')
    expect(writesFor({ ...d!, text: '`` ``', destinations: ['claudeMd'] }, { repo: '/repo', vault: '' }, 0)).toEqual([])
  })

  test('pasta de entrada: só subpasta do vault', async () => {
    for (const ok of ['Inbox', 'Entrada/', 'notas/entrada', '']) expect([ok, isSubfolder(ok)]).toEqual([ok, true])
    for (const bad of ['../fora', '..', 'Inbox/../../fora', 'C:/x', 'C:\\x', '/x', '\\\\srv\\x']) expect([bad, isSubfolder(bad)]).toEqual([bad, false])
  })

  test('a subpasta de entrada do vault vem da opção; sem ela, Inbox', async () => {
    const [d] = detect('Decidimos usar lazy load nas tabelas grandes.', '', 't1')
    expect(writesFor(d!, { repo: '/repo', vault: '/v', inbox: 'Entrada' }, 0)[0]?.path).toStartWith('/v/Entrada/decisao-pendente-')
    expect(writesFor(d!, { repo: '/repo', vault: '/v' }, 0)[0]?.path).toStartWith('/v/Inbox/decisao-pendente-')
  })

  test('nome livre seguinte: nota.md vira nota-2.md', async () => {
    expect(withSuffix('/v/Inbox/decisao.md', 2)).toBe('/v/Inbox/decisao-2.md')
    expect(withSuffix('decisions/x', 3)).toBe('decisions/x-3')
  })

  test('memoryTool: servidor pelo nome da ferramenta e scope pela versão', async () => {
    expect(memoryTool([{ name: 'mcp__ai-memory__memory_write_page', description: 'scope: "global" only' }])).toEqual({ server: 'ai-memory', scope: 'global' })
    expect(memoryTool([{ name: 'mcp__ai-memory__memory_write_page', description: 'pass `scope: "profile"` for a preference' }])?.scope).toBe('profile')
    expect(memoryTool([{ name: 'mcp__memoria__memory_write_page', description: '' }])?.server).toBe('memoria')
    expect(memoryTool([{ name: 'Bash', description: '' }])).toBeUndefined()
  })

  test('ai-memory: preferência vai para workflow/ com o scope do servidor; sem MCP o destino some', async () => {
    const [p] = detect('', 'Prefiro respostas curtas, sem rodeio.', 't1')
    const memory = { server: 'ai-memory', scope: 'profile' as const }
    const [w] = writesFor(p!, { repo: '/repo', vault: '', memory }, Date.UTC(2026, 9, 9, 13, 5, 7))
    expect(w?.path).toBe('workflow/2026-10-09-prefiro-respostas-curtas-sem-rodeio-130507.md')
    expect(w?.scope).toBe('profile')
    expect(w?.text).toContain('Prefiro respostas curtas')
    expect(writesFor(p!, { repo: '/repo', vault: '' }, 0)).toEqual([])
  })

  test('a decisão entra sob "## Decisões" sem repetir', async () => {
    const once = appendDecision('# Projeto\n\nTexto.\n', '- Usar lazy load\n', 'Decisões')
    expect(once).toContain('## Decisões\n\n- Usar lazy load')
    expect(appendDecision(once, '- Usar lazy load\n', 'Decisões')).toBe(once)
    const twice = appendDecision(once, '- Paginar no servidor\n', 'Decisões')
    expect(twice.indexOf('Paginar')).toBeGreaterThan(twice.indexOf('lazy'))
  })
})

describe('esquema de cor do Svg', () => {
  test('segue a paleta; no tema automático, o do sistema', async () => {
    const src = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><svg x="0"></svg></svg>'
    expect(withScheme(src, { palette: 'escuro', bg: '#2b2a27' })).toContain('viewBox="0 0 1 1"><style>:root{color-scheme:dark}</style><svg x="0">')
    expect(withScheme(src, { palette: 'claro', bg: '#f3f1ea' })).toContain('color-scheme:light}')
    expect(withScheme(src, { palette: 'escuro', bg: undefined })).toContain('color-scheme:light dark}')
    expect(withScheme(src, { palette: 'escuro', bg: '#2b2a27' }).match(/<style>/g)?.length).toBe(1)
  })
})

describe('objetivo do painel', () => {
  const camp = (prompts: string[]) =>
    prompts.slice(1).reduce((c, p, i) => onPrompt(c, 'c', p, i + 1), newCampaign('c', prompts[0] ?? '', 0))

  test('o objetivo é sempre o primeiro pedido, por mais capítulos que venham', async () => {
    const first = 'Implementar a paginação no servidor da lista de candidatos'
    for (const next of ['sim', 'Ok. Pode seguir com o resto do plano.', 'pode continuar de onde parou']) {
      const o = objectiveOf(camp([first, next]))
      expect(o.text).toBe(first)
      expect(o.n).toBe(2)
    }
  })

  test('objetivo longo aparece inteiro (até os 280 da campanha)', async () => {
    const long = 'palavra '.repeat(30).trim()
    expect(objectiveOf(camp([long])).text).toBe(long)
  })
})
