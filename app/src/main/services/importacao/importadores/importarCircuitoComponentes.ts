import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

export async function importarCircuitoComponentes(
  registros: RegistroCsv[],
  usuarioId?: number | null
) {
  const circuitosRepository = RepositoryFactory.circuitos()
  const componentesRepository = RepositoryFactory.componentes()
  const vinculosRepository = RepositoryFactory.circuitoComponentes()

  const [circuitosAtivos, circuitosInativos, componentesAtivos, componentesInativos] =
    await Promise.all([
      circuitosRepository.listar(),
      circuitosRepository.listarInativos(),
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

  const vinculosPorCircuito = new Map<
    number,
    Awaited<ReturnType<typeof vinculosRepository.listarPorCircuito>>
  >()

  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const circuitoCodigo = normalizarCodigo(item.circuito_codigo)
    const componenteCodigo = normalizarCodigo(item.componente_codigo)
    const quantidadeTexto = normalizar(item.quantidade)
    const quantidade = Number(quantidadeTexto.replace(',', '.'))

    if (!circuitoCodigo || !componenteCodigo || !Number.isInteger(quantidade) || quantidade <= 0) {
      ignorados++
      continue
    }

    const circuito = circuitosPorCodigo.get(circuitoCodigo)
    const componente = componentesPorCodigo.get(componenteCodigo)

    if (!circuito || !componente || !circuito.ativo || !componente.ativo) {
      ignorados++
      continue
    }

    let vinculos = vinculosPorCircuito.get(circuito.id)

    if (!vinculos) {
      vinculos = await vinculosRepository.listarPorCircuito(circuito.id, true)
      vinculosPorCircuito.set(circuito.id, vinculos)
    }

    const existente = vinculos.find((vinculo) => vinculo.componenteId === componente.id)

    if (!existente) {
      const resultado = await vinculosRepository.adicionar(
        circuito.id,
        componente.id,
        quantidade,
        usuarioId ?? undefined
      )

      if (!resultado.sucesso) {
        ignorados++
        continue
      }

      vinculos.push({
        id: -1,
        uuid: '',
        circuitoId: circuito.id,
        componenteId: componente.id,
        codigoComponente: componente.codigo,
        nomeComponente: componente.nome,
        quantidade,
        ativo: true
      })

      inseridos++
      continue
    }

    if (!existente.ativo) {
      const resultado = await vinculosRepository.adicionar(
        circuito.id,
        componente.id,
        quantidade,
        usuarioId ?? undefined
      )

      if (!resultado.sucesso) {
        ignorados++
        continue
      }

      existente.ativo = true
      existente.quantidade = quantidade
      atualizados++
      continue
    }

    if (existente.quantidade !== quantidade) {
      await vinculosRepository.editarQuantidade(existente.id, quantidade, usuarioId ?? undefined)

      existente.quantidade = quantidade
      atualizados++
      continue
    }

    ignorados++
  }

  return { inseridos, atualizados, ignorados }
}
