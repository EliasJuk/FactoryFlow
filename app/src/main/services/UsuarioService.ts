import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'
import type { UsuarioInput as RepositoryUsuarioInput } from '../repositories/postgres/UsuarioRepository'

export type UsuarioInput = Omit<RepositoryUsuarioInput, 'usuarioId'>

export class UsuarioService {
  private repository = RepositoryFactory.usuarios()

  async listar() {
    return await this.repository.listar()
  }

  async listarInativos() {
    return await this.repository.listarInativos()
  }

  async criar(input: UsuarioInput, usuarioId: number) {
    return await this.repository.criar({
      ...input,
      usuarioId
    })
  }

  async editar(id: number, input: UsuarioInput, usuarioId: number) {
    return await this.repository.editar(id, {
      ...input,
      usuarioId
    })
  }

  async excluir(id: number, usuarioId: number) {
    return await this.repository.excluir(id, usuarioId)
  }

  async ativar(id: number, usuarioId: number) {
    return await this.repository.ativar(id, usuarioId)
  }

  async remover(id: number, usuarioId: number) {
    return await this.repository.remover(id, usuarioId)
  }
}
