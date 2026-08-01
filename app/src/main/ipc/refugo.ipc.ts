import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import type { CriarRefugoInput } from '../repositories/postgres/RefugoRepository'
import type { ResultadoFiltros } from '../repositories/postgres/ResultadoRepository'
import { RefugoService } from '../services/RefugoService'

type CriarRefugoIpcInput = Omit<CriarRefugoInput, 'usuarioId'>

const PERFIS_QUE_PODEM_ALTERAR_DATA_HORA = [
  'TECNICO',
  'LIDER',
  'SUPERVISOR',
  'QUALIDADE',
  'ADMIN'
] as const

const service = new RefugoService()

export function registerRefugoIpc() {
  ipcMain.handle('refugos:criar', async (event, input: CriarRefugoIpcInput) => {
    const sessao = requireSession(event)

    if (input.dataHora) {
      requireSession(event, {
        perfis: PERFIS_QUE_PODEM_ALTERAR_DATA_HORA
      })
    }

    return await service.criar({
      ...input,
      usuarioId: sessao.usuarioId
    })
  })

  ipcMain.handle(
    'refugos:listar',
    async (event, busca = '', pagina = 1, limite = 10) => {
      requireSession(event)

      return await service.listar(busca, pagina, limite)
    }
  )

  ipcMain.handle(
    'refugos:editar-completo',
    async (
      event,
      id: number,
      matricula: string,
      turno: string,
      quantidadeProduzida: number,
      observacao: string | undefined,
      itens: { id: number; defeitoId: number; quantidade: number }[]
    ) => {
      const sessao = requireSession(event)

      return await service.editarCompleto(
        id,
        matricula,
        turno,
        quantidadeProduzida,
        observacao,
        itens,
        sessao.usuarioId
      )
    }
  )

  ipcMain.handle('refugos:cancelar', async (event, id: number, motivo: string) => {
    const sessao = requireSession(event)

    return await service.cancelar(id, motivo, sessao.usuarioId)
  })

  ipcMain.handle('refugos:imprimir', async (event, id: number) => {
    requireSession(event)

    return await service.imprimir(id)
  })

  ipcMain.handle('refugos:resultados', async (event, filtros: ResultadoFiltros) => {
    requireSession(event)

    return await service.resultados(filtros)
  })
}
