import { ipcMain } from "electron"
import { SetorService } from "../services/SetorService"

const setorService = new SetorService()

export function registerSetorIpc() {
  ipcMain.handle("setores:listar", async () => {
    return await setorService.listar()
  })

  ipcMain.handle("setores:criar", async (_, nome: string, sigla: string) => {
    return await setorService.criar(nome, sigla)
  })

  ipcMain.handle(
    "setores:editar",
    async (_, id: number, nome: string, sigla: string) => {
      return await setorService.editar(id, nome, sigla)
    }
  )

  ipcMain.handle("setores:excluir", async (_, id: number) => {
    return await setorService.excluir(id)
  })

  ipcMain.handle("setores:contar-subsetores-ativos", async (_, id: number) => {
    return await setorService.contarSubsetoresAtivos(id)
  })

  ipcMain.handle("setores:listar-inativos", async () => {
    return await setorService.listarInativos()
  })

  ipcMain.handle("setores:restaurar", async (_, id: number) => {
    return await setorService.restaurar(id)
  })

  ipcMain.handle("setores:excluir-permanente", async (_, id: number) => {
    return await setorService.excluirPermanente(id)
  })
}