import { ipcMain } from 'electron'
import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'

const repository = RepositoryFactory.circuitoComponentes()

export function registerCircuitoComponenteIpc() {
  ipcMain.handle('circuito-componentes:listar-por-circuito', async (_, circuitoId: number) => {
    return await repository.listarPorCircuito(circuitoId)
  })

  ipcMain.handle(
    'circuito-componentes:adicionar',
    async (_, circuitoId: number, componenteId: number, quantidade: number, usuarioId: number) => {
      return await repository.adicionar(circuitoId, componenteId, quantidade, usuarioId)
    }
  )

  ipcMain.handle(
    'circuito-componentes:editar-quantidade',
    async (_, id: number, quantidade: number, usuarioId: number) => {
      return await repository.editarQuantidade(id, quantidade, usuarioId)
    }
  )

  ipcMain.handle('circuito-componentes:remover', async (_, id: number, usuarioId: number) => {
    return await repository.remover(id, usuarioId)
  })

  ipcMain.handle('circuito-componentes:restaurar', async (_, id: number, usuarioId: number) => {
    return await repository.restaurar(id, usuarioId)
  })
}