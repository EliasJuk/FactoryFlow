import { ipcMain } from "electron"

import { CriarRefugoInput } from "../repositories/RefugoRepository"
import { RefugoService } from "../services/RefugoService"

const service = new RefugoService()

export function registerRefugoIpc() {
  ipcMain.handle("refugos:criar", (_, input: CriarRefugoInput) => {
    return service.criar(input)
  })

  ipcMain.handle(
    "refugos:listar",
    (_, busca: string, pagina: number, limite: number) => {
      return service.listar(busca, pagina, limite)
    }
  )

  ipcMain.handle(
    "refugos:editar-completo",
    (
      _,
      id: number,
      matricula: string,
      turno: string,
      quantidadeProduzida: number,
      observacao: string | undefined,
      itens: { id: number; defeitoId: number; quantidade: number }[]
    ) => {
      return service.editarCompleto(
        id,
        matricula,
        turno,
        quantidadeProduzida,
        observacao,
        itens
      )
    }
  )

  ipcMain.handle("refugos:cancelar", (_, id: number, motivo: string) => {
    return service.cancelar(id, motivo)
  })

  ipcMain.handle("refugos:imprimir", (_, id: number) => {
    return service.imprimir(id)
  })

  ipcMain.handle("refugos:resultados", (_, filtros) => {
    return service.resultados(filtros)
  })
}