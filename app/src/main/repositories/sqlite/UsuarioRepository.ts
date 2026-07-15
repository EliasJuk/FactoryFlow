import crypto from 'crypto'
import { getDatabase } from '../../database/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

const db = getDatabase()

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
  ativo: number
  deletedAt: string | null
  deveTrocarSenha: number
}

function gerarHashSenha(senha: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(senha, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export class UsuarioRepository {
  listar(): Usuario[] {
    return db
      .prepare(
        `
        SELECT
          u.id,
          u.uuid,
          u.nome,
          u.matricula,
          u.perfil,
          u.ativo,
          u.created_at AS createdAt,
          u.updated_at AS updatedAt,
          u.deleted_at AS deletedAt,
          u.created_by AS createdBy,
          u.updated_by AS updatedBy,
          u.deleted_by AS deletedBy,
          cb.nome AS createdByNome,
          ub.nome AS updatedByNome,
          dbu.nome AS deletedByNome
        FROM usuarios u
        LEFT JOIN usuarios cb ON cb.id = u.created_by
        LEFT JOIN usuarios ub ON ub.id = u.updated_by
        LEFT JOIN usuarios dbu ON dbu.id = u.deleted_by
        WHERE u.ativo = 1
          AND u.deleted_at IS NULL
        ORDER BY u.nome
      `
      )
      .all()
      .map((usuario: any) => ({
        ...usuario,
        ativo: Boolean(usuario.ativo)
      })) as Usuario[]
  }

  listarInativos(): Usuario[] {
    return db
      .prepare(
        `
        SELECT
          u.id,
          u.uuid,
          u.nome,
          u.matricula,
          u.perfil,
          u.ativo,
          u.created_at AS createdAt,
          u.updated_at AS updatedAt,
          u.deleted_at AS deletedAt,
          u.created_by AS createdBy,
          u.updated_by AS updatedBy,
          u.deleted_by AS deletedBy,
          cb.nome AS createdByNome,
          ub.nome AS updatedByNome,
          dbu.nome AS deletedByNome
        FROM usuarios u
        LEFT JOIN usuarios cb ON cb.id = u.created_by
        LEFT JOIN usuarios ub ON ub.id = u.updated_by
        LEFT JOIN usuarios dbu ON dbu.id = u.deleted_by
        WHERE u.ativo = 0
          AND u.deleted_at IS NULL
        ORDER BY u.nome
      `
      )
      .all()
      .map((usuario: any) => ({
        ...usuario,
        ativo: Boolean(usuario.ativo)
      })) as Usuario[]
  }

  criar(input: UsuarioInput): void {
    const matricula = input.matricula.trim()
    const usuarioId = input.usuarioId ?? null
    const uuid = IdGenerator.generate()

    const duplicado = db
      .prepare(
        `
        SELECT id
        FROM usuarios
        WHERE matricula = ?
          AND deleted_at IS NULL
      `
      )
      .get(matricula) as { id: number } | undefined

    if (duplicado) {
      throw new Error('USUARIO_DUPLICADO')
    }

    const senhaHash = input.senha?.trim() ? gerarHashSenha(input.senha) : null

    db.prepare(
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
        ?,
        ?,
        ?,
        ?,
        ?,
        1,
        1,
        datetime('now', 'localtime'),
        datetime('now', 'localtime'),
        ?,
        ?
      )
    `
    ).run(uuid, input.nome.trim(), matricula, input.perfil, senhaHash, usuarioId, usuarioId)
  }

  editar(id: number, input: UsuarioInput): void {
    const matricula = input.matricula.trim()
    const usuarioId = input.usuarioId ?? null

    const duplicado = db
      .prepare(
        `
        SELECT id
        FROM usuarios
        WHERE matricula = ?
          AND id <> ?
          AND deleted_at IS NULL
      `
      )
      .get(matricula, id) as { id: number } | undefined

    if (duplicado) {
      throw new Error('USUARIO_DUPLICADO')
    }

    if (input.senha?.trim()) {
      const senhaHash = gerarHashSenha(input.senha)

      db.prepare(
        `
        UPDATE usuarios
        SET
          nome = ?,
          matricula = ?,
          perfil = ?,
          senha_hash = ?,
          deve_trocar_senha = 1,
          updated_at = datetime('now', 'localtime'),
          updated_by = ?
        WHERE id = ?
          AND deleted_at IS NULL
      `
      ).run(input.nome.trim(), matricula, input.perfil, senhaHash, usuarioId, id)

      return
    }

    db.prepare(
      `
      UPDATE usuarios
      SET
        nome = ?,
        matricula = ?,
        perfil = ?,
        updated_at = datetime('now', 'localtime'),
        updated_by = ?
      WHERE id = ?
        AND deleted_at IS NULL
    `
    ).run(input.nome.trim(), matricula, input.perfil, usuarioId, id)
  }

  excluir(id: number, usuarioId: number | null = null): void {
    db.prepare(
      `
      UPDATE usuarios
      SET
        ativo = 0,
        updated_at = datetime('now', 'localtime'),
        updated_by = ?
      WHERE id = ?
        AND deleted_at IS NULL
    `
    ).run(usuarioId, id)
  }

  ativar(id: number, usuarioId: number | null = null): void {
    db.prepare(
      `
      UPDATE usuarios
      SET
        ativo = 1,
        updated_at = datetime('now', 'localtime'),
        updated_by = ?
      WHERE id = ?
        AND deleted_at IS NULL
    `
    ).run(usuarioId, id)
  }

  remover(id: number, usuarioId: number | null = null): void {
    db.prepare(
      `
      UPDATE usuarios
      SET
        ativo = 0,
        deleted_at = datetime('now', 'localtime'),
        deleted_by = ?,
        updated_at = datetime('now', 'localtime'),
        updated_by = ?
      WHERE id = ?
        AND deleted_at IS NULL
    `
    ).run(usuarioId, usuarioId, id)
  }

  buscarCredenciaisPorMatricula(matricula: string): UsuarioCredenciais | undefined {
    return db
      .prepare(
        `
        SELECT
          id,
          uuid,
          nome,
          matricula,
          perfil,
          senha_hash AS senhaHash,
          ativo,
          deleted_at AS deletedAt,
          deve_trocar_senha AS deveTrocarSenha
        FROM usuarios
        WHERE matricula = ?
          AND deleted_at IS NULL
        LIMIT 1
      `
      )
      .get(matricula) as UsuarioCredenciais | undefined
  }
}
