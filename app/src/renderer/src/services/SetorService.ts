export class SetorService {
  async listar() {
    return window.api.setores.listar()
  }

  async criar(nome: string) {
    return window.api.setores.criar(nome)
  }

  async editar(id: number, nome: string) {
    return window.api.setores.editar(id, nome)
  }

  async excluir(id: number) {
    return window.api.setores.excluir(id)
  }
}