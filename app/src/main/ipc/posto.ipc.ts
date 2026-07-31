import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import { PostoService } from '../services/PostoService'

const postoService = new PostoService()

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

  if (codigo.includes('POSTO_DUPLICADO')) {
    return {
      sucesso: false,
      mensagem: 'Já existe um posto de trabalho com esse nome dentro do subsetor selecionado.'
    }
  }

  if (codigo.includes('POSTO_COM_VINCULOS')) {
    return {
      sucesso: false,
      mensagem: 'Este posto possui roteiros vinculados e não pode ser inativado.'
    }
  }

  return {
    sucesso: false,
    mensagem: codigo || mensagemPadrao
  }
}

export function registerPostoIpc() {
  ipcMain.handle('postos:listar', async (event) => {
    requireSession(event)
    return await postoService.listar()
  })

  ipcMain.handle('postos:listar-inativos', async (event) => {
    requireSession(event)
    return await postoService.listarInativos()
  })

  ipcMain.handle('postos:criar', async (event, nome: string, subsetorId: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await postoService.criar(nome, subsetorId, sessao.usuarioId)
      return sucesso('Posto cadastrado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao cadastrar posto.')
    }
  })

  ipcMain.handle('postos:editar', async (event, id: number, nome: string, subsetorId: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await postoService.editar(id, nome, subsetorId, sessao.usuarioId)
      return sucesso('Posto atualizado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao editar posto.')
    }
  })

  ipcMain.handle('postos:contar-roteiros-ativos', async (event, id: number) => {
    requireSession(event)
    return await postoService.contarRoteirosAtivos(id)
  })

  ipcMain.handle('postos:excluir', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await postoService.excluir(id, sessao.usuarioId)
      return sucesso('Posto inativado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao inativar posto.')
    }
  })

  ipcMain.handle('postos:restaurar', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await postoService.restaurar(id, sessao.usuarioId)
      return sucesso('Posto restaurado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao restaurar posto.')
    }
  })

  ipcMain.handle('postos:excluir-permanente', async (event, id: number) => {
    try {
      requireSession(event, {
        perfis: PERFIS_EXCLUSAO_PERMANENTE
      })

      await postoService.excluirPermanente(id)
      return sucesso('Posto excluído permanentemente.')
    } catch (error) {
      return falha(error, 'Erro ao excluir permanentemente posto.')
    }
  })
}
