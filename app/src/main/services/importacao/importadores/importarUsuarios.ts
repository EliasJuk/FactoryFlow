import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import { normalizar } from '../importacao.csv'
import type { RegistroCsv } from '../importacao.types'

const PERFIS_USUARIO_PERMITIDOS = new Set([
  'OPERADOR',
  'TECNICO',
  'LIDER',
  'SUPERVISOR',
  'QUALIDADE',
  'ADMIN'
])

function normalizarComparacao(valor: unknown) {
  return normalizar(valor).toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ')
}

function normalizarPerfil(valor: unknown) {
  return normalizar(valor).toUpperCase()
}

export async function importarUsuarios(registros: RegistroCsv[], usuarioId?: number | null) {
  if (!Number.isInteger(usuarioId) || Number(usuarioId) <= 0) {
    throw new Error('Usuário autenticado é obrigatório para importar usuários.')
  }

  const responsavelId = Number(usuarioId)
  const repository = RepositoryFactory.usuarios()

  const [ativos, inativos, responsavel] = await Promise.all([
    repository.listar(),
    repository.listarInativos(),
    repository.buscarPerfilPorId(responsavelId)
  ])

  const perfilResponsavel = normalizarPerfil(responsavel?.perfil)

  if (
    !responsavel ||
    !responsavel.ativo ||
    (perfilResponsavel !== 'ADMIN' && perfilResponsavel !== 'QUALIDADE')
  ) {
    throw new Error('Usuário autenticado não possui permissão para importar usuários.')
  }

  const todosUsuarios = [...ativos, ...inativos]
  const usuariosPorMatricula = new Map(
    todosUsuarios.map((usuario) => [normalizar(usuario.matricula), usuario])
  )

  const ocorrenciasPorMatricula = new Map<string, number>()

  for (const registro of registros) {
    const matricula = normalizar(registro.matricula)

    if (matricula) {
      ocorrenciasPorMatricula.set(matricula, (ocorrenciasPorMatricula.get(matricula) ?? 0) + 1)
    }
  }

  const estadoFinal = new Map(
    todosUsuarios.map((usuario) => [
      usuario.id,
      {
        ativo: usuario.ativo,
        perfil: normalizarPerfil(usuario.perfil)
      }
    ])
  )

  let proximoIdVirtual = -1

  for (const item of registros) {
    const matricula = normalizar(item.matricula)
    const nome = normalizar(item.nome)
    const perfil = normalizarPerfil(item.perfil || 'OPERADOR')
    const senha = normalizar(item.senha)

    if (
      !matricula ||
      !nome ||
      !PERFIS_USUARIO_PERMITIDOS.has(perfil) ||
      (senha && senha.length < 8) ||
      (ocorrenciasPorMatricula.get(matricula) ?? 0) > 1
    ) {
      continue
    }

    const existente = usuariosPorMatricula.get(matricula)

    if (!existente && !senha) {
      continue
    }

    const perfilExistente = normalizarPerfil(existente?.perfil)

    if (
      perfilResponsavel === 'QUALIDADE' &&
      (perfil === 'ADMIN' || perfilExistente === 'ADMIN')
    ) {
      throw new Error('A Qualidade não pode importar ou alterar contas de administrador.')
    }

    if (existente?.id === responsavelId && perfil !== perfilExistente) {
      throw new Error('Você não pode alterar o perfil da sua própria conta pela importação.')
    }

    if (existente) {
      estadoFinal.set(existente.id, {
        ativo: true,
        perfil
      })
    } else {
      estadoFinal.set(proximoIdVirtual--, {
        ativo: true,
        perfil
      })
    }
  }

  const totalAdminsAtivosAposImportacao = [...estadoFinal.values()].filter(
    (usuario) => usuario.ativo && usuario.perfil === 'ADMIN'
  ).length

  if (totalAdminsAtivosAposImportacao < 1) {
    throw new Error('A importação não pode remover o último administrador ativo.')
  }

  let inseridos = 0
  let atualizados = 0
  let ignorados = 0

  for (const item of registros) {
    const matricula = normalizar(item.matricula)
    const nome = normalizar(item.nome)
    const perfil = normalizarPerfil(item.perfil || 'OPERADOR')
    const senha = normalizar(item.senha)

    if (
      !matricula ||
      !nome ||
      !PERFIS_USUARIO_PERMITIDOS.has(perfil) ||
      (senha && senha.length < 8) ||
      (ocorrenciasPorMatricula.get(matricula) ?? 0) > 1
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
        usuarioId: responsavelId
      })

      usuariosPorMatricula.set(matricula, {
        id: proximoIdVirtual--,
        uuid: '',
        nome,
        matricula,
        perfil,
        ativo: true,
        createdAt: null,
        updatedAt: null,
        deletedAt: null,
        createdBy: responsavelId,
        updatedBy: responsavelId,
        deletedBy: null,
        createdByNome: null,
        updatedByNome: null,
        deletedByNome: null
      })

      inseridos++
      continue
    }

    const nomeAlterado = normalizarComparacao(existente.nome) !== normalizarComparacao(nome)
    const perfilAlterado = normalizarPerfil(existente.perfil) !== perfil
    const possuiAlteracoes = nomeAlterado || perfilAlterado || Boolean(senha)

    if (!existente.ativo) {
      await repository.ativar(existente.id, responsavelId)
      existente.ativo = true

      if (possuiAlteracoes) {
        await repository.editar(existente.id, {
          nome,
          matricula,
          perfil,
          senha: senha || undefined,
          usuarioId: responsavelId
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
      usuarioId: responsavelId
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
