import { ipcMain } from "electron"
import { DefeitoRepository } from "../repositories/DefeitoRepository"

const defeitoRepository = new DefeitoRepository()

export function registerDefeitoIpc() {
  ipcMain.handle("defeitos:listar", () => {
    return defeitoRepository.listar()
  })

  ipcMain.handle("defeitos:criar", (_, codigo: string, descricao: string) => {
    return defeitoRepository.criar(codigo, descricao)
  })

  ipcMain.handle(
    "defeitos:editar",
    (_, id: number, codigo: string, descricao: string) => {
      return defeitoRepository.editar(id, codigo, descricao)
    }
  )

  ipcMain.handle("defeitos:excluir", (_, id: number) => {
    return defeitoRepository.excluir(id)
  })
}