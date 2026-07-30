import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

export async function importarSubsetores(registros: RegistroCsv[], usuarioId: number) {
  const setoresRepository = RepositoryFactory.setores()
  const subsetoresRepository = RepositoryFactory.subsetores()

  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const setorSigla = normalizarCodigo(item.setor_sigla)
    const nome = normalizar(item.nome)

    if (!setorSigla || !nome) {
      ignorados++
      continue
    }

    const setores = [
      ...(await setoresRepository.listar()),
      ...(await setoresRepository.listarInativos())
    ]

    const setor = setores.find((item) => item.sigla === setorSigla)

    if (!setor) {
      ignorados++
      continue
    }

    if (!setor.ativo) {
      ignorados++
      continue
    }

    const subsetores = [
      ...(await subsetoresRepository.listar()),
      ...(await subsetoresRepository.listarInativos())
    ]

    const existente = subsetores.find(
      (subsetor) =>
        subsetor.nome.trim().toLowerCase() === nome.toLowerCase() && subsetor.setorId === setor.id
    )

    if (existente) {
      if (!existente.ativo) {
        await subsetoresRepository.restaurar(existente.id, usuarioId)
      }

      await subsetoresRepository.editar(existente.id, nome, setor.id, usuarioId)
      atualizados++
      continue
    }

    await subsetoresRepository.criar(nome, setor.id, usuarioId)
    inseridos++
  }

  return { inseridos, atualizados, ignorados }
}
