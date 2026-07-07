import { ipcMain } from "electron"
import { UsuarioInput } from "../services/UsuarioService"
import { UsuarioService } from "../services/UsuarioService"

const service = new UsuarioService()

function sucesso(mensagem: string) {
  return { sucesso: true, mensagem }
}

function falha(error: unknown, mensagemPadrao: string) {
  let mensagem = error instanceof Error ? error.message : mensagemPadrao

  if (mensagem.includes("USUARIO_DUPLICADO")) {
    mensagem = "Já existe um usuário com esta matrícula."
  }

  return { sucesso: false, mensagem }
}

export function registerUsuarioIpc() {
  ipcMain.handle("usuarios:listar", async () => {
    return await service.listar()
  })

  ipcMain.handle("usuarios:listar-inativos", async () => {
    return await service.listarInativos()
  })

  ipcMain.handle("usuarios:criar", async (_, input: UsuarioInput) => {
    try {
      await service.criar(input)
      return sucesso("Usuário cadastrado com sucesso.")
    } catch (error) {
      return falha(error, "Erro ao cadastrar usuário.")
    }
  })

  ipcMain.handle("usuarios:editar", async (_, id: number, input: UsuarioInput) => {
    try {
      await service.editar(id, input)
      return sucesso("Usuário atualizado com sucesso.")
    } catch (error) {
      return falha(error, "Erro ao editar usuário.")
    }
  })

  ipcMain.handle("usuarios:excluir", async (_, id: number, usuarioId?: number | null) => {
    try {
      await service.excluir(id, usuarioId)
      return sucesso("Usuário inativado com sucesso.")
    } catch (error) {
      return falha(error, "Erro ao inativar usuário.")
    }
  })

  ipcMain.handle("usuarios:ativar", async (_, id: number, usuarioId?: number | null) => {
    try {
      await service.ativar(id, usuarioId)
      return sucesso("Usuário restaurado com sucesso.")
    } catch (error) {
      return falha(error, "Erro ao restaurar usuário.")
    }
  })

  ipcMain.handle("usuarios:remover", async (_, id: number, usuarioId?: number | null) => {
    try {
      await service.remover(id, usuarioId)
      return sucesso("Usuário removido com sucesso.")
    } catch (error) {
      return falha(error, "Erro ao remover usuário.")
    }
  })
}