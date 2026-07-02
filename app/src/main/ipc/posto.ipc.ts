import { ipcMain } from "electron"
import { RepositoryFactory } from "../repositories/factory/RepositoryFactory"

const postoRepository = RepositoryFactory.postos()

export function registerPostoIpc() {
  ipcMain.handle("postos:listar", async () => {
    return await postoRepository.listar()
  })

  ipcMain.handle(
    "postos:criar",
    async (_, nome: string, subsetorId: number) => {
      return await postoRepository.criar(nome, subsetorId)
    }
  )

  ipcMain.handle(
    "postos:editar",
    async (_, id: number, nome: string, subsetorId: number) => {
      return await postoRepository.editar(id, nome, subsetorId)
    }
  )

  ipcMain.handle(
    "postos:contar-roteiros-ativos",
    async (_, id: number) => {
      return await postoRepository.contarRoteirosAtivos(id)
    }
  )

  ipcMain.handle("postos:excluir", async (_, id: number) => {
    return await postoRepository.excluir(id)
  })
}