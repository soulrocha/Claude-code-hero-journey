// clawd-hud: a HUD de RPG do Claude Code.
//
// Liga os módulos de hooks/modules/ aos eventos do motor. Cada módulo tem a sua
// seção aqui e liga ou desliga no ⚙ (prefs.modules); a lógica e as telas ficam
// na pasta do módulo. Tudo o que usa `$` mora neste arquivo, porque o motor não
// segue o `$` através de um import.
//
// Gasto de tokens: só o "Compactar agora" da mochila e o Haiku do grimório
// (desligado por padrão), e os dois só com o clique da pessoa.
//
// Créditos dos padrões de código: Daniel Ávila (claude-code-templates, MIT),
// citado em cada módulo e no README.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement, RenderInput } from 'claude-code'

import type { Campaign, Card, DiaryEntry, Destination, GuardFile, Inscription, Lang, ModuleId, Palette, Prefs, Project } from '../types'
import { agentClass, classOf, clockOf, patchStats, summaryOf, untilOf } from './core/classes'
import { TONE } from './core/art'
import { DICT, looksPortuguese, resolveLang } from './core/i18n'
import { DEFAULT_PREFS, isOn, migratePrefs, toggleModule, toggleSection, withProfile } from './core/prefs'
import type { Ctx } from './core/ui'
import { assignTurn, buildReport, chapterOf, closeChapter, onPrompt, prune, reports, setVerdict, storeKey } from './modules/campanha/campanha'
import { reportView } from './modules/campanha/view'
import { celebrate } from './modules/comemoracao/comemoracao'
import { groupFor, groupView } from './modules/diario/diario'
import { groupHeadView, rowView } from './modules/diario/view'
import { bandView } from './modules/faixa/view'
import { appendDecision, available, detect, haikuPrompt, isSubfolder, memoryTool, merge, pending, toggleDest, withSuffix, writesFor } from './modules/grimorio/grimorio'
import type { Dests, Memory, Write } from './modules/grimorio/grimorio'
import { grimCard, grimPage } from './modules/grimorio/view'
import { diffOf, LABELS, listOption, makeGuard, shellTargets, verdictOf } from './modules/guarda/guarda'
import { bossView, guardLineView } from './modules/guarda/view'
import { COMPACT_AT, compactInstruction, shouldWarn } from './modules/mochila/mochila'
import { compactCard } from './modules/mochila/view'
import { EMPTY_INVENTORY, NUMSTAT_ARGV, parseInventory, questsFromTodos, STATUS_ARGV, upsertMember } from './modules/painel/painel'
import { setupView } from './modules/painel/primeiros-passos'
import { aboutView, configView, mainView } from './modules/painel/view'
import {
  addFolder,
  addProject,
  baseFolderName,
  currentProject,
  hasAccess,
  isInside,
  loadProjects,
  openSessionPrompt,
  removeFolder,
  removeProject,
  settingsDirs,
  togglePin,
  withDirectories,
} from './modules/projetos/projetos'
import { projectsView } from './modules/projetos/view'
import { briefOf, sideQuestPrompt } from './modules/side-quest/side-quest'
import { sideQuestCard } from './modules/side-quest/view'

const PANE = 'clawd-hud'
// `Task` é o nome antigo da ferramenta Agent.
const AGENT = /^(Agent|Task)$/
const WRITES = /^(Edit|Write|NotebookEdit)$/
const CARD_ORDER: readonly Card[] = ['grimorio', 'compactar', 'sideQuest']

