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

export type ResultadoImportacao = {
  sucesso: boolean
  mensagem: string
  inseridos: number
  atualizados: number
  ignorados: number
}

export type ResumoImportacao = Omit<ResultadoImportacao, 'sucesso' | 'mensagem'>

export type RegistroCsv = Record<string, string>

export type RegistroPreview = {
  id: number
  linha: number
  selecionado: boolean
  dados: RegistroCsv
}
