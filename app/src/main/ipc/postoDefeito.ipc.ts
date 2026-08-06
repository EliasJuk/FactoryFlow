import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import { PostoDefeitoService } from '../services/PostoDefeitoService'

const service = new PostoDefeitoService()

const PERFIS_GERENCIAMENTO = [
  'ADMIN',
  'QUALIDADE',
  'TECNICO',
  'LIDER',
  'SUPERVISOR'
] as const

function validarIdPositivo(valor: unknown): number {
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor <= 0) {
    throw new Error('PARAMETRO_INVALIDO')
  }

  return valor
}

function validarBooleanoOpcional(valor: unknown): boolean {
  if (valor === undefined) {
    return false
  }

  if (typeof valor !== 'boolean') {
    throw new Error('PARAMETRO_INVALIDO')
  }

  return valor
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

  if (codigo === 'PARAMETRO_INVALIDO') {
    return {
      sucesso: false,
      mensagem: 'Os dados informados são inválidos.'
    }
  }

  return {
    sucesso: false,
    mensagem: mensagemPadrao
  }
}

function lancarFalha(error: unknown, mensagemPadrao: string): never {
  const resultado = falha(error, mensagemPadrao)
  throw new Error(resultado.mensagem)
}

export function registerPostoDefeitoIpc() {
  ipcMain.handle(
    'posto-defeitos:listar-por-posto',
    async (event, postoId: unknown, incluirInativos: unknown = false) => {
      try {
        const sessao = requireSession(event, {
          perfis: PERFIS_GERENCIAMENTO
        })

        return await service.listarPorPosto(
          validarIdPositivo(postoId),
          validarBooleanoOpcional(incluirInativos),
          sessao.usuarioId
        )
      } catch (error) {
        lancarFalha(error, 'Não foi possível listar os vínculos do posto.')
      }
    }
  )

  ipcMain.handle(
    'posto-defeitos:listar-permitidos-por-posto',
    async (event, postoId: unknown) => {
      try {
        requireSession(event)

        return await service.listarPermitidosPorPosto(validarIdPositivo(postoId))
      } catch (error) {
        lancarFalha(error, 'Não foi possível listar os defeitos permitidos para o posto.')
      }
    }
  )

  ipcMain.handle(
    'posto-defeitos:adicionar',
    async (event, postoId: unknown, defeitoId: unknown) => {
      try {
        const sessao = requireSession(event, {
          perfis: PERFIS_GERENCIAMENTO
        })

        return await service.adicionar(
          validarIdPositivo(postoId),
          validarIdPositivo(defeitoId),
          sessao.usuarioId
        )
      } catch (error) {
        return falha(error, 'Erro ao vincular o defeito ao posto.')
      }
    }
  )

  ipcMain.handle('posto-defeitos:remover', async (event, id: unknown) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await service.remover(validarIdPositivo(id), sessao.usuarioId)

      return {
        sucesso: true,
        mensagem: 'Vínculo removido com sucesso.'
      }
    } catch (error) {
      return falha(error, 'Erro ao remover o vínculo.')
    }
  })

  ipcMain.handle('posto-defeitos:restaurar', async (event, id: unknown) => {
    try {
      const sessao = requireSession(event, {
        perfis: PERFIS_GERENCIAMENTO
      })

      await service.restaurar(validarIdPositivo(id), sessao.usuarioId)

      return {
        sucesso: true,
        mensagem: 'Vínculo restaurado com sucesso.'
      }
    } catch (error) {
      return falha(error, 'Erro ao restaurar o vínculo.')
    }
  })
}