const lang = atom({ plugin: 'clawd-hud', key: 'lang' } as const, 'en')
const theme = atom({ plugin: 'clawd-hud', key: 'theme' } as const, 'dark')
const turnId = atom({ plugin: 'clawd-hud', key: 'turnId' } as const, '')
const diary = atom({ plugin: 'clawd-hud', key: 'diary' } as const, [])
const expanded = atom({ plugin: 'clawd-hud', key: 'expanded' } as const, [])
const quests = atom({ plugin: 'clawd-hud', key: 'quests' } as const, [])
const party = atom({ plugin: 'clawd-hud', key: 'party' } as const, [])
const inventory = atom({ plugin: 'clawd-hud', key: 'inventory' } as const, EMPTY_INVENTORY)
const prefs = atom({ plugin: 'clawd-hud', key: 'prefs' } as const, DEFAULT_PREFS)
const working = atom({ plugin: 'clawd-hud', key: 'working' } as const, null)
const cards = atom({ plugin: 'clawd-hud', key: 'cards' } as const, [])
const view = atom({ plugin: 'clawd-hud', key: 'view' } as const, 'main')
const partyTab = atom({ plugin: 'clawd-hud', key: 'partyTab' } as const, 'grupo')
const campaign = atom({ plugin: 'clawd-hud', key: 'campaign' } as const, null)
const reportAt = atom({ plugin: 'clawd-hud', key: 'reportAt' } as const, 0)
const reportOpen = atom({ plugin: 'clawd-hud', key: 'reportOpen' } as const, false)
const guard = atom({ plugin: 'clawd-hud', key: 'guard' } as const, [])
const refusals = atom({ plugin: 'clawd-hud', key: 'refusals' } as const, [])
const inscriptions = atom({ plugin: 'clawd-hud', key: 'inscriptions' } as const, [])
const intent = atom({ plugin: 'clawd-hud', key: 'intent' } as const, '')
const projects = atom({ plugin: 'clawd-hud', key: 'projects' } as const, [])
const sessionDirs = atom({ plugin: 'clawd-hud', key: 'sessionDirs' } as const, [])
const setup = atom({ plugin: 'clawd-hud', key: 'setup' } as const, {})
const confirmDel = atom({ plugin: 'clawd-hud', key: 'confirmDel' } as const, '')

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
let warned = false
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
    await update($, inventory, () => parseInventory(status.stdout, numstat.exitCode === 0 ? numstat.stdout : '', isGuarded))
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

const resetText = (t: (typeof DICT)['pt'], iso: string | undefined) =>
  iso === undefined ? '' : t.resetAt(clockOf(iso), untilOf(iso, Date.now()))

async function usageNow($: EngineInterface) {
  const t = DICT[await langNow($)]
  const usage = await $.session.usage()
  const win = (kind: string) => usage.rateLimits.find(r => r.kind === kind)
  const five = win('five_hour')
  const week = win('seven_day')
  return {
    context: usage.context.percent,
    mana: five === undefined ? undefined : 100 - five.percentUsed,
    manaAt: resetText(t, five?.resetsAt),
    manaIn: untilOf(five?.resetsAt, Date.now()),
    vigor: week === undefined ? undefined : 100 - week.percentUsed,
    vigorAt: resetText(t, week?.resetsAt),
    vigorIn: untilOf(week?.resetsAt, Date.now()),
  }
}

/**
 * A campanha é acompanhada sempre (a comemoração e a side quest leem dela); o
 * módulo campanha decide se ela aparece no painel e se fica guardada no $.store.
 */
async function saveCampaign($: EngineInterface, c: Campaign) {
  await update($, campaign, () => c)
  if (await moduleOn($, 'campanha')) await $.store.set(storeKey(c.id), c)
}

