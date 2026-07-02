import { RepositoryFactory } from "../repositories/factory/RepositoryFactory"
import type { UsuarioInput } from "../repositories/postgres/UsuarioRepository"

export type { UsuarioInput }

export class UsuarioService {
  private repository = RepositoryFactory.usuarios()

  async listar() {
    return await this.repository.listar()
  }

  async criar(input: UsuarioInput) {
    return await this.repository.criar(input)
  }

  async editar(id: number, input: UsuarioInput) {
    return await this.repository.editar(id, input)
  }

  async excluir(id: number) {
    return await this.repository.excluir(id)
  }

  async ativar(id: number) {
    return await this.repository.ativar(id)
  }
}