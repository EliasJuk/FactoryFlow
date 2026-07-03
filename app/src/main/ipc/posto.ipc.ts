import { ipcMain } from "electron"
import { PostoService } from "../services/PostoService"

const postoService = new PostoService()

function sucesso(mensagem: string) {
  return { sucesso: true, mensagem }
}

function falha(error: unknown, mensagemPadrao: string) {
  let mensagem = error instanceof Error ? error.message : mensagemPadrao

  if (mensagem.includes("POSTO_DUPLICADO")) {
    mensagem =
      "Já existe um posto de trabalho com esse nome dentro do subsetor selecionado."
  }

  if (mensagem.includes("POSTO_COM_VINCULOS")) {
    mensagem = "Este posto possui roteiros vinculados e não pode ser inativado."
  }

  return { sucesso: false, mensagem }
}

export function registerPostoIpc() {
  ipcMain.handle("postos:listar", async () => {
    return await postoService.listar()
  })

  ipcMain.handle("postos:listar-inativos", async () => {
    return await postoService.listarInativos()
  })

  ipcMain.handle("postos:criar", async (_, nome: string, subsetorId: number) => {
    try {
      await postoService.criar(nome, subsetorId)
      return sucesso("Posto cadastrado com sucesso.")
    } catch (error) {
      return falha(error, "Erro ao cadastrar posto.")
    }
  })

  ipcMain.handle(
    "postos:editar",
    async (_, id: number, nome: string, subsetorId: number) => {
      try {
        await postoService.editar(id, nome, subsetorId)
        return sucesso("Posto atualizado com sucesso.")
      } catch (error) {
        return falha(error, "Erro ao editar posto.")
      }
    }
  )

  ipcMain.handle("postos:contar-roteiros-ativos", async (_, id: number) => {
    return await postoService.contarRoteirosAtivos(id)
  })

  ipcMain.handle("postos:excluir", async (_, id: number) => {
    try {
      await postoService.excluir(id)
      return sucesso("Posto inativado com sucesso.")
    } catch (error) {
      return falha(error, "Erro ao inativar posto.")
    }
  })

  ipcMain.handle("postos:restaurar", async (_, id: number) => {
    try {
      await postoService.restaurar(id)
      return sucesso("Posto restaurado com sucesso.")
    } catch (error) {
      return falha(error, "Erro ao restaurar posto.")
    }
  })

  ipcMain.handle("postos:excluir-permanente", async (_, id: number) => {
    try {
      await postoService.excluirPermanente(id)
      return sucesso("Posto excluído permanentemente.")
    } catch (error) {
      return falha(error, "Erro ao excluir permanentemente posto.")
    }
  })
}