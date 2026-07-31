import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

function normalizarComparacao(valor: unknown) {
  return normalizar(valor).toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ')
}

function analisarPrecoImportacao(valor: unknown): { valido: boolean; valor: number } {
  const original = normalizar(valor)
  if (!original) return { valido: false, valor: 0 }

  const texto = original.replace(/\s+/g, '')
  let normalizado = texto

  if (texto.includes(',') && texto.includes('.')) {
    normalizado =
      texto.lastIndexOf(',') > texto.lastIndexOf('.')
        ? texto.replace(/\./g, '').replace(',', '.')
        : texto.replace(/,/g, '')
  } else if (texto.includes(',')) {
    normalizado = texto.replace(',', '.')
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalizado)) {
    return { valido: false, valor: 0 }
  }

  const preco = Number(normalizado)
  return Number.isFinite(preco) && preco >= 0
    ? { valido: true, valor: preco }
    : { valido: false, valor: 0 }
}

export async function importarComponentes(registros: RegistroCsv[], usuarioId: number) {
  const repository = RepositoryFactory.componentes()
  const [ativos, inativos] = await Promise.all([repository.listar(), repository.listarInativos()])

  const porCodigo = new Map(
    [...ativos, ...inativos].map((item) => [normalizarCodigo(item.codigo), item])
  )

  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const codigo = normalizarCodigo(item.codigo)
    const nome = normalizar(item.nome)
    const precoAnalisado = analisarPrecoImportacao(item.preco ?? item.preco_atual)

    if (!codigo || !nome || !precoAnalisado.valido) {
      ignorados++
      continue
    }

    const precoAtual = precoAnalisado.valor
    const existente = porCodigo.get(codigo)

    if (existente) {
      const nomeAlterado = normalizarComparacao(existente.nome) !== normalizarComparacao(nome)
      const precoAlterado = Math.abs(Number(existente.precoAtual) - precoAtual) > 0.0001

      if (!existente.ativo) {
        await repository.restaurar(existente.id, usuarioId)

        if (nomeAlterado || precoAlterado) {
          await repository.editar(existente.id, codigo, nome, precoAtual, usuarioId)
        }

        existente.ativo = true
        existente.nome = nome
        existente.precoAtual = precoAtual
        atualizados++
        continue
      }

      if (nomeAlterado || precoAlterado) {
        await repository.editar(existente.id, codigo, nome, precoAtual, usuarioId)

        existente.nome = nome
        existente.precoAtual = precoAtual
        atualizados++
        continue
      }

      ignorados++
      continue
    }

    await repository.criar(codigo, nome, precoAtual, usuarioId)

    porCodigo.set(codigo, {
      id: -1,
      uuid: '',
      codigo,
      nome,
      precoAtual,
      ativo: true,
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
      createdBy: usuarioId,
      updatedBy: usuarioId,
      deletedBy: null,
      createdByNome: null,
      updatedByNome: null,
      deletedByNome: null
    })

    inseridos++
  }

  return { inseridos, atualizados, ignorados }
}
