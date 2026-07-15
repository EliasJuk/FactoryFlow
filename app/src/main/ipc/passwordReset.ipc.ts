import { ipcMain } from 'electron'
import { PasswordResetService } from '../services/PasswordResetService'

const service = new PasswordResetService()

export function registerPasswordResetIpc() {
  ipcMain.handle('auth:solicitar-redefinicao', async (_, matricula: string) => {
    return await service.solicitar(matricula)
  })

  ipcMain.handle(
    'auth:alterar-senha-obrigatoria',
    async (_, usuarioId: number, senhaAtual: string, novaSenha: string) => {
      return await service.alterarSenhaObrigatoria(usuarioId, senhaAtual, novaSenha)
    }
  )

  ipcMain.handle('usuarios:listar-solicitacoes-senha', async () => {
    return await service.listarPendentes()
  })

  ipcMain.handle(
    'usuarios:atender-solicitacao-senha',
    async (_, solicitacaoId: number, atendenteId: number) => {
      return await service.atender(solicitacaoId, atendenteId)
    }
  )

  ipcMain.handle(
    'usuarios:cancelar-solicitacao-senha',
    async (_, solicitacaoId: number, responsavelId: number) => {
      return await service.cancelar(solicitacaoId, responsavelId)
    }
  )
}
