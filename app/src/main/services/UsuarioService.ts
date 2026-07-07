import { RepositoryFactory } from "../repositories/factory/RepositoryFactory"
import type { UsuarioInput } from "../repositories/postgres/UsuarioRepository"

export type { UsuarioInput }

export class UsuarioService {
  private repository = RepositoryFactory.usuarios()

  async listar() {
    return await this.repository.listar()
  }

  async listarInativos() {
    return await this.repository.listarInativos()
  }

  async criar(input: UsuarioInput) {
    return await this.repository.criar(input)
  }

  async editar(id: number, input: UsuarioInput) {
    return await this.repository.editar(id, input)
  }

  async excluir(id: number, usuarioId?: number | null) {
    return await this.repository.excluir(id, usuarioId ?? null)
  }

  async ativar(id: number, usuarioId?: number | null) {
    return await this.repository.ativar(id, usuarioId ?? null)
  }

  async remover(id: number, usuarioId?: number | null) {
    return await this.repository.remover(id, usuarioId ?? null)
  }
}