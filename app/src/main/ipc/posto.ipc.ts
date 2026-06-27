import { ipcMain } from "electron"
import { PostoRepository } from "../repositories/PostoRepository"

const postoRepository = new PostoRepository()

export function registerPostoIpc() {
  ipcMain.handle("postos:listar", () => {
    return postoRepository.listar()
  })

  ipcMain.handle("postos:criar", (_, nome: string, subsetorId: number) => {
    postoRepository.criar(nome, subsetorId)
  })

  ipcMain.handle(
    "postos:editar",
    (_, id: number, nome: string, subsetorId: number) => {
      postoRepository.editar(id, nome, subsetorId)
    }
  )

  ipcMain.handle("postos:excluir", (_, id: number) => {
    postoRepository.excluir(id)
  })
}