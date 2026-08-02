export type PerfilSessao = 'OPERADOR' | 'TECNICO' | 'LIDER' | 'SUPERVISOR' | 'QUALIDADE' | 'ADMIN'

export type SessaoUsuario = {
  usuarioId: number
  nome: string
  matricula: string
  perfil: PerfilSessao
  deveTrocarSenha: boolean
}

export type SessaoPublica = {
  id: number
  nome: string
  matricula: string
  perfil: PerfilSessao
  deveTrocarSenha: boolean
}

export type AtualizacaoSessaoUsuario = Partial<
  Pick<SessaoUsuario, 'nome' | 'matricula' | 'perfil' | 'deveTrocarSenha'>
>

export class MainSessionService {
  private readonly sessoes = new Map<number, SessaoUsuario>()

  criar(webContentsId: number, sessao: SessaoUsuario): SessaoPublica {
    this.sessoes.set(webContentsId, { ...sessao })
    return this.toPublica(sessao)
  }

  obter(webContentsId: number): SessaoUsuario | null {
    const sessao = this.sessoes.get(webContentsId)
    return sessao ? { ...sessao } : null
  }

  obterPublica(webContentsId: number): SessaoPublica | null {
    const sessao = this.sessoes.get(webContentsId)
    return sessao ? this.toPublica(sessao) : null
  }

  concluirTrocaSenha(webContentsId: number): SessaoPublica | null {
    const sessao = this.sessoes.get(webContentsId)

    if (!sessao) {
      return null
    }

    const atualizada: SessaoUsuario = {
      ...sessao,
      deveTrocarSenha: false
    }

    this.sessoes.set(webContentsId, atualizada)
    return this.toPublica(atualizada)
  }

  atualizarPorUsuario(
    usuarioId: number,
    atualizacao: AtualizacaoSessaoUsuario
  ): number {
    let totalAtualizadas = 0

    for (const [webContentsId, sessao] of this.sessoes.entries()) {
      if (sessao.usuarioId !== usuarioId) {
        continue
      }

      this.sessoes.set(webContentsId, {
        ...sessao,
        ...atualizacao
      })

      totalAtualizadas++
    }

    return totalAtualizadas
  }

  removerPorUsuario(usuarioId: number): number {
    let totalRemovidas = 0

    for (const [webContentsId, sessao] of this.sessoes.entries()) {
      if (sessao.usuarioId !== usuarioId) {
        continue
      }

      this.sessoes.delete(webContentsId)
      totalRemovidas++
    }

    return totalRemovidas
  }

  remover(webContentsId: number): void {
    this.sessoes.delete(webContentsId)
  }

  limpar(): void {
    this.sessoes.clear()
  }

  private toPublica(sessao: SessaoUsuario): SessaoPublica {
    return {
      id: sessao.usuarioId,
      nome: sessao.nome,
      matricula: sessao.matricula,
      perfil: sessao.perfil,
      deveTrocarSenha: sessao.deveTrocarSenha
    }
  }
}

export const mainSessionService = new MainSessionService()
