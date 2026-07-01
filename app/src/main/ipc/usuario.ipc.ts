import { ipcMain } from "electron"
import { UsuarioInput } from "../repositories/sqlite/UsuarioRepository"
import { UsuarioService } from "../services/UsuarioService"

const service = new UsuarioService()

export function registerUsuarioIpc() {
  ipcMain.handle("usuarios:listar", () => {
    return service.listar()
  })

  ipcMain.handle("usuarios:criar", (_, input: UsuarioInput) => {
    return service.criar(input)
  })

  ipcMain.handle("usuarios:editar", (_, id: number, input: UsuarioInput) => {
    return service.editar(id, input)
  })

  ipcMain.handle("usuarios:excluir", (_, id: number) => {
    return service.excluir(id)
  })

  ipcMain.handle("usuarios:ativar", (_, id: number) => {
    return service.ativar(id)
  })
}