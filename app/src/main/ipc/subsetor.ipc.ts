import { ipcMain } from "electron"
import { RepositoryFactory } from "../repositories/factory/RepositoryFactory"

const subsetorRepository = RepositoryFactory.subsetores()

export function registerSubsetorIpc() {
  ipcMain.handle("subsetores:listar", async () => {
    return await subsetorRepository.listar()
  })

  ipcMain.handle("subsetores:criar", async (_, nome: string, setorId: number) => {
    return await subsetorRepository.criar(nome, setorId)
  })

  ipcMain.handle(
    "subsetores:editar",
    async (_, id: number, nome: string, setorId: number) => {
      return await subsetorRepository.editar(id, nome, setorId)
    }
  )

  ipcMain.handle("subsetores:contar-postos-ativos", async (_, id: number) => {
    return await subsetorRepository.contarPostosAtivos(id)
  })

  ipcMain.handle("subsetores:excluir", async (_, id: number) => {
    return await subsetorRepository.excluir(id)
  })
}