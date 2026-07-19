import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

const PERFIS_USUARIO_PERMITIDOS = new Set(['ADMIN', 'QUALIDADE', 'LIDER', 'OPERADOR'])

function normalizarComparacao(valor: unknown) {
  return normalizar(valor).toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ')
}

export async function importarUsuarios(registros: RegistroCsv[], usuarioId?: number | null) {
  const repository = RepositoryFactory.usuarios()

  const [ativos, inativos] = await Promise.all([repository.listar(), repository.listarInativos()])

  const usuariosPorMatricula = new Map(
    [...ativos, ...inativos].map((usuario) => [normalizar(usuario.matricula), usuario])
  )

  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const matricula = normalizar(item.matricula)
    const nome = normalizar(item.nome)
    const perfil = normalizar(item.perfil || 'OPERADOR').toUpperCase()
    const senha = normalizar(item.senha)

    if (
      !matricula ||
      !nome ||
      !PERFIS_USUARIO_PERMITIDOS.has(perfil) ||
      (senha && senha.length < 4)
    ) {
      ignorados++
      continue
    }

    const existente = usuariosPorMatricula.get(matricula)

    if (!existente) {
      if (!senha) {
        ignorados++
        continue
      }

      await repository.criar({
        nome,
        matricula,
        perfil,
        senha,
        usuarioId: usuarioId ?? null
      })

      usuariosPorMatricula.set(matricula, {
        id: -1,
        uuid: '',
        nome,
        matricula,
        perfil,
        ativo: true,
        createdAt: null,
        updatedAt: null,
        deletedAt: null,
        createdBy: usuarioId ?? null,
        updatedBy: usuarioId ?? null,
        deletedBy: null,
        createdByNome: null,
        updatedByNome: null,
        deletedByNome: null
      })

      inseridos++
      continue
    }

    const nomeAlterado = normalizarComparacao(existente.nome) !== normalizarComparacao(nome)

    const perfilAlterado = normalizar(existente.perfil).toUpperCase() !== perfil

    const possuiAlteracoes = nomeAlterado || perfilAlterado || Boolean(senha)

    if (!existente.ativo) {
      await repository.ativar(existente.id, usuarioId ?? null)
      existente.ativo = true

      if (possuiAlteracoes) {
        await repository.editar(existente.id, {
          nome,
          matricula,
          perfil,
          senha: senha || undefined,
          usuarioId: usuarioId ?? null
        })

        existente.nome = nome
        existente.perfil = perfil
      }

      atualizados++
      continue
    }

    if (!possuiAlteracoes) {
      ignorados++
      continue
    }

    await repository.editar(existente.id, {
      nome,
      matricula,
      perfil,
      senha: senha || undefined,
      usuarioId: usuarioId ?? null
    })

    existente.nome = nome
    existente.perfil = perfil
    atualizados++
  }

  return {
    inseridos,
    atualizados,
    ignorados
  }
}
