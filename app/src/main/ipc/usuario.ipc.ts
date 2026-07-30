import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import { type UsuarioInput, UsuarioService } from '../services/UsuarioService'

const service = new UsuarioService()
const PERFIS_GESTAO_USUARIOS = ['ADMIN', 'QUALIDADE'] as const

function sucesso(mensagem: string) {
  return { sucesso: true, mensagem }
}

function falha(error: unknown, mensagemPadrao: string) {
  let mensagem = error instanceof Error ? error.message : mensagemPadrao

  if (mensagem.includes('USUARIO_DUPLICADO')) {
    mensagem = 'Já existe um usuário com esta matrícula.'
  }

  if (mensagem.includes('SESSAO_NAO_AUTENTICADA')) {
    mensagem = 'Sua sessão não está autenticada.'
  }

  if (mensagem.includes('TROCA_SENHA_OBRIGATORIA')) {
    mensagem = 'Troque sua senha antes de acessar esta função.'
  }

  if (mensagem.includes('SEM_PERMISSAO')) {
    mensagem = 'Você não possui permissão para gerenciar usuários.'
  }

  return { sucesso: false, mensagem }
}

export function registerUsuarioIpc(): void {
  ipcMain.handle('usuarios:listar', async (event) => {
    requireSession(event, { perfis: PERFIS_GESTAO_USUARIOS })
    return await service.listar()
  })

  ipcMain.handle('usuarios:listar-inativos', async (event) => {
    requireSession(event, { perfis: PERFIS_GESTAO_USUARIOS })
    return await service.listarInativos()
  })

  ipcMain.handle('usuarios:criar', async (event, input: UsuarioInput) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GESTAO_USUARIOS
      })

      await service.criar(input, sessao.usuarioId)
      return sucesso('Usuário cadastrado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao cadastrar usuário.')
    }
  })

  ipcMain.handle('usuarios:editar', async (event, id: number, input: UsuarioInput) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GESTAO_USUARIOS
      })

      await service.editar(id, input, sessao.usuarioId)
      return sucesso('Usuário atualizado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao editar usuário.')
    }
  })

  ipcMain.handle('usuarios:excluir', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GESTAO_USUARIOS
      })

      await service.excluir(id, sessao.usuarioId)
      return sucesso('Usuário inativado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao inativar usuário.')
    }
  })

  ipcMain.handle('usuarios:ativar', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GESTAO_USUARIOS
      })

      await service.ativar(id, sessao.usuarioId)
      return sucesso('Usuário restaurado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao restaurar usuário.')
    }
  })

  ipcMain.handle('usuarios:remover', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GESTAO_USUARIOS
      })

      await service.remover(id, sessao.usuarioId)
      return sucesso('Usuário removido com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao remover usuário.')
    }
  })
}
