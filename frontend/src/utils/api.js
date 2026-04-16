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
  const baseUrl = import.meta.env.VITE_N8N_WEBHOOK_URL
  const token = import.meta.env.VITE_N8N_WEBHOOK_TOKEN

  if (!baseUrl) {
    const err = new Error('VITE_N8N_WEBHOOK_URL não está configurada no arquivo .env')
    err.code = 'config'
    throw err
  }

  // Contrato usa endpoint próprio no N8N — deriva automaticamente da URL base
  const webhookUrl = tipo === 'contrato'
    ? (import.meta.env.VITE_N8N_CONTRACT_WEBHOOK_URL || baseUrl.replace(/\/([^/]+)$/, '/givago-contrato'))
    : baseUrl

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
    ...(extra.pessoas_banda != null ? { pessoas_banda: parseInt(extra.pessoas_banda, 10) || 7 } : {}),
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
        cidade_show: formData.cidade_show || '',
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
      const valorCache = limparMoeda(formData.valor_cache)

      // Backline: undefined = não informado, 'incluso', ou número
      let backlineVal
      if (formData.backline_modo === 'incluso') backlineVal = 'incluso'
      else if (formData.backline_modo === 'valor' && formData.backline) backlineVal = limparMoeda(formData.backline)

      // Transporte: mesma lógica
      let transporteVal
      if (formData.transporte_modo === 'incluso') transporteVal = 'incluso'
      else if (formData.transporte_modo === 'valor' && formData.transporte) transporteVal = limparMoeda(formData.transporte)

      // Valor total = cachê + extras numéricos
      const valorTotal = valorCache
        + (typeof backlineVal === 'number' ? backlineVal : 0)
        + (typeof transporteVal === 'number' ? transporteVal : 0)

      const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

      const fmtOpcional = (v) => typeof v === 'number'
        ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
        : null

      const payload = {
        ...base,
        // Identificação do contrato
        data_assinatura: formData.data_assinatura,
        data_assinatura_br: formatarDataBR(formData.data_assinatura),
        // Contratante
        nome_contratante:          formData.nome_contratante,
        cpf_cnpj:                  formData.cpf_cnpj,
        rg:                        formData.rg || '',
        ssp_uf:                    formData.ssp_uf || '',
        telefone:                  formData.telefone,
        cep:                       formData.cep || '',
        endereco_rua:              formData.endereco_rua || '',
        endereco_numero:           formData.endereco_numero || '',
        endereco_bairro:           formData.endereco_bairro || '',
        cidade_estado_contratante: formData.cidade_estado_contratante || '',
        // Evento
        nome_evento:           formData.nome_evento,
        horas:                 formData.horas,
        local_evento:          formData.local_evento,
        endereco_local_evento: formData.endereco_local_evento || '',
        ...(formData.pessoas_banda !== null && formData.pessoas_banda !== undefined
          ? { pessoas_banda: parseInt(formData.pessoas_banda, 10) || 7 }
          : {}),
        // Financeiro
        forma_pagamento:      formData.forma_pagamento,
        valor_cache:          valorCache,
        valor_cache_formatado: fmt(valorCache),
        valor_total:          valorTotal,
        valor_total_formatado: fmt(valorTotal),
        // Cláusulas e observações
        clausulas_especiais: formData.clausulas_especiais || '',
        observacoes:         formData.observacoes || '',
        frase_rodape: (() => {
          if (!formData.frase_rodape_ativo) return ''
          if (formData.frase_rodape_modo === 'manual') return formData.frase_rodape_manual || ''
          return formData.frase_rodape_auto || ''
        })(),
      }

      if (backlineVal !== undefined) {
        payload.backline = backlineVal
        if (typeof backlineVal === 'number') payload.backline_formatado = fmtOpcional(backlineVal)
      }
      if (transporteVal !== undefined) {
        payload.transporte = transporteVal
        if (typeof transporteVal === 'number') payload.transporte_formatado = fmtOpcional(transporteVal)
      }

      return payload
    }

    default:
      return { ...base, ...formData }
  }
}
