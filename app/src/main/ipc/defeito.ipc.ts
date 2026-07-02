import { ipcMain } from "electron"
import { RepositoryFactory } from "../repositories/factory/RepositoryFactory"

const defeitoRepository = RepositoryFactory.defeitos()

export function registerDefeitoIpc() {
  ipcMain.handle("defeitos:listar", async () => {
    return await defeitoRepository.listar()
  })

  ipcMain.handle(
    "defeitos:criar",
    async (_, codigo: string, descricao: string) => {
      return await defeitoRepository.criar(codigo, descricao)
    }
  )

  ipcMain.handle(
    "defeitos:editar",
    async (_, id: number, codigo: string, descricao: string) => {
      return await defeitoRepository.editar(id, codigo, descricao)
    }
  )

  ipcMain.handle("defeitos:excluir", async (_, id: number) => {
    return await defeitoRepository.excluir(id)
  })
}