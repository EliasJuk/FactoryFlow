import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

export async function importarSetores(registros: RegistroCsv[], usuarioId: number) {
  const repository = RepositoryFactory.setores()

  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const nome = normalizar(item.nome)
    const sigla = normalizarCodigo(item.sigla)

    if (!nome || !sigla) {
      ignorados++
      continue
    }

    const ativos = await repository.listar()
    const inativos = await repository.listarInativos()

    const ativo = ativos.find((setor) => setor.sigla === sigla)
    const inativo = inativos.find((setor) => setor.sigla === sigla)

    if (ativo) {
      await repository.editar(ativo.id, nome, sigla, usuarioId)
      atualizados++
      continue
    }

    if (inativo) {
      await repository.restaurar(inativo.id, usuarioId)
      await repository.editar(inativo.id, nome, sigla, usuarioId)
      atualizados++
      continue
    }

    await repository.criar(nome, sigla, usuarioId)
    inseridos++
  }

  return { inseridos, atualizados, ignorados }
}
