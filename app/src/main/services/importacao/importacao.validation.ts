import type { RegistroCsv } from './importacao.types'

export type ResultadoValidacaoEstrutural = {
  valido: boolean
  erros: string[]
}

export function validarColunasObrigatorias(
  registros: RegistroCsv[],
  colunasObrigatorias: string[]
): ResultadoValidacaoEstrutural {
  if (registros.length === 0) {
    return {
      valido: false,
      erros: ['O arquivo não possui registros para análise.']
    }
  }

  const colunasEncontradas = new Set(
    Object.keys(registros[0]).filter((coluna) => coluna !== '__linha')
  )

  const ausentes = colunasObrigatorias.filter((coluna) => !colunasEncontradas.has(coluna))

  return {
    valido: ausentes.length === 0,
    erros: ausentes.map((coluna) => `Coluna obrigatória ausente: ${coluna}.`)
  }
}
