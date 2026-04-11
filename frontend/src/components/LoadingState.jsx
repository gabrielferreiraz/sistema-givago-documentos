import { useEffect, useState } from 'react'

const MENSAGENS = [
  'Preparando o documento...',
  'Renderizando o layout...',
  'Aplicando os dados...',
  'Gerando o PDF...',
  'Finalizando...',
]

export default function LoadingState({ documentType }) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MENSAGENS.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  const label = documentType === 'contrato' ? 'contrato' : 'orçamento'

  return (
    <div className="w-full max-w-sm text-center animate-fade-in px-4 py-12">
      {/* Animação */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-gold-500/20 animate-ping" />
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-gold-500 animate-spin" />
        <div className="absolute inset-3 rounded-full bg-stage-700 border border-stage-600 flex items-center justify-center">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gold-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
      </div>

      <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
        Gerando seu {label}
      </h2>
      <p className="text-gold-400 font-body" style={{ fontSize: 15 }}>
        {MENSAGENS[msgIndex]}
      </p>
      <p className="text-gray-600 text-sm font-body mt-4 leading-relaxed">
        Não feche nem recarregue a página.
      </p>

      {/* Barra de progresso */}
      <div className="mt-8 h-0.5 bg-stage-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-transparent via-gold-500 to-transparent rounded-full"
          style={{ width: '40%', animation: 'loading-bar 2s ease-in-out infinite' }}
        />
      </div>

      <style>{`
        @keyframes loading-bar {
          0%   { transform: translateX(-200%); }
          100% { transform: translateX(450%); }
        }
      `}</style>
    </div>
  )
}
