import { ipcMain } from "electron"
import { SetorRepository } from "../repositories/SetorRepository"

const setorRepository = new SetorRepository()

export function registerSetorIpc() {
  ipcMain.handle("setores:listar", () => {
    return setorRepository.listar()
  })

  ipcMain.handle("setores:criar", (_, nome: string) => {
    setorRepository.criar(nome)
  })

  ipcMain.handle("setores:editar", (_, id: number, nome: string) => {
    setorRepository.editar(id, nome)
  })

  ipcMain.handle("setores:excluir", (_, id: number) => {
    setorRepository.excluir(id)
  })
}