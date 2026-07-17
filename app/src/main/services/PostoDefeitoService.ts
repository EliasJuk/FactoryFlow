import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'

const PERFIS_PERMITIDOS = new Set(['ADMIN', 'QUALIDADE', 'TECNICO', 'LIDER', 'SUPERVISOR'])

export class PostoDefeitoService {
  private repository = RepositoryFactory.postoDefeitos()
  private usuarioRepository = RepositoryFactory.usuarios()

  private async validarPermissao(usuarioId?: number | null) {
    if (!usuarioId) throw new Error('USUARIO_NAO_IDENTIFICADO')

    const usuario = await this.usuarioRepository.buscarPerfilPorId(usuarioId)
    if (!usuario || !usuario.ativo || !PERFIS_PERMITIDOS.has(usuario.perfil)) {
      throw new Error('SEM_PERMISSAO_POSTO_DEFEITO')
    }
  }

  async listarPorPosto(postoId: number, incluirInativos = false) {
    return await this.repository.listarPorPosto(postoId, incluirInativos)
  }

  async listarPermitidosPorPosto(postoId: number) {
    return await this.repository.listarPermitidosPorPosto(postoId)
  }

  async adicionar(postoId: number, defeitoId: number, usuarioId?: number | null) {
    await this.validarPermissao(usuarioId)
    return await this.repository.adicionar(postoId, defeitoId, usuarioId ?? undefined)
  }

  async remover(id: number, usuarioId?: number | null) {
    await this.validarPermissao(usuarioId)
    return await this.repository.remover(id, usuarioId ?? undefined)
  }

  async restaurar(id: number, usuarioId?: number | null) {
    await this.validarPermissao(usuarioId)
    return await this.repository.restaurar(id, usuarioId ?? undefined)
  }
}
