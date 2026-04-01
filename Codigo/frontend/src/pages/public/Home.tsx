import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import PageTransition from '../../components/PageTransition'
import logo from '../../assets/images/logo.png'


const steps = [
  {
    n: 1,
    title: 'Escolha a peça',
    desc: 'Navegue pelo catálogo e escolha entre camisetas, moletons, ecobags e mais.',
  },
  {
    n: 2,
    title: 'Envie sua arte',
    desc: 'Faça upload do seu arquivo em PDF, PNG ou AI direto na ficha técnica.',
  },
  {
    n: 3,
    title: 'Monte a ficha',
    desc: 'Configure cor, gramatura, tamanho e posição da estampa com precisão.',
  },
  {
    n: 4,
    title: 'Receba o orçamento',
    desc: 'O orçamento chega pelo WhatsApp automaticamente, pronto para aprovação.',
  },
]

const portfolio = [
  { label: 'Estampa em silk' },
  { label: 'Silk colorido' },
  { label: 'Regata personalizada' },
]

const ctaItems = [
  'Upload de arte em PDF, PNG ou AI',
  'Código único por pedido',
  'Orçamento automático via WhatsApp',
  'Acompanhamento do status em tempo real',
]

export default function Home() {
  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Navbar */}
        <header className="bg-[#2A5E40] px-8 py-3 flex items-center justify-between">
        <Link to={ROUTES.HOME}>
          <img src={logo} alt="Seri.estudio" className="h-12 w-12 object-contain rounded" />
        </Link>
        <nav className="flex items-center gap-8">
          <Link to={ROUTES.CATALOGO} className="text-white/80 hover:text-white text-sm transition-colors">
            Catálogo
          </Link>
          <a href="#portfolio" className="text-white/80 hover:text-white text-sm transition-colors">
            Portfólio
          </a>
          <a href="#como-funciona" className="text-white/80 hover:text-white text-sm transition-colors">
            Como funciona
          </a>
          <a href="#contato" className="text-white/80 hover:text-white text-sm transition-colors">
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

      {/* Hero */}
      <section className="bg-[#2A5E40] px-16 pt-14 pb-20 flex items-center justify-between gap-8">
        <div className="max-w-lg">
          <span className="bg-[#1D4A2F] text-white/70 text-xs px-3 py-1 rounded-full mb-6 inline-block tracking-wide">
            Serigrafia sob encomenda
          </span>
          <h1 className="text-5xl font-bold text-white leading-tight mt-4 mb-5">
            Sua arte,<br />
            nossa <span className="text-[#7EC89A]">tela.</span>
          </h1>
          <p className="text-white/65 text-sm leading-relaxed mb-8">
            Monte sua ficha técnica, envie sua arte e acompanhe seu pedido do início ao fim. Tudo em um só lugar.
          </p>
          <div className="flex gap-3">
            <Link
              to={ROUTES.LOGIN}
              className="bg-white text-[#2A5E40] px-6 py-3 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Montar meu pedido
            </Link>
            <a
              href="#portfolio"
              className="border border-white/40 text-white px-6 py-3 rounded text-sm hover:bg-white/10 transition-colors"
            >
              Ver portfólio
            </a>
          </div>
        </div>

        <div className="flex items-end gap-3 flex-shrink-0">
          <div className="w-32 h-44 bg-[#1D4A2F] rounded-xl flex items-end justify-center pb-3">
            <span className="text-white/25 text-xs text-center px-2">Camiseta serigrafia</span>
          </div>
          <div className="w-36 h-52 bg-[#244F36] rounded-xl flex items-end justify-center pb-3 -mb-2">
            <span className="text-white/25 text-xs text-center px-2">Camiseta estampada</span>
          </div>
          <div className="w-32 h-44 bg-[#1D4A2F] rounded-xl flex items-end justify-center pb-3">
            <span className="text-white/25 text-xs text-center px-2">Camiseta personalizada</span>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="bg-[#F0EBE3] px-16 py-20">
        <p className="text-[#2A5E40] text-xs font-semibold tracking-widest uppercase mb-2">
          Como funciona
        </p>
        <h2 className="text-3xl font-semibold text-[#1A1A1A] mb-12">
          Do pedido à entrega, sem complicação
        </h2>
        <div className="grid grid-cols-4 gap-5">
          {steps.map(({ n, title, desc }) => (
            <div key={n} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-7 h-7 border border-[#2A5E40]/30 text-[#2A5E40] text-xs flex items-center justify-center rounded mb-4">
                {n}
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2 text-sm">{title}</h3>
              <p className="text-[#777] text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portfólio */}
      <section id="portfolio" className="bg-[#F0EBE3] px-16 py-16 border-t border-[#E5DDD3]">
        <p className="text-[#2A5E40] text-xs font-semibold tracking-widest uppercase mb-2">
          Portfólio
        </p>
        <h2 className="text-3xl font-semibold text-[#1A1A1A] mb-10">Trabalhos realizados</h2>
        <div className="grid grid-cols-3 gap-5">
          {portfolio.map(({ label }) => (
            <div
              key={label}
              className="relative rounded-xl overflow-hidden bg-[#1A1A1A]"
              style={{ aspectRatio: '4/5' }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-white text-sm font-medium">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2A5E40] px-16 py-20">
        <div className="flex items-start justify-between gap-16">
          <div className="max-w-sm">
            <h2 className="text-3xl font-bold text-white mb-4">
              Pronto para montar seu pedido?
            </h2>
            <p className="text-white/65 text-sm leading-relaxed mb-8">
              Nossa ficha técnica digital garante que você especifica exatamente o que quer — sem idas e vindas no WhatsApp.
            </p>
            <Link
              to={ROUTES.LOGIN}
              className="bg-white text-[#2A5E40] px-6 py-3 rounded text-sm font-medium hover:bg-gray-100 transition-colors inline-block"
            >
              Começar agora
            </Link>
          </div>
          <ul className="space-y-3 mt-2">
            {ctaItems.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-white/75 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A2E20] px-16 py-8 flex items-center justify-between">
        <span className="text-white font-bold text-lg">Seri.</span>
        <div className="flex gap-8">
          <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">
            Instagram
          </a>
          <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">
            WhatsApp
          </a>
          <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">
            Privacidade
          </a>
        </div>
        <span className="text-white/35 text-sm">© 2025 Seri.estudio</span>
      </footer>
      </div>
    </PageTransition>
  )
}
