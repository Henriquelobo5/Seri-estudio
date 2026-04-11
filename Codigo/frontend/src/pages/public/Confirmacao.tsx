import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import './Confirmacao.css'

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

const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

// ── Confetti ──────────────────────────────────────────────────────────────────

function Confetti() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const colors = [
      'rgba(126,200,154,.7)',
      'rgba(42,94,64,.9)',
      'rgba(126,200,154,.35)',
      'rgba(250,250,248,.18)',
      'rgba(126,200,154,.5)',
    ]
    colors.forEach(c => {
      for (let i = 0; i < 9; i++) {
        const d = document.createElement('div')
        d.className = 'cf-dot'
        const s = 3 + Math.random() * 5
        d.style.cssText = [
          `width:${s}px`,
          `height:${s}px`,
          `left:${Math.random() * 100}%`,
          `background:${c}`,
          `animation-duration:${2 + Math.random() * 2.5}s`,
          `animation-delay:${Math.random() * 1.2}s`,
        ].join(';')
        el.appendChild(d)
      }
    })
    const t = setTimeout(() => { if (el.parentNode) el.style.display = 'none' }, 5500)
    return () => clearTimeout(t)
  }, [])

  return <div className="cf-wrap" ref={ref} aria-hidden="true" />
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function Confirmacao() {
  const { user } = useAuth()
  const initials = getInitials(user?.name, user?.email)

  const code = useMemo(() => String(Math.floor(1000 + Math.random() * 9000)), [])
  const [copied, setCopied] = useState(false)

  const now    = useMemo(() => new Date(), [])
  const ts     = `${now.getDate()} ${MESES[now.getMonth()]} ${now.getFullYear()} · ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const fullCode = `SERI-2025-${code}`

  function copyCode() {
    navigator.clipboard.writeText(fullCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2800)
  }

  return (
    <div className="conf-page">
      <div className="conf-grain" aria-hidden="true" />
      <Confetti />

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <nav className="conf-nav">
        <Link to={ROUTES.HOME} className="conf-nav-brand">
          <div className="conf-nav-logo">
            <img src={logo} alt="Seri." />
          </div>
          <span className="conf-nav-name">Seri.</span>
        </Link>

        <div className="conf-nav-center">
          <Link to={ROUTES.HOME}>Home</Link>
          <Link to={ROUTES.CATALOGO}>Portfólio</Link>
          <a href={`${ROUTES.HOME}#como-funciona`}>Como funciona</a>
          <a href={`${ROUTES.HOME}#contato`}>Contato</a>
          <Link to={ROUTES.MEUS_PEDIDOS}>Meus pedidos</Link>
        </div>

        <div className="conf-nav-right">
          <div className="conf-nav-cta" style={{ cursor: 'default' }}>
            <div className="conf-nav-avatar">{initials}</div>
            Minha conta
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="conf-hero">
        <div className="conf-hero-bg" aria-hidden="true" />
        <div className="conf-hero-grid" aria-hidden="true" />

        {/* Ícone sucesso */}
        <div className="conf-s-ring">
          <div className="conf-s-circle">
            <svg width="34" height="34" fill="none" viewBox="0 0 24 24"
              stroke="#7EC89A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <p className="conf-eyebrow">Ficha registrada com sucesso</p>
        <h1 className="conf-h1">
          Sua arte está nas<br />nossas <em>mãos.</em>
        </h1>
        <p className="conf-p">
          Sua ficha técnica foi enviada ao estúdio. Guarde o código abaixo — ele é único
          e serve para rastrear seu pedido em qualquer momento.
        </p>

        {/* Código único */}
        <div className="conf-code-wrap">
          <div className="conf-code-card">
            <div className="conf-code-top">
              <span className="conf-code-lbl">Código único da ficha</span>
              <span className="conf-code-ts">{ts}</span>
            </div>
            <div className="conf-code-mid">
              <div className="conf-code-val">
                <span className="conf-prefix">SERI</span>‑2025‑{code}
              </div>
              <button
                className={`conf-btn-copy ${copied ? 'ok' : ''}`}
                onClick={copyCode}
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copiado!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copiar código
                  </>
                )}
              </button>
            </div>
            <div className="conf-code-bot">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Use este código para consultar status, referenciar no WhatsApp e rastrear na área do cliente
            </div>
          </div>
        </div>
      </div>

      {/* ── GRID ──────────────────────────────────────────────────────────── */}
      <div className="conf-grid">

        {/* O que acontece agora */}
        <div className="conf-gcard" style={{ animationDelay: '.55s' }}>
          <div className="conf-gcard-head">
            <div className="conf-g-icon">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className="conf-g-title">O que acontece agora?</div>
          </div>
          <div className="conf-gcard-body">

            <div className="conf-nstep">
              <div className="conf-nsdot done">
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div className="conf-ns-name">Ficha técnica criada</div>
                <div className="conf-ns-txt">Seus dados, arte e especificações foram registrados com o código único.</div>
                <span className="conf-tag g">Concluído agora</span>
              </div>
            </div>

            <div className="conf-nstep">
              <div className="conf-nsdot idle">2</div>
              <div>
                <div className="conf-ns-name">Análise pelo estúdio</div>
                <div className="conf-ns-txt">O gestor revisará sua ficha, verificará a arte e calculará o orçamento.</div>
                <span className="conf-tag m">Em até 24h</span>
              </div>
            </div>

            <div className="conf-nstep">
              <div className="conf-nsdot idle">3</div>
              <div>
                <div className="conf-ns-name">Orçamento via WhatsApp</div>
                <div className="conf-ns-txt">Você receberá o orçamento com valor, prazo e instruções de pagamento.</div>
                <span className="conf-tag w">Via WhatsApp</span>
              </div>
            </div>

            <div className="conf-nstep">
              <div className="conf-nsdot idle">4</div>
              <div>
                <div className="conf-ns-name">Produção iniciada</div>
                <div className="conf-ns-txt">Após aprovação seu pedido entra na fila e você acompanha o status aqui.</div>
                <span className="conf-tag m">Após aprovação</span>
              </div>
            </div>

          </div>
        </div>

        {/* Resumo da ficha */}
        <div className="conf-gcard" style={{ animationDelay: '.65s' }}>
          <div className="conf-gcard-head">
            <div className="conf-g-icon">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="conf-g-title">Resumo da ficha</div>
          </div>
          <div className="conf-gcard-body">
            <div className="conf-ri"><span className="conf-rk">Identificação</span><span className="conf-rv">Camisetas turma 2025</span></div>
            <div className="conf-ri"><span className="conf-rk">Tipo de peça</span><span className="conf-rv">Camiseta</span></div>
            <div className="conf-ri"><span className="conf-rk">Tecido</span><span className="conf-rv">100% Algodão · 180g/m²</span></div>
            <div className="conf-ri"><span className="conf-rk">Cor</span><span className="conf-rv">Preto</span></div>
            <div className="conf-ri"><span className="conf-rk">Tamanhos</span><span className="conf-rv">M, G</span></div>
            <div className="conf-ri"><span className="conf-rk">Posição da estampa</span><span className="conf-rv">Frente central</span></div>
            <div className="conf-ri"><span className="conf-rk">Total de peças</span><span className="conf-rv hi">12 peças</span></div>
            <div className="conf-ri"><span className="conf-rk">Arquivos</span><span className="conf-rv">1 arquivo enviado</span></div>
            <div className="conf-ri conf-ri-last">
              <span className="conf-rk">Orçamento</span>
              <span className="conf-rv-italic">Acordado via WhatsApp</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── AÇÕES ─────────────────────────────────────────────────────────── */}
      <div className="conf-actions">
        <Link to={ROUTES.CRIAR_FICHA} className="conf-a-sec">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Criar nova ficha
        </Link>
        <Link to={ROUTES.MEUS_PEDIDOS} className="conf-a-prim">
          Ver meus pedidos
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

    </div>
  )
}
