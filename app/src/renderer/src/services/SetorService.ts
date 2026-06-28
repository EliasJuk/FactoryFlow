export class SetorService {
  criar(nome: string, sigla: string) {
    return window.api.setores.criar(nome, sigla)
  }

  editar(id: number, nome: string, sigla: string) {
    return window.api.setores.editar(id, nome, sigla)
  }

  listar() {
    return window.api.setores.listar()
  }

  remover(id: number) {
    return window.api.setores.excluir(id)
  }
}