import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import AuthNavCta from '../../components/ui/AuthNavCta'
import MyOrdersLink from '../../components/ui/MyOrdersLink'
import logo from '../../assets/images/logo.png'
import { apiRequest } from '../../services/api'
import { resolveModelagemGramaturaFromDetails } from '../../utils/fichaEspecificacoes'
import './DetalhesPedido.css'

const STEPS = [
  { id: 1, label: 'Produto' },
  { id: 2, label: 'Detalhes do produto' },
  { id: 3, label: 'Detalhes do pedido' },
]

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function formatDateInput(value: string) {
  if (!value) return ''

  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value

  return `${day}/${month}/${year}`
}

function toDateInputValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function parseDateInputValue(value: string) {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null

  const date = new Date(year, month - 1, day)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export default function DetalhesPedido() {
  const navigate = useNavigate()
  const location = useLocation()
  const locState = (location.state ?? {}) as { fichaId?: number; fichaData?: any }

  const fichaData = locState.fichaData ?? {
    identificacao: '',
    tipo: '',
    modelagemGramatura: '',
    tecido: '',
    gramatura: '',
    cor: '',
    tamanhos: [],
    posicao: '',
    arquivos: 0,
  }

  const tamanhos: string[] = fichaData.tamanhos ?? []
  const modelagemGramatura = resolveModelagemGramaturaFromDetails(fichaData, fichaData.tipo)
  const quantidadesIniciais = fichaData.quantidadesPorTamanho ?? {}

  const qtds = useMemo<Record<string, number>>(
    () => Object.fromEntries(tamanhos.map(t => [t, Number(quantidadesIniciais[t]) || 0])),
    [quantidadesIniciais, tamanhos],
  )
  const [obs, setObs] = useState('')
  const [enderecoEntrega, setEnderecoEntrega] = useState('')
  const [dataNecessidade, setDataNecessidade] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const total = Object.values(qtds).reduce((s, v) => s + (v || 0), 0)
  const selectedDate = parseDateInputValue(dataNecessidade)
  const today = useMemo(() => new Date(), [])
  const minDeliveryDate = useMemo(() => {
    const date = startOfDay(new Date())
    date.setDate(date.getDate() + 21)
    return date
  }, [])
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const start = new Date(year, month, 1 - firstDay.getDay())

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
  }, [calendarMonth])

  function selectDate(date: Date) {
    setDataNecessidade(toDateInputValue(date))
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    setCalendarOpen(false)
  }

  function changeCalendarMonth(delta: number) {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  useEffect(() => {
    if (!calendarOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (!datePickerRef.current?.contains(event.target as Node)) {
        setCalendarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [calendarOpen])

  useEffect(() => {
    if (!calendarOpen) return

    window.setTimeout(() => {
      const targetDay = datePickerRef.current?.querySelector('.dpd-cal-grid button.selected, .dpd-cal-grid button.today')
      targetDay?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 0)
  }, [calendarOpen])

  async function handleConfirmar() {
    if (!locState.fichaId) {
      setErro('Ficha técnica não encontrada. Volte e preencha novamente.')
      return
    }
    if (total < 1) {
      setErro('Informe pelo menos 1 peça em pelo menos um tamanho.')
      return
    }
    if (selectedDate && startOfDay(selectedDate) < minDeliveryDate) {
      setErro('Selecione uma data desejada com pelo menos 3 semanas de prazo.')
      return
    }
    setLoading(true)
    setErro('')
    try {
      const quantidadesStr = tamanhos.map(t => `${t}:${qtds[t] ?? 0}`).join(',')
      const prazoTexto = dataNecessidade ? `Preciso para ${formatDateInput(dataNecessidade)}` : ''
      const enderecoTexto = enderecoEntrega.trim() ? `Endereço de entrega: ${enderecoEntrega.trim()}` : ''
      const observacoesComPrazo = [prazoTexto, enderecoTexto, obs.trim()].filter(Boolean).join('\n')
      const pedido = await apiRequest<{ id: number; fichaTecnica?: { codigoDisplay?: string } }>('/pedido', {
        method: 'POST',
        body: JSON.stringify({ fichaId: locState.fichaId, quantidades: quantidadesStr, observacoes: observacoesComPrazo }),
      })
      const codigoDisplay = pedido.fichaTecnica?.codigoDisplay ?? ''
      navigate(ROUTES.CONFIRMACAO, { state: { total, codigoDisplay, fichaData: { ...fichaData, quantidadesPorTamanho: qtds, enderecoEntrega } } })
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao salvar pedido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dpd-page">
      <div className="dpd-grain" aria-hidden="true" />

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className="dpd-nav">
        <Link to={ROUTES.HOME} className="dpd-nav-brand">
          <div className="dpd-nav-logo">
            <img src={logo} alt="Seri." />
          </div>
          <span className="dpd-nav-name">Seri.</span>
        </Link>

        <div className="dpd-nav-center">
          <Link to={ROUTES.HOME}>Home</Link>
          <Link to={ROUTES.CATALOGO}>Portfólio</Link>
          <a href={`${ROUTES.HOME}#como-funciona`}>Como funciona</a>
          <a href={`${ROUTES.HOME}#contato`}>Contato</a>
          <MyOrdersLink hideForAdmin>Meus pedidos</MyOrdersLink>
        </div>

        <div className="dpd-nav-right">
          <AuthNavCta className="dpd-nav-cta" />
        </div>
      </nav>

      {/* ── STEPPER ─────────────────────────────────────────────────────────── */}
      <div className="dpd-sbar">
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}
          >
            <div className={`dpd-step ${step.id === 3 ? 'active' : 'done'}`}>
              <div className="dpd-snum">
                {step.id < 3 ? (
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <div className="dpd-slabel">{step.label}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div className="dpd-sline done" />
            )}
          </div>
        ))}
      </div>

      {/* ── LAYOUT ──────────────────────────────────────────────────────────── */}
      <div className="dpd-layout">

        {/* COLUNA PRINCIPAL */}
        <div className="dpd-main">

          {/* Resumo da ficha */}
          <div className="dpd-sec-title">Resumo da ficha técnica</div>
          <div className="dpd-card" style={{ marginBottom: 20 }}>
            <div className="dpd-card-head">
              <div className="dpd-ch-icon">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div>
                <div className="dpd-ch-title">Ficha técnica</div>
                <div className="dpd-ch-sub">Revise as informações antes de enviar</div>
              </div>
            </div>
            <div className="dpd-card-body">
              <table className="dpd-res-table">
                <tbody>
                  <tr><td>Identificação</td><td>{fichaData.identificacao || '—'}</td></tr>
                  <tr>
                    <td>Tipo de peça</td>
                    <td><span className="dpd-res-tag">{fichaData.tipo || '—'}</span></td>
                  </tr>
                  <tr><td>Gramatura e Modelagem</td><td>{modelagemGramatura || '—'}</td></tr>
                  <tr><td>Cor da peça</td><td>{(() => {
                    const m = fichaData.corPorTipo as Record<string, string> | undefined
                    if (!m || Object.keys(m).length === 0) return fichaData.cor || '—'
                    const entries = Object.entries(m)
                    if (entries.length === 1) return entries[0][1] || '—'
                    return entries.map(([t, c]) => `${t}: ${c}`).join(' · ')
                  })()}</td></tr>
                  <tr><td>Tamanhos</td><td>{tamanhos.join(', ') || '—'}</td></tr>
                  <tr><td>Posição da estampa</td><td>{fichaData.posicao || '—'}</td></tr>
                  <tr><td>Arquivos enviados</td><td>{fichaData.arquivos ?? 0} arquivo</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Observações finais */}
          <div className="dpd-sec-title">Observações finais</div>
          <div className="dpd-card" style={{ marginBottom: 28 }}>
            <div className="dpd-card-head">
              <div className="dpd-ch-icon">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <div className="dpd-ch-title">Recado para o estúdio</div>
                <div className="dpd-ch-sub">Informações extras, referências ou detalhes</div>
              </div>
            </div>
            <div className="dpd-card-body">
              <div className="dpd-date-field">
                <span>Endereço de entrega</span>
                <input
                  type="text"
                  className="dpd-obs-ta"
                  style={{ height: 'auto', padding: '11px 13px' }}
                  placeholder="Ex: Rua das Flores, 123 - Bairro, Cidade - SP"
                  value={enderecoEntrega}
                  onChange={e => setEnderecoEntrega(e.target.value)}
                />
              </div>
              <div className="dpd-date-field">
                <span>Data de entrega (Mínimo 3 semanas)</span>
                <div className="dpd-date-picker" ref={datePickerRef}>
                  <button
                    type="button"
                    className={`dpd-date-trigger ${dataNecessidade ? 'has-value' : ''}`}
                    onClick={() => setCalendarOpen(open => !open)}
                  >
                    <span>{dataNecessidade ? formatDateInput(dataNecessidade) : 'Selecionar data'}</span>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  </button>

                  {calendarOpen ? (
                    <div className="dpd-calendar" role="dialog" aria-label="Selecionar data desejada">
                      <div className="dpd-cal-head">
                        <button type="button" onClick={() => changeCalendarMonth(-1)} aria-label="Mês anterior">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                        </button>
                        <strong>{MESES[calendarMonth.getMonth()]} de {calendarMonth.getFullYear()}</strong>
                        <button type="button" onClick={() => changeCalendarMonth(1)} aria-label="Próximo mês">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                      </div>

                      <div className="dpd-cal-week">
                        {DIAS_SEMANA.map((dia, index) => <span key={`${dia}-${index}`}>{dia}</span>)}
                      </div>

                      <div className="dpd-cal-grid">
                        {calendarDays.map(date => {
                          const isCurrentMonth = date.getMonth() === calendarMonth.getMonth()
                          const isSelected = selectedDate ? sameDay(date, selectedDate) : false
                          const isToday = sameDay(date, today)
                          const isBlocked = startOfDay(date) < minDeliveryDate

                          return (
                            <button
                              key={date.toISOString()}
                              type="button"
                              className={[
                                !isCurrentMonth ? 'muted' : '',
                                isBlocked ? 'blocked' : '',
                                isToday ? 'today' : '',
                                isSelected ? 'selected' : '',
                              ].filter(Boolean).join(' ')}
                              disabled={isBlocked}
                              title={isBlocked ? 'Prazo mínimo de 3 semanas' : undefined}
                              onClick={() => {
                                if (!isBlocked) selectDate(date)
                              }}
                            >
                              {date.getDate()}
                            </button>
                          )
                        })}
                      </div>

                    </div>
                  ) : null}
                </div>
              </div>
              <textarea
                className="dpd-obs-ta"
                placeholder="Ex: manter proporção da arte, enviar amostra antes, referências ou detalhes finais..."
                value={obs}
                onChange={e => setObs(e.target.value)}
              />
            </div>
          </div>

          {/* Botões footer */}
          {erro && <p style={{ color: '#e05252', fontSize: 13, marginBottom: 12 }}>{erro}</p>}
          <div className="dpd-footer-btns">
            <button className="dpd-btn-back" onClick={() => navigate(ROUTES.DETALHES_PRODUTO)}>
              ← Voltar e editar
            </button>
            <button className="dpd-btn-send" disabled={loading || total < 1} onClick={handleConfirmar}>
              {loading ? 'Enviando...' : 'Confirmar e enviar ficha'}
              {!loading && (
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="dpd-sidebar">

          {/* Progresso */}
          <div className="dpd-card">
            <div className="dpd-card-head">
              <div className="dpd-ch-icon">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div><div className="dpd-ch-title">Progresso</div></div>
            </div>
            <div className="dpd-card-body">
              <div className="dpd-pb-wrap">
                <div className="dpd-pb-fill" style={{ width: '88%' }} />
              </div>
              <div className="dpd-pi">
                <div className="dpd-pidot done">
                  <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <div className="dpd-pname done">Produto</div>
                  <div className="dpd-pdet">{fichaData.tipo} · {fichaData.cor} · {tamanhos.join(', ')}</div>
                </div>
              </div>
              <div className="dpd-pi">
                <div className="dpd-pidot done">
                  <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <div className="dpd-pname done">Detalhes do produto</div>
                  <div className="dpd-pdet">{fichaData.posicao} · {fichaData.arquivos ?? 0} arquivo</div>
                </div>
              </div>
              <div className="dpd-pi">
                <div className="dpd-pidot active">3</div>
                <div>
                  <div className="dpd-pname active">Detalhes do pedido</div>
                  <div className="dpd-pdet">
                    {total > 0 ? `${total} peça${total !== 1 ? 's' : ''} · Pronto para enviar` : 'Aguardando quantidades...'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp card */}
          <div className="dpd-wa-card">
            <div className="dpd-wa-icon-row">
              <div className="dpd-wa-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(37,211,102,.8)">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.522 5.84L.057 23.882a.5.5 0 0 0 .611.632l6.262-1.638A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.012-1.373l-.36-.214-3.716.973.99-3.617-.235-.371A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                </svg>
              </div>
              <div className="dpd-wa-title">Orçamento via WhatsApp</div>
            </div>
            <p className="dpd-wa-sub">
              Após o envio, o estúdio analisará sua ficha e entrará em contato pelo WhatsApp com o orçamento detalhado em até 24h.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
