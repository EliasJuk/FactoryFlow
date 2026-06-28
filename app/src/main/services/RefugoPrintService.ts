import { BrowserWindow } from "electron"
import {
  gerarFichaRefugoHtml,
  RefugoPrintData
} from "../print/RefugoPrintTemplate"

export class RefugoPrintService {
  async imprimir(refugo: RefugoPrintData) {
    console.log("[PRINT] Iniciando impressão:", refugo.numeroRefugo)

    const html = gerarFichaRefugoHtml(refugo)

    const printWindow = new BrowserWindow({
      show: true,
      width: 420,
      height: 600,
      autoHideMenuBar: true,
      webPreferences: {
        sandbox: false
      }
    })

    printWindow.webContents.once("did-finish-load", () => {
      console.log("[PRINT] HTML carregado:", refugo.numeroRefugo)

      printWindow.webContents.print(
        {
          silent: false,
          printBackground: true,
          pageSize: "A6"
        },
        (success, errorType) => {
          console.log("[PRINT] Resultado:", { success, errorType })

          if (success) {
            printWindow.close()
          }
        }
      )
    })

    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    )
  }
}