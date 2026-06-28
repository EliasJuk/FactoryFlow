import { ipcMain } from "electron"
import {
  RefugoRepository,
  RefugoInput
} from "../repositories/RefugoRepository"

const repository = new RefugoRepository()

export function registerRefugoIpc() {
  ipcMain.handle("refugos:criar", (_, input: RefugoInput) => {
    return repository.criar(input)
  })
}