import { useState, useEffect } from 'react'

const STORAGE_KEY = 'givago_ios_prompt_dismissed'

function detectarIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPad no iOS 13+ reporta como MacIntel com touch
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function estaInstalado() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

/**
 * Banner que aparece no iOS quando o usuário ainda não instalou o app.
 * Aparece 2s após carregar, pode ser dispensado (lembrado no localStorage).
 */
export default function IOSInstallPrompt() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    if (!detectarIOS() || estaInstalado()) return
    if (localStorage.getItem(STORAGE_KEY)) return

    const t = setTimeout(() => setVisivel(true), 2000)
    return () => clearTimeout(t)
  }, [])

  if (!visivel) return null

  const dispensar = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisivel(false)
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 animate-slide-up"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="bg-stage-700 border border-gold-500/30 rounded-2xl p-4 shadow-2xl">

        {/* Linha superior: ícone + texto + fechar */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gold-500/10 border border-gold-500/30
            flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-white font-body" style={{ fontSize: 15 }}>
              Instalar Givago no iPhone
            </p>
            <p className="text-gray-400 font-body mt-1" style={{ fontSize: 13, lineHeight: 1.5 }}>
              Acesse como app — sem abrir o Safari toda vez.
            </p>
          </div>

          <button
            onClick={dispensar}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 shrink-0"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instruções */}
        <div className="mt-3 flex items-center gap-2 bg-stage-600 rounded-xl px-3 py-2.5">
          {/* Ícone de compartilhamento do iOS */}
          <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" stroke="currentColor"
            strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-gray-300 font-body" style={{ fontSize: 13 }}>
            Toque em <strong className="text-white">Compartilhar</strong> →{' '}
            <strong className="text-white">"Adicionar à Tela de Início"</strong>
          </span>
        </div>

        {/* Seta apontando para baixo (onde fica o botão de share no iOS) */}
        <div className="flex justify-center mt-2">
          <svg className="w-4 h-4 text-gold-500/60" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 16l-6-6h12l-6 6z"/>
          </svg>
        </div>
      </div>
    </div>
  )
}
