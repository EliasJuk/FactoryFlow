import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'

const circuitoRepository = RepositoryFactory.circuitos()

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

  if (codigo.includes('CIRCUITO_DUPLICADO')) {
    return {
      sucesso: false,
      mensagem: 'Já existe um circuito ativo com este código.'
    }
  }

  if (codigo.includes('CIRCUITO_COM_COMPONENTES') || codigo.includes('CIRCUITO_EM_USO')) {
    return {
      sucesso: false,
      mensagem:
        'Não é possível excluir permanentemente este circuito, pois ele possui componentes, roteiros ou lançamentos de refugo vinculados.'
    }
  }

  return {
    sucesso: false,
    mensagem: codigo || mensagemPadrao
  }
}

export function registerCircuitoIpc() {
  ipcMain.handle('circuitos:listar', async (event) => {
    requireSession(event)
    return await circuitoRepository.listar()
  })

  ipcMain.handle('circuitos:listar-inativos', async (event) => {
    requireSession(event)
    return await circuitoRepository.listarInativos()
  })

  ipcMain.handle('circuitos:criar', async (event, codigo: string, nome: string) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await circuitoRepository.criar(codigo, nome, sessao.usuarioId)
      return sucesso('Circuito cadastrado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao cadastrar circuito.')
    }
  })

  ipcMain.handle('circuitos:editar', async (event, id: number, codigo: string, nome: string) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await circuitoRepository.editar(id, codigo, nome, sessao.usuarioId)
      return sucesso('Circuito atualizado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao editar circuito.')
    }
  })

  ipcMain.handle('circuitos:excluir', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await circuitoRepository.excluir(id, sessao.usuarioId)
      return sucesso('Circuito inativado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao inativar circuito.')
    }
  })

  ipcMain.handle('circuitos:restaurar', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await circuitoRepository.restaurar(id, sessao.usuarioId)
      return sucesso('Circuito restaurado com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao restaurar circuito.')
    }
  })

  ipcMain.handle('circuitos:excluir-permanente', async (event, id: number) => {
    try {
      requireSession(event, {
        perfis: PERFIS_EXCLUSAO_PERMANENTE
      })

      await circuitoRepository.excluirPermanente(id)
      return sucesso('Circuito excluído permanentemente.')
    } catch (error) {
      return falha(error, 'Erro ao excluir permanentemente circuito.')
    }
  })
}
