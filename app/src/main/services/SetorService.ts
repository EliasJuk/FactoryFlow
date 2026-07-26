import { RepositoryProvider } from '../repositories/RepositoryProvider'

export class SetorService {
  private repository = RepositoryProvider.setores

  async listar() {
    return await this.repository.listar()
  }

  async criar(nome: string, sigla: string, usuarioId: number) {
    return await this.repository.criar(nome, sigla, usuarioId)
  }

  async editar(id: number, nome: string, sigla: string, usuarioId: number) {
    return await this.repository.editar(id, nome, sigla, usuarioId)
  }

  async excluir(id: number, usuarioId: number) {
    return await this.repository.excluir(id, usuarioId)
  }

  async contarSubsetoresAtivos(id: number) {
    return await this.repository.contarSubsetoresAtivos(id)
  }

  async listarInativos() {
    return await this.repository.listarInativos()
  }

  async restaurar(id: number, usuarioId: number) {
    return await this.repository.restaurar(id, usuarioId)
  }

  async excluirPermanente(id: number) {
    return await this.repository.excluirPermanente(id)
  }
}
