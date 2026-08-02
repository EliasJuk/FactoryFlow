import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'
import { verificarSenha } from '../shared/security/password'

const USUARIO_SISTEMA_ID = 1

type AuthResult = {
  sucesso: boolean
  mensagem: string
  usuario?: {
    id: number
    nome: string
    matricula: string
    perfil: string
    deveTrocarSenha: boolean
  }
}

export class AuthService {
  async login(matricula: string, senha: string): Promise<AuthResult> {
    try {
      const repository = RepositoryFactory.usuarios()
      const usuario = await repository.buscarCredenciaisPorMatricula(matricula.trim())

      if (
        !usuario ||
        usuario.id === USUARIO_SISTEMA_ID ||
        !usuario.ativo ||
        usuario.deletedAt
      ) {
        return {
          sucesso: false,
          mensagem: 'Matrícula ou senha inválida.'
        }
      }

      if (!usuario.senhaHash || !verificarSenha(senha, usuario.senhaHash)) {
        return {
          sucesso: false,
          mensagem: 'Matrícula ou senha inválida.'
        }
      }

      return {
        sucesso: true,
        mensagem: 'Login realizado com sucesso.',
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          matricula: usuario.matricula,
          perfil: usuario.perfil,
          deveTrocarSenha: Boolean(usuario.deveTrocarSenha)
        }
      }
    } catch {
      return {
        sucesso: false,
        mensagem: 'Não foi possível conectar ao banco de dados.'
      }
    }
  }
}
