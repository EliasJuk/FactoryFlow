import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

export async function importarCircuitos(registros: RegistroCsv[]) {
  const repository = RepositoryFactory.circuitos()

  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const codigo = normalizarCodigo(item.codigo)
    const nome = normalizar(item.nome)

    if (!codigo || !nome) {
      ignorados++
      continue
    }

    const circuitos = [...(await repository.listar()), ...(await repository.listarInativos())]

    const existente = circuitos.find((circuito) => circuito.codigo === codigo)

    if (existente) {
      if (!existente.ativo) {
        await repository.restaurar(existente.id)
      }

      await repository.editar(existente.id, codigo, nome)
      atualizados++
      continue
    }

    await repository.criar(codigo, nome)
    inseridos++
  }

  return { inseridos, atualizados, ignorados }
}
