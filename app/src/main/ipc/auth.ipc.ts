import { ipcMain } from "electron"
import { AuthService } from "../services/AuthService"

const service = new AuthService()

export function registerAuthIpc() {
  ipcMain.handle(
    "auth:login",
    async (_, matricula: string, senha: string) => {
      return await service.login(matricula, senha)
    }
  )
}