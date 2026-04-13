export default function ResultadoPDF({ result, documentType, onNewDocument }) {
  const label = documentType === 'contrato' ? 'Contrato' : 'Orçamento'

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
          Documento gerado com sucesso!
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

        <a
          href="https://wa.me/556796921144"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full mb-3 rounded-xl font-bold font-body
            bg-green-600 hover:bg-green-500 active:scale-95 text-white transition-all select-none"
          style={{ fontSize: 16, minHeight: 52 }}
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
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.098.546 4.07 1.5 5.79L0 24l6.335-1.5A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.857c-1.939 0-3.741-.524-5.285-1.434l-.379-.224-3.93.93.946-3.847-.247-.397A9.857 9.857 0 012.143 12C2.143 6.553 6.553 2.143 12 2.143S21.857 6.553 21.857 12 17.447 21.857 12 21.857z"/>
    </svg>
  )
}
