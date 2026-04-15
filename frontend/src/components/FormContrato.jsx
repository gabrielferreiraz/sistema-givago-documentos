import { useState, useRef, useEffect } from 'react'
import { formatarMoeda, limparMoeda, formatarTelefone, formatarCpfCnpj, validarCampos, formatarCEP } from '../utils/form'
import { SpinnerIcon, PDFIcon } from './icons'
import AutocompleteInput from './AutocompleteInput'
import { carregarLocais, salvarLocal, removerLocal, buscarEnderecoLocal, carregarEventos, salvarEvento, removerEvento } from '../utils/historico'
import { buscarLocaisOnline } from '../utils/places'

const FRASES_POR_EVENTO = {
  casamento:    ['Depois do Sim, é hora do Show', 'O amor merece a melhor trilha sonora', 'Que a música seja tão eterna quanto o seu amor', 'Uma noite inesquecível começa com a música certa'],
  formatura:    ['Depois do diploma, é hora de celebrar', 'O fim de um ciclo, o início de uma festa', 'Você estudou muito, agora é hora de dançar', 'Conquistas assim merecem ser celebradas com muito show'],
  debutante:    ['Seus 15 anos merecem o melhor show', 'Uma princesa merece uma festa inesquecível', '15 anos: a festa da sua vida começa agora', 'Que essa noite seja tão especial quanto você'],
  aniversario:  ['Parabéns com muita música!', 'A melhor forma de comemorar é com muito show', 'Sua festa, sua música, sua noite', 'Anos que merecem ser celebrados com muito ritmo'],
  corporativo:  ['O sucesso do seu evento começa aqui', 'Negócios sérios, festa ainda mais séria', 'Uma equipe que celebra junta, cresce junta', 'O melhor encerramento para um grande evento'],
  junina:       ['Arraiá com muito forró!', 'Quadrilha, forró e muito show!', 'São João do jeito que tem que ser', 'A festa mais animada do ano merece o melhor show'],
  bodas:        ['Décadas juntos merecem uma noite inesquecível', 'O amor que dura merece ser celebrado com muito show', 'Anos de amor, uma noite de pura celebração', 'Que essa data seja tão especial quanto a primeira vez'],
  batizado:     ['Uma vida que começa merece ser celebrada com alegria', 'Bem-vindo ao mundo, que a música marque esse momento', 'Uma benção tão grande merece uma festa à altura', 'O primeiro grande dia de uma história incrível'],
  religioso:    ['Fé e música: uma combinação que eleva a alma', 'Que a música seja um instrumento de celebração e gratidão', 'Um momento de fé merece ser marcado com muito louvor', 'Celebrando a fé com a melhor música'],
  geral:        ['Música que transforma momentos em memórias', 'Cada evento é único, cada show é especial', 'A noite perfeita começa com a música certa', 'Momentos assim merecem ser lembrados para sempre'],
}

function nicho(nomeEvento) {
  const n = (nomeEvento || '').toLowerCase()
  if (n.includes('casamento'))   return 'casamento'
  if (n.includes('formatura'))   return 'formatura'
  if (n.includes('debutante'))   return 'debutante'
  if (n.includes('aniversár') || n.includes('aniversar')) return 'aniversario'
  if (n.includes('corporativa') || n.includes('congresso') || n.includes('confraterniz')) return 'corporativo'
  if (n.includes('junina'))      return 'junina'
  if (n.includes('bodas'))       return 'bodas'
  if (n.includes('batizado'))    return 'batizado'
  if (n.includes('religioso'))   return 'religioso'
  return 'geral'
}

function fraseAleatoria(nomeEvento, atual) {
  const lista = FRASES_POR_EVENTO[nicho(nomeEvento)]
  if (lista.length === 1) return lista[0]
  const restante = lista.filter(f => f !== atual)
  return restante[Math.floor(Math.random() * restante.length)]
}

const FORMAS_PAGAMENTO = [
  '30% na assinatura + 70% antes do evento',
  '50% antecipado + 50% no dia',
  'À vista',
  'Parcelado (a combinar)',
]

const CAMPOS_BASE = [
  'nome_contratante', 'cpf_cnpj', 'telefone',
  'endereco_rua', 'endereco_numero', 'endereco_bairro', 'cidade_estado_contratante',
  'nome_evento', 'data_evento', 'horas',
  'local_evento', 'valor_cache', 'forma_pagamento', 'data_assinatura',
]

