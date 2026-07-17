export type RefugoItemListagem = {
  id: number
  uuid: string
  defeitoId: number
  componenteCodigo: string
  componenteNome: string
  defeitoCodigo: string
  defeitoDescricao: string
  quantidadeRefugada: number
}

export type RefugoListagem = {
  id: number
  uuid: string
  numeroRefugo: string
  dataHora: string
  turno: string
  matriculaOperador: string
  quantidadeProduzida: number
  observacao?: string | null
  status: string
  motivoCancelamento?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null
  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null
  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
  setorNome: string
  subsetorNome: string
  postoNome: string
  circuitoCodigo: string
  circuitoNome: string
  itens: RefugoItemListagem[]
}

export type EditItem = {
  id: number
  defeitoId: number
  componenteCodigo: string
  componenteNome: string
  defeitoCodigo: string
  defeitoDescricao: string
  quantidade: number
}