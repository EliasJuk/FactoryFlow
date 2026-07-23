import db from '../database/database'
import { loadConfig } from '../config/appConfig'
import { PostgresRefugoSyncRepository } from './postgres/PostgresRefugoSyncRepository'
import type { RefugoSyncPayload } from './sync.types'

type QueueRow = {
  id: number
  uuid: string
  entity: string
  recordUuid: string
  operation: string
  payload: string
  attempts: number
  maxAttempts: number
}

export class SyncWorker {
  private timer: NodeJS.Timeout | null = null
  private running = false
  private readonly postgresRepository = new PostgresRefugoSyncRepository()

  constructor(private readonly intervalMs = 30_000) {}

  start(): void {
    if (this.timer) return
    this.recoverStuckOperations()
    void this.runOnce()
    this.timer = setInterval(() => void this.runOnce(), this.intervalMs)
  }

  stop(): void {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = null
  }

  async runOnce(): Promise<void> {
    if (this.running || !this.shouldRun()) return
    this.running = true

    try {
      while (this.shouldRun()) {
        const item = this.claimNextPending()
        if (!item) break
        await this.processItem(item)
      }
    } finally {
      this.running = false
    }
  }

  private shouldRun(): boolean {
    const config = loadConfig()
    return (
      config.database.mode === 'sqliteSync' &&
      config.sync.enabled &&
      config.sync.destination === 'postgres'
    )
  }

  private recoverStuckOperations(): void {
    db.prepare(
      `
      UPDATE sync_queue
      SET status = 'PENDENTE',
          processing_at = NULL,
          updated_at = datetime('now','localtime')
      WHERE status = 'PROCESSANDO'
        AND processing_at IS NOT NULL
        AND processing_at <= datetime('now','localtime','-5 minutes')
    `
    ).run()
  }

  private claimNextPending(): QueueRow | null {
    return db.transaction(() => {
      const row = db
        .prepare(
          `
        SELECT id, uuid, entity, record_uuid as recordUuid, operation,
               payload, attempts, max_attempts as maxAttempts
        FROM sync_queue
        WHERE status = 'PENDENTE'
          AND attempts < max_attempts
          AND (next_attempt_at IS NULL
               OR next_attempt_at <= datetime('now','localtime'))
        ORDER BY id ASC
        LIMIT 1
      `
        )
        .get() as QueueRow | undefined

      if (!row) return null

      const result = db
        .prepare(
          `
        UPDATE sync_queue
        SET status = 'PROCESSANDO',
            attempts = attempts + 1,
            processing_at = datetime('now','localtime'),
            updated_at = datetime('now','localtime')
        WHERE id = ? AND status = 'PENDENTE'
      `
        )
        .run(row.id)

      return result.changes === 1 ? { ...row, attempts: row.attempts + 1 } : null
    })()
  }

  private async processItem(item: QueueRow): Promise<void> {
    try {
      if (item.entity !== 'REFUGO') {
        throw new Error(`Entidade não suportada: ${item.entity}`)
      }

      const payload = JSON.parse(item.payload) as RefugoSyncPayload

      if (
        payload.schemaVersion !== 1 ||
        payload.entity !== 'REFUGO' ||
        !payload.record?.uuid ||
        !Array.isArray(payload.record.itens)
      ) {
        throw new Error('Payload de refugo inválido.')
      }

      await this.postgresRepository.apply(payload)
      this.markAsSynced(item.id)
    } catch (error) {
      this.markAsFailed(item, error)
    }
  }

  private markAsSynced(id: number): void {
    db.transaction(() => {
      db.prepare(
        `
        UPDATE sync_queue
        SET status = 'SINCRONIZADO',
            last_error = NULL,
            next_attempt_at = NULL,
            processing_at = NULL,
            synced_at = datetime('now','localtime'),
            updated_at = datetime('now','localtime')
        WHERE id = ?
      `
      ).run(id)

      db.prepare(
        `
        UPDATE sync_state
        SET last_push_at = datetime('now','localtime'),
            last_success_at = datetime('now','localtime'),
            last_error = NULL,
            updated_at = datetime('now','localtime')
        WHERE id = 1
      `
      ).run()
    })()
  }

  private markAsFailed(item: QueueRow, error: unknown): void {
    const message =
      error instanceof Error ? error.message : 'Erro desconhecido durante a sincronização.'
    const exhausted = item.attempts >= item.maxAttempts
    const delay = this.getRetryDelaySeconds(item.attempts)

    db.transaction(() => {
      db.prepare(
        `
        UPDATE sync_queue
        SET status = ?,
            last_error = ?,
            next_attempt_at = CASE
              WHEN ? = 1 THEN NULL
              ELSE datetime('now','localtime', ?)
            END,
            processing_at = NULL,
            updated_at = datetime('now','localtime')
        WHERE id = ?
      `
      ).run(
        exhausted ? 'ERRO' : 'PENDENTE',
        message.slice(0, 2000),
        exhausted ? 1 : 0,
        `+${delay} seconds`,
        item.id
      )

      db.prepare(
        `
        UPDATE sync_state
        SET last_error = ?,
            updated_at = datetime('now','localtime')
        WHERE id = 1
      `
      ).run(message.slice(0, 2000))
    })()
  }

  private getRetryDelaySeconds(attempts: number): number {
    const schedule = [30, 60, 120, 300, 600, 1800]
    return schedule[Math.min(Math.max(attempts - 1, 0), schedule.length - 1)]
  }
}
