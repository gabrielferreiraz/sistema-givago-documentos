import { useState, useCallback } from 'react'
import { validarCampos, formatarMoeda, limparMoeda, formatarDataBR } from '../utils/form'
import { SpinnerIcon, PDFIcon } from './icons'
import AutocompleteInput from './AutocompleteInput'
import {
  EVENTOS_FIXOS,
  LOCAIS_FIXOS,
  carregarLocais,
  salvarLocal,
  removerLocal,
  carregarHistorico,
  salvarHistorico,
  removerHistorico,
} from '../utils/historico'

const CAMPOS_OBRIGATORIOS = ['nome', 'evento', 'local_evento', 'data_evento', 'horas', 'valor_cache']
// backline e transporte têm validação própria (modo !== 'vazio')

const OPCOES_HORAS = [1, 2, 3]

// Botões que DEFINEM o valor (substituem o que há no campo)
const DEFINIR_VALOR = [
  { label: '1,5k', centavos: 150000 },
  { label: '2k',   centavos: 200000 },
  { label: '2,5k', centavos: 250000 },
  { label: '3k',   centavos: 300000 },
]

const ATALHOS_CAMPO = [
  { label: '500', centavos: 50000 },
  { label: '1k',  centavos: 100000 },
]

const HORAS_PADRAO = 2
const HORAS_EXTRA = 3
const EXTRA_CENTAVOS = 100000

