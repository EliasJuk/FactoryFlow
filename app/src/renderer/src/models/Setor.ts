export interface Setor {
  id: number
  uuid: string
  nome: string
  sigla: string
  ativo: boolean

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
