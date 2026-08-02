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

  if (mensagem.includes('DADOS_USUARIO_INVALIDOS')) {
    mensagem = 'Informe um nome, uma matrícula e dados válidos para o usuário.'
  }

  if (mensagem.includes('PERFIL_USUARIO_INVALIDO')) {
    mensagem = 'Selecione um perfil de usuário válido.'
  }

  if (mensagem.includes('USUARIO_NAO_ENCONTRADO')) {
    mensagem = 'O usuário informado não foi encontrado.'
  }

  if (mensagem.includes('QUALIDADE_NAO_GERENCIA_ADMIN')) {
    mensagem = 'Somente um administrador pode criar ou alterar contas de administrador.'
  }

  if (mensagem.includes('NAO_PODE_ALTERAR_PROPRIO_PERFIL')) {
    mensagem = 'Você não pode alterar o perfil da sua própria conta.'
  }

  if (mensagem.includes('NAO_PODE_INATIVAR_PROPRIA_CONTA')) {
    mensagem = 'Você não pode inativar a sua própria conta.'
  }

  if (mensagem.includes('NAO_PODE_REMOVER_PROPRIA_CONTA')) {
    mensagem = 'Você não pode remover a sua própria conta.'
  }

  if (mensagem.includes('ULTIMO_ADMIN')) {
    mensagem = 'O último administrador ativo não pode ser inativado, removido ou rebaixado.'
  }

  if (mensagem.includes('USUARIO_RESPONSAVEL_INVALIDO')) {
    mensagem = 'Não foi possível identificar o usuário responsável pela operação.'
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
    const sessao = requireSession(event, { perfis: PERFIS_GESTAO_USUARIOS })
    return await service.listar(sessao.usuarioId)
  })

  ipcMain.handle('usuarios:listar-inativos', async (event) => {
    const sessao = requireSession(event, { perfis: PERFIS_GESTAO_USUARIOS })
    return await service.listarInativos(sessao.usuarioId)
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
