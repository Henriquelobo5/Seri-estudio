import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import logo from '../../assets/images/logo.png'
import seri1 from '../../assets/images/produtos/seri1.jpg'
import seri2 from '../../assets/images/produtos/seri2.jpg'
import seri3 from '../../assets/images/produtos/seri3.jpg'
import seri4 from '../../assets/images/produtos/seri4.jpg'
import seri5 from '../../assets/images/produtos/seri5.jpg'
import seri6 from '../../assets/images/produtos/seri6.jpg'
import ecobag from '../../assets/images/produtos/ecobag.png'

type Produto = {
  id: number
  nome: string
  descricao: string
  categoria: string
  tecido: string
  gramatura: string
  preco: number
  badge?: string
  imagem?: string
}

const TODOS_PRODUTOS: Produto[] = [
  { id: 1, nome: 'CAMISETA HOLLOWAY', descricao: 'Gola careca, corte reto, ideal para estampas grandes.', categoria: 'Camiseta', tecido: '100% Algodão', gramatura: '180g/m²', preco: 119, badge: 'Mais pedido', imagem: seri1 },
  { id: 2, nome: 'CAMISETA CHORÃO', descricao: 'Caimento amplo, ombro caído, perfeito para silk.', categoria: 'Camiseta', tecido: 'Malha Fio 30', gramatura: '200g/m²', preco: 139, imagem: seri2 },
  { id: 3, nome: 'CAMISETA CALAMIDADE PÚBLICA', descricao: 'Corte feminino, gola redonda, tecido leve.', categoria: 'Camiseta', tecido: '100% Algodão', gramatura: '160g/m²', preco: 109, imagem: seri3 },
  { id: 4, nome: 'CAMISETA ARRASCAETA', descricao: 'Gola V, corte slim, ótimo para estampas frontais.', categoria: 'Camiseta', tecido: 'Malha Fio 30', gramatura: '180g/m²', preco: 124, imagem: seri4 },
  { id: 5, nome: 'CAMISETA SERI MEMÓRIAS', descricao: 'Manga longa, ideal para clima frio ou estampas de manga.', categoria: 'Camiseta', tecido: '100% Algodão', gramatura: '200g/m²', preco: 129, imagem: seri5 },
  { id: 6, nome: 'CAMISETA ANTI VISAGISM CLUB', descricao: 'Tecido técnico de alta performance para uniformes esportivos.', categoria: 'Camiseta', tecido: 'Dry Fit', gramatura: '160g/m²', preco: 119, imagem: seri6 },
  { id: 7, nome: 'Moletom Canguru', descricao: 'Com bolso canguru e capuz, ótimo para bordado.', categoria: 'Moletom', tecido: 'Moletinho', gramatura: '300g/m²', preco: 189, badge: 'Novo' },
  { id: 8, nome: 'Moletom Raglan', descricao: 'Manga contrastante, visual urbano e moderno.', categoria: 'Moletom', tecido: 'Moletinho', gramatura: '300g/m²', preco: 169 },
  { id: 9, nome: 'Moletom Crewneck', descricao: 'Gola careca sem capuz, clássico e versátil para estampas.', categoria: 'Moletom', tecido: 'Moletinho', gramatura: '300g/m²', preco: 159 },
  { id: 10, nome: 'Moletom Aberto', descricao: 'Com zíper frontal, ideal para uniformes e eventos.', categoria: 'Moletom', tecido: 'Moletinho', gramatura: '300g/m²', preco: 199 },
  { id: 11, nome: 'Regata Básica', descricao: 'Regata simples, ideal para estampas grandes no torso.', categoria: 'Regata', tecido: '100% Algodão', gramatura: '160g/m²', preco: 109 },
  { id: 12, nome: 'Regata Cavada', descricao: 'Modelo cavado, muito usado em uniformes de academia.', categoria: 'Regata', tecido: '100% Algodão', gramatura: '160g/m²', preco: 104 },
  { id: 13, nome: 'Regata Dry Fit', descricao: 'Tecido técnico, perfeito para uniformes esportivos.', categoria: 'Regata', tecido: 'Dry Fit', gramatura: '160g/m²', preco: 119 },
  { id: 14, nome: 'Polo Piquê', descricao: 'Polo tradicional com gola e punhos em piquê.', categoria: 'Polo', tecido: 'Malha Fio 30', gramatura: '200g/m²', preco: 149 },
  { id: 15, nome: 'Polo Malha', descricao: 'Polo leve em malha, confortável para o dia a dia.', categoria: 'Polo', tecido: 'Malha Fio 30', gramatura: '180g/m²', preco: 134 },
  { id: 16, nome: 'Ecobag Básica', descricao: 'Sacola de algodão reforçado, ideal para brindes.', categoria: 'Ecobag', tecido: '100% Algodão', gramatura: '180g/m²', preco: 22, imagem: ecobag },
]

