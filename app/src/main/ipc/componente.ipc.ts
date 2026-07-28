import { ipcMain } from "electron"
import { RepositoryFactory } from "../repositories/factory/RepositoryFactory"

const componenteRepository = RepositoryFactory.componentes()

function sucesso(mensagem: string) {
  return { sucesso: true, mensagem }
}

function falha(error: unknown, mensagemPadrao: string) {
  let mensagem = error instanceof Error ? error.message : mensagemPadrao

  if (mensagem.includes("COMPONENTE_DUPLICADO")) {
    mensagem = "Já existe um componente ativo com este código."
  }

  if (mensagem.includes("COMPONENTE_EM_USO")) {
    mensagem =
      "Não é possível excluir permanentemente este componente, pois ele está vinculado a um ou mais circuitos."
  }

  return { sucesso: false, mensagem }
}

export function registerComponenteIpc() {
  ipcMain.handle("componentes:listar", async () => {
    return await componenteRepository.listar()
  })

  ipcMain.handle("componentes:listar-inativos", async () => {
    return await componenteRepository.listarInativos()
  })

  ipcMain.handle(
    "componentes:criar",
    async (
      _,
      codigo: string,
      nome: string,
      precoAtual: number,
      usuarioId: number
    ) => {
      try {
        await componenteRepository.criar(codigo, nome, precoAtual, usuarioId)
        return sucesso("Componente cadastrado com sucesso.")
      } catch (error) {
        return falha(error, "Erro ao cadastrar componente.")
      }
    }
  )

  ipcMain.handle(
    "componentes:editar",
    async (
      _,
      id: number,
      codigo: string,
      nome: string,
      precoAtual: number,
      usuarioId: number
    ) => {
      try {
        await componenteRepository.editar(id, codigo, nome, precoAtual, usuarioId)
        return sucesso("Componente atualizado com sucesso.")
      } catch (error) {
        return falha(error, "Erro ao editar componente.")
      }
    }
  )

  ipcMain.handle("componentes:excluir", async (_, id: number, usuarioId: number) => {
    try {
      await componenteRepository.excluir(id, usuarioId)
      return sucesso("Componente inativado com sucesso.")
    } catch (error) {
      return falha(error, "Erro ao inativar componente.")
    }
  })

  ipcMain.handle("componentes:restaurar", async (_, id: number, usuarioId: number) => {
    try {
      await componenteRepository.restaurar(id, usuarioId)
      return sucesso("Componente restaurado com sucesso.")
    } catch (error) {
      return falha(error, "Erro ao restaurar componente.")
    }
  })

  ipcMain.handle("componentes:excluir-permanente", async (_, id: number) => {
    try {
      await componenteRepository.excluirPermanente(id)
      return sucesso("Componente excluído permanentemente.")
    } catch (error) {
      return falha(error, "Erro ao excluir permanentemente componente.")
    }
  })
}