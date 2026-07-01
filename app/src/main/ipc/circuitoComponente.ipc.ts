import { ipcMain } from "electron"
import { CircuitoComponenteRepository } from "../repositories/sqlite/CircuitoComponenteRepository"

const repository = new CircuitoComponenteRepository()

export function registerCircuitoComponenteIpc() {
  ipcMain.handle("circuito-componentes:listar-por-circuito", (_, circuitoId: number) => {
    return repository.listarPorCircuito(circuitoId)
  })

  ipcMain.handle(
    "circuito-componentes:adicionar",
    (_, circuitoId: number, componenteId: number, quantidade: number) => {
      repository.adicionar(circuitoId, componenteId, quantidade)
    }
  )

  ipcMain.handle("circuito-componentes:remover", (_, id: number) => {
    repository.remover(id)
  })
}