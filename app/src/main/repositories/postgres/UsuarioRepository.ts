import crypto from "crypto"
import { pool } from "../../database/postgres/connection"

export interface UsuarioInput {
  nome: string
  matricula: string
  perfil: string
  senha?: string
}

function gerarHashSenha(senha: string) {
  const salt = crypto.randomBytes(16).toString("hex")

  const hash = crypto
    .pbkdf2Sync(senha, salt, 100000, 64, "sha512")
    .toString("hex")

  return `${salt}:${hash}`
}

export class UsuarioRepository {
  async listar() {
    const result = await pool.query(`
      SELECT
        id,
        nome,
        matricula,
        perfil,
        ativo
      FROM usuarios
      ORDER BY nome
    `)

    return result.rows.map((usuario) => ({
      ...usuario,
      ativo: Boolean(usuario.ativo)
    }))
  }

  async criar(input: UsuarioInput): Promise<void> {
    const senhaHash = input.senha?.trim()
      ? gerarHashSenha(input.senha)
      : null

    await pool.query(`
      INSERT INTO usuarios (
        nome,
        matricula,
        perfil,
        senha_hash,
        ativo
      ) VALUES ($1, $2, $3, $4, true)
    `, [
      input.nome,
      input.matricula,
      input.perfil,
      senhaHash
    ])
  }

  async editar(id: number, input: UsuarioInput): Promise<void> {
    if (input.senha?.trim()) {
      const senhaHash = gerarHashSenha(input.senha)

      await pool.query(`
        UPDATE usuarios
        SET
          nome = $1,
          matricula = $2,
          perfil = $3,
          senha_hash = $4
        WHERE id = $5
      `, [
        input.nome,
        input.matricula,
        input.perfil,
        senhaHash,
        id
      ])

      return
    }

    await pool.query(`
      UPDATE usuarios
      SET
        nome = $1,
        matricula = $2,
        perfil = $3
      WHERE id = $4
    `, [
      input.nome,
      input.matricula,
      input.perfil,
      id
    ])
  }

  async excluir(id: number): Promise<void> {
    await pool.query(`
      UPDATE usuarios
      SET ativo = false
      WHERE id = $1
    `, [id])
  }

  async ativar(id: number): Promise<void> {
    await pool.query(`
      UPDATE usuarios
      SET ativo = true
      WHERE id = $1
    `, [id])
  }
}
