export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL'

export type SyncEntity =
  | 'USUARIO'
  | 'SETOR'
  | 'SUBSETOR'
  | 'POSTO'
  | 'COMPONENTE'
  | 'CIRCUITO'
  | 'CIRCUITO_COMPONENTE'
  | 'DEFEITO'
  | 'POSTO_DEFEITO'
  | 'ROTEIRO'
  | 'REFUGO'
  | 'SOLICITACAO_ALTERACAO_SENHA'

export type AuditSyncFields = {
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  createdByUuid: string | null
  updatedByUuid: string | null
  deletedByUuid: string | null
}

export type UsuarioSyncPayload = {
  schemaVersion: 1
  sourceInstallationUuid: string
  entity: 'USUARIO'
  operation: Extract<SyncOperation, 'CREATE' | 'UPDATE' | 'DELETE'>
  record: AuditSyncFields & {
    uuid: string
    nome: string
    matricula: string
    perfil: string
    senhaHash: string | null
    deveTrocarSenha: boolean
    ativo: boolean
  }
}

export type SetorSyncPayload = {
  schemaVersion: 1
  sourceInstallationUuid: string
  entity: 'SETOR'
  operation: Extract<SyncOperation, 'CREATE' | 'UPDATE' | 'DELETE'>
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
  operation: Extract<SyncOperation, 'CREATE' | 'UPDATE' | 'DELETE'>
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
  operation: Extract<SyncOperation, 'CREATE' | 'UPDATE' | 'DELETE'>
  record: AuditSyncFields & {
    uuid: string
    nome: string
    subsetorUuid: string
    ativo: boolean
  }
}

export type ComponenteSyncPayload = {
  schemaVersion: 1
  sourceInstallationUuid: string
  entity: 'COMPONENTE'
  operation: Extract<SyncOperation, 'CREATE' | 'UPDATE' | 'DELETE'>
  record: AuditSyncFields & {
    uuid: string
    codigo: string
    nome: string
    precoAtual: number
    ativo: boolean
  }
}

export type CircuitoSyncPayload = {
  schemaVersion: 1
  sourceInstallationUuid: string
  entity: 'CIRCUITO'
  operation: Extract<SyncOperation, 'CREATE' | 'UPDATE' | 'DELETE'>
  record: AuditSyncFields & {
    uuid: string
    codigo: string
    nome: string
    ativo: boolean
  }
}

export type CircuitoComponenteSyncPayload = {
  schemaVersion: 1
  sourceInstallationUuid: string
  entity: 'CIRCUITO_COMPONENTE'
  operation: Extract<SyncOperation, 'CREATE' | 'UPDATE' | 'DELETE'>
  record: AuditSyncFields & {
    uuid: string
    circuitoUuid: string
    componenteUuid: string
    quantidade: number
    ativo: boolean
  }
}

export type DefeitoSyncPayload = {
  schemaVersion: 1
  sourceInstallationUuid: string
  entity: 'DEFEITO'
  operation: Extract<SyncOperation, 'CREATE' | 'UPDATE' | 'DELETE'>
  record: AuditSyncFields & {
    uuid: string
    codigo: string
    descricao: string
    ativo: boolean
  }
}

export type PostoDefeitoSyncPayload = {
  schemaVersion: 1
  sourceInstallationUuid: string
  entity: 'POSTO_DEFEITO'
  operation: Extract<SyncOperation, 'CREATE' | 'UPDATE' | 'DELETE'>
  record: AuditSyncFields & {
    uuid: string
    postoUuid: string
    defeitoUuid: string
    ativo: boolean
  }
}

export type RoteiroSyncPayload = {
  schemaVersion: 1
  sourceInstallationUuid: string
  entity: 'ROTEIRO'
  operation: Extract<SyncOperation, 'CREATE' | 'UPDATE' | 'DELETE'>
  record: AuditSyncFields & {
    uuid: string
    circuitoUuid: string
    postoUuid: string
    componenteUuid: string
    quantidade: number
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
  operation: Extract<SyncOperation, 'CREATE' | 'UPDATE' | 'CANCEL'>
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

export type SolicitacaoAlteracaoSenhaSyncPayload = {
  schemaVersion: 1
  sourceInstallationUuid: string
  entity: 'SOLICITACAO_ALTERACAO_SENHA'
  operation: Extract<SyncOperation, 'CREATE' | 'UPDATE'>
  record: AuditSyncFields & {
    uuid: string
    usuarioUuid: string
    status: string
    solicitadoEm: string
    atendidoEm: string | null
    canceladoEm: string | null
    atendidoPorUuid: string | null
    canceladoPorUuid: string | null
  }
}

export type SyncPayload =
  | UsuarioSyncPayload
  | SetorSyncPayload
  | SubsetorSyncPayload
  | PostoSyncPayload
  | ComponenteSyncPayload
  | CircuitoSyncPayload
  | CircuitoComponenteSyncPayload
  | DefeitoSyncPayload
  | PostoDefeitoSyncPayload
  | RoteiroSyncPayload
  | RefugoSyncPayload
  | SolicitacaoAlteracaoSenhaSyncPayload