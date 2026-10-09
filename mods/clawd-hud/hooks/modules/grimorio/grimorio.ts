// Grimório: acha, sem chamar o modelo, os aprendizados de um turno (decisão
// técnica, conquista com número, preferência de trabalho com IA) e sugere onde
// guardar cada um. Nada é gravado sem o clique da pessoa. O Haiku só entra, se
// ligado no ⚙, para reescrever um candidato numa frase.

import type { Destination, Inscription, InscriptionKind } from '../../../types'

// `(?=\W|$)` no fim, e não `\b`: "regra:" seguido de espaço não tem fronteira de palavra.
const DECISION =
  /\b(decis[ãa]o|decidi(mos)?|optamos|padr[ãa]o adotado|conven[çc][ãa]o|a partir de agora|sempre use|nunca use|regra:|we decided|decision:|convention:|from now on)(?=\W|$)/i
const IMPROVEMENT = /\b(reduz\w*|aument\w*|melhor\w*|caiu|cortou|acelerou|de .{1,30} para|reduced|improved|cut|faster|dropped|went from)\b/i
const NUMBER = /\d+([.,]\d+)?\s?(%|ms|s\b|x\b|vezes|min|segundos|minutos|horas|times|kb|mb)/i
const PREFERENCE = /\b(prefiro|gosto (que|de)|n[ãa]o quero|me responda|sempre me|odeio|detesto|i prefer|i like|i don't want|always give me|never give me)\b/i

const sentences = (text: string) =>
  text
    .replace(/\*\*/g, '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(s => s.length >= 12 && s.length <= 280)

const slug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

/**
 * Destinos sugeridos por tipo. CLAUDE.md e AGENTS.md viram instrução permanente
 * do Claude: nunca vêm marcados, a pessoa marca se quiser.
 */
export const SUGGESTED: Record<InscriptionKind, readonly Destination[]> = {
  decisao: ['vaultDecisao'],
  conquista: ['carreira'],
  preferencia: ['aiMemory'],
}

/** O servidor MCP do ai-memory e o `scope` que a versão dele aceita para preferência. */
export type Memory = { server: string; scope: 'profile' | 'global' }

/** Para onde dá para gravar nesta sessão: a pasta do vault e o ai-memory, se o MCP estiver conectado. */
export type Dests = { vault: string; inbox?: string; memory?: Memory }

/**
 * Acha o `memory_write_page` do ai-memory entre as ferramentas da sessão. O
 * servidor sai do nome da ferramenta, então vale com o servidor renomeado; as
 * versões que têm o perfil entre projetos pedem `scope: "profile"` na descrição.
 */
export const memoryTool = (tools: readonly { name: string; description?: string }[]): Memory | undefined => {
  for (const t of tools) {
    const m = /^mcp__(.+)__memory_write_page$/.exec(t.name)
    if (m?.[1] !== undefined) return { server: m[1], scope: /scope: "profile"/.test(t.description ?? '') ? 'profile' : 'global' }
  }
  return undefined
}

/** Os destinos que existem nesta sessão: sem a pasta ou sem o MCP, o destino some. */
export const available = (dest: Destination, d: Dests) =>
  dest === 'vaultDecisao' || dest === 'carreira' ? d.vault !== '' : dest === 'aiMemory' ? d.memory !== undefined : true

/**
 * A linha que vai para CLAUDE.md e AGENTS.md: uma linha só, sem crase nem tag,
 * com no máximo 280 caracteres. Não neutraliza o sentido de uma frase; a
 * proteção é vir desmarcado e exigir o clique.
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

/** Candidatos de um turno: decisões e conquistas na resposta, preferências na mensagem da pessoa. */
export const detect = (answer: string, prompt: string, turnId: string): Inscription[] => {
  const found: Inscription[] = []
  const add = (kind: InscriptionKind, text: string, source: string) => {
    if (found.some(f => f.text === text)) return
    found.push({ id: `${turnId}-${found.length}-${slug(text)}`, kind, text, source, destinations: [...SUGGESTED[kind]] })
  }
  for (const s of sentences(answer)) {
    if (DECISION.test(s)) add('decisao', s, 'resposta')
    else if (NUMBER.test(s) && IMPROVEMENT.test(s)) add('conquista', s, 'resposta')
  }
  for (const s of sentences(prompt)) if (PREFERENCE.test(s)) add('preferencia', s, 'mensagem')
  return found.slice(0, 4)
}

/** Junta candidatos novos aos pendentes, sem repetir texto já visto. */
export const merge = (current: readonly Inscription[], fresh: readonly Inscription[]) => {
  const seen = new Set(current.map(i => i.text))
  return [...current, ...fresh.filter(i => !seen.has(i.text))].slice(-30)
}

export const pending = (list: readonly Inscription[]) => list.filter(i => i.sealed === undefined)

export const toggleDest = (list: readonly Inscription[], id: string, dest: Destination): Inscription[] =>
  list.map(i =>
    i.id !== id
      ? i
      : { ...i, destinations: i.destinations.includes(dest) ? i.destinations.filter(d => d !== dest) : [...i.destinations, dest] },
  )

const today = (at: number) => new Date(at).toISOString().slice(0, 10)

export type Write = { dest: Destination; path: string; text: string; append: boolean; scope?: 'profile' | 'global' }

/**
 * O que gravar para uma inscrição: caminho, texto e se é acréscimo. Para
 * CLAUDE.md e AGENTS.md o texto é só a decisão: nunca o vault nem caminho
 * pessoal. No ai-memory o caminho é o da página (gravada pelo MCP), com a hora
 * no nome, porque `memory_write_page` substitui a página de mesmo caminho.
 */
export const writesFor = (i: Inscription, d: { repo: string } & Dests, at: number): Write[] => {
  const join = (...parts: string[]) => parts.join('/').replace(/\\/g, '/').replace(/\/+/g, '/')
  const date = today(at)
  const note = (title: string) => `---\ntipo: ${title}\ndata: ${date}\norigem: clawd-hud\n---\n\n${i.text}\n`
  const out: Write[] = []
  for (const dest of i.destinations) {
    if (!available(dest, d)) continue
    if (dest === 'claudeMd' || dest === 'agentsMd') {
      if (mentionsPrivate(i.text, d) || oneLine(i.text) === '') continue
      out.push({ dest, path: join(d.repo, dest === 'claudeMd' ? 'CLAUDE.md' : 'AGENTS.md'), text: `- ${oneLine(i.text)} (${date})\n`, append: true })
    } else if (dest === 'vaultDecisao') {
      out.push({ dest, path: join(d.vault, d.inbox ?? 'Inbox', `decisao-pendente-${date}-${slug(i.text)}.md`), text: note('decisao'), append: false })
    } else if (dest === 'carreira') {
      out.push({ dest, path: join(d.vault, d.inbox ?? 'Inbox', `resultado-pendente-${date}-${slug(i.text)}.md`), text: note('resultado'), append: false })
    } else {
      const hms = new Date(at).toISOString().slice(11, 19).replace(/:/g, '')
      const folder = i.kind === 'preferencia' ? 'workflow' : i.kind === 'decisao' ? 'decisions' : 'notes'
      out.push({
        dest,
        path: `${folder}/${date}-${slug(i.text)}-${hms}.md`,
        text: `# ${oneLine(i.text).slice(0, 80)}\n\n${i.text}\n`,
        append: false,
        ...(i.kind === 'preferencia' && d.memory !== undefined ? { scope: d.memory.scope } : {}),
      })
    }
  }
  return out
}

/** Regra de privacidade do vault: nada pessoal vai para arquivos do repositório. */
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

/** Acrescenta a linha sob "## Decisões" (ou cria a seção no fim). */
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

/** O pedido ao Haiku (só com o ⚙ ligado): uma frase, sem inventar. */
export const haikuPrompt = (i: Inscription, lang: 'pt' | 'en') =>
  lang === 'pt'
    ? `Reescreva como uma única frase curta e objetiva, sem inventar nada e sem citar caminhos de arquivo pessoais. Tipo: ${i.kind}. Texto: "${i.text}". Responda só com a frase.`
    : `Rewrite as one short, objective sentence, inventing nothing and citing no personal file paths. Kind: ${i.kind}. Text: "${i.text}". Answer with the sentence only.`
