import { ipcMain } from "electron"
import { RepositoryFactory } from "../repositories/factory/RepositoryFactory"

const repository = RepositoryFactory.roteiros()

export function registerRoteiroIpc() {
  ipcMain.handle(
    "roteiro:listar-circuitos-por-posto",
    async (_, postoId: number, busca: string) => {
      return await repository.listarCircuitosPorPosto(postoId, busca)
    }
  )

  ipcMain.handle(
    "roteiro:listar-por-circuito-e-posto",
    async (_, circuitoId: number, postoId: number) => {
      return await repository.listarPorCircuitoEPosto(circuitoId, postoId)
    }
  )

  ipcMain.handle(
    "roteiro:adicionar",
    async (
      _,
      circuitoId: number,
      postoId: number,
      componenteId: number,
      quantidade: number,
      usuarioId: number
    ) => {
      return await repository.adicionar(
        circuitoId,
        postoId,
        componenteId,
        quantidade,
        usuarioId
      )
    }
  )

  ipcMain.handle(
    "roteiro:editar-quantidade",
    async (_, id: number, quantidade: number, usuarioId: number) => {
      return await repository.editarQuantidade(id, quantidade, usuarioId)
    }
  )

  ipcMain.handle("roteiro:remover", async (_, id: number, usuarioId: number) => {
    return await repository.remover(id, usuarioId)
  })

  ipcMain.handle("roteiro:listar-todos", async () => {
    return await repository.listarTodos()
  })
}