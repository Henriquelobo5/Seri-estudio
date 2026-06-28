export const MODELAGENS_POR_TIPO: Record<string, string[]> = {
  Camiseta: [
    'Camiseta Basica (160g)',
    'Camiseta Oversized Malhão Suedine (210g)',
    'Camiseta Oversized Marmorizada 20.1 (200g)',
    'Camiseta Oversized Estonado (200g)',
    'Camiseta Dry Fit Liso (110g)',
    'Camiseta Dry Fit Furinho (130g)',
    'Camiseta Dry Fit Poliamida Levissimo (150g)',
    'Outro (Especifique no Atendimento Final)',
  ],
  Regata: [
    'Regata Basica Algodão (150g)',
    'Regata Oversized Malhão (180g)',
    'Regata Dry Fit Liso (110g)',
    'Regata Dry Fit Furinho (130g)',
    'Regata Dry Fit Poliamida Levíssimo (150g)',
    'Outro (Especifique no Atendimento Final)',
  ],
  Polo: [
    'Polo Basica Algodão (200g)',
    'Polo Piquet (200g)',
    'Outro (Especifique no Atendimento Final)',
  ],
  Moletom: [
    'Moletom Canguro com Capuz (320g) (3 Cabos)',
    'Moletom Careca (320g) (3 Cabos)',
    'Outro (Especifique no Atendimento Final)',
  ],
  Ecobag: [
    'Ecobag (140g)',
    'Outro (Especifique no Atendimento Final)',
  ],
}

const CORES = [
  'Preto',
  'Branco',
  'Verde',
  'Verde limão',
  'Vermelho',
  'Rosa',
  'Azul royal',
  'Azul marinho',
  'Azul bebê',
  'Amarelo',
  'Laranja',
  'Cinza claro',
  'Cinza escuro',
  'Roxo',
  'Bordô',
  'Marrom',
]

type FichaDetalhes = {
  tipo?: string
  tiposSelecionados?: string[]
  itensPorTipo?: ItensPorTipo
  modelagemGramatura?: string
  tecido?: string
  gramatura?: string
}

export type ItemFichaPorTipo = {
  tipo: string
  modelagemGramatura: string
  tamanhos: string[]
  quantidadesPorTamanho: Record<string, number>
}

export type ItensPorTipo = Record<string, ItemFichaPorTipo>

export type EspecificacoesFicha = {
  modelagemGramatura: string
  tecido: string
  gramatura: string
  cor: string
  tamanhos: string
}

function normalizarTexto(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function isCor(value?: string) {
  if (!value) return false
  const normalized = normalizarTexto(value)
  return CORES.some((cor) => normalizarTexto(cor) === normalized)
}

export function getModelagensPorTipo(tipo?: string) {
  const normalized = normalizarTexto(tipo ?? '')
  const key = Object.keys(MODELAGENS_POR_TIPO).find((item) => normalizarTexto(item) === normalized)
  return key ? MODELAGENS_POR_TIPO[key] : MODELAGENS_POR_TIPO.Camiseta
}

export function getDefaultModelagemGramatura(tipo?: string) {
  return getModelagensPorTipo(tipo)[0] ?? ''
}

export function getTiposSelecionadosFromDetails(details?: FichaDetalhes | null, tipoFallback?: string) {
  const fromArray = Array.isArray(details?.tiposSelecionados)
    ? details.tiposSelecionados
    : []
  const fromTipo = typeof details?.tipo === 'string'
    ? details.tipo.split(',')
    : []
  const fromFallback = tipoFallback ? tipoFallback.split(',') : []
  const values = fromArray.length > 0 ? fromArray : (fromTipo.length > 0 ? fromTipo : fromFallback)

  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))
}

export function getItensFichaSelecionados(itensPorTipo?: ItensPorTipo | null, ordemTipos?: string[]) {
  if (!itensPorTipo) return []

  const ordem = ordemTipos && ordemTipos.length > 0 ? ordemTipos : Object.keys(itensPorTipo)
  return ordem
    .map((tipo) => itensPorTipo[tipo])
    .filter((item): item is ItemFichaPorTipo => Boolean(item?.tipo))
}

export function formatTamanhoPorTipo(tipo: string, tamanho: string) {
  return `${tipo} - ${tamanho}`
}

export function buildTamanhosPorTipo(itens: ItemFichaPorTipo[]) {
  return itens.flatMap((item) => item.tamanhos.map((tamanho) => formatTamanhoPorTipo(item.tipo, tamanho)))
}

export function formatTamanhosComQuantidade(
  tamanhos: string[],
  quantidades?: Record<string, number> | null,
) {
  return tamanhos
    .map((tamanho) => {
      const quantidade = Number(quantidades?.[tamanho]) || 0
      return quantidade > 0 ? `${tamanho} ×${quantidade}` : tamanho
    })
    .join(', ')
}

export function buildQuantidadesPorTipo(itens: ItemFichaPorTipo[]) {
  return Object.fromEntries(
    itens.flatMap((item) =>
      item.tamanhos.map((tamanho) => [
        formatTamanhoPorTipo(item.tipo, tamanho),
        Number(item.quantidadesPorTamanho[tamanho]) || 0,
      ]),
    ),
  )
}

export function buildModelagemResumoPorTipo(itens: ItemFichaPorTipo[]) {
  if (itens.length === 0) return ''
  if (itens.length === 1) return itens[0].modelagemGramatura

  return itens
    .map((item) => `${item.tipo}: ${item.modelagemGramatura}`)
    .filter(Boolean)
    .join(' | ')
}

export function getTotalPecasPorTipo(itens: ItemFichaPorTipo[]) {
  return itens.reduce(
    (sum, item) =>
      sum + Object.values(item.quantidadesPorTamanho).reduce((itemSum, value) => itemSum + (Number(value) || 0), 0),
    0,
  )
}

export function resolveModelagemGramaturaFromDetails(details?: FichaDetalhes | null, tipoFallback?: string) {
  const tipo = details?.tipo ?? tipoFallback
  const opcoes = getModelagensPorTipo(tipo)
  const direta = details?.modelagemGramatura?.trim()

  if (direta && opcoes.includes(direta)) return direta
  if (direta) return direta

  const tecido = details?.tecido?.trim()
  if (tecido && opcoes.includes(tecido)) return tecido

  if (!tipo && !tecido) return ''

  return getDefaultModelagemGramatura(tipo)
}

export function buildEspecificacoesFicha({
  modelagemGramatura,
  cor,
  tamanhos,
}: {
  modelagemGramatura: string
  cor: string
  tamanhos: string[]
}) {
  return [modelagemGramatura, cor, ...tamanhos].filter(Boolean).join(', ')
}

export function parseEspecificacoesFicha(value?: string | null): EspecificacoesFicha {
  const parts = (value ?? '').split(',').map((item) => item.trim()).filter(Boolean)
  const empty = '—'

  if (parts.length >= 2 && isCor(parts[1])) {
    return {
      modelagemGramatura: parts[0] ?? empty,
      tecido: parts[0] ?? empty,
      gramatura: '',
      cor: parts[1] ?? empty,
      tamanhos: parts.slice(2).join(', ') || empty,
    }
  }

  const tecido = parts[0] ?? empty
  const gramatura = parts[1] ?? empty

  return {
    modelagemGramatura: tecido !== empty && gramatura !== empty ? `${tecido} · ${gramatura}` : tecido,
    tecido,
    gramatura,
    cor: parts[2] ?? empty,
    tamanhos: parts.slice(3).join(', ') || empty,
  }
}
