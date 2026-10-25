import { describe, expect, test } from 'claude-code/testing'

import type { DiaryEntry, Inscription } from '../types'
import { agentClass, classOf, delivers, readsOnly } from '../hooks/core/classes'
import { DICT, looksPortuguese, resolveLang } from '../hooks/core/i18n'
import { DEFAULT_MEMORY, DEFAULT_PREFS, isOn, migratePrefs, toggleModule } from '../hooks/core/prefs'
import { buildReport, briefingOf, newCampaign, onPrompt } from '../hooks/modules/campanha/campanha'
import { alertOf, bagOf, countdown, readingOf, warningsOf, windowOf } from '../hooks/modules/mochila/recursos'
import { leadOf, receiptOf } from '../hooks/modules/recibo/recibo'
import { layoutOf, NAP_MS, sceneOf, STAGE_MAX, STAGE_MIN, stepWindow } from '../hooks/modules/painel/palco'
import { DIFF_MAX_READ, DIFF_MAX_SHOWN, diffArgv, parseDiff, unquoteGitPath, untrackedDiff } from '../hooks/modules/painel/diff'
import { appendDecision, continuePrompt, cycleDest, detect, isPending, isSubfolder, memoryTool, mentionsPrivate, nextTaskId, oneLine, optionsFor, parseMarker, parseTask, pending, progressHome, projectFromRemote, projectName, removeLine, safeName, saveTask, shareablePath, suggest, taskPrefix, taskText, withSuffix, withTimeout, writesFor } from '../hooks/modules/grimorio/grimorio'

describe('marco e página do ai-memory', () => {
  test('marco é entrega de verdade: commit, push e PR; mandar arquivo ou e-mail não', () => {
    expect(delivers('Bash', { command: 'git commit -m "x" && git push' })).toBe(true)
    expect(delivers('PowerShell', { command: 'gh pr create --fill' })).toBe(true)
    expect(delivers('mcp__github__create_pull_request', {})).toBe(true)
    expect(delivers('SendUserFile', { files: ['a.html'] })).toBe(false)
    expect(delivers('mcp__gmail__send_message', {})).toBe(false)
    expect(delivers('Bash', { command: 'git status', description: 'commit pending?' })).toBe(false)
  })

  test('a página do ai-memory leva data, origem e o lembrete de conferir no código', () => {
    const i: Inscription = { id: 'x', kind: 'decisao', text: 'Listas grandes paginam no servidor.', source: 'turno', destinations: ['aiMemory'] }
    const [w] = writesFor(i, { repo: '/repo', vault: '', memory: { server: 'ai-memory' } }, Date.UTC(2026, 9, 11, 12))
    expect(w?.text).toContain('data: 2026-10-11')
    expect(w?.text).toContain('origem: hero-journey')
    expect(w?.text).toContain('conferir: no código')
  })
})

describe('escopo do ai-memory', () => {
  test('o caminho da tarefa no handoff é relativo: nada de usuário nem pasta pessoal', () => {
    expect(shareablePath('C:\\Users\\eu\\Vault\\.tarefas\\acme-api\\AA-001.md', ['C:\\Users\\eu\\Vault', 'C:\\work\\api'])).toBe('.tarefas/acme-api/AA-001.md')
    expect(shareablePath('/home/eu/work/api/.hero/tarefas/AA-001.md', ['', '/home/eu/work/api'])).toBe('.hero/tarefas/AA-001.md')
    expect(shareablePath('/outro/lugar/AA-001.md', ['/vault'])).toBe('AA-001.md')
  })

  test('o marcador: só as chaves de cima, antes da primeira seção', () => {
    expect(parseMarker('workspace = "movvia"\nproject = "pe-portais"\n')).toEqual({ workspace: 'movvia', project: 'pe-portais' })
    expect(parseMarker('workspace = \'pessoal\'\n\n[profile]\nproject = "nao-vale"\n')).toEqual({ workspace: 'pessoal' })
    expect(parseMarker('# nada aqui\n')).toEqual({})
  })

  test('o projeto pelo remoto: sem o host, "/" vira "-", em minúsculas', () => {
    expect(projectFromRemote('https://github.com/soulrocha/Claude-code-hero-journey.git')).toBe('soulrocha-claude-code-hero-journey')
    expect(projectFromRemote('git@github.com:acme/api.git')).toBe('acme-api')
    expect(projectFromRemote('ssh://git@dev.azure.com/v3/acme/Portal/portal-api')).toBe('v3-acme-portal-portal-api')
    expect(projectFromRemote('C:/repos/local')).toBe('')
    expect(safeName('Meu Projeto!')).toBe('meu-projeto')
  })
})
import { diffOf, makeGuard, verdictOf, LABELS } from '../hooks/modules/guarda/guarda'
import { parseInventory, rarityOf, questView } from '../hooks/modules/painel/painel'
import { withScheme } from '../hooks/core/ui'
import { objectiveOf } from '../hooks/modules/painel/view'
import { cutAtWord, shortGoal } from '../hooks/modules/campanha/campanha'
import { humanType } from '../hooks/core/classes'
import { objectiveBar } from '../hooks/core/art'

