export type PullEntity =
  | 'USUARIO'
  | 'SETOR'
  | 'SUBSETOR'
  | 'POSTO'
  | 'COMPONENTE'
  | 'CIRCUITO'
  | 'DEFEITO'
  | 'CIRCUITO_COMPONENTE'
  | 'POSTO_DEFEITO'
  | 'ROTEIRO'
  | 'REFUGO'

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

export type CircuitoComponentePullRecord = AuditPullFields & {
  circuitoUuid: string
  componenteUuid: string
  quantidade: number
  ativo: boolean
}

export type PostoDefeitoPullRecord = AuditPullFields & {
  postoUuid: string
  defeitoUuid: string
  ativo: boolean
}

export type RoteiroPullRecord = AuditPullFields & {
  circuitoUuid: string
  postoUuid: string
  componenteUuid: string
  quantidade: number
  ativo: boolean
}

export type RefugoPullItemRecord = AuditPullFields & {
  componenteUuid: string
  defeitoUuid: string
  quantidade: number
  codigoComponenteSnapshot: string | null
  nomeComponenteSnapshot: string | null
  codigoDefeitoSnapshot: string | null
  descricaoDefeitoSnapshot: string | null
  precoUnitarioSnapshot: number
  custoTotalSnapshot: number
}

export type RefugoPullRecord = AuditPullFields & {
  numeroRefugo: string
  siglaSetor: string
  ano: number
  sequencia: number
  dataHora: string
  turno: string
  matriculaOperador: string
  usuarioUuid: string | null
  setorUuid: string
  subsetorUuid: string
  postoUuid: string
  circuitoUuid: string
  quantidadeProduzida: number
  observacao: string | null
  status: string
  motivoCancelamento: string | null
  origem: string
  idOrigem: string | null
  importadoEm: string | null
  importadoPorUuid: string | null
  itens: RefugoPullItemRecord[]
}
