import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

export async function importarUsuarios(registros: RegistroCsv[]) {
  const repository = RepositoryFactory.usuarios()

  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const matricula = normalizar(item.matricula)
    const nome = normalizar(item.nome)
    const perfil = normalizar(item.perfil || 'OPERADOR').toUpperCase()
    const senha = normalizar(item.senha)

    if (!matricula || !nome) {
      ignorados++
      continue
    }

    const usuarios = await repository.listar()

    const existente = usuarios.find((usuario) => usuario.matricula === matricula)

    if (existente) {
      if (!existente.ativo) {
        await repository.ativar(existente.id)
      }

      await repository.editar(existente.id, {
        nome,
        matricula,
        perfil,
        senha: senha || undefined
      })

      atualizados++
      continue
    }

    await repository.criar({
      nome,
      matricula,
      perfil,
      senha: senha || undefined
    })

    inseridos++
  }

  return { inseridos, atualizados, ignorados }
}
