import { ipcMain } from "electron"
import { RepositoryFactory } from "../repositories/factory/RepositoryFactory"

const componenteRepository = RepositoryFactory.componentes()

export function registerComponenteIpc() {
  ipcMain.handle("componentes:listar", async () => {
    return await componenteRepository.listar()
  })

  ipcMain.handle(
    "componentes:criar",
    async (_, codigo: string, nome: string, precoAtual: number) => {
      return await componenteRepository.criar(
        codigo,
        nome,
        precoAtual
      )
    }
  )

  ipcMain.handle(
    "componentes:editar",
    async (
      _,
      id: number,
      codigo: string,
      nome: string,
      precoAtual: number
    ) => {
      return await componenteRepository.editar(
        id,
        codigo,
        nome,
        precoAtual
      )
    }
  )

  ipcMain.handle("componentes:excluir", async (_, id: number) => {
    return await componenteRepository.excluir(id)
  })
}