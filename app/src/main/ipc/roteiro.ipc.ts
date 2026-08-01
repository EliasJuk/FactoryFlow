import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'

const repository = RepositoryFactory.roteiros()

const PERFIS_GERENCIAMENTO = ['QUALIDADE', 'ADMIN'] as const

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

  if (codigo.includes('QUANTIDADE_INVALIDA')) {
    return {
      sucesso: false,
      mensagem: 'Informe uma quantidade inteira maior que zero.'
    }
  }

  return {
    sucesso: false,
    mensagem: codigo || mensagemPadrao
  }
}

export function registerRoteiroIpc() {
  ipcMain.handle(
    'roteiro:listar-circuitos-por-posto',
    async (event, postoId: number, busca: string) => {
      requireSession(event)
      return await repository.listarCircuitosPorPosto(postoId, busca)
    }
  )

  ipcMain.handle(
    'roteiro:listar-por-circuito-e-posto',
    async (event, circuitoId: number, postoId: number) => {
      requireSession(event)
      return await repository.listarPorCircuitoEPosto(circuitoId, postoId)
    }
  )

  ipcMain.handle(
    'roteiro:adicionar',
    async (
      event,
      circuitoId: number,
      postoId: number,
      componenteId: number,
      quantidade: number
    ) => {
      try {
        const sessao = requireSession(event, {
          perfis: PERFIS_GERENCIAMENTO
        })

        await repository.adicionar(
          circuitoId,
          postoId,
          componenteId,
          quantidade,
          sessao.usuarioId
        )

        return sucesso('Componente adicionado ao roteiro com sucesso.')
      } catch (error) {
        return falha(error, 'Erro ao adicionar componente ao roteiro.')
      }
    }
  )

  ipcMain.handle(
    'roteiro:editar-quantidade',
    async (event, id: number, quantidade: number) => {
      try {
        const sessao = requireSession(event, {
          perfis: PERFIS_GERENCIAMENTO
        })

        await repository.editarQuantidade(id, quantidade, sessao.usuarioId)
        return sucesso('Quantidade atualizada com sucesso.')
      } catch (error) {
        return falha(error, 'Erro ao atualizar a quantidade.')
      }
    }
  )

  ipcMain.handle('roteiro:remover', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await repository.remover(id, sessao.usuarioId)
      return sucesso('Componente removido do roteiro com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao remover componente do roteiro.')
    }
  })

  ipcMain.handle('roteiro:listar-todos', async (event) => {
    requireSession(event)
    return await repository.listarTodos()
  })
}
