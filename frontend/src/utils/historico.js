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
  'Buffet Bellate',
  'Buffet Espaço Villa',
  'Bosque Expo',
  'Centro de Convenções Albano Franco',
  'Clube do Exército CG',
  'Espaço Unique',
  'Hotel Jandaia',
  'Hotel Deville',
  'Chácara Bela Vista',
  'Rancho do Boi',
]

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