export default function FormOrcamento({ values, onChange, onSubmit, onPreencherTudo }) {
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Locais — recarrega do localStorage sempre que necessário
  const [locaisState, setLocaisState] = useState(() => carregarLocais())
  const [historico, setHistorico] = useState(() => carregarHistorico())

  const set = (field, value) => {
    onChange(field, value)
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }))
  }

  const horasSelecionadas = parseInt(values.horas || '0', 10)
  const temValor = limparMoeda(values.valor_cache) > 0
  const mostrarExtra = horasSelecionadas === HORAS_EXTRA && temValor

  const adicionarExtra = () => {
    const atual = Math.round(limparMoeda(values.valor_cache) * 100)
    set('valor_cache', formatarMoeda(String(atual + EXTRA_CENTAVOS)))
  }

  // Define o valor exato (substitui o campo)
  const definirValor = (centavos) => {
    set('valor_cache', formatarMoeda(String(centavos)))
  }

  // Ajuste fino: soma ou subtrai (mínimo R$ 0)
  const ajustarValor = (delta) => {
    const atual = Math.round(limparMoeda(values.valor_cache) * 100)
    const novo = Math.max(0, atual + delta)
    set('valor_cache', formatarMoeda(String(novo)))
  }

  const zerarValor = () => set('valor_cache', '')

  // ── Locais ──────────────────────────────────────────────────────────────────
  const handleSalvarLocal = useCallback((local) => {
    salvarLocal(local)
    setLocaisState(carregarLocais())
  }, [])

  const handleDeletarLocal = useCallback((local) => {
    removerLocal(local)
    setLocaisState(carregarLocais())
  }, [])

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const erros = validarCampos(values, CAMPOS_OBRIGATORIOS)

    // Valida campos opcionais obrigatórios
    if (values.backline_modo === 'vazio') erros.backline = true
    if (values.backline_modo === 'valor' && !values.backline) erros.backline = true
    if (values.transporte_modo === 'vazio') erros.transporte = true
    if (values.transporte_modo === 'valor' && !values.transporte) erros.transporte = true

    if (Object.keys(erros).length > 0) {
      setErrors(erros)
      document.getElementById(Object.keys(erros)[0])
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSubmitting(true)
    const sucesso = await onSubmit(values)
    setSubmitting(false)

    if (sucesso) {
      salvarHistorico(values)
      setHistorico(carregarHistorico())
    }
  }

  // ── Histórico ───────────────────────────────────────────────────────────────
  const handleUsarNovamente = (item) => {
    onPreencherTudo(item)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRemoverHistorico = (ts) => {
    removerHistorico(ts)
    setHistorico(carregarHistorico())
  }

  return (
    <div className="w-full max-w-xl animate-slide-up">
      <form onSubmit={handleSubmit} noValidate>

        {/* ── Nome do contratante ───────────────────────────── */}
        <Field id="nome" label="Nome do contratante" error={errors.nome}>
          <input
            id="nome"
            className={`input-field ${errors.nome ? 'border-red-500' : ''}`}
            value={values.nome}
            onChange={e => set('nome', e.target.value)}
            placeholder="Nome de quem está contratando"
            autoComplete="name"
            enterKeyHint="next"
          />
        </Field>

        {/* ── Evento (autocomplete fixo) ────────────────────── */}
        <Field id="evento" label="Evento" error={errors.evento}>
          <AutocompleteInput
            id="evento"
            value={values.evento}
            onChange={v => set('evento', v)}
            placeholder="Ex: Casamento, Aniversário..."
            error={errors.evento}
            opcoes={EVENTOS_FIXOS}
          />
        </Field>

        {/* ── Local (autocomplete + salvar) ─────────────────── */}
        <Field id="local_evento" label="Local" error={errors.local_evento}>
          <AutocompleteInput
            id="local_evento"
            value={values.local_evento}
            onChange={v => set('local_evento', v)}
            placeholder="Nome do local ou endereço"
            error={errors.local_evento}
            opcoes={locaisState.todos}
            opcoesExtras={locaisState.salvos}
            onSalvar={handleSalvarLocal}
            onDeletar={handleDeletarLocal}
          />
        </Field>

        {/* ── Data do evento ────────────────────────────────── */}
        <Field id="data_evento" label="Data do evento" error={errors.data_evento}>
          <input
            id="data_evento"
            type="date"
            className={`input-field ${errors.data_evento ? 'border-red-500' : ''}`}
            value={values.data_evento}
            onChange={e => set('data_evento', e.target.value)}
          />
        </Field>

        {/* ── Horário (opcional) ────────────────────────────── */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Horário</label>
            <button
              type="button"
              onClick={() => set('incluir_horario', !values.incluir_horario)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold font-body
                transition-all active:scale-95 select-none
                ${values.incluir_horario
                  ? 'bg-gold-500 border-gold-500 text-stage-900'
                  : 'border-stage-500 text-gray-400 hover:border-stage-400 hover:text-gray-200 bg-stage-700'
                }`}
              style={{ fontSize: 13 }}
            >
              {values.incluir_horario ? <><CheckIcon /> Incluído</> : <>+ Incluir horário</>}
            </button>
          </div>

          {values.incluir_horario && (
            <div className="relative animate-fade-in">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input
                id="horario"
                type="text"
                className="input-field font-mono pl-10 tracking-widest"
                value={values.horario}
                onChange={e => set('horario', mascaraHorario(e.target.value))}
                placeholder="00:00"
                maxLength={5}
                inputMode="numeric"
                autoFocus
              />
              {/^\d{2}:\d{2}$/.test(values.horario) && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Horas ─────────────────────────────────────────── */}
        <Field id="horas" label="Quantas horas tocar" error={errors.horas}>
          <div className="grid grid-cols-3 gap-2">
            {OPCOES_HORAS.map(h => {
              const ativo = values.horas === String(h)
              const ehPadrao = h === HORAS_PADRAO
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => set('horas', String(h))}
                  className={`relative rounded-xl border font-bold font-body transition-all active:scale-95 select-none
                    ${ativo
                      ? 'bg-gold-500 border-gold-500 text-stage-900'
                      : 'border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gray-200 bg-stage-700'
                    }`}
                  style={{ minHeight: 52, fontSize: 15 }}
                >
                  {h}h
                  {ehPadrao && !ativo && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gold-600 opacity-60" />
                  )}
                </button>
              )
            })}
          </div>
          {errors.horas && <p className="text-red-400 text-xs mt-1.5 font-body">Selecione a duração</p>}
        </Field>

        {/* ── Valor do cachê ────────────────────────────────── */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="valor_cache" className="label mb-0">Valor do cachê (R$)</label>
            {mostrarExtra && (
              <button
                type="button"
                onClick={adicionarExtra}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold-500/10
                  border border-gold-500/40 text-gold-400 hover:bg-gold-500/20
                  active:scale-95 transition-all select-none animate-fade-in"
                style={{ fontSize: 13 }}
                title="Adicionar R$ 1.000 pela hora extra"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-bold font-body">+1k</span>
              </button>
            )}
          </div>

          <div className="relative">
            <input
              id="valor_cache"
              className={`input-field font-mono text-gold-400 pr-10 ${errors.valor_cache ? 'border-red-500' : ''}`}
              value={values.valor_cache}
              onChange={e => set('valor_cache', formatarMoeda(e.target.value))}
              placeholder="R$ 0,00"
              inputMode="numeric"
              autoComplete="off"
            />
            {temValor && (
              <button
                type="button"
                onClick={zerarValor}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
                  bg-stage-500 hover:bg-red-500/30 text-gray-400 hover:text-red-400
                  flex items-center justify-center transition-colors active:scale-90"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {errors.valor_cache && <p className="text-red-400 text-xs mt-1.5 font-body">Campo obrigatório</p>}

          {/* Linha 1: define o valor exato com 1 toque */}
          <div className="flex gap-2 mt-2">
            {DEFINIR_VALOR.map(({ label, centavos }) => {
              const ativo = Math.round(limparMoeda(values.valor_cache) * 100) === centavos
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => definirValor(centavos)}
                  className={`flex-1 py-2 rounded-lg border font-bold font-body text-xs
                    transition-all active:scale-95 select-none
                    ${ativo
                      ? 'bg-gold-500/20 border-gold-500 text-gold-400'
                      : 'border-stage-500 text-gray-500 hover:border-gold-600 hover:text-gold-400 bg-stage-700'
                    }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Linha 2: ajuste fino de ±100 — aparece só quando há valor */}
          {temValor && (
            <div className="flex items-center gap-2 mt-1.5 animate-fade-in">
              <span className="text-gray-600 font-body select-none" style={{ fontSize: 11 }}>ajuste</span>
              <button
                type="button"
                onClick={() => ajustarValor(-10000)}
                className="flex-1 py-1.5 rounded-lg border border-stage-500 bg-stage-700
                  text-gray-500 hover:border-red-500/50 hover:text-red-400
                  font-bold font-body transition-all active:scale-95 select-none"
                style={{ fontSize: 12 }}
              >
                −100
              </button>
              <button
                type="button"
                onClick={() => ajustarValor(10000)}
                className="flex-1 py-1.5 rounded-lg border border-stage-500 bg-stage-700
                  text-gray-500 hover:border-gold-600 hover:text-gold-400
                  font-bold font-body transition-all active:scale-95 select-none"
                style={{ fontSize: 12 }}
              >
                +100
              </button>
            </div>
          )}
        </div>

        {/* ── Backline ──────────────────────────────────────── */}
        <CampoOpcional
          id="backline"
          label="Backline"
          value={values.backline}
          onChange={v => set('backline', v)}
          modo={values.backline_modo}
          onModoChange={m => set('backline_modo', m)}
          error={errors.backline}
        />

        {/* ── Transporte ────────────────────────────────────── */}
        <CampoOpcional
          id="transporte"
          label="Transporte"
          value={values.transporte}
          onChange={v => set('transporte', v)}
          modo={values.transporte_modo}
          onModoChange={m => set('transporte_modo', m)}
          error={errors.transporte}
        />

        {/* ── Número ────────────────────────────────────────── */}
        <Field id="numero" label="Número do orçamento">
          <input
            id="numero"
            className="input-field font-mono text-gray-500"
            value={values.numero}
            onChange={e => set('numero', e.target.value)}
            autoComplete="off"
          />
        </Field>

        <div className="mt-6 mb-2">
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting
              ? <><SpinnerIcon /> Gerando...</>
              : <><PDFIcon /> Gerar Orçamento</>
            }
          </button>
        </div>

      </form>

      {/* ── Orçamentos Recentes ───────────────────────────────── */}
      {historico.length > 0 && (
        <HistoricoRecente
          historico={historico.slice(0, 5)}
          onUsarNovamente={handleUsarNovamente}
          onRemover={handleRemoverHistorico}
        />
      )}
    </div>
  )
}

