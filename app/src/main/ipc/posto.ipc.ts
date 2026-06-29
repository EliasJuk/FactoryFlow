import { ipcMain } from "electron"
import { PostoRepository } from "../repositories/PostoRepository"

const postoRepository = new PostoRepository()

export function registerPostoIpc() {
  ipcMain.handle("postos:listar", () => {
    return postoRepository.listar()
  })

  ipcMain.handle("postos:criar", (_, nome: string, subsetorId: number) => {
    return postoRepository.criar(nome, subsetorId)
  })

  ipcMain.handle(
    "postos:editar",
    (_, id: number, nome: string, subsetorId: number) => {
      return postoRepository.editar(id, nome, subsetorId)
    }
  )

  ipcMain.handle("postos:contar-roteiros-ativos", (_, id: number) => {
    return postoRepository.contarRoteirosAtivos(id)
  })

  ipcMain.handle("postos:excluir", (_, id: number) => {
    return postoRepository.excluir(id)
  })
}