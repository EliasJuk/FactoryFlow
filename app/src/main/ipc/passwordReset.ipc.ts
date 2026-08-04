import { ipcMain } from 'electron'

import { mainSessionService } from '../auth/MainSessionService'
import { requireSession } from '../auth/requireSession'
import { PasswordResetService } from '../services/PasswordResetService'

const service = new PasswordResetService()
const PERFIS_GESTAO_SENHAS = ['ADMIN', 'QUALIDADE'] as const

export function registerPasswordResetIpc(): void {
  ipcMain.handle('auth:solicitar-redefinicao', async (_, matricula: unknown) => {
    try {
      return await service.solicitar(matricula)
    } catch (error) {
      console.error('[AUTH] Falha ao solicitar redefinição de senha:', error)

      return {
        sucesso: false,
        mensagem:
          'Não foi possível registrar a solicitação agora. Tente novamente mais tarde.'
      }
    }
  })

  ipcMain.handle(
    'auth:alterar-senha-obrigatoria',
    async (event, senhaAtual: string, novaSenha: string) => {
      const sessao = requireSession(event, {
        permitirTrocaSenhaPendente: true
      })

      const resultado = await service.alterarSenhaObrigatoria(
        sessao.usuarioId,
        senhaAtual,
        novaSenha
      )

      if (resultado.sucesso) {
        mainSessionService.concluirTrocaSenha(event.sender.id)
      }

      return resultado
    }
  )

  ipcMain.handle('usuarios:listar-solicitacoes-senha', async (event) => {
    const sessao = requireSession(event, { perfis: PERFIS_GESTAO_SENHAS })
    return await service.listarPendentes(sessao.usuarioId)
  })

  ipcMain.handle('usuarios:atender-solicitacao-senha', async (event, solicitacaoId: number) => {
    const sessao = requireSession(event, {
      perfis: PERFIS_GESTAO_SENHAS
    })

    return await service.atender(solicitacaoId, sessao.usuarioId)
  })

  ipcMain.handle('usuarios:cancelar-solicitacao-senha', async (event, solicitacaoId: number) => {
    const sessao = requireSession(event, {
      perfis: PERFIS_GESTAO_SENHAS
    })

    return await service.cancelar(solicitacaoId, sessao.usuarioId)
  })
}
