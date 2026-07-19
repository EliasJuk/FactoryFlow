export type TipoImportacao =
  | 'setores'
  | 'subsetores'
  | 'postos'
  | 'componentes'
  | 'circuitos'
  | 'defeitos'
  | 'usuarios'
  | 'circuitoComponentes'
  | 'roteiros'
  | 'postoDefeitos'
  | 'refugosHistoricos'

export type StatusRegistroImportacao = 'NOVO' | 'ATUALIZAR' | 'RESTAURAR' | 'SEM_ALTERACAO' | 'ERRO'

export type AlteracaoCampoImportacao = {
  campo: string
  valorAtual: string | null
  novoValor: string | null
}

export type AvisoImportacao = {
  tipo: 'DEPENDENCIA_INATIVA'
  titulo: string
  mensagem: string
  itens: string[]
}

export type RegistroPreview = {
  id: number
  linha: number
  selecionado: boolean
  dados: Record<string, string>
  status: StatusRegistroImportacao
  resumo: string
  mensagens: string[]
  alteracoes: AlteracaoCampoImportacao[]
  registroExistenteId?: number
}

export type ResultadoImportacaoApi = {
  sucesso: boolean
  mensagem: string
  inseridos: number
  atualizados: number
  ignorados: number
}

export type ResultadoPreVisualizacaoApi = {
  sucesso: boolean
  mensagem: string
  registros: RegistroPreview[]
  avisos: AvisoImportacao[]
}

export type ResultadoOperacaoImportacaoApi = {
  sucesso: boolean
  mensagem: string
}
