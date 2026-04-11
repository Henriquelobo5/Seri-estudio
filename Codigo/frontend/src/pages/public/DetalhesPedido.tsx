import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import './DetalhesPedido.css'

// ── Dados mock (virão do contexto/estado global futuramente) ──────────────────

const RESUMO = {
  identificacao: 'Camisetas turma 2025',
  tipo: 'Camiseta',
  tecido: '100% Algodão',
  gramatura: '180g/m²',
  cor: 'Preto',
  tamanhos: ['M', 'G'],
  posicao: 'Frente central',
  arquivos: 1,
}

const STEPS = [
  { id: 1, label: 'Produto' },
  { id: 2, label: 'Detalhes do produto' },
  { id: 3, label: 'Detalhes do pedido' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return (email ?? 'U').slice(0, 2).toUpperCase()
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function DetalhesPedido() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const initials = getInitials(user?.name, user?.email)

  // Quantidades por tamanho
  const [qtds, setQtds] = useState<Record<string, number>>(
    Object.fromEntries(RESUMO.tamanhos.map(t => [t, 6]))
  )
  const [obs, setObs] = useState('')

  const total = Object.values(qtds).reduce((s, v) => s + (v || 0), 0)

  function setQtd(tam: string, val: number) {
    setQtds(prev => ({ ...prev, [tam]: Math.max(0, val) }))
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
          <Link to={ROUTES.MEUS_PEDIDOS}>Meus pedidos</Link>
        </div>

        <div className="dpd-nav-right">
          <div className="dpd-nav-cta" style={{ cursor: 'default' }}>
            <div className="dpd-nav-avatar">{initials}</div>
            Minha conta
          </div>
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
                  <tr><td>Identificação</td><td>{RESUMO.identificacao}</td></tr>
                  <tr>
                    <td>Tipo de peça</td>
                    <td><span className="dpd-res-tag">{RESUMO.tipo}</span></td>
                  </tr>
                  <tr><td>Tecido</td><td>{RESUMO.tecido}</td></tr>
                  <tr><td>Gramatura</td><td>{RESUMO.gramatura}</td></tr>
                  <tr><td>Cor da peça</td><td>{RESUMO.cor}</td></tr>
                  <tr><td>Tamanhos</td><td>{RESUMO.tamanhos.join(', ')}</td></tr>
                  <tr><td>Posição da estampa</td><td>{RESUMO.posicao}</td></tr>
                  <tr><td>Arquivos enviados</td><td>{RESUMO.arquivos} arquivo</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quantidade por tamanho */}
          <div className="dpd-sec-title">Quantidade por tamanho</div>
          <div className="dpd-card" style={{ marginBottom: 20 }}>
            <div className="dpd-card-head">
              <div className="dpd-ch-icon">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </div>
              <div>
                <div className="dpd-ch-title">Quantidades</div>
                <div className="dpd-ch-sub">Informe quantas peças por tamanho</div>
              </div>
            </div>
            <div className="dpd-card-body">
              <div className="dpd-qtd-grid">
                {RESUMO.tamanhos.map(tam => (
                  <div key={tam} className="dpd-qtd-card">
                    <div className="dpd-qtd-size">{tam}</div>
                    <input
                      type="number"
                      className="dpd-qtd-inp"
                      min={0}
                      value={qtds[tam] ?? 0}
                      onChange={e => setQtd(tam, parseInt(e.target.value) || 0)}
                    />
                  </div>
                ))}
              </div>
              <div className="dpd-qtd-total">
                <span className="dpd-qtd-total-label">Total de peças</span>
                <span className="dpd-qtd-total-val">
                  {total} peça{total !== 1 ? 's' : ''}
                </span>
              </div>
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
              <textarea
                className="dpd-obs-ta"
                placeholder="Ex: Preciso para evento no dia 20/04, manter proporção da arte, enviar amostra antes..."
                value={obs}
                onChange={e => setObs(e.target.value)}
              />
            </div>
          </div>

          {/* Botões footer */}
          <div className="dpd-footer-btns">
            <button className="dpd-btn-back" onClick={() => navigate(ROUTES.DETALHES_PRODUTO)}>
              ← Voltar e editar
            </button>
            <button className="dpd-btn-send" onClick={() => navigate(ROUTES.CONFIRMACAO)}>
              Confirmar e enviar ficha
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
              </svg>
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
                  <div className="dpd-pdet">Camiseta · Preto · M, G</div>
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
                  <div className="dpd-pdet">Frente central · 1 arquivo</div>
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
