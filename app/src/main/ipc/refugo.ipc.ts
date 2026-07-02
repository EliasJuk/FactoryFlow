import { ipcMain } from "electron"

import type { CriarRefugoInput } from "../repositories/postgres/RefugoRepository"
import { RefugoService } from "../services/RefugoService"

const service = new RefugoService()

export function registerRefugoIpc() {
  ipcMain.handle("refugos:criar", async (_, input: CriarRefugoInput) => {
    return await service.criar(input)
  })

  ipcMain.handle(
    "refugos:listar",
    async (_, busca: string, pagina: number, limite: number) => {
      return await service.listar(busca, pagina, limite)
    }
  )

  ipcMain.handle(
    "refugos:editar-completo",
    async (
      _,
      id: number,
      matricula: string,
      turno: string,
      quantidadeProduzida: number,
      observacao: string | undefined,
      itens: { id: number; defeitoId: number; quantidade: number }[]
    ) => {
      return await service.editarCompleto(
        id,
        matricula,
        turno,
        quantidadeProduzida,
        observacao,
        itens
      )
    }
  )

  ipcMain.handle(
    "refugos:cancelar",
    async (_, id: number, motivo: string) => {
      return await service.cancelar(id, motivo)
    }
  )

  ipcMain.handle("refugos:imprimir", async (_, id: number) => {
    return await service.imprimir(id)
  })

  ipcMain.handle("refugos:resultados", async (_, filtros) => {
    return await service.resultados(filtros)
  })
}