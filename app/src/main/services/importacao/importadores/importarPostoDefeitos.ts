import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo } from '../importacao.csv'
import type { RegistroCsv, ResumoImportacao } from '../importacao.types'

function normalizarComparacao(valor: unknown) {
  return normalizar(valor).toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ')
}

export async function importarPostoDefeitos(
  registros: RegistroCsv[],
  usuarioId: number
): Promise<ResumoImportacao> {
  if (!usuarioId) {
    throw new Error('USUARIO_NAO_IDENTIFICADO')
  }

  const setoresRepository = RepositoryFactory.setores()
  const subsetoresRepository = RepositoryFactory.subsetores()
  const postosRepository = RepositoryFactory.postos()
  const defeitosRepository = RepositoryFactory.defeitos()
  const postoDefeitosRepository = RepositoryFactory.postoDefeitos()

  const [
    setoresAtivos,
    setoresInativos,
    subsetoresAtivos,
    subsetoresInativos,
    postosAtivos,
    postosInativos,
    defeitosAtivos,
    defeitosInativos
  ] = await Promise.all([
    setoresRepository.listar(),
    setoresRepository.listarInativos(),
    subsetoresRepository.listar(),
    subsetoresRepository.listarInativos(),
    postosRepository.listar(),
    postosRepository.listarInativos(),
    defeitosRepository.listar(),
    defeitosRepository.listarInativos()
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
  const defeitosPorCodigo = new Map(
    [...defeitosAtivos, ...defeitosInativos].map((defeito) => [
      normalizarCodigo(defeito.codigo),
      defeito
    ])
  )

  const vinculosPorPosto = new Map<
    number,
    Awaited<ReturnType<typeof postoDefeitosRepository.listarPorPosto>>
  >()
  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const setorSigla = normalizarCodigo(item.setor_sigla)
    const subsetorNome = normalizar(item.subsetor_nome)
    const postoNome = normalizar(item.posto_nome)
    const defeitoCodigo = normalizarCodigo(item.defeito_codigo)

    if (!setorSigla || !subsetorNome || !postoNome || !defeitoCodigo) {
      ignorados++
      continue
    }

    const setor = setoresPorSigla.get(setorSigla)
    if (!setor?.ativo) {
      ignorados++
      continue
    }

    const subsetor = subsetoresPorChave.get(`${setor.id}::${normalizarComparacao(subsetorNome)}`)
    if (!subsetor?.ativo) {
      ignorados++
      continue
    }

    const posto = postosPorChave.get(`${subsetor.id}::${normalizarComparacao(postoNome)}`)
    const defeito = defeitosPorCodigo.get(defeitoCodigo)

    if (!posto?.ativo || !defeito?.ativo) {
      ignorados++
      continue
    }

    let vinculos = vinculosPorPosto.get(posto.id)
    if (!vinculos) {
      vinculos = await postoDefeitosRepository.listarPorPosto(posto.id, true)
      vinculosPorPosto.set(posto.id, vinculos)
    }

    const existente = vinculos.find((vinculo) => vinculo.defeitoId === defeito.id)

    if (existente?.ativo) {
      ignorados++
      continue
    }

    if (existente) {
      await postoDefeitosRepository.restaurar(existente.id, usuarioId)
      existente.ativo = true
      atualizados++
      continue
    }

    const resultado = await postoDefeitosRepository.adicionar(posto.id, defeito.id, usuarioId)

    if (!resultado.sucesso) {
      ignorados++
      continue
    }

    vinculos.push({
      id: -1,
      uuid: '',
      postoId: posto.id,
      defeitoId: defeito.id,
      codigoDefeito: defeito.codigo,
      descricaoDefeito: defeito.descricao,
      ativo: true
    })
    inseridos++
  }

  return { inseridos, atualizados, ignorados }
}
