import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

export async function importarPostos(registros: RegistroCsv[]) {
  const setoresRepository = RepositoryFactory.setores()
  const subsetoresRepository = RepositoryFactory.subsetores()
  const postosRepository = RepositoryFactory.postos()

  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const setorSigla = normalizarCodigo(item.setor_sigla)
    const subsetorNome = normalizar(item.subsetor_nome)
    const nome = normalizar(item.nome)

    if (!setorSigla || !subsetorNome || !nome) {
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

    const subsetores = [
      ...(await subsetoresRepository.listar()),
      ...(await subsetoresRepository.listarInativos())
    ]

    const subsetor = subsetores.find(
      (item) =>
        item.setorId === setor.id && item.nome.trim().toLowerCase() === subsetorNome.toLowerCase()
    )

    if (!subsetor) {
      ignorados++
      continue
    }

    if (!subsetor.ativo) {
      await subsetoresRepository.restaurar(subsetor.id)
    }

    const postos = [
      ...(await postosRepository.listar()),
      ...(await postosRepository.listarInativos())
    ]

    const existente = postos.find(
      (posto) =>
        posto.subsetorId === subsetor.id && posto.nome.trim().toLowerCase() === nome.toLowerCase()
    )

    if (existente) {
      if (!existente.ativo) {
        await postosRepository.restaurar(existente.id)
      }

      await postosRepository.editar(existente.id, nome, subsetor.id)
      atualizados++
      continue
    }

    await postosRepository.criar(nome, subsetor.id)
    inseridos++
  }

  return { inseridos, atualizados, ignorados }
}
