import crypto from 'crypto'
import { pool } from '../../database/postgres/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

export interface UsuarioInput {
  nome: string
  matricula: string
  perfil: string
  senha?: string
  usuarioId?: number | null
}

export interface Usuario {
  id: number
  uuid: string
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

interface UsuarioCredenciais {
  id: number
  uuid: string
  nome: string
  matricula: string
  perfil: string
  senhaHash: string | null
  ativo: boolean
  deletedAt: string | null
  deveTrocarSenha: boolean
}

function gerarHashSenha(senha: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(senha, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export class UsuarioRepository {
  async listar(): Promise<Usuario[]> {
    const result = await pool.query<Usuario>(`
      SELECT
        u.id,
        u.uuid,
        u.nome,
        u.matricula,
        u.perfil,
        u.ativo,
        u.created_at AS "createdAt",
        u.updated_at AS "updatedAt",
        u.deleted_at AS "deletedAt",
        u.created_by AS "createdBy",
        u.updated_by AS "updatedBy",
        u.deleted_by AS "deletedBy",
        cb.nome AS "createdByNome",
        ub.nome AS "updatedByNome",
        db.nome AS "deletedByNome"
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
    const result = await pool.query<Usuario>(`
      SELECT
        u.id,
        u.uuid,
        u.nome,
        u.matricula,
        u.perfil,
        u.ativo,
        u.created_at AS "createdAt",
        u.updated_at AS "updatedAt",
        u.deleted_at AS "deletedAt",
        u.created_by AS "createdBy",
        u.updated_by AS "updatedBy",
        u.deleted_by AS "deletedBy",
        cb.nome AS "createdByNome",
        ub.nome AS "updatedByNome",
        db.nome AS "deletedByNome"
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
    const uuid = IdGenerator.generate()

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
      throw new Error('USUARIO_DUPLICADO')
    }

    const senhaHash = input.senha?.trim() ? gerarHashSenha(input.senha) : null

    await pool.query(
      `
        INSERT INTO usuarios (
          uuid,
          nome,
          matricula,
          perfil,
          senha_hash,
          deve_trocar_senha,
          ativo,
          created_at,
          updated_at,
          created_by,
          updated_by
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          true,
          true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          $6,
          $6
        )
      `,
      [uuid, input.nome.trim(), matricula, input.perfil, senhaHash, usuarioId]
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
      throw new Error('USUARIO_DUPLICADO')
    }

    if (input.senha?.trim()) {
      const senhaHash = gerarHashSenha(input.senha)

      const resultado = await pool.query(
        `
          UPDATE usuarios
          SET
            nome = $1,
            matricula = $2,
            perfil = $3,
            senha_hash = $4,
            deve_trocar_senha = true,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $5
          WHERE id = $6
            AND deleted_at IS NULL
        `,
        [input.nome.trim(), matricula, input.perfil, senhaHash, usuarioId, id]
      )

      if ((resultado.rowCount ?? 0) === 0) {
        throw new Error('Usuário não encontrado.')
      }

      return
    }

    const resultado = await pool.query(
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

    if ((resultado.rowCount ?? 0) === 0) {
      throw new Error('Usuário não encontrado.')
    }
  }

  async excluir(id: number, usuarioId: number | null = null): Promise<void> {
    const resultado = await pool.query(
      `
        UPDATE usuarios
        SET
          ativo = false,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $2
        WHERE id = $1
          AND deleted_at IS NULL
          AND ativo = true
      `,
      [id, usuarioId]
    )

    if ((resultado.rowCount ?? 0) === 0) {
      throw new Error('Usuário não encontrado ou já está inativo.')
    }
  }

  async ativar(id: number, usuarioId: number | null = null): Promise<void> {
    const resultado = await pool.query(
      `
        UPDATE usuarios
        SET
          ativo = true,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $2
        WHERE id = $1
          AND deleted_at IS NULL
          AND ativo = false
      `,
      [id, usuarioId]
    )

    if ((resultado.rowCount ?? 0) === 0) {
      throw new Error('Usuário não encontrado ou já está ativo.')
    }
  }

  async remover(id: number, usuarioId: number | null = null): Promise<void> {
    const resultado = await pool.query(
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

    if ((resultado.rowCount ?? 0) === 0) {
      throw new Error('Usuário não encontrado ou já foi removido.')
    }
  }

  async buscarPerfilPorId(id: number): Promise<{ perfil: string; ativo: boolean } | null> {
    const result = await pool.query<{ perfil: string; ativo: boolean }>(
      `
        SELECT perfil, ativo
        FROM usuarios
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [id]
    )

    return result.rows[0] ?? null
  }

  async buscarCredenciaisPorMatricula(matricula: string): Promise<UsuarioCredenciais | null> {
    const result = await pool.query<UsuarioCredenciais>(
      `
        SELECT
          id,
          uuid,
          nome,
          matricula,
          perfil,
          senha_hash AS "senhaHash",
          ativo,
          deleted_at AS "deletedAt",
          deve_trocar_senha AS "deveTrocarSenha"
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
