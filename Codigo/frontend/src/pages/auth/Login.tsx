import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'

type Tab = 'entrar' | 'cadastrar'

export default function Login() {
  const [activeTab, setActiveTab] = useState<Tab>('entrar')

  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo — verde */}
      <div className="w-1/2 bg-[#2A5E40] px-12 py-12 flex flex-col justify-between">
        <div>
          <Link to={ROUTES.HOME} className="text-white text-2xl font-bold mb-16 inline-block">
            Seri.
          </Link>

          <div className="mt-10">
            <span className="bg-[#1D4A2F] text-white/60 text-xs px-3 py-1 rounded-full uppercase tracking-widest">
              Plataforma de Pedidos
            </span>

            <h2 className="text-white text-4xl font-bold mt-5 mb-4 leading-tight">
              Bem-vindo à<br />
              <span className="text-[#7EC89A]">Seri.estudio</span>
            </h2>

            <p className="text-white/55 text-sm leading-relaxed mb-10">
              Gerencie pedidos, fichas técnicas e acompanhe sua produção — tudo em um só lugar.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1D4A2F]/70 rounded-xl p-5">
                <div className="w-10 h-10 bg-[#2E2650] rounded-lg flex items-center justify-center mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-purple-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-1 text-sm">Cliente</h3>
                <p className="text-white/45 text-xs leading-relaxed">
                  Monte pedidos, envie artes e acompanhe o status das encomendas.
                </p>
              </div>

              <div className="bg-[#1D4A2F]/70 rounded-xl p-5">
                <div className="w-10 h-10 bg-[#2E2650] rounded-lg flex items-center justify-center mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-purple-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-1 text-sm">Administrador</h3>
                <p className="text-white/45 text-xs leading-relaxed">
                  Gerencie fichas, produção, estoque e financeiro do estúdio.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-white/25 text-xs">
          © 2025 Seri.estudio — Todos os direitos reservados
        </p>
      </div>

      {/* Painel direito — claro */}
      <div className="w-1/2 bg-[#F0EBE3] px-14 py-16 flex flex-col justify-center">
        {/* Tabs */}
        <div className="flex bg-[#E3DBD0] rounded-lg p-1 w-fit mb-10">
          <button
            onClick={() => setActiveTab('entrar')}
            className={`px-8 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'entrar'
                ? 'bg-white text-[#1A1A1A] shadow-sm'
                : 'text-[#777] hover:text-[#444]'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setActiveTab('cadastrar')}
            className={`px-8 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'cadastrar'
                ? 'bg-white text-[#1A1A1A] shadow-sm'
                : 'text-[#777] hover:text-[#444]'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {activeTab === 'entrar' ? (
          <div>
            <h2 className="text-3xl font-semibold text-[#1A1A1A] mb-2">Acesse sua conta</h2>
            <p className="text-[#888] text-sm mb-8">Entre com seu e-mail e senha para continuar.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-[#444] mb-1.5">E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full border border-[#D5CCC0] bg-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5E40]/30 placeholder:text-[#AAA]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#444] mb-1.5">Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full border border-[#D5CCC0] bg-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5E40]/30"
                />
                <div className="flex justify-end mt-2">
                  <a href="#" className="text-[#2A5E40] text-sm hover:underline">
                    Esqueci minha senha
                  </a>
                </div>
              </div>

              <button className="w-full bg-[#2A5E40] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#1D4A2F] transition-colors">
                Entrar
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[#D5CCC0]" />
                <span className="text-[#999] text-sm">ou</span>
                <div className="flex-1 h-px bg-[#D5CCC0]" />
              </div>

              <button className="w-full border border-[#D5CCC0] bg-white text-[#333] py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-colors">
                <span className="w-5 h-5 bg-[#EA4335] rounded-full flex items-center justify-center text-white text-xs font-bold">
                  G
                </span>
                Continuar com Google
              </button>

              <p className="text-center text-sm text-[#888]">
                Não tem conta?{' '}
                <button
                  onClick={() => setActiveTab('cadastrar')}
                  className="text-[#2A5E40] font-medium hover:underline"
                >
                  Cadastre-se
                </button>
              </p>

              <div className="bg-[#E8F3EC] border-l-4 border-[#2A5E40] px-4 py-3 rounded-r-lg">
                <p className="text-[#2A5E40] text-sm leading-relaxed">
                  Se você é administrador do estúdio, acesse com o e-mail cadastrado pelo gestor.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-3xl font-semibold text-[#1A1A1A] mb-2">Crie sua conta</h2>
            <p className="text-[#888] text-sm mb-8">Preencha seus dados para começar.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-[#444] mb-1.5">Nome completo</label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  className="w-full border border-[#D5CCC0] bg-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5E40]/30 placeholder:text-[#AAA]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#444] mb-1.5">E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full border border-[#D5CCC0] bg-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5E40]/30 placeholder:text-[#AAA]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#444] mb-1.5">Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full border border-[#D5CCC0] bg-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5E40]/30"
                />
              </div>

              <button className="w-full bg-[#2A5E40] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#1D4A2F] transition-colors">
                Criar conta
              </button>

              <p className="text-center text-sm text-[#888]">
                Já tem conta?{' '}
                <button
                  onClick={() => setActiveTab('entrar')}
                  className="text-[#2A5E40] font-medium hover:underline"
                >
                  Entrar
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
