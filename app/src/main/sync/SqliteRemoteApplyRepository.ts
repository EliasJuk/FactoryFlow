import db from '../database/database'
import type { SetorPullRecord, UsuarioPullRecord } from './pull.types'

export class SqliteRemoteApplyRepository {
  applyUsuario(record: UsuarioPullRecord): void {
    db.transaction(() => {
      const createdBy = this.userId(record.createdByUuid)
      const updatedBy = this.userId(record.updatedByUuid)
      const deletedBy = this.userId(record.deletedByUuid)

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
          deleted_at,
          created_by,
          updated_by,
          deleted_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(uuid) DO UPDATE SET
          nome = excluded.nome,
          matricula = excluded.matricula,
          perfil = excluded.perfil,
          senha_hash = excluded.senha_hash,
          deve_trocar_senha = excluded.deve_trocar_senha,
          ativo = excluded.ativo,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          updated_by = excluded.updated_by,
          deleted_by = excluded.deleted_by
        `
      ).run(
        record.uuid,
        record.nome,
        record.matricula,
        record.perfil,
        record.senhaHash,
        record.deveTrocarSenha ? 1 : 0,
        record.ativo ? 1 : 0,
        record.createdAt,
        record.updatedAt,
        record.deletedAt,
        createdBy,
        updatedBy,
        deletedBy
      )
    })()
  }

  applySetor(record: SetorPullRecord): void {
    db.transaction(() => {
      const createdBy = this.userId(record.createdByUuid)
      const updatedBy = this.userId(record.updatedByUuid)
      const deletedBy = this.userId(record.deletedByUuid)

      db.prepare(
        `
        INSERT INTO setores (
          uuid,
          nome,
          sigla,
          ativo,
          created_at,
          updated_at,
          deleted_at,
          created_by,
          updated_by,
          deleted_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(uuid) DO UPDATE SET
          nome = excluded.nome,
          sigla = excluded.sigla,
          ativo = excluded.ativo,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          updated_by = excluded.updated_by,
          deleted_by = excluded.deleted_by
        `
      ).run(
        record.uuid,
        record.nome,
        record.sigla,
        record.ativo ? 1 : 0,
        record.createdAt,
        record.updatedAt,
        record.deletedAt,
        createdBy,
        updatedBy,
        deletedBy
      )
    })()
  }

  private userId(uuid: string | null): number | null {
    if (!uuid) return null

    const row = db.prepare('SELECT id FROM usuarios WHERE uuid = ? LIMIT 1').get(uuid) as
      { id: number } | undefined

    return row?.id ?? null
  }
}
