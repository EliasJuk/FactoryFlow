import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo, normalizarNumero } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

export async function importarRoteiros(registros: RegistroCsv[]) {
  const circuitosRepository = RepositoryFactory.circuitos()
  const postosRepository = RepositoryFactory.postos()
  const componentesRepository = RepositoryFactory.componentes()
  const roteiroRepository = RepositoryFactory.roteiros()

  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const circuitoCodigo = normalizarCodigo(item.circuito_codigo)
    const postoNome = normalizar(item.posto_nome)
    const componenteCodigo = normalizarCodigo(item.componente_codigo)
    const quantidade = normalizarNumero(item.quantidade, 1)

    if (!circuitoCodigo || !postoNome || !componenteCodigo) {
      ignorados++
      continue
    }

    const circuitos = [
      ...(await circuitosRepository.listar()),
      ...(await circuitosRepository.listarInativos())
    ]

    const postos = [
      ...(await postosRepository.listar()),
      ...(await postosRepository.listarInativos())
    ]

    const componentes = [
      ...(await componentesRepository.listar()),
      ...(await componentesRepository.listarInativos())
    ]

    const circuito = circuitos.find((item) => item.codigo === circuitoCodigo)

    const posto = postos.find((item) => item.nome.trim().toLowerCase() === postoNome.toLowerCase())

    const componente = componentes.find((item) => item.codigo === componenteCodigo)

    if (!circuito || !posto || !componente) {
      ignorados++
      continue
    }

    if (!circuito.ativo) {
      await circuitosRepository.restaurar(circuito.id)
    }

    if (!posto.ativo) {
      await postosRepository.restaurar(posto.id)
    }

    if (!componente.ativo) {
      await componentesRepository.restaurar(componente.id)
    }

    const atuais = await roteiroRepository.listarPorCircuitoEPosto(circuito.id, posto.id)

    const existente = atuais.find((item) => item.componenteId === componente.id)

    await roteiroRepository.adicionar(circuito.id, posto.id, componente.id, quantidade)

    if (existente) {
      atualizados++
    } else {
      inseridos++
    }
  }

  return { inseridos, atualizados, ignorados }
}
