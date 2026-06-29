import { ipcMain } from "electron"
import { RoteiroRepository } from "../repositories/RoteiroRepository"

const repository = new RoteiroRepository()

export function registerRoteiroIpc() {
  ipcMain.handle(
    "roteiro:listar-circuitos-por-posto",
    (_, postoId: number, busca: string) => {
      return repository.listarCircuitosPorPosto(postoId, busca)
    }
  )

  ipcMain.handle(
    "roteiro:listar-por-circuito-e-posto",
    (_, circuitoId: number, postoId: number) => {
      return repository.listarPorCircuitoEPosto(circuitoId, postoId)
    }
  )

  ipcMain.handle(
    "roteiro:adicionar",
    (_, circuitoId: number, postoId: number, componenteId: number, quantidade: number) => {
      return repository.adicionar(circuitoId, postoId, componenteId, quantidade)
    }
  )

  ipcMain.handle("roteiro:editar-quantidade", (_, id: number, quantidade: number) => {
    return repository.editarQuantidade(id, quantidade)
  })

  ipcMain.handle("roteiro:remover", (_, id: number) => {
    return repository.remover(id)
  })

  ipcMain.handle("roteiro:listar-todos", () => {
    return repository.listarTodos()
  })
}