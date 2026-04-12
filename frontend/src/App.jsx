import { useState, useCallback } from 'react'
import { gerarNumeroDoc, hoje } from './utils/form'
import { gerarDocumento } from './utils/api'
import { useTheme } from './utils/useTheme'
import FormOrcamento from './components/FormOrcamento'
import FormContrato from './components/FormContrato'
import LoadingState from './components/LoadingState'
import ResultadoPDF from './components/ResultadoPDF'
import IOSInstallPrompt from './components/IOSInstallPrompt'

// ─── Estado inicial de cada tipo de documento ─────────────────────────────────
// Definido fora do componente para não recriar a cada render.
// Para adicionar um novo tipo, crie uma função aqui e registre em TIPOS.

function orcamentoInicial() {
  return {
    numero: gerarNumeroDoc('ORC'),
    nome: '',
    evento: '',
    local_evento: '',
    data_evento: '',
    horas: '2',
    valor_cache: '',
    backline: '',
    backline_modo: 'vazio',
    transporte: '',
    transporte_modo: 'vazio',
    incluir_horario: false,
    horario: '',
  }
}

function contratoInicial() {
  return {
    numero: gerarNumeroDoc('CTR'),
    nome_contratante: '',
    cpf_cnpj: '',
    telefone: '',
    nome_evento: '',
    data_evento: '',
    horario_inicio: '',
    horario_fim: '',
    local_evento: '',
    cidade_estado: '',
    valor_cache: '',
    forma_pagamento: '50% antecipado + 50% no dia',
    observacoes: '',
    data_assinatura: hoje(),
    clausulas_especiais: '',
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { isDark, alternar: alternarTema } = useTheme()

  // Tipo ativo: 'orcamento' | 'contrato'
  const [tipoAtivo, setTipoAtivo] = useState('orcamento')

  // Estado dos dois formulários fica aqui — sobrevive à troca de aba
  const [forms, setForms] = useState({
    orcamento: orcamentoInicial(),
    contrato: contratoInicial(),
  })

  // Estado da tela: 'form' | 'loading' | 'result' | 'error'
  const [tela, setTela] = useState('form')
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [errorCode, setErrorCode] = useState('')

  // Atualiza um campo de um formulário específico
  const handleChange = useCallback((tipo, field, value) => {
    setForms(prev => ({
      ...prev,
      [tipo]: { ...prev[tipo], [field]: value },
    }))
  }, [])

  // Troca de aba — estado do formulário permanece
  const handleSwitchTipo = useCallback((tipo) => {
    setTipoAtivo(tipo)
    setTela('form')
    setResult(null)
    setErrorMsg('')
    setErrorCode('')
  }, [])

  const handleSubmit = useCallback(async (formData) => {
    setTela('loading')
    setErrorMsg('')
    setErrorCode('')

    try {
      const data = await gerarDocumento({ tipo: tipoAtivo, formData })
      setResult(data)
      setTela('result')

      // Reseta o formulário preenchido e gera novo número para o próximo
      setForms(prev => ({
        ...prev,
        [tipoAtivo]: tipoAtivo === 'orcamento' ? orcamentoInicial() : contratoInicial(),
      }))

      return true
    } catch (err) {
      console.error('[givago-pdf]', err)
      setErrorMsg(err.message || 'Erro inesperado.')
      setErrorCode(err.code || 'network')
      setTela('error')
    }
  }, [tipoAtivo])

  const handleNovoDocumento = useCallback(() => {
    setResult(null)
    setErrorMsg('')
    setErrorCode('')
    setTela('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleRetry = useCallback(() => {
    setErrorMsg('')
    setErrorCode('')
    setTela('form')
  }, [])

  const showTabs = tela === 'form' || tela === 'loading'

  return (
    <div className="min-h-screen bg-stage-900 flex flex-col">

      {/* ── Header ──────────────────────────────────────────── */}
      <header
        className="border-b border-stage-700 bg-stage-800/90 backdrop-blur-sm sticky top-0 z-20"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-2">
            {showTabs && (
              <TipoTabs ativo={tipoAtivo} onSwitch={handleSwitchTipo} />
            )}
            <ThemeToggle isDark={isDark} onToggle={alternarTema} />
          </div>
        </div>
      </header>

      {/* ── Conteúdo ────────────────────────────────────────── */}
      <main
        className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-5 sm:pt-8"
        style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}
      >
        {tela === 'form' && tipoAtivo === 'orcamento' && (
          <FormOrcamento
            values={forms.orcamento}
            onChange={(field, value) => handleChange('orcamento', field, value)}
            onSubmit={handleSubmit}
            onPreencherTudo={(item) => {
              setForms(prev => ({ ...prev, orcamento: { ...orcamentoInicial(), ...item } }))
            }}
          />
        )}

        {tela === 'form' && tipoAtivo === 'contrato' && (
          <FormContrato
            values={forms.contrato}
            onChange={(field, value) => handleChange('contrato', field, value)}
            onSubmit={handleSubmit}
          />
        )}

        {tela === 'loading' && (
          <LoadingState documentType={tipoAtivo} />
        )}

        {tela === 'result' && result && (
          <ResultadoPDF
            result={result}
            documentType={tipoAtivo}
            onNewDocument={handleNovoDocumento}
          />
        )}

        {tela === 'error' && (
          <ErrorState
            message={errorMsg}
            code={errorCode}
            onRetry={handleRetry}
          />
        )}
      </main>

      <footer className="py-3 text-center border-t border-stage-700/50">
        <p className="text-gray-700 text-xs font-body">Givago &copy; {new Date().getFullYear()}</p>
      </footer>

      {/* Banner de instalação — só aparece no iOS fora do modo standalone */}
      <IOSInstallPrompt />
    </div>
  )
}

// ─── Sub-componentes do App ───────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
        <svg className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      </div>
      <span className="font-display text-gold-500 font-bold text-lg leading-none">Givago</span>
    </div>
  )
}

