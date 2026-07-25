export type PullEntity = 'USUARIO' | 'SETOR'

export type PullCursor = {
  lastUpdatedAt: string | null
  lastUuid: string | null
}

export type PullRecordBase = {
  uuid: string
  updatedAt: string
}

export type UsuarioPullRecord = PullRecordBase & {
  nome: string
  matricula: string
  perfil: string
  senhaHash: string | null
  deveTrocarSenha: boolean
  ativo: boolean
  createdAt: string
  deletedAt: string | null
  createdByUuid: string | null
  updatedByUuid: string | null
  deletedByUuid: string | null
}

export type SetorPullRecord = PullRecordBase & {
  nome: string
  sigla: string | null
  ativo: boolean
  createdAt: string
  deletedAt: string | null
  createdByUuid: string | null
  updatedByUuid: string | null
  deletedByUuid: string | null
}
