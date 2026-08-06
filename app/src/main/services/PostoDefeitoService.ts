import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'

const PERFIS_PERMITIDOS = new Set(['ADMIN', 'QUALIDADE', 'TECNICO', 'LIDER', 'SUPERVISOR'])

export class PostoDefeitoService {
  private repository = RepositoryFactory.postoDefeitos()
  private usuarioRepository = RepositoryFactory.usuarios()

  private async validarPermissao(usuarioId: number): Promise<number> {
    if (!usuarioId) throw new Error('USUARIO_NAO_IDENTIFICADO')

    const usuario = await this.usuarioRepository.buscarPerfilPorId(usuarioId)
    if (!usuario || !usuario.ativo || !PERFIS_PERMITIDOS.has(usuario.perfil)) {
      throw new Error('SEM_PERMISSAO_POSTO_DEFEITO')
    }

    return usuarioId
  }

  async listarPorPosto(
    postoId: number,
    incluirInativos: boolean,
    usuarioId: number
  ) {
    await this.validarPermissao(usuarioId)
    return await this.repository.listarPorPosto(postoId, incluirInativos)
  }

  async listarPermitidosPorPosto(postoId: number) {
    return await this.repository.listarPermitidosPorPosto(postoId)
  }

  async adicionar(postoId: number, defeitoId: number, usuarioId: number) {
    const responsavelId = await this.validarPermissao(usuarioId)
    return await this.repository.adicionar(postoId, defeitoId, responsavelId)
  }

  async remover(id: number, usuarioId: number) {
    const responsavelId = await this.validarPermissao(usuarioId)
    return await this.repository.remover(id, responsavelId)
  }

  async restaurar(id: number, usuarioId: number) {
    const responsavelId = await this.validarPermissao(usuarioId)
    return await this.repository.restaurar(id, responsavelId)
  }
}