describe('classes', () => {
  test('cada família de docs/classes.md tem a sua classe', async () => {
    expect(classOf('Read', {})).toBe('mago')
    expect(classOf('Bash', { command: 'git status && git log -3' })).toBe('mago')
    expect(classOf('PowerShell', { command: 'Get-ChildItem src | Select-Object Name' })).toBe('mago')
    expect(classOf('WebSearch', {})).toBe('cacador')
    expect(classOf('mcp__claude-in-chrome__navigate', {})).toBe('ladino')
    expect(classOf('Edit', { file_path: 'src/api/Service.cs' })).toBe('runico')
    expect(classOf('Edit', { file_path: 'src/app/home.component.html' })).toBe('ilusionista')
    expect(classOf('Write', { file_path: 'docs/plano.md' })).toBe('sabio')
    expect(classOf('Bash', { command: 'npm install' })).toBe('engenheiro')
    expect(classOf('Bash', { command: 'npm test' })).toBe('bruxo')
    expect(classOf('Bash', { command: 'git push origin main' })).toBe('rei')
    expect(classOf('mcp__github__create_pull_request', {})).toBe('rei')
    expect(classOf('mcp__claude_ai_Gmail__send_message', {})).toBe('rei')
    expect(classOf('Bash', { command: 'az pipelines runs list' })).toBe('artifice')
    expect(classOf('Edit', { file_path: 'azure-pipelines.yml' })).toBe('artifice')
    expect(classOf('Bash', { command: 'docker logs api --tail 50' })).toBe('oraculo')
    expect(classOf('Monitor', {})).toBe('oraculo')
    expect(classOf('Bash', { command: 'dotnet ef database update' })).toBe('geomante')
    expect(classOf('Bash', { command: 'curl -s https://api.exemplo.com' })).toBe('alquimista')
    expect(classOf('mcp__stripe__list_customers', {})).toBe('alquimista')
    expect(classOf('mcp__slack__send_message', {})).toBe('rei')
    expect(classOf('TodoWrite', {})).toBe('cartomante')
    expect(classOf('Agent', { subagent_type: 'Explore', description: 'Mapear o módulo' })).toBe('invocador')
    expect(classOf('CronCreate', {})).toBe('cronomante')
    expect(classOf('Skill', {})).toBe('sabio')
    expect(classOf('ReportFindings', {})).toBe('paladino')
    expect(classOf('mcp__figma__get_design_context', {})).toBe('pintor')
    expect(classOf('AskUserQuestion', {})).toBe('aprendiz')
  })

  test('comando que só lê é do Mago; o que grava, apaga ou redireciona é do Engenheiro', async () => {
    expect(readsOnly('cat package.json | head -20')).toBe(true)
    expect(readsOnly('cd src && ls')).toBe(true)
    expect(readsOnly('grep -rn TODO src 2>/dev/null')).toBe(true)
    expect(readsOnly('echo oi > notas.txt')).toBe(false)
    expect(readsOnly('find . -name "*.tmp" -delete')).toBe(false)
    expect(readsOnly('sed -i s/a/b/ x.txt')).toBe(false)
    expect(readsOnly('npm run build')).toBe(false)
  })

  test('o subagente ganha a classe do que vai fazer', async () => {
    expect(agentClass('Explore', 'Mapear o módulo')).toBe('mago')
    expect(agentClass('general-purpose', 'Pesquisar na web a doc oficial')).toBe('cacador')
    expect(agentClass('Plan', 'Plan the migration')).toBe('cartomante')
    expect(agentClass('qa-adversarial', 'Auditar o diff')).toBe('bruxo')
    expect(agentClass('general-purpose', 'Security review do PR')).toBe('paladino')
    expect(agentClass('general-purpose', 'Implementar o endpoint')).toBe('runico')
  })
})

const entry = (id: string, over: Partial<DiaryEntry> = {}): DiaryEntry => ({
  id,
  tool: 'Edit',
  cls: 'artifice',
  turnId: 't1',
  summary: id,
  status: 'ok',
  ...over,
})

describe('recibo do turno', () => {
  test('quem mais agiu, os números e o tempo; a missão só quando mexeu em arquivo sem falha', async () => {
    const entries = [entry('a', { added: 40, removed: 8 }), entry('b', { isNew: true, added: 2 }), entry('c', { cls: 'paladino', tool: 'Bash' })]
    expect(leadOf(entries)).toBe('artifice')
    const r = buildReport({ n: 1, prompt: 'x' }, entries, '**Missão:** Corrige o login', 72_000, 'answer', [])
    expect(receiptOf(r, 'Artífice', 'pt')).toBe('🦀 ✦ Missão cumprida: Corrige o login · Artífice · 3 ações · +42 −8 · 1 novo · 1min 12s')
    const failed = buildReport({ n: 1, prompt: 'x' }, [...entries, entry('d', { status: 'err' })], '**Missão:** X', 5000, 'answer', ['.env (Edit)'])
    expect(receiptOf(failed, 'Artífice', 'en')).toBe('🦀 Artífice · 4 actions · +42 −8 · 1 new · ✗ 1 failed · 🛡 1 blocked · 5s')
  })

  test('turno que só conversou não ganha recibo', async () => {
    expect(receiptOf(buildReport({ n: 1, prompt: 'x' }, [], 'Oi!', 1000, 'answer', []), undefined, 'pt')).toBeUndefined()
  })
})

