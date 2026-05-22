import { useEffect, useState } from 'react'
import { apiRequest } from '../../services/api'
import './EtapaLabelEditModal.css'

type EtapaLabel = {
  id: number
  idInterno: string
  labelExibido: string
}

type Props = {
  open: boolean
  labelId: number | null
  labelAtual: string | null
  onClose: () => void
  onSaved: (etapa: EtapaLabel) => void
}

const MAX_LABEL_LENGTH = 50

export default function EtapaLabelEditModal({
  open,
  labelId,
  labelAtual,
  onClose,
  onSaved,
}: Props) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setValue(labelAtual ?? '')
      setError('')
      setSubmitting(false)
    }
  }, [open, labelAtual])

  if (!open || labelId === null) {
    return null
  }

  const trimmed = value.trim()
  const isInvalid = trimmed.length === 0

  async function handleSalvar() {
    if (isInvalid || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const atualizado = await apiRequest<EtapaLabel>(
        `/admin/etapa-labels/${labelId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ labelExibido: trimmed }),
        },
      )
      onSaved(atualizado)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="aelm-backdrop" onClick={onClose}>
      <div
        className="aelm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aelm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="aelm-head">
          <h2 id="aelm-title">Renomear etapa</h2>
          <button
            type="button"
            className="aelm-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="aelm-body">
          <label className="aelm-field">
            <span>Nome exibido</span>
            <input
              type="text"
              value={value}
              maxLength={MAX_LABEL_LENGTH}
              onChange={(event) => setValue(event.target.value)}
              className={isInvalid && value.length > 0 ? 'is-invalid' : ''}
              autoFocus
            />
          </label>

          {error ? <div className="aelm-error">{error}</div> : null}
        </div>

        <div className="aelm-footer">
          <div className="aelm-footer-right">
            <button
              type="button"
              className="aelm-btn aelm-btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="aelm-btn aelm-btn-primary"
              onClick={() => void handleSalvar()}
              disabled={isInvalid || submitting}
            >
              {submitting ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