// ─── Histórico ────────────────────────────────────────────────────────────────

function HistoricoRecente({ historico, onUsarNovamente, onRemover }) {
  return (
    <div className="mt-8">
      <h3 className="label mb-3">Orçamentos Recentes</h3>
      <div className="space-y-2">
        {historico.map(item => (
          <div
            key={item._ts}
            className="card p-4 flex items-start justify-between gap-3 hover:border-stage-500 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-body font-bold text-white truncate" style={{ fontSize: 15 }}>
                {item.nome}
              </p>
              <p className="text-gray-400 truncate" style={{ fontSize: 13 }}>
                {item.evento} · {item.local_evento}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-gray-500 font-mono" style={{ fontSize: 12 }}>
                  {item.data_evento ? formatarDataBR(item.data_evento) : '—'}
                </span>
                <span className="text-gold-500 font-mono font-bold" style={{ fontSize: 12 }}>
                  {item.valor_cache}
                </span>
                <span className="text-gray-700" style={{ fontSize: 11 }}>
                  {new Date(item._ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onUsarNovamente(item)}
                className="px-3 py-1.5 rounded-lg border border-stage-500 text-gray-400
                  hover:border-gold-600 hover:text-gold-400 font-bold font-body
                  transition-all active:scale-95 select-none"
                style={{ fontSize: 12 }}
                title="Preencher com esses dados"
              >
                Usar
              </button>
              <button
                type="button"
                onClick={() => onRemover(item._ts)}
                className="w-7 h-7 rounded-lg flex items-center justify-center
                  text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Remover do histórico"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-gray-700 mt-3 font-body" style={{ fontSize: 12 }}>
        💾 Dados salvos neste dispositivo. Em outro aparelho, salve os locais novamente.
      </p>
    </div>
  )
}

// ─── CampoOpcional ────────────────────────────────────────────────────────────

function CampoOpcional({ id, label, value, onChange, modo, onModoChange, error }) {
  const selecionarModo = (novoModo) => {
    if (novoModo === modo) {
      onModoChange('vazio'); onChange('')
    } else if (novoModo === 'incluso') {
      onModoChange('incluso'); onChange('incluso')
    } else {
      onModoChange('valor'); onChange('')
    }
  }

  return (
    <div className="mb-4" id={id}>
      <div className="flex items-center justify-between mb-2">
        <label className="label mb-0">
          {label}
          {error && modo === 'vazio' && (
            <span className="ml-2 text-red-400 normal-case tracking-normal font-normal" style={{ fontSize: 11 }}>
              — obrigatório
            </span>
          )}
        </label>
        <div className={`flex bg-stage-700 rounded-lg p-0.5 gap-0.5 transition-colors ${error && modo === 'vazio' ? 'ring-1 ring-red-500/50' : ''}`}>
          <ToggleBtn active={modo === 'incluso'} onClick={() => selecionarModo('incluso')}>
            Incluso
          </ToggleBtn>
          <ToggleBtn active={modo === 'valor'} onClick={() => selecionarModo('valor')}>
            Informar valor
          </ToggleBtn>
        </div>
      </div>

      {modo === 'valor' && (
        <div className="relative animate-fade-in">
          <input
            id={`${id}_input`}
            className={`input-field font-mono text-gold-400 ${error && !value ? 'border-red-500' : ''}`}
            style={{ paddingRight: value ? '7rem' : '5.5rem' }}
            value={value}
            onChange={e => onChange(formatarMoeda(e.target.value))}
            placeholder="R$ 0,00"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {ATALHOS_CAMPO.map(({ label: lbl, centavos }) => (
              <button
                key={lbl}
                type="button"
                onClick={() => {
                  const atual = Math.round(limparMoeda(value) * 100)
                  onChange(formatarMoeda(String(atual + centavos)))
                }}
                className="px-1.5 py-0.5 rounded text-gold-400 bg-stage-500 hover:bg-gold-500/20
                  font-bold font-body transition-colors active:scale-90 select-none"
                style={{ fontSize: 11 }}
              >
                +{lbl}
              </button>
            ))}
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="w-5 h-5 rounded-full bg-stage-500 hover:bg-red-500/30
                  text-gray-400 hover:text-red-400 flex items-center justify-center
                  transition-colors active:scale-90 ml-0.5"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {error && !value && (
            <p className="text-red-400 text-xs mt-1.5 font-body">Informe o valor</p>
          )}
        </div>
      )}

      {modo === 'incluso' && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-stage-500 bg-stage-700 animate-fade-in">
          <svg className="w-4 h-4 text-gold-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-gray-300 font-body" style={{ fontSize: 15 }}>Incluso no cachê</span>
        </div>
      )}
    </div>
  )
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 rounded-md font-bold font-body transition-all select-none active:scale-95
        ${active ? 'bg-gold-500 text-stage-900' : 'text-gray-400 hover:text-gray-200'}`}
      style={{ fontSize: 12, minHeight: 32 }}
    >
      {children}
    </button>
  )
}

function mascaraHorario(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  const hh = Math.min(parseInt(digits.slice(0, 2), 10), 23).toString().padStart(2, '0')
  const mm = digits.slice(2)
  return `${hh}:${mm.length === 2 ? Math.min(parseInt(mm, 10), 59).toString().padStart(2, '0') : mm}`
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function Field({ id, label, children, error }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1.5 font-body">Campo obrigatório</p>}
    </div>
  )
}