const OPCOES_HORAS = [1, 2, 3]

const DEFINIR_VALOR = [
  { label: '1,5k', centavos: 150000 },
  { label: '2k',   centavos: 200000 },
  { label: '2,5k', centavos: 250000 },
  { label: '3k',   centavos: 300000 },
]
const CAMPOS_CPF_EXTRA = ['rg', 'ssp_uf']


/**
 * FormContrato é um componente controlado (mesma arquitetura do FormOrcamento).
 * Estado vive no App — trocar de aba não perde os dados.
 */
export default function FormContrato({ values, onChange, onSubmit }) {
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [cepErro, setCepErro] = useState('')
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const [cnpjErro, setCnpjErro] = useState('')
  const [cnpjOk, setCnpjOk] = useState(false)
  const [locaisState, setLocaisState] = useState(() => carregarLocais())
  const [eventosState, setEventosState] = useState(() => carregarEventos())
  const [placesOnline, setPlacesOnline] = useState([])
  const debounceRef = useRef(null)

  // Sorteia frase automática sempre que evento ou modo muda
  useEffect(() => {
    if (values.frase_rodape_ativo && values.frase_rodape_modo === 'auto') {
      onChange('frase_rodape_auto', fraseAleatoria(values.nome_evento, values.frase_rodape_auto))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.nome_evento, values.frase_rodape_modo, values.frase_rodape_ativo])

  const reloadFrase = () =>
    onChange('frase_rodape_auto', fraseAleatoria(values.nome_evento, values.frase_rodape_auto))

  const set = (field, value) => {
    onChange(field, value)
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }))
  }

  const handleCpfCnpj = async (raw) => {
    const formatted = formatarCpfCnpj(raw)
    set('cpf_cnpj', formatted)
    setCnpjErro('')
    setCnpjOk(false)

    const digits = formatted.replace(/\D/g, '')
    if (digits.length !== 14) return  // só busca quando for CNPJ completo

    setCnpjLoading(true)
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
      if (!res.ok) {
        setCnpjErro('CNPJ não encontrado.')
        return
      }
      const data = await res.json()

      if (data.razao_social) {
        onChange('nome_contratante', data.razao_social)
        setErrors(prev => ({ ...prev, nome_contratante: false }))
      }
      if (data.ddd_telefone_1) {
        const tel = data.ddd_telefone_1.replace(/\D/g, '')
        onChange('telefone', formatarTelefone(tel))
        setErrors(prev => ({ ...prev, telefone: false }))
      }
      if (data.cep) {
        const cepFormatado = formatarCEP(data.cep.replace(/\D/g, ''))
        onChange('cep', cepFormatado)
      }
      if (data.logradouro) {
        onChange('endereco_rua', data.logradouro)
        setErrors(prev => ({ ...prev, endereco_rua: false }))
      }
      if (data.numero) {
        onChange('endereco_numero', data.numero)
        setErrors(prev => ({ ...prev, endereco_numero: false }))
      }
      if (data.bairro) {
        onChange('endereco_bairro', data.bairro)
        setErrors(prev => ({ ...prev, endereco_bairro: false }))
      }
      if (data.municipio && data.uf) {
        onChange('cidade_estado_contratante', `${data.municipio}/${data.uf}`)
        setErrors(prev => ({ ...prev, cidade_estado_contratante: false }))
      }

      setCnpjOk(true)
    } catch {
      setCnpjErro('Erro ao buscar CNPJ. Verifique sua conexão.')
    } finally {
      setCnpjLoading(false)
    }
  }

  const handleSalvarEvento = (evento) => {
    salvarEvento(evento)
    setEventosState(carregarEventos())
  }

  const handleDeletarEvento = (evento) => {
    removerEvento(evento)
    setEventosState(carregarEventos())
  }

  const handleSalvarLocal = (local) => {
    salvarLocal(local)
    setLocaisState(carregarLocais())
  }

  const handleDeletarLocal = (local) => {
    removerLocal(local)
    setLocaisState(carregarLocais())
  }

  const handleLocalChange = (v) => {
    set('local_evento', v)
    setPlacesOnline([])
    // Lookup local imediato
    const endLocal = buscarEnderecoLocal(v)
    if (endLocal) { set('endereco_local_evento', endLocal); return }
    // Busca online com debounce
    clearTimeout(debounceRef.current)
    if (v.trim().length >= 3) {
      debounceRef.current = setTimeout(async () => {
        const resultados = await buscarLocaisOnline(v)
        setPlacesOnline(resultados)
      }, 500)
    }
  }

  const handleCEP = async (raw) => {
    const formatted = formatarCEP(raw)
    set('cep', formatted)
    setCepErro('')

    const digits = formatted.replace(/\D/g, '')
    if (digits.length !== 8) return

    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepErro('CEP não encontrado.')
        return
      }
      onChange('endereco_rua', data.logradouro || '')
      onChange('endereco_bairro', data.bairro || '')
      onChange('cidade_estado_contratante', data.localidade && data.uf ? `${data.localidade}/${data.uf}` : '')
      setErrors(prev => ({
        ...prev,
        endereco_rua: false,
        endereco_bairro: false,
        cidade_estado_contratante: false,
      }))
    } catch {
      setCepErro('Erro ao buscar CEP. Verifique sua conexão.')
    } finally {
      setCepLoading(false)
    }
  }

  const temValor = limparMoeda(values.valor_cache) > 0
  const ajustarValor = (delta) => {
    const atual = Math.round(limparMoeda(values.valor_cache) * 100)
    set('valor_cache', formatarMoeda(String(Math.max(0, atual + delta))))
  }
  const zerarValor = () => set('valor_cache', '')

  const isCNPJ = values.cpf_cnpj.replace(/\D/g, '').length === 14

  const handleSubmit = async (e) => {
    e.preventDefault()
    const campos = isCNPJ ? CAMPOS_BASE : [...CAMPOS_BASE, ...CAMPOS_CPF_EXTRA]
    const erros = validarCampos(values, campos)
    if (Object.keys(erros).length > 0) {
      setErrors(erros)
      document.getElementById(Object.keys(erros)[0])
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-2xl animate-slide-up">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* ── Identificação ───────────────────────────────── */}
        <Section title="Identificação">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="numero" label="Número do contrato">
              <input
                id="numero"
                className="input-field font-mono text-gray-500"
                value={values.numero}
                onChange={e => set('numero', e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Field id="data_assinatura" label="Data de assinatura" error={errors.data_assinatura} required>
              <input
                id="data_assinatura"
                type="date"
                className={`input-field ${errors.data_assinatura ? 'border-red-500' : ''}`}
                value={values.data_assinatura}
                onChange={e => set('data_assinatura', e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* ── Contratante ─────────────────────────────────── */}
        <Section title="Contratante">
          <div className="space-y-4">

            <Field id="nome_contratante" label="Nome completo" error={errors.nome_contratante} required>
              <input
                id="nome_contratante"
                className={`input-field ${errors.nome_contratante ? 'border-red-500' : ''}`}
                value={values.nome_contratante}
                onChange={e => set('nome_contratante', e.target.value)}
                placeholder="Nome do contratante ou empresa"
                autoComplete="name"
                enterKeyHint="next"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="cpf_cnpj" label="CPF / CNPJ" error={errors.cpf_cnpj} required>
                <div className="relative">
                  <input
                    id="cpf_cnpj"
                    className={`input-field font-mono pr-10 ${errors.cpf_cnpj ? 'border-red-500' : ''}`}
                    value={values.cpf_cnpj}
                    onChange={e => handleCpfCnpj(e.target.value)}
                    placeholder="000.000.000-00"
                    autoComplete="off"
                    inputMode="numeric"
                    maxLength={18}
                  />
                  {cnpjLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-gold-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                    </div>
                  )}
                  {!cnpjLoading && cnpjOk && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  )}
                </div>
                {cnpjErro && <p className="text-amber-400 text-xs mt-1.5 font-body">{cnpjErro}</p>}
                {!cnpjErro && cnpjOk && <p className="text-green-400 text-xs mt-1.5 font-body">Dados da empresa preenchidos automaticamente</p>}
              </Field>
              <Field id="telefone" label="Telefone / WhatsApp" error={errors.telefone} required>
                <input
                  id="telefone"
                  type="tel"
                  className={`input-field font-mono ${errors.telefone ? 'border-red-500' : ''}`}
                  value={values.telefone}
                  onChange={e => set('telefone', formatarTelefone(e.target.value))}
                  placeholder="(67) 99999-9999"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={15}
                />
              </Field>
            </div>

            {!isCNPJ && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="rg" label="RG" error={errors.rg} required>
                <input
                  id="rg"
                  className={`input-field font-mono ${errors.rg ? 'border-red-500' : ''}`}
                  value={values.rg}
                  onChange={e => set('rg', e.target.value)}
                  placeholder="0000000"
                  autoComplete="off"
                  enterKeyHint="next"
                />
              </Field>
              <Field id="ssp_uf" label="Órgão emissor" error={errors.ssp_uf} required>
                <input
                  id="ssp_uf"
                  className={`input-field ${errors.ssp_uf ? 'border-red-500' : ''}`}
                  value={values.ssp_uf}
                  onChange={e => set('ssp_uf', e.target.value.toUpperCase())}
                  placeholder="SSP/MS"
                  autoComplete="off"
                  enterKeyHint="next"
                  maxLength={10}
                />
              </Field>
            </div>
            )}

            {/* Endereço do contratante */}
            <div className="space-y-3">
              <p className="text-xs font-body text-gray-500 uppercase tracking-wider">Endereço do contratante</p>

              {/* CEP com busca automática */}
              <Field id="cep" label="CEP">
                <div className="relative">
                  <input
                    id="cep"
                    className={`input-field font-mono pr-10 ${cepErro ? 'border-red-500' : ''}`}
                    value={values.cep}
                    onChange={e => handleCEP(e.target.value)}
                    placeholder="00000-000"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={9}
                  />
                  {cepLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-gold-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                    </div>
                  )}
                  {!cepLoading && values.endereco_rua && values.cep.replace(/\D/g,'').length === 8 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  )}
                </div>
                {cepErro && <p className="text-red-400 text-xs mt-1.5 font-body">{cepErro}</p>}
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field id="endereco_rua" label="Rua / Logradouro" error={errors.endereco_rua} required>
                    <input
                      id="endereco_rua"
                      className={`input-field ${errors.endereco_rua ? 'border-red-500' : ''}`}
                      value={values.endereco_rua}
                      onChange={e => set('endereco_rua', e.target.value)}
                      placeholder="Preenchido pelo CEP"
                      autoComplete="street-address"
                      enterKeyHint="next"
                    />
                  </Field>
                </div>
                <Field id="endereco_numero" label="Número" error={errors.endereco_numero} required>
                  <input
                    id="endereco_numero"
                    className={`input-field ${errors.endereco_numero ? 'border-red-500' : ''}`}
                    value={values.endereco_numero}
                    onChange={e => set('endereco_numero', e.target.value)}
                    placeholder="78"
                    autoComplete="off"
                    enterKeyHint="next"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field id="endereco_bairro" label="Bairro" error={errors.endereco_bairro} required>
                  <input
                    id="endereco_bairro"
                    className={`input-field ${errors.endereco_bairro ? 'border-red-500' : ''}`}
                    value={values.endereco_bairro}
                    onChange={e => set('endereco_bairro', e.target.value)}
                    placeholder="Preenchido pelo CEP"
                    autoComplete="off"
                    enterKeyHint="next"
                  />
                </Field>
                <Field id="cidade_estado_contratante" label="Cidade / Estado" error={errors.cidade_estado_contratante} required>
                  <input
                    id="cidade_estado_contratante"
                    className={`input-field ${errors.cidade_estado_contratante ? 'border-red-500' : ''}`}
                    value={values.cidade_estado_contratante}
                    onChange={e => set('cidade_estado_contratante', e.target.value)}
                    placeholder="Preenchido pelo CEP"
                    autoComplete="address-level2"
                    enterKeyHint="next"
                  />
                </Field>
              </div>
            </div>

          </div>
        </Section>

        {/* ── Evento ──────────────────────────────────────── */}
        <Section title="Evento">
          <div className="space-y-4">
            <Field id="nome_evento" label="Nome do evento" error={errors.nome_evento} required>
              <AutocompleteInput
                id="nome_evento"
                value={values.nome_evento}
                onChange={v => set('nome_evento', v)}
                placeholder="Ex: Casamento, Aniversário..."
                error={errors.nome_evento}
                opcoes={eventosState.todos}
                opcoesExtras={eventosState.salvos}
                onSalvar={handleSalvarEvento}
                onDeletar={handleDeletarEvento}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="data_evento" label="Data do evento" error={errors.data_evento} required>
                <input
                  id="data_evento"
                  type="date"
                  className={`input-field ${errors.data_evento ? 'border-red-500' : ''}`}
                  value={values.data_evento}
                  onChange={e => set('data_evento', e.target.value)}
                />
              </Field>
              <Field id="horas" label="Duração do show" error={errors.horas} required>
                <div className="flex gap-2">
                  {OPCOES_HORAS.map(h => {
                    const val = String(h)
                    const ativo = values.horas === val
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => set('horas', val)}
                        className={`flex-1 rounded-xl border font-bold font-body transition-all active:scale-95 select-none py-2.5
                          ${ativo
                            ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                            : 'border-stage-500 text-gray-400 hover:border-stage-400'
                          }`}
                        style={{ fontSize: 14 }}
                      >
                        {h}h
                      </button>
                    )
                  })}
                </div>
                {errors.horas && <p className="text-red-400 text-xs mt-1.5 font-body">Selecione a duração</p>}
              </Field>
            </div>

            <Field id="local_evento" label="Local / Espaço de eventos" error={errors.local_evento} required>
              <AutocompleteInput
                id="local_evento"
                value={values.local_evento}
                onChange={handleLocalChange}
                placeholder="Ex: Espaço de Eventos Adepol"
                error={errors.local_evento}
                opcoes={locaisState.todos}
                opcoesExtras={locaisState.salvos}
                onSalvar={handleSalvarLocal}
                onDeletar={handleDeletarLocal}
                rodapeInfo={placesOnline.length > 0 ? (
                  <div className="space-y-0.5 -mx-1">
                    <p className="text-gray-600 font-body px-1 mb-1" style={{ fontSize: 11 }}>
                      Resultados online
                    </p>
                    {placesOnline.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => {
                          set('local_evento', p.nome)
                          if (p.endereco) set('endereco_local_evento', p.endereco)
                          setPlacesOnline([])
                        }}
                        className="w-full text-left rounded-lg px-2 py-1.5 hover:bg-stage-600 transition-colors"
                      >
                        <p className="text-gray-200 font-body font-semibold" style={{ fontSize: 13 }}>{p.nome}</p>
                        {p.endereco && (
                          <p className="text-gray-500 font-body" style={{ fontSize: 11 }}>{p.endereco}</p>
                        )}
                      </button>
                    ))}
                  </div>
                ) : null}
              />
            </Field>

            {/* Toggle: número de pessoas na banda */}
            <div>
              <button
                type="button"
                onClick={() => set('pessoas_banda', values.pessoas_banda === null ? 7 : null)}
                className={`flex items-center gap-3 w-full p-3.5 rounded-xl border transition-all select-none active:scale-[0.99]
                  ${values.pessoas_banda !== null
                    ? 'border-gold-500/60 bg-gold-500/5 text-gray-200'
                    : 'border-stage-500 text-gray-500 hover:border-stage-400'
                  }`}
              >
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                  ${values.pessoas_banda !== null ? 'border-gold-500 bg-gold-500' : 'border-gray-600'}`}
                >
                  {values.pessoas_banda !== null && (
                    <svg className="w-3 h-3 text-stage-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                </span>
                <span className="font-body font-semibold" style={{ fontSize: 15 }}>
                  Incluir número de pessoas na banda
                </span>
              </button>

              {values.pessoas_banda !== null && (
                <div className="mt-3">
                  <label htmlFor="pessoas_banda" className="label">Quantidade de pessoas</label>
                  <input
                    id="pessoas_banda"
                    type="number"
                    className="input-field font-mono"
                    value={values.pessoas_banda}
                    onChange={e => set('pessoas_banda', Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={50}
                    inputMode="numeric"
                  />
                </div>
              )}
            </div>

            {/* Endereço do local — preenchido automaticamente ou manualmente */}
            <div>
              <label htmlFor="endereco_local_evento" className="label">
                Endereço do local
                <span className="text-gray-600 font-normal ml-1">— opcional</span>
              </label>
              <input
                id="endereco_local_evento"
                className="input-field"
                value={values.endereco_local_evento}
                onChange={e => set('endereco_local_evento', e.target.value)}
                placeholder="Preenchido ao selecionar o local, ou digite manualmente"
                autoComplete="off"
                enterKeyHint="next"
              />
            </div>

          </div>
        </Section>

        {/* ── Cachê e Pagamento ───────────────────────────── */}
        <Section title="Cachê e Pagamento">
          <div className="space-y-4">
            {/* Valor do cachê com botões rápidos */}
            <div>
              <label htmlFor="valor_cache" className="label">
                Valor do cachê (R$)
                <span className="text-gold-600 ml-1">*</span>
              </label>

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

              {/* Botões rápidos de valor */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {DEFINIR_VALOR.map(({ label, centavos }) => {
                  const ativo = Math.round(limparMoeda(values.valor_cache) * 100) === centavos
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => ajustarValor(centavos)}
                      className={`flex-1 py-2.5 rounded-lg border font-bold font-body
                        transition-all active:scale-95 select-none
                        ${ativo
                          ? 'bg-gold-500/20 border-gold-500 text-gold-400'
                          : 'border-stage-500 text-gray-500 hover:border-gold-600 hover:text-gold-400 bg-stage-700'
                        }`}
                      style={{ fontSize: 13, minWidth: '3rem' }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Ajuste fino ±100 */}
              {temValor && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-gray-600 font-body select-none" style={{ fontSize: 11 }}>ajuste</span>
                  <button
                    type="button"
                    onClick={() => ajustarValor(-10000)}
                    className="flex-1 py-1.5 rounded-lg border border-stage-500 bg-stage-700
                      text-gray-500 hover:border-red-500/50 hover:text-red-400
                      font-bold font-body transition-all active:scale-95 select-none"
                    style={{ fontSize: 14 }}
                  >
                    −100
                  </button>
                  <button
                    type="button"
                    onClick={() => ajustarValor(10000)}
                    className="flex-1 py-1.5 rounded-lg border border-stage-500 bg-stage-700
                      text-gray-500 hover:border-gold-600 hover:text-gold-400
                      font-bold font-body transition-all active:scale-95 select-none"
                    style={{ fontSize: 14 }}
                  >
                    +100
                  </button>
                </div>
              )}
            </div>

            <Field id="forma_pagamento" label="Forma de pagamento" required>
              <div className="space-y-2">
                {FORMAS_PAGAMENTO.map(forma => (
                  <label
                    key={forma}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors select-none
                      ${values.forma_pagamento === forma
                        ? 'border-gold-500/60 bg-gold-500/5'
                        : 'border-stage-500 hover:border-stage-400 active:bg-stage-700'
                      }`}
                  >
                    <input
                      type="radio"
                      name="forma_pagamento"
                      value={forma}
                      checked={values.forma_pagamento === forma}
                      onChange={() => set('forma_pagamento', forma)}
                      className="accent-gold-500 w-4 h-4 shrink-0"
                    />
                    <span className="font-body text-gray-200" style={{ fontSize: 15 }}>{forma}</span>
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </Section>

        {/* ── Cláusulas Especiais (colapsável) ────────────── */}
        <Collapsible
          title="Cláusulas Especiais"
          hasContent={!!values.clausulas_especiais}
        >
          <textarea
            id="clausulas_especiais"
            className="input-field resize-none"
            style={{ lineHeight: '1.6' }}
            rows={4}
            value={values.clausulas_especiais}
            onChange={e => set('clausulas_especiais', e.target.value)}
            placeholder="Penalidades por cancelamento, condições especiais, requisitos específicos..."
          />
        </Collapsible>

        {/* ── Rider / Observações (colapsável) ────────────── */}
        <Collapsible
          title="Rider Técnico / Observações"
          hasContent={!!values.observacoes}
        >
          <textarea
            id="observacoes"
            className="input-field resize-none"
            style={{ lineHeight: '1.6' }}
            rows={3}
            value={values.observacoes}
            onChange={e => set('observacoes', e.target.value)}
            placeholder="Sistema de som, iluminação, camarim, refeições, observações gerais..."
          />
        </Collapsible>

        {/* ── Frase especial do rodapé ────────────────────── */}
        <Section title="Frase do Rodapé">
          {/* Toggle principal */}
          <button
            type="button"
            onClick={() => set('frase_rodape_ativo', !values.frase_rodape_ativo)}
            className={`flex items-center gap-3 w-full p-3.5 rounded-xl border transition-all select-none active:scale-[0.99] mb-4
              ${values.frase_rodape_ativo
                ? 'border-gold-500/60 bg-gold-500/5 text-gray-200'
                : 'border-stage-500 text-gray-500 hover:border-stage-400'
              }`}
          >
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
              ${values.frase_rodape_ativo ? 'border-gold-500 bg-gold-500' : 'border-gray-600'}`}
            >
              {values.frase_rodape_ativo && (
                <svg className="w-3 h-3 text-stage-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </span>
            <span className="font-body font-semibold" style={{ fontSize: 15 }}>
              Incluir frase especial
            </span>
          </button>

          {values.frase_rodape_ativo && (
            <div className="space-y-4">
              {/* Seleção de modo */}
              <div className="flex gap-2">
                {[
                  { valor: 'auto',   label: 'Automática' },
                  { valor: 'manual', label: 'Manual'     },
                ].map(({ valor, label }) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => set('frase_rodape_modo', valor)}
                    className={`flex-1 py-2.5 rounded-xl border font-bold font-body transition-all active:scale-95 select-none
                      ${values.frase_rodape_modo === valor
                        ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                        : 'border-stage-500 text-gray-400 hover:border-stage-400'
                      }`}
                    style={{ fontSize: 14 }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Modo automático — preview */}
              {values.frase_rodape_modo === 'auto' && (
                <div className="rounded-xl border border-gold-500/40 bg-gold-500/5 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-gray-500 font-body" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Frase gerada automaticamente
                    </p>
                    <button
                      type="button"
                      onClick={reloadFrase}
                      title="Sortear outra frase"
                      className="w-7 h-7 flex items-center justify-center rounded-lg
                        text-gray-500 hover:text-gold-400 hover:bg-gold-500/10
                        transition-colors active:scale-90"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gold-400 font-body font-semibold italic" style={{ fontSize: 15 }}>
                    "{values.frase_rodape_auto}"
                  </p>
                  {!values.nome_evento && (
                    <p className="text-gray-600 font-body mt-1" style={{ fontSize: 12 }}>
                      Preencha o nome do evento para ver a frase correspondente.
                    </p>
                  )}
                </div>
              )}

              {/* Modo manual — input livre */}
              {values.frase_rodape_modo === 'manual' && (
                <div>
                  <label htmlFor="frase_rodape_manual" className="label">Frase personalizada</label>
                  <input
                    id="frase_rodape_manual"
                    className="input-field"
                    value={values.frase_rodape_manual}
                    onChange={e => set('frase_rodape_manual', e.target.value)}
                    placeholder='Ex: "Noite que ficará pra sempre na memória!"'
                    autoComplete="off"
                  />
                </div>
              )}
            </div>
          )}
        </Section>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting
            ? <><SpinnerIcon /> Gerando...</>
            : <><PDFIcon /> Gerar Contrato em PDF</>
          }
        </button>

      </form>
    </div>
  )
}

// ─── Componentes locais ───────────────────────────────────────────────────────

function Collapsible({ title, children, hasContent }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="bg-stage-800 border border-stage-600 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto(a => !a)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-4
          hover:bg-stage-700/50 transition-colors select-none"
      >
        <span className="font-display text-base font-semibold text-gray-200 flex items-center gap-2">
          {title}
          <span className="text-xs font-body text-gray-600 font-normal">— opcional</span>
          {hasContent && !aberto && (
            <span className="w-2 h-2 rounded-full bg-gold-500 shrink-0" title="Tem conteúdo" />
          )}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 shrink-0
            ${aberto ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {aberto && (
        <div className="px-4 sm:px-5 pb-4 pt-1 border-t border-stage-700">
          {children}
        </div>
      )}
    </div>
  )
}

function Section({ title, children, optional }) {
  return (
    <div className="bg-stage-800 border border-stage-600 rounded-2xl p-4 sm:p-5">
      <h3 className="font-display text-base font-semibold text-gray-200 mb-4 flex items-center gap-2">
        {title}
        {optional && (
          <span className="text-xs font-body text-gray-600 font-normal">— opcional</span>
        )}
      </h3>
      {children}
    </div>
  )
}

function Field({ id, label, children, error, required }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="text-gold-600 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-400 text-xs mt-1.5 font-body">Campo obrigatório</p>
      )}
    </div>
  )
}
