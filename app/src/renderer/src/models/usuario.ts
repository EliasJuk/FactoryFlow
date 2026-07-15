export type PerfilUsuario = 'OPERADOR' | 'TECNICO' | 'LIDER' | 'SUPERVISOR' | 'QUALIDADE' | 'ADMIN'

export interface Usuario {
  id: number
  uuid: string
  matricula: string
  nome: string
  perfil: PerfilUsuario
  ativo: boolean
  deveTrocarSenha?: boolean

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
