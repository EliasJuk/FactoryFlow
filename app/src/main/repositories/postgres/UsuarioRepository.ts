import crypto from "crypto"
import { pool } from "../../database/postgres/connection"

export interface UsuarioInput {
  nome: string
  matricula: string
  perfil: string
  senha?: string
  usuarioId?: number | null
}

export interface Usuario {
  id: number
  nome: string
  matricula: string
  perfil: string
  ativo: boolean
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
  createdBy: number | null
  updatedBy: number | null
  deletedBy: number | null
  createdByNome: string | null
  updatedByNome: string | null
  deletedByNome: string | null
}

function gerarHashSenha(senha: string) {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(senha, salt, 100000, 64, "sha512").toString("hex")
  return `${salt}:${hash}`
}

export class UsuarioRepository {
  async listar(): Promise<Usuario[]> {
    const result = await pool.query<any>(`
      SELECT
        u.id,
        u.nome,
        u.matricula,
        u.perfil,
        u.ativo,
        u.created_at as "createdAt",
        u.updated_at as "updatedAt",
        u.deleted_at as "deletedAt",
        u.created_by as "createdBy",
        u.updated_by as "updatedBy",
        u.deleted_by as "deletedBy",
        cb.nome as "createdByNome",
        ub.nome as "updatedByNome",
        db.nome as "deletedByNome"
      FROM usuarios u
      LEFT JOIN usuarios cb ON cb.id = u.created_by
      LEFT JOIN usuarios ub ON ub.id = u.updated_by
      LEFT JOIN usuarios db ON db.id = u.deleted_by
      WHERE u.ativo = true
        AND u.deleted_at IS NULL
      ORDER BY u.nome
    `)

    return result.rows.map((usuario) => ({
      ...usuario,
      ativo: Boolean(usuario.ativo)
    }))
  }

  async listarInativos(): Promise<Usuario[]> {
    const result = await pool.query<any>(`
      SELECT
        u.id,
        u.nome,
        u.matricula,
        u.perfil,
        u.ativo,
        u.created_at as "createdAt",
        u.updated_at as "updatedAt",
        u.deleted_at as "deletedAt",
        u.created_by as "createdBy",
        u.updated_by as "updatedBy",
        u.deleted_by as "deletedBy",
        cb.nome as "createdByNome",
        ub.nome as "updatedByNome",
        db.nome as "deletedByNome"
      FROM usuarios u
      LEFT JOIN usuarios cb ON cb.id = u.created_by
      LEFT JOIN usuarios ub ON ub.id = u.updated_by
      LEFT JOIN usuarios db ON db.id = u.deleted_by
      WHERE u.ativo = false
        AND u.deleted_at IS NULL
      ORDER BY u.nome
    `)

    return result.rows.map((usuario) => ({
      ...usuario,
      ativo: Boolean(usuario.ativo)
    }))
  }

  async criar(input: UsuarioInput): Promise<void> {
    const matricula = input.matricula.trim()
    const usuarioId = input.usuarioId ?? null

    const duplicado = await pool.query<{ id: number }>(
      `
        SELECT id
        FROM usuarios
        WHERE matricula = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [matricula]
    )

    if (duplicado.rows[0]) {
      throw new Error("USUARIO_DUPLICADO")
    }

    const senhaHash = input.senha?.trim() ? gerarHashSenha(input.senha) : null

    await pool.query(
      `
        INSERT INTO usuarios (
          nome,
          matricula,
          perfil,
          senha_hash,
          ativo,
          created_at,
          updated_at,
          created_by,
          updated_by
        ) VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $5, $5)
      `,
      [input.nome.trim(), matricula, input.perfil, senhaHash, usuarioId]
    )
  }

  async editar(id: number, input: UsuarioInput): Promise<void> {
    const matricula = input.matricula.trim()
    const usuarioId = input.usuarioId ?? null

    const duplicado = await pool.query<{ id: number }>(
      `
        SELECT id
        FROM usuarios
        WHERE matricula = $1
          AND id <> $2
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [matricula, id]
    )

    if (duplicado.rows[0]) {
      throw new Error("USUARIO_DUPLICADO")
    }

    if (input.senha?.trim()) {
      const senhaHash = gerarHashSenha(input.senha)

      await pool.query(
        `
          UPDATE usuarios
          SET
            nome = $1,
            matricula = $2,
            perfil = $3,
            senha_hash = $4,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $5
          WHERE id = $6
            AND deleted_at IS NULL
        `,
        [input.nome.trim(), matricula, input.perfil, senhaHash, usuarioId, id]
      )

      return
    }

    await pool.query(
      `
        UPDATE usuarios
        SET
          nome = $1,
          matricula = $2,
          perfil = $3,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $4
        WHERE id = $5
          AND deleted_at IS NULL
      `,
      [input.nome.trim(), matricula, input.perfil, usuarioId, id]
    )
  }

  async excluir(id: number, usuarioId: number | null = null): Promise<void> {
    await pool.query(
      `
        UPDATE usuarios
        SET
          ativo = false,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $2
        WHERE id = $1
          AND deleted_at IS NULL
      `,
      [id, usuarioId]
    )
  }

  async ativar(id: number, usuarioId: number | null = null): Promise<void> {
    await pool.query(
      `
        UPDATE usuarios
        SET
          ativo = true,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $2
        WHERE id = $1
          AND deleted_at IS NULL
      `,
      [id, usuarioId]
    )
  }

  async remover(id: number, usuarioId: number | null = null): Promise<void> {
    await pool.query(
      `
        UPDATE usuarios
        SET
          ativo = false,
          deleted_at = CURRENT_TIMESTAMP,
          deleted_by = $2,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $2
        WHERE id = $1
          AND deleted_at IS NULL
      `,
      [id, usuarioId]
    )
  }

  async buscarCredenciaisPorMatricula(matricula: string) {
    const result = await pool.query<any>(
      `
        SELECT
          id,
          nome,
          matricula,
          perfil,
          senha_hash as "senhaHash",
          ativo,
          deleted_at as "deletedAt"
        FROM usuarios
        WHERE matricula = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [matricula]
    )
    return result.rows[0] ?? null
  }

}