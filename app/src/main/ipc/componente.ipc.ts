import { ipcMain } from "electron"
import { ComponenteRepository } from "../repositories/ComponenteRepository"

const componenteRepository = new ComponenteRepository()

export function registerComponenteIpc() {
  ipcMain.handle("componentes:listar", () => {
    return componenteRepository.listar()
  })

  ipcMain.handle(
    "componentes:criar",
    (_, codigo: string, nome: string, precoAtual: number) => {
      return componenteRepository.criar(codigo, nome, precoAtual)
    }
  )

  ipcMain.handle(
    "componentes:editar",
    (_, id: number, codigo: string, nome: string, precoAtual: number) => {
      return componenteRepository.editar(id, codigo, nome, precoAtual)
    }
  )

  ipcMain.handle("componentes:excluir", (_, id: number) => {
    return componenteRepository.excluir(id)
  })
}