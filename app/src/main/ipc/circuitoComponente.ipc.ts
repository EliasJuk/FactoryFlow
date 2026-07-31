import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'

const repository = RepositoryFactory.circuitoComponentes()

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

  if (codigo.includes('COMPONENTE_JA_VINCULADO')) {
    return {
      sucesso: false,
      mensagem: 'Este componente já está vinculado ao circuito selecionado.'
    }
  }

  return {
    sucesso: false,
    mensagem: codigo || mensagemPadrao
  }
}

export function registerCircuitoComponenteIpc() {
  ipcMain.handle('circuito-componentes:listar-por-circuito', async (event, circuitoId: number) => {
    requireSession(event)
    return await repository.listarPorCircuito(circuitoId)
  })

  ipcMain.handle(
    'circuito-componentes:adicionar',
    async (event, circuitoId: number, componenteId: number, quantidade: number) => {
      try {
        const sessao = requireSession(event, {
          perfis: PERFIS_GERENCIAMENTO
        })

        return await repository.adicionar(circuitoId, componenteId, quantidade, sessao.usuarioId)
      } catch (error) {
        return falha(error, 'Erro ao vincular componente ao circuito.')
      }
    }
  )

  ipcMain.handle(
    'circuito-componentes:editar-quantidade',
    async (event, id: number, quantidade: number) => {
      try {
        const sessao = requireSession(event, {
          perfis: PERFIS_GERENCIAMENTO
        })

        await repository.editarQuantidade(id, quantidade, sessao.usuarioId)
        return sucesso('Quantidade atualizada com sucesso.')
      } catch (error) {
        return falha(error, 'Erro ao atualizar quantidade do componente.')
      }
    }
  )

  ipcMain.handle('circuito-componentes:remover', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await repository.remover(id, sessao.usuarioId)
      return sucesso('Componente removido do circuito com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao remover componente do circuito.')
    }
  })

  ipcMain.handle('circuito-componentes:restaurar', async (event, id: number) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await repository.restaurar(id, sessao.usuarioId)
      return sucesso('Componente restaurado no circuito com sucesso.')
    } catch (error) {
      return falha(error, 'Erro ao restaurar componente no circuito.')
    }
  })
}
