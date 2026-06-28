import crypto from "crypto"
import db from "../database/database"

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
  listar() {
    return db
      .prepare(`
        SELECT
          id,
          nome,
          matricula,
          perfil,
          ativo
        FROM usuarios
        ORDER BY nome
      `)
      .all()
      .map((usuario: any) => ({
        ...usuario,
        ativo: Boolean(usuario.ativo)
      }))
  }

  criar(input: UsuarioInput) {
    const senhaHash = input.senha?.trim()
      ? gerarHashSenha(input.senha)
      : null

    db.prepare(`
      INSERT INTO usuarios (
        nome,
        matricula,
        perfil,
        senha_hash,
        ativo
      ) VALUES (?, ?, ?, ?, 1)
    `).run(
      input.nome,
      input.matricula,
      input.perfil,
      senhaHash
    )
  }

  editar(id: number, input: UsuarioInput) {
    if (input.senha?.trim()) {
      const senhaHash = gerarHashSenha(input.senha)

      db.prepare(`
        UPDATE usuarios
        SET
          nome = ?,
          matricula = ?,
          perfil = ?,
          senha_hash = ?
        WHERE id = ?
      `).run(
        input.nome,
        input.matricula,
        input.perfil,
        senhaHash,
        id
      )

      return
    }

    db.prepare(`
      UPDATE usuarios
      SET
        nome = ?,
        matricula = ?,
        perfil = ?
      WHERE id = ?
    `).run(
      input.nome,
      input.matricula,
      input.perfil,
      id
    )
  }

  excluir(id: number) {
    db.prepare(`
      UPDATE usuarios
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }

  ativar(id: number) {
    db.prepare(`
      UPDATE usuarios
      SET ativo = 1
      WHERE id = ?
    `).run(id)
  }
}