describe('recursos', () => {
  const usage = (tokens: number, extra: object = {}) => ({ context: { tokens, window: 200_000, ...extra }, rateLimits: [] })

  test('a mochila mede até a compactação automática, em palavras, com o peso do último turno', async () => {
    const breakdown = {
      categories: [
        { name: 'Messages', tokens: 90_000, kind: 'used' },
        { name: 'MCP tools', tokens: 20_000, kind: 'used' },
        { name: 'Free space', tokens: 50_000, kind: 'free' },
      ],
      autoCompactThreshold: 160_000,
      isAutoCompactEnabled: true,
    }
    const first = readingOf(usage(60_000, { breakdown }), null, true)
    const second = readingOf(usage(128_000), first, true)
    expect(second.compactsAt).toBe(160_000)
    expect(second.top.map(t => t.name)).toEqual(['Messages', 'MCP tools'])
    expect(bagOf(second)).toEqual({ percent: 80, state: 'pesada', delta: 68_000, left: 32_000, limit: 160_000 })
    expect(bagOf(readingOf(usage(150_000), second, false)).state).toBe('transbordando')
    // Sem compactação automática, a régua é a janela inteira.
    expect(bagOf(readingOf(usage(60_000, { breakdown: { ...breakdown, isAutoCompactEnabled: false } }), null, false)).percent).toBe(30)
  })

  test('mana e vigor: o que resta, a janela que já virou, o ritmo e a contagem', async () => {
    const now = Date.parse('2026-10-10T12:00:00Z')
    const in1h = new Date(now + 3600_000).toISOString()
    // 4 de 5 horas já passaram e só 30% foram gastos: no ritmo.
    expect(windowOf({ kind: 'five_hour', percentUsed: 30, resetsAt: in1h }, now)).toMatchObject({ left: 70, fast: false, level: 'ok' })
    // Uma hora de janela e 60% gastos: rápido demais.
    const in4h = new Date(now + 4 * 3600_000).toISOString()
    expect(windowOf({ kind: 'five_hour', percentUsed: 60, resetsAt: in4h }, now).fast).toBe(true)
    expect(windowOf({ kind: 'five_hour', percentUsed: 92, resetsAt: in1h }, now).level).toBe('critico')
    const past = new Date(now - 60_000).toISOString()
    expect(windowOf({ kind: 'seven_day', percentUsed: 95, resetsAt: past }, now)).toMatchObject({ left: 100, refilled: true })
    expect([countdown(42 * 60_000), countdown(236 * 60_000), countdown(98 * 3600_000)]).toEqual(['42m', '3h56', '4d2h'])
  })

  test('o aviso sai uma vez por período e a faixa só mostra o recurso em alerta', async () => {
    const now = Date.parse('2026-10-10T12:00:00Z')
    const resetsAt = new Date(now + 3600_000).toISOString()
    const low = [{ kind: 'five_hour', percentUsed: 93, resetsAt }]
    const first = warningsOf(low, {}, now)
    expect(first.fire.map(f => f.kind)).toEqual(['five_hour'])
    expect(warningsOf(low, first.warned, now).fire).toEqual([])
    const next = new Date(now + 5 * 3600_000).toISOString()
    expect(warningsOf([{ kind: 'five_hour', percentUsed: 95, resetsAt: next }], first.warned, now).fire).toHaveLength(1)
    const r = readingOf({ context: { tokens: 10_000, window: 200_000 }, rateLimits: low }, null, false)
    expect(alertOf(r, now)).toEqual({ kind: 'mana', percent: 7 })
    expect(alertOf(readingOf({ context: { tokens: 10_000, window: 200_000 }, rateLimits: [] }, null, false), now)).toBeUndefined()
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

  test('raridade pelo impacto: protegido, crítico, código, teste/doc, excluído', async () => {
    const inv = parseInventory(
      '## develop...origin/develop [ahead 2]\0 M src/app.ts\0?? src/api/pedido.ts\0 M README.md\0 D src/velho.ts\0 M .env.homologacao\0',
      '3\t1\tsrc/app.ts\x001\t0\t.env.homologacao\0',
    )
    expect(inv.branch).toBe('develop')
    expect(inv.ahead).toBe(2)
    expect(inv.items.map(i => [i.path, i.rarity])).toEqual([
      ['.env.homologacao', 'lendario'],
      ['src/api/pedido.ts', 'raro'],
      ['src/app.ts', 'incomum'],
      ['README.md', 'comum'],
      ['src/velho.ts', 'pobre'],
    ])
    expect(inv.items[2]?.added).toBe(3)
  })

  test('rarityOf: build é raro; teste e doc vencem a pasta crítica', async () => {
    const r = (p: string, code?: string) => rarityOf(p, code, () => false)
    expect(r('package.json')).toBe('raro')
    expect(r('tsconfig.json')).toBe('raro')
    expect(r('appsettings.json')).toBe('comum')
    expect(r('src/api.ts')).toBe('raro')
    expect(r('src/auth.service.ts')).toBe('raro')
    expect(r('tests/api/a.test.ts')).toBe('comum')
    expect(r('docs/api/index.md')).toBe('comum')
    expect(r('src/rapid.ts')).toBe('incomum')
    expect(r('src/api/x.ts', ' D')).toBe('pobre')
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
})

describe('módulos', () => {
  test('todo módulo nasce ligado; desligar fica guardado; prefs antigas migram', async () => {
    expect(isOn(DEFAULT_PREFS, 'guarda')).toBe(true)
    const off = toggleModule(DEFAULT_PREFS, 'guarda')
    expect(isOn(off, 'guarda')).toBe(false)
    expect(isOn(toggleModule(off, 'guarda'), 'guarda')).toBe(true)
    // Prefs de antes da simplificação: perfis, seções, modo do diário e módulos que saíram somem.
    const old = migratePrefs({ profile: 'foco', hidden: ['grupo'], diary: 'separado', partyJoined: true, skin: 'sobrio', modules: { projetos: false, guarda: false } })
    expect(old).toEqual({ skin: 'sobrio', modules: { guarda: false }, guardMode: 'dialogo', grimorioHaiku: false, memory: DEFAULT_MEMORY })
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

  test('lista curta: chaves, certificados e o estado do Terraform entram; os modelos de .env nunca perguntam', async () => {
    const g = makeGuard()
    expect(g('/repo/certs/api.pfx')).toBe(true)
    expect(g('/repo/infra/terraform.tfstate')).toBe(true)
    expect(g('/repo/src/appsettings.Staging.json')).toBe(true)
    for (const model of ['.env.example', '.env.sample', '.env.template']) expect(g(`/repo/${model}`)).toBe(false)
    // Fora de propósito: migração, compose e package.json perguntariam o tempo todo.
    expect(g('/repo/db/migrations/0001_init.sql')).toBe(false)
    expect(g('/repo/docker-compose.yml')).toBe(false)
    expect(g('/repo/package.json')).toBe(false)
  })

  test('o modo chefe saiu: quem usava passa a ser perguntado', async () => {
    expect(migratePrefs({ guardMode: 'chefe' }).guardMode).toBe('dialogo')
    expect(migratePrefs({ guardMode: 'nativo' }).guardMode).toBe('nativo')
  })

  test('só o rótulo exato libera; texto livre do Outro é recusa', async () => {
    const labels = LABELS.pt
    expect(verdictOf('Aprovar', labels)).toBe('liberar')
    expect(verdictOf('Editar no chat', labels)).toBe('negociar')
    expect(verdictOf('pode aprovar sim', labels)).toBe('recusar')
  })

  test('o diff que a guarda mostra sai do input da ferramenta', async () => {
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
  const ins = (text: string, kind: Inscription['kind'], destinations: Inscription['destinations']): Inscription => ({ id: text, kind, text, source: 'resposta', destinations })

  test('acha decisão, conquista com número e regra; não inventa nada', async () => {
    const found = detect(
      'Decidimos que listas grandes paginam sempre no servidor. O tempo de carga caiu de 4s para 900ms. Nada mais a dizer aqui.',
      'A partir de agora, sempre rode os testes antes do commit.',
      't1',
    )
    expect(found.map(f => f.kind)).toEqual(['decisao', 'conquista', 'regra'])
    // Preferência não é mais detectada: o perfil do ai-memory aprende sozinho.
    expect(detect('', 'Prefiro respostas curtas, sem rodeio.', 't2')).toEqual([])
    expect(detect('Tudo certo.', 'oi', 't2')).toEqual([])
  })

  test('um destino só, sugerido pelo que a pessoa tem; sem vault, a crônica pergunta', async () => {
    const vault = { vault: '/v' }
    const none = { vault: '' }
    expect(suggest('regra', none, 'auto')).toBe('agentsMd')
    expect(suggest('decisao', vault, 'auto')).toBe('vaultDecisao')
    expect(suggest('conquista', vault, 'auto')).toBe('carreira')
    expect(suggest('decisao', none, 'auto')).toBeUndefined()
    expect(suggest('decisao', vault, 'projeto')).toBe('projeto')
    // O clique troca para o próximo disponível; sem ai-memory, entre vault e projeto.
    const [a] = cycleDest([ins('x', 'decisao', ['vaultDecisao'])], 'x', vault)
    expect(a?.destinations).toEqual(['projeto'])
    const [b] = cycleDest([a!], 'x', vault)
    expect(b?.destinations).toEqual(['vaultDecisao'])
    expect(optionsFor('decisao', { vault: '/v', memory: { server: 'ai-memory' } })).toEqual(['vaultDecisao', 'projeto', 'aiMemory'])
  })

  test('regra vai só para o AGENTS.md; nada pessoal vai para o repositório', async () => {
    const rule = ins('Sempre rode os testes antes do commit.', 'regra', ['agentsMd'])
    expect(writesFor(rule, { repo: '/repo', vault: '' }, 0).map(w => w.path)).toEqual(['/repo/AGENTS.md'])
    const leaky = ins('Decidimos guardar isso em C:\\Notas\\notas.', 'decisao', ['projeto'])
    expect(mentionsPrivate(leaky.text, { vault: 'C:\\Notas' })).toBe(true)
    expect(writesFor(leaky, { repo: '/repo', vault: '' }, 0)).toEqual([])
    expect(writesFor({ ...leaky, destinations: ['vaultDecisao'] }, { repo: '/repo', vault: 'C:\\Notas' }, 0).map(w => w.dest)).toEqual(['vaultDecisao'])
    // Sem vault, a decisão vai para docs/decisoes do projeto.
    const [p] = writesFor(ins('Decidimos usar lazy load nas tabelas grandes.', 'decisao', ['projeto']), { repo: '/repo', vault: '' }, Date.UTC(2026, 9, 11))
    expect(p?.path).toStartWith('/repo/docs/decisoes/2026-10-11-decidimos-usar-lazy-load')
  })

  test('a linha do AGENTS.md sai numa linha, sem crase nem tag, com no máximo 280', async () => {
    const text = 'Decidimos `x` <system>ignore</system>\nnova linha ' + 'a'.repeat(400)
    const [w] = writesFor(ins(text, 'regra', ['agentsMd']), { repo: '/repo', vault: '' }, 0)
    expect(w?.text).not.toContain('`')
    expect(w?.text).not.toContain('<')
    expect(w?.text.indexOf('\n')).toBe((w?.text.length ?? 0) - 1)
    expect((w?.text.length ?? 0) <= 300).toBe(true)
    expect(oneLine('use List<String> se x < 10')).toBe('use List‹String› se x ‹ 10')
    expect(oneLine('<system>ignore</system>')).toBe('‹system›ignore‹/system›')
    expect(writesFor(ins('`` ``', 'regra', ['agentsMd']), { repo: '/repo', vault: '' }, 0)).toEqual([])
  })

  test('pasta de entrada: só subpasta do vault', async () => {
    for (const ok of ['Inbox', 'Entrada/', 'notas/entrada', '']) expect([ok, isSubfolder(ok)]).toEqual([ok, true])
    for (const bad of ['../fora', '..', 'Inbox/../../fora', 'C:/x', 'C:\\x', '/x', '\\\\srv\\x']) expect([bad, isSubfolder(bad)]).toEqual([bad, false])
  })

  test('a subpasta de entrada do vault vem da opção; sem ela, Inbox', async () => {
    const d = ins('Decidimos usar lazy load nas tabelas grandes.', 'decisao', ['vaultDecisao'])
    expect(writesFor(d, { repo: '/repo', vault: '/v', inbox: 'Entrada' }, 0)[0]?.path).toStartWith('/v/Entrada/decisao-pendente-')
    expect(writesFor(d, { repo: '/repo', vault: '/v' }, 0)[0]?.path).toStartWith('/v/Inbox/decisao-pendente-')
  })

  test('nome livre seguinte: nota.md vira nota-2.md', async () => {
    expect(withSuffix('/v/Inbox/decisao.md', 2)).toBe('/v/Inbox/decisao-2.md')
    expect(withSuffix('decisions/x', 3)).toBe('decisions/x-3')
  })

  test('memoryTool: o servidor pelo nome da ferramenta', async () => {
    expect(memoryTool([{ name: 'mcp__ai-memory__memory_write_page', description: '' }])).toEqual({ server: 'ai-memory' })
    expect(memoryTool([{ name: 'mcp__memoria__memory_write_page', description: '' }])?.server).toBe('memoria')
    expect(memoryTool([{ name: 'Bash', description: '' }])).toBeUndefined()
  })

  test('a regra entra sob "## Regras" sem repetir, e o Desfazer tira a linha', async () => {
    const once = appendDecision('# Projeto\n\nTexto.\n', '- Usar lazy load\n', 'Regras')
    expect(once).toContain('## Regras\n\n- Usar lazy load')
    expect(appendDecision(once, '- Usar lazy load\n', 'Regras')).toBe(once)
    expect(removeLine(once, '- Usar lazy load\n')).not.toContain('lazy load')
  })
})

describe('salvar progresso', () => {
  test('a tarefa mora no vault (repositório público) ou no projeto, com ID pelas iniciais', async () => {
    // No vault, o nome do projeto é o do ai-memory: /work/acme/api e /work/outra/api não se misturam.
    expect(progressHome('C:/work/claude-code-hero-journey', 'C:/Notas', 'soulrocha-claude-code-hero-journey')).toBe('C:/Notas/.tarefas/soulrocha-claude-code-hero-journey')
    expect(progressHome('/work/acme/api', '/vault', 'acme-api')).not.toBe(progressHome('/work/outra/api', '/vault', 'outra-api'))
    expect(progressHome('/repo/loja', '', 'loja')).toBe('/repo/loja/.hero/tarefas')
    expect(taskPrefix('claude-code-hero-journey')).toBe('CCHJ')
    expect(nextTaskId(['CCHJ-001.md', 'CCHJ-007.md', '_modelo.md'], 'CCHJ')).toBe('CCHJ-008')
    expect(nextTaskId([], 'LOJA')).toBe('LOJA-001')
  })

  test('salvar de novo atualiza a mesma tarefa: próximo passo novo, verificar mantido, log e falhas só crescem', async () => {
    const at = new Date(2026, 9, 11, 18, 40).getTime()
    const base = { id: 'CCHJ-001', project: 'claude-code-hero-journey', at, title: 'Hero Journey 0.6', objective: 'Fechar a 0.6', next: 'Testar no app', verify: 'abrir /hero', failed: ['npm install'], logLine: 'pc-casa | Claude Code | 4 ações' }
    const first = saveTask(undefined, base)
    const text = taskText(first)
    expect(text).toContain('id: CCHJ-001')
    expect(text).toContain('status: em-andamento')
    expect(text).toContain('## Próximo passo\nTestar no app')
    const back = parseTask(text)
    expect(back?.title).toBe('Hero Journey 0.6')
    expect(back?.verify).toBe('abrir /hero')
    const second = saveTask(back, { ...base, at: at + 60_000, next: 'Abrir o PR', verify: '', failed: ['npm install', 'tsc'], logLine: 'pc-trabalho | Codex | 2 ações' })
    expect(second.next).toBe('Abrir o PR')
    expect(second.verify).toBe('abrir /hero')
    expect(second.failed).toEqual(['npm install', 'tsc'])
    expect(second.log.length).toBe(2)
    expect(second.log[1]).toContain('pc-trabalho | Codex')
    // Lê também o modelo do vault, com CRLF.
    expect(parseTask('---\r\nid: XX-000\r\nstatus: aberta\r\n---\r\n\r\n# XX-000: título curto\r\n')?.status).toBe('aberta')
    expect(parseTask('# sem frontmatter')).toBeUndefined()
  })

  test('o Continuar pede para ler a tarefa e conferir antes de mexer', async () => {
    expect(continuePrompt('pt', 'Hero Journey 0.6', '/v/.tarefas/x/CCHJ-001.md')).toContain('confira o "Como verificar" antes de mexer')
    expect(projectName('C:\\Projetos\\loja')).toBe('loja')
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

describe('objetivo curto (QA 2026-10-09)', () => {
  test('cutAtWord corta na palavra e não come a última', async () => {
    expect(cutAtWord('paginar a tela de listas grandes de colaboradores no servidor', 40)).toBe('paginar a tela de listas grandes de…')
    expect(cutAtWord('curto', 40)).toBe('curto')
  })

  test('shortGoal tira a abertura, pega a 1ª frase e começa maiúsculo', async () => {
    expect(shortGoal('Ok, primeiro instale o Hero Journey no meu PC pessoal. Depois rode os testes.')).toBe('Instale o Hero Journey no meu PC pessoal.')
  })

  test('humanType usa os nomes da língua e humaniza o slug', async () => {
    expect(humanType('acme-qa-reviewer')).toBe('QA reviewer')
    expect(humanType('Explore', { explore: 'Explorer' })).toBe('Explorer')
    expect(humanType('general-purpose')).toBe('')
  })
})

describe('achados do Devin no PR #2', () => {
  test('a barra conta todas as etapas e desenha só os 12 losangos mais recentes', async () => {
    const steps = [{ name: 'velha', state: 'next' as const }, ...Array.from({ length: 12 }, (_, i) => ({ name: `p${i}`, state: 'done' as const }))]
    const words = { step: (n: number, name: string) => `${n} ${name}`, steps: () => 'passos', chapter: (n: number) => `cap. ${n}` }
    const art = objectiveBar(300, steps, 1, 'escuro', words)
    expect(art.alt).toBe('12/13')
    expect((art.source.match(/rotate\(45/g) ?? []).length).toBe(12)
  })

  test('palavras portuguesas repetidas também contam', async () => {
    expect(looksPortuguese('leia isto e leia aquilo')).toBe(true)
    expect(looksPortuguese('Read the file and summarize it')).toBe(false)
  })
})

describe('palco', () => {
  test('parado: acordado logo depois do turno, dormindo depois de alguns minutos', async () => {
    expect(sceneOf({ busy: false }, null, [], 0).mode).toBe('fresh')
    expect(sceneOf({ busy: false, endedAt: 1000 }, null, [], 1000 + 60_000)).toMatchObject({ mode: 'wait', pose: 'idle', place: 'acampamento' })
    expect(sceneOf({ busy: false, endedAt: 1000 }, null, [], 1000 + NAP_MS + 1)).toMatchObject({ mode: 'sleep', pose: 'sleep' })
  })

  test('trabalhando: a classe da ferramenta no cenário dela; a falha da última troca a pose', async () => {
    const work = { tool: 'Grep', cls: 'mago' as const, summary: 'TODO' }
    expect(sceneOf({ busy: true }, work, [entry('a', { cls: 'mago' })], 0)).toMatchObject({ mode: 'work', hero: 'mago', place: 'biblioteca' })
    expect(sceneOf({ busy: true }, work, [entry('a', { status: 'err' })], 0)).toMatchObject({ mode: 'fail', pose: 'fail' })
    expect(sceneOf({ busy: true }, null, [], 0)).toMatchObject({ mode: 'think', hero: 'aprendiz', place: 'treino' })
  })

  test('o palco cresce sem plano, grupo nem inventário; com eles fica compacto', async () => {
    expect(layoutOf(40, { goal: true, steps: 0, party: 0, items: 0 }).stage).toBe(STAGE_MAX)
    expect(layoutOf(20, { goal: true, steps: 0, party: 0, items: 0 }).stage).toBeGreaterThanOrEqual(STAGE_MIN)
    const busy = layoutOf(40, { goal: true, steps: 4, party: 2, items: 9 })
    expect(busy.stage).toBe(STAGE_MIN)
    expect(busy.maxCards).toBe(2)
    expect(busy.maxItems).toBeLessThanOrEqual(6)
    expect(layoutOf(12, { goal: true, steps: 4, party: 2, items: 9 }).pinned).toBe(false)
  })

  test('com muitos passos, os feitos viram uma linha e o atual fica à vista', async () => {
    const steps = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((name, i) => ({ name, state: i < 4 ? 'done' : i === 4 ? 'now' : 'next' }) as const)
    const w = stepWindow(steps, 5)
    expect(w.hidden).toBe(3)
    expect(w.shown.map(s => s.name)).toEqual(['d', 'e', 'f', 'g'])
  })
})

describe('diff do inventário (D2)', () => {
  test('hunk padrão: separa @@, +, - e contexto, e ignora cabeçalho e No newline', async () => {
    const raw = [
      'diff --git a/src/app.ts b/src/app.ts',
      'index 1111111..2222222 100644',
      '--- a/src/app.ts',
      '+++ b/src/app.ts',
      '@@ -1,3 +1,3 @@',
      ' const a = 1',
      '-const b = 2',
      '+const b = 3',
      '@@ -10,1 +10,2 @@',
      '- -- incremento',
      '+ ++ cabecalho',
      '+export { a, b }',
      '\\ No newline at end of file',
      '',
    ].join('\n').replace('- -- incremento', '--- incremento').replace('+ ++ cabecalho', '+++ cabecalho')
    const d = parseDiff(raw)
    expect(d.binary).toBe(false)
    expect(d.isNew).toBe(false)
    expect(d.isDeleted).toBe(false)
    expect(d.added).toBe(3)
    expect(d.removed).toBe(2)
    expect(d.more).toBe(0)
    expect(d.lines.map(l => l.kind)).toEqual(['hunk', 'ctx', 'del', 'add', 'hunk', 'del', 'add', 'add'])
    expect(diffArgv('src/app.ts')).toEqual(['git', '--literal-pathspecs', 'diff', 'HEAD', '--', 'src/app.ts'])
    expect(diffArgv('src/app:name.ts')).toEqual(['git', '--literal-pathspecs', 'diff', 'HEAD', '--', 'src/app:name.ts'])
    expect(diffArgv('src/*.ts')).toEqual(['git', '--literal-pathspecs', 'diff', 'HEAD', '--', 'src/*.ts'])
    expect(diffArgv('a[1].ts')).toEqual(['git', '--literal-pathspecs', 'diff', 'HEAD', '--', 'a[1].ts'])
  })

  test('linha de contexto vazia dentro de um hunk vira ctx, não meta', async () => {
    const raw = [
      'diff --git a/a.ts b/a.ts',
      '--- a/a.ts',
      '+++ b/a.ts',
      '@@ -1,4 +1,4 @@',
      ' linha 1',
      '',
      ' linha 3',
      '+linha 4',
    ].join('\n')
    const d = parseDiff(raw)
    expect(d.lines.map(l => l.kind)).toEqual(['hunk', 'ctx', 'ctx', 'ctx', 'add'])
    expect(d.lines[2]).toEqual({ kind: 'ctx', text: '' })
  })

  test('arquivo novo (git diff e untrackedDiff) e arquivo excluído', async () => {
    const created = [
      'diff --git a/novo.ts b/novo.ts',
      'new file mode 100644',
      '--- /dev/null',
      '+++ b/novo.ts',
      '@@ -0,0 +1,2 @@',
      '+const x = 1',
      '+const y = 2',
    ].join('\n')
    const c = parseDiff(created)
    expect(c.isNew).toBe(true)
    expect(c.isDeleted).toBe(false)
    expect(c.added).toBe(2)
    expect(c.removed).toBe(0)

    const u = untrackedDiff('linha 1\nlinha 2\n', 40)
    expect(u.isNew).toBe(true)
    expect(u.binary).toBe(false)
    expect(u.added).toBe(2)
    expect(u.lines).toEqual([
      { kind: 'add', text: '+linha 1' },
      { kind: 'add', text: '+linha 2' },
    ])

    const deleted = [
      'diff --git a/velho.ts b/velho.ts',
      'deleted file mode 100644',
      '--- a/velho.ts',
      '+++ /dev/null',
      '@@ -1,2 +0,0 @@',
      '-const x = 1',
      '-const y = 2',
    ].join('\n')
    const del = parseDiff(deleted)
    expect(del.isDeleted).toBe(true)
    expect(del.isNew).toBe(false)
    expect(del.removed).toBe(2)
    expect(del.added).toBe(0)
  })

  test('arquivo binário no git diff e no untrackedDiff', async () => {
    const bin1 = parseDiff('diff --git a/logo.png b/logo.png\nBinary files a/logo.png and b/logo.png differ\n')
    expect(bin1.binary).toBe(true)
    expect(bin1.lines).toEqual([])

    const bin2 = parseDiff('diff --git a/a.bin b/a.bin\nGIT binary patch\nliteral 12\n')
    expect(bin2.binary).toBe(true)
    expect(bin2.lines).toEqual([])

    const bin3 = untrackedDiff('PNG\0\x89')
    expect(bin3.binary).toBe(true)
    expect(bin3.isNew).toBe(true)
    expect(bin3.lines).toEqual([])
  })

  test('arquivo renomeado simples e com escape octal UTF-8 do Git', async () => {
    const ren = parseDiff('diff --git a/antigo.ts b/novo.ts\nsimilarity index 100%\nrename from antigo.ts\nrename to novo.ts\n')
    expect(ren.renamedFrom).toBe('antigo.ts')
    expect(ren.renamedTo).toBe('novo.ts')
    expect(ren.lines).toEqual([])

    const utf8Ren = parseDiff('diff --git "a/a\\303\\247\\303\\243o.ts" "b/cora\\303\\247\\303\\243o.ts"\nrename from "a\\303\\247\\303\\243o.ts"\nrename to "cora\\303\\247\\303\\243o.ts"\n')
    expect(utf8Ren.renamedFrom).toBe('ação.ts')
    expect(utf8Ren.renamedTo).toBe('coração.ts')
    expect(unquoteGitPath('"pasta/miss\\303\\243o \\"1\\".md"')).toBe('pasta/missão "1".md')
  })

  test('UTF-8 com acento e normalização de CRLF', async () => {
    const crlf = 'diff --git a/x.ts b/x.ts\r\n--- a/x.ts\r\n+++ b/x.ts\r\n@@ -1 +1 @@\r\n-// Sessão antiga\r\n+// Configuração de autenticação e sessão (épico)\r\n'
    const d = parseDiff(crlf)
    expect(d.lines.some(l => l.text.includes('\r'))).toBe(false)
    expect(d.lines.find(l => l.kind === 'add')?.text).toBe('+// Configuração de autenticação e sessão (épico)')
  })

  test('truncamento: respeita max (40) e limite de leitura maxRead (200)', async () => {
    const body55 = ['@@ -1,54 +1,54 @@', ...Array.from({ length: 54 }, (_, i) => `+linha ${i + 1}`)].join('\n')
    const d55 = parseDiff(body55, DIFF_MAX_SHOWN, DIFF_MAX_READ)
    expect(d55.lines.length).toBe(40)
    expect(d55.more).toBe(15)
    expect(d55.added).toBe(54)

    const body260 = ['@@ -1,259 +1,259 @@', ...Array.from({ length: 259 }, (_, i) => `+linha ${i + 1}`)].join('\n')
    const d260 = parseDiff(body260, DIFF_MAX_SHOWN, DIFF_MAX_READ)
    expect(d260.lines.length).toBe(40)
    expect(d260.more).toBe(220)
    expect(d260.added).toBe(259)
    expect(d260.approximate).toBe(false)

    const u60 = untrackedDiff(Array.from({ length: 60 }, (_, i) => `l${i}`).join('\n'), 40, 200)
    expect(u60.lines.length).toBe(40)
    expect(u60.more).toBe(20)

    const bodyCortado = ['@@ -1,500 +1,500 @@', ...Array.from({ length: 200 }, (_, i) => `+linha ${i + 1}`)].join('\n')
    const dCortado = parseDiff(bodyCortado, DIFF_MAX_SHOWN, DIFF_MAX_READ, true)
    expect(dCortado.approximate).toBe(true)
    expect(dCortado.added).toBe(200)
    expect(dCortado.more).toBe(161)
  })
})

describe('grimório: timeout, selo parcial e caminhos Windows (B2a, B2b e B2c)', () => {
  test('withTimeout rejeita promessa pendurada e isPending/writesFor pulam destinos já selados', async () => {
    expect(await withTimeout(Promise.resolve('ok'), 100, 'mcp')).toBe('ok')
    let err = ''
    try {
      await withTimeout(new Promise<string>(() => {}), 25, 'memory_write_page')
    } catch (e) {
      err = e instanceof Error ? e.message : String(e)
    }
    expect(err).toContain('memory_write_page: timeout')

    const partial: Inscription = {
      id: 'i1',
      kind: 'decisao',
      text: 'Decidimos paginar no servidor.',
      source: 'resposta',
      destinations: ['vaultDecisao', 'aiMemory'],
      sealed: ['vaultDecisao'],
    }
    expect(isPending(partial)).toBe(true)
    expect(pending([partial]).length).toBe(1)
    const writes = writesFor(partial, { repo: '/repo', vault: '/vault', memory: { server: 'ai-memory' } }, Date.UTC(2026, 9, 11, 12))
    expect(writes.map(w => w.dest)).toEqual(['aiMemory'])

    const full: Inscription = { ...partial, sealed: ['vaultDecisao', 'aiMemory'] }
    expect(isPending(full)).toBe(false)
    expect(pending([full]).length).toBe(0)

    expect(progressHome('C:\\work\\meu-app', '', 'meu-app')).toBe('C:\\work\\meu-app\\.hero\\tarefas')
    expect(progressHome('C:\\work\\meu-app', 'C:\\Notas', 'meu-app')).toBe('C:\\Notas\\.tarefas\\meu-app')
  })
})

describe('barras sem contagem que anda (B1b)', () => {
  test('o tooltip da Mana e do Vigor diz só a hora da renovação: a fonte do Svg não muda a cada minuto', () => {
    expect(DICT.pt.resetAt('16:20')).toBe('às 16:20')
    expect(DICT.en.resetAt('16:20')).toBe('at 16:20')
  })
})
