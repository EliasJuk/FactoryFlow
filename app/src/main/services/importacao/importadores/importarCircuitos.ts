import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

function normalizarComparacao(valor: unknown) {
  return normalizar(valor).toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ')
}

export async function importarCircuitos(registros: RegistroCsv[], usuarioId: number) {
  const repository = RepositoryFactory.circuitos()
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

    if (!codigo || !nome) {
      ignorados++
      continue
    }

    const existente = porCodigo.get(codigo)

    if (existente) {
      const nomeAlterado = normalizarComparacao(existente.nome) !== normalizarComparacao(nome)

      if (!existente.ativo) {
        await repository.restaurar(existente.id, usuarioId)

        if (nomeAlterado) {
          await repository.editar(existente.id, codigo, nome, usuarioId)
        }

        existente.ativo = true
        existente.nome = nome
        atualizados++
        continue
      }

      if (nomeAlterado) {
        await repository.editar(existente.id, codigo, nome, usuarioId)

        existente.nome = nome
        atualizados++
        continue
      }

      ignorados++
      continue
    }

    await repository.criar(codigo, nome, usuarioId)

    porCodigo.set(codigo, {
      id: -1,
      uuid: '',
      codigo,
      nome,
      ativo: true,
      totalComponentes: 0,
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
