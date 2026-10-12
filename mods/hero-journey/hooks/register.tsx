// hero-journey: a HUD de RPG do Claude Code.
//
// Liga os módulos de hooks/modules/ aos eventos do motor. Cada módulo tem a sua
// seção aqui e liga ou desliga no ⚙ (prefs.modules); a lógica e as telas ficam
// na pasta do módulo. Tudo o que usa `$` mora neste arquivo, porque o motor não
// segue o `$` através de um import.
//
// Gasto de tokens: só o "Compactar agora" da mochila, o ✦ Recalibrar objetivo e
// o Haiku do grimório (desligado por padrão), e os três só com o clique da pessoa.
//
// Créditos dos padrões de código: Daniel Ávila (claude-code-templates, MIT),
// citado em cada módulo e no README.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement, RenderInput } from 'claude-code'

import type { Campaign, Card, DiaryEntry, GuardFile, Inscription, Lang, Member, ModuleId, Palette, Prefs, Progress, Written } from '../types'
import { agentClass, baseName, classOf, delivers, patchStats, summaryOf } from './core/classes'
import { TONE } from './core/art'
import { DICT, looksPortuguese, resolveLang } from './core/i18n'
import { isWindows, joinPath, openArgv, pickArgvs, pickedOf } from './core/pasta'
import { DEFAULT_MEMORY, DEFAULT_PREFS, isOn, migratePrefs, toggleMemory, toggleModule } from './core/prefs'
import type { Ctx } from './core/ui'
import { assignTurn, buildReport, chapterOf, closeChapter, cutAtWord, goalOf, onPrompt, prune, storeKey } from './modules/campanha/campanha'
import { rowView } from './modules/diario/view'
import { bandView } from './modules/faixa/view'
import { appendDecision, available, continuePrompt, cycleDest, detect, haikuPrompt, isSubfolder, kindOn, memoryTool, merge, nextTaskId, parseMarker, parseTask, pending, progressHome, projectFromRemote, projectName, removeLine, safeName, saveTask, shareablePath, suggest, taskPrefix, taskText, withSuffix, writesFor, writtenOf } from './modules/grimorio/grimorio'
import type { Dests, Memory, MemoryScope, Write } from './modules/grimorio/grimorio'
import { grimPage, marcoCard } from './modules/grimorio/view'
import { diffOf, LABELS, listOption, makeGuard, shellTargets, verdictOf } from './modules/guarda/guarda'
import { guardView } from './modules/guarda/view'
import { COMPACT_AT, compactInstruction, shouldWarn } from './modules/mochila/mochila'
import { alertOf, bagOf, countdown, readingOf, warningsOf } from './modules/mochila/recursos'
import type { UsageReading } from './modules/mochila/recursos'
import { compactCard } from './modules/mochila/view'
import { EMPTY_INVENTORY, LOG_ARGV, NUMSTAT_ARGV, parseInventory, parseLog, questsFromTodos, STATUS_ARGV, upsertMember } from './modules/painel/painel'
import { setupView } from './modules/painel/primeiros-passos'
import { aboutView, configView, footer, mainView, memoryView } from './modules/painel/view'
import { layoutOf, NAP_MS, sceneOf } from './modules/painel/palco'
import { leadOf, receiptOf } from './modules/recibo/recibo'

const PANE = 'hero-journey'
const PANE_TITLE = 'Hero Journey'
// `Task` é o nome antigo da ferramenta Agent.
const AGENT = /^(Agent|Task)$/
const WRITES = /^(Edit|Write|NotebookEdit)$/
const CARD_ORDER: readonly Card[] = ['marco', 'compactar']
const AI_MEMORY_URL = 'https://github.com/akitaonrails/ai-memory'

const lang = atom({ plugin: 'hero-journey', key: 'lang' } as const, 'en')
const theme = atom({ plugin: 'hero-journey', key: 'theme' } as const, 'dark')
const turnId = atom({ plugin: 'hero-journey', key: 'turnId' } as const, '')
const diary = atom({ plugin: 'hero-journey', key: 'diary' } as const, [])
const quests = atom({ plugin: 'hero-journey', key: 'quests' } as const, [])
const party = atom({ plugin: 'hero-journey', key: 'party' } as const, [])
const inventory = atom({ plugin: 'hero-journey', key: 'inventory' } as const, EMPTY_INVENTORY)
const prefs = atom({ plugin: 'hero-journey', key: 'prefs' } as const, DEFAULT_PREFS)
const working = atom({ plugin: 'hero-journey', key: 'working' } as const, null)
const cards = atom({ plugin: 'hero-journey', key: 'cards' } as const, [])
const view = atom({ plugin: 'hero-journey', key: 'view' } as const, 'main')
const campaign = atom({ plugin: 'hero-journey', key: 'campaign' } as const, null)
const guard = atom({ plugin: 'hero-journey', key: 'guard' } as const, [])
const refusals = atom({ plugin: 'hero-journey', key: 'refusals' } as const, [])
const inscriptions = atom({ plugin: 'hero-journey', key: 'inscriptions' } as const, [])
const turn = atom({ plugin: 'hero-journey', key: 'turn' } as const, { busy: false })
const progress = atom({ plugin: 'hero-journey', key: 'progress' } as const, { list: [] })
const remembered = atom({ plugin: 'hero-journey', key: 'remembered' } as const, [])
const setup = atom({ plugin: 'hero-journey', key: 'setup' } as const, {})
const resources = atom({ plugin: 'hero-journey', key: 'resources' } as const, null)
const tick = atom({ plugin: 'hero-journey', key: 'tick' } as const, 0)
const warned = atom({ plugin: 'hero-journey', key: 'warned' } as const, {})

const paletteOf = (value: string): Palette => (/light/i.test(value) ? 'claro' : 'escuro')

/** A língua fixada na opção vale na hora; em `auto`, a que o session.start resolveu. */
const pinned = (option: string): Lang | undefined => (option === 'pt-BR' ? 'pt' : option === 'en' ? 'en' : undefined)

// As opções do mod (lidas a cada carga do módulo) e o que a sessão já disse.
let langOption = 'auto'
let isGuarded = makeGuard()
let paths = { vault: '', inbox: 'Inbox' }
// A língua da primeira mensagem só decide quando nada mais disse qual é.
let langFromPrompt = false
// Sem ninguém para responder (claude -p), o guarda nega.
let interactive = true
// O texto que abriu cada turno, para o grimório achar as preferências da pessoa.
const turnPrompts = new Map<string, string>()
// O cartão de compactar entra uma vez por subida da mochila acima do limite.
let bagWarned = false
// O relógio da contagem do reset: um só, mesmo que o session.start rode de novo.
let clock: { cancel: () => void } | undefined
// Um Selar por vez: o segundo clique, enquanto o primeiro grava, não faz nada.
let sealing = false
// O "Verificar" que a pessoa digita no cartão de compactar, até salvar o progresso.
let verifyDraft = ''
// Os avisos do Sábio que a pessoa dispensou: o do turno (pelo turnId) e o de antes de dormir (pela hora).
let notedDismissed = ''
let saveDismissedAt = 0
// O marco do último fim de turno (nome e detalhe do cartão) e o plano já celebrado (para não repetir).
let marcoInfo = { name: '', sub: '' }
let planCelebrated = ''
// O texto da tarefa antes do último salvar, para o Desfazer voltar a ele.
// Quantas notas a memória automática do Claude tem neste projeto (sem ai-memory), e onde.
let autoNotes: { n: number; dir: string } | undefined

// ---------- Ajudantes (usam `$`: o validador quer funções no topo do arquivo) ----------

async function langNow($: EngineInterface): Promise<Lang> {
  return pinned(langOption) ?? (await read($, lang))
}

async function prefsNow($: EngineInterface): Promise<Prefs> {
  return read($, prefs)
}

async function moduleOn($: EngineInterface, id: ModuleId) {
  return isOn(await prefsNow($), id)
}

async function ctxOf($: EngineInterface, surface: string, width: number): Promise<Omit<Ctx, 'ui'>> {
  const p = await prefsNow($)
  const themeValue = await read($, theme)
  const palette = paletteOf(themeValue)
  return {
    desktop: surface === 'desktop',
    t: DICT[await langNow($)],
    palette,
    skin: p.skin,
    width,
    bg: /dark|light/i.test(themeValue) ? TONE[palette].pane : undefined,
  }
}

async function refreshTheme($: EngineInterface) {
  const row = (await $.config.list().catch(() => [])).find(r => r.key === 'theme')
  await update($, theme, () => (row === undefined ? 'dark' : String(row.value)))
}

async function refreshInventory($: EngineInterface) {
  try {
    const status = await $.process.run([...STATUS_ARGV], { timeoutMs: 5000 })
    if (status.exitCode !== 0) {
      await update($, inventory, () => EMPTY_INVENTORY)
      return
    }
    const numstat = await $.process.run([...NUMSTAT_ARGV], { timeoutMs: 5000 })
    const log = await $.process.run([...LOG_ARGV], { timeoutMs: 5000 }).catch(() => undefined)
    const inv = parseInventory(status.stdout, numstat.exitCode === 0 ? numstat.stdout : '', isGuarded)
    await update($, inventory, () => ({ ...inv, recent: log?.exitCode === 0 ? parseLog(log.stdout) : [] }))
  } catch {
    await update($, inventory, () => EMPTY_INVENTORY)
  }
}

/** Lê o $.store na hora de gravar: outra sessão aberta pode ter mudado as preferências. */
async function savePrefs($: EngineInterface, change: (p: Prefs) => Prefs) {
  const stored = await $.store.get('prefs')
  const next = change(stored === undefined ? await read($, prefs) : migratePrefs(stored))
  await update($, prefs, () => next)
  await $.store.set('prefs', next)
}

async function pushCard($: EngineInterface, card: Card) {
  await update($, cards, list =>
    list.includes(card) ? list : [...list, card].sort((a, b) => CARD_ORDER.indexOf(a) - CARD_ORDER.indexOf(b)),
  )
}

async function dropCard($: EngineInterface, card: Card) {
  await update($, cards, list => list.filter(c => c !== card))
}

/** Leva o texto ao prompt; onde não há caixa, copia. */
async function fillOrCopy($: EngineInterface, text: string) {
  const t = DICT[await langNow($)]
  const r = await $.prompt.fill({ text })
  if (r.isFilled) {
    $.ui.toast(t.filled)
    return true
  }
  await $.ui.copy({ text })
  $.ui.toast(t.noComposer)
  return false
}

