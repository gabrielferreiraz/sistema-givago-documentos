import { useState } from 'react'
import { formatarMoeda, limparMoeda, formatarTelefone, formatarCpfCnpj, validarCampos } from '../utils/form'
import { SpinnerIcon, PDFIcon } from './icons'

const FORMAS_PAGAMENTO = [
  'À vista',
  '50% antecipado + 50% no dia',
  'Parcelado (a combinar)',
]

const CAMPOS_OBRIGATORIOS = [
  'nome_contratante', 'cpf_cnpj', 'telefone', 'nome_evento',
  'data_evento', 'horario_inicio', 'horario_fim', 'local_evento',
  'cidade_estado', 'valor_cache', 'forma_pagamento', 'data_assinatura',
]

/**
 * FormContrato é um componente controlado (mesma arquitetura do FormOrcamento).
 * Estado vive no App — trocar de aba não perde os dados.
 */
export default function FormContrato({ values, onChange, onSubmit }) {
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const set = (field, value) => {
    onChange(field, value)
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const erros = validarCampos(values, CAMPOS_OBRIGATORIOS)
    if (Object.keys(erros).length > 0) {
      setErrors(erros)
      document.getElementById(Object.keys(erros)[0])
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSubmitting(true)
    await onSubmit(values)
    setSubmitting(false)
  }

  return (
    <div className="w-full max-w-2xl animate-slide-up">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* ── Identificação ───────────────────────────────── */}
        <Section title="Identificação">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="numero" label="Número do contrato">
              <input
                id="numero"
                className="input-field font-mono text-gray-500"
                value={values.numero}
                onChange={e => set('numero', e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Field id="data_assinatura" label="Data de assinatura" error={errors.data_assinatura} required>
              <input
                id="data_assinatura"
                type="date"
                className={`input-field ${errors.data_assinatura ? 'border-red-500' : ''}`}
                value={values.data_assinatura}
                onChange={e => set('data_assinatura', e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* ── Contratante ─────────────────────────────────── */}
        <Section title="Contratante">
          <div className="space-y-4">
            <Field id="nome_contratante" label="Nome completo" error={errors.nome_contratante} required>
              <input
                id="nome_contratante"
                className={`input-field ${errors.nome_contratante ? 'border-red-500' : ''}`}
                value={values.nome_contratante}
                onChange={e => set('nome_contratante', e.target.value)}
                placeholder="Nome do contratante ou empresa"
                autoComplete="name"
                enterKeyHint="next"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="cpf_cnpj" label="CPF / CNPJ" error={errors.cpf_cnpj} required>
                <input
                  id="cpf_cnpj"
                  className={`input-field font-mono ${errors.cpf_cnpj ? 'border-red-500' : ''}`}
                  value={values.cpf_cnpj}
                  onChange={e => set('cpf_cnpj', formatarCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00"
                  autoComplete="off"
                  inputMode="numeric"
                  maxLength={18}
                />
              </Field>
              <Field id="telefone" label="Telefone / WhatsApp" error={errors.telefone} required>
                <input
                  id="telefone"
                  type="tel"
                  className={`input-field font-mono ${errors.telefone ? 'border-red-500' : ''}`}
                  value={values.telefone}
                  onChange={e => set('telefone', formatarTelefone(e.target.value))}
                  placeholder="(67) 99999-9999"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={15}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ── Evento ──────────────────────────────────────── */}
        <Section title="Evento">
          <div className="space-y-4">
            <Field id="nome_evento" label="Nome do evento" error={errors.nome_evento} required>
              <input
                id="nome_evento"
                className={`input-field ${errors.nome_evento ? 'border-red-500' : ''}`}
                value={values.nome_evento}
                onChange={e => set('nome_evento', e.target.value)}
                placeholder="Ex: Festa de Casamento, Aniversário 15 Anos..."
                autoComplete="off"
                enterKeyHint="next"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field id="data_evento" label="Data do evento" error={errors.data_evento} required>
                <input
                  id="data_evento"
                  type="date"
                  className={`input-field ${errors.data_evento ? 'border-red-500' : ''}`}
                  value={values.data_evento}
                  onChange={e => set('data_evento', e.target.value)}
                  // Sem min — contratos retroativos também ocorrem
                />
              </Field>
              <Field id="horario_inicio" label="Início" error={errors.horario_inicio} required>
                <input
                  id="horario_inicio"
                  type="time"
                  className={`input-field font-mono ${errors.horario_inicio ? 'border-red-500' : ''}`}
                  value={values.horario_inicio}
                  onChange={e => set('horario_inicio', e.target.value)}
                />
              </Field>
              <Field id="horario_fim" label="Término" error={errors.horario_fim} required>
                <input
                  id="horario_fim"
                  type="time"
                  className={`input-field font-mono ${errors.horario_fim ? 'border-red-500' : ''}`}
                  value={values.horario_fim}
                  onChange={e => set('horario_fim', e.target.value)}
                />
              </Field>
            </div>

            <Field id="local_evento" label="Local / Endereço" error={errors.local_evento} required>
              <input
                id="local_evento"
                className={`input-field ${errors.local_evento ? 'border-red-500' : ''}`}
                value={values.local_evento}
                onChange={e => set('local_evento', e.target.value)}
                placeholder="Nome do local ou endereço completo"
                autoComplete="street-address"
                enterKeyHint="next"
              />
            </Field>

            <Field id="cidade_estado" label="Cidade e Estado" error={errors.cidade_estado} required>
              <input
                id="cidade_estado"
                className={`input-field ${errors.cidade_estado ? 'border-red-500' : ''}`}
                value={values.cidade_estado}
                onChange={e => set('cidade_estado', e.target.value)}
                placeholder="Campo Grande - MS"
                autoComplete="address-level2"
                enterKeyHint="next"
              />
            </Field>
          </div>
        </Section>

        {/* ── Cachê e Pagamento ───────────────────────────── */}
        <Section title="Cachê e Pagamento">
          <div className="space-y-4">
            <Field id="valor_cache" label="Valor do cachê (R$)" error={errors.valor_cache} required>
              <input
                id="valor_cache"
                className={`input-field font-mono text-gold-400 ${errors.valor_cache ? 'border-red-500' : ''}`}
                value={values.valor_cache}
                onChange={e => set('valor_cache', formatarMoeda(e.target.value))}
                placeholder="R$ 0,00"
                inputMode="numeric"
                autoComplete="off"
              />
            </Field>

            <Field id="forma_pagamento" label="Forma de pagamento" required>
              <div className="space-y-2">
                {FORMAS_PAGAMENTO.map(forma => (
                  <label
                    key={forma}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors select-none
                      ${values.forma_pagamento === forma
                        ? 'border-gold-500/60 bg-gold-500/5'
                        : 'border-stage-500 hover:border-stage-400 active:bg-stage-700'
                      }`}
                  >
                    <input
                      type="radio"
                      name="forma_pagamento"
                      value={forma}
                      checked={values.forma_pagamento === forma}
                      onChange={() => set('forma_pagamento', forma)}
                      className="accent-gold-500 w-4 h-4 shrink-0"
                    />
                    <span className="font-body text-gray-200" style={{ fontSize: 15 }}>{forma}</span>
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </Section>

        {/* ── Cláusulas Especiais ─────────────────────────── */}
        <Section title="Cláusulas Especiais" optional>
          <Field id="clausulas_especiais" label="Cláusulas adicionais">
            <textarea
              id="clausulas_especiais"
              className={`input-field resize-none`}
              style={{ lineHeight: '1.6' }}
              rows={4}
              value={values.clausulas_especiais}
              onChange={e => set('clausulas_especiais', e.target.value)}
              placeholder="Penalidades por cancelamento, condições especiais, requisitos específicos..."
            />
          </Field>
        </Section>

        {/* ── Rider / Observações ─────────────────────────── */}
        <Section title="Rider Técnico / Observações" optional>
          <Field id="observacoes" label="Detalhes adicionais">
            <textarea
              id="observacoes"
              className="input-field resize-none"
              style={{ lineHeight: '1.6' }}
              rows={3}
              value={values.observacoes}
              onChange={e => set('observacoes', e.target.value)}
              placeholder="Sistema de som, iluminação, camarim, refeições, observações gerais..."
            />
          </Field>
        </Section>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting
            ? <><SpinnerIcon /> Gerando...</>
            : <><PDFIcon /> Gerar Contrato em PDF</>
          }
        </button>

      </form>
    </div>
  )
}

// ─── Componentes locais ───────────────────────────────────────────────────────

function Section({ title, children, optional }) {
  return (
    <div className="bg-stage-800 border border-stage-600 rounded-2xl p-4 sm:p-5">
      <h3 className="font-display text-base font-semibold text-gray-200 mb-4 flex items-center gap-2">
        {title}
        {optional && (
          <span className="text-xs font-body text-gray-600 font-normal">— opcional</span>
        )}
      </h3>
      {children}
    </div>
  )
}

function Field({ id, label, children, error, required }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="text-gold-600 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-400 text-xs mt-1.5 font-body">Campo obrigatório</p>
      )}
    </div>
  )
}
