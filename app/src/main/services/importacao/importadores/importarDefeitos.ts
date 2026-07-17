import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

export async function importarDefeitos(registros: RegistroCsv[]) {
  const repository = RepositoryFactory.defeitos()

  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const codigo = normalizarCodigo(item.codigo)
    const descricao = normalizar(item.descricao)

    if (!codigo || !descricao) {
      ignorados++
      continue
    }

    const defeitos = [...(await repository.listar()), ...(await repository.listarInativos())]

    const existente = defeitos.find((defeito) => defeito.codigo === codigo)

    if (existente) {
      if (!existente.ativo) {
        await repository.restaurar(existente.id)
      }

      await repository.editar(existente.id, codigo, descricao)
      atualizados++
      continue
    }

    await repository.criar(codigo, descricao)
    inseridos++
  }

  return { inseridos, atualizados, ignorados }
}