/**
 * Lê os recursos do motor. Com `detailed`, pede também o detalhamento (estimado
 * localmente, sem tokens), que traz o ponto de compactação e o que ocupa a mochila.
 */
async function readResources($: EngineInterface, detailed: boolean, turnEnded: boolean) {
  try {
    const u = detailed ? await $.session.usage({ breakdown: 'summary' }) : await $.session.usage()
    await takeReading($, u as unknown as UsageReading, turnEnded)
  } catch {
    // Sem leitura agora: o rodapé fica com a última.
  }
}

/** Guarda a leitura, avisa a janela que ficou crítica e põe o cartão de compactar quando a mochila pesa. */
async function takeReading($: EngineInterface, u: UsageReading, turnEnded: boolean) {
  const prev = await read($, resources)
  const next = readingOf(u, prev, turnEnded)
  await update($, resources, () => next)
  // Uma queda brusca da mochila é uma compactação (a automática também): o cartão
  // que pedia para compactar sai, se ela ficou abaixo do limite.
  const emptied = prev?.tokens !== undefined && next.tokens !== undefined && next.tokens < prev.tokens * 0.6
  if (emptied && (bagOf(next).percent ?? 0) < COMPACT_AT) await dropCard($, 'compactar')
  const t = DICT[await langNow($)]
  const before = await read($, warned)
  const w = warningsOf(next.windows, before, Date.now())
  if (JSON.stringify(w.warned) !== JSON.stringify(before)) await update($, warned, () => w.warned)
  for (const f of w.fire) {
    const name = f.kind === 'seven_day' ? t.footer.vigor : t.footer.mana
    $.ui.toast(t.windowWarn(name, Math.round(f.left), f.resetIn === undefined ? '' : countdown(f.resetIn)))
  }
  if (await moduleOn($, 'mochila')) {
    const step = shouldWarn(bagOf(next).percent ?? 0, bagWarned)
    if (step === 'warn') {
      bagWarned = true
      await pushCard($, 'compactar')
    } else if (step === 'reset') bagWarned = false
  }
}

/**
 * A campanha é acompanhada sempre (a faixa e o recibo leem dela); o módulo
 * campanha decide se ela fica guardada no $.store.
 */
async function saveCampaign($: EngineInterface, c: Campaign) {
  await update($, campaign, () => c)
  if (await moduleOn($, 'campanha')) await $.store.set(storeKey(c.id), c)
}

async function compactNow($: EngineInterface) {
  const t = DICT[await langNow($)]
  if ((await read($, working)) !== null) {
    $.ui.toast(t.compactBusy)
    return
  }
  try {
    const r = await $.session.compact({ instructions: compactInstruction(await langNow($), await read($, campaign), await read($, quests)) })
    await dropCard($, 'compactar')
    if ('skip' in r) return
    const k = (n: number | undefined) => (n === undefined ? '—' : `${Math.round(n / 1000)}k`)
    $.ui.toast(t.compactDone(k(r.tokensBefore), k(r.tokensAfter)))
  } catch {
    $.ui.toast(t.compactBusy)
  }
}

/** Para onde o grimório pode gravar agora: a pasta do vault e o ai-memory, se o MCP dele estiver conectado. */
async function grimDests($: EngineInterface): Promise<Dests> {
  return { vault: paths.vault, inbox: paths.inbox, memory: memoryTool(await $.tool.list().catch(() => [])) }
}

let scopeCache: { cwd: string; scope: MemoryScope } | undefined

/**
 * O workspace e o projeto do ai-memory, como os clientes sem hooks devem achar:
 * o `.ai-memory.toml` mais próximo (subindo da pasta da sessão), depois o da pasta
 * do usuário; o projeto, sem marcador, sai do remoto (upstream, senão origin) e, sem
 * remoto, do nome da pasta. Lido uma vez por pasta.
 */
async function memoryScope($: EngineInterface): Promise<MemoryScope> {
  const cwd = await $.session.cwd()
  if (scopeCache?.cwd === cwd) return scopeCache.scope
  const readMarker = async (dir: string) => {
    const file = joinPath(dir, '.ai-memory.toml')
    return (await $.fs.exists(file).catch(() => false)) ? parseMarker(await $.fs.read(file).catch(() => '')) : undefined
  }
  let near: Partial<MemoryScope> | undefined
  for (let dir = cwd, i = 0; i < 12 && near === undefined; i++) {
    near = await readMarker(dir)
    const up = dir.replace(/[\\/][^\\/]+[\\/]?$/, '')
    if (up === dir || up === '' || /^[A-Za-z]:$/.test(up)) break
    dir = up
  }
  const home = (await $.env.get('USERPROFILE').catch(() => undefined)) ?? (await $.env.get('HOME').catch(() => undefined))
  const user = home === undefined ? undefined : await readMarker(home)
  let project = near?.project
  for (const remote of ['upstream', 'origin']) {
    if (project !== undefined) break
    const r = await $.process.run(['git', 'remote', 'get-url', remote], { timeoutMs: 5000 }).catch(() => undefined)
    const name = r?.exitCode === 0 ? projectFromRemote(r.stdout) : ''
    if (name !== '') project = name
  }
  const scope = { workspace: near?.workspace ?? user?.workspace ?? 'default', project: project ?? (safeName(projectName(cwd)) || 'default') }
  scopeCache = { cwd, scope }
  return scope
}

/** Uma chamada ao ai-memory com o escopo desta pasta: sem ele, as leituras falham e as escritas vão para o projeto padrão. */
async function memoryCall($: EngineInterface, memory: { server: string }, tool: string, args: Record<string, unknown>) {
  return $.mcp.call(memory.server, tool, { ...(await memoryScope($)), ...args })
}

/**
 * Grava uma inscrição num destino e devolve onde, ou `undefined` quando não havia
 * nada a gravar (a regra já estava no AGENTS.md): aí o Desfazer não tem o que tirar,
 * e tirar apagaria a linha que já existia. Nota nova nunca sobrescreve outra: ganha -2, -3…
 */
async function writeOne($: EngineInterface, w: Write, memory: Memory | undefined, used: Set<string>, heading: string): Promise<string | undefined> {
  if (w.dest === 'aiMemory') {
    let p = w.path
    for (let n = 2; used.has(p); n++) p = withSuffix(w.path, n)
    used.add(p)
    const r = await memoryCall($, memory!, 'memory_write_page', { path: p, body: w.text })
    if (r.isError) throw new Error(r.content.map(c => ('text' in c ? String(c.text) : '')).join(' ').slice(0, 200))
    return p
  }
  if (w.append) {
    const current = (await $.fs.exists(w.path)) ? await $.fs.read(w.path) : ''
    const next = appendDecision(current, w.text, heading)
    if (next === current) return undefined
    await $.fs.write(w.path, next)
    return w.path
  }
  // ponytail: exists→write não é atômico; duas sessões selando no mesmo instante podem colidir.
  let p = w.path
  for (let n = 2; used.has(p) || (await $.fs.exists(p)); n++) p = withSuffix(w.path, n)
  used.add(p)
  await $.fs.write(p, w.text)
  return p
}

/**
 * Grava as inscrições pendentes no destino de cada uma. Nada sai daqui sem o
 * clique em Selar. Uma inscrição só sai da lista quando gravou; se o destino
 * falhou ou sumiu, ela continua pendente para o próximo Selar tentar de novo.
 */
