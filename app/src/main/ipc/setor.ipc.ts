import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import { SetorService } from '../services/SetorService'

const setorService = new SetorService()

const PERFIS_GERENCIAMENTO = ['QUALIDADE', 'ADMIN'] as const
const PERFIS_EXCLUSAO_PERMANENTE = ['ADMIN'] as const

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

  return {
    sucesso: false,
    mensagem: codigo || mensagemPadrao
  }
}

export function registerSetorIpc() {
  ipcMain.handle('setores:listar', async (event) => {
    requireSession(event)
    return await setorService.listar()
  })

  ipcMain.handle('setores:criar', async (event, nome: string, sigla: string) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await setorService.criar(nome, sigla, sessao.usuarioId)

      return {
        sucesso: true,
        mensagem: 'Setor cadastrado com sucesso.'
      }
    } catch (error) {
      return falha(error, 'Erro ao cadastrar setor.')
    }
  })

  ipcMain.handle('setores:editar', async (event, id: number, nome: string, sigla: string) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await setorService.editar(id, nome, sigla, sessao.usuarioId)

      return {
        sucesso: true,
        mensagem: 'Setor atualizado com sucesso.'
      }
    } catch (error) {
      return falha(error, 'Erro ao editar setor.')
    }
  })

  ipcMain.handle('setores:excluir', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await setorService.excluir(id, sessao.usuarioId)

      return {
        sucesso: true,
        mensagem: 'Setor inativado com sucesso.'
      }
    } catch (error) {
      return falha(error, 'Erro ao inativar setor.')
    }
  })

  ipcMain.handle('setores:contar-subsetores-ativos', async (event, id: number) => {
    requireSession(event)
    return await setorService.contarSubsetoresAtivos(id)
  })

  ipcMain.handle('setores:listar-inativos', async (event) => {
    requireSession(event)
    return await setorService.listarInativos()
  })

  ipcMain.handle('setores:restaurar', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await setorService.restaurar(id, sessao.usuarioId)

      return {
        sucesso: true,
        mensagem: 'Setor restaurado com sucesso.'
      }
    } catch (error) {
      return falha(error, 'Erro ao restaurar setor.')
    }
  })

  ipcMain.handle('setores:excluir-permanente', async (event, id: number) => {
    try {
      requireSession(event, {
        perfis: PERFIS_EXCLUSAO_PERMANENTE
      })

      await setorService.excluirPermanente(id)

      return {
        sucesso: true,
        mensagem: 'Setor excluído permanentemente.'
      }
    } catch (error) {
      return falha(error, 'Erro ao excluir setor permanentemente.')
    }
  })
}