async function sideQuestText($: EngineInterface) {
  const c = await read($, campaign)
  const list = reports(c)
  return briefOf({ campaign: c, quests: await read($, quests), inventory: await read($, inventory), last: list[list.length - 1] }, await langNow($))
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
      all.map(i => (sealed[i.id] !== undefined ? { ...i, sealed: sealed[i.id] } : left[i.id] !== undefined ? { ...i, destinations: left[i.id] } : i)),
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

/** Guarda os projetos no estado e no $.store (valem para todas as sessões). */
async function saveProjects($: EngineInterface, change: (list: Project[]) => Project[]) {
  // Lê o $.store na hora: outra sessão aberta pode ter criado projetos desde o início desta.
  const stored = await $.store.get('projetos')
  const next = change(stored === undefined ? [...(await read($, projects))] : loadProjects(stored))
  await update($, projects, () => next)
  await $.store.set('projetos', next)
}

/** As pastas que o Claude alcança além da pasta da sessão: as do settings e as do /add-dir. */
async function accessDirs($: EngineInterface) {
  const settings = await $.settings.read().catch(() => ({}))
  return [...settingsDirs(settings), ...(await read($, sessionDirs))]
}

/** Acesso permanente: acrescenta as pastas sem acesso ao .claude/settings.local.json da pasta da sessão. */
async function grantAlways($: EngineInterface, id: string) {
  const t = DICT[await langNow($)]
  const cwd = await $.session.cwd()
  const p = (await read($, projects)).find(x => x.id === id)
  if (p === undefined) return
  const dirs = await accessDirs($)
  const toAdd = p.folders.filter(f => !hasAccess(f, cwd, dirs))
  if (toAdd.length === 0) return
  const file = `${cwd.replace(/[\\/]+$/, '')}/.claude/settings.local.json`
  try {
    const current = (await $.fs.exists(file)) ? await $.fs.read(file) : ''
    await $.fs.write(file, withDirectories(current, toAdd))
    $.ui.toast(t.accessSaved(toAdd.length))
  } catch (err) {
    $.ui.toast(t.accessFailed(err instanceof Error ? err.message : String(err)))
  }
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

async function addCwdProject($: EngineInterface) {
  const cwd = await $.session.cwd()
  if (currentProject(await read($, projects), cwd) !== undefined) return
  await saveProjects($, l => addProject(l, baseFolderName(cwd), cwd))
}

async function renderPane($: EngineInterface, e: RenderInput<'Pane'>): Promise<RenderElement> {
  const ui = $.ui.resolve(e)
  const c: Ctx = { ...(await ctxOf($, e.surface, e.props.bodyColumns)), ui }
  const v = await read($, view)
  const p = await prefsNow($)
  const toMain = () => update($, view, () => 'main' as const)

  if (v === 'sobre') return aboutView(c, toMain)
  if (v === 'boasVindas') {
    const cwd = await $.session.cwd()
    return setupView(c, await read($, setup), langOption, await grimDests($), currentProject(await read($, projects), cwd) !== undefined, {
      lang: async value => {
        await $.config.set({ key: 'clawd-hud.language', value })
      },
      answer: async yes => {
        await update($, setup, s => ({ ...s, vault: yes ? ('sim' as const) : ('nao' as const), msg: undefined }))
        if (!yes) await $.config.set({ key: 'clawd-hud.vaultPath', value: '' })
      },
      path: async value => {
        const folder = await checkedFolder($, value)
        if (folder === undefined) {
          await update($, setup, s => ({ ...s, msg: c.t.folderMissing(value) }))
          return
        }
        await update($, setup, s => ({ ...s, msg: undefined }))
        await $.config.set({ key: 'clawd-hud.vaultPath', value: folder })
      },
      // A pasta de entrada é uma subpasta do vault que já existe. Vazia, volta ao padrão (Inbox).
      inbox: async value => {
        const sub = value.trim().replace(/^"|"$/g, '')
        if (!isSubfolder(sub)) {
          await update($, setup, s => ({ ...s, msg: c.t.inboxInvalid(sub) }))
          return
        }
        if (sub !== '' && (await checkedFolder($, `${paths.vault}/${sub}`)) === undefined) {
          await update($, setup, s => ({ ...s, msg: c.t.folderMissing(`${paths.vault}/${sub}`) }))
          return
        }
        await update($, setup, s => ({ ...s, msg: undefined }))
        await $.config.set({ key: 'clawd-hud.vaultInbox', value: sub })
      },
      addProject: () => addCwdProject($),
      done: async () => {
        await $.store.set('setupDone', true)
        await update($, view, () => 'main' as const)
      },
    })
  }
  if (v === 'projetos' && isOn(p, 'projetos')) {
    const cwd = await $.session.cwd()
    const list = await read($, projects)
    return projectsView(c, list, cwd, await accessDirs($), currentProject(list, cwd), {
      back: toMain,
      addCwd: () => addCwdProject($),
      create: name => saveProjects($, l => addProject(l, name)),
      addFolder: async (id, value) => {
        const folder = await checkedFolder($, value)
        if (folder !== undefined) await saveProjects($, l => addFolder(l, id, folder))
      },
      removeFolder: (id, folder) => saveProjects($, l => removeFolder(l, id, folder)),
      pin: id => saveProjects($, l => togglePin(l, id)),
      confirming: await read($, confirmDel),
      // ✕ pede confirmação: o primeiro clique arma, o segundo remove.
      remove: async id => {
        if ((await read($, confirmDel)) !== id) {
          await update($, confirmDel, () => id)
          return
        }
        await update($, confirmDel, () => '')
        await saveProjects($, l => removeProject(l, id))
      },
      open: async id => {
        const proj = (await read($, projects)).find(x => x.id === id)
        if (proj !== undefined) await fillOrCopy($, openSessionPrompt(proj, await langNow($)))
      },
      accessNow: folder => fillOrCopy($, `/add-dir ${folder}`),
      accessAlways: id => grantAlways($, id),
    })
  }
  if (v === 'config') {
    return configView(c, p, langOption, {
      back: toMain,
      lang: async value => {
        const t = DICT[await langNow($)]
        const r = await $.config.set({ key: 'clawd-hud.language', value })
        $.ui.toast('deny' in r && r.deny !== undefined ? t.langDenied(r.deny) : t.langChanged)
      },
      skin: skin => savePrefs($, x => ({ ...x, skin })),
      profile: profile => savePrefs($, x => withProfile(x, profile)),
      toggle: section => savePrefs($, x => toggleSection(x, section)),
      diary: mode => savePrefs($, x => ({ ...x, diary: mode })),
      module: async id => {
        await savePrefs($, x => toggleModule(x, id))
        // Desligar o painel no ⚙ fecha o painel aberto.
        if (id === 'painel' && !(await moduleOn($, 'painel'))) await $.ui.close({ id: PANE })
      },
      guard: mode => savePrefs($, x => ({ ...x, guardMode: mode })),
      haiku: () => savePrefs($, x => ({ ...x, grimorioHaiku: !x.grimorioHaiku })),
      setup: () => update($, view, () => 'boasVindas' as const),
    })
  }
  const all = await read($, inscriptions)
  const grimActions = {
    toggle: (id: string, dest: Destination) => update($, inscriptions, list => toggleDest(list, id, dest)),
    seal: () => seal($),
    discard: () => discard($),
    haiku: p.grimorioHaiku ? () => rewriteWithHaiku($) : undefined,
  }
  if (v === 'grimorio' && isOn(p, 'grimorio')) {
    return grimPage(c, pending(all), all.filter(i => i.sealed !== undefined), await grimDests($), toMain, grimActions)
  }

  const camp = await read($, campaign)
  const list = reports(camp)
  const at = Math.min(await read($, reportAt), Math.max(0, list.length - 1))
  const report = isOn(p, 'campanha')
    ? reportView(c, list, at, await read($, reportOpen), (await read($, working)) !== null, {
        toggle: () => update($, reportOpen, o => !o),
        prev: () => update($, reportAt, n => Math.max(0, n - 1)),
        next: () => update($, reportAt, n => Math.min(list.length - 1, n + 1)),
        approve: async chapter => {
          const cur = await read($, campaign)
          if (cur !== null) await saveCampaign($, setVerdict(cur, chapter, 'aprovado'))
        },
        adjust: async r => {
          const cur = await read($, campaign)
          if (cur !== null) await saveCampaign($, setVerdict(cur, r.chapter, 'ajustar'))
          await fillOrCopy($, c.t.adjustDraft(r.title))
        },
      })
    : null

  return mainView(
    c,
    {
      prefs: p,
      campaign: camp,
      quests: await read($, quests),
      party: await read($, party),
      inventory: await read($, inventory),
      partyTab: await read($, partyTab),
      usage: await usageNow($),
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
      grimoire: () => update($, view, () => 'grimorio' as const),
      sideQuest: () => pushCard($, 'sideQuest'),
      projects: () => update($, view, () => 'projetos' as const),
      config: () => update($, view, () => 'config' as const),
      about: () => update($, view, () => 'sobre' as const),
    },
    report,
  )
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

    await $.command.register({ name: 'hud', description: 'Abre a HUD do Clawd / Opens the Clawd HUD' })
    await $.command.register({ name: 'side-quest', description: 'Prepara uma side quest (sessão paralela) / Prepares a side quest' })
    await $.command.register({ name: 'grimorio', description: 'Abre o grimório / Opens the grimoire' })
    await $.command.register({ name: 'projetos', description: 'Projetos e pastas com acesso / Projects and folders with access' })

    // Cada etapa do início falha sozinha, sem levar as outras junto.
    const settings = (await $.settings.read().catch(() => ({}))) as Record<string, unknown>
    const system = (await $.env.get('LC_ALL').catch(() => undefined)) ?? (await $.env.get('LANG').catch(() => undefined))
    // O átomo guarda sempre a resolução do `auto`; a língua fixada vence em `langNow`.
    // Assim, voltar de pt-BR para auto no ⚙ cai na língua certa sem esperar outro início.
    await update($, lang, () => resolveLang('auto', settings.language, system, undefined))
    langFromPrompt = settings.language === undefined && system === undefined

    await update($, prefs, () => migratePrefs(undefined))
    const stored = await $.store.get('prefs')
    if (stored !== undefined) await update($, prefs, () => migratePrefs(stored))

    // Uma sessão retomada recupera a campanha guardada; o $.store guarda só as 20 mais recentes.
    const id = await $.session.id().catch(() => '')
    const mine = id === '' ? undefined : ((await $.store.get(storeKey(id))) as Campaign | undefined)
    if (mine !== undefined && (await read($, campaign)) === null) await update($, campaign, () => mine)
    const kept: { key: string; startedAt: number }[] = []
    for (const key of await $.store.keys()) {
      if (!key.startsWith('campanha:')) continue
      const c = (await $.store.get(key)) as Campaign | undefined
      kept.push({ key, startedAt: typeof c?.startedAt === 'number' ? c.startedAt : 0 })
    }
    for (const key of prune(kept)) await $.store.delete(key)

    await update($, projects, () => loadProjects(undefined))
    const savedProjects = await $.store.get('projetos')
    if (savedProjects !== undefined) await update($, projects, () => loadProjects(savedProjects))
    // Na primeira vez, o painel abre nos Primeiros passos (língua, vault, projeto).
    if ((await $.store.get('setupDone')) !== true) await update($, view, () => 'boasVindas' as const)

    await refreshTheme($)
    await refreshInventory($)
    // Aberto sem pedido, o painel só aparece em tela larga (144 colunas).
    if (await moduleOn($, 'painel')) await $.ui.open({ id: PANE, title: 'Clawd HUD' })
    return ran
  })

  on('command.run', { command: 'hud' }, async $ => {
    const t = DICT[await langNow($)]
    if (!(await moduleOn($, 'painel'))) await savePrefs($, x => ({ ...x, modules: { ...x.modules, painel: true } }))
    await refreshTheme($)
    // Enquanto os Primeiros passos não forem concluídos, o /hud abre neles (janela estreita incluída).
    const firstRun = (await $.store.get('setupDone')) !== true
    await update($, view, () => (firstRun ? ('boasVindas' as const) : ('main' as const)))
    const opened = await $.ui.open({ id: PANE, title: 'Clawd HUD', focus: true })
    return { text: opened.isPlaced ? '🦀 Clawd HUD' : t.paneNotPlaced(String(opened.reason)) }
  })

  on('command.run', { command: 'side-quest' }, async $ => {
    const t = DICT[await langNow($)]
    if (!(await moduleOn($, 'sideQuest'))) return { text: t.off(t.module.sideQuest[0]) }
    await pushCard($, 'sideQuest')
    return { text: `⇄ ${t.sqTitle}` }
  })

  on('command.run', { command: 'grimorio' }, async $ => {
    const t = DICT[await langNow($)]
    if (!(await moduleOn($, 'grimorio'))) return { text: t.off(t.module.grimorio[0]) }
    // Sem o painel, o grimório aparece como cartão acima do prompt.
    if (!(await moduleOn($, 'painel'))) {
      const waiting = pending(await read($, inscriptions)).length > 0
      if (waiting) await pushCard($, 'grimorio')
      return { text: waiting ? `📖 ${t.grimTitle}` : t.grimEmpty }
    }
    await update($, view, () => 'grimorio' as const)
    await $.ui.open({ id: PANE, title: 'Clawd HUD', focus: true })
    return { text: `📖 ${t.grimTitle}` }
  })

  on('command.run', { command: 'projetos' }, async $ => {
    const t = DICT[await langNow($)]
    if (!(await moduleOn($, 'projetos'))) return { text: t.off(t.module.projetos[0]) }
    if (!(await moduleOn($, 'painel'))) await savePrefs($, x => ({ ...x, modules: { ...x.modules, painel: true } }))
    await update($, view, () => 'projetos' as const)
    await $.ui.open({ id: PANE, title: 'Clawd HUD', focus: true })
    return { text: t.projects }
  })

  // Uma pasta liberada pelo /add-dir conta como acesso nesta sessão.
  on('classic.DirectoryAdded', async ($, e, next) => {
    const dir = e.directory
    await update($, sessionDirs, list => (list.some(d => isInside(dir, d)) ? list : [...list, dir]))
    return next(e)
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
    if (text !== '' && !text.startsWith('/')) {
      if (langFromPrompt) {
        langFromPrompt = false
        await update($, lang, () => (looksPortuguese(text) ? 'pt' : 'en'))
      }
      await saveCampaign($, onPrompt(await read($, campaign), await $.session.id(), text, Date.now()))
      // Durante a missão o relatório fica recolhido; ele abre sozinho no fim.
      await update($, reportOpen, () => false)
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
    const input = e as unknown as Record<string, unknown>
    const isMain = e.agentId === undefined
    const cls = classOf(e.tool, input)
    const summary = summaryOf(e.tool, input)
    const id = e.tool_use_id ?? `${e.tool}-${Date.now()}`

    if (isMain) {
      await update($, working, () => ({ tool: e.tool, cls, summary }))
      const turn = await read($, turnId)
      const open = await read($, expanded)
      await update($, diary, list => {
        const entry: DiaryEntry = { id, tool: e.tool, cls, summary, turnId: turn, group: groupFor(list, cls, turn, id, open), status: 'run', at: Date.now() }
        return [...list, entry].slice(-300)
      })
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
    if (e.tool === 'TaskUpdate' && !failed) {
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
        list.map(m => (m.id === id ? { ...m, agentId: agentId ?? m.agentId, status: failed ? 'err' : background ? 'run' : 'ok' } : m)),
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

  // ---------- Fim do turno: relatório, comemoração, grimório ----------

  on('turn.complete', async ($, e, next) => {
    const ran = await next(e)
    if (e.agentId !== undefined) {
      const agentId = e.agentId
      await update($, party, list => list.map(m => (m.agentId === agentId ? { ...m, status: e.reason === 'answer' ? 'ok' : 'err' } : m)))
      return ran
    }
    await update($, working, () => null)
    await update($, intent, () => '')
    await refreshInventory($)
    const p = await prefsNow($)
    const l = await langNow($)
    const answer = e.answer ?? ''
    const said = turnPrompts.get(e.turnId) ?? ''

    // O relatório é do capítulo deste turno (casado pelo turnId): uma mensagem
    // digitada no meio do turno não rouba o relatório, e um turno de continuação
    // não sobrescreve um relatório já aprovado.
    const c = await read($, campaign)
    const ch = chapterOf(c, e.turnId)
    if (c !== null && ch !== undefined && ch.report === undefined) {
      const entries = (await read($, diary)).filter(x => x.turnId === e.turnId)
      const refused = (await read($, refusals)).filter(x => x.turnId === e.turnId).map(x => x.text)
      const report = buildReport(ch, entries, answer, e.durationMs, e.reason, refused)
      const closed = closeChapter(c, report)
      await saveCampaign($, closed)
      await update($, reportAt, () => reports(closed).length - 1)
      await update($, reportOpen, () => isOn(p, 'campanha'))
      if (isOn(p, 'comemoracao')) {
        const text = celebrate(report, l)
        if (text !== undefined) $.ui.toast(text)
      }
    }
    await update($, refusals, list => list.filter(x => x.turnId !== e.turnId))

    // O grimório só sugere; o Haiku, se ligado no ⚙, roda no clique do botão do cartão.
    if (isOn(p, 'grimorio') && e.reason === 'answer') {
      // A sugestão nasce só com o que dá para gravar agora: assim tudo o que está marcado
      // foi visto pela pessoa, e um destino marcado que cair depois vira pendência com aviso.
      const dests = await grimDests($)
      const fresh = detect(answer, said, e.turnId).map(i => ({ ...i, destinations: i.destinations.filter(d => available(d, dests)) }))
      if (fresh.length > 0) {
        await update($, inscriptions, list => merge(list, fresh))
        if (pending(await read($, inscriptions)).length > 0) await pushCard($, 'grimorio')
      }
    }
    $.ui.invalidate('ui.render')
    return ran
  })

  // ---------- Mochila: o contexto enche ----------

  on('session.measure', async ($, e, next) => {
    const ran = await next(e)
    if (await moduleOn($, 'mochila')) {
      const step = shouldWarn(e.context.percent ?? 0, warned)
      if (step === 'warn') {
        warned = true
        await pushCard($, 'compactar')
      } else if (step === 'reset') warned = false
    }
    $.ui.invalidate('ui.render')
    return ran
  })

  // ---------- Desenho ----------

  // O painel em tom quente, um pouco diferente do chat, para marcar que é um menu.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const body = await renderPane($, e)
    const { bg } = await ctxOf($, e.surface, e.props.bodyColumns)
    if (bg === undefined || e.surface !== 'desktop') return body
    const { Box } = $.ui.resolve(e)
    return (
      <Box flexDirection="column" flexGrow={1} backgroundColor={bg} paddingX={1}>
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
      card === 'grimorio' ? isOn(p, 'grimorio') : card === 'compactar' ? isOn(p, 'mochila') : isOn(p, 'sideQuest'),
    )
    const showBand = e.props.isWorking && now !== null && isOn(p, 'faixa')
    const card = queue[0]
    if (!showBand && card === undefined) return next(e)

    const ui = $.ui.resolve(e)
    const c: Ctx = { ...(await ctxOf($, e.surface, e.props.bodyColumns)), ui }
    const { Box } = ui
    const camp = await read($, campaign)
    const below = await next(e)

    let cardTree: RenderElement | null = null
    if (card === 'compactar') {
      const usage = await usageNow($)
      const instruction = compactInstruction(await langNow($), camp, await read($, quests))
      cardTree = compactCard(c, usage.context === undefined ? `${COMPACT_AT}%+` : `${Math.round(usage.context)}%`, instruction, e.props.isWorking, {
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
    } else if (card === 'sideQuest') {
      const brief = await sideQuestText($)
      const text = sideQuestPrompt(brief, await langNow($))
      cardTree = sideQuestCard(c, brief, {
        fill: async () => {
          await fillOrCopy($, text)
          await dropCard($, 'sideQuest')
        },
        copy: async () => {
          await $.ui.copy({ text })
          $.ui.toast(c.t.copied)
        },
        dismiss: () => dropCard($, 'sideQuest'),
      })
    }

    return (
      <Box flexDirection="column" gap={1}>
        {showBand && now !== null && bandView(c, now, await read($, intent), camp?.objective ?? '')}
        {cardTree}
        {below}
      </Box>
    )
  })

  // Diário de bordo: o Clawd e o trilho em cada linha; grupos recolhidos.
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.surface !== 'desktop') return next(e)
    const p = await prefsNow($)
    if (!isOn(p, 'diario')) return next(e)

    const list = await read($, diary)
    const gv = groupView(list, e.props.tool_use_id, p.diary, await read($, expanded))
    const ui = $.ui.resolve(e)
    const c: Ctx = { ...(await ctxOf($, e.surface, e.viewport?.columns ?? 80)), ui }

    if (gv.kind === 'hidden') {
      const { Box } = ui
      return <Box />
    }
    if (gv.kind === 'head') {
      const group = gv.entries[0]?.group ?? ''
      return groupHeadView(c, gv.entries, () => update($, expanded, ids => [...ids, group]))
    }

    const row = await next(e)
    const entry = list.find(x => x.id === e.props.tool_use_id)
    const input = (e.props.input ?? {}) as Record<string, unknown>
    const status = e.props.isRunning ? 'run' : e.props.isErrored || e.props.isInterrupted ? 'err' : 'ok'
    return rowView(c, entry ?? { cls: classOf(e.props.tool, input), status, summary: summaryOf(e.props.tool, input) }, row)
  })

  // A saída das linhas de um grupo recolhido também some (o ToolResult é outro componente).
  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    if (e.surface !== 'desktop') return next(e)
    const p = await prefsNow($)
    if (!isOn(p, 'diario')) return next(e)
    const gv = groupView(await read($, diary), e.props.tool_use_id, p.diary, await read($, expanded))
    if (gv.kind === 'single') return next(e)
    const { Box } = $.ui.resolve(e)
    return <Box />
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
