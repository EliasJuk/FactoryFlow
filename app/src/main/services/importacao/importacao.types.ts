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

export type ResultadoImportacao = {
  sucesso: boolean
  mensagem: string
  inseridos: number
  atualizados: number
  ignorados: number
}

export type ResumoImportacao = Omit<ResultadoImportacao, 'sucesso' | 'mensagem'>

export type RegistroCsv = Record<string, string>

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
  dados: RegistroCsv
  status: StatusRegistroImportacao
  resumo: string
  mensagens: string[]
  alteracoes: AlteracaoCampoImportacao[]
  registroExistenteId?: number
}
