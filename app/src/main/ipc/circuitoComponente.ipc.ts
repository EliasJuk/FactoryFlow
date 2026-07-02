import { ipcMain } from "electron"
import { RepositoryFactory } from "../repositories/factory/RepositoryFactory"

const repository = RepositoryFactory.circuitoComponentes()

export function registerCircuitoComponenteIpc() {
  ipcMain.handle(
    "circuito-componentes:listar-por-circuito",
    async (_, circuitoId: number) => {
      return await repository.listarPorCircuito(circuitoId)
    }
  )

  ipcMain.handle(
    "circuito-componentes:adicionar",
    async (
      _,
      circuitoId: number,
      componenteId: number,
      quantidade: number
    ) => {
      return await repository.adicionar(
        circuitoId,
        componenteId,
        quantidade
      )
    }
  )

  ipcMain.handle(
    "circuito-componentes:remover",
    async (_, id: number) => {
      return await repository.remover(id)
    }
  )
}