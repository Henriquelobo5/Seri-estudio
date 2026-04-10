import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import PageTransition from '../../components/PageTransition'
import logo from '../../assets/images/logo.png'
import seri1 from '../../assets/images/produtos/seri1.jpg'
import seri2 from '../../assets/images/produtos/seri2.jpg'
import seri3 from '../../assets/images/produtos/seri3.jpg'
import './Home.css'

// Declare spline-viewer web component for TypeScript
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'spline-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          url?: string
          'loading-anim-type'?: string
          background?: string
        },
        HTMLElement
      >
    }
  }
}

const MARQUEE_ITEMS = [
  'Serigrafia','Camisetas','Moletons','Ecobags','Estamparia',
  'Silk Screen','Personalização','Arte Digital','Upload de Arte','Código Único',
]

const STEPS = [
  {
    n: '01',
    title: 'Escolha a peça',
    desc: 'Navegue pelo catálogo e escolha entre camisetas, moletons, ecobags e mais.',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    n: '02',
    title: 'Envie sua arte',
    desc: 'Faça upload do seu arquivo em PDF, PNG ou AI direto na ficha técnica.',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Monte a ficha',
    desc: 'Configure cor, gramatura, tamanho e posição da estampa com precisão.',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    n: '04',
    title: 'Receba o orçamento',
    desc: 'O orçamento chega pelo WhatsApp automaticamente, pronto para aprovação.',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
]

const PORTFOLIO = [
  { tag: 'Silk colorido', title: 'Camiseta estampada — Turma 2025', img: seri1 },
  { tag: 'Serigrafia',    title: 'Moletom universitário',            img: seri2 },
  { tag: 'Ecobag',        title: 'Sacola personalizada',             img: seri3 },
]

const CTA_FEATURES = [
  'Upload PDF, PNG ou AI',
  'Código único por pedido',
  'Orçamento via WhatsApp',
  'Status em tempo real',
]

export default function Home() {
  const marqueeRef  = useRef<HTMLDivElement>(null)
  const glowRef     = useRef<HTMLDivElement>(null)
  const eyebrowRef  = useRef<HTMLSpanElement>(null)
  const stepsRef    = useRef<HTMLDivElement>(null)
  const statsRef    = useRef<HTMLDivElement>(null)
  const splineRef   = useRef<HTMLElement>(null)

  // ── overflow-x on body ──────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflowX = 'hidden'
    return () => { document.body.style.overflowX = '' }
  }, [])

  // ── Marquee ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const track = marqueeRef.current
    if (!track) return
    const all = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
    all.forEach(text => {
      const el = document.createElement('span')
      el.className = 'marquee-item'
      el.innerHTML = `${text}<span class="marquee-dot"></span>`
      track.appendChild(el)
    })
  }, [])

  // ── Cursor glow ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const glow = glowRef.current
    if (!glow) return
    let visible = false
    const onMove = (e: MouseEvent) => {
      glow.style.left = e.clientX + 'px'
      glow.style.top  = e.clientY + 'px'
      if (!visible) { glow.style.opacity = '1'; visible = true }
    }
    const onLeave = () => { glow.style.opacity = '0'; visible = false }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  // ── Scramble on eyebrow hover ────────────────────────────────────────────────
  useEffect(() => {
    const el = eyebrowRef.current
    if (!el) return
    const original = el.textContent ?? ''
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%'
    let animId: number
    const scramble = () => {
      let start: number | null = null
      const duration = 600
      const frame = (ts: number) => {
        if (!start) start = ts
        const progress = Math.min((ts - start) / duration, 1)
        const totalNonSpace = original.replace(/\s/g, '').length
        const revealed = Math.floor(progress * totalNonSpace)
        let result = ''
        let ci = 0
        for (let i = 0; i < original.length; i++) {
          if (original[i] === ' ' || original[i] === '\n') { result += original[i]; continue }
          result += ci < revealed
            ? original[i]
            : chars[Math.floor(Math.random() * chars.length)]
          ci++
        }
        el.textContent = result
        if (progress < 1) animId = requestAnimationFrame(frame)
        else el.textContent = original
      }
      animId = requestAnimationFrame(frame)
    }
    el.addEventListener('mouseenter', scramble)
    return () => {
      el.removeEventListener('mouseenter', scramble)
      cancelAnimationFrame(animId)
    }
  }, [])

  // ── Split chars — h1 ────────────────────────────────────────────────────────
  // Triggered via CSS transition with a short delay
  useEffect(() => {
    const timeout = setTimeout(() => {
      document.querySelectorAll('.home-page .hero-h1 .split-char').forEach(ch => ch.classList.add('in'))
    }, 200)
    return () => clearTimeout(timeout)
  }, [])

  // ── Step stagger ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const grid = stepsRef.current
    if (!grid) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          grid.querySelectorAll<HTMLElement>('.step-card').forEach((c, i) => {
            setTimeout(() => c.classList.add('in'), i * 120)
          })
          obs.unobserve(e.target)
        }
      })
    }, { threshold: .1 })
    obs.observe(grid)
    return () => obs.disconnect()
  }, [])

  // ── Scroll reveal ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: .1 })
    document.querySelectorAll('.home-page .reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  // ── Counter animation ────────────────────────────────────────────────────────
  useEffect(() => {
    const statsEl = statsRef.current
    if (!statsEl) return
    const data = [
      { val: 300, suffix: '+' },
      { val: 48,  suffix: 'h' },
      { val: 100, suffix: '%' },
    ]
    const animateCounter = (el: Element, target: number, suffix: string) => {
      let start: number | null = null
      const duration = 1200
      const step = (ts: number) => {
        if (!start) start = ts
        const p = Math.min((ts - start) / duration, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        el.textContent = Math.floor(target * ease) + suffix
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.stat-num').forEach((el, i) => {
            animateCounter(el, data[i].val, data[i].suffix)
          })
          obs.unobserve(e.target)
        }
      })
    }, { threshold: .5 })
    obs.observe(statsEl)
    return () => obs.disconnect()
  }, [])

  // ── Hide Spline logo ──────────────────────────────────────────────────────────
  useEffect(() => {
    const sv = splineRef.current as (HTMLElement & { shadowRoot: ShadowRoot | null }) | null
    if (!sv) return
    const tryHide = () => {
      const sh = sv.shadowRoot
      if (!sh) return
      const style = sh.querySelector('#hide-logo-style') ?? document.createElement('style')
      style.id = 'hide-logo-style'
      style.textContent = `
        #logo, [id*="logo"], a[href*="spline.design"],
        div[class*="logo"], canvas + div, canvas ~ a,
        div[style*="z-index: 10"], div[style*="z-index:10"] {
          display: none !important; opacity: 0 !important; pointer-events: none !important;
        }
      `
      if (!sh.querySelector('#hide-logo-style')) sh.appendChild(style)
    }
    sv.addEventListener('load', () => { tryHide(); setTimeout(tryHide, 500); setTimeout(tryHide, 1500) })
    const t1 = setTimeout(tryHide, 1000)
    const t2 = setTimeout(tryHide, 2500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // ── Build h1 with split chars ─────────────────────────────────────────────────
  const buildH1 = () => {
    let delay = 0
    const makeChars = (text: string) =>
      text.split('').map((ch, i) => {
        if (ch === '\n') return <br key={`br${i}`} />
        if (ch === ' ')  return <span key={`sp${i}`}>&nbsp;</span>
        const d = delay++ * 28
        return <span key={`c${i}`} className="split-char" style={{ transitionDelay: `${d}ms` }}>{ch}</span>
      })
    const line1 = makeChars('Sua arte,\nnossa ')
    const emChars = makeChars('tela.')
    return <>{line1}<em>{emChars}</em></>
  }

  return (
    <PageTransition>
      <div className="home-page">

        {/* Grain overlay */}
        <div className="home-grain" aria-hidden="true" />

        {/* Cursor glow */}
        <div className="cursor-glow" ref={glowRef} aria-hidden="true" />

        {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
        <nav className="home-nav">
          <Link to={ROUTES.HOME} className="nav-logo">
            <div className="nav-logo-img">
              <img src={logo} alt="Seri." />
            </div>
            <span className="nav-logo-text">Seri.</span>
          </Link>
          <div className="nav-links">
            <Link to={ROUTES.CATALOGO}>Catálogo</Link>
            <a href="#portfolio">Portfólio</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#contato">Contato</a>
            <Link to={ROUTES.LOGIN} className="nav-cta">Entrar</Link>
          </div>
        </nav>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="home-hero">
          <div className="hero-left">
            <span className="hero-eyebrow" ref={eyebrowRef}>Serigrafia sob encomenda</span>
            <h1 className="hero-h1">{buildH1()}</h1>
            <p className="hero-sub">
              Monte sua ficha técnica, envie sua arte e acompanhe seu pedido do início ao fim.
              Orçamento automático pelo WhatsApp.
            </p>
            <div className="hero-btns">
              <Link to={ROUTES.CRIAR_FICHA} className="btn-primary">
                Montar meu pedido
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <a href="#portfolio" className="btn-secondary">Ver portfólio</a>
            </div>
            <div className="hero-stats" ref={statsRef}>
              <div>
                <div className="stat-num">300+</div>
                <div className="stat-label">pedidos entregues</div>
              </div>
              <div>
                <div className="stat-num">48h</div>
                <div className="stat-label">prazo de orçamento</div>
              </div>
              <div>
                <div className="stat-num">100%</div>
                <div className="stat-label">digital</div>
              </div>
            </div>
          </div>

          {/* Spline 3D */}
          <div className="hero-right">
            <div className="hero-spline">
              <spline-viewer
                ref={splineRef as React.RefObject<HTMLElement>}
                url="https://prod.spline.design/rfUuD0pkFEL3StiT/scene.splinecode"
                loading-anim-type="none"
                background="rgba(13,15,12,0)"
              />
            </div>
          </div>
        </section>

        {/* ── MARQUEE ────────────────────────────────────────────────────── */}
        <div className="marquee-strip">
          <div className="marquee-track" ref={marqueeRef} />
        </div>

        {/* ── COMO FUNCIONA ──────────────────────────────────────────────── */}
        <section id="como-funciona" className="section-como">
          <p className="section-label reveal">Como funciona</p>
          <h2 className="section-h2 reveal">
            Do pedido à entrega,<br />
            <em>sem complicação.</em>
          </h2>
          <div className="steps-grid reveal" ref={stepsRef}>
            {STEPS.map(({ n, title, desc, icon }) => (
              <div key={n} className="step-card">
                <div className="step-n">{n}</div>
                <div className="step-icon">{icon}</div>
                <div className="step-title">{title}</div>
                <div className="step-desc">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PORTFÓLIO ──────────────────────────────────────────────────── */}
        <section id="portfolio" className="section-portfolio">
          <div className="portfolio-header reveal">
            <div>
              <p className="section-label">Portfólio</p>
              <h2 className="section-h2" style={{ marginBottom: 0 }}>Nossos Trabalhos.</h2>
            </div>
            <a href="#portfolio" className="btn-secondary" style={{ fontSize: 13, padding: '10px 22px' }}>
              Ver todos →
            </a>
          </div>
          <div className="portfolio-grid reveal">
            {PORTFOLIO.map(({ tag, title, img }) => (
              <div key={title} className="port-card">
                <img src={img} alt={title} className="port-img" />
                <div className="port-overlay">
                  <span className="port-tag">{tag}</span>
                  <div className="port-title">{title}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="section-cta">
          <div className="cta-inner reveal">
            <p className="section-label" style={{ marginBottom: 20 }}>Pronto para começar?</p>
            <h2 className="cta-h2">
              Sua próxima peça<br />começa <em>aqui.</em>
            </h2>
            <p className="cta-sub">
              Nossa ficha técnica digital garante que você especifica exatamente o que quer —
              sem idas e vindas no WhatsApp.
            </p>
            <Link to={ROUTES.CRIAR_FICHA} className="btn-primary" style={{ display: 'inline-flex' }}>
              Começar agora
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <div className="cta-features">
              {CTA_FEATURES.map(feat => (
                <div key={feat} className="cta-feat">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer id="contato" className="home-footer">
          <span className="footer-brand">Seri.</span>
          <div className="footer-links">
            <a href="#">Instagram</a>
            <a href="#">WhatsApp</a>
            <a href="#">Privacidade</a>
          </div>
          <span className="footer-copy">© 2025 Seri.estudio</span>
        </footer>

      </div>
    </PageTransition>
  )
}
