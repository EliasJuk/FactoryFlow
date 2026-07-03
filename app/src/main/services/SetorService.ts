import { RepositoryProvider } from "../repositories/RepositoryProvider"

export class SetorService {
  private repository = RepositoryProvider.setores

  async listar() {
    return await this.repository.listar()
  }

  async criar(nome: string, sigla: string) {
    return await this.repository.criar(nome, sigla)
  }

  async editar(id: number, nome: string, sigla: string) {
    return await this.repository.editar(id, nome, sigla)
  }

  async excluir(id: number) {
    return await this.repository.excluir(id)
  }

  async contarSubsetoresAtivos(id: number) {
    return await this.repository.contarSubsetoresAtivos(id)
  }

  async listarInativos() {
    return await this.repository.listarInativos()
  }

  async restaurar(id: number) {
    return await this.repository.restaurar(id)
  }

  async excluirPermanente(id: number) {
    return await this.repository.excluirPermanente(id)
  }
}