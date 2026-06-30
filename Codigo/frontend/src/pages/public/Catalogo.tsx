import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageTransition from '../../components/PageTransition'
import AuthNavCta from '../../components/ui/AuthNavCta'
import MyOrdersLink from '../../components/ui/MyOrdersLink'
import { ROUTES } from '../../routes/routePaths'
import logo from '../../assets/images/logo.png'
import seri2 from '../../assets/images/produtos/seri2.jpg'
import seri3 from '../../assets/images/produtos/seri3.jpg'
import ecobag from '../../assets/images/produtos/ecobag-portfolio.jpg'
import crewneckCobra from '../../assets/images/produtos/crewneck-cobra.jpg'
import camisetaDavid from '../../assets/images/produtos/camiseta-david.jpg'
import crewneckTreinador from '../../assets/images/produtos/crewneck-treinador.jpg'
import camisetaRqbt from '../../assets/images/produtos/camiseta-rqbt.jpg'
import camisetaOlho from '../../assets/images/produtos/camiseta-olho.jpg'
import camisetaScience from '../../assets/images/produtos/camiseta-science.jpg'
import camisetaRqbtVerde from '../../assets/images/produtos/camiseta-rqbt-verde.jpg'
import crewneckSeri from '../../assets/images/produtos/crewneck-seri.jpg'
import regataBasquete from '../../assets/images/produtos/regata-basquete.jpg'
import './Home.css'
import './Catalogo.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

type PortfolioItem = {
  idItem: number
  titulo: string
  descricaoTecnica: string | null
  urlImagem: string | null
  categoria: string
}

type Produto = {
  id: string
  nome: string
  categoria: string
  tecido: string
  gramatura: string
  preco: string
  imagem?: string
  badge?: string
}

const TODOS_PRODUTOS: Produto[] = [
  {
    id: 'camiseta-rqbt-verde',
    nome: 'CAMISETA RYAN QUEIROZ BT',
    categoria: 'Camiseta',
    tecido: '100% Algodao',
    gramatura: '180g/m2',
    preco: 'R$ 119,00',
    imagem: camisetaRqbtVerde,
  },
  {
    id: 'camiseta-chorão',
    nome: 'CAMISETA CHORÃO',
    categoria: 'Camiseta',
    tecido: '100% Algodao',
    gramatura: '180g/m2',
    preco: 'R$ 130,00',
    imagem: seri2,
  },
  {
    id: 'crewneck-seri',
    nome: 'CREWNECK SERI ESTÚDIO',
    categoria: 'Moletom',
    tecido: 'Moletinho',
    gramatura: '300g/m2',
    preco: 'R$ 99,00',
    imagem: crewneckSeri,
  },
  {
    id: 'camiseta-calamidade-publica',
    nome: 'CAMISETA CALAMIDADE PÚBLICA',
    categoria: 'Camiseta',
    tecido: '100% Algodao',
    gramatura: '180g/m2',
    preco: 'R$ 90,00',
    imagem: seri3,
  },
  {
    id: 'camiseta-david',
    nome: 'CAMISETA ARTE DAVID',
    categoria: 'Camiseta',
    tecido: '100% Algodao',
    gramatura: '180g/m2',
    preco: 'R$ 119,00',
    imagem: camisetaDavid,
  },
  {
    id: 'camiseta-seri-basketball',
    nome: 'CAMISETA SERI BASKETBALL',
    categoria: 'Camiseta',
    tecido: '100% Algodao',
    gramatura: '180g/m2',
    preco: 'R$ 119,00',
    imagem: crewneckCobra,
  },
  {
    id: 'camiseta-science-phd',
    nome: 'CAMISETA SCIENCE PHD',
    categoria: 'Camiseta',
    tecido: '100% Algodao',
    gramatura: '180g/m2',
    preco: 'R$ 119,00',
    imagem: camisetaScience,
  },
  {
    id: 'camiseta-ar-treinador',
    nome: 'CAMISETA AR TREINADOR',
    categoria: 'Camiseta',
    tecido: '100% Algodao',
    gramatura: '180g/m2',
    preco: 'R$ 119,00',
    imagem: crewneckTreinador,
  },
  {
    id: 'camiseta-rqbt-dark',
    nome: 'CAMISETA RYAN QUEIROZ TEAM',
    categoria: 'Camiseta',
    tecido: '100% Algodao',
    gramatura: '180g/m2',
    preco: 'R$ 119,00',
    imagem: camisetaRqbt,
  },
  {
    id: 'camiseta-olho',
    nome: 'CAMISETA OLHO SERIGRAFIA',
    categoria: 'Camiseta',
    tecido: '100% Algodao',
    gramatura: '180g/m2',
    preco: 'R$ 119,00',
    imagem: camisetaOlho,
  },
  {
    id: 'regata-nba',
    nome: 'REGATA NBA SERIGRAFIA',
    categoria: 'Regata',
    tecido: 'Malha Fio 30',
    gramatura: '160g/m2',
    preco: 'R$ 70,00',
    imagem: regataBasquete,
  },
  {
    id: 'ecobag-personalizada',
    nome: 'ECOBAG PERSONALIZADA',
    categoria: 'Ecobag',
    tecido: '100% Algodao',
    gramatura: '200g/m2',
    preco: 'R$ 22,00',
    imagem: ecobag,
  },
]