function TipoTabs({ ativo, onSwitch }) {
  return (
    <div className="flex bg-stage-700 rounded-xl p-1 gap-1">
      {['orcamento', 'contrato'].map(tipo => (
        <button
          key={tipo}
          onClick={() => onSwitch(tipo)}
          className={`px-4 sm:px-5 rounded-lg font-bold font-body transition-all select-none active:scale-95
            ${ativo === tipo
              ? 'bg-gold-500 text-stage-900'
              : 'text-gray-400 hover:text-gray-200'
            }`}
          style={{ fontSize: 15, minHeight: 38 }}
        >
          {tipo === 'orcamento' ? 'Orçamento' : 'Contrato'}
        </button>
      ))}
    </div>
  )
}

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      className="w-9 h-9 flex items-center justify-center rounded-xl
        bg-stage-700 border border-stage-500
        hover:border-gold-600 transition-colors active:scale-95 select-none shrink-0"
    >
      {isDark ? (
        /* Sol — clica para ir ao tema claro */
        <svg className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 4.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 4.5zM12 17.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM4.5 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 014.5 12zM17.25 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM6.697 7.757a.75.75 0 011.06-1.06l1.06 1.06a.75.75 0 11-1.06 1.061L6.697 7.757zM15.182 15.182a.75.75 0 011.061-1.06l1.06 1.06a.75.75 0 01-1.06 1.06l-1.061-1.06zM7.757 16.243a.75.75 0 01-1.06-1.061l1.06-1.06a.75.75 0 011.061 1.06l-1.06 1.061zM16.243 7.757a.75.75 0 01-1.061-1.06l1.06-1.061a.75.75 0 011.061 1.06l-1.06 1.061zM12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z"/>
        </svg>
      ) : (
        /* Lua — clica para ir ao tema escuro */
        <svg className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd"/>
        </svg>
      )}
    </button>
  )
}

// Mensagens contextuais por tipo de erro — guia o Givago a resolver o problema
const MENSAGENS_ERRO = {
  config: 'O sistema não está configurado. Verifique o arquivo .env e reinicie.',
  timeout: 'O servidor demorou demais para responder. Verifique se o N8N e o Gotenberg estão no ar e tente novamente.',
  server: null, // usa a mensagem original do servidor
  network: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
}

function ErrorState({ message, code, onRetry }) {
  const mensagem = MENSAGENS_ERRO[code] || message

  return (
    <div className="w-full max-w-lg animate-slide-up">
      <div className="card p-6 sm:p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="font-display text-xl text-white mb-2">Algo deu errado</h2>
        <p className="text-gray-400 font-body leading-relaxed mb-6" style={{ fontSize: 15 }}>
          {mensagem}
        </p>
        <button onClick={onRetry} className="btn-primary w-full">
          Voltar ao formulário
        </button>
      </div>
    </div>
  )
}
