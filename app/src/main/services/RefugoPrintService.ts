import { BrowserWindow } from "electron"
import {
  gerarFichaRefugoHtml,
  RefugoPrintData
} from "../print/RefugoPrintTemplate"

export class RefugoPrintService {
  async imprimir(refugo: RefugoPrintData) {
    const html = gerarFichaRefugoHtml(refugo)

    const printWindow = new BrowserWindow({
      show: true,
      width: 430,
      height: 620,
      autoHideMenuBar: true,
      title: `Ficha ${refugo.numeroRefugo}`,
      webPreferences: {
        sandbox: false
      }
    })

    printWindow.webContents.once("did-finish-load", () => {
      setTimeout(() => {
        printWindow.webContents.print(
          {
            silent: false,
            printBackground: true,
            pageSize: "A6"
          },
          () => {
            if (!printWindow.isDestroyed()) {
              printWindow.close()
            }
          }
        )
      }, 500)
    })

    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    )
  }
}