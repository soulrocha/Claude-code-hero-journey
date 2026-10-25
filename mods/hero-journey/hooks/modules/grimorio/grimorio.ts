// Grimório: acha, sem chamar o modelo, o que vale guardar de um turno (decisão
// técnica, conquista com número, regra que a pessoa estabeleceu), sugere um
// destino só para cada um e monta o salvar progresso (a tarefa num arquivo, para
// continuar depois em qualquer agente). Nada é gravado sem o clique da pessoa.
// O Haiku só entra, se ligado no ⚙, para reescrever um candidato numa frase.

import type { Destination, Inscription, InscriptionKind, MemoryPrefs, Written } from '../../../types'
import { joinPath } from '../../core/pasta'

// Na resposta do Claude, só decisão declarada ("decidimos", "ficou decidido"):
// a palavra "decisão" solta aparece em pendências ("aguardo sua decisão") e tabelas.
const DECISION = /\b(decidimos|ficou decidido|optamos|adotamos|padr[ãa]o adotado|we decided|we chose|it was decided)\b/i
// Na mensagem da pessoa, regra que ela mesma estabelece. `(?=\W|$)`: "regra:" seguido de espaço não tem fronteira.
const RULE = /\b(a partir de agora|de agora em diante|decidi|regra:|sempre use|nunca use|from now on|always use|never use)(?=\W|$)/i
// Frases que falam de decisão sem tomar uma.
const NOT_DECIDED = /\b(sua decis[ãa]o|nenhuma decis[ãa]o|aguard\w*|pendente|your decision|no decision|waiting)\b/i
// Daqui em diante a resposta do briefing é pendência, risco ou próximo passo: não é decisão nem conquista.
const OPEN_PART = /\*\*(Aguarda você|Sua vez|Próximo|Risco|Não verificado|Waiting on you|Your turn|Next|Risk|Not verified):\*\*/i

/** A parte da resposta que fala do que foi feito: sem pendências, código, tabelas nem citações. */
const settledPart = (answer: string) => {
  const cut = answer.search(OPEN_PART)
  return (cut === -1 ? answer : answer.slice(0, cut))
    .replace(/```[\s\S]*?```/g, '')
    .split('\n')
    .filter(line => !/^\s*(\||>)/.test(line))
    .join('\n')
}

/** A linha **Resultado:** do briefing, quando existe: é dela que sai a conquista. */
const resultLine = (answer: string) => /\*\*(Resultado|Result):\*\*\s*(.+)/i.exec(answer)?.[2]
// "aumentou" sozinho não é conquista ("o contexto aumentou para 60%"); "de X para Y" é.
const IMPROVEMENT = /\b(reduz\w*|melhor\w*|caiu|cortou|acelerou|de [\d.,]+\s?\w* para [\d.,]+|reduced|improved|faster|dropped|from [\d.,]+\s?\w* to [\d.,]+)/i
const NUMBER = /\d+([.,]\d+)?\s?(%|ms|s\b|x\b|vezes|min|segundos|minutos|horas|times|kb|mb)/i

const sentences = (text: string) =>
  text
    .replace(/\*\*/g, '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(s => s.length >= 12 && s.length <= 280)

export const slug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

/** O servidor MCP do ai-memory, pelo nome da ferramenta (vale com o servidor renomeado). */
export type Memory = { server: string }

/** Para onde dá para gravar nesta sessão: a pasta do vault e o ai-memory, se o MCP estiver conectado. */
export type Dests = { vault: string; inbox?: string; memory?: Memory }

/**
 * O escopo de toda chamada ao ai-memory. O mod é um cliente MCP sem hooks: sem
 * `workspace` e `project`, as leituras falham e as escritas caem no projeto padrão
 * (docs/programmatic-memory.md do ai-memory).
 */
export type MemoryScope = { workspace: string; project: string }

/** Nome que o ai-memory aceita: minúsculas, dígitos, ponto, traço e sublinhado. */
export const safeName = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[^a-z0-9]+|-+$/g, '')

