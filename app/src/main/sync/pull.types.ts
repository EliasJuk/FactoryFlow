export type PullEntity =
  'USUARIO' | 'SETOR' | 'SUBSETOR' | 'POSTO' | 'COMPONENTE' | 'CIRCUITO' | 'DEFEITO'

export type PullCursor = {
  lastUpdatedAt: string | null
  lastUuid: string | null
}

export type PullRecordBase = {
  uuid: string
  updatedAt: string
}

export type AuditPullFields = PullRecordBase & {
  createdAt: string
  deletedAt: string | null
  createdByUuid: string | null
  updatedByUuid: string | null
  deletedByUuid: string | null
}

export type UsuarioPullRecord = AuditPullFields & {
  nome: string
  matricula: string
  perfil: string
  senhaHash: string | null
  deveTrocarSenha: boolean
  ativo: boolean
}

export type SetorPullRecord = AuditPullFields & {
  nome: string
  sigla: string | null
  ativo: boolean
}

export type SubsetorPullRecord = AuditPullFields & {
  nome: string
  setorUuid: string
  ativo: boolean
}

export type PostoPullRecord = AuditPullFields & {
  nome: string
  subsetorUuid: string
  ativo: boolean
}

export type ComponentePullRecord = AuditPullFields & {
  codigo: string
  nome: string
  precoAtual: number
  ativo: boolean
}

export type CircuitoPullRecord = AuditPullFields & {
  codigo: string
  nome: string
  ativo: boolean
}

export type DefeitoPullRecord = AuditPullFields & {
  codigo: string
  descricao: string
  ativo: boolean
}
