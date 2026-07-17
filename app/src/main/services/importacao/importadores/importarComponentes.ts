import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo, normalizarPreco } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

export async function importarComponentes(registros: RegistroCsv[]) {
  const repository = RepositoryFactory.componentes()

  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const codigo = normalizarCodigo(item.codigo)
    const nome = normalizar(item.nome)
    const precoAtual = normalizarPreco(item.preco ?? item.preco_atual)

    if (!codigo || !nome) {
      ignorados++
      continue
    }

    const componentes = [...(await repository.listar()), ...(await repository.listarInativos())]

    const existente = componentes.find((componente) => componente.codigo === codigo)

    if (existente) {
      if (!existente.ativo) {
        await repository.restaurar(existente.id)
      }

      await repository.editar(existente.id, codigo, nome, precoAtual)
      atualizados++
      continue
    }

    await repository.criar(codigo, nome, precoAtual)
    inseridos++
  }

  return { inseridos, atualizados, ignorados }
}
