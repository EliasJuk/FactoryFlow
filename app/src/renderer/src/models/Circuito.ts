export interface Circuito {
  id: number
  uuid: string
  codigo: string
  nome: string
  ativo: boolean
  totalComponentes: number

  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null

  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null

  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}
