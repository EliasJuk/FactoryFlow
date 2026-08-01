import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import { PostoDefeitoService } from '../services/PostoDefeitoService'

const service = new PostoDefeitoService()

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

  if (codigo === 'SEM_PERMISSAO' || codigo === 'SEM_PERMISSAO_POSTO_DEFEITO') {
    return {
      sucesso: false,
      mensagem: 'Você não possui permissão para realizar esta operação.'
    }
  }

  if (codigo === 'USUARIO_NAO_IDENTIFICADO') {
    return {
      sucesso: false,
      mensagem: 'Não foi possível identificar o usuário autenticado.'
    }
  }

  return {
    sucesso: false,
    mensagem: codigo || mensagemPadrao
  }
}

export function registerPostoDefeitoIpc() {
  ipcMain.handle(
    'posto-defeitos:listar-por-posto',
    async (event, postoId: number, incluirInativos = false) => {
      requireSession(event)

      return await service.listarPorPosto(postoId, incluirInativos)
    }
  )

  ipcMain.handle(
    'posto-defeitos:listar-permitidos-por-posto',
    async (event, postoId: number) => {
      requireSession(event)

      return await service.listarPermitidosPorPosto(postoId)
    }
  )

  ipcMain.handle(
    'posto-defeitos:adicionar',
    async (event, postoId: number, defeitoId: number) => {
      try {
        const sessao = requireSession(event)

        return await service.adicionar(postoId, defeitoId, sessao.usuarioId)
      } catch (error) {
        return falha(error, 'Erro ao vincular o defeito ao posto.')
      }
    }
  )

  ipcMain.handle('posto-defeitos:remover', async (event, id: number) => {
    try {
      const sessao = requireSession(event)

      await service.remover(id, sessao.usuarioId)

      return {
        sucesso: true,
        mensagem: 'Vínculo removido com sucesso.'
      }
    } catch (error) {
      return falha(error, 'Erro ao remover o vínculo.')
    }
  })

  ipcMain.handle('posto-defeitos:restaurar', async (event, id: number) => {
    try {
      const sessao = requireSession(event)

      await service.restaurar(id, sessao.usuarioId)

      return {
        sucesso: true,
        mensagem: 'Vínculo restaurado com sucesso.'
      }
    } catch (error) {
      return falha(error, 'Erro ao restaurar o vínculo.')
    }
  })
}
