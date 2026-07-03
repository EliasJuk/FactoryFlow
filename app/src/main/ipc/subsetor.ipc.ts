import { ipcMain } from "electron"
import { SubsetorService } from "../services/SubsetorService"

const subsetorService = new SubsetorService()

function sucesso(mensagem: string) {
  return {
    sucesso: true,
    mensagem
  }
}

function falha(error: unknown, mensagemPadrao: string) {
  return {
    sucesso: false,
    mensagem: error instanceof Error ? error.message : mensagemPadrao
  }
}

export function registerSubsetorIpc() {
  ipcMain.handle("subsetores:listar", async () => {
    return await subsetorService.listar()
  })

  ipcMain.handle("subsetores:listar-inativos", async () => {
    return await subsetorService.listarInativos()
  })

  ipcMain.handle("subsetores:criar", async (_, nome: string, setorId: number) => {
    try {
      await subsetorService.criar(nome, setorId)
      return sucesso("Subsetor cadastrado com sucesso.")
    } catch (error) {
      return falha(error, "Erro ao cadastrar subsetor.")
    }
  })

  ipcMain.handle(
    "subsetores:editar",
    async (_, id: number, nome: string, setorId: number) => {
      try {
        await subsetorService.editar(id, nome, setorId)
        return sucesso("Subsetor atualizado com sucesso.")
      } catch (error) {
        return falha(error, "Erro ao editar subsetor.")
      }
    }
  )

  ipcMain.handle("subsetores:contar-postos-ativos", async (_, id: number) => {
    return await subsetorService.contarPostosAtivos(id)
  })

  ipcMain.handle("subsetores:excluir", async (_, id: number) => {
    try {
      await subsetorService.excluir(id)
      return sucesso("Subsetor inativado com sucesso.")
    } catch (error) {
      return falha(error, "Erro ao inativar subsetor.")
    }
  })

  ipcMain.handle("subsetores:restaurar", async (_, id: number) => {
    try {
      await subsetorService.restaurar(id)
      return sucesso("Subsetor restaurado com sucesso.")
    } catch (error) {
      return falha(error, "Erro ao restaurar subsetor.")
    }
  })

  ipcMain.handle("subsetores:excluir-permanente", async (_, id: number) => {
    try {
      await subsetorService.excluirPermanente(id)
      return sucesso("Subsetor excluído permanentemente.")
    } catch (error) {
      return falha(error, "Erro ao excluir permanentemente subsetor.")
    }
  })
}