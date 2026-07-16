export interface RefugoAuditavel {
  uuid: string
  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null
  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null
}

export interface RefugoItem extends RefugoAuditavel {
  id: number
  componenteId: number
  defeitoId: number
  quantidade: number
}

export interface Refugo extends RefugoAuditavel {
  id: number
  numeroRefugo: string
  dataHora: Date | string
  usuarioId: number | null
  setorId: number
  subsetorId: number
  postoId: number
  circuitoId: number
  turno: string
  matriculaOperador: string
  quantidadeProduzida: number
  observacao?: string | null
  status: string
  motivoCancelamento?: string | null
  itens?: RefugoItem[]
}
