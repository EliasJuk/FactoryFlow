export interface PostoDefeito {
  id: number
  uuid: string
  postoId: number
  defeitoId: number
  codigoDefeito: string
  descricaoDefeito: string
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
