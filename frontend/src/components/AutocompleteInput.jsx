import { useState, useRef, useEffect } from 'react'

/**
 * AutocompleteInput — input com lista suspensa filtrável.
 *
 * Props:
 *   id, value, onChange, placeholder, error, autoComplete  — padrão de input
 *   opcoes          — array de strings para filtrar
 *   opcoesExtras    — array de strings salvas pelo usuário (mostram ícone de lixeira)
 *   onSalvar        — fn(value) → salva o valor atual; se ausente, não exibe botão salvar
 *   onDeletar       — fn(item)  → deleta item das opções extras
 *   onSelect        — fn(item)  → chamado quando o usuário escolhe explicitamente um item da lista
 *   enterKeyHint
 */
export default function AutocompleteInput({
  id,
  value,
  onChange,
  placeholder,
  error,
  opcoes = [],
  opcoesExtras = [],
  onSalvar,
  onDeletar,
  onSelect,
  enterKeyHint = 'next',
  autoComplete = 'off',
  rodapeInfo = null,  // conteúdo extra no fim da lista (endereço de referência, etc.)
}) {
  const [aberto, setAberto] = useState(false)
  const [focado, setFocado] = useState(false)
  const containerRef = useRef(null)

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const query = value.toLowerCase()

  // Filtra as opções fixas
  const fixasFiltradas = opcoes.filter(o =>
    o.toLowerCase().includes(query) && o !== value
  )

  // Filtra as extras (salvas), excluindo as que já aparecem nas fixas
  const extrasFiltradas = opcoesExtras.filter(o =>
    o.toLowerCase().includes(query) && o !== value && !opcoes.includes(o)
  )

  const temSugestoes = fixasFiltradas.length > 0 || extrasFiltradas.length > 0
  const mostrarLista = aberto && (temSugestoes || (onSalvar && value.trim()) || rodapeInfo)

  const selecionar = (item) => {
    onChange(item)
    if (onSelect) onSelect(item)
    setAberto(false)
  }

  const handleSalvar = (e) => {
    e.preventDefault()
    if (value.trim()) {
      onSalvar(value.trim())
      setAberto(false)
    }
  }

  const jaSalvo = opcoesExtras.includes(value.trim())

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          id={id}
          value={value}
          onChange={e => { onChange(e.target.value); setAberto(true) }}
          onFocus={() => { setFocado(true); setAberto(true) }}
          onBlur={() => setFocado(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          enterKeyHint={enterKeyHint}
          className={`input-field pr-10 ${error ? 'border-red-500' : focado ? '' : ''}`}
        />

        {/* X para limpar / seta para abrir */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            if (value) { onChange(''); setAberto(false) }
            else setAberto(a => !a)
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500
            hover:text-gray-300 transition-colors"
        >
          {value ? (
            <svg className="w-4 h-4 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Lista suspensa */}
      {mostrarLista && (
        <div className="absolute z-30 w-full mt-1 bg-stage-700 border border-stage-500
          rounded-xl shadow-xl overflow-hidden animate-fade-in">

          <ul className="max-h-52 overflow-y-auto">
            {/* Extras (salvas) primeiro — ficam no topo por serem personalizadas */}
            {extrasFiltradas.map(item => (
              <li key={`extra-${item}`} className="flex items-center group">
                <button
                  type="button"
                  onMouseDown={() => selecionar(item)}
                  className="flex-1 text-left px-4 py-3 font-body text-gray-200
                    hover:bg-stage-600 transition-colors flex items-center gap-2"
                  style={{ fontSize: 15 }}
                >
                  <svg className="w-3.5 h-3.5 text-gold-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  {item}
                </button>
                {onDeletar && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); onDeletar(item) }}
                    className="px-3 py-3 text-gray-600 hover:text-red-400 transition-colors
                      opacity-0 group-hover:opacity-100"
                    title="Remover local salvo"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </li>
            ))}

            {/* Fixas */}
            {fixasFiltradas.map(item => (
              <li key={`fixo-${item}`}>
                <button
                  type="button"
                  onMouseDown={() => selecionar(item)}
                  className="w-full text-left px-4 py-3 font-body text-gray-300
                    hover:bg-stage-600 hover:text-gray-100 transition-colors"
                  style={{ fontSize: 15 }}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>

          {/* Rodapé: endereço de referência (Maps) */}
          {rodapeInfo && (
            <div className="border-t border-stage-600 px-4 py-2.5">
              {rodapeInfo}
            </div>
          )}

          {/* Rodapé: salvar novo local */}
          {onSalvar && value.trim() && !jaSalvo && !opcoes.includes(value.trim()) && (
            <div className="border-t border-stage-600 px-3 py-2">
              <button
                type="button"
                onMouseDown={handleSalvar}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                  text-gold-400 hover:bg-gold-500/10 transition-colors font-bold font-body"
                style={{ fontSize: 13 }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Salvar "{value.trim()}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
