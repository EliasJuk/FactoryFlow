import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'

const componenteRepository = RepositoryFactory.componentes()

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

  if (codigo.includes('COMPONENTE_DUPLICADO')) {
    return {
      sucesso: false,
      mensagem: 'Já existe um componente ativo com este código.'
    }
  }

  if (codigo.includes('COMPONENTE_EM_USO')) {
    return {
      sucesso: false,
      mensagem:
        'Não é possível excluir permanentemente este componente, pois ele está vinculado a um ou mais circuitos.'
    }
  }

  return {
    sucesso: false,
    mensagem: codigo || mensagemPadrao
  }
}

export function registerComponenteIpc() {
  ipcMain.handle('componentes:listar', async (event) => {
    requireSession(event)
    return await componenteRepository.listar()
  })

  ipcMain.handle('componentes:listar-inativos', async (event) => {
    requireSession(event)
    return await componenteRepository.listarInativos()
  })

  ipcMain.handle(
    'componentes:criar',
    async (event, codigo: string, nome: string, precoAtual: number) => {
      try {
        const sessao = requireSession(event, {
          perfis: PERFIS_GERENCIAMENTO
        })

        await componenteRepository.criar(codigo, nome, precoAtual, sessao.usuarioId)
        return sucesso('Componente cadastrado com sucesso.')
      } catch (error) {
        return falha(error, 'Erro ao cadastrar componente.')
      }
    }
  )

  ipcMain.handle(
    'componentes:editar',
    async (event, id: number, codigo: string, nome: string, precoAtual: number) => {
      try {
        const sessao = requireSession(event, {
          perfis: PERFIS_GERENCIAMENTO
        })

        await componenteRepository.editar(id, codigo, nome, precoAtual, sessao.usuarioId)
        return sucesso('Componente atualizado com sucesso.')
      } catch (error) {
        return falha(error, 'Erro ao editar componente.')
      }
    }
  )

  ipcMain.handle('componentes:excluir', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await componenteRepository.excluir(id, sessao.usuarioId)
      return sucesso('Componente inativado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao inativar componente.')
    }
  })

  ipcMain.handle('componentes:restaurar', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await componenteRepository.restaurar(id, sessao.usuarioId)
      return sucesso('Componente restaurado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao restaurar componente.')
    }
  })

  ipcMain.handle('componentes:excluir-permanente', async (event, id: number) => {
    try {
      requireSession(event, {
        perfis: PERFIS_EXCLUSAO_PERMANENTE
      })

      await componenteRepository.excluirPermanente(id)
      return sucesso('Componente excluído permanentemente.')
    } catch (error) {
      return falha(error, 'Erro ao excluir permanentemente componente.')
    }
  })
}
