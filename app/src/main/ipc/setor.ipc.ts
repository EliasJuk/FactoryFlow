import { ipcMain } from "electron"
import { SetorService } from "../services/SetorService"

const setorService = new SetorService()

export function registerSetorIpc() {
  ipcMain.handle("setores:listar", async () => {
    return await setorService.listar()
  })

  ipcMain.handle("setores:criar", async (_, nome: string, sigla: string) => {
    try {
      await setorService.criar(nome, sigla)

      return {
        sucesso: true,
        mensagem: "Setor cadastrado com sucesso."
      }
    } catch (error) {
      return {
        sucesso: false,
        mensagem:
          error instanceof Error
            ? error.message
            : "Erro ao cadastrar setor."
      }
    }
  })

  ipcMain.handle(
    "setores:editar",
    async (_, id: number, nome: string, sigla: string) => {
      try {
        await setorService.editar(id, nome, sigla)

        return {
          sucesso: true,
          mensagem: "Setor atualizado com sucesso."
        }
      } catch (error) {
        return {
          sucesso: false,
          mensagem:
            error instanceof Error
              ? error.message
              : "Erro ao editar setor."
        }
      }
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