import { useState, useEffect } from 'react'
import { hoje, formatarCpfCnpj, formatarCEP } from '../utils/form'
import { gerarContrato } from '../utils/api'

function sanitizarNomeArquivo(nome) {
  return (nome || 'documento.pdf')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_(?=\.pdf$)/g, '')
}

function base64ToBlob(base64) {
  const binary = atob(base64.replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: 'application/pdf' })
}

async function compartilharPDF({ pdfBase64, pdfUrl, nomeArquivo }) {
  const blob = pdfBase64
    ? base64ToBlob(pdfBase64)
    : await fetch(pdfUrl).then(r => r.blob())

  const nomeSeguro = sanitizarNomeArquivo(nomeArquivo)
  const file = new File([blob], nomeSeguro, { type: 'application/pdf' })

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: nomeSeguro })
  } else {
    window.open(pdfUrl || '', '_blank')
  }
}

export default function ResultadoPDF({ result, documentType, onNewDocument, orcamentoData }) {
  const label = documentType === 'contrato' ? 'Contrato' : 'Orçamento'
  const [modalAberto, setModalAberto] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareErro, setShareErro] = useState('')

  const pdfBase64 = result.pdf_base64 || null
  const pdfUrl    = result.pdf_url || result.url || null
  const podeSharar = !!(pdfBase64 || pdfUrl)

  // Log único para descobrir quais campos o webhook realmente retorna
  useEffect(() => {
    console.log('[givago] result completo:', JSON.stringify(result, null, 2))
    if (!pdfUrl) console.warn('[givago] pdf_url não encontrado nos campos:', Object.keys(result))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCompartilhar = async () => {
    if (!podeSharar) return
    setSharing(true)
    setShareErro('')
    try {
      await compartilharPDF({ pdfBase64, pdfUrl, nomeArquivo: result.nome_arquivo })
    } catch (err) {
      if (err.name !== 'AbortError') {
        setShareErro('Não foi possível compartilhar. Tente baixar o PDF manualmente.')
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="w-full max-w-lg animate-slide-up">
      <div className="card p-6 sm:p-8 text-center">

        {/* Ícone de sucesso */}
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30
          flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="font-display text-2xl font-bold text-white mb-2">
          {label} gerado com sucesso!
        </h2>

        {result.nome_arquivo && (
          <p className="font-mono text-gray-400 mb-4" style={{ fontSize: 13 }}>
            {result.nome_arquivo}
          </p>
        )}

        <div className="flex items-center justify-center gap-2 text-green-400 mb-8">
          <WhatsAppIcon />
          <span className="font-body font-bold" style={{ fontSize: 15 }}>
            Enviado para o WhatsApp.
          </span>
        </div>

        {/* Botão gerar contrato — só aparece após orçamento */}
        {documentType === 'orcamento' && orcamentoData && (
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center justify-center gap-2 w-full mb-3 rounded-xl font-bold font-body
              bg-stage-700 border border-stage-500 hover:border-gold-600 hover:text-gold-400
              active:scale-95 transition-all select-none"
            style={{ fontSize: 16, minHeight: 56, color: 'var(--c-gray-300)' }}
          >
            <span style={{ fontSize: 18 }}>📝</span>
            Gerar Contrato
          </button>
        )}

        {/* Compartilhar arquivo PDF — só aparece quando o N8N retorna pdf_url */}
        {podeSharar && (
          <div className="mb-3">
          <button
            onClick={handleCompartilhar}
            disabled={sharing}
            className="flex items-center justify-center gap-2 w-full rounded-xl font-bold font-body
              bg-green-600 hover:bg-green-500 active:scale-95 text-white transition-all select-none
              disabled:opacity-50 disabled:pointer-events-none"
            style={{ fontSize: 16, minHeight: 52 }}
          >
            {sharing ? (
              <>
                <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Preparando arquivo...
              </>
            ) : (
              <>
                <WhatsAppIcon />
                Compartilhar PDF
              </>
            )}
          </button>
            {shareErro && (
              <p className="text-amber-400 font-body text-xs mt-1.5 text-center">{shareErro}</p>
            )}
          </div>
        )}

        <a
          href="https://wa.me/556796921144"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full mb-3 rounded-xl font-bold font-body
            bg-stage-700 border border-stage-500 hover:border-stage-400
            active:scale-95 text-gray-300 transition-all select-none"
          style={{ fontSize: 15, minHeight: 46 }}
        >
          <WhatsAppIcon />
          Abrir WhatsApp do Givago
        </a>

        <button onClick={onNewDocument} className="btn-secondary w-full">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Gerar novo documento
        </button>

      </div>

      {/* Modal de campos extras do contrato */}
      {modalAberto && (
        <ModalContrato
          orcamentoData={orcamentoData}
          onClose={() => setModalAberto(false)}
        />
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────


function ModalContrato({ orcamentoData, onClose }) {
  const [fields, setFields] = useState({
    cep: '',
    cpf: '',
    rg: '',
    endereco: '',
    pessoas_banda: 7,
    data_assinatura: hoje(),
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [cepErro, setCepErro] = useState('')

  const set = (field, value) => {
    setFields(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }))
    if (errorMsg) setErrorMsg('')
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
      // Monta o endereço — usuário completa com número
      const partes = [data.logradouro, data.bairro, `${data.localidade}/${data.uf}`, `CEP ${data.cep}`]
      set('endereco', partes.filter(Boolean).join(', '))
      // Limpa erro de endereço se havia
      setErrors(prev => ({ ...prev, endereco: false }))
    } catch {
      setCepErro('Erro ao buscar CEP. Verifique sua conexão.')
    } finally {
      setCepLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const erros = {}
    if (!fields.cpf.trim()) erros.cpf = true
    if (!fields.rg.trim()) erros.rg = true
    if (!fields.endereco.trim()) erros.endereco = true
    if (!fields.data_assinatura) erros.data_assinatura = true

    if (Object.keys(erros).length > 0) {
      setErrors(erros)
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      await gerarContrato({ orcamentoData, extraData: fields })
      setSucesso(true)
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao gerar o contrato.')
    } finally {
      setLoading(false)
    }
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full max-w-lg animate-slide-up overflow-y-auto"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}>

        {sucesso ? (
          /* Estado de sucesso dentro do modal */
          <div className="p-6 sm:p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30
              flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">
              Contrato gerado!
            </h3>
            <p className="text-gray-400 font-body mb-6" style={{ fontSize: 15 }}>
              Enviado para o WhatsApp do Givago.
            </p>
            <button onClick={onClose} className="btn-primary w-full">
              Fechar
            </button>
          </div>
        ) : (
          /* Formulário */
          <div className="p-6 sm:p-8">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-xl font-bold text-white">Gerar Contrato</h3>
                <p className="text-gray-400 font-body mt-0.5" style={{ fontSize: 13 }}>
                  Para: <span className="text-gray-300 font-bold">{orcamentoData.nome}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-stage-700 border border-stage-500
                  flex items-center justify-center text-gray-500 hover:text-gray-300
                  transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>

              {/* CEP */}
              <div className="mb-4">
                <label className="label">CEP</label>
                <div className="relative">
                  <input
                    className={`input-field font-mono pr-10 ${cepErro ? 'border-red-500' : ''}`}
                    value={fields.cep}
                    onChange={e => handleCEP(e.target.value)}
                    placeholder="00000-000"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={9}
                    autoFocus
                  />
                  {cepLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-gold-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                    </div>
                  )}
                  {!cepLoading && fields.endereco && fields.cep.replace(/\D/g,'').length === 8 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  )}
                </div>
                {cepErro && <p className="text-red-400 text-xs mt-1.5 font-body">{cepErro}</p>}
              </div>

              {/* CPF */}
              <div className="mb-4">
                <label className="label">CPF do contratante</label>
                <input
                  className={`input-field font-mono ${errors.cpf ? 'border-red-500' : ''}`}
                  value={fields.cpf}
                  onChange={e => set('cpf', formatarCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14}
                />
                {errors.cpf && <p className="text-red-400 text-xs mt-1.5 font-body">Campo obrigatório</p>}
              </div>

              {/* RG */}
              <div className="mb-4">
                <label className="label">RG do contratante</label>
                <input
                  className={`input-field ${errors.rg ? 'border-red-500' : ''}`}
                  value={fields.rg}
                  onChange={e => set('rg', e.target.value)}
                  placeholder="0000000"
                  autoComplete="off"
                />
                {errors.rg && <p className="text-red-400 text-xs mt-1.5 font-body">Campo obrigatório</p>}
              </div>

              {/* Endereço */}
              <div className="mb-4">
                <label className="label">Endereço completo</label>
                <textarea
                  className={`input-field resize-none ${errors.endereco ? 'border-red-500' : ''}`}
                  value={fields.endereco}
                  onChange={e => set('endereco', e.target.value)}
                  placeholder="Preenchido automaticamente pelo CEP"
                  rows={3}
                  style={{ minHeight: 'unset', lineHeight: 1.6 }}
                />
                {errors.endereco && <p className="text-red-400 text-xs mt-1.5 font-body">Campo obrigatório</p>}
              </div>

              {/* Data da assinatura */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="space-y-1.5">
                  <label htmlFor="data_assinatura" className="label text-sm">Data de assinatura</label>
                  <input
                    id="data_assinatura"
                    type="date"
                    className={`input-field h-11 text-sm ${errors.data_assinatura ? 'border-red-500' : ''}`}
                    value={fields.data_assinatura}
                    onChange={e => set('data_assinatura', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="pessoas_banda" className="label text-sm">Pessoas na banda</label>
                  <div className="relative">
                    <input
                      id="pessoas_banda"
                      type="number"
                      className="input-field h-11 text-sm font-mono pr-12"
                      value={fields.pessoas_banda}
                      onChange={e => set('pessoas_banda', e.target.value)}
                      placeholder="7"
                      inputMode="numeric"
                      min="1"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-body" style={{ fontSize: 10 }}>
                      pessoas
                    </div>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <p className="text-red-400 font-body text-sm">{errorMsg}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Gerando contrato...
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 18 }}>📝</span>
                    Gerar Contrato
                  </>
                )}
              </button>

            </form>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Ícone WhatsApp ───────────────────────────────────────────────────────────

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.098.546 4.07 1.5 5.79L0 24l6.335-1.5A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.857c-1.939 0-3.741-.524-5.285-1.434l-.379-.224-3.93.93.946-3.847-.247-.397A9.857 9.857 0 012.143 12C2.143 6.553 6.553 2.143 12 2.143S21.857 6.553 21.857 12 17.447 21.857 12 21.857z"/>
    </svg>
  )
}
