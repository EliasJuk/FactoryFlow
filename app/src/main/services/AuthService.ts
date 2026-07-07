import crypto from "crypto"
import { RepositoryFactory } from "../repositories/factory/RepositoryFactory"

type AuthResult = {
  sucesso: boolean
  mensagem: string
  usuario?: {
    id: number
    nome: string
    matricula: string
    perfil: string
  }
}

function verificarSenha(senha: string, senhaHash: string) {
  const [salt, hashOriginal] = senhaHash.split(":")

  if (!salt || !hashOriginal) return false

  const hashDigitado = crypto
    .pbkdf2Sync(senha, salt, 100000, 64, "sha512")
    .toString("hex")

  const bufferOriginal = Buffer.from(hashOriginal, "hex")
  const bufferDigitado = Buffer.from(hashDigitado, "hex")

  if (bufferOriginal.length !== bufferDigitado.length) return false

  return crypto.timingSafeEqual(bufferOriginal, bufferDigitado)
}

export class AuthService {
  async login(matricula: string, senha: string): Promise<AuthResult> {
    try {
      const repository = RepositoryFactory.usuarios()

      const usuario = await repository.buscarCredenciaisPorMatricula(
        matricula.trim()
      )

      if (!usuario || !usuario.ativo || usuario.deletedAt) {
        return {
          sucesso: false,
          mensagem: "Matrícula ou senha inválida."
        }
      }

      if (!usuario.senhaHash) {
        return {
          sucesso: false,
          mensagem: "Usuário sem senha cadastrada."
        }
      }

      const senhaValida = verificarSenha(senha, usuario.senhaHash)

      if (!senhaValida) {
        return {
          sucesso: false,
          mensagem: "Matrícula ou senha inválida."
        }
      }

      return {
        sucesso: true,
        mensagem: "Login realizado com sucesso.",
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          matricula: usuario.matricula,
          perfil: usuario.perfil
        }
      }
    } catch {
      return {
        sucesso: false,
        mensagem: "Não foi possível conectar ao banco de dados."
      }
    }
  }
}