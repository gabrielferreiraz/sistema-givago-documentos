// ─── Google Places API v1 ─────────────────────────────────────────────────────
// Usa a Places API nova (v1) que suporta CORS direto do browser.
console.log('Places key:', import.meta.env.VITE_GOOGLE_PLACES_KEY)
const KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY

/**
 * Busca locais/estabelecimentos pelo nome usando Google Places Autocomplete.
 * Retorna até 4 sugestões com nome e endereço.
 */
export async function buscarLocaisOnline(input) {
  if (!KEY || !input || input.trim().length < 3) return []

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
    },
    body: JSON.stringify({
      input: input.trim(),
      includedRegionCodes: ['br'],
      languageCode: 'pt-BR',
    }),
  })

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}))
    console.warn('[places] erro da API:', res.status, erro?.error?.message || erro)
    return []
  }
  const data = await res.json()

  return (data.suggestions || [])
    .filter(s => s.placePrediction)
    .slice(0, 4)
    .map(s => {
      const p = s.placePrediction
      return {
        nome:     p.structuredFormat?.mainText?.text      || p.text?.text || '',
        endereco: p.structuredFormat?.secondaryText?.text || '',
      }
    })
    .filter(s => s.nome)
}
