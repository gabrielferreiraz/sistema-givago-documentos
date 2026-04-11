/**
 * Retorna a data de hoje no formato yyyy-mm-dd usando o fuso de Brasília.
 * Sem isso, entre 21h e meia-noite o toISOString() retorna o dia seguinte.
 */
export function hoje() {
  return new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    .split('/').reverse().join('-')
}

/**
 * Gera número de documento com contador por tipo/ano persistido em localStorage.
 * Garante unicidade no dispositivo e sequência legível (ORC-2026-001).
 * Reinicia automaticamente a cada ano.
 */
export function gerarNumeroDoc(prefixo = 'ORC') {
  const ano = new Date().getFullYear()
  const key = `givago_seq_${prefixo}_${ano}`
  const seq = (parseInt(localStorage.getItem(key) || '0', 10)) + 1
  localStorage.setItem(key, String(seq))
  return `${prefixo}-${ano}-${String(seq).padStart(3, '0')}`
}

/**
 * Formata valor monetário BR: "350000" (centavos como string) → "R$ 3.500,00"
 */
export function formatarMoeda(raw) {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const number = parseInt(digits, 10) / 100
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

/**
 * Extrai número puro de string monetária: "R$ 3.500,00" → 3500.00
 */
export function limparMoeda(str) {
  if (!str) return 0
  const cleaned = str.replace(/[R$\s.]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

/**
 * Formata telefone: "67999999999" → "(67) 99999-9999"
 */
export function formatarTelefone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/**
 * Formata CPF ou CNPJ automaticamente pelo tamanho
 */
export function formatarCpfCnpj(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

/**
 * Converte "yyyy-mm-dd" → "DD/MM/AAAA" para exibição no PDF
 */
export function formatarDataBR(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/**
 * Valida campos obrigatórios. Retorna { campo: true } para cada campo vazio.
 */
export function validarCampos(form, camposObrigatorios) {
  const erros = {}
  for (const campo of camposObrigatorios) {
    const val = form[campo]
    if (!val || String(val).trim() === '' || val === 0) {
      erros[campo] = true
    }
  }
  return erros
}
