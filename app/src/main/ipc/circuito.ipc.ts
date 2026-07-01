import { ipcMain } from "electron"
import { CircuitoRepository } from "../repositories/sqlite/CircuitoRepository"

const circuitoRepository = new CircuitoRepository()

export function registerCircuitoIpc() {
  ipcMain.handle("circuitos:listar", () => {
    return circuitoRepository.listar()
  })

  ipcMain.handle("circuitos:criar", (_, codigo: string, nome: string) => {
    circuitoRepository.criar(codigo, nome)
  })

  ipcMain.handle(
    "circuitos:editar",
    (_, id: number, codigo: string, nome: string) => {
      circuitoRepository.editar(id, codigo, nome)
    }
  )

  ipcMain.handle("circuitos:excluir", (_, id: number) => {
    circuitoRepository.excluir(id)
  })
}