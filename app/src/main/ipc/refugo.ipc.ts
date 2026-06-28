import { ipcMain } from "electron"
import {
  RefugoRepository,
  CriarRefugoInput
} from "../repositories/RefugoRepository"

const repository = new RefugoRepository()

export function registerRefugoIpc() {
  ipcMain.handle("refugos:criar", (_, input: CriarRefugoInput) => {
    return repository.criar(input)
  })

  ipcMain.handle("refugos:listar", (_, busca: string, limite: number) => {
    return repository.listar(busca, limite)
  })
}