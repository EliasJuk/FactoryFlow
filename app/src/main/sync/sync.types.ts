export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL'
export type SyncEntity = 'SETOR' | 'SUBSETOR' | 'POSTO' | 'REFUGO'

export type AuditSyncFields = {
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  createdByUuid: string | null
  updatedByUuid: string | null
  deletedByUuid: string | null
}

export type SetorSyncPayload = {
  schemaVersion: 1
  sourceInstallationUuid: string
  entity: 'SETOR'
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  record: AuditSyncFields & {
    uuid: string
    nome: string
    sigla: string | null
    ativo: boolean
  }
}

export type SubsetorSyncPayload = {
  schemaVersion: 1
  sourceInstallationUuid: string
  entity: 'SUBSETOR'
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  record: AuditSyncFields & {
    uuid: string
    nome: string
    setorUuid: string
    ativo: boolean
  }
}

export type PostoSyncPayload = {
  schemaVersion: 1
  sourceInstallationUuid: string
  entity: 'POSTO'
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  record: AuditSyncFields & {
    uuid: string
    nome: string
    subsetorUuid: string
    ativo: boolean
  }
}

export type RefugoSyncItemPayload = {
  uuid: string
  componenteUuid: string
  defeitoUuid: string
  quantidade: number
  codigoComponenteSnapshot: string | null
  nomeComponenteSnapshot: string | null
  codigoDefeitoSnapshot: string | null
  descricaoDefeitoSnapshot: string | null
  precoUnitarioSnapshot: number
  custoTotalSnapshot: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  createdByUuid: string | null
  updatedByUuid: string | null
  deletedByUuid: string | null
}

export type RefugoSyncPayload = {
  schemaVersion: 1
  sourceInstallationUuid: string
  entity: 'REFUGO'
  operation: 'CREATE' | 'UPDATE' | 'CANCEL'
  record: {
    uuid: string
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
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    createdByUuid: string | null
    updatedByUuid: string | null
    deletedByUuid: string | null
    itens: RefugoSyncItemPayload[]
  }
}

export type SyncPayload =
  SetorSyncPayload | SubsetorSyncPayload | PostoSyncPayload | RefugoSyncPayload
