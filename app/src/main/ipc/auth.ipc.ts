import { ipcMain } from 'electron'

import { mainSessionService, type PerfilSessao } from '../auth/MainSessionService'
import { AuthService } from '../services/AuthService'

const service = new AuthService()

export function registerAuthIpc(): void {
  ipcMain.handle('auth:login', async (event, matricula: string, senha: string) => {
    const resultado = await service.login(matricula, senha)

    if (resultado.sucesso && resultado.usuario) {
      mainSessionService.criar(event.sender.id, {
        usuarioId: resultado.usuario.id,
        nome: resultado.usuario.nome,
        matricula: resultado.usuario.matricula,
        perfil: resultado.usuario.perfil as PerfilSessao,
        deveTrocarSenha: resultado.usuario.deveTrocarSenha
      })
    } else {
      mainSessionService.remover(event.sender.id)
    }

    return resultado
  })

  ipcMain.handle('auth:sessao-atual', (event) => {
    return mainSessionService.obterPublica(event.sender.id)
  })

  ipcMain.handle('auth:logout', (event) => {
    mainSessionService.remover(event.sender.id)

    return {
      sucesso: true,
      mensagem: 'Sessão encerrada com sucesso.'
    }
  })
}
