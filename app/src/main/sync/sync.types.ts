export type SyncOperation = 'CREATE' | 'UPDATE' | 'CANCEL'

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
  operation: SyncOperation
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
