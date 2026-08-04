import { ipcMain, type WebContents } from 'electron'

import { mainSessionService, type PerfilSessao } from '../auth/MainSessionService'
import { AuthService } from '../services/AuthService'

const service = new AuthService()

const MAX_TENTATIVAS_LOGIN = 5
const JANELA_TENTATIVAS_MS = 60_000
const TEMPO_BLOQUEIO_MS = 30_000

type EstadoTentativasLogin = {
  tentativasFalhas: number
  inicioJanela: number
  bloqueadoAte: number
}

const tentativasPorWebContents = new Map<number, EstadoTentativasLogin>()
const webContentsMonitorados = new Set<number>()

function monitorarDestruicao(sender: WebContents): void {
  const webContentsId = sender.id

  if (webContentsMonitorados.has(webContentsId)) {
    return
  }

  webContentsMonitorados.add(webContentsId)

  sender.once('destroyed', () => {
    tentativasPorWebContents.delete(webContentsId)
    webContentsMonitorados.delete(webContentsId)
  })
}

function segundosRestantesBloqueio(webContentsId: number): number {
  const estado = tentativasPorWebContents.get(webContentsId)

  if (!estado || estado.bloqueadoAte <= 0) {
    return 0
  }

  const restante = estado.bloqueadoAte - Date.now()

  if (restante <= 0) {
    tentativasPorWebContents.delete(webContentsId)
    return 0
  }

  return Math.max(1, Math.ceil(restante / 1000))
}

function registrarFalhaLogin(webContentsId: number): void {
  const agora = Date.now()
  const atual = tentativasPorWebContents.get(webContentsId)

  if (!atual || agora - atual.inicioJanela > JANELA_TENTATIVAS_MS) {
    tentativasPorWebContents.set(webContentsId, {
      tentativasFalhas: 1,
      inicioJanela: agora,
      bloqueadoAte: 0
    })
    return
  }

  const tentativasFalhas = atual.tentativasFalhas + 1

  tentativasPorWebContents.set(webContentsId, {
    tentativasFalhas,
    inicioJanela: atual.inicioJanela,
    bloqueadoAte:
      tentativasFalhas >= MAX_TENTATIVAS_LOGIN
        ? agora + TEMPO_BLOQUEIO_MS
        : atual.bloqueadoAte
  })
}

function limparFalhasLogin(webContentsId: number): void {
  tentativasPorWebContents.delete(webContentsId)
}

export function registerAuthIpc(): void {
  ipcMain.handle('auth:login', async (event, matricula: unknown, senha: unknown) => {
    const webContentsId = event.sender.id
    monitorarDestruicao(event.sender)

    const segundosRestantes = segundosRestantesBloqueio(webContentsId)

    if (segundosRestantes > 0) {
      mainSessionService.remover(webContentsId)

      return {
        sucesso: false,
        mensagem: `Muitas tentativas de login. Aguarde ${segundosRestantes} segundos e tente novamente.`
      }
    }

    const resultado = await service.login(matricula, senha)

    if (resultado.sucesso && resultado.usuario) {
      limparFalhasLogin(webContentsId)

      mainSessionService.criar(webContentsId, {
        usuarioId: resultado.usuario.id,
        nome: resultado.usuario.nome,
        matricula: resultado.usuario.matricula,
        perfil: resultado.usuario.perfil as PerfilSessao,
        deveTrocarSenha: resultado.usuario.deveTrocarSenha
      })
    } else {
      registrarFalhaLogin(webContentsId)
      mainSessionService.remover(webContentsId)
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
