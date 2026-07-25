import db from '../database/database'
import type { PullCursor, PullEntity } from './pull.types'

export class SyncPullStateRepository {
  getCursor(entity: PullEntity): PullCursor {
    const row = db
      .prepare(
        `
        SELECT
          last_updated_at AS lastUpdatedAt,
          last_uuid AS lastUuid
        FROM sync_pull_state
        WHERE entity = ?
      `
      )
      .get(entity) as PullCursor | undefined

    return row ?? { lastUpdatedAt: null, lastUuid: null }
  }

  markSuccess(entity: PullEntity, cursor: PullCursor): void {
    db.prepare(
      `
      INSERT INTO sync_pull_state (
        entity,
        last_updated_at,
        last_uuid,
        last_pull_at,
        last_success_at,
        last_error,
        updated_at
      )
      VALUES (
        ?, ?, ?,
        datetime('now','localtime'),
        datetime('now','localtime'),
        NULL,
        datetime('now','localtime')
      )
      ON CONFLICT(entity) DO UPDATE SET
        last_updated_at = excluded.last_updated_at,
        last_uuid = excluded.last_uuid,
        last_pull_at = excluded.last_pull_at,
        last_success_at = excluded.last_success_at,
        last_error = NULL,
        updated_at = excluded.updated_at
      `
    ).run(entity, cursor.lastUpdatedAt, cursor.lastUuid)

    db.prepare(
      `
      UPDATE sync_state
      SET
        last_pull_at = datetime('now','localtime'),
        last_success_at = datetime('now','localtime'),
        last_error = NULL,
        updated_at = datetime('now','localtime')
      WHERE id = 1
      `
    ).run()
  }

  markError(entity: PullEntity, error: unknown): void {
    const message = error instanceof Error ? error.message : 'Erro desconhecido durante o pull.'

    db.prepare(
      `
      INSERT INTO sync_pull_state (
        entity,
        last_pull_at,
        last_error,
        updated_at
      )
      VALUES (
        ?,
        datetime('now','localtime'),
        ?,
        datetime('now','localtime')
      )
      ON CONFLICT(entity) DO UPDATE SET
        last_pull_at = excluded.last_pull_at,
        last_error = excluded.last_error,
        updated_at = excluded.updated_at
      `
    ).run(entity, message.slice(0, 2000))

    db.prepare(
      `
      UPDATE sync_state
      SET
        last_error = ?,
        updated_at = datetime('now','localtime')
      WHERE id = 1
      `
    ).run(message.slice(0, 2000))
  }

  hasLocalConflict(entity: PullEntity, recordUuid: string): boolean {
    const row = db
      .prepare(
        `
        SELECT 1
        FROM sync_queue
        WHERE entity = ?
          AND record_uuid = ?
          AND status IN ('PENDENTE', 'PROCESSANDO', 'ERRO')
        LIMIT 1
        `
      )
      .get(entity, recordUuid)

    return Boolean(row)
  }

  registerConflict(
    entity: PullEntity,
    recordUuid: string,
    remoteUpdatedAt: string,
    reason: string
  ): void {
    const existing = db
      .prepare(
        `
        SELECT id
        FROM sync_pull_conflicts
        WHERE entity = ?
          AND record_uuid = ?
          AND status = 'PENDENTE'
        LIMIT 1
        `
      )
      .get(entity, recordUuid) as { id: number } | undefined

    if (existing) return

    db.prepare(
      `
      INSERT INTO sync_pull_conflicts (
        entity,
        record_uuid,
        remote_updated_at,
        reason
      )
      VALUES (?, ?, ?, ?)
      `
    ).run(entity, recordUuid, remoteUpdatedAt, reason)
  }
}
