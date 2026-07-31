import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'

const defeitoRepository = RepositoryFactory.defeitos()

const PERFIS_GERENCIAMENTO = ['QUALIDADE', 'ADMIN'] as const
const PERFIS_EXCLUSAO_PERMANENTE = ['ADMIN'] as const

function sucesso(mensagem: string) {
  return { sucesso: true, mensagem }
}

function falha(error: unknown, mensagemPadrao: string) {
  const codigo = error instanceof Error ? error.message : ''

  if (codigo === 'SESSAO_NAO_AUTENTICADA') {
    return {
      sucesso: false,
      mensagem: 'Sua sessão não está autenticada. Entre novamente no sistema.'
    }
  }

  if (codigo === 'TROCA_SENHA_OBRIGATORIA') {
    return {
      sucesso: false,
      mensagem: 'Altere sua senha antes de continuar.'
    }
  }

  if (codigo === 'SEM_PERMISSAO') {
    return {
      sucesso: false,
      mensagem: 'Você não possui permissão para realizar esta operação.'
    }
  }

  if (codigo.includes('DEFEITO_DUPLICADO')) {
    return {
      sucesso: false,
      mensagem: 'Já existe um defeito ativo com este código.'
    }
  }

  if (codigo.includes('DEFEITO_EM_USO')) {
    return {
      sucesso: false,
      mensagem:
        'Não é possível excluir permanentemente este defeito, pois ele está vinculado a um ou mais lançamentos de refugo.'
    }
  }

  return {
    sucesso: false,
    mensagem: codigo || mensagemPadrao
  }
}

export function registerDefeitoIpc() {
  ipcMain.handle('defeitos:listar', async (event) => {
    requireSession(event)
    return await defeitoRepository.listar()
  })

  ipcMain.handle('defeitos:listar-inativos', async (event) => {
    requireSession(event)
    return await defeitoRepository.listarInativos()
  })

  ipcMain.handle('defeitos:criar', async (event, codigo: string, descricao: string) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await defeitoRepository.criar(codigo, descricao, sessao.usuarioId)
      return sucesso('Defeito cadastrado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao cadastrar defeito.')
    }
  })

  ipcMain.handle(
    'defeitos:editar',
    async (event, id: number, codigo: string, descricao: string) => {
      try {
        const sessao = requireSession(event, {
          perfis: PERFIS_GERENCIAMENTO
        })

        await defeitoRepository.editar(id, codigo, descricao, sessao.usuarioId)
        return sucesso('Defeito atualizado com sucesso.')
      } catch (error) {
        return falha(error, 'Erro ao editar defeito.')
      }
    }
  )

  ipcMain.handle('defeitos:excluir', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await defeitoRepository.excluir(id, sessao.usuarioId)
      return sucesso('Defeito inativado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao inativar defeito.')
    }
  })

  ipcMain.handle('defeitos:restaurar', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await defeitoRepository.restaurar(id, sessao.usuarioId)
      return sucesso('Defeito restaurado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao restaurar defeito.')
    }
  })

  ipcMain.handle('defeitos:excluir-permanente', async (event, id: number) => {
    try {
      requireSession(event, {
        perfis: PERFIS_EXCLUSAO_PERMANENTE
      })

      await defeitoRepository.excluirPermanente(id)
      return sucesso('Defeito excluído permanentemente.')
    } catch (error) {
      return falha(error, 'Erro ao excluir permanentemente defeito.')
    }
  })
}
