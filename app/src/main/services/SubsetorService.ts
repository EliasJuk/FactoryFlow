import { RepositoryProvider } from "../repositories/RepositoryProvider"

export class SubsetorService {
  private repository = RepositoryProvider.subsetores

  async listar() {
    return await this.repository.listar()
  }

  async listarInativos() {
    return await this.repository.listarInativos()
  }

  async criar(nome: string, setorId: number) {
    return await this.repository.criar(nome, setorId)
  }

  async editar(id: number, nome: string, setorId: number) {
    return await this.repository.editar(id, nome, setorId)
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

  async contarPostosAtivos(id: number) {
    return await this.repository.contarPostosAtivos(id)
  }
}