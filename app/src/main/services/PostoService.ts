import { RepositoryProvider } from "../repositories/RepositoryProvider"

export class PostoService {
  private repository = RepositoryProvider.postos

  async listar() {
    return await this.repository.listar()
  }

  async listarInativos() {
    return await this.repository.listarInativos()
  }

  async criar(nome: string, subsetorId: number) {
    return await this.repository.criar(nome, subsetorId)
  }

  async editar(id: number, nome: string, subsetorId: number) {
    return await this.repository.editar(id, nome, subsetorId)
  }

  async excluir(id: number) {
    return await this.repository.excluir(id)
  }

  async restaurar(id: number) {
    return await this.repository.restaurar(id)
  }

  async excluirPermanente(id: number) {
    return await this.repository.excluirPermanente(id)
  }

  async contarRoteirosAtivos(id: number) {
    return await this.repository.contarRoteirosAtivos(id)
  }
}