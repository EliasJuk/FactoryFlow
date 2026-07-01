import { dialog } from "electron"
import { writeFileSync } from "fs"
import { ipcMain } from "electron"

import { ExportacaoRepository } from "../repositories/sqlite/ExportacaoRepository"

const exportacaoRepository = new ExportacaoRepository()

export function registerExportacaoIpc() {
  ipcMain.handle(
    "exportacao:refugos-csv",
    async (_, filtros: { dataInicio: string; dataFim: string }) => {
      const resultado = await dialog.showSaveDialog({
        title: "Salvar exportação de refugos",
        defaultPath: `exportacao-refugos-${filtros.dataInicio}-${filtros.dataFim}.csv`,
        filters: [{ name: "CSV", extensions: ["csv"] }]
      })

      if (resultado.canceled || !resultado.filePath) {
        return {
          sucesso: false,
          mensagem: "Exportação cancelada."
        }
      }

      const csv = exportacaoRepository.gerarCsvRefugos(filtros)

      writeFileSync(resultado.filePath, csv, "utf8")

      return {
        sucesso: true,
        mensagem: "Arquivo CSV exportado com sucesso."
      }
    }
  )
}