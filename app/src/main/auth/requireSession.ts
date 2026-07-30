import type { IpcMainInvokeEvent } from 'electron'

import { mainSessionService, type PerfilSessao, type SessaoUsuario } from './MainSessionService'

type RequireSessionOptions = {
  perfis?: readonly PerfilSessao[]
  permitirTrocaSenhaPendente?: boolean
}

export function requireSession(
  event: IpcMainInvokeEvent,
  options: RequireSessionOptions = {}
): SessaoUsuario {
  const sessao = mainSessionService.obter(event.sender.id)

  if (!sessao) {
    throw new Error('SESSAO_NAO_AUTENTICADA')
  }

  if (sessao.deveTrocarSenha && !options.permitirTrocaSenhaPendente) {
    throw new Error('TROCA_SENHA_OBRIGATORIA')
  }

  if (options.perfis && !options.perfis.some((perfil) => perfil === sessao.perfil)) {
    throw new Error('SEM_PERMISSAO')
  }

  return sessao
}
