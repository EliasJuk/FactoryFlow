import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'
import { SYSTEM_IDS } from '../shared/ids/systemIds'
import { verificarSenha } from '../shared/security/password'

const MATRICULA_USUARIO_SISTEMA = '0000'
const TAMANHO_MAXIMO_MATRICULA = 80
const TAMANHO_MAXIMO_SENHA = 128

const PERFIS_VALIDOS = new Set([
  'OPERADOR',
  'TECNICO',
  'LIDER',
  'SUPERVISOR',
  'QUALIDADE',
  'ADMIN'
])

const MENSAGEM_CREDENCIAIS_INVALIDAS = 'Matrícula ou senha inválida.'

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

type CredenciaisNormalizadas = {
  matricula: string
  senha: string
}

function normalizarCredenciais(
  matricula: unknown,
  senha: unknown
): CredenciaisNormalizadas | null {
  if (typeof matricula !== 'string' || typeof senha !== 'string') {
    return null
  }

  const matriculaNormalizada = matricula.trim()

  if (
    !matriculaNormalizada ||
    matriculaNormalizada.length > TAMANHO_MAXIMO_MATRICULA ||
    /[\0\r\n]/.test(matriculaNormalizada)
  ) {
    return null
  }

  if (
    !senha ||
    senha.length > TAMANHO_MAXIMO_SENHA ||
    /[\0\r\n]/.test(senha)
  ) {
    return null
  }

  return {
    matricula: matriculaNormalizada,
    senha
  }
}

export class AuthService {
  async login(matricula: unknown, senha: unknown): Promise<AuthResult> {
    const credenciais = normalizarCredenciais(matricula, senha)

    if (!credenciais) {
      return {
        sucesso: false,
        mensagem: MENSAGEM_CREDENCIAIS_INVALIDAS
      }
    }

    try {
      const repository = RepositoryFactory.usuarios()
      const usuario = await repository.buscarCredenciaisPorMatricula(
        credenciais.matricula
      )

      if (
        !usuario ||
        usuario.uuid === SYSTEM_IDS.usuarioSistema ||
        usuario.matricula === MATRICULA_USUARIO_SISTEMA ||
        !usuario.ativo ||
        usuario.deletedAt ||
        !PERFIS_VALIDOS.has(usuario.perfil)
      ) {
        return {
          sucesso: false,
          mensagem: MENSAGEM_CREDENCIAIS_INVALIDAS
        }
      }

      if (
        !usuario.senhaHash ||
        !verificarSenha(credenciais.senha, usuario.senhaHash)
      ) {
        return {
          sucesso: false,
          mensagem: MENSAGEM_CREDENCIAIS_INVALIDAS
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
    } catch (error) {
      console.error('[AUTH] Falha interna durante o login:', error)

      return {
        sucesso: false,
        mensagem: 'Não foi possível realizar o login agora. Tente novamente mais tarde.'
      }
    }
  }
}
