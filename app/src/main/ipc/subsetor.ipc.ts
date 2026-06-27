import { ipcMain } from "electron"
import { SubsetorRepository } from "../repositories/SubsetorRepository"

const subsetorRepository = new SubsetorRepository()

export function registerSubsetorIpc() {
  ipcMain.handle("subsetores:listar", () => {
    return subsetorRepository.listar()
  })

  ipcMain.handle("subsetores:criar", (_, nome: string, setorId: number) => {
    subsetorRepository.criar(nome, setorId)
  })

  ipcMain.handle(
    "subsetores:editar",
    (_, id: number, nome: string, setorId: number) => {
      subsetorRepository.editar(id, nome, setorId)
    }
  )

  ipcMain.handle("subsetores:excluir", (_, id: number) => {
    subsetorRepository.excluir(id)
  })
}