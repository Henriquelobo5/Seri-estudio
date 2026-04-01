import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ROUTES } from '../../routes/routePaths'
import { useAuth } from '../../context/AuthContext'
import PageTransition from '../../components/PageTransition'

type StatusType = 'em-producao' | 'orcamento-enviado' | 'entregue'

interface Pedido {
  id: string
  status: StatusType
  nome: string
  valor: string
  detalhes: string
}

const pedidos: Pedido[] = [
  {
    id: 'FT-2025-4087',
    status: 'em-producao',
    nome: 'Camisetas turma 2025',
    valor: 'R$ 420',
    detalhes: '12 peças · Frente central · Enviado 14/03/2025',
  },
  {
    id: 'FT-2025-3901',
    status: 'orcamento-enviado',
    nome: 'Moletom evento abril',
    valor: 'R$ 680',
    detalhes: '8 peças · Costas central · Enviado 10/03/2025',
  },
  {
    id: 'FT-2025-3645',
    status: 'entregue',
    nome: 'Ecobags brindes',
    valor: 'R$ 440',
    detalhes: '20 peças · Frente central · Enviado 02/02/2025',
  },
  {
    id: 'FT-2025-3210',
    status: 'entregue',
    nome: 'Camisetas banda',
    valor: 'R$ 300',
    detalhes: '30 peças · Frente e costas · Enviado 10/01/2025',
  },
]

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  'em-producao': {
    label: 'Em produção',
    className: 'bg-green-100 text-green-700',
  },
  'orcamento-enviado': {
    label: 'Orçamento enviado',
    className: 'bg-blue-100 text-blue-700',
  },
  entregue: {
    label: 'Entregue',
    className: 'bg-gray-100 text-gray-500',
  },
}

const atalhos = [
  { label: 'Nova ficha técnica', dotColor: 'bg-green-500' },
  { label: 'Consultar por código', dotColor: 'bg-blue-500' },
  { label: 'Falar com o estúdio', dotColor: 'bg-yellow-500' },
  { label: 'Editar meu perfil', dotColor: 'bg-gray-400' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isLogoutAnimating, setIsLogoutAnimating] = useState(false)

  const handleLogout = () => {
    setIsLogoutAnimating(true)
    setTimeout(() => {
      logout()
      navigate(ROUTES.LOGIN, { replace: true })
    }, 300)
  }

  return (
    <PageTransition>
      <div className={`min-h-screen bg-[#F0EBE3] animate-fadeIn transition-opacity duration-300 ${isLogoutAnimating ? 'opacity-0' : 'opacity-100'}`}>
      {/* Navbar */}
      <header className="bg-[#2A5E40] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to={ROUTES.HOME} className="text-white font-bold text-xl">
            Seri.
          </Link>
          <nav className="flex items-center gap-7">
            <a href="#" className="text-white/70 hover:text-white text-sm transition-colors">
              Catálogo
            </a>
            <a href="#" className="text-white/70 hover:text-white text-sm transition-colors">
              Portfólio
            </a>
            <a href="#" className="text-white/70 hover:text-white text-sm transition-colors">
              Como funciona
            </a>
            <a href="#" className="text-white font-medium text-sm">
              Meus pedidos
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1D4A2F] rounded-full flex items-center justify-center text-white text-xs font-bold">
            JS
          </div>
          <button
            onClick={handleLogout}
            className="bg-[#1D4A2F] hover:bg-[#163D26] text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="px-8 py-10 max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold text-[#1A1A1A] mb-1 animate-slideInDown-delay-100">Minha área</h1>
        <p className="text-[#888] text-sm mb-8 animate-slideInDown-delay-100">Acompanhe seus pedidos e fichas técnicas</p>

        <div className="grid grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="col-span-2 space-y-5">
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm animate-bounceIn-delay-100 hover:shadow-md transition-shadow">
                <p className="text-[#888] text-xs mb-3">Total de pedidos</p>
                <p className="text-4xl font-bold text-[#1A1A1A]">4</p>
                <p className="text-[#AAA] text-xs mt-2">desde jan/2025</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm animate-bounceIn-delay-200 hover:shadow-md transition-shadow">
                <p className="text-[#888] text-xs mb-3">Em produção</p>
                <p className="text-4xl font-bold text-[#2A5E40]">1</p>
                <p className="text-[#AAA] text-xs mt-2">pedido ativo</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm animate-bounceIn-delay-300 hover:shadow-md transition-shadow">
                <p className="text-[#888] text-xs mb-3">Total investido</p>
                <p className="text-3xl font-bold text-[#1A1A1A] leading-tight">R$ 1.840</p>
                <p className="text-[#AAA] text-xs mt-2">em estampas</p>
              </div>
            </div>

            {/* Lista de pedidos */}
            <div className="bg-white rounded-xl p-6 shadow-sm animate-slideInLeft-delay-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-[#1A1A1A] text-base">Meus pedidos</h2>
                <button className="border border-[#D5CCC0] text-[#333] text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  + Nova ficha
                </button>
              </div>

              <div className="space-y-3">
                {pedidos.map((pedido) => {
                  const { label, className } = statusConfig[pedido.status]
                  return (
                    <div
                      key={pedido.id}
                      className="flex items-center gap-4 p-4 border border-[#EEE8DF] rounded-xl hover:border-[#D5CCC0] transition-colors cursor-pointer"
                    >
                      <div className="w-11 h-11 bg-[#EEF6F0] rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                        👕
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[#2A5E40] text-xs font-mono font-medium">
                            {pedido.id}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
                            {label}
                          </span>
                        </div>
                        <p className="font-medium text-[#1A1A1A] text-sm">{pedido.nome}</p>
                        <p className="text-[#999] text-xs mt-0.5">{pedido.detalhes}</p>
                      </div>

                      <span className="font-semibold text-[#1A1A1A] text-sm whitespace-nowrap">
                        {pedido.valor}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Coluna lateral */}
          <div className="space-y-4">
            {/* Card de perfil */}
            <div className="bg-white rounded-xl p-6 shadow-sm text-center animate-slideInRight-delay-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#2A5E40] rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-3">
                JS
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-0.5">{user?.name ?? 'Usuário'}</h3>
              <p className="text-[#999] text-sm mb-4">{user?.email ?? '-'}</p>

              <div className="h-px bg-[#EEE8DF] mb-4" />

              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <p className="text-xl font-bold text-[#1A1A1A]">4</p>
                  <p className="text-[#999] text-xs">Pedidos</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[#1A1A1A]">2</p>
                  <p className="text-[#999] text-xs">Ativos</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[#1A1A1A]">2</p>
                  <p className="text-[#999] text-xs">Entregues</p>
                </div>
              </div>
            </div>

            {/* Card de atalhos */}
            <div className="bg-white rounded-xl p-6 shadow-sm animate-slideInRight-delay-200 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">Atalhos</h3>
              <div className="space-y-3">
                {atalhos.map(({ label, dotColor }) => (
                  <button
                    key={label}
                    className="w-full flex items-center justify-between text-sm text-[#444] hover:text-[#1A1A1A] group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                      {label}
                    </div>
                    <span className="text-[#CCC] group-hover:text-[#888] transition-colors">›</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </PageTransition>
  )
}
