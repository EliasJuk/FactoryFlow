import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizarCodigo, normalizarNumero } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

export async function importarCircuitoComponentes(registros: RegistroCsv[]) {
  const circuitosRepository = RepositoryFactory.circuitos()
  const componentesRepository = RepositoryFactory.componentes()
  const circuitoComponentesRepository = RepositoryFactory.circuitoComponentes()

  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const circuitoCodigo = normalizarCodigo(item.circuito_codigo)
    const componenteCodigo = normalizarCodigo(item.componente_codigo)
    const quantidade = normalizarNumero(item.quantidade, 1)

    if (!circuitoCodigo || !componenteCodigo) {
      ignorados++
      continue
    }

    const circuitos = [
      ...(await circuitosRepository.listar()),
      ...(await circuitosRepository.listarInativos())
    ]

    const componentes = [
      ...(await componentesRepository.listar()),
      ...(await componentesRepository.listarInativos())
    ]

    const circuito = circuitos.find((item) => item.codigo === circuitoCodigo)

    const componente = componentes.find((item) => item.codigo === componenteCodigo)

    if (!circuito || !componente) {
      ignorados++
      continue
    }

    if (!circuito.ativo) {
      await circuitosRepository.restaurar(circuito.id)
    }

    if (!componente.ativo) {
      await componentesRepository.restaurar(componente.id)
    }

    const atuais = await circuitoComponentesRepository.listarPorCircuito(circuito.id)

    const existente = atuais.find((item) => item.componenteId === componente.id)

    if (existente) {
      await circuitoComponentesRepository.remover(existente.id)
      await circuitoComponentesRepository.adicionar(circuito.id, componente.id, quantidade)

      atualizados++
      continue
    }

    await circuitoComponentesRepository.adicionar(circuito.id, componente.id, quantidade)

    inseridos++
  }

  return { inseridos, atualizados, ignorados }
}
