import { ipcMain } from "electron"
import { ComponenteRepository } from "../repositories/ComponenteRepository"

const componenteRepository = new ComponenteRepository()

export function registerComponenteIpc() {
  ipcMain.handle("componentes:listar", () => {
    return componenteRepository.listar()
  })

  ipcMain.handle("componentes:criar", (_, codigo: string, nome: string) => {
    componenteRepository.criar(codigo, nome)
  })

  ipcMain.handle(
    "componentes:editar",
    (_, id: number, codigo: string, nome: string) => {
      componenteRepository.editar(id, codigo, nome)
    }
  )

  ipcMain.handle("componentes:excluir", (_, id: number) => {
    componenteRepository.excluir(id)
  })
}