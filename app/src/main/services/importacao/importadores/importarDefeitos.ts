import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

function normalizarComparacao(valor: unknown) {
  return normalizar(valor).toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ')
}

export async function importarDefeitos(registros: RegistroCsv[], usuarioId?: number | null) {
  const repository = RepositoryFactory.defeitos()

  const [ativos, inativos] = await Promise.all([repository.listar(), repository.listarInativos()])

  const defeitosPorCodigo = new Map(
    [...ativos, ...inativos].map((defeito) => [normalizarCodigo(defeito.codigo), defeito])
  )

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

    const existente = defeitosPorCodigo.get(codigo)

    if (existente) {
      const descricaoAlterada =
        normalizarComparacao(existente.descricao) !== normalizarComparacao(descricao)

      if (!existente.ativo) {
        await repository.restaurar(existente.id, usuarioId ?? undefined)

        if (descricaoAlterada) {
          await repository.editar(existente.id, codigo, descricao, usuarioId ?? undefined)
        }

        existente.ativo = true
        existente.descricao = descricao
        atualizados++
        continue
      }

      if (descricaoAlterada) {
        await repository.editar(existente.id, codigo, descricao, usuarioId ?? undefined)

        existente.descricao = descricao
        atualizados++
        continue
      }

      ignorados++
      continue
    }

    await repository.criar(codigo, descricao, usuarioId ?? undefined)

    defeitosPorCodigo.set(codigo, {
      id: -1,
      uuid: '',
      codigo,
      descricao,
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
