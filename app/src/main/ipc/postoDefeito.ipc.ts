import { ipcMain } from 'electron'
import { PostoDefeitoService } from '../services/PostoDefeitoService'

const service = new PostoDefeitoService()

export function registerPostoDefeitoIpc() {
  ipcMain.handle(
    'posto-defeitos:listar-por-posto',
    async (_, postoId: number, incluirInativos = false) =>
      service.listarPorPosto(postoId, incluirInativos)
  )

  ipcMain.handle('posto-defeitos:listar-permitidos-por-posto', async (_, postoId: number) =>
    service.listarPermitidosPorPosto(postoId)
  )

  ipcMain.handle(
    'posto-defeitos:adicionar',
    async (_, postoId: number, defeitoId: number, usuarioId?: number | null) => {
      return await service.adicionar(postoId, defeitoId, usuarioId)
    }
  )

  ipcMain.handle('posto-defeitos:remover', async (_, id: number, usuarioId?: number | null) =>
    service.remover(id, usuarioId)
  )

  ipcMain.handle('posto-defeitos:restaurar', async (_, id: number, usuarioId?: number | null) =>
    service.restaurar(id, usuarioId)
  )
}