const CATEGORIAS = ['Camiseta', 'Moletom', 'Regata', 'Polo', 'Ecobag']
const TECIDOS = ['100% Algodão', 'Malha Fio 30', 'Dry Fit', 'Moletinho']
const GRAMATURAS = ['160g/m²', '180g/m²', '200g/m²', '300g/m²']
const ORDENACAO = ['Mais relevantes', 'Menor preço', 'Maior preço', 'Nome A-Z']

function contarPorFiltro(campo: keyof Produto, valor: string) {
  return TODOS_PRODUTOS.filter(p => p[campo] === valor).length
}

function IconeProduto({ categoria }: { categoria: string }) {
  if (categoria === 'Camiseta') return (
    <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 opacity-70">
      <path d="M8 20 L20 12 L24 18 L32 14 L40 18 L44 12 L56 20 L50 28 L44 26 L44 54 L20 54 L20 26 L14 28 Z" fill="#7EC89A" />
    </svg>
  )
  if (categoria === 'Moletom') return (
    <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 opacity-70">
      <path d="M8 20 L20 12 Q32 9 44 12 L56 20 L50 28 L44 26 L44 54 L20 54 L20 26 L14 28 Z" fill="#C4A97A" />
      <path d="M24 12 Q32 16 40 12" stroke="#A08050" strokeWidth="2" fill="none" />
      <rect x="22" y="44" width="20" height="5" rx="2.5" fill="#A08050" />
    </svg>
  )
  if (categoria === 'Regata') return (
    <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 opacity-70">
      <path d="M22 12 Q32 9 42 12 L44 54 L20 54 Z" fill="#7EC89A" />
      <path d="M22 12 Q26 18 32 14 Q38 18 42 12" stroke="#5AAA7A" strokeWidth="2" fill="none" />
    </svg>
  )
  if (categoria === 'Polo') return (
    <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 opacity-70">
      <path d="M8 20 L20 12 L24 17 L32 12 L40 17 L44 12 L56 20 L50 28 L44 26 L44 54 L20 54 L20 26 L14 28 Z" fill="#7A9EC4" />
      <rect x="28" y="12" width="8" height="12" rx="1.5" fill="#5A7EA4" />
    </svg>
  )
  if (categoria === 'Ecobag') return (
    <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 opacity-70">
      <rect x="14" y="26" width="36" height="30" rx="4" fill="#C4A97A" />
      <path d="M24 26 Q24 14 32 14 Q40 14 40 26" stroke="#A08050" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
  return null
}

export default function Catalogo() {
  const [categoriasAtivas, setCategoriasAtivas] = useState<string[]>([])
  const [tecidosAtivos, setTecidosAtivos] = useState<string[]>([])
  const [gramaturaAtiva, setGramaturaAtiva] = useState<string[]>([])
  const [ordenacao, setOrdenacao] = useState('Mais relevantes')
  const [filtroAberto, setFiltroAberto] = useState(false)

  function toggleFiltro<T>(list: T[], item: T, setter: (v: T[]) => void) {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item])
  }

  function limparFiltros() {
    setCategoriasAtivas([])
    setTecidosAtivos([])
    setGramaturaAtiva([])
  }

  const produtosFiltrados = useMemo(() => {
    let result = TODOS_PRODUTOS

    if (categoriasAtivas.length > 0)
      result = result.filter(p => categoriasAtivas.includes(p.categoria))
    if (tecidosAtivos.length > 0)
      result = result.filter(p => tecidosAtivos.includes(p.tecido))
    if (gramaturaAtiva.length > 0)
      result = result.filter(p => gramaturaAtiva.includes(p.gramatura))

    if (ordenacao === 'Menor preço') result = [...result].sort((a, b) => a.preco - b.preco)
    else if (ordenacao === 'Maior preço') result = [...result].sort((a, b) => b.preco - a.preco)
    else if (ordenacao === 'Nome A-Z') result = [...result].sort((a, b) => a.nome.localeCompare(b.nome))

    return result
  }, [categoriasAtivas, tecidosAtivos, gramaturaAtiva, ordenacao])

  const filtrosAtivos = [
    ...categoriasAtivas.map(c => ({ label: c, remover: () => toggleFiltro(categoriasAtivas, c, setCategoriasAtivas) })),
    ...tecidosAtivos.map(t => ({ label: t, remover: () => toggleFiltro(tecidosAtivos, t, setTecidosAtivos) })),
    ...gramaturaAtiva.map(g => ({ label: g, remover: () => toggleFiltro(gramaturaAtiva, g, setGramaturaAtiva) })),
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0EBE3' }}>

      {/* Navbar */}
      <header className="bg-[#2A5E40] px-8 py-3 flex items-center justify-between">
        <Link to={ROUTES.HOME}>
          <img src={logo} alt="Seri.estudio" className="h-12 w-12 object-contain rounded" />
        </Link>
        <nav className="flex items-center gap-8">
          <Link to={ROUTES.CATALOGO} className="text-white text-sm font-medium transition-colors">
            Catálogo
          </Link>
          <a href={`${ROUTES.HOME}#portfolio`} className="text-white/80 hover:text-white text-sm transition-colors">
            Portfólio
          </a>
          <a href={`${ROUTES.HOME}#como-funciona`} className="text-white/80 hover:text-white text-sm transition-colors">
            Como funciona
          </a>
          <a href={`${ROUTES.HOME}#contato`} className="text-white/80 hover:text-white text-sm transition-colors">
            Contato
          </a>
          <Link
            to={ROUTES.LOGIN}
            className="border border-white text-white px-5 py-2 rounded text-sm hover:bg-white hover:text-[#2A5E40] transition-colors"
          >
            Entrar
          </Link>
        </nav>
      </header>

      {/* Page Header + Toolbar */}
      <div className="px-12 pt-10 pb-5">
        <h1 className="text-3xl font-bold" style={{ color: '#1A1A1A' }}>Catálogo de produtos</h1>
        <p className="text-sm mt-1" style={{ color: '#888' }}>Escolha a peça ideal para sua estampa personalizada</p>

      </div>

      {/* Content */}
      <div className="px-12 pb-16">

        {/* Toolbar acima do grid */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">

            {/* Filtrar button + dropdown */}
            <div className="relative">
              <button
                onClick={() => setFiltroAberto(v => !v)}
                className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm transition-colors hover:bg-white"
                style={{ borderColor: filtroAberto ? '#2A5E40' : '#D5CCC0', color: '#1A1A1A', backgroundColor: filtrosAtivos.length > 0 ? '#E8F4ED' : '#fff' }}
              >
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
                </svg>
                Filtrar
                {filtrosAtivos.length > 0 && (
                  <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold" style={{ backgroundColor: '#2A5E40', color: '#fff' }}>
                    {filtrosAtivos.length}
                  </span>
                )}
              </button>

              {filtroAberto && (
                <div className="absolute left-0 top-full mt-2 z-20 bg-white rounded-xl shadow-lg border p-5 w-72" style={{ borderColor: '#E5DDD5' }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Filtros</span>
                    {filtrosAtivos.length > 0 && (
                      <button onClick={limparFiltros} className="text-xs underline" style={{ color: '#2A5E40' }}>
                        Limpar tudo
                      </button>
                    )}
                  </div>

                  <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#888' }}>Categoria</p>
                  <div className="flex flex-col gap-2 mb-4">
                    {CATEGORIAS.map(cat => (
                      <label key={cat} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={categoriasAtivas.includes(cat)} onChange={() => toggleFiltro(categoriasAtivas, cat, setCategoriasAtivas)} className="w-4 h-4 rounded accent-[#2A5E40] cursor-pointer" />
                          <span className="text-sm group-hover:text-[#2A5E40] transition-colors" style={{ color: '#1A1A1A' }}>{cat}</span>
                        </div>
                        <span className="text-xs" style={{ color: '#aaa' }}>{contarPorFiltro('categoria', cat)}</span>
                      </label>
                    ))}
                  </div>

                  <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#888' }}>Tecido</p>
                  <div className="flex flex-col gap-2 mb-4">
                    {TECIDOS.map(tec => (
                      <label key={tec} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={tecidosAtivos.includes(tec)} onChange={() => toggleFiltro(tecidosAtivos, tec, setTecidosAtivos)} className="w-4 h-4 rounded accent-[#2A5E40] cursor-pointer" />
                          <span className="text-sm group-hover:text-[#2A5E40] transition-colors" style={{ color: '#1A1A1A' }}>{tec}</span>
                        </div>
                        <span className="text-xs" style={{ color: '#aaa' }}>{contarPorFiltro('tecido', tec)}</span>
                      </label>
                    ))}
                  </div>

                  <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#888' }}>Gramatura</p>
                  <div className="flex flex-col gap-2">
                    {GRAMATURAS.map(gram => (
                      <label key={gram} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={gramaturaAtiva.includes(gram)} onChange={() => toggleFiltro(gramaturaAtiva, gram, setGramaturaAtiva)} className="w-4 h-4 rounded accent-[#2A5E40] cursor-pointer" />
                          <span className="text-sm group-hover:text-[#2A5E40] transition-colors" style={{ color: '#1A1A1A' }}>{gram}</span>
                        </div>
                        <span className="text-xs" style={{ color: '#aaa' }}>{contarPorFiltro('gramatura', gram)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contagem — só aparece quando filtro ativo */}
            {filtrosAtivos.length > 0 && (
              <p className="text-sm" style={{ color: '#888' }}>
                <span className="font-semibold" style={{ color: '#1A1A1A' }}>{produtosFiltrados.length}</span>{' '}
                {produtosFiltrados.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
              </p>
            )}
          </div>

          <select
            value={ordenacao}
            onChange={e => setOrdenacao(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm outline-none"
            style={{ borderColor: '#D5CCC0', color: '#1A1A1A', backgroundColor: '#fff' }}
          >
            {ORDENACAO.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        {/* Active filter tags */}
        {filtrosAtivos.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-5">
            {filtrosAtivos.map(f => (
              <span
                key={f.label}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: '#E8F4ED', color: '#2A5E40', border: '1px solid #C3DFD0' }}
              >
                {f.label}
                <button onClick={f.remover} className="hover:opacity-70 transition-opacity leading-none" style={{ color: '#2A5E40' }}>×</button>
              </span>
            ))}
          </div>
        )}

        {/* Product Area */}
        <div>

          {/* Product Grid */}
          {produtosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: '#aaa' }}>
              <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 mb-3 opacity-40">
                <circle cx="24" cy="24" r="20" stroke="#aaa" strokeWidth="2" />
                <path d="M16 24 L32 24" stroke="#aaa" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-sm">Nenhum produto encontrado com esses filtros.</p>
              <button onClick={limparFiltros} className="text-sm mt-2 underline" style={{ color: '#2A5E40' }}>
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-6">
              {produtosFiltrados.map(produto => (
                <Link
                  key={produto.id}
                  to={ROUTES.CRIAR_FICHA}
                  className="group block"
                >
                  {/* Image area */}
                  <div
                    className="relative w-full overflow-hidden"
                    style={{ backgroundColor: '#1A1A1A', aspectRatio: '3/4' }}
                  >
                    {produto.imagem ? (
                      <img
                        src={produto.imagem}
                        alt={produto.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IconeProduto categoria={produto.categoria} />
                      </div>
                    )}
                    {produto.badge && (
                      <span
                        className="absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-semibold"
                        style={{ backgroundColor: '#2A5E40', color: '#fff' }}
                      >
                        {produto.badge}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="pt-3 text-center">
                    <h3 className="text-xs font-light tracking-widest" style={{ color: '#1A1A1A' }}>
                      {produto.nome}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: '#1A1A1A' }}>
                      R$ {produto.preco.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1A2E20] px-16 py-8 flex items-center justify-between">
        <span className="text-white font-bold text-lg">Seri.</span>
        <div className="flex gap-8">
          <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">Instagram</a>
          <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">WhatsApp</a>
          <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">Privacidade</a>
        </div>
        <span className="text-white/35 text-sm">© 2025 Seri.estudio</span>
      </footer>
    </div>
  )
}
