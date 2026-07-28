import { ipcMain } from 'electron'
import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'

const circuitoRepository = RepositoryFactory.circuitos()

function sucesso(mensagem: string) {
  return { sucesso: true, mensagem }
}

function falha(error: unknown, mensagemPadrao: string) {
  let mensagem = error instanceof Error ? error.message : mensagemPadrao

  if (mensagem.includes('CIRCUITO_DUPLICADO')) {
    mensagem = 'Já existe um circuito ativo com este código.'
  }

  if (mensagem.includes('CIRCUITO_COM_COMPONENTES') || mensagem.includes('CIRCUITO_EM_USO')) {
    mensagem =
      'Não é possível excluir permanentemente este circuito, pois ele possui componentes, roteiros ou lançamentos de refugo vinculados.'
  }

  return { sucesso: false, mensagem }
}

export function registerCircuitoIpc() {
  ipcMain.handle('circuitos:listar', async () => {
    return await circuitoRepository.listar()
  })

  ipcMain.handle('circuitos:listar-inativos', async () => {
    return await circuitoRepository.listarInativos()
  })

  ipcMain.handle(
    'circuitos:criar',
    async (_, codigo: string, nome: string, usuarioId: number) => {
      try {
        await circuitoRepository.criar(codigo, nome, usuarioId)
        return sucesso('Circuito cadastrado com sucesso.')
      } catch (error) {
        return falha(error, 'Erro ao cadastrar circuito.')
      }
    }
  )

  ipcMain.handle(
    'circuitos:editar',
    async (_, id: number, codigo: string, nome: string, usuarioId: number) => {
      try {
        await circuitoRepository.editar(id, codigo, nome, usuarioId)
        return sucesso('Circuito atualizado com sucesso.')
      } catch (error) {
        return falha(error, 'Erro ao editar circuito.')
      }
    }
  )

  ipcMain.handle('circuitos:excluir', async (_, id: number, usuarioId: number) => {
    try {
      await circuitoRepository.excluir(id, usuarioId)
      return sucesso('Circuito inativado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao inativar circuito.')
    }
  })

  ipcMain.handle('circuitos:restaurar', async (_, id: number, usuarioId: number) => {
    try {
      await circuitoRepository.restaurar(id, usuarioId)
      return sucesso('Circuito restaurado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao restaurar circuito.')
    }
  })

  ipcMain.handle('circuitos:excluir-permanente', async (_, id: number) => {
    try {
      await circuitoRepository.excluirPermanente(id)
      return sucesso('Circuito excluído permanentemente.')
    } catch (error) {
      return falha(error, 'Erro ao excluir permanentemente circuito.')
    }
  })
}
