import { formatarDataBR, limparMoeda, hoje } from './form'

/**
 * Tempo máximo de espera pela resposta do N8N + Gotenberg.
 * Configurável via .env para ajuste sem alterar código.
 */
const TIMEOUT_MS = parseInt(import.meta.env.VITE_PDF_TIMEOUT_MS || '90000', 10)

/**
 * Ponto central de comunicação com o webhook do N8N.
 * Se o backend mudar (ex: de N8N para uma API própria), só este arquivo muda.
 *
 * @param {{ tipo: string, formData: object }} params
 * @returns {Promise<{ pdf_url: string, nome_arquivo: string }>}
 * @throws {Error} com .code: 'config' | 'timeout' | 'server' | 'network'
 */
export async function gerarDocumento({ tipo, formData }) {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL
  const token = import.meta.env.VITE_N8N_WEBHOOK_TOKEN

  if (!webhookUrl) {
    const err = new Error('VITE_N8N_WEBHOOK_URL não está configurada no arquivo .env')
    err.code = 'config'
    throw err
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(buildPayload(tipo, formData)),
      signal: controller.signal,
    })

    if (!response.ok) {
      const texto = await response.text().catch(() => '')
      const err = new Error(`O servidor retornou erro ${response.status}. ${texto}`.trim())
      err.code = 'server'
      err.status = response.status
      throw err
    }

    const data = await response.json()

    if (data.status !== 'success') {
      const err = new Error('Erro ao gerar o documento.')
      err.code = 'server'
      throw err
    }

    return data
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeout = new Error(`Tempo limite de ${TIMEOUT_MS / 1000}s atingido. O servidor demorou demais para responder.`)
      timeout.code = 'timeout'
      throw timeout
    }
    if (!err.code) err.code = 'network'
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Gera contrato a partir dos dados do orçamento + campos extras.
 * Endpoint: /givago-contrato (derivado da URL do orçamento automaticamente).
 */
export async function gerarContrato({ orcamentoData, extraData }) {
  const orcUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || ''
  const webhookUrl = import.meta.env.VITE_N8N_CONTRACT_WEBHOOK_URL ||
    orcUrl.replace(/\/([^/]+)$/, '/givago-contrato')
  const token = import.meta.env.VITE_N8N_WEBHOOK_TOKEN

  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    const err = new Error('URL do webhook de contrato não configurada.')
    err.code = 'config'
    throw err
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(buildContratoPayload(orcamentoData, extraData)),
      signal: controller.signal,
    })

    if (!response.ok) {
      const texto = await response.text().catch(() => '')
      const err = new Error(`O servidor retornou erro ${response.status}. ${texto}`.trim())
      err.code = 'server'
      err.status = response.status
      throw err
    }

    const data = await response.json()
    if (data.status !== 'success') {
      const err = new Error('Erro ao gerar o contrato.')
      err.code = 'server'
      throw err
    }

    return data
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeout = new Error(`Tempo limite de ${TIMEOUT_MS / 1000}s atingido.`)
      timeout.code = 'timeout'
      throw timeout
    }
    if (!err.code) err.code = 'network'
    throw err
  } finally {
    clearTimeout(timer)
  }
}

function buildContratoPayload(orc, extra) {
  const valor = limparMoeda(orc.valor_cache)
  const payload = {
    tipo: 'contrato',
    nome: orc.nome,
    cpf: extra.cpf,
    rg: extra.rg,
    endereco: extra.endereco,
    evento: orc.evento,
    data_evento: orc.data_evento,
    data_evento_br: formatarDataBR(orc.data_evento),
    local_evento: orc.local_evento,
    horas: orc.horas,
    valor_cache: valor,
    valor_cache_formatado: valor.toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
    }),
    data_assinatura_br: formatarDataBR(extra.data_assinatura || hoje()),
  }

  if (orc.backline === 'incluso') payload.backline = 'incluso'
  else if (orc.backline) payload.backline = limparMoeda(orc.backline)

  if (orc.transporte === 'incluso') payload.transporte = 'incluso'
  else if (orc.transporte) payload.transporte = limparMoeda(orc.transporte)

  if (orc.incluir_horario && orc.horario) payload.horario = orc.horario

  return payload
}

/**
 * Monta o payload completo para o N8N, incluindo todos os campos formatados
 * que os templates HTML precisam diretamente (datas em PT-BR, valor em R$).
 *
 * Centralizar aqui garante que os templates nunca recebam dados crus e que
 * adicionar um novo tipo de documento é só adicionar um case neste switch.
 */
function buildPayload(tipo, formData) {
  const base = {
    tipo,
    numero: formData.numero,
    // Envia a data original (ISO) e a formatada — N8N usa a que quiser
    data_evento: formData.data_evento,
    data_evento_br: formatarDataBR(formData.data_evento),
  }

  switch (tipo) {
    case 'orcamento': {
      const valorOrc = limparMoeda(formData.valor_cache)
      const payload = {
        ...base,
        nome: formData.nome,
        evento: formData.evento,
        local_evento: formData.local_evento,
        horas: formData.horas,
        valor_cache: valorOrc,
        valor_cache_formatado: valorOrc.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
        }),
      }

      // Horário: só inclui se o toggle estiver ativo e o campo preenchido
      if (formData.incluir_horario && formData.horario) {
        payload.horario = formData.horario
      }

      // Backline: omite se vazio, envia 'incluso' ou valor numérico
      if (formData.backline === 'incluso') {
        payload.backline = 'incluso'
      } else if (formData.backline) {
        payload.backline = limparMoeda(formData.backline)
      }

      // Transporte: mesma lógica
      if (formData.transporte === 'incluso') {
        payload.transporte = 'incluso'
      } else if (formData.transporte) {
        payload.transporte = limparMoeda(formData.transporte)
      }

      return payload
    }

    case 'contrato': {
      const valorNumerico = limparMoeda(formData.valor_cache)
      return {
        ...base,
        nome_contratante: formData.nome_contratante,
        cpf_cnpj: formData.cpf_cnpj,
        telefone: formData.telefone,
        nome_evento: formData.nome_evento,
        horario_inicio: formData.horario_inicio,
        horario_fim: formData.horario_fim,
        local_evento: formData.local_evento,
        cidade_estado: formData.cidade_estado,
        forma_pagamento: formData.forma_pagamento,
        observacoes: formData.observacoes || '',
        clausulas_especiais: formData.clausulas_especiais || '',
        data_assinatura: formData.data_assinatura,
        data_assinatura_br: formatarDataBR(formData.data_assinatura),
        // Valor em três formatos para flexibilidade no template
        valor_cache: valorNumerico,
        valor_cache_formatado: valorNumerico.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
        }),
      }
    }

    default:
      return { ...base, ...formData }
  }
}
