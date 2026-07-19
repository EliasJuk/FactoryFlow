import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

function normalizarComparacao(valor: unknown) {
  return normalizar(valor).toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ')
}

export async function importarRoteiros(registros: RegistroCsv[], usuarioId?: number | null) {
  const circuitosRepository = RepositoryFactory.circuitos()
  const postosRepository = RepositoryFactory.postos()
  const componentesRepository = RepositoryFactory.componentes()
  const circuitoComponentesRepository = RepositoryFactory.circuitoComponentes()
  const roteirosRepository = RepositoryFactory.roteiros()

  const [
    circuitosAtivos,
    circuitosInativos,
    postosAtivos,
    postosInativos,
    componentesAtivos,
    componentesInativos
  ] = await Promise.all([
    circuitosRepository.listar(),
    circuitosRepository.listarInativos(),
    postosRepository.listar(),
    postosRepository.listarInativos(),
    componentesRepository.listar(),
    componentesRepository.listarInativos()
  ])

  const circuitosPorCodigo = new Map(
    [...circuitosAtivos, ...circuitosInativos].map((circuito) => [
      normalizarCodigo(circuito.codigo),
      circuito
    ])
  )

  const componentesPorCodigo = new Map(
    [...componentesAtivos, ...componentesInativos].map((componente) => [
      normalizarCodigo(componente.codigo),
      componente
    ])
  )

  const postosPorNome = new Map<string, typeof postosAtivos>()

  for (const posto of [...postosAtivos, ...postosInativos]) {
    const chave = normalizarComparacao(posto.nome)
    const lista = postosPorNome.get(chave) ?? []
    lista.push(posto)
    postosPorNome.set(chave, lista)
  }

  const componentesPorCircuito = new Map<
    number,
    Awaited<ReturnType<typeof circuitoComponentesRepository.listarPorCircuito>>
  >()

  const roteirosPorCircuitoPosto = new Map<
    string,
    Awaited<ReturnType<typeof roteirosRepository.listarPorCircuitoEPosto>>
  >()

  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const circuitoCodigo = normalizarCodigo(item.circuito_codigo)
    const postoNome = normalizar(item.posto_nome)
    const componenteCodigo = normalizarCodigo(item.componente_codigo)
    const quantidadeTexto = normalizar(item.quantidade)
    const quantidade = Number(quantidadeTexto.replace(',', '.'))

    if (
      !circuitoCodigo ||
      !postoNome ||
      !componenteCodigo ||
      !Number.isInteger(quantidade) ||
      quantidade <= 0
    ) {
      ignorados++
      continue
    }

    const circuito = circuitosPorCodigo.get(circuitoCodigo)
    const componente = componentesPorCodigo.get(componenteCodigo)
    const postos = postosPorNome.get(normalizarComparacao(postoNome)) ?? []
    const posto = postos.length === 1 ? postos[0] : undefined

    if (
      !circuito ||
      !componente ||
      !posto ||
      !circuito.ativo ||
      !componente.ativo ||
      !posto.ativo
    ) {
      ignorados++
      continue
    }

    let componentesCircuito = componentesPorCircuito.get(circuito.id)

    if (!componentesCircuito) {
      componentesCircuito = await circuitoComponentesRepository.listarPorCircuito(circuito.id, true)
      componentesPorCircuito.set(circuito.id, componentesCircuito)
    }

    const vinculoCircuito = componentesCircuito.find(
      (vinculo) => vinculo.componenteId === componente.id
    )

    if (!vinculoCircuito?.ativo) {
      ignorados++
      continue
    }

    const chaveRoteiro = `${circuito.id}::${posto.id}`
    let itensRoteiro = roteirosPorCircuitoPosto.get(chaveRoteiro)

    if (!itensRoteiro) {
      itensRoteiro = await roteirosRepository.listarPorCircuitoEPosto(circuito.id, posto.id, true)
      roteirosPorCircuitoPosto.set(chaveRoteiro, itensRoteiro)
    }

    const existente = itensRoteiro.find((registro) => registro.componenteId === componente.id)

    if (!existente) {
      await roteirosRepository.adicionar(
        circuito.id,
        posto.id,
        componente.id,
        quantidade,
        usuarioId ?? undefined
      )

      itensRoteiro.push({
        id: -1,
        uuid: '',
        circuitoId: circuito.id,
        postoId: posto.id,
        componenteId: componente.id,
        codigoComponente: componente.codigo,
        nomeComponente: componente.nome,
        quantidade,
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
      continue
    }

    if (!existente.ativo) {
      await roteirosRepository.adicionar(
        circuito.id,
        posto.id,
        componente.id,
        quantidade,
        usuarioId ?? undefined
      )

      existente.ativo = true
      existente.quantidade = quantidade
      atualizados++
      continue
    }

    if (existente.quantidade !== quantidade) {
      await roteirosRepository.editarQuantidade(existente.id, quantidade, usuarioId ?? undefined)

      existente.quantidade = quantidade
      atualizados++
      continue
    }

    ignorados++
  }

  return { inseridos, atualizados, ignorados }
}
