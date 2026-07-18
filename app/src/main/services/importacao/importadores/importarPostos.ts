import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

function normalizarComparacao(valor: unknown) {
  return normalizar(valor).toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ')
}

export async function importarPostos(registros: RegistroCsv[], usuarioId?: number | null) {
  const setoresRepository = RepositoryFactory.setores()
  const subsetoresRepository = RepositoryFactory.subsetores()
  const postosRepository = RepositoryFactory.postos()

  const [
    setoresAtivos,
    setoresInativos,
    subsetoresAtivos,
    subsetoresInativos,
    postosAtivos,
    postosInativos
  ] = await Promise.all([
    setoresRepository.listar(),
    setoresRepository.listarInativos(),
    subsetoresRepository.listar(),
    subsetoresRepository.listarInativos(),
    postosRepository.listar(),
    postosRepository.listarInativos()
  ])

  const setoresPorSigla = new Map(
    [...setoresAtivos, ...setoresInativos].map((setor) => [normalizarCodigo(setor.sigla), setor])
  )

  const subsetoresPorChave = new Map(
    [...subsetoresAtivos, ...subsetoresInativos].map((subsetor) => [
      `${subsetor.setorId}::${normalizarComparacao(subsetor.nome)}`,
      subsetor
    ])
  )

  const postosPorChave = new Map(
    [...postosAtivos, ...postosInativos].map((posto) => [
      `${posto.subsetorId}::${normalizarComparacao(posto.nome)}`,
      posto
    ])
  )

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

    const setor = setoresPorSigla.get(setorSigla)

    if (!setor || !setor.ativo) {
      ignorados++
      continue
    }

    const subsetor = subsetoresPorChave.get(`${setor.id}::${normalizarComparacao(subsetorNome)}`)

    if (!subsetor || !subsetor.ativo) {
      ignorados++
      continue
    }

    const chavePosto = `${subsetor.id}::${normalizarComparacao(nome)}`
    const existente = postosPorChave.get(chavePosto)

    if (existente) {
      if (!existente.ativo) {
        await postosRepository.restaurar(existente.id, usuarioId ?? undefined)
        existente.ativo = true
        atualizados++
      } else {
        ignorados++
      }

      continue
    }

    await postosRepository.criar(nome, subsetor.id, usuarioId ?? undefined)

    postosPorChave.set(chavePosto, {
      id: -1,
      uuid: '',
      nome,
      subsetorId: subsetor.id,
      subsetorNome: subsetor.nome,
      setorNome: setor.nome,
      ativo: true,
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
      createdBy: usuarioId ?? 1,
      updatedBy: usuarioId ?? 1,
      deletedBy: null,
      createdByNome: null,
      updatedByNome: null,
      deletedByNome: null
    })

    inseridos++
  }

  return { inseridos, atualizados, ignorados }
}