async function seal($: EngineInterface) {
  // Dois cliques seguidos não gravam duas vezes.
  if (sealing) return
  sealing = true
  try {
    const t = DICT[await langNow($)]
    // Inscrição sem destino fica onde está, sem aviso de falha: falta a pessoa dizer onde guardar.
    const list = pending(await read($, inscriptions)).filter(i => i.destinations.length > 0)
    if (list.length === 0) {
      if (pending(await read($, inscriptions)).length > 0) $.ui.toast(t.grimNoneMarked)
      return
    }
    const repo = await $.session.cwd()
    const found = await grimDests($)
    // O vault e a pasta de entrada podem vir do /config sem passar pelos Primeiros passos:
    // confere antes de gravar. Uma pasta de entrada que sai do vault desliga o destino.
    const inbox = found.inbox ?? 'Inbox'
    let vault = ''
    if (found.vault !== '' && !isSubfolder(inbox)) $.ui.toast(t.inboxInvalid(inbox))
    else if (found.vault !== '') vault = (await checkedFolder($, found.vault)) ?? ''
    const dests = { ...found, vault }
    const used = new Set<string>()
    const missed: string[] = []
    const sealed: Record<string, { ok: Inscription['destinations']; written: Written[] }> = {}
    for (const i of list) {
      const writes = writesFor(i, { repo, ...dests }, Date.now())
      // A regra de privacidade barrou (o texto cita o vault ou um caminho pessoal): avisa, e a inscrição fica.
      if (writes.length === 0 && i.destinations.every(d => available(d, dests))) $.ui.toast(t.privacyBlocked)
      const written: Written[] = []
      const ok: Inscription['destinations'] = []
      for (const w of writes) {
        try {
          const at = await writeOne($, w, dests.memory, used, t.rulesHeading)
          ok.push(w.dest)
          if (at !== undefined) written.push(writtenOf(w, at))
        } catch (err) {
          missed.push(`${t.dest[w.dest]}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      if (ok.length > 0 && ok.length === writes.length) sealed[i.id] = { ok, written }
    }
    const done = Object.keys(sealed).length
    if (done > 0) $.ui.toast(t.sealed(done))
    if (done < list.length || missed.length > 0) $.ui.toast(t.notSealed(list.length - done, missed.join('; ')))
    await update($, inscriptions, all => all.map((i): Inscription => (sealed[i.id] !== undefined ? { ...i, sealed: sealed[i.id]!.ok, written: sealed[i.id]!.written } : i)))
    if (pending(await read($, inscriptions)).length === 0) await dropCard($, 'marco')
  } finally {
    sealing = false
  }
}

async function discard($: EngineInterface) {
  await update($, inscriptions, all => all.filter(i => i.sealed !== undefined))
  await dropCard($, 'marco')
}

/** Apaga um arquivo que o grimório criou (o $.fs não apaga): Remove-Item no Windows, rm no resto. */
async function deleteFile($: EngineInterface, path: string) {
  const argv = (await onWindows($))
    ? ['powershell', '-NoProfile', '-NonInteractive', '-Command', 'Remove-Item -LiteralPath $env:HJ_PATH -Force']
    : ['rm', '-f', path]
  const r = await $.process.run(argv, { timeoutMs: 10_000, env: { HJ_PATH: path } })
  if (r.exitCode !== 0) throw new Error(r.stderr.trim().slice(0, 160) || `exit ${r.exitCode}`)
}

/** Desfaz o que um Selar gravou e devolve a inscrição para "Para guardar". */
async function undoSeal($: EngineInterface, id: string) {
  const t = DICT[await langNow($)]
  const i = (await read($, inscriptions)).find(x => x.id === id)
  if (i?.written === undefined) return
  const memory = (await grimDests($)).memory
  try {
    for (const w of i.written) {
      if (w.mode === 'linha' && w.line !== undefined) {
        if (await $.fs.exists(w.path)) await $.fs.write(w.path, removeLine(await $.fs.read(w.path), w.line))
      } else if (w.mode === 'pagina') {
        if (memory !== undefined) await memoryCall($, memory, 'memory_delete_page', { path: w.path })
      } else await deleteFile($, w.path)
    }
    await update($, inscriptions, all => all.map((x): Inscription => (x.id === id ? { ...x, sealed: undefined, written: undefined } : x)))
    $.ui.toast(t.undone)
  } catch (err) {
    $.ui.toast(t.notSealed(0, err instanceof Error ? err.message : String(err)))
  }
}

/** O vault de verdade (conferido) e os destinos do grimório agora. */
async function liveDests($: EngineInterface): Promise<Dests> {
  const found = await grimDests($)
  return { ...found, vault: found.vault === '' ? '' : ((await $.fs.stat(found.vault).catch(() => undefined))?.kind === 'dir' ? found.vault : '') }
}

/** Para onde o progresso vai, em palavras: "Tarefa + ai-memory", "Tarefa no vault" ou "Tarefa no projeto". */
async function progressLabel($: EngineInterface) {
  const t = DICT[await langNow($)]
  const d = await grimDests($)
  return d.vault !== '' ? (d.memory !== undefined ? t.progressDest.vaultMemory : t.progressDest.vault) : t.progressDest.project
}

/** O próximo passo: a tarefa atual do plano, a primeira pendente ou o **Próximo:** da última resposta. */
async function nextStepNow($: EngineInterface) {
  const list = await read($, quests)
  const now = list.find(q => q.status === 'in_progress') ?? list.find(q => q.status === 'pending')
  if (now !== undefined) return now.title
  const c = await read($, campaign)
  return [...(c?.chapters ?? [])].reverse().find(ch => ch.report?.next !== undefined)?.report?.next ?? ''
}

/**
 * Salvar progresso: grava a tarefa (nova, ou a desta campanha atualizada) e,
 * com o ai-memory conectado, abre o handoff para continuar em outro agente ou PC.
 */
async function saveProgress($: EngineInterface): Promise<boolean> {
  const l = await langNow($)
  const t = DICT[l]
  const c = await read($, campaign)
  if (c === null) {
    $.ui.toast(t.nothingToSave)
    return false
  }
  try {
    const repo = await $.session.cwd()
    const d = await liveDests($)
    const home = progressHome(repo, d.vault, (await memoryScope($)).project)
    const name = projectName(repo)
    const known = (await $.store.get(`tarefa:${c.id}`).catch(() => undefined)) as string | undefined
    const files = await $.fs.list(home).then(es => es.map(x => x.name)).catch(() => [] as string[])
    const path = known !== undefined && (await $.fs.exists(known)) ? known : `${home}/${nextTaskId(files, taskPrefix(name))}.md`
    const before = (await $.fs.exists(path)) ? await $.fs.read(path) : undefined
    const id = /([A-Z0-9]+-\d{3})\.md$/.exec(path)?.[1] ?? nextTaskId(files, taskPrefix(name))
    const entries = await read($, diary)
    const inv = await read($, inventory)
    const host = (await $.env.get('COMPUTERNAME').catch(() => undefined)) ?? (await $.env.get('HOSTNAME').catch(() => undefined)) ?? 'pc'
    const failed = entries.filter(x => x.status === 'err').slice(-5).map(x => x.summary)
    const task = saveTask(before === undefined ? undefined : parseTask(before), {
      id,
      project: name,
      at: Date.now(),
      title: goalOf(c),
      objective: cutAtWord(c.objective.replace(/\s+/g, ' '), 240),
      next: await nextStepNow($),
      verify: verifyDraft,
      failed,
      logLine: [host, 'Claude Code', t.actions(entries.length), inv.recent?.[0]?.hash ?? ''].filter(Boolean).join(' | '),
    })
    // Sem vault, as tarefas moram no projeto: o .gitignore próprio vem antes da tarefa,
    // para ela nunca ficar visível ao git se a gravação dele falhar.
    if (d.vault === '' && !(await $.fs.exists(`${repo}/.hero/.gitignore`))) await $.fs.write(`${repo}/.hero/.gitignore`, '*\n')
    await $.fs.write(path, taskText(task))
    await $.store.set(`tarefa:${c.id}`, path)
    let handoffId: string | undefined
    if (d.memory !== undefined) {
      try {
        // O ID e o caminho da tarefa vão no resumo ("pegue a tarefa X" acha o arquivo em qualquer agente),
        // relativo ao vault ou ao repositório: nome de usuário e pasta pessoal não saem da máquina.
        const r = await memoryCall($, d.memory, 'memory_handoff_begin', {
          summary: `${task.id} ${task.title}: ${task.next || task.objective} (${t.taskFile}: ${shareablePath(path, [d.vault, repo])})`.slice(0, 400),
          next_steps: (await read($, quests)).filter(q => q.status !== 'completed').map(q => q.title).slice(0, 8),
          open_questions: task.verify === '' ? [] : [`${t.verify}: ${task.verify}`],
        })
        if (r.isError) throw new Error(r.content.map(x => ('text' in x ? String(x.text) : '')).join(' ').slice(0, 160))
        const text = r.content.map(x => ('text' in x ? String(x.text) : '')).join('')
        handoffId = /"handoff_id"\s*:\s*"([^"]+)"/.exec(text)?.[1]
      } catch (err) {
        $.ui.toast(t.handoffFailed(err instanceof Error ? err.message : String(err)))
      }
    }
    await update($, progress, s => ({ ...s, saved: { at: Date.now(), path, id: task.id, handoffId, created: before === undefined, before } }))
    verifyDraft = ''
    $.ui.toast(t.progressDone(task.id))
    await refreshProgress($)
    return true
  } catch (err) {
    $.ui.toast(t.progressFailed(err instanceof Error ? err.message : String(err)))
    return false
  }
}

/** Desfaz o último salvar progresso: a tarefa volta ao texto de antes (ou some, se era nova) e o handoff é cancelado. */
async function undoProgress($: EngineInterface) {
  const t = DICT[await langNow($)]
  const s = (await read($, progress)).saved
  if (s === undefined) return
  try {
    if (s.created) await deleteFile($, s.path)
    else if (s.before !== undefined) await $.fs.write(s.path, s.before)
    const memory = (await grimDests($)).memory
    if (s.handoffId !== undefined && memory !== undefined) await memoryCall($, memory, 'memory_handoff_cancel', { handoff_id: s.handoffId })
    await update($, progress, x => ({ ...x, saved: undefined }))
    $.ui.toast(t.undone)
    await refreshProgress($)
  } catch (err) {
    $.ui.toast(t.progressFailed(err instanceof Error ? err.message : String(err)))
  }
}

/** "ontem 18:40 · Claude Code" a partir da tarefa: a última linha do log diz quando e quem. */
const byOf = (log: readonly string[]) => {
  const last = log[log.length - 1] ?? ''
  const parts = last.split('|').map(x => x.trim())
  return { updated: parts[0] ?? '', by: parts[2] ?? '' }
}

/** O que dá para continuar: as tarefas abertas deste projeto e, com o ai-memory, os handoffs pendentes. */
async function refreshProgress($: EngineInterface) {
  try {
    const repo = await $.session.cwd()
    const d = await liveDests($)
    const home = progressHome(repo, d.vault, (await memoryScope($)).project)
    const list: Progress[] = []
    for (const e of await $.fs.list(home).catch(() => [])) {
      if (e.kind !== 'file' || !/\.md$/.test(e.name) || e.name.startsWith('_')) continue
      const task = parseTask(await $.fs.read(`${home}/${e.name}`).catch(() => ''))
      if (task === undefined || task.status === 'concluida') continue
      const b = byOf(task.log)
      list.push({ id: task.id, title: task.title, next: task.next, updated: b.updated || task.updated, by: b.by, path: `${home}/${e.name}` })
    }
    if (d.memory !== undefined) {
      const r = await memoryCall($, d.memory, 'memory_handoff_list', {}).catch(() => undefined)
      const text = r === undefined || r.isError ? '' : r.content.map(x => ('text' in x ? String(x.text) : '')).join('')
      const parsed = (() => {
        try {
          return JSON.parse(text) as { handoffs?: { handoff_id?: string; id?: string; summary?: string; next_steps?: string[]; agent?: string; created_at?: string }[] }
        } catch {
          return {}
        }
      })()
      for (const h of parsed.handoffs ?? []) {
        const hid = h.handoff_id ?? h.id
        if (hid === undefined) continue
        // O handoff de uma tarefa já listada vira o dela (o Continuar também o aceita), não uma segunda linha.
        const mine = list.find(x => x.handoffId === undefined && (h.summary ?? '').startsWith(`${x.id} `))
        if (mine !== undefined) {
          mine.handoffId = hid
          continue
        }
        list.push({ id: hid, title: (h.summary ?? hid).split(':')[0]?.slice(0, 80) ?? hid, next: h.next_steps?.[0] ?? '', updated: (h.created_at ?? '').slice(0, 16).replace('T', ' '), by: h.agent ?? 'ai-memory', handoffId: hid })
      }
    }
    list.sort((x, y) => y.updated.localeCompare(x.updated))
    await update($, progress, s => ({ ...s, list }))
  } catch {
    // Sem pasta ou sem MCP agora: o Continuar fica com o que já tinha.
  }
}

/** Continuar: pega o handoff (se for do ai-memory) e leva ao prompt o pedido de ler a tarefa e conferir antes de mexer. */
async function continueTask($: EngineInterface, p: Progress) {
  const l = await langNow($)
  const memory = (await grimDests($)).memory
  if (p.handoffId !== undefined && memory !== undefined) await memoryCall($, memory, 'memory_handoff_accept', { handoff_id: p.handoffId }).catch(() => undefined)
  await fillOrCopy($, continuePrompt(l, p.title, p.path ?? (l === 'pt' ? 'o handoff que o ai-memory entregou' : 'the handoff ai-memory delivered')))
}

/**
 * O que o Sábio lembra: com o ai-memory, as páginas recentes do projeto; sem ele,
 * quantas notas a memória automática do Claude tem para esta pasta.
 */
async function refreshRemembered($: EngineInterface) {
  const d = await grimDests($)
  if (d.memory !== undefined) {
    const r = await memoryCall($, d.memory, 'memory_recent', { limit: 4 }).catch(() => undefined)
    const text = r === undefined || r.isError ? '' : r.content.map(x => ('text' in x ? String(x.text) : '')).join('')
    try {
      const parsed = JSON.parse(text) as { pages?: { path?: string; title?: string; kind?: string }[]; hits?: { path?: string; title?: string; kind?: string }[] }
      const pages = parsed.pages ?? parsed.hits ?? []
      await update($, remembered, () =>
        pages.filter(p => typeof p.path === 'string').slice(0, 4).map(p => ({ kind: p.kind ?? (p.path ?? '').split('/')[0] ?? '', text: p.title ?? p.path ?? '', path: p.path ?? '' })),
      )
    } catch {
      await update($, remembered, () => [])
    }
    autoNotes = undefined
    return
  }
  await update($, remembered, () => [])
  const homeDir = (await $.env.get('USERPROFILE').catch(() => undefined)) ?? (await $.env.get('HOME').catch(() => undefined))
  if (homeDir === undefined) return
  const dir = `${homeDir}/.claude/projects/${(await $.session.cwd()).replace(/[:\\/]/g, '-')}/memory`
  const files = await $.fs.list(dir).catch(() => [])
  const n = files.filter(f => f.kind === 'file' && /\.md$/i.test(f.name) && f.name !== 'MEMORY.md').length
  autoNotes = files.length === 0 ? undefined : { n, dir }
}

/** "esquecer": marca a página como velha no ai-memory (sai da busca com o tempo) e some da lista. */
async function forget($: EngineInterface, path: string) {
  const t = DICT[await langNow($)]
  const memory = (await grimDests($)).memory
  if (memory !== undefined) await memoryCall($, memory, 'memory_feedback', { path, feedback: 'stale' }).catch(() => undefined)
  await update($, remembered, list => list.filter(x => x.path !== path))
  $.ui.toast(t.forgotten)
}

/** Sugere de novo o destino das inscrições pendentes (depois de trocar onde as decisões caem ou de ligar o vault). */
async function resuggest($: EngineInterface) {
  const p = await prefsNow($)
  const d = await grimDests($)
  await update($, inscriptions, all =>
    all.map((i): Inscription => {
      if (i.sealed !== undefined) return i
      const keep = i.destinations[0] !== undefined && available(i.destinations[0], d) && p.memory.decisoesEm === 'auto'
      const s = suggest(i.kind, d, p.memory.decisoesEm)
      return keep ? i : { ...i, destinations: s === undefined ? [] : [s] }
    }),
  )
}

/**
 * Grava o vault e acha a pasta de entrada sozinha: a do jeito PARA (00-Inbox), se
 * existir; senão, a padrão (Inbox). Assim os Primeiros passos não perguntam por ela.
 */
async function setVault($: EngineInterface, folder: string) {
  await $.config.set({ key: 'hero-journey.vaultPath', value: folder })
  let inbox = 'Inbox'
  for (const sub of ['00-Inbox', 'Inbox']) {
    if ((await $.fs.stat(joinPath(folder, sub)).catch(() => undefined))?.kind === 'dir') {
      await $.config.set({ key: 'hero-journey.vaultInbox', value: sub })
      inbox = sub
      break
    }
  }
  // As opções só chegam ao mod na próxima carga: a sessão passa a usar o vault já.
  paths = { vault: folder, inbox }
}

/** Escolhe (ou troca) a pasta do vault pelo seletor do sistema. Devolve se gravou. */
async function changeVault($: EngineInterface): Promise<boolean> {
  const t = DICT[await langNow($)]
  const picked = await pickFolder($, t.pickVaultTitle, paths.vault)
  if (picked === null) $.ui.toast(t.pickUnavailable)
  if (picked === null || picked === undefined) return false
  const folder = await checkedFolder($, picked)
  if (folder === undefined) return false
  await setVault($, folder)
  await resuggest($)
  return true
}

/** Onde as decisões caem: no projeto, ou no vault (sem vault, abre o seletor de pasta para escolher). */
async function chooseHome($: EngineInterface, home: 'projeto' | 'vault' | 'auto') {
  if (home === 'vault' && paths.vault === '' && !(await changeVault($))) return
  await savePrefs($, x => ({ ...x, memory: { ...x.memory, decisoesEm: home } }))
  await resuggest($)
}

/** O ⚙ Memória → Testar: o ai-memory responde ao memory_status? */
async function testMemory($: EngineInterface) {
  const t = DICT[await langNow($)]
  const memory = (await grimDests($)).memory
  if (memory === undefined) return
  try {
    const r = await $.mcp.call(memory.server, 'memory_status', {})
    if (r.isError) throw new Error(r.content.map(x => ('text' in x ? String(x.text) : '')).join(' ').slice(0, 160))
    $.ui.toast(t.memTestOk)
  } catch (err) {
    $.ui.toast(t.memTestFail(err instanceof Error ? err.message : String(err)))
  }
}

/** Haiku: só no clique em "Resumir com Haiku" (o botão aparece com o ⚙ ligado). Gasta tokens. */
async function rewriteWithHaiku($: EngineInterface) {
  const l = await langNow($)
  const out: Inscription[] = []
  for (const i of pending(await read($, inscriptions))) {
    try {
      const r = await $.model.complete({ model: 'haiku', prompt: haikuPrompt(i, l), maxTokens: 120 })
      out.push(r.isAnswered && r.text.trim() !== '' ? { ...i, text: r.text.trim().replace(/^"|"$/g, '') } : i)
    } catch {
      out.push(i)
    }
  }
  const byId = new Map(out.map(i => [i.id, i]))
  await update($, inscriptions, all => all.map(i => byId.get(i.id) ?? i))
  $.ui.toast(DICT[l].haikuDone(out.length))
}

/**
 * ✦ Recalibrar objetivo: o Haiku lê os pedidos da pessoa nesta sessão (o 1º e os
 * capítulos) e devolve o objetivo atual em poucas palavras. Só roda no clique.
 */
async function recalibrateGoal($: EngineInterface) {
  const l = await langNow($)
  const t = DICT[l]
  const c = await read($, campaign)
  if (c === null) return
  const asks = [c.objective, ...c.chapters.slice(1).map(ch => ch.prompt)].slice(-10)
  try {
    const r = await $.model.complete({ model: 'haiku', prompt: t.recalibratePrompt(asks), maxTokens: 60 })
    const text = r.isAnswered ? (r.text.trim().replace(/^["“']|["”'.]$/g, '').split(/\r?\n/)[0]?.trim() ?? '') : ''
    if (text === '') {
      $.ui.toast(t.recalibrateFail)
      return
    }
    const cur = await read($, campaign)
    if (cur !== null) await saveCampaign($, { ...cur, short: cutAtWord(text, 70), shortFrom: 'haiku' })
    $.ui.toast(t.recalibrateDone(cutAtWord(text, 70)))
  } catch {
    $.ui.toast(t.recalibrateFail)
  }
}

/** O Paladino pergunta: põe os arquivos no estado (o desenho lê), pergunta e limpa. */
async function askGuard($: EngineInterface, files: GuardFile[]) {
  const l = await langNow($)
  const t = DICT[l]
  const labels = LABELS[l]
  const names = files.map(f => f.name).join(', ')
  await update($, guard, () => files)
  try {
    const answer = await $.ui.ask(t.guardQuestion(names), {
      header: t.guardHeader,
      options: labels,
    })
    return verdictOf(answer, labels)
  } catch {
    // Dispensado, ou ninguém para responder (claude -p): nos dois casos, não libera.
    return 'sem-resposta' as const
  } finally {
    await update($, guard, () => [])
  }
}

/**
 * Decide uma escrita em arquivo protegido. Sempre pergunta (o `$.ui.ask` rejeita
 * sozinho onde não há ninguém); `interactive` só escolhe a mensagem da recusa.
 */
async function guardCall($: EngineInterface, tool: string, toolUseId: string, files: GuardFile[]) {
  const t = DICT[await langNow($)]
  const names = files.map(f => f.name).join(', ')
  const mode = (await prefsNow($)).guardMode
  if (mode === 'nativo') {
    $.ui.notice(toolUseId, t.guardNotice(names))
    return undefined
  }
  const verdict = await askGuard($, files)
  if (verdict === 'liberar') return undefined
  if (verdict === 'sem-resposta' && !interactive) return { deny: t.denyHeadless(names) }
  if (verdict === 'negociar') {
    await fillOrCopy($, t.negotiateDraft(names))
    return { deny: t.denyNegotiate(names) }
  }
  const turn = await read($, turnId)
  await update($, refusals, list => [...list, { turnId: turn, text: `${names} (${tool})` }])
  return { deny: t.denyRefuse(names) }
}

/**
 * Uma pasta digitada: só entra se for uma pasta que existe, e entra pelo caminho
 * absoluto (um relativo mudaria de sentido em outra sessão). Caminho de rede o
 * $.fs não alcança: a pessoa recebe o aviso em vez de nada.
 */
async function checkedFolder($: EngineInterface, raw: string) {
  const t = DICT[await langNow($)]
  const folder = raw.trim().replace(/^"|"$/g, '')
  if (folder === '') return undefined
  if (/^[\\/]{2}/.test(folder)) {
    $.ui.toast(t.folderNetwork(folder))
    return undefined
  }
  const stat = await $.fs.stat(folder, { resolve: true }).catch(() => undefined)
  if (stat?.kind === 'dir') return stat.realPath ?? folder
  $.ui.toast(t.folderMissing(folder))
  return undefined
}

async function onWindows($: EngineInterface) {
  return isWindows(await $.env.get('OS').catch(() => undefined))
}

/**
 * O seletor de pasta do sistema. Devolve o caminho escolhido, undefined se a
 * pessoa cancelou, ou null se nenhum seletor abriu (Linux sem zenity, por exemplo).
 * A espera pela pessoa fica dentro do `$.process.run`, que não conta no tempo do hook.
 */
async function pickFolder($: EngineInterface, title: string, start: string): Promise<string | undefined | null> {
  const win = await onWindows($)
  const tries = win ? pickArgvs('windows') : [...pickArgvs('mac'), ...pickArgvs('linux')]
  for (const argv of tries) {
    try {
      const r = await $.process.run(argv, { timeoutMs: 600_000, env: { HJ_TITLE: title, HJ_START: start } })
      if (r.exitCode === 0) return pickedOf(r.stdout)
      // osascript, zenity e kdialog saem com 1 no Cancelar; o PowerShell sai com 0 e nada escrito.
      if (!win && r.exitCode === 1) return undefined
    } catch {
      // Sem esse programa aqui: tenta o próximo.
    }
  }
  return null
}

/** Abre a pasta no Explorer, no Finder ou no gerenciador de arquivos do Linux. */
async function openFolder($: EngineInterface, path: string) {
  const win = await onWindows($)
  // xdg-open antes do open: no Linux, `open` pode ser outro programa (openvt).
  const tries = win ? [openArgv('windows', path)] : [openArgv('linux', path), openArgv('mac', path)]
  for (const argv of tries) {
    try {
      const r = await $.process.run(argv, { timeoutMs: 15_000 })
      // O explorer.exe sai com 1 mesmo quando abre a pasta.
      if (win || r.exitCode === 0) return
    } catch {
      // Sem esse programa aqui: tenta o próximo.
    }
  }
  $.ui.toast(DICT[await langNow($)].openFailed(path))
}

/** O 📖 do rodapé, o "Ver e guardar" do Sábio e o /grimorio: abrem a página do grimório no painel. */
async function openGrimoire($: EngineInterface) {
  await refreshRemembered($)
  await update($, view, () => 'grimorio' as const)
}

let readingTasks = false

/**
 * As quests vêm da lista de tarefas do Claude. Lê o TaskList (de graça, sem o
 * modelo) ao iniciar e no fim de cada turno: uma sessão retomada ou um mod
 * recarregado não perde as tarefas abertas. Só roda se o motor liberar sem perguntar.
 */
async function refreshTasks($: EngineInterface) {
  try {
    if (!(await $.tool.list()).some(t => t.name === 'TaskList')) return
    const check = await $.tool.check({ tool: 'TaskList' } as never)
    if ((check as { decision?: string }).decision !== 'allow') return
    readingTasks = true
    const ran = (await $.tool.call({ tool: 'TaskList' } as never)) as { result?: { tasks?: { id?: unknown; subject?: unknown; status?: unknown }[] } }
    const tasks = ran.result?.tasks ?? []
    // Lista vazia: as tarefas foram concluídas e apagadas. Saem as quests que vieram
    // dela; as do TodoWrite (id "todo-N") ficam, porque o TaskList não as conhece.
    if (tasks.length === 0) {
      await update($, quests, list => list.filter(q => q.id.startsWith('todo-')))
      return
    }
    await update($, quests, () =>
      tasks
        .filter(t => typeof t.id === 'string' && typeof t.subject === 'string')
        .map(t => ({
          id: String(t.id),
          title: String(t.subject),
          status: t.status === 'completed' || t.status === 'in_progress' ? t.status : ('pending' as const),
        })),
    )
  } catch {
    // Sem TaskList (versão antiga) ou sem permissão: as quests seguem pelo TaskCreate/TodoWrite.
  } finally {
    readingTasks = false
  }
}

/**
 * No Windows não há LANG: a língua do sistema vem do Get-Culture ("pt-BR").
 * Sem o PowerShell (Mac, Linux), devolve undefined e a língua sai do 1º pedido.
 */
async function windowsCulture($: EngineInterface): Promise<string | undefined> {
  try {
    const r = await $.process.run(['powershell', '-NoProfile', '-NonInteractive', '-Command', '(Get-Culture).Name'], { timeoutMs: 3000 })
    const name = r.stdout.trim()
    return r.exitCode === 0 && /^[a-z]{2}(-[A-Za-z]{2,})?$/.test(name) ? name : undefined
  } catch {
    return undefined
  }
}

/**
 * O que cabe no painel para o rodapé ficar preso no fim: a altura do palco e
 * quantos heróis e itens entram (o layoutOf do palco). Se nem o mínimo couber,
 * o painel solta o rodapé e rola inteiro.
 */
async function paneFit($: EngineInterface, bodyRows: number) {
  const c = await read($, campaign)
  const goalLong = c === null ? 0 : goalOf(c).length
  return layoutOf(bodyRows - (goalLong > 40 ? 1 : 0), {
    goal: c !== null,
    steps: (await read($, quests)).length,
    party: (await read($, party)).filter(m => m.status === 'run').length,
    items: (await read($, inventory)).items.length,
  })
}

/** A cena do palco: a ferramenta em curso e o diário do turno, ou o acampamento (com o Sábio, quando ele tem o que dizer). */
async function sceneNow($: EngineInterface) {
  const id = await read($, turnId)
  const entries = (await read($, diary)).filter(x => x.turnId === id)
  const scene = sceneOf(await read($, turn), await read($, working), entries, Date.now())
  if (scene.place !== 'acampamento') return scene
  const g = await grimOnStage($)
  const sage = scene.mode === 'wait' ? g.noted > 0 && notedDismissed !== id : scene.mode === 'sleep' ? g.saveNext !== undefined : false
  return { ...scene, sage }
}

/** O ◈ da faixa: abre o painel se estiver fechado, fecha se estiver aberto. */
async function togglePane($: EngineInterface) {
  // Fecha só o que está à vista: um painel atrás de outra aba, ou aberto sem lugar, é trazido para frente.
  const mine = (await $.ui.panes()).find(pane => pane.id === PANE)
  if (mine !== undefined && mine.isShown && mine.isPlaced) {
    await $.ui.close({ id: PANE })
    return
  }
  if (!(await moduleOn($, 'painel'))) await savePrefs($, x => ({ ...x, modules: { ...x.modules, painel: true } }))
  await refreshTheme($)
  // Como o /hero: enquanto os Primeiros passos não forem concluídos, abre neles.
  if ((await $.store.get('setupDone')) !== true) await update($, view, () => 'boasVindas' as const)
  await $.ui.open({ id: PANE, title: PANE_TITLE, focus: true })
}

async function renderPane($: EngineInterface, e: RenderInput<'Pane'>): Promise<RenderElement> {
  const ui = $.ui.resolve(e)
  const c: Ctx = { ...(await ctxOf($, e.surface, e.props.bodyColumns)), ui }
  const v = await read($, view)
  const p = await prefsNow($)
  const toMain = () => update($, view, () => 'main' as const)

  if (v === 'sobre') return aboutView(c, toMain)
  if (v === 'boasVindas') {
    const say = (msg: string | undefined) => update($, setup, s => ({ ...s, msg }))
    const saveVault = async (value: string) => {
      const folder = await checkedFolder($, value)
      if (folder === undefined) {
        await say(c.t.folderMissing(value))
        return
      }
      await say(undefined)
      await setVault($, folder)
    }
    return setupView(c, await read($, setup), langOption, await grimDests($), {
      lang: async value => {
        await $.config.set({ key: 'hero-journey.language', value })
      },
      path: saveVault,
      // O seletor do sistema cai no mesmo caminho do campo: a pasta é conferida antes de salvar.
      pickVault: async () => {
        const picked = await pickFolder($, c.t.pickVaultTitle, paths.vault)
        if (picked === null) await say(c.t.pickUnavailable)
        else if (picked !== undefined) await saveVault(picked)
      },
      done: async () => {
        await $.store.set('setupDone', true)
        await update($, view, () => 'main' as const)
      },
    })
  }
  if (v === 'config') {
    return configView(c, p, langOption, {
      back: toMain,
      lang: async value => {
        const t = DICT[await langNow($)]
        const r = await $.config.set({ key: 'hero-journey.language', value })
        $.ui.toast('deny' in r && r.deny !== undefined ? t.langDenied(r.deny) : t.langChanged)
      },
      skin: skin => savePrefs($, x => ({ ...x, skin })),
      module: async id => {
        await savePrefs($, x => toggleModule(x, id))
        // Desligar o painel no ⚙ fecha o painel aberto.
        if (id === 'painel' && !(await moduleOn($, 'painel'))) await $.ui.close({ id: PANE })
      },
      guard: mode => savePrefs($, x => ({ ...x, guardMode: mode })),
      haiku: () => savePrefs($, x => ({ ...x, grimorioHaiku: !x.grimorioHaiku })),
      setup: () => update($, view, () => 'boasVindas' as const),
      about: () => update($, view, () => 'sobre' as const),
      memory: () => update($, view, () => 'memoria' as const),
    })
  }
  if (v === 'memoria') {
    return memoryView(c, p, {
      dests: await liveDests($),
      progressLabel: await progressLabel($),
      act: {
        toggle: k => savePrefs($, x => toggleMemory(x, k)),
        home: where => chooseHome($, where),
        pickVault: () => changeVault($),
        testMemory: () => testMemory($),
        whatIs: async () => {
          await fillOrCopy($, AI_MEMORY_URL)
        },
        restore: async () => {
          await savePrefs($, x => ({ ...x, memory: DEFAULT_MEMORY }))
          await resuggest($)
        },
      },
    }, () => update($, view, () => 'config' as const), () => savePrefs($, x => ({ ...x, grimorioHaiku: !x.grimorioHaiku })))
  }
  const all = await read($, inscriptions)
  const shown = pending(all).filter(i => kindOn(i.kind, p.memory))
  if (v === 'grimorio' && isOn(p, 'grimorio')) {
    return grimPage(
      c,
      {
        pending: shown,
        sealed: all.filter(i => i.sealed !== undefined),
        dests: await grimDests($),
        memory: p.memory,
        progress: await read($, progress),
        progressLabel: await progressLabel($),
        remembered: await read($, remembered),
        autoNotes: autoNotes?.n,
      },
      {
        back: toMain,
        config: () => update($, view, () => 'memoria' as const),
        cycle: async id => {
          const d = await grimDests($)
          await update($, inscriptions, list => cycleDest(list, id, d))
        },
        seal: () => seal($),
        dismiss: () => discard($),
        chooseHome: where => chooseHome($, where),
        undoSeal: id => undoSeal($, id),
        undoProgress: () => undoProgress($),
        forget: path => forget($, path),
        openNotes: async () => {
          if (autoNotes !== undefined) await openFolder($, autoNotes.dir)
        },
        haiku: p.grimorioHaiku ? () => rewriteWithHaiku($) : undefined,
      },
    )
  }

  // O relógio de 1 minuto sobe o `tick`: ler aqui inscreve o painel; a contagem do reset anda e o acampamento adormece.
  await read($, tick)
  return mainView(
    c,
    {
      prefs: p,
      campaign: await read($, campaign),
      quests: await read($, quests),
      party: await read($, party),
      inventory: await read($, inventory),
      // Antes da primeira leitura guardada, uma leitura só para este desenho (quem desenha não grava estado).
      resources: (await read($, resources)) ?? (await $.session.usage().then(u => readingOf(u as unknown as UsageReading, null, false)).catch(() => null)),
      now: Date.now(),
      scene: await sceneNow($),
      fit: await paneFit($, e.props.scroll.bodyRows),
      pendingInscriptions: shown.length,
      grim: await grimOnStage($),
    },
    {
      compact: async () => {
        if (await moduleOn($, 'mochila')) await pushCard($, 'compactar')
        else $.ui.toast(c.t.off(c.t.module.mochila[0]))
      },
      recalibrate: () => recalibrateGoal($),
      grimoire: () => openGrimoire($),
      config: () => update($, view, () => 'config' as const),
      dismissNoted: async () => {
        notedDismissed = await read($, turnId)
        await update($, tick, n => n + 1)
      },
      saveProgress: async () => {
        await saveProgress($)
      },
      dismissSave: async () => {
        saveDismissedAt = Date.now()
        await update($, tick, n => n + 1)
      },
      continueTask: x => continueTask($, x),
      continueHow: async () => {
        await fillOrCopy($, AI_MEMORY_URL)
      },
    },
  )
}

/** O rodapé fixo das páginas do grimório e do ⚙: recursos, Grimório num canto e ⚙ no outro. */
async function pageFooter($: EngineInterface, c: Ctx) {
  const p = await prefsNow($)
  return footer(
    c,
    {
      prefs: p,
      resources: await read($, resources),
      now: Date.now(),
      pendingInscriptions: pending(await read($, inscriptions)).filter(i => kindOn(i.kind, p.memory)).length,
    },
    {
      compact: async () => {
        if (await moduleOn($, 'mochila')) await pushCard($, 'compactar')
      },
      grimoire: () => openGrimoire($),
      config: () => update($, view, () => 'config' as const),
    },
  )
}

/**
 * O grimório no palco: quantas coisas o Sábio anotou (o aviso do fim do turno),
 * o próximo passo para o aviso de antes de dormir (quando o progresso não foi
 * salvo desde o último turno) e o que dá para continuar.
 */
async function grimOnStage($: EngineInterface) {
  const p = await prefsNow($)
  const t = await read($, turn)
  const prog = await read($, progress)
  const camp = await read($, campaign)
  const unsaved = camp !== null && (prog.saved === undefined || (t.endedAt !== undefined && prog.saved.at < t.endedAt))
  const sleepy = p.memory.progresso && p.memory.avisoPalco && unsaved && (t.endedAt === undefined || saveDismissedAt < t.endedAt)
  return {
    noted: isOn(p, 'grimorio') && p.memory.avisoPalco ? pending(await read($, inscriptions)).filter(i => kindOn(i.kind, p.memory)).length : 0,
    saveNext: sleepy ? await nextStepNow($) : undefined,
    continueList: p.memory.progresso ? prog.list : [],
    continueHint: (await grimDests($)).memory === undefined,
  }
}


/**
 * Carrega o que a sessão mostra: a língua, as preferências, a campanha guardada
 * (numa sessão retomada), os recursos, o tema, o inventário e as tarefas. Roda no
 * início e de novo depois de /clear, /resume e /branch, que zeram o `$.state`
 * sem rodar o session.start outra vez.
 */
async function loadSession($: EngineInterface, restoreCampaign = true) {
  // Cada etapa falha sozinha, sem levar as outras junto.
  const settings = (await $.settings.read().catch(() => ({}))) as Record<string, unknown>
  const system =
    (await $.env.get('LC_ALL').catch(() => undefined)) ?? (await $.env.get('LANG').catch(() => undefined)) ?? (await windowsCulture($))
  // O átomo guarda sempre a resolução do `auto`; a língua fixada vence em `langNow`.
  // Assim, voltar de pt-BR para auto no ⚙ cai na língua certa sem esperar outro início.
  await update($, lang, () => resolveLang('auto', settings.language, system, undefined))
  langFromPrompt = settings.language === undefined && system === undefined

  const stored = await $.store.get('prefs').catch(() => undefined)
  await update($, prefs, () => migratePrefs(stored))

  // Uma sessão retomada recupera a campanha guardada; o $.store guarda só as 20 mais recentes.
  const id = await $.session.id().catch(() => '')
  const mine = id === '' ? undefined : ((await $.store.get(storeKey(id)).catch(() => undefined)) as Campaign | undefined)
  if (restoreCampaign && mine !== undefined && (await read($, campaign)) === null) await update($, campaign, () => mine)

  // Na primeira vez, o painel abre nos Primeiros passos (língua e vault).
  if ((await $.store.get('setupDone').catch(() => undefined)) !== true) await update($, view, () => 'boasVindas' as const)

  await readResources($, true, false)
  await refreshTheme($)
  await refreshInventory($)
  await refreshTasks($)
  await refreshProgress($)
}

export const register: Register = (on, options) => {
  langOption = typeof options.language === 'string' ? options.language : 'auto'
  isGuarded = makeGuard(listOption(options.protect), listOption(options.allow))
  paths = {
    vault: typeof options.vaultPath === 'string' ? options.vaultPath.trim() : '',
    inbox: typeof options.vaultInbox === 'string' && options.vaultInbox.trim() !== '' ? options.vaultInbox.trim() : 'Inbox',
  }

  // ---------- Sessão, comandos e tema ----------

  on('session.start', async ($, e, next) => {
    const ran = await next(e)
    interactive = e.isInteractive

    await $.command.register({ name: 'hero', description: 'Abre o Hero Journey / Opens Hero Journey' })
    await $.command.register({ name: 'grimorio', description: 'Abre o grimório / Opens the grimoire' })

    await loadSession($)
    const kept: { key: string; startedAt: number }[] = []
    for (const key of await $.store.keys()) {
      if (!key.startsWith('campanha:')) continue
      const c = (await $.store.get(key)) as Campaign | undefined
      kept.push({ key, startedAt: typeof c?.startedAt === 'number' ? c.startedAt : 0 })
    }
    for (const key of prune(kept)) await $.store.delete(key)

    // A contagem do reset anda: a cada minuto, se alguma janela tem reset pela
    // frente, o `tick` sobe e redesenha quem lê. Um relógio só, mesmo num reload.
    clock?.cancel()
    clock = $.clock.every(60_000, () => {
      void (async () => {
        const r = await read($, resources)
        const t = await read($, turn)
        // Parado há pouco, o acampamento ainda vai adormecer: o painel precisa redesenhar.
        const napping = !t.busy && t.endedAt !== undefined && Date.now() - t.endedAt <= NAP_MS + 60_000
        if (r?.windows.some(w => w.resetsAt !== undefined) === true || napping) await update($, tick, n => n + 1)
      })().catch(() => {})
    })
    // Aberto sem pedido, o painel só aparece em tela larga (144 colunas).
    if (await moduleOn($, 'painel')) await $.ui.open({ id: PANE, title: PANE_TITLE })
    return ran
  })

  on('command.run', { command: 'hero' }, async $ => {
    const t = DICT[await langNow($)]
    if (!(await moduleOn($, 'painel'))) await savePrefs($, x => ({ ...x, modules: { ...x.modules, painel: true } }))
    await refreshTheme($)
    // Enquanto os Primeiros passos não forem concluídos, o /hero abre neles (janela estreita incluída).
    const firstRun = (await $.store.get('setupDone')) !== true
    await update($, view, () => (firstRun ? ('boasVindas' as const) : ('main' as const)))
    const opened = await $.ui.open({ id: PANE, title: PANE_TITLE, focus: true })
    // Aberto, o painel fala por si: nenhuma linha no chat.
    return opened.isPlaced ? {} : { text: t.paneNotPlaced(String(opened.reason)) }
  })

  on('command.run', { command: 'grimorio' }, async $ => {
    const t = DICT[await langNow($)]
    if (!(await moduleOn($, 'grimorio'))) return { text: t.off(t.module.grimorio[0]) }
    if (!(await moduleOn($, 'painel'))) return { text: t.grimEmpty }
    await openGrimoire($)
    await $.ui.open({ id: PANE, title: PANE_TITLE, focus: true })
    return { text: `📖 ${t.grimTitle}` }
  })

  // /clear, /resume e /branch zeram o $.state e não rodam o session.start de novo:
  // sem isto, a HUD voltava para o inglês e para as preferências padrão.
  on('classic.SessionStart', { source: ['clear', 'resume', 'fork'] }, async ($, e, next) => {
    const ran = await next(e)
    bagWarned = false
    // Depois de um /clear a conversa é nova: a campanha antiga não volta. /resume e /branch a recuperam.
    await loadSession($, (e as { source?: string }).source !== 'clear')
    return ran
  }).catch(($, e, next) => next(e))

  // Um /compact (também o automático) esvazia a mochila sem fim de turno: lê de novo.
  on('session.compact', async ($, e, next) => {
    const ran = await next(e)
    // O `precompute` só prepara um resumo para depois: nada foi compactado ainda.
    // A leitura nova tira o cartão de compactar quando a mochila esvazia (takeReading).
    const main = (e as { agentId?: string }).agentId === undefined && e.trigger !== 'precompute'
    if (main && 'messages' in (ran as object)) await readResources($, true, false)
    return ran
  }).catch(($, e, next) => next(e))

  // O título que o app deu à sessão ("Claude HUD RPG handoff") é o melhor objetivo curto.
  on('classic.UserPromptSubmit', async ($, e, next) => {
    const ran = await next(e)
    const title = (e as { session_title?: string; source?: string }).session_title?.trim()
    const c = await read($, campaign)
    const source = (e as { source?: string }).source
    // Só de mensagem da pessoa, e sem apagar o objetivo que ela recalibrou com o Haiku.
    if (source !== undefined && source !== 'user') return ran
    if (c !== null && title !== undefined && title !== '' && c.short !== title && c.shortFrom !== 'haiku') await saveCampaign($, { ...c, short: title, shortFrom: 'app' })
    return ran
  }).catch(($, e, next) => next(e))

  on('config.set', { key: 'theme' }, async ($, e, next) => {
    const ran = await next(e)
    await refreshTheme($)
    $.ui.invalidate('ui.render')
    return ran
  }).catch(($, e, next) => next(e))

  // ---------- Campanha: mensagens e turnos ----------

  on('prompt.submit', async ($, e, next) => {
    const text = e.text.trim()
    // Aviso de subagente, gatilho agendado ou outra sessão não abre capítulo nem vira objetivo.
    const kind = (e as { origin?: { kind?: string } }).origin?.kind
    const fromPerson = kind === undefined || kind === 'composer' || kind === 'bridge'
    if (fromPerson && text !== '' && !text.startsWith('/')) {
      if (langFromPrompt) {
        langFromPrompt = false
        await update($, lang, () => (looksPortuguese(text) ? 'pt' : 'en'))
      }
      await saveCampaign($, onPrompt(await read($, campaign), await $.session.id(), text, Date.now()))
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    const ran = await next(e)
    await update($, turnId, () => ran.turnId)
    await update($, turn, t => ({ ...t, busy: true }))
    turnPrompts.set(ran.turnId, e.text)
    if (turnPrompts.size > 50) turnPrompts.delete(turnPrompts.keys().next().value ?? '')
    const c = await read($, campaign)
    if (c !== null) {
      const linked = assignTurn(c, ran.turnId, e.text)
      if (linked !== c) await saveCampaign($, linked)
    }
    return ran
  })

  // ---------- Grupo: subagentes (padrão do agent-flow) ----------

  on('agent.spawn', async ($, e, next) => {
    const r = await next(e)
    if ('agentId' in r && typeof r.agentId === 'string') {
      const agentId = r.agentId
      await update($, party, list =>
        upsertMember(list, {
          id: e.tool_use_id,
          cls: agentClass(e.subagentType, e.description),
          description: e.description,
          type: e.subagentType,
          status: 'run',
          agentId,
        }),
      )
    }
    return r
  }).catch(($, e, next) => next(e))

  // ---------- Diário, faixa, quests e inventário: toda chamada de ferramenta ----------

  on('tool.call', async ($, e, next) => {
    // A leitura do TaskList que o próprio mod faz não é ação do Claude: nem diário, nem faixa.
    if (readingTasks && e.tool === 'TaskList') return next(e)
    const input = e as unknown as Record<string, unknown>
    const isMain = e.agentId === undefined
    const cls = classOf(e.tool, input)
    const summary = summaryOf(e.tool, input)
    const id = e.tool_use_id ?? `${e.tool}-${Date.now()}`

    if (isMain) {
      const file = typeof input.file_path === 'string' ? input.file_path : typeof input.notebook_path === 'string' ? input.notebook_path : undefined
      await update($, working, () => ({ tool: e.tool, cls, summary, file }))
      const turn = await read($, turnId)
      const entry: DiaryEntry = { id, tool: e.tool, cls, summary, turnId: turn, status: 'run', at: Date.now(), ...(delivers(e.tool, input) ? { delivers: true } : {}) }
      await update($, diary, list => [...list, entry].slice(-300))
    }
    if (e.tool === 'TodoWrite') {
      const fromTodos = questsFromTodos(input.todos)
      if (fromTodos !== undefined) await update($, quests, () => fromTodos)
    }
    if (AGENT.test(e.tool)) {
      const description = String(input.description ?? '')
      const type = String(input.subagent_type ?? 'general-purpose')
      await update($, party, list => {
        const known = list.find(m => m.id === id)
        return upsertMember(list, { ...(known ?? {}), id, cls: agentClass(type, description), description, type, status: 'run' })
      })
    }

    const started = Date.now()
    const ran = await next(e)
    const failed = ran.deny !== undefined || ran.isError === true
    const result = (ran.deny === undefined ? ran.result : undefined) as Record<string, unknown> | undefined

    if (isMain) {
      const stats = patchStats(result?.structuredPatch)
      await update($, diary, list =>
        list.map(entry =>
          entry.id === id
            ? {
                ...entry,
                status: failed ? ('err' as const) : ('ok' as const),
                ms: Date.now() - started,
                isNew: result?.type === 'create' ? true : undefined,
                ...(stats === undefined ? {} : stats),
              }
            : entry,
        ),
      )
    }
    if (e.tool === 'TaskCreate' && !failed) {
      const task = (result?.task ?? {}) as { id?: unknown; subject?: unknown }
      if (typeof task.id === 'string') {
        const taskId = task.id
        const subject = typeof task.subject === 'string' ? task.subject : String(input.subject ?? '')
        await update($, quests, list => [...list.filter(q => q.id !== taskId), { id: taskId, title: subject, status: 'pending' as const }])
      }
    }
    if (e.tool === 'TaskUpdate' && !failed && result?.success !== false) {
      const taskId = String(input.taskId ?? '')
      const status = input.status
      await update($, quests, list =>
        status === 'deleted'
          ? list.filter(q => q.id !== taskId)
          : list.map(q =>
              q.id === taskId
                ? {
                    ...q,
                    title: typeof input.subject === 'string' ? input.subject : q.title,
                    status: status === 'completed' || status === 'in_progress' || status === 'pending' ? status : q.status,
                  }
                : q,
            ),
      )
    }
    if (AGENT.test(e.tool)) {
      const agentId = typeof result?.agentId === 'string' ? result.agentId : undefined
      const background = input.run_in_background === true && !failed
      await update($, party, list =>
        list.map((m): Member => (m.id === id ? { ...m, agentId: agentId ?? m.agentId, status: failed ? 'err' : background ? 'run' : 'ok' } : m)),
      )
    }
    // Só depois de uma escrita que deu certo; o resto (Bash incluído) espera o fim do turno.
    if (isMain && !failed && WRITES.test(e.tool)) await refreshInventory($)
    return ran
  }).catch(($, e, next) => next(e))

  // ---------- Guarda dos protegidos (protected-paths-guard + large-edit-confirmation) ----------

  on('tool.call', { tool: ['Edit', 'Write', 'NotebookEdit'] }, async ($, e, next) => {
    if (!(await moduleOn($, 'guarda'))) return next(e)
    const input = e as unknown as Record<string, unknown>
    const path = String(input.file_path ?? input.notebook_path ?? '')
    if (!isGuarded(path)) return next(e)
    const file = diffOf(path, { old_string: input.old_string, new_string: input.new_string ?? input.new_source, content: input.content })
    const denied = await guardCall($, e.tool, e.tool_use_id ?? '', [file])
    return denied ?? next(e)
  }).catch(async ($, e, next) => {
    // A edição já rodou depois de aprovada: devolve o resultado (sem rodar de novo).
    if (next.called) {
      try {
        return await next(e)
      } catch {
        return { deny: `${DICT.pt.denyFailed} / ${DICT.en.denyFailed}` }
      }
    }
    // Uma checagem que falhou nunca deixa a edição passar (falha fechada).
    return { deny: `${DICT.pt.denyFailed} / ${DICT.en.denyFailed}` }
  })

  // Comandos de terminal que escreveriam um protegido (echo >> .env, sed -i, rm, Set-Content...).
  on('tool.call', { tool: /^(Bash|PowerShell)$/ }, async ($, e, next) => {
    if (!(await moduleOn($, 'guarda'))) return next(e)
    const command = String((e as unknown as Record<string, unknown>).command ?? '')
    const targets = shellTargets(command, isGuarded)
    if (targets.length === 0) return next(e)
    const files: GuardFile[] = targets.map(path => {
      const name = path.split(/[\\/]/).pop() ?? path
      return { name, path, added: 0, removed: 0, diff: `--- a/${name}\n+++ b/${name}\n@@ -0,0 +1,1 @@\n+$ ${command.slice(0, 400)}` }
    })
    const denied = await guardCall($, e.tool, e.tool_use_id ?? '', files)
    return denied ?? next(e)
  }).catch(async ($, e, next) => {
    if (next.called) {
      try {
        return await next(e)
      } catch {
        return { deny: `${DICT.pt.denyFailed} / ${DICT.en.denyFailed}` }
      }
    }
    return { deny: `${DICT.pt.denyFailed} / ${DICT.en.denyFailed}` }
  })

  // ---------- Fim do turno: capítulo, recibo, recursos e grimório ----------

  on('turn.complete', async ($, e, next) => {
    const ran = await next(e)
    if (e.agentId !== undefined) {
      const agentId = e.agentId
      await update($, party, list => list.map((m): Member => (m.agentId === agentId ? { ...m, status: e.reason === 'answer' ? 'ok' : 'err' } : m)))
      return ran
    }
    await update($, working, () => null)
    await update($, turn, () => ({ busy: false, endedAt: Date.now() }))
    await refreshInventory($)
    await refreshTasks($)
    // A leitura do fim do turno entra no histórico do peso da mochila.
    await readResources($, true, true)
    const p = await prefsNow($)
    const l = await langNow($)
    const answer = e.answer ?? ''
    const said = turnPrompts.get(e.turnId) ?? ''

    // O que o turno fez, do diário dele. Fecha o capítulo deste turno (casado pelo
    // turnId): uma mensagem digitada no meio do turno não rouba o fechamento, e um
    // turno de continuação não reabre um capítulo fechado; ele só ganha o recibo.
    const entries = (await read($, diary)).filter(x => x.turnId === e.turnId)
    const refused = (await read($, refusals)).filter(x => x.turnId === e.turnId).map(x => x.text)
    const c = await read($, campaign)
    const ch = chapterOf(c, e.turnId)
    const report = buildReport(ch ?? { n: 0, prompt: '' }, entries, answer, e.durationMs, e.reason, refused)
    if (c !== null && ch !== undefined && ch.report === undefined) {
      const closed0 = closeChapter(c, report)
      // Sem título da sessão, a Missão da 1ª resposta vira o objetivo curto.
      const closed = closed0.short === undefined && ch.n === 1 && report.mission !== undefined ? { ...closed0, short: report.mission, shortFrom: 'missao' as const } : closed0
      await saveCampaign($, closed)
    }
    await update($, refusals, list => list.filter(x => x.turnId !== e.turnId))
    const lead = leadOf(entries)
    // Só onde algo desenha: num `claude -p` (sem superfície) o texto do turno é a resposta e fica intacto.
    // Não usa o `isInteractive`: ele é falso também no app desktop, que hospeda a sessão pelo SDK.
    const drawn = (await $.session.surfaces().catch(() => [])).length > 0
    const receipt = isOn(p, 'recibo') && drawn ? receiptOf(report, lead === undefined ? undefined : DICT[l].className[lead], l) : undefined

    // O grimório só sugere: junta em silêncio (o 📖 conta), o Sábio avisa no palco e, no fim de um marco, o cartão pergunta.
    if (isOn(p, 'grimorio') && e.reason === 'answer') {
      const dests = await grimDests($)
      const fresh = detect(answer, said, e.turnId)
        .filter(i => kindOn(i.kind, p.memory))
        .map((i): Inscription => {
          const s = suggest(i.kind, dests, p.memory.decisoesEm)
          return { ...i, destinations: s === undefined ? [] : [s] }
        })
      if (fresh.length > 0) await update($, inscriptions, list => merge(list, fresh))
      // Marco: o plano fechou agora (2 tarefas ou mais, todas feitas) ou o turno entregou um commit, push ou PR.
      const plan = await read($, quests)
      const planDone = plan.length >= 2 && plan.every(q => q.status === 'completed')
      const planKey = `${c?.id ?? ''}:${plan.length}`
      const delivered = entries.some(x => x.delivers === true && x.status === 'ok')
      const milestone = (planDone && planCelebrated !== planKey) || delivered
      if (planDone) planCelebrated = planKey
      const waiting = pending(await read($, inscriptions)).filter(i => kindOn(i.kind, p.memory))
      if (milestone && p.memory.avisoMarco && waiting.length > 0) {
        marcoInfo = { name: c === null ? '' : goalOf(c), sub: planDone ? DICT[l].marcoPlan(plan.length, plan.length) : DICT[l].marcoCommit }
        await pushCard($, 'marco')
      }
    }
    $.ui.invalidate('ui.render')
    // O recibo: um texto diferente da resposta aparece embaixo dela, no chat.
    return receipt === undefined ? ran : { ...ran, text: receipt }
  })

  // ---------- Recursos: a mochila enche, a mana e o vigor baixam ----------

  // A cada resposta o motor mede de novo; o detalhamento (o ponto de compactação)
  // fica o da última leitura do fim do turno.
  on('session.measure', async ($, e, next) => {
    const ran = await next(e)
    await takeReading($, { context: e.context, rateLimits: e.rateLimits }, false)
    return ran
  }).catch(($, e, next) => next(e))

  // ---------- Desenho ----------

  // O painel usa o fundo do tema da pessoa. Na tela principal ele ocupa a altura
  // toda, para os recursos ficarem presos no fim.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const body = await renderPane($, e)
    if (e.surface !== 'desktop') return body
    const { Box } = $.ui.resolve(e)
    // A tela principal (ou a que cai nela com o módulo desligado) ocupa a altura toda.
    const v = await read($, view)
    const p = await prefsNow($)
    const main = v === 'main' || (v === 'grimorio' && !isOn(p, 'grimorio'))
    // O motor não tem rolagem dentro do painel: o meio corta heróis e itens para
    // caber, e o rodapé (recursos, Grimório num canto e ⚙ no outro) fica sempre preso no fim.
    // No grimório e no ⚙ também; o Sobre e os Primeiros passos rolam inteiros.
    const page = v === 'config' || v === 'memoria' || (v === 'grimorio' && isOn(p, 'grimorio'))
    if (page) {
      const c: Ctx = { ...(await ctxOf($, e.surface, e.props.bodyColumns)), ui: $.ui.resolve(e) }
      return (
        <Box flexDirection="column" paddingX={1} height={e.props.scroll.bodyRows}>
          <Box key="page-body" flexDirection="column" flexGrow={1} flexShrink={1} overflow="hidden">
            {body}
          </Box>
          {await pageFooter($, c)}
        </Box>
      )
    }
    return (
      <Box flexDirection="column" paddingX={1} height={main ? e.props.scroll.bodyRows : undefined}>
        {body}
      </Box>
    )
  })

  // Faixa e cartões acima do prompt: uma instância só, compartilhada.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const p = await prefsNow($)
    const now = await read($, working)
    const queue = (await read($, cards)).filter(card => (card === 'marco' ? isOn(p, 'grimorio') && p.memory.avisoMarco : isOn(p, 'mochila')))
    const camp = await read($, campaign)
    // A faixa fica enquanto houver campanha (o objetivo em miniatura); o pet age só durante o turno.
    const away = (await read($, party)).filter(m => m.status === 'run')
    // O selo de recurso só aparece em alerta: a mochila transbordando ou a mana/vigor no fim.
    const alert = alertOf(await read($, resources), Date.now())
    const showBand = isOn(p, 'faixa') && ((e.props.isWorking && now !== null) || camp !== null || away.length > 0 || alert !== undefined)
    const card = queue[0]
    if (!showBand && card === undefined) return next(e)

    const ui = $.ui.resolve(e)
    const c: Ctx = { ...(await ctxOf($, e.surface, e.props.bodyColumns)), ui }
    const { Box } = ui
    const below = await next(e)

    let cardTree: RenderElement | null = null
    if (card === 'compactar') {
      const r = await read($, resources)
      const bag = r === null ? undefined : bagOf(r)
      const instruction = compactInstruction(await langNow($), camp, await read($, quests))
      const offer = camp !== null && p.memory.progresso && p.memory.avisoCompactar && isOn(p, 'grimorio')
      // Só compactar: agora, com o Claude parado; trabalhando, leva o /compact ao prompt.
      const only = async () => {
        if (e.props.isWorking) {
          if (await fillOrCopy($, `/compact ${instruction}`)) await dropCard($, 'compactar')
        } else await compactNow($)
      }
      cardTree = compactCard(
        c,
        bag?.percent === undefined ? `${COMPACT_AT}%+` : `${bag.percent}%`,
        offer ? { task: goalOf(camp), next: await nextStepNow($), dest: await progressLabel($), onVerify: v => (verifyDraft = v) } : undefined,
        {
          only,
          both: async () => {
            if (await saveProgress($)) await only()
          },
          dismiss: () => dropCard($, 'compactar'),
        },
      )
    } else if (card === 'marco') {
      const waiting = pending(await read($, inscriptions)).filter(i => kindOn(i.kind, p.memory))
      cardTree = marcoCard(c, marcoInfo.name, marcoInfo.sub, waiting, await grimDests($), {
        cycle: async id => {
          const d = await grimDests($)
          await update($, inscriptions, list => cycleDest(list, id, d))
        },
        seal: () => seal($),
        dismiss: () => dropCard($, 'marco'),
        chooseHome: where => chooseHome($, where),
      })
    }

    return (
      <Box flexDirection="column" gap={1}>
        {showBand &&
          bandView(
            c,
            e.props.isWorking ? now : null,
            await read($, quests),
            () => togglePane($),
            away,
            alert === undefined ? undefined : c.t.bandAlert[alert.kind](alert.percent),
            (await sceneNow($)).mode === 'fail',
          )}
        {cardTree}
        {below}
      </Box>
    )
  })

  // O spinner do turno diz quem age: "Mago lendo art.ts", "Aprendiz pensando". Vai com a faixa.
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (!(await moduleOn($, 'faixa'))) return next(e)
    const t = DICT[await langNow($)]
    const now = await read($, working)
    const text =
      e.props.mode === 'thinking'
        ? `${t.className.aprendiz} ${t.classVerb.aprendiz}`
        : e.props.mode === 'responding'
          ? `${t.className.aprendiz} ${t.spinResponding}`
          : e.props.mode === 'tool-use' && now !== null
            ? `${t.className[now.cls]} ${t.classVerb[now.cls]} ${now.file === undefined ? now.summary : baseName(now.file)}`.trim()
            : undefined
    if (text === undefined) return next(e)
    return next({ ...e, props: { ...e.props, message: text.length > 80 ? `${text.slice(0, 79)}…` : text } })
  }).catch(($, e, next) => next(e))

  // Diário de bordo: o Clawd da classe e o resultado em cada linha, durante o turno.
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.surface !== 'desktop') return next(e)
    const p = await prefsNow($)
    if (!isOn(p, 'diario')) return next(e)

    const list = await read($, diary)
    const ui = $.ui.resolve(e)
    const c: Ctx = { ...(await ctxOf($, e.surface, e.viewport?.columns ?? 80)), ui }
    const row = await next(e)
    const entry = list.find(x => x.id === e.props.tool_use_id)
    const input = (e.props.input ?? {}) as Record<string, unknown>
    const status = e.props.isRunning ? 'run' : e.props.isErrored || e.props.isInterrupted ? 'err' : 'ok'
    return rowView(c, entry ?? { cls: classOf(e.props.tool, input), status, summary: summaryOf(e.props.tool, input) }, row)
  })

  // Guarda: o Paladino com o arquivo e a mudança acima do diálogo do Claude,
  // e a descrição de cada opção, que a ferramenta aceita e o `$.ui.ask` não passa.
  on('ui.render', { component: 'AskUserQuestion' }, async ($, e, next) => {
    const files = await read($, guard)
    if (files.length === 0) return next(e)
    const l = await langNow($)
    const labels = LABELS[l]
    const hints = DICT[l].guardHints
    const questions = e.props.questions.map(q => {
      const opts = (q as { options?: { label: string }[] }).options
      return opts === undefined
        ? q
        : { ...(q as object), options: opts.map(o => ({ ...o, description: hints[labels.indexOf(o.label)] ?? '' })) }
    })
    const dialog = await next({ ...e, props: { ...e.props, questions } })

    const ui = $.ui.resolve(e)
    const c: Ctx = { ...(await ctxOf($, e.surface, e.viewport?.columns ?? 80)), ui }
    const { Box } = ui
    return (
      <Box flexDirection="column" gap={1}>
        {guardView(c, files)}
        {dialog}
      </Box>
    )
  })
}
