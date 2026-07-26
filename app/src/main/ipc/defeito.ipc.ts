import { ipcMain } from 'electron'
import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'

const defeitoRepository = RepositoryFactory.defeitos()

function sucesso(mensagem: string) {
  return { sucesso: true, mensagem }
}

function falha(error: unknown, mensagemPadrao: string) {
  let mensagem = error instanceof Error ? error.message : mensagemPadrao

  if (mensagem.includes('DEFEITO_DUPLICADO')) {
    mensagem = 'Já existe um defeito ativo com este código.'
  }

  if (mensagem.includes('DEFEITO_EM_USO')) {
    mensagem =
      'Não é possível excluir permanentemente este defeito, pois ele está vinculado a um ou mais lançamentos de refugo.'
  }

  return { sucesso: false, mensagem }
}

export function registerDefeitoIpc() {
  ipcMain.handle('defeitos:listar', async () => {
    return await defeitoRepository.listar()
  })

  ipcMain.handle('defeitos:listar-inativos', async () => {
    return await defeitoRepository.listarInativos()
  })

  ipcMain.handle(
    'defeitos:criar',
    async (_, codigo: string, descricao: string, usuarioId: number) => {
      try {
        await defeitoRepository.criar(codigo, descricao, usuarioId)
        return sucesso('Defeito cadastrado com sucesso.')
      } catch (error) {
        return falha(error, 'Erro ao cadastrar defeito.')
      }
    }
  )

  ipcMain.handle(
    'defeitos:editar',
    async (_, id: number, codigo: string, descricao: string, usuarioId: number) => {
      try {
        await defeitoRepository.editar(id, codigo, descricao, usuarioId)
        return sucesso('Defeito atualizado com sucesso.')
      } catch (error) {
        return falha(error, 'Erro ao editar defeito.')
      }
    }
  )

  ipcMain.handle('defeitos:excluir', async (_, id: number, usuarioId: number) => {
    try {
      await defeitoRepository.excluir(id, usuarioId)
      return sucesso('Defeito inativado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao inativar defeito.')
    }
  })

  ipcMain.handle('defeitos:restaurar', async (_, id: number, usuarioId: number) => {
    try {
      await defeitoRepository.restaurar(id, usuarioId)
      return sucesso('Defeito restaurado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao restaurar defeito.')
    }
  })

  ipcMain.handle('defeitos:excluir-permanente', async (_, id: number) => {
    try {
      await defeitoRepository.excluirPermanente(id)
      return sucesso('Defeito excluído permanentemente.')
    } catch (error) {
      return falha(error, 'Erro ao excluir permanentemente defeito.')
    }
  })
}
