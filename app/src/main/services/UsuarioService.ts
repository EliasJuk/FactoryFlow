import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'
import type { UsuarioInput as RepositoryUsuarioInput } from '../repositories/postgres/UsuarioRepository'

export type UsuarioInput = Omit<RepositoryUsuarioInput, 'usuarioId'>

type PerfilUsuario =
  | 'OPERADOR'
  | 'TECNICO'
  | 'LIDER'
  | 'SUPERVISOR'
  | 'QUALIDADE'
  | 'ADMIN'

type Responsavel = {
  usuarioId: number
  perfil: PerfilUsuario
}

type UsuarioAlvo = {
  perfil: string
  ativo: boolean
}

const PERFIS_VALIDOS = new Set<PerfilUsuario>([
  'OPERADOR',
  'TECNICO',
  'LIDER',
  'SUPERVISOR',
  'QUALIDADE',
  'ADMIN'
])

const PERFIS_GESTAO = new Set<PerfilUsuario>(['ADMIN', 'QUALIDADE'])

function normalizarPerfil(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim().toUpperCase() : ''
}

function idValido(valor: number): boolean {
  return Number.isInteger(valor) && valor > 0
}

export class UsuarioService {
  private repository = RepositoryFactory.usuarios()

  private async obterResponsavel(usuarioId: number): Promise<Responsavel> {
    if (!idValido(usuarioId)) {
      throw new Error('USUARIO_RESPONSAVEL_INVALIDO')
    }

    const usuario = await this.repository.buscarPerfilPorId(usuarioId)
    const perfil = normalizarPerfil(usuario?.perfil) as PerfilUsuario

    if (!usuario || !usuario.ativo || !PERFIS_GESTAO.has(perfil)) {
      throw new Error('SEM_PERMISSAO')
    }

    return {
      usuarioId,
      perfil
    }
  }

  private async obterUsuarioAlvo(id: number): Promise<UsuarioAlvo> {
    if (!idValido(id)) {
      throw new Error('USUARIO_NAO_ENCONTRADO')
    }

    const usuario = await this.repository.buscarPerfilPorId(id)

    if (!usuario) {
      throw new Error('USUARIO_NAO_ENCONTRADO')
    }

    return {
      perfil: normalizarPerfil(usuario.perfil),
      ativo: usuario.ativo
    }
  }

  private normalizarInput(input: UsuarioInput): UsuarioInput {
    if (!input || typeof input !== 'object') {
      throw new Error('DADOS_USUARIO_INVALIDOS')
    }

    const dados = input as unknown as Record<string, unknown>
    const nome = typeof dados.nome === 'string' ? dados.nome.trim() : ''
    const matricula = typeof dados.matricula === 'string' ? dados.matricula.trim() : ''
    const perfil = normalizarPerfil(dados.perfil) as PerfilUsuario

    if (!nome || !matricula) {
      throw new Error('DADOS_USUARIO_INVALIDOS')
    }

    if (!PERFIS_VALIDOS.has(perfil)) {
      throw new Error('PERFIL_USUARIO_INVALIDO')
    }

    let senha: string | undefined

    if (dados.senha !== undefined) {
      if (typeof dados.senha !== 'string') {
        throw new Error('DADOS_USUARIO_INVALIDOS')
      }

      senha = dados.senha.trim() || undefined
    }

    return {
      nome,
      matricula,
      perfil,
      senha
    }
  }

  private garantirQualidadeNaoGerenciaAdmin(
    responsavel: Responsavel,
    perfilAtual?: string,
    novoPerfil?: string
  ): void {
    if (
      responsavel.perfil === 'QUALIDADE' &&
      (perfilAtual === 'ADMIN' || novoPerfil === 'ADMIN')
    ) {
      throw new Error('QUALIDADE_NAO_GERENCIA_ADMIN')
    }
  }

