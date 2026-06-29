import { ipcMain } from "electron"
import { SubsetorRepository } from "../repositories/SubsetorRepository"

const subsetorRepository = new SubsetorRepository()

export function registerSubsetorIpc() {
  ipcMain.handle("subsetores:listar", () => {
    return subsetorRepository.listar()
  })

  ipcMain.handle("subsetores:criar", (_, nome: string, setorId: number) => {
    return subsetorRepository.criar(nome, setorId)
  })

  ipcMain.handle(
    "subsetores:editar",
    (_, id: number, nome: string, setorId: number) => {
      return subsetorRepository.editar(id, nome, setorId)
    }
  )

  ipcMain.handle("subsetores:contar-postos-ativos", (_, id: number) => {
    return subsetorRepository.contarPostosAtivos(id)
  })

  ipcMain.handle("subsetores:excluir", (_, id: number) => {
    return subsetorRepository.excluir(id)
  })
}