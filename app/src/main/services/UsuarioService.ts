import {
  UsuarioRepository,
  UsuarioInput
} from "../repositories/sqlite/UsuarioRepository"

export class UsuarioService {
  private repository = new UsuarioRepository()

  listar() {
    return this.repository.listar()
  }

  criar(input: UsuarioInput) {
    return this.repository.criar(input)
  }

  editar(id: number, input: UsuarioInput) {
    return this.repository.editar(id, input)
  }

  excluir(id: number) {
    return this.repository.excluir(id)
  }

  ativar(id: number) {
    return this.repository.ativar(id)
  }
}