  private async garantirQueNaoEhUltimoAdmin(usuario: UsuarioAlvo): Promise<void> {
    if (usuario.perfil !== 'ADMIN' || !usuario.ativo) {
      return
    }

    const usuariosAtivos = await this.repository.listar()
    const totalAdminsAtivos = usuariosAtivos.filter(
      (item) => normalizarPerfil(item.perfil) === 'ADMIN'
    ).length

    if (totalAdminsAtivos <= 1) {
      throw new Error('ULTIMO_ADMIN')
    }
  }

  async listar(usuarioId: number) {
    const responsavel = await this.obterResponsavel(usuarioId)
    const usuarios = await this.repository.listar()

    if (responsavel.perfil === 'QUALIDADE') {
      return usuarios.filter((usuario) => normalizarPerfil(usuario.perfil) !== 'ADMIN')
    }

    return usuarios
  }

  async listarInativos(usuarioId: number) {
    const responsavel = await this.obterResponsavel(usuarioId)
    const usuarios = await this.repository.listarInativos()

    if (responsavel.perfil === 'QUALIDADE') {
      return usuarios.filter((usuario) => normalizarPerfil(usuario.perfil) !== 'ADMIN')
    }

    return usuarios
  }

  async criar(input: UsuarioInput, usuarioId: number) {
    const responsavel = await this.obterResponsavel(usuarioId)
    const dados = this.normalizarInput(input)

    this.garantirQualidadeNaoGerenciaAdmin(responsavel, undefined, dados.perfil)

    return await this.repository.criar({
      ...dados,
      usuarioId: responsavel.usuarioId
    })
  }

  async editar(id: number, input: UsuarioInput, usuarioId: number) {
    const responsavel = await this.obterResponsavel(usuarioId)
    const usuarioAlvo = await this.obterUsuarioAlvo(id)
    const dados = this.normalizarInput(input)

    this.garantirQualidadeNaoGerenciaAdmin(
      responsavel,
      usuarioAlvo.perfil,
      dados.perfil
    )

    if (id === responsavel.usuarioId && dados.perfil !== responsavel.perfil) {
      throw new Error('NAO_PODE_ALTERAR_PROPRIO_PERFIL')
    }

    if (usuarioAlvo.perfil === 'ADMIN' && dados.perfil !== 'ADMIN') {
      await this.garantirQueNaoEhUltimoAdmin(usuarioAlvo)
    }

    return await this.repository.editar(id, {
      ...dados,
      usuarioId: responsavel.usuarioId
    })
  }

  async excluir(id: number, usuarioId: number) {
    const responsavel = await this.obterResponsavel(usuarioId)
    const usuarioAlvo = await this.obterUsuarioAlvo(id)

    if (id === responsavel.usuarioId) {
      throw new Error('NAO_PODE_INATIVAR_PROPRIA_CONTA')
    }

    this.garantirQualidadeNaoGerenciaAdmin(responsavel, usuarioAlvo.perfil)
    await this.garantirQueNaoEhUltimoAdmin(usuarioAlvo)

    return await this.repository.excluir(id, responsavel.usuarioId)
  }

  async ativar(id: number, usuarioId: number) {
    const responsavel = await this.obterResponsavel(usuarioId)
    const usuarioAlvo = await this.obterUsuarioAlvo(id)

    this.garantirQualidadeNaoGerenciaAdmin(responsavel, usuarioAlvo.perfil)

    return await this.repository.ativar(id, responsavel.usuarioId)
  }

  async remover(id: number, usuarioId: number) {
    const responsavel = await this.obterResponsavel(usuarioId)
    const usuarioAlvo = await this.obterUsuarioAlvo(id)

    if (id === responsavel.usuarioId) {
      throw new Error('NAO_PODE_REMOVER_PROPRIA_CONTA')
    }

    this.garantirQualidadeNaoGerenciaAdmin(responsavel, usuarioAlvo.perfil)
    await this.garantirQueNaoEhUltimoAdmin(usuarioAlvo)

    return await this.repository.remover(id, responsavel.usuarioId)
  }
}