/** As chaves de escopo do `.ai-memory.toml` (só as de cima, antes da primeira seção). */
export const parseMarker = (toml: string): Partial<MemoryScope> => {
  const top = toml.split(/^\s*\[/m)[0] ?? ''
  const key = (k: string) => new RegExp(`^\\s*${k}\\s*=\\s*["']([^"']+)["']`, 'm').exec(top)?.[1]?.trim()
  const workspace = key('workspace')
  const project = key('project')
  return { ...(workspace ? { workspace } : {}), ...(project ? { project } : {}) }
}

/**
 * O projeto pelo remoto do git, como o ai-memory faz: o caminho sem o host, com
 * "/" virando "-" (`git@github.com:acme/api.git` → `acme-api`).
 */
export const projectFromRemote = (url: string) => {
  const path = url
    .trim()
    .replace(/\.git$/i, '')
    .replace(/^[a-z+]+:\/\/[^/]+\//i, '')
    .replace(/^[^@/]+@[^:]+:/, '')
  return path === '' || path === url.trim() ? '' : safeName(path.replace(/\//g, '-'))
}

/** Acha o `memory_write_page` do ai-memory entre as ferramentas da sessão. */
export const memoryTool = (tools: readonly { name: string; description?: string }[]): Memory | undefined => {
  for (const t of tools) {
    const m = /^mcp__(.+)__memory_write_page$/.exec(t.name)
    if (m?.[1] !== undefined) return { server: m[1] }
  }
  return undefined
}

/** Os destinos que existem nesta sessão: o AGENTS.md e o projeto sempre; o vault e o ai-memory quando há. */
export const available = (dest: Destination, d: Dests) =>
  dest === 'vaultDecisao' || dest === 'carreira' ? d.vault !== '' : dest === 'aiMemory' ? d.memory !== undefined : true

/** Os destinos que fazem sentido para cada tipo, na ordem em que o clique troca. */
const OPTIONS: Record<InscriptionKind, readonly Destination[]> = {
  regra: ['agentsMd'],
  decisao: ['vaultDecisao', 'projeto', 'aiMemory'],
  conquista: ['carreira', 'projeto', 'aiMemory'],
}

export const optionsFor = (kind: InscriptionKind, d: Dests) => OPTIONS[kind].filter(x => available(x, d))

/**
 * O destino sugerido. Regra vai para o AGENTS.md. Decisão e conquista vão para o
 * vault, se houver; sem vault, para o projeto quando a pessoa já escolheu isso, ou
 * para nenhum (a primeira crônica pergunta onde guardar).
 */
export const suggest = (kind: InscriptionKind, d: Dests, home: MemoryPrefs['decisoesEm']): Destination | undefined => {
  if (kind === 'regra') return 'agentsMd'
  if (home === 'projeto') return 'projeto'
  if (d.vault !== '') return kind === 'decisao' ? 'vaultDecisao' : 'carreira'
  return home === 'vault' ? undefined : home === 'auto' ? undefined : 'projeto'
}

/** O clique no destino troca para o próximo que está disponível. */
export const cycleDest = (list: readonly Inscription[], id: string, d: Dests): Inscription[] =>
  list.map(i => {
    if (i.id !== id) return i
    const opts = optionsFor(i.kind, d)
    if (opts.length === 0) return i
    const at = opts.indexOf(i.destinations[0] as Destination)
    return { ...i, destinations: [opts[(at + 1) % opts.length] as Destination] }
  })

/** Liga ou desliga os tipos pelo ⚙ Memória: regra com as regras, decisão e conquista com a crônica. */
export const kindOn = (kind: InscriptionKind, m: MemoryPrefs) => (kind === 'regra' ? m.regras : m.cronica)

/**
 * A linha que vai para o AGENTS.md: uma linha só, sem crase nem tag, com no
 * máximo 280 caracteres. A proteção é exigir o clique.
 */
export const oneLine = (s: string) => {
  // `<` e `>` viram ‹ ›: `<system>` deixa de ser marcação, e `List<String>` ou `x < 10` não perdem o sentido.
  const c = s.replace(/</g, '‹').replace(/>/g, '›').replace(/`/g, ' ').replace(/\s+/g, ' ').trim()
  return c.length > 280 ? `${c.slice(0, 279)}…` : c
}

/**
 * A pasta de entrada fica dentro do vault: nada de caminho absoluto, drive, caminho
 * de rede ou `..`. Vazia vale (é o padrão, Inbox).
 */
export const isSubfolder = (sub: string) => !/^([a-z]:|[\\/])/i.test(sub) && !sub.split(/[\\/]/).includes('..')

/** `nota.md` → `nota-2.md`: o nome livre seguinte, para nunca sobrescrever uma nota. */
export const withSuffix = (path: string, n: number) => path.replace(/(\.md)?$/, `-${n}$1`)

/** A mesma nota, ignorando a linha `data:` do frontmatter: uma nova tentativa em outro dia não duplica. */
export const sameNote = (a: string | undefined, b: string) => {
  // Só a linha data: do frontmatter (entre o primeiro par de ---); no corpo, data: é texto.
  const plain = (t: string) => t.replace(/\r\n/g, '\n').replace(/^(---\n(?:(?!---\n)[^]*?\n)?)data: .*\n/, '$1')
  return a !== undefined && plain(a) === plain(b)
}

/** Candidatos de um turno: decisões e conquistas na resposta, regras na mensagem da pessoa. */
export const detect = (answer: string, prompt: string, turnId: string): Omit<Inscription, 'destinations'>[] => {
  const found: Omit<Inscription, 'destinations'>[] = []
  const add = (kind: InscriptionKind, text: string, source: string) => {
    if (found.some(f => f.text === text)) return
    found.push({ id: `${turnId}-${found.length}-${slug(text)}`, kind, text, source })
  }
  for (const s of sentences(settledPart(answer))) {
    if (s.includes('?') || NOT_DECIDED.test(s)) continue
    if (DECISION.test(s)) add('decisao', s, 'resposta')
  }
  // Conquista: um número que melhorou. Com o briefing, só da linha Resultado.
  const result = resultLine(answer)
  for (const s of sentences(result ?? settledPart(answer))) {
    if (!s.includes('?') && NUMBER.test(s) && IMPROVEMENT.test(s)) add('conquista', s, 'resposta')
  }
  for (const s of sentences(prompt)) {
    if (!s.includes('?') && RULE.test(s)) add('regra', s, 'mensagem')
  }
  return found.slice(0, 4)
}

/** Junta candidatos novos aos pendentes, sem repetir texto já visto. */
export const merge = (current: readonly Inscription[], fresh: readonly Inscription[]) => {
  const seen = new Set(current.map(i => i.text))
  return [...current, ...fresh.filter(i => !seen.has(i.text))].slice(-30)
}

export const isPending = (i: Inscription) => i.sealed === undefined || i.destinations.some(d => !i.sealed!.includes(d))

export const pending = (list: readonly Inscription[]) => list.filter(isPending)

const today = (at: number) => new Date(at).toISOString().slice(0, 10)

export type Write = { dest: Destination; path: string; text: string; append: boolean }

const join = (...parts: string[]) => parts.join('/').replace(/\\/g, '/').replace(/\/+/g, '/')

/**
 * O que gravar para uma inscrição: caminho, texto e se é acréscimo. Para o
 * AGENTS.md e o docs/decisoes do projeto (o repositório pode ser público), nada
 * que cite o vault ou um caminho pessoal. No ai-memory o caminho é o da página,
 * com a hora no nome, porque `memory_write_page` substitui a de mesmo caminho.
 */
export const writesFor = (i: Inscription, d: { repo: string } & Dests, at: number): Write[] => {
  const date = today(at)
  const note = (title: string) => `---\ntipo: ${title}\ndata: ${date}\norigem: hero-journey\n---\n\n${i.text}\n`
  const already = i.sealed ?? []
  const out: Write[] = []
  for (const dest of i.destinations) {
    if (already.includes(dest) || !available(dest, d)) continue
    if (dest === 'agentsMd') {
      if (mentionsPrivate(i.text, d) || oneLine(i.text) === '') continue
      out.push({ dest, path: join(d.repo, 'AGENTS.md'), text: `- ${oneLine(i.text)} (${date})\n`, append: true })
    } else if (dest === 'projeto') {
      if (mentionsPrivate(i.text, d)) continue
      out.push({ dest, path: join(d.repo, 'docs', 'decisoes', `${date}-${slug(i.text)}.md`), text: note(i.kind === 'conquista' ? 'resultado' : 'decisao'), append: false })
    } else if (dest === 'vaultDecisao') {
      out.push({ dest, path: join(d.vault, d.inbox ?? 'Inbox', `decisao-pendente-${date}-${slug(i.text)}.md`), text: note('decisao'), append: false })
    } else if (dest === 'carreira') {
      out.push({ dest, path: join(d.vault, d.inbox ?? 'Inbox', `resultado-pendente-${date}-${slug(i.text)}.md`), text: note('resultado'), append: false })
    } else {
      const hms = new Date(at).toISOString().slice(11, 19).replace(/:/g, '')
      // Data, origem e "conferir no código": o modelo tende a confiar no que recupera (ClashEval), então a página diz de onde veio.
      const meta = `---\ntipo: ${i.kind === 'conquista' ? 'resultado' : 'decisao'}\ndata: ${date}\norigem: hero-journey\nconferir: no código, antes de seguir\n---\n\n`
      out.push({ dest, path: `${i.kind === 'decisao' ? 'decisions' : 'notes'}/${date}-${slug(i.text)}-${hms}.md`, text: `${meta}# ${oneLine(i.text).slice(0, 80)}\n\n${i.text}\n`, append: false })
    }
  }
  return out
}

/** Regra de privacidade: nada pessoal vai para arquivos do repositório. */
export const mentionsPrivate = (text: string, paths: { vault: string }) => {
  const lower = text.toLowerCase().replace(/\\/g, '/')
  const hit = (p: string) => p !== '' && lower.includes(p.toLowerCase().replace(/\\/g, '/'))
  return (
    hit(paths.vault) ||
    /\b(vault|obsidian|ai-memory)\b/i.test(text) ||
    // Qualquer caminho absoluto pessoal, em qualquer posição: C:\..., D:\..., /Users/x,
    // /home/x, /root/, /mnt/c/..., ~/ e caminhos de rede \\servidor\pasta.
    /\b[a-z]:[\\/]/i.test(text) ||
    /(\/users\/|\/home\/|\/root\/|\/mnt\/[a-z]\/|(^|[\s"'`(])~\/|\\\\[\w.-]+\\)/i.test(text)
  )
}

/** Acrescenta a linha sob "## <heading>" (ou cria a seção no fim). */
export const appendDecision = (current: string, line: string, heading: string) => {
  if (current.includes(line.trim())) return current
  const marker = `## ${heading}`
  const at = current.indexOf(marker)
  if (at === -1) return `${current.replace(/\s*$/, '')}${current.trim() === '' ? '' : '\n\n'}${marker}\n\n${line}`
  const end = current.indexOf('\n## ', at + marker.length)
  const head = end === -1 ? current.replace(/\s*$/, '') : current.slice(0, end).replace(/\s*$/, '')
  const tail = end === -1 ? '' : current.slice(end)
  return `${head}\n${line}${tail}`
}

/** Tira uma linha que o grimório acrescentou (o Desfazer). */
export const removeLine = (current: string, line: string) => {
  const target = line.trim()
  return current
    .split('\n')
    .filter(l => l.trim() !== target)
    .join('\n')
}

/** O registro do que foi gravado, para o Desfazer. */
export const writtenOf = (w: Write, path: string): Written =>
  w.dest === 'aiMemory' ? { dest: w.dest, path, mode: 'pagina' } : w.append ? { dest: w.dest, path, mode: 'linha', line: w.text } : { dest: w.dest, path, mode: 'novo' }

/** O pedido ao Haiku (só com o ⚙ ligado): uma frase, sem inventar. */
export const haikuPrompt = (i: Inscription, lang: 'pt' | 'en') =>
  lang === 'pt'
    ? `Reescreva como uma única frase curta e objetiva, sem inventar nada e sem citar caminhos de arquivo pessoais. Tipo: ${i.kind}. Texto: "${i.text}". Responda só com a frase.`
    : `Rewrite as one short, objective sentence, inventing nothing and citing no personal file paths. Kind: ${i.kind}. Text: "${i.text}". Answer with the sentence only.`

// ---------- Salvar progresso: a tarefa num arquivo ----------

/** O nome do projeto pela pasta do repositório: "C:\\Projetos\\claude-code-hero-journey" → "claude-code-hero-journey". */
export const projectName = (repo: string) => repo.split(/[\\/]/).filter(Boolean).pop() ?? 'projeto'

/**
 * O caminho que pode sair da máquina (no handoff do ai-memory): relativo à
 * primeira raiz que o contém (o vault ou o repositório), sem nome de usuário nem
 * pasta pessoal. Fora delas, só o nome do arquivo.
 */
export const shareablePath = (path: string, roots: readonly string[]) => {
  const norm = (p: string) => p.replace(/\\/g, '/').replace(/\/+$/, '')
  const p = norm(path)
  for (const root of roots.map(norm).filter(r => r !== '')) {
    if (p.toLowerCase().startsWith(`${root.toLowerCase()}/`)) return p.slice(root.length + 1)
  }
  return p.split('/').pop() ?? p
}

/**
 * Onde as tarefas moram. Com vault, em `<vault>/.tarefas/<projeto>/`, com o mesmo
 * nome de projeto do ai-memory (do marcador ou do remoto do git): dois repositórios
 * com a mesma pasta final não se misturam. Sem vault, em `<repo>/.hero/tarefas/`,
 * que o grimório deixa fora do git com um `.gitignore` próprio.
 */
export const progressHome = (repo: string, vault: string, project: string) =>
  vault !== '' ? joinPath(vault, `.tarefas/${project}`) : joinPath(repo, '.hero/tarefas')

/** O prefixo do ID: as iniciais do projeto ("claude-code-hero-journey" → "CCHJ"). */
export const taskPrefix = (name: string) => {
  const initials = name
    .split(/[-_\s.]+/)
    .filter(Boolean)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
    .replace(/[^A-Z0-9]/g, '')
  return initials.slice(0, 4) || 'T'
}

/** O ID seguinte: o maior número já usado com o prefixo, mais um, com três dígitos. */
export const nextTaskId = (files: readonly string[], prefix: string) => {
  const used = files.map(f => new RegExp(`^${prefix}-(\\d+)\\.md$`).exec(f)?.[1]).filter((n): n is string => n !== undefined)
  const n = used.reduce((max, x) => Math.max(max, Number(x)), 0) + 1
  return `${prefix}-${String(n).padStart(3, '0')}`
}

export type Task = {
  id: string
  status: 'aberta' | 'em-andamento' | 'bloqueada' | 'concluida'
  project: string
  updated: string
  title: string
  objective: string
  next: string
  verify: string
  failed: string[]
  log: string[]
}

/** O arquivo da tarefa, no modelo do vault (`.tarefas/_modelo.md`). */
export const taskText = (t: Task) =>
  [
    '---',
    `id: ${t.id}`,
    `status: ${t.status}`,
    `projeto: ${t.project}`,
    `atualizado: ${t.updated}`,
    '---',
    '',
    `# ${t.id}: ${t.title}`,
    '',
    '## Objetivo',
    t.objective,
    '',
    '## Próximo passo',
    t.next,
    '',
    '## Como verificar',
    t.verify,
    '',
    '## Já tentado e falhou',
    ...(t.failed.length === 0 ? ['- (vazio)'] : t.failed.map(f => `- ${f}`)),
    '',
    '## Log',
    ...t.log.map(l => `- ${l}`),
    '',
  ].join('\n')

const section = (text: string, name: string) => {
  const m = new RegExp(`^## ${name}\\s*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm').exec(text)
  return (m?.[1] ?? '').trim()
}
const listOf = (block: string) =>
  block
    .split('\n')
    .map(l => l.replace(/^-\s*/, '').trim())
    .filter(l => l !== '' && l !== '(vazio)')

/** Lê um arquivo de tarefa; devolve undefined se não for uma. */
export const parseTask = (text: string): Task | undefined => {
  const front = /^---\n([\s\S]*?)\n---/.exec(text.replace(/\r\n/g, '\n'))?.[1]
  if (front === undefined) return undefined
  const field = (k: string) => new RegExp(`^${k}:\\s*(.*)$`, 'm').exec(front)?.[1]?.trim() ?? ''
  const body = text.replace(/\r\n/g, '\n')
  const id = field('id')
  if (id === '') return undefined
  const status = field('status')
  return {
    id,
    status: status === 'em-andamento' || status === 'bloqueada' || status === 'concluida' ? status : 'aberta',
    project: field('projeto'),
    updated: field('atualizado'),
    title: (/^# [^:\n]+:\s*(.+)$/m.exec(body)?.[1] ?? id).trim(),
    objective: section(body, 'Objetivo'),
    next: section(body, 'Próximo passo'),
    verify: section(body, 'Como verificar'),
    failed: listOf(section(body, 'Já tentado e falhou')),
    log: listOf(section(body, 'Log')),
  }
}

/** "2026-10-11 18:40", no fuso de quem salvou. */
export const stamp = (at: number) => {
  const d = new Date(at)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export type ProgressInput = {
  id: string
  project: string
  at: number
  title: string
  objective: string
  next: string
  verify: string
  failed: readonly string[]
  /** A linha do log: onde, quem e o que fez ("pc-casa | Claude Code | 4 ações, +42 −8 | a1b2c3d"). */
  logLine: string
}

/**
 * A tarefa salva: nova, ou a anterior atualizada. O próximo passo e o "como
 * verificar" são os de agora (o verificar antigo fica quando a pessoa não
 * escreveu outro); falhas e log só crescem, sem repetir.
 */
export const saveTask = (old: Task | undefined, p: ProgressInput): Task => ({
  id: old?.id ?? p.id,
  status: 'em-andamento',
  project: p.project,
  updated: stamp(p.at),
  title: old?.title ?? p.title,
  objective: old?.objective || p.objective,
  next: p.next || old?.next || '',
  verify: p.verify.trim() || old?.verify || '',
  failed: [...new Set([...(old?.failed ?? []), ...p.failed])].slice(-10),
  log: [...(old?.log ?? []), `${stamp(p.at)} | ${p.logLine}`].slice(-30),
})

/** O pedido que o Continuar leva ao prompt: ler a tarefa e conferir antes de mexer. */
export const continuePrompt = (lang: 'pt' | 'en', title: string, where: string) =>
  lang === 'pt'
    ? `Continue a tarefa "${title}". Leia ${where}, confira o "Como verificar" antes de mexer e siga o próximo passo.`
    : `Continue the task "${title}". Read ${where}, check its "Como verificar" (how to verify) before changing anything, and take the next step.`

/** Limita a espera de uma operação assíncrona e limpa o timer ao concluir. */
export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label}: timeout (${Math.round(ms / 1000)}s)`)), ms)
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}
