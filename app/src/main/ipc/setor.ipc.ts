import { ipcMain } from "electron"
import { SetorRepository } from "../repositories/SetorRepository"

const setorRepository = new SetorRepository()

export function registerSetorIpc() {
  ipcMain.handle("setores:listar", () => {
    return setorRepository.listar()
  })

  ipcMain.handle("setores:criar", (_, nome: string, sigla: string) => {
    return setorRepository.criar(nome, sigla)
  })

  ipcMain.handle("setores:editar", (_, id: number, nome: string, sigla: string) => {
    return setorRepository.editar(id, nome, sigla)
  })

  ipcMain.handle("setores:excluir", (_, id: number) => {
    return setorRepository.excluir(id)
  })

  ipcMain.handle("setores:contar-subsetores-ativos", (_, id: number) => {
    return setorRepository.contarSubsetoresAtivos(id)
  })
}