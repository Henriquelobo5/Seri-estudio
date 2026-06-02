import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import AuthNavCta from '../../components/ui/AuthNavCta'
import MyOrdersLink from '../../components/ui/MyOrdersLink'
import logo from '../../assets/images/logo.png'
import { resolveModelagemGramaturaFromDetails } from '../../utils/fichaEspecificacoes'
import './Confirmacao.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '5531999159678').replace(/\D/g, '')

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
  const location = useLocation()
  const state = (location.state ?? {}) as { total?: number; codigoDisplay?: string; fichaData?: any }
  const totalPecas: number = state.total ?? 0
  const fichaData = state.fichaData ?? {}
  const modelagemGramatura = resolveModelagemGramaturaFromDetails(fichaData, fichaData.tipo)

  const fallbackCode = useMemo(() => String(Math.floor(1000 + Math.random() * 9000)), [])
  // Usa o código real do backend se disponível, senão gera localmente
  const code = state.codigoDisplay ?? `SERI-2025-${fallbackCode}`
  const [copied, setCopied] = useState(false)

  const now    = useMemo(() => new Date(), [])
  const ts     = `${now.getDate()} ${MESES[now.getMonth()]} ${now.getFullYear()} · ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const fullCode = code
  // Link direto para o admin analisar a ficha
  const fichaLink = `${window.location.origin}/ficha/detalhes/${fullCode}`

  // Monta mensagem WhatsApp com seções estruturadas
  type ItemTipo = { tipo: string; modelagemGramatura: string; tamanhos: string[]; quantidadesPorTamanho: Record<string, number> }
  const itensPorTipo = fichaData.itensPorTipo as Record<string, ItemTipo> | undefined
  const tiposSelecionados = (fichaData.tiposSelecionados as string[] | undefined) ?? []
  const hasPerTipo = !!itensPorTipo && tiposSelecionados.length > 0

  function totalPorTipo(tipo: string): number {
    if (!itensPorTipo?.[tipo]) return 0
    return Object.values(itensPorTipo[tipo].quantidadesPorTamanho).reduce((s, v) => s + (Number(v) || 0), 0)
  }

  const linhas: string[] = []
  linhas.push('Olá, equipe Seri! Acabei de enviar uma ficha técnica e quero continuar o atendimento. ')
  linhas.push('')

  if (fullCode) { linhas.push(`-Código da ficha: ${fullCode}`); linhas.push('') }
  if (totalPecas > 0) { linhas.push(`-Total de peças: ${totalPecas}`); linhas.push('') }

  if (hasPerTipo) {
    linhas.push('-Tipo de peça-')
    for (const tipo of tiposSelecionados) linhas.push(`${tipo}: ${totalPorTipo(tipo)}`)
    linhas.push('')

    if (fichaData.cor) {
      linhas.push('-Cor-')
      linhas.push(tiposSelecionados.map(tipo => {
        const qtd = totalPorTipo(tipo)
        return qtd > 1 ? `${tipo} ${fichaData.cor} (${qtd}x)` : `${tipo} ${fichaData.cor}`
      }).join(', '))
      linhas.push('')
    }

    const temGramatura = tiposSelecionados.some(t => itensPorTipo?.[t]?.modelagemGramatura)
    if (temGramatura) {
      linhas.push('-Gramatura e Modelagem-')
      for (const tipo of tiposSelecionados) {
        const mg = itensPorTipo?.[tipo]?.modelagemGramatura
        if (mg) linhas.push(`${tipo}: ${mg} `)
      }
      linhas.push('')
    }

    const temTamanhos = tiposSelecionados.some(t => itensPorTipo?.[t]?.tamanhos?.length)
    if (temTamanhos) {
      linhas.push('-Tamanhos-')
      for (const tipo of tiposSelecionados) {
        const tams = itensPorTipo?.[tipo]?.tamanhos
        if (tams?.length) linhas.push(`${tipo} - ${tams.join(', ')} `)
      }
      linhas.push('')
    }
  } else {
    if (fichaData.tipo) { linhas.push(`-Tipo de peça: ${fichaData.tipo}`); linhas.push('') }
    if (fichaData.cor) { linhas.push(`-Cor: ${fichaData.cor}`); linhas.push('') }
    if (modelagemGramatura) { linhas.push(`-Gramatura e Modelagem: ${modelagemGramatura}`); linhas.push('') }
    const tamanhoStr = Array.isArray(fichaData.tamanhos) ? fichaData.tamanhos.join(', ') : fichaData.tamanhos
    if (tamanhoStr) { linhas.push(`-Tamanhos: ${tamanhoStr}`); linhas.push('') }
  }

  if (fichaData.posicao) {
    linhas.push('-Posição da estampa-')
    fichaData.posicao.split(', ').forEach((p: string) => linhas.push(`${p} `))
    linhas.push('')
  }

  if (fichaData.arquivos && fichaData.arquivos > 0) {
    linhas.push(`-Arquivos enviados: ${fichaData.arquivos} `)
    linhas.push('')
  }

  if (fichaData.enderecoEntrega) {
    linhas.push('-endereço de entrega-')
    linhas.push(`${fichaData.enderecoEntrega} `)
    linhas.push('')
  }

  linhas.push(`Acesse a ficha: ${fichaLink}`)

  const whatsappMessage = linhas.join('\n')
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`

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
          <MyOrdersLink hideForAdmin>Meus pedidos</MyOrdersLink>
        </div>

        <div className="conf-nav-right">
          <AuthNavCta className="conf-nav-cta" />
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
                {code}
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
            <div className="conf-wa-cta-wrap">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="conf-wa-cta"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.522 5.84L.057 23.882a.5.5 0 0 0 .611.632l6.262-1.638A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.012-1.373l-.36-.214-3.716.973.99-3.617-.235-.371A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                </svg>
                Enviar mensagem no WhatsApp
              </a>
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
            <div className="conf-ri"><span className="conf-rk">Identificação</span><span className="conf-rv">{fichaData.identificacao || '—'}</span></div>
            <div className="conf-ri"><span className="conf-rk">Tipo de peça</span><span className="conf-rv">{fichaData.tipo || '—'}</span></div>
            <div className="conf-ri"><span className="conf-rk">Gramatura e Modelagem</span><span className="conf-rv">{modelagemGramatura || '—'}</span></div>
            <div className="conf-ri"><span className="conf-rk">Cor</span><span className="conf-rv">{fichaData.cor || '—'}</span></div>
            <div className="conf-ri"><span className="conf-rk">Tamanhos</span><span className="conf-rv">{Array.isArray(fichaData.tamanhos) ? fichaData.tamanhos.join(', ') : fichaData.tamanhos || '—'}</span></div>
            <div className="conf-ri"><span className="conf-rk">Posição da estampa</span><span className="conf-rv">{fichaData.posicao || '—'}</span></div>
            <div className="conf-ri"><span className="conf-rk">Total de peças</span><span className="conf-rv hi">{totalPecas} peça{totalPecas !== 1 ? 's' : ''}</span></div>
            <div className="conf-ri"><span className="conf-rk">Arquivos</span><span className="conf-rv">{fichaData.arquivos ?? 0} arquivo{(fichaData.arquivos ?? 0) !== 1 ? 's' : ''} enviado{(fichaData.arquivos ?? 0) !== 1 ? 's' : ''}</span></div>
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
        <MyOrdersLink className="conf-a-prim">
          Ver meus pedidos
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
        </MyOrdersLink>
      </div>

    </div>
  )
}
