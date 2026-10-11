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

import type { Campaign, Card, DiaryEntry, Destination, GuardFile, Inscription, Lang, Member, ModuleId, Palette, Prefs } from '../types'
import { agentClass, classOf, patchStats, summaryOf } from './core/classes'
import { TONE } from './core/art'
import { DICT, looksPortuguese, resolveLang } from './core/i18n'
import { isWindows, joinPath, openArgv, pickArgvs, pickedOf, subfolderOf } from './core/pasta'
import { DEFAULT_PREFS, isOn, migratePrefs, toggleModule } from './core/prefs'
import type { Ctx } from './core/ui'
import { assignTurn, buildReport, chapterOf, closeChapter, cutAtWord, goalOf, onPrompt, prune, storeKey } from './modules/campanha/campanha'
import { rowView } from './modules/diario/view'
import { bandView } from './modules/faixa/view'
import { appendDecision, available, detect, haikuPrompt, isSubfolder, memoryTool, merge, pending, toggleDest, withSuffix, writesFor } from './modules/grimorio/grimorio'
import type { Dests, Memory, Write } from './modules/grimorio/grimorio'
import { grimCard, grimPage } from './modules/grimorio/view'
import { diffOf, LABELS, listOption, makeGuard, shellTargets, verdictOf } from './modules/guarda/guarda'
import { bossView, guardLineView } from './modules/guarda/view'
import { COMPACT_AT, compactInstruction, shouldWarn } from './modules/mochila/mochila'
import { alertOf, bagOf, countdown, readingOf, short, warningsOf } from './modules/mochila/recursos'
import type { UsageReading } from './modules/mochila/recursos'
import { compactCard } from './modules/mochila/view'
import { EMPTY_INVENTORY, LOG_ARGV, NUMSTAT_ARGV, parseInventory, parseLog, questsFromTodos, questView, STATUS_ARGV, upsertMember } from './modules/painel/painel'
import { setupView } from './modules/painel/primeiros-passos'
import { aboutView, configView, mainView } from './modules/painel/view'
import { leadOf, receiptOf } from './modules/recibo/recibo'

const PANE = 'hero-journey'
const PANE_TITLE = 'Hero Journey'
// `Task` é o nome antigo da ferramenta Agent.
const AGENT = /^(Agent|Task)$/
const WRITES = /^(Edit|Write|NotebookEdit)$/
const CARD_ORDER: readonly Card[] = ['grimorio', 'compactar']

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
const partyTab = atom({ plugin: 'hero-journey', key: 'partyTab' } as const, 'grupo')
const campaign = atom({ plugin: 'hero-journey', key: 'campaign' } as const, null)
const guard = atom({ plugin: 'hero-journey', key: 'guard' } as const, [])
const refusals = atom({ plugin: 'hero-journey', key: 'refusals' } as const, [])
const inscriptions = atom({ plugin: 'hero-journey', key: 'inscriptions' } as const, [])
const intent = atom({ plugin: 'hero-journey', key: 'intent' } as const, '')
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
  const next = readingOf(u, await read($, resources), turnEnded)
  await update($, resources, () => next)
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

/** Grava uma inscrição num destino. Nota nova nunca sobrescreve outra: ganha -2, -3… */
async function writeOne($: EngineInterface, w: Write, memory: Memory | undefined, used: Set<string>, heading: string) {
  if (w.dest === 'aiMemory') {
    let p = w.path
    for (let n = 2; used.has(p); n++) p = withSuffix(w.path, n)
    used.add(p)
    const r = await $.mcp.call(memory!.server, 'memory_write_page', { path: p, body: w.text, ...(w.scope ? { scope: w.scope } : {}) })
    if (r.isError) throw new Error(r.content.map(c => ('text' in c ? String(c.text) : '')).join(' ').slice(0, 200))
    return
  }
  if (w.append) {
    const current = (await $.fs.exists(w.path)) ? await $.fs.read(w.path) : ''
    await $.fs.write(w.path, appendDecision(current, w.text, heading))
    return
  }
  // ponytail: exists→write não é atômico; duas sessões selando no mesmo instante podem colidir.
  let p = w.path
  for (let n = 2; used.has(p) || (await $.fs.exists(p)); n++) p = withSuffix(w.path, n)
  used.add(p)
  await $.fs.write(p, w.text)
}

