import { ipcMain } from "electron"
import { ImportacaoService } from "../services/ImportacaoService"

const service = new ImportacaoService()

export function registerImportacaoIpc() {
  ipcMain.handle("importacao:baixar-modelo", (_, tipo: string) => {
    return service.baixarModelo(tipo as any)
  })

  ipcMain.handle("importacao:importar", (_, tipo: string) => {
    return service.importar(tipo as any)
  })
}