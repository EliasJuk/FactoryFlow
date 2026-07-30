import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import { SubsetorService } from '../services/SubsetorService'

const subsetorService = new SubsetorService()

const PERFIS_GERENCIAMENTO = ['QUALIDADE', 'ADMIN'] as const
const PERFIS_EXCLUSAO_PERMANENTE = ['ADMIN'] as const

function sucesso(mensagem: string) {
  return {
    sucesso: true,
    mensagem
  }
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

  return {
    sucesso: false,
    mensagem: codigo || mensagemPadrao
  }
}

export function registerSubsetorIpc() {
  ipcMain.handle('subsetores:listar', async (event) => {
    requireSession(event)
    return await subsetorService.listar()
  })

  ipcMain.handle('subsetores:listar-inativos', async (event) => {
    requireSession(event)
    return await subsetorService.listarInativos()
  })

  ipcMain.handle('subsetores:criar', async (event, nome: string, setorId: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await subsetorService.criar(nome, setorId, sessao.usuarioId)
      return sucesso('Subsetor cadastrado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao cadastrar subsetor.')
    }
  })

  ipcMain.handle(
    'subsetores:editar',
    async (event, id: number, nome: string, setorId: number) => {
      try {
        const sessao = requireSession(event, {
          perfis: PERFIS_GERENCIAMENTO
        })

        await subsetorService.editar(id, nome, setorId, sessao.usuarioId)
        return sucesso('Subsetor atualizado com sucesso.')
      } catch (error) {
        return falha(error, 'Erro ao editar subsetor.')
      }
    }
  )

  ipcMain.handle('subsetores:contar-postos-ativos', async (event, id: number) => {
    requireSession(event)
    return await subsetorService.contarPostosAtivos(id)
  })

  ipcMain.handle('subsetores:excluir', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await subsetorService.excluir(id, sessao.usuarioId)
      return sucesso('Subsetor inativado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao inativar subsetor.')
    }
  })

  ipcMain.handle('subsetores:restaurar', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await subsetorService.restaurar(id, sessao.usuarioId)
      return sucesso('Subsetor restaurado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao restaurar subsetor.')
    }
  })

  ipcMain.handle('subsetores:excluir-permanente', async (event, id: number) => {
    try {
      requireSession(event, {
        perfis: PERFIS_EXCLUSAO_PERMANENTE
      })

      await subsetorService.excluirPermanente(id)
      return sucesso('Subsetor excluído permanentemente.')
    } catch (error) {
      return falha(error, 'Erro ao excluir permanentemente subsetor.')
    }
  })
}