const CATEGORIAS = ['Camiseta', 'Moletom', 'Regata', 'Polo', 'Ecobag']
const TECIDOS = ['100% Algodao', 'Malha Fio 30', 'Dry Fit', 'Moletinho']
const GRAMATURAS = ['160g/m2', '180g/m2', '200g/m2', '300g/m2']

function buildAnimatedText(text: string, keyPrefix: string) {
  let delayIndex = 0

  return text.split('').map((char, index) => {
    if (char === ' ') {
      return <span key={`${keyPrefix}-space-${index}`}>&nbsp;</span>
    }

    const transitionDelay = `${delayIndex * 28}ms`
    delayIndex += 1

    return (
      <span
        key={`${keyPrefix}-${index}`}
        className="split-char"
        style={{ transitionDelay }}
      >
        {char}
      </span>
    )
  })
}

function formatarNomeProduto(nome: string) {
  return nome
    .toLowerCase()
    .split(' ')
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ')
}

function IconeProduto({ categoria }: { categoria: string }) {
  if (categoria === 'Regata') {
    return (
      <svg
        className="catalog-product-icon-svg"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M22 16L28 10H36L42 16L48 20V54H16V20L22 16Z"
          fill="currentColor"
          opacity="0.18"
        />
        <path
          d="M22 16L28 10H36L42 16L48 20V54H16V20L22 16Z"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M28 10V20C28 22.2 29.8 24 32 24C34.2 24 36 22.2 36 20V10"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (categoria === 'Polo') {
    return (
      <svg
        className="catalog-product-icon-svg"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M24 12L32 18L40 12L50 18L44 30V54H20V30L14 18L24 12Z"
          fill="currentColor"
          opacity="0.18"
        />
        <path
          d="M24 12L32 18L40 12L50 18L44 30V54H20V30L14 18L24 12Z"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M28 16L32 22L36 16"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M32 22V30"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (categoria === 'Ecobag') {
    return (
      <svg
        className="catalog-product-icon-svg"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M18 24H46L42 54H22L18 24Z"
          fill="currentColor"
          opacity="0.18"
        />
        <path
          d="M18 24H46L42 54H22L18 24Z"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M24 24V20C24 15.6 27.6 12 32 12C36.4 12 40 15.6 40 20V24"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg
      className="catalog-product-icon-svg"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 16L28 12H36L44 16L52 22L46 32V54H18V32L12 22L20 16Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M20 16L28 12H36L44 16L52 22L46 32V54H18V32L12 22L20 16Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M28 12L32 18L36 12"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Catalogo() {
  const navigate = useNavigate()
  const [categoriasAtivas, setCategoriasAtivas] = useState<string[]>([])
  const [tecidosAtivos, setTecidosAtivos] = useState<string[]>([])
  const [gramaturasAtivas, setGramaturasAtivas] = useState<string[]>([])
  const [filtroAberto, setFiltroAberto] = useState(false)
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(true)

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/portfolio`)
      if (res.ok) {
        const data: PortfolioItem[] = await res.json()
        setPortfolioItems(data)
      }
    } catch {
      // fallback: mantém array vazio, mostra produtos estáticos
    } finally {
      setPortfolioLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(ROUTES.HOME)
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      document
        .querySelectorAll<HTMLElement>('.catalog-page .split-char')
        .forEach((char) => char.classList.add('in'))
    }, 180)

    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 }
    )

    document
      .querySelectorAll<HTMLElement>('.catalog-page .reveal')
      .forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [portfolioLoading, portfolioItems])

  const toggleCategoria = (categoria: string) => {
    setCategoriasAtivas((atual) =>
      atual.includes(categoria)
        ? atual.filter((item) => item !== categoria)
        : [...atual, categoria]
    )
  }

  const toggleTecido = (tecido: string) => {
    setTecidosAtivos((atual) =>
      atual.includes(tecido)
        ? atual.filter((item) => item !== tecido)
        : [...atual, tecido]
    )
  }

  const toggleGramatura = (gramatura: string) => {
    setGramaturasAtivas((atual) =>
      atual.includes(gramatura)
        ? atual.filter((item) => item !== gramatura)
        : [...atual, gramatura]
    )
  }

  const limparFiltros = () => {
    setCategoriasAtivas([])
    setTecidosAtivos([])
    setGramaturasAtivas([])
  }

  const produtosFiltrados = useMemo(() => {
    return TODOS_PRODUTOS.filter((produto) => {
      const categoriaOk =
        categoriasAtivas.length === 0 || categoriasAtivas.includes(produto.categoria)
      const tecidoOk =
        tecidosAtivos.length === 0 || tecidosAtivos.includes(produto.tecido)
      const gramaturaOk =
        gramaturasAtivas.length === 0 || gramaturasAtivas.includes(produto.gramatura)

      return categoriaOk && tecidoOk && gramaturaOk
    })
  }, [categoriasAtivas, tecidosAtivos, gramaturasAtivas])

  const filtrosAtivos = useMemo(
    () => [
      ...categoriasAtivas.map((label) => ({ label })),
      ...tecidosAtivos.map((label) => ({ label })),
      ...gramaturasAtivas.map((label) => ({ label })),
    ],
    [categoriasAtivas, tecidosAtivos, gramaturasAtivas]
  )

  const labelsNoBotao = filtrosAtivos.slice(0, 2)
  const filtrosRestantes = Math.max(filtrosAtivos.length - labelsNoBotao.length, 0)

  const contarPorFiltro = (
    campo: 'categoria' | 'tecido' | 'gramatura',
    valor: string
  ) => TODOS_PRODUTOS.filter((produto) => produto[campo] === valor).length

  return (
    <PageTransition>
      <div className="catalog-page home-page">
        <div className="home-grain" aria-hidden="true" />

        <nav className="home-nav">
          <Link to={ROUTES.HOME} className="nav-logo">
            <div className="nav-logo-img">
              <img src={logo} alt="Seri." />
            </div>
            <span className="nav-logo-text">Seri.</span>
          </Link>

          <div className="nav-links">
            <Link to={ROUTES.HOME}>Home</Link>
            <Link to={ROUTES.CATALOGO} className="nav-link-active">
              {'Portf\u00F3lio'}
            </Link>
            <a href={`${ROUTES.HOME}#como-funciona`}>Como funciona</a>
            <a href={`${ROUTES.HOME}#contato`}>Contato</a>
            <MyOrdersLink hideForAdmin>Meus pedidos</MyOrdersLink>
            <AuthNavCta className="nav-cta" />
          </div>
        </nav>

        <main className="catalog-main">
          <section className="catalog-panel">
            <div className="catalog-back-row reveal">
              <button type="button" className="catalog-back-button" onClick={handleBack}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                Voltar
              </button>
            </div>

            <div className="catalog-toolbar reveal">
              <div className="catalog-heading reveal">
                <p className="section-label catalog-kicker">Portfólio</p>
                <h1 className="catalog-title">
                  {buildAnimatedText('Nossos', 'catalog-title')}
                  <span>&nbsp;</span>
                  <em>{buildAnimatedText('Trabalhos.', 'catalog-title-em')}</em>
                </h1>
              </div>

              <div className="catalog-toolbar-actions">
                <div className="catalog-filter-wrap">
                  <button
                    type="button"
                    className={`catalog-filter-button ${filtroAberto ? 'is-active' : ''}`}
                    onClick={() => setFiltroAberto((valor) => !valor)}
                  >
                    <span className="catalog-filter-icon" aria-hidden="true">
                      <svg viewBox="0 0 16 16" fill="none">
                        <path
                          d="M2.5 4H13.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M4.5 8H11.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M6.5 12H9.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>

                    <span className="catalog-filter-copy">
                      <strong>Filtrar</strong>
                    </span>

                    {labelsNoBotao.length > 0 && (
                      <span className="catalog-filter-inline">
                        {labelsNoBotao.map((filtro) => (
                          <span key={filtro.label} className="catalog-filter-inline-chip">
                            {filtro.label}
                          </span>
                        ))}

                        {filtrosRestantes > 0 && (
                          <span className="catalog-filter-inline-chip">+{filtrosRestantes}</span>
                        )}
                      </span>
                    )}
                  </button>

                  {filtroAberto && (
                    <div className="catalog-filter-popover">
                      <div className="catalog-filter-popover-head">
                        <div>
                          <p>Filtros</p>
                          <strong>Refine o catálogo</strong>
                        </div>

                        {filtrosAtivos.length > 0 && (
                          <button type="button" onClick={limparFiltros}>
                            Limpar
                          </button>
                        )}
                      </div>

                      <div className="catalog-filter-group">
                        <span className="catalog-filter-group-title">Categoria</span>
                        <div className="catalog-filter-options">
                          {CATEGORIAS.map((categoria) => (
                            <button
                              key={categoria}
                              type="button"
                              className={`catalog-filter-pill ${
                                categoriasAtivas.includes(categoria) ? 'is-active' : ''
                              }`}
                              onClick={() => toggleCategoria(categoria)}
                            >
                              <span>{categoria}</span>
                              <small>{contarPorFiltro('categoria', categoria)}</small>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="catalog-filter-group">
                        <span className="catalog-filter-group-title">Tecido</span>
                        <div className="catalog-filter-options">
                          {TECIDOS.map((tecido) => (
                            <button
                              key={tecido}
                              type="button"
                              className={`catalog-filter-pill ${
                                tecidosAtivos.includes(tecido) ? 'is-active' : ''
                              }`}
                              onClick={() => toggleTecido(tecido)}
                            >
                              <span>{tecido}</span>
                              <small>{contarPorFiltro('tecido', tecido)}</small>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="catalog-filter-group">
                        <span className="catalog-filter-group-title">Gramatura</span>
                        <div className="catalog-filter-options">
                          {GRAMATURAS.map((gramatura) => (
                            <button
                              key={gramatura}
                              type="button"
                              className={`catalog-filter-pill ${
                                gramaturasAtivas.includes(gramatura) ? 'is-active' : ''
                              }`}
                              onClick={() => toggleGramatura(gramatura)}
                            >
                              <span>{gramatura}</span>
                              <small>{contarPorFiltro('gramatura', gramatura)}</small>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {portfolioItems.length > 0 && (
              <div className="catalog-status-bar reveal">
                <span>
                  {portfolioItems.length} trabalho
                  {portfolioItems.length !== 1 ? 's' : ''} no portfólio
                </span>
              </div>
            )}

            {portfolioItems.length > 0 ? (
              <div className="catalog-grid">
                {portfolioItems.map((item, index) => (
                  <Link
                    key={item.idItem}
                    to={ROUTES.CRIAR_FICHA}
                    className="catalog-product-card reveal"
                    style={{ transitionDelay: `${Math.min(index, 7) * 55}ms` }}
                  >
                    <div className="catalog-product-media">
                      {item.urlImagem ? (
                        <img src={item.urlImagem} alt={item.titulo} />
                      ) : (
                        <div className="catalog-product-icon">
                          <IconeProduto categoria={item.categoria} />
                        </div>
                      )}
                      <span className="catalog-product-badge catalog-portfolio-cat">{item.categoria}</span>
                    </div>

                    <div className="catalog-product-body">
                      <h3 className="catalog-product-name">{formatarNomeProduto(item.titulo)}</h3>
                      {item.descricaoTecnica && (
                        <span className="catalog-product-desc">{item.descricaoTecnica}</span>
                      )}
                      <span className="catalog-product-action">
                        -&gt; Montar ficha técnica &lt;-
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : portfolioLoading ? (
              <div className="catalog-empty-state">
                <p>Carregando portfólio...</p>
              </div>
            ) : (
              <>
                <div className="catalog-status-bar reveal">
                  <span>
                    {produtosFiltrados.length} produto
                    {produtosFiltrados.length !== 1 ? 's' : ''}
                  </span>

                  {filtrosAtivos.length > 0 && (
                    <button
                      type="button"
                      className="catalog-clear-inline"
                      onClick={limparFiltros}
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>

                {produtosFiltrados.length === 0 ? (
                  <div className="catalog-empty-state">
                    <h3>Nenhum produto encontrado</h3>
                    <p>Remova alguns filtros para voltar a ver as peças disponíveis.</p>
                  </div>
                ) : (
                  <div className="catalog-grid">
                    {produtosFiltrados.map((produto, index) => (
                      <Link
                        key={produto.id}
                        to={ROUTES.CRIAR_FICHA}
                        className="catalog-product-card reveal"
                        style={{ transitionDelay: `${Math.min(index, 7) * 55}ms` }}
                      >
                        <div className="catalog-product-media">
                          {produto.imagem ? (
                            <img src={produto.imagem} alt={produto.nome} />
                          ) : (
                            <div className="catalog-product-icon">
                              <IconeProduto categoria={produto.categoria} />
                            </div>
                          )}

                          {produto.badge && (
                            <span className="catalog-product-badge">{produto.badge}</span>
                          )}
                        </div>

                        <div className="catalog-product-body">
                          <h3 className="catalog-product-name">
                            {formatarNomeProduto(produto.nome)}
                          </h3>
                          <span className="catalog-product-action">
                            -&gt; Montar ficha técnica &lt;-
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        <section className="catalog-cta">
          <div className="catalog-cta-card reveal">
            <div className="catalog-cta-copy">
              <p className="section-label">Próximo passo</p>
              <h2 className="catalog-cta-title">
                {buildAnimatedText('Vamos montar sua', 'catalog-cta')}
                <br />
                <em>{buildAnimatedText('ficha técnica?', 'catalog-cta-em')}</em>
              </h2>
            </div>

            <div className="catalog-cta-actions">
              <Link to={ROUTES.CRIAR_FICHA} className="btn-primary">
                Criar ficha técnica
              </Link>
            </div>
          </div>
        </section>

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
