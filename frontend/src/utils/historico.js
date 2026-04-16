// ─── Histórico de orçamentos ──────────────────────────────────────────────────

const KEY_HISTORICO = 'givago_historico'
const MAX_HISTORICO = 10

export function salvarHistorico(values) {
  const existente = carregarHistorico()
  const novo = { ...values, _ts: new Date().toISOString() }
  const atualizado = [novo, ...existente].slice(0, MAX_HISTORICO)
  localStorage.setItem(KEY_HISTORICO, JSON.stringify(atualizado))
}

export function carregarHistorico() {
  try {
    return JSON.parse(localStorage.getItem(KEY_HISTORICO) || '[]')
  } catch {
    return []
  }
}

export function removerHistorico(ts) {
  const atualizado = carregarHistorico().filter(h => h._ts !== ts)
  localStorage.setItem(KEY_HISTORICO, JSON.stringify(atualizado))
}

// ─── Locais salvos ────────────────────────────────────────────────────────────

const KEY_LOCAIS = 'givago_locais'

export const LOCAIS_FIXOS = [
  // Campo Grande
  'Espaço Bellatê',
  'Bosque Expo',
  'Centro de Convenções Albano Franco',
  'Círculo Militar CG',
  'Hotel Jandaia',
  'Hotel Deville Prime',
  'Espaço Adepol',
  'Ondara Buffet',
  'Spazzio Cristina Martinez',
  'Grand Mère Buffet',
  'Buffet Jacarandá',
  'Espaço Raymundo\'s',
  'Chácara Bela Vista',
  'Rancho do Boi',
  // Dourados
  'Centro de Convenções Dourados',
  'Dourados Clube',
]

/**
 * Endereços conhecidos dos locais fixos.
 * Lookup local — sem API, sem erro, funciona offline.
 * Chave deve bater exatamente com o nome em LOCAIS_FIXOS.
 */
export const ENDERECOS_LOCAIS = {
  'Espaço Bellatê':                    'R. São Paulo, 395 — São Francisco, Campo Grande/MS',
  'Bosque Expo':                        'Av. Cônsul Assaf Trad, 4796 — Parque Novos Estados, Campo Grande/MS',
  'Centro de Convenções Albano Franco': 'Av. Mato Grosso, 5017 — Carandá Bosque, Campo Grande/MS',
  'Círculo Militar CG':                 'Av. Afonso Pena, 107 — Amambaí, Campo Grande/MS',
  'Hotel Jandaia':                      'R. Barão do Rio Branco, 1271 — Centro, Campo Grande/MS',
  'Hotel Deville Prime':                'Av. Mato Grosso, 4250 — Carandá Bosque, Campo Grande/MS',
  'Espaço Adepol':                      'R. Dr. Robison Benedito Maia, 321 — Carandá Bosque, Campo Grande/MS',
  'Ondara Buffet':                      'R. Dr. Mario Gonçalves, 129 — Chácara Cachoeira, Campo Grande/MS',
  'Espaço Raymundo\'s':                 'R. Vitório Zeola, 1786 — Carandá Bosque, Campo Grande/MS',
}

/**
 * Retorna o endereço de referência para um local, ou '' se não cadastrado.
 */
export function buscarEnderecoLocal(nomeLocal) {
  if (!nomeLocal) return ''
  // Busca exata primeiro
  if (ENDERECOS_LOCAIS[nomeLocal]) return ENDERECOS_LOCAIS[nomeLocal]
  // Busca parcial (case-insensitive) — útil quando o usuário digitou parcialmente
  const lower = nomeLocal.toLowerCase()
  const chave = Object.keys(ENDERECOS_LOCAIS).find(k => k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase()))
  return chave ? ENDERECOS_LOCAIS[chave] : ''
}

export function carregarLocais() {
  try {
    const salvos = JSON.parse(localStorage.getItem(KEY_LOCAIS) || '[]')
    // Merge: fixos primeiro, depois salvos sem duplicatas
    const todos = [...LOCAIS_FIXOS]
    salvos.forEach(l => { if (!todos.includes(l)) todos.push(l) })
    return { todos, salvos }
  } catch {
    return { todos: LOCAIS_FIXOS, salvos: [] }
  }
}

export function salvarLocal(local) {
  const { salvos } = carregarLocais()
  const trimmed = local.trim()
  if (trimmed && !salvos.includes(trimmed)) {
    localStorage.setItem(KEY_LOCAIS, JSON.stringify([...salvos, trimmed]))
  }
}

export function removerLocal(local) {
  const { salvos } = carregarLocais()
  localStorage.setItem(KEY_LOCAIS, JSON.stringify(salvos.filter(l => l !== local)))
}

// ─── Eventos ─────────────────────────────────────────────────────────────────

export const EVENTOS_FIXOS = [
  'Aniversário',
  'Casamento',
  'Formatura',
  'Festa Corporativa',
  'Congresso',
  'Confraternização',
  'Festa Junina',
  'Debutante',
  'Bodas',
  'Batizado',
  'Evento Religioso',
]

const KEY_EVENTOS = 'givago_eventos'

export function carregarEventos() {
  try {
    const salvos = JSON.parse(localStorage.getItem(KEY_EVENTOS) || '[]')
    const todos = [...EVENTOS_FIXOS]
    salvos.forEach(e => { if (!todos.includes(e)) todos.push(e) })
    return { todos, salvos }
  } catch {
    return { todos: EVENTOS_FIXOS, salvos: [] }
  }
}

export function salvarEvento(evento) {
  const { salvos } = carregarEventos()
  const trimmed = evento.trim()
  if (trimmed && !salvos.includes(trimmed)) {
    localStorage.setItem(KEY_EVENTOS, JSON.stringify([...salvos, trimmed]))
  }
}

export function removerEvento(evento) {
  const { salvos } = carregarEventos()
  localStorage.setItem(KEY_EVENTOS, JSON.stringify(salvos.filter(e => e !== evento)))
}

// ─── Frases do rodapé salvas pelo usuário ────────────────────────────────────

const KEY_FRASES = 'givago_frases_rodape'

export function carregarFrasesRodape() {
  try {
    return JSON.parse(localStorage.getItem(KEY_FRASES) || '[]')
  } catch {
    return []
  }
}

export function salvarFraseRodape(frase) {
  const salvos = carregarFrasesRodape()
  const trimmed = frase.trim()
  if (trimmed && !salvos.includes(trimmed)) {
    localStorage.setItem(KEY_FRASES, JSON.stringify([trimmed, ...salvos]))
  }
}

export function removerFraseRodape(frase) {
  const salvos = carregarFrasesRodape()
  localStorage.setItem(KEY_FRASES, JSON.stringify(salvos.filter(f => f !== frase)))
}