/**
 * Grava as inscrições pendentes nos destinos marcados. Nada sai daqui sem o
 * clique em Selar. Uma inscrição só sai da lista quando todos os destinos
 * marcados gravaram. Se só parte gravou, ela continua pendente só com os que
 * faltam (indisponíveis ou com falha), para o próximo Selar tentar de novo.
 */
async function seal($: EngineInterface) {
  // Dois cliques seguidos não gravam duas vezes.
  if (sealing) return
  sealing = true
  try {
    const t = DICT[await langNow($)]
    // Inscrição sem nenhum destino marcado fica onde está, sem aviso de falha: não havia o que gravar.
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
    const sealed: Record<string, Destination[]> = {}
    const left: Record<string, Destination[]> = {}
    for (const i of list) {
      const writes = writesFor(i, { repo, ...dests }, Date.now())
      const wantsRepo = i.destinations.some(d => d === 'claudeMd' || d === 'agentsMd')
      if (wantsRepo && !writes.some(w => w.dest === 'claudeMd' || w.dest === 'agentsMd')) $.ui.toast(t.privacyBlocked)
      const ok: Destination[] = []
      const failed: Destination[] = []
      for (const w of writes) {
        try {
          await writeOne($, w, dests.memory, used, t.decisionsHeading)
          ok.push(w.dest)
        } catch (err) {
          failed.push(w.dest)
          missed.push(`${t.dest[w.dest]}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      // O que ficou por gravar: o que falhou e o destino marcado que agora está sem pasta ou sem MCP.
      // Tudo o que está marcado foi visto pela pessoa (a sugestão nasce só com o disponível).
      // O que a regra de privacidade barrou não volta: o aviso já disse por quê.
      const rest = [...failed, ...i.destinations.filter(d => !available(d, dests))]
      if (ok.length > 0 && rest.length === 0) sealed[i.id] = ok
      else if (ok.length > 0) left[i.id] = rest
    }
    const done = Object.keys(sealed).length
    if (done > 0) $.ui.toast(t.sealed(done))
    if (done < list.length || missed.length > 0) $.ui.toast(t.notSealed(list.length - done, missed.join('; ')))
    await update($, inscriptions, all =>
      all.map((i): Inscription => {
        const ok = sealed[i.id]
        const rest = left[i.id]
        return ok !== undefined ? { ...i, sealed: ok } : rest !== undefined ? { ...i, destinations: rest } : i
      }),
    )
    if (pending(await read($, inscriptions)).length === 0) await dropCard($, 'grimorio')
  } finally {
    sealing = false
  }
}

async function discard($: EngineInterface) {
  await update($, inscriptions, all => all.filter(i => i.sealed !== undefined))
  await dropCard($, 'grimorio')
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

/** O guarda nos modos diálogo e chefe: põe os arquivos no estado, pergunta e limpa. */
async function askGuard($: EngineInterface, files: GuardFile[], mode: 'dialogo' | 'chefe') {
  const l = await langNow($)
  const t = DICT[l]
  const labels = LABELS[l][mode]
  const names = files.map(f => f.name).join(', ')
  await update($, guard, () => files)
  try {
    const answer = await $.ui.ask(mode === 'chefe' ? t.bossQuestion(names) : t.guardQuestion(names), {
      header: mode === 'chefe' ? t.bossHeader : t.guardHeader,
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
  const verdict = await askGuard($, files, mode)
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

/** Onde o grimório deixa as decisões: a pasta de entrada do vault, ou o próprio vault se ela não existir. */
async function openDecisions($: EngineInterface) {
  if (paths.vault === '') return
  const inbox = joinPath(paths.vault, paths.inbox)
  const stat = await $.fs.stat(inbox).catch(() => undefined)
  await openFolder($, stat?.kind === 'dir' ? inbox : paths.vault)
}

/** O 📖 do rodapé e o /grimorio: com inscrições pendentes, o cartão do Mago sobe acima do prompt. */
async function callMage($: EngineInterface) {
  if (pending(await read($, inscriptions)).length === 0) return false
  await pushCard($, 'grimorio')
  return true
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

/** Linhas do painel por px de Svg (o desktop desenha uma linha de texto em ~19 px). */
const PX_PER_ROW = 19
const rowsOf = (px: number) => Math.ceil(px / PX_PER_ROW)

/**
 * O que cabe no painel para o rodapé ficar preso no fim: as linhas fixas
 * (objetivo, quests, títulos, rodapé) e quantos cartões do grupo e itens do
 * inventário cabem no que sobra. Estimativa pela altura conhecida de cada arte;
 * se nem o mínimo couber, o painel solta o rodapé e rola inteiro.
 */
async function paneFit($: EngineInterface, cols: number, bodyRows: number) {
  const c = await read($, campaign)
  const list = await read($, quests)
  const q = questView(list)
  const chapters = c?.chapters ?? []
  const width = Math.max(10, cols - 2)
  const goal = c === null ? 1 : Math.ceil(goalOf(c).length / width)
  const objective = 1 + goal + (c === null ? 0 : rowsOf(36) + 2)
  const questsPx =
    list.length > 0
      ? (q.done.length > 0 ? 28 : 0) + (q.current ? 48 : 0) + q.next.length * 24 + (q.mist > 0 ? 18 : 0)
      : chapters.length === 0
        ? PX_PER_ROW
        : (chapters.some(ch => ch.report !== undefined) ? 28 : 0) + (chapters.some(ch => ch.report === undefined) ? 48 : 0)
  const footer = rowsOf(3 * 18) + 2
  // Os títulos de cada bloco, a linha das abas e o espaço de uma linha entre os quatro blocos.
  const fixed = objective + 1 + rowsOf(questsPx) + 2 + footer + 3
  const room = (bodyRows - fixed) * PX_PER_ROW
  const joined = (await read($, prefs)).partyJoined
  const share = joined ? room : room / 2
  // Inventário: a linha do branch e a da raridade, e 24 px por item.
  const maxItems = Math.max(0, Math.min(8, Math.floor((share - 2 * PX_PER_ROW) / 24)))
  // Grupo: o Clawd sempre, a fileira dos que voltaram e o "+N"; 62 px por cartão em ação.
  const maxCards = Math.max(0, Math.min(3, Math.floor((share - 62 - 30 - PX_PER_ROW) / 62)))
  const pinned = share >= (joined && (await read($, partyTab)) === 'inventario' ? 3 * PX_PER_ROW + 24 : 62)
  return { pinned, maxItems: Math.max(1, maxItems), maxCards }
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
      await $.config.set({ key: 'hero-journey.vaultPath', value: folder })
    }
    // A pasta de entrada é uma subpasta do vault que já existe. Vazia, volta ao padrão (Inbox).
    const saveInbox = async (value: string) => {
      const sub = value.trim().replace(/^"|"$/g, '')
      if (!isSubfolder(sub)) {
        await say(c.t.inboxInvalid(sub))
        return
      }
      // A barra do próprio vault: no Windows, C:\\Vault\\Inbox, sem misturar com /.
      const inboxPath = joinPath(paths.vault, sub)
      if (sub !== '' && (await checkedFolder($, inboxPath)) === undefined) {
        await say(c.t.folderMissing(inboxPath))
        return
      }
      await say(undefined)
      await $.config.set({ key: 'hero-journey.vaultInbox', value: sub })
    }
    return setupView(c, await read($, setup), langOption, await grimDests($), {
      lang: async value => {
        await $.config.set({ key: 'hero-journey.language', value })
      },
      answer: async yes => {
        await update($, setup, s => ({ ...s, vault: yes ? ('sim' as const) : ('nao' as const), msg: undefined }))
        if (!yes) await $.config.set({ key: 'hero-journey.vaultPath', value: '' })
      },
      path: saveVault,
      inbox: saveInbox,
      // O seletor do sistema cai no mesmo caminho do campo: a pasta é conferida antes de salvar.
      pickVault: async () => {
        const picked = await pickFolder($, c.t.pickVaultTitle, paths.vault)
        if (picked === null) await say(c.t.pickUnavailable)
        else if (picked !== undefined) await saveVault(picked)
      },
      pickInbox: async () => {
        const picked = await pickFolder($, c.t.pickInboxTitle, joinPath(paths.vault, paths.inbox))
        if (picked === null) {
          await say(c.t.pickUnavailable)
          return
        }
        if (picked === undefined) return
        const sub = subfolderOf(paths.vault, picked)
        if (sub === undefined) await say(c.t.pickOutside(picked))
        else await saveInbox(sub)
      },
      openDecisions: () => openDecisions($),
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
      compact: async () => {
        if (await moduleOn($, 'mochila')) await pushCard($, 'compactar')
      },
    })
  }
  const all = await read($, inscriptions)
  const grimActions = {
    toggle: (id: string, dest: Destination) => update($, inscriptions, list => toggleDest(list, id, dest)),
    seal: () => seal($),
    discard: () => discard($),
    haiku: p.grimorioHaiku ? () => rewriteWithHaiku($) : undefined,
    openDecisions: () => openDecisions($),
  }
  if (v === 'grimorio' && isOn(p, 'grimorio')) {
    return grimPage(c, pending(all), all.filter(i => i.sealed !== undefined), await grimDests($), toMain, grimActions)
  }

  // O relógio de 1 minuto sobe o `tick`: ler aqui inscreve o painel e a contagem do reset anda.
  await read($, tick)
  return mainView(
    c,
    {
      prefs: p,
      campaign: await read($, campaign),
      quests: await read($, quests),
      party: await read($, party),
      inventory: await read($, inventory),
      partyTab: await read($, partyTab),
      // Antes da primeira leitura guardada, uma leitura só para este desenho (quem desenha não grava estado).
      resources: (await read($, resources)) ?? (await $.session.usage().then(u => readingOf(u as unknown as UsageReading, null, false)).catch(() => null)),
      now: Date.now(),
      fit: await paneFit($, e.props.bodyColumns, e.props.scroll.bodyRows),
      working: await read($, working),
      pendingInscriptions: pending(all).length,
    },
    {
      tab: tab => update($, partyTab, () => tab),
      joinParty: joined => savePrefs($, x => ({ ...x, partyJoined: joined })),
      achieved: async () => {
        const cur = await read($, campaign)
        if (cur !== null) await saveCampaign($, { ...cur, achieved: true })
      },
      compact: async () => {
        if (await moduleOn($, 'mochila')) await pushCard($, 'compactar')
        else $.ui.toast(c.t.off(c.t.module.mochila[0]))
      },
      recalibrate: () => recalibrateGoal($),
      grimoire: async () => {
        if (!(await callMage($))) await update($, view, () => 'grimorio' as const)
      },
      config: () => update($, view, () => 'config' as const),
      about: () => update($, view, () => 'sobre' as const),
    },
  )
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
        if (r?.windows.some(w => w.resetsAt !== undefined) === true) await update($, tick, n => n + 1)
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
    // Com inscrições pendentes, o Mago aparece acima do prompt; sem elas, o histórico no painel.
    if (await callMage($)) return { text: `📖 ${t.grimTitle}` }
    if (!(await moduleOn($, 'painel'))) return { text: t.grimEmpty }
    await update($, view, () => 'grimorio' as const)
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
    if ((e as { agentId?: string }).agentId === undefined && 'messages' in (ran as object)) await readResources($, true, false)
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
    await update($, intent, () => '')
    turnPrompts.set(ran.turnId, e.text)
    if (turnPrompts.size > 50) turnPrompts.delete(turnPrompts.keys().next().value ?? '')
    const c = await read($, campaign)
    if (c !== null) {
      const linked = assignTurn(c, ran.turnId, e.text)
      if (linked !== c) await saveCampaign($, linked)
    }
    return ran
  })

  // A intenção: o texto que o Claude escreve antes de chamar as ferramentas
  // (no estilo briefing-de-bordo, uma frase com o verbo na frente) vai para a faixa.
  on('turn.step', async function* ($, e, next) {
    const r = yield* next(e)
    if (e.agentId === undefined && r.toolUses.length > 0 && r.answer.trim() !== '') {
      const said = r.answer.replace(/\s+/g, ' ').trim()
      const first = said.split(/(?<=[.!?])\s/)[0] ?? said
      await update($, intent, () => (first.length > 160 ? `${first.slice(0, 159)}…` : first))
    }
    return r
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
      const entry: DiaryEntry = { id, tool: e.tool, cls, summary, turnId: turn, status: 'run', at: Date.now() }
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

    // O grimório só sugere; o Haiku, se ligado no ⚙, roda no clique do botão do cartão.
    if (isOn(p, 'grimorio') && e.reason === 'answer') {
      // A sugestão nasce só com o que dá para gravar agora: assim tudo o que está marcado
      // foi visto pela pessoa, e um destino marcado que cair depois vira pendência com aviso.
      const dests = await grimDests($)
      const fresh = detect(answer, said, e.turnId).map(i => ({ ...i, destinations: i.destinations.filter(d => available(d, dests)) }))
      if (fresh.length > 0) {
        // Guarda em silêncio: o contador do rodapé avisa, e o Mago aparece quando a pessoa abre o grimório.
        await update($, inscriptions, list => merge(list, fresh))
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
    // O motor não tem rolagem dentro do painel: o meio corta cartões e itens para
    // caber, e o rodapé fica preso. Só se nem o mínimo couber o painel rola inteiro.
    const full = main && (await paneFit($, e.props.bodyColumns, e.props.scroll.bodyRows)).pinned
    return (
      <Box flexDirection="column" paddingX={1} height={full ? e.props.scroll.bodyRows : undefined}>
        {body}
      </Box>
    )
  })

  // Faixa e cartões acima do prompt: uma instância só, compartilhada.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const p = await prefsNow($)
    const now = await read($, working)
    const queue = (await read($, cards)).filter(card =>
      card === 'grimorio' ? isOn(p, 'grimorio') : isOn(p, 'mochila'),
    )
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
      cardTree = compactCard(c, bag?.percent === undefined ? `${COMPACT_AT}%+` : `${bag.percent}%`, instruction, e.props.isWorking, {
        fill: async () => {
          if (await fillOrCopy($, `/compact ${instruction}`)) await dropCard($, 'compactar')
        },
        now: () => compactNow($),
        dismiss: () => dropCard($, 'compactar'),
      })
    } else if (card === 'grimorio') {
      cardTree = grimCard(c, pending(await read($, inscriptions)), await grimDests($), {
        toggle: (id, dest) => update($, inscriptions, list => toggleDest(list, id, dest)),
        seal: () => seal($),
        discard: () => discard($),
        haiku: p.grimorioHaiku ? () => rewriteWithHaiku($) : undefined,
      })
    }

    return (
      <Box flexDirection="column" gap={1}>
        {showBand &&
          bandView(c, e.props.isWorking ? now : null, await read($, quests), camp, () => togglePane($), away, await read($, intent), alert === undefined ? undefined : c.t.bandAlert[alert.kind](alert.percent))}
        {cardTree}
        {below}
      </Box>
    )
  })

  // Diário de bordo: o Clawd, o trilho e o resultado em cada linha, durante o turno.
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

  // Guarda: a linha de arquivos (diálogo) ou o Guardião do Cofre (chefe) acima do diálogo do Claude,
  // e a descrição de cada opção, que a ferramenta aceita e o `$.ui.ask` não passa.
  on('ui.render', { component: 'AskUserQuestion' }, async ($, e, next) => {
    const files = await read($, guard)
    if (files.length === 0) return next(e)
    const p = await prefsNow($)
    const mode = p.guardMode === 'chefe' ? 'chefe' : 'dialogo'
    const l = await langNow($)
    const labels = LABELS[l][mode]
    const hints = DICT[l].guardHints[mode]
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
        {mode === 'chefe' ? bossView(c, files) : guardLineView(c, files)}
        {dialog}
      </Box>
    )
  })
}
