import { ipcMain } from "electron"
import { RepositoryFactory } from "../repositories/factory/RepositoryFactory"

const circuitoRepository = RepositoryFactory.circuitos()

export function registerCircuitoIpc() {
  ipcMain.handle("circuitos:listar", async () => {
    return await circuitoRepository.listar()
  })

  ipcMain.handle(
    "circuitos:criar",
    async (_, codigo: string, nome: string) => {
      return await circuitoRepository.criar(codigo, nome)
    }
  )

  ipcMain.handle(
    "circuitos:editar",
    async (_, id: number, codigo: string, nome: string) => {
      return await circuitoRepository.editar(id, codigo, nome)
    }
  )

  ipcMain.handle("circuitos:excluir", async (_, id: number) => {
    return await circuitoRepository.excluir(id)
  })
}