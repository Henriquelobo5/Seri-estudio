import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import logo from '../../assets/images/logo.png'

const STEPS = [
  { id: 1, label: 'Produto' },
  { id: 2, label: 'Estampa' },
  { id: 3, label: 'Detalhe do pedido' },
]

const PRODUCTS = [
  {
    id: 'camiseta',
    name: 'Camiseta',
    subtitle: 'Careca / V',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <path d="M6 14 L14 8 L18 14 L24 10 L30 14 L34 8 L42 14 L38 20 L34 18 L34 40 L14 40 L14 18 L10 20 Z" fill="#2A5E40" stroke="#1D4A2F" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'moletom',
    name: 'Moletom',
    subtitle: 'Canguru / Raglan',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <path d="M6 14 L14 8 Q18 6 24 8 Q30 6 34 8 L42 14 L38 20 L34 18 L34 40 L14 40 L14 18 L10 20 Z" fill="#C87941" stroke="#A0612F" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M18 8 Q24 12 30 8" stroke="#A0612F" strokeWidth="1.5" fill="none"/>
        <rect x="16" y="32" width="16" height="4" rx="2" fill="#A0612F"/>
      </svg>
    ),
  },
  {
    id: 'regata',
    name: 'Regata',
    subtitle: 'Básica / Dry Fit',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <path d="M16 8 Q24 6 32 8 L34 40 L14 40 Z" fill="#2A5E40" stroke="#1D4A2F" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M16 8 Q20 14 24 10 Q28 14 32 8" stroke="#1D4A2F" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
  {
    id: 'polo',
    name: 'Polo',
    subtitle: 'Piquê / Malha',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <path d="M6 14 L14 8 L18 12 L24 8 L30 12 L34 8 L42 14 L38 20 L34 18 L34 40 L14 40 L14 18 L10 20 Z" fill="#2980B9" stroke="#1F618D" strokeWidth="1.5" strokeLinejoin="round"/>
        <rect x="21" y="8" width="6" height="10" rx="1" fill="#1F618D"/>
      </svg>
    ),
  },
  {
    id: 'ecobag',
    name: 'Ecobag',
    subtitle: 'Algodão reforçado',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect x="10" y="18" width="28" height="24" rx="3" fill="#8B6914" stroke="#6D5210" strokeWidth="1.5"/>
        <path d="M18 18 Q18 10 24 10 Q30 10 30 18" stroke="#6D5210" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
]

const TECIDO_OPTIONS = ['100% Algodão', 'Poliéster', 'Algodão/Poliéster', 'Dry Fit']
const GRAMATURA_OPTIONS = ['150g/m²', '180g/m²', '200g/m²', '250g/m²', '300g/m²']
const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG']

const COLORS = [
  { id: 'preto', label: 'Preto', hex: '#1A1A1A' },
  { id: 'branco', label: 'Branco', hex: '#FFFFFF' },
  { id: 'verde', label: 'Verde', hex: '#2A5E40' },
  { id: 'vermelho', label: 'Vermelho', hex: '#C0392B' },
  { id: 'azul', label: 'Azul', hex: '#2980B9' },
  { id: 'laranja', label: 'Laranja', hex: '#F39C12' },
  { id: 'cinza', label: 'Cinza', hex: '#95A5A6' },
  { id: 'roxo', label: 'Roxo', hex: '#8E44AD' },
]

export default function ConstrutorFichaTecnica() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState('camiseta')
  const [tecido, setTecido] = useState('100% Algodão')
  const [gramatura, setGramatura] = useState('180g/m²')
  const [selectedColor, setSelectedColor] = useState('preto')
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'G'])

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    )
  }

  const selectedProductData = PRODUCTS.find(p => p.id === selectedProduct)
  const selectedColorData = COLORS.find(c => c.id === selectedColor)

  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100

  const stepSummary = (stepId: number) => {
    if (stepId === 1) {
      const parts = [
        selectedProductData?.name,
        selectedColorData?.label,
        selectedSizes.length > 0 ? selectedSizes.join(', ') : null,
      ].filter(Boolean)
      return parts.join(' · ')
    }
    if (stepId < currentStep) return 'Concluído'
    return 'Aguardando...'
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0EBE3' }}>

      {/* Navbar */}
      <header className="bg-[#2A5E40] px-8 py-3 flex items-center justify-between">
        <Link to={ROUTES.HOME}>
          <img src={logo} alt="Seri.estudio" className="h-12 w-12 object-contain rounded" />
        </Link>
        <nav className="flex items-center gap-8">
          <Link to={ROUTES.CATALOGO} className="text-white/80 hover:text-white text-sm transition-colors">
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

      {/* Page Content */}
      <div className="py-10 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold" style={{ color: '#1A1A1A' }}>
              Construtor de ficha técnica
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#888' }}>
              Configure seu pedido passo a passo
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center mb-8">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                    style={{
                      backgroundColor: step.id <= currentStep ? '#2A5E40' : 'transparent',
                      color: step.id <= currentStep ? '#fff' : '#aaa',
                      border: step.id <= currentStep ? 'none' : '2px solid #D5CCC0',
                    }}
                  >
                    {step.id}
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: step.id <= currentStep ? '#1A1A1A' : '#aaa' }}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-3" style={{ backgroundColor: '#D5CCC0' }} />
                )}
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex gap-6 items-start">

            {/* Left Panel */}
            <div className="flex-1 flex flex-col gap-4">

              {currentStep === 1 && (
                <>
                  {/* Product Type */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="font-semibold text-base mb-4" style={{ color: '#1A1A1A' }}>
                      Escolha o tipo de peça
                    </h2>
                    <div className="flex gap-3 flex-wrap">
                      {PRODUCTS.map(product => (
                        <button
                          key={product.id}
                          onClick={() => setSelectedProduct(product.id)}
                          className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all cursor-pointer"
                          style={{
                            borderColor: selectedProduct === product.id ? '#2A5E40' : '#E5DDD3',
                            backgroundColor: selectedProduct === product.id ? '#F0F9F4' : '#fff',
                            minWidth: '80px',
                          }}
                        >
                          {product.icon}
                          <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>
                            {product.name}
                          </span>
                          <span className="text-xs text-center leading-tight" style={{ color: '#888' }}>
                            {product.subtitle}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="font-semibold text-base mb-4" style={{ color: '#1A1A1A' }}>
                      Especificações
                    </h2>

                    <div className="flex gap-4 mb-5">
                      <div className="flex-1">
                        <label className="block text-xs mb-1" style={{ color: '#888' }}>
                          Tecido
                        </label>
                        <select
                          value={tecido}
                          onChange={e => setTecido(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                          style={{ borderColor: '#D5CCC0', color: '#1A1A1A', backgroundColor: '#fff' }}
                        >
                          {TECIDO_OPTIONS.map(opt => (
                            <option key={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs mb-1" style={{ color: '#888' }}>
                          Gramatura
                        </label>
                        <select
                          value={gramatura}
                          onChange={e => setGramatura(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                          style={{ borderColor: '#D5CCC0', color: '#1A1A1A', backgroundColor: '#fff' }}
                        >
                          {GRAMATURA_OPTIONS.map(opt => (
                            <option key={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-5">
                      <label className="block text-xs mb-2" style={{ color: '#888' }}>
                        Cor da peça
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {COLORS.map(color => (
                          <button
                            key={color.id}
                            title={color.label}
                            onClick={() => setSelectedColor(color.id)}
                            className="w-8 h-8 rounded-full transition-all"
                            style={{
                              backgroundColor: color.hex,
                              border: selectedColor === color.id
                                ? '3px solid #2A5E40'
                                : color.id === 'branco'
                                ? '2px solid #D5CCC0'
                                : '2px solid transparent',
                              boxShadow: selectedColor === color.id
                                ? '0 0 0 2px #fff, 0 0 0 4px #2A5E40'
                                : 'none',
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs mt-2" style={{ color: '#888' }}>
                        Selecionado:{' '}
                        <span style={{ color: '#1A1A1A', fontWeight: 500 }}>
                          {selectedColorData?.label}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs mb-2" style={{ color: '#888' }}>
                        Tamanhos
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {SIZES.map(size => (
                          <button
                            key={size}
                            onClick={() => toggleSize(size)}
                            className="w-12 h-10 rounded-lg border text-sm font-medium transition-all"
                            style={{
                              borderColor: selectedSizes.includes(size) ? '#2A5E40' : '#D5CCC0',
                              backgroundColor: selectedSizes.includes(size) ? '#2A5E40' : '#fff',
                              color: selectedSizes.includes(size) ? '#fff' : '#1A1A1A',
                            }}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="font-semibold text-base mb-4" style={{ color: '#1A1A1A' }}>
                    Estampa
                  </h2>
                  <p className="text-sm" style={{ color: '#888' }}>
                    Configure a estampa do seu pedido.
                  </p>
                </div>
              )}

              {currentStep === 3 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="font-semibold text-base mb-4" style={{ color: '#1A1A1A' }}>
                    Detalhe do pedido
                  </h2>
                  <p className="text-sm" style={{ color: '#888' }}>
                    Informe os detalhes finais e revise seu pedido.
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between">
                {currentStep > 1 ? (
                  <button
                    onClick={() => setCurrentStep(s => s - 1)}
                    className="px-6 py-3 rounded-xl text-sm font-medium border transition-colors"
                    style={{ borderColor: '#D5CCC0', color: '#1A1A1A', backgroundColor: '#fff' }}
                  >
                    ← Voltar
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < STEPS.length ? (
                  <button
                    onClick={() => setCurrentStep(s => s + 1)}
                    className="px-6 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#1A1A1A', color: '#fff' }}
                  >
                    Próximo: {STEPS[currentStep].label} →
                  </button>
                ) : (
                  <button
                    className="px-6 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#2A5E40', color: '#fff' }}
                  >
                    Finalizar pedido
                  </button>
                )}
              </div>
            </div>

            {/* Right Panel - Progress */}
            <div
              className="w-64 flex-shrink-0 bg-white rounded-xl p-5 shadow-sm"
              style={{ position: 'sticky', top: '24px' }}
            >
              <h3 className="font-semibold text-sm mb-3" style={{ color: '#1A1A1A' }}>
                Progresso
              </h3>

              <div className="w-full h-2 rounded-full mb-4" style={{ backgroundColor: '#E5DDD3' }}>
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%`, backgroundColor: '#2A5E40' }}
                />
              </div>

              <div className="flex flex-col gap-3">
                {STEPS.map(step => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: step.id <= currentStep ? '#2A5E40' : 'transparent',
                        color: step.id <= currentStep ? '#fff' : '#aaa',
                        border: step.id <= currentStep ? 'none' : '2px solid #D5CCC0',
                      }}
                    >
                      {step.id}
                    </div>
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: step.id <= currentStep ? '#1A1A1A' : '#aaa' }}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs" style={{ color: '#888' }}>
                        {stepSummary(step.id)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
