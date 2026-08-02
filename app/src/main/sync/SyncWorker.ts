import db from '../database/database'
import { loadConfig } from '../config/appConfig'

import { PostgresCircuitoComponenteSyncRepository } from './postgres/PostgresCircuitoComponenteSyncRepository'
import { PostgresCircuitoSyncRepository } from './postgres/PostgresCircuitoSyncRepository'
import { PostgresComponenteSyncRepository } from './postgres/PostgresComponenteSyncRepository'
import { PostgresDefeitoSyncRepository } from './postgres/PostgresDefeitoSyncRepository'
import { PostgresPostoDefeitoSyncRepository } from './postgres/PostgresPostoDefeitoSyncRepository'
import { PostgresPostoSyncRepository } from './postgres/PostgresPostoSyncRepository'
import { PostgresRefugoSyncRepository } from './postgres/PostgresRefugoSyncRepository'
import { PostgresRoteiroSyncRepository } from './postgres/PostgresRoteiroSyncRepository'
import { PostgresSetorSyncRepository } from './postgres/PostgresSetorSyncRepository'
import { PostgresSolicitacaoSenhaSyncRepository } from './postgres/PostgresSolicitacaoSenhaSyncRepository'
import { PostgresSubsetorSyncRepository } from './postgres/PostgresSubsetorSyncRepository'
import { PostgresUsuarioSyncRepository } from './postgres/PostgresUsuarioSyncRepository'
import { SyncPullStateRepository } from './SyncPullStateRepository'
import type { SyncPayload } from './sync.types'

type QueueRow = {
  id: number
  entity: string
  payload: string
  attempts: number
  maxAttempts: number
}

export class SyncWorker {
  private timer: NodeJS.Timeout | null = null
  private running = false
  private readonly usuarioRepository = new PostgresUsuarioSyncRepository()
  private readonly solicitacaoSenhaRepository = new PostgresSolicitacaoSenhaSyncRepository()
  private readonly setorRepository = new PostgresSetorSyncRepository()
  private readonly subsetorRepository = new PostgresSubsetorSyncRepository()
  private readonly postoRepository = new PostgresPostoSyncRepository()
  private readonly componenteRepository = new PostgresComponenteSyncRepository()
  private readonly circuitoRepository = new PostgresCircuitoSyncRepository()
  private readonly circuitoComponenteRepository = new PostgresCircuitoComponenteSyncRepository()
  private readonly defeitoRepository = new PostgresDefeitoSyncRepository()
  private readonly postoDefeitoRepository = new PostgresPostoDefeitoSyncRepository()
  private readonly roteiroRepository = new PostgresRoteiroSyncRepository()
  private readonly refugoRepository = new PostgresRefugoSyncRepository()
  private readonly pullStateRepository = new SyncPullStateRepository()

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
      this.pullStateRepository.resolveStaleLocalQueueConflicts()

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
      SET status = 'PENDENTE', processing_at = NULL,
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
          SELECT id, entity, payload, attempts,
                 max_attempts AS maxAttempts
          FROM sync_queue
          WHERE status = 'PENDENTE'
            AND attempts < max_attempts
            AND (
              next_attempt_at IS NULL
              OR next_attempt_at <= datetime('now','localtime')
            )
          ORDER BY
            CASE entity
              WHEN 'USUARIO' THEN 1
              WHEN 'SOLICITACAO_ALTERACAO_SENHA' THEN 2
              WHEN 'SETOR' THEN 3
              WHEN 'SUBSETOR' THEN 4
              WHEN 'POSTO' THEN 5
              WHEN 'COMPONENTE' THEN 6
              WHEN 'CIRCUITO' THEN 7
              WHEN 'CIRCUITO_COMPONENTE' THEN 8
              WHEN 'DEFEITO' THEN 9
              WHEN 'POSTO_DEFEITO' THEN 10
              WHEN 'ROTEIRO' THEN 11
              WHEN 'REFUGO' THEN 12
              ELSE 99
            END,
            id ASC
          LIMIT 1
          `
        )
        .get() as QueueRow | undefined

      if (!row) return null

      const result = db
        .prepare(
          `
          UPDATE sync_queue
          SET
            status = 'PROCESSANDO',
            attempts = attempts + 1,
            processing_at = datetime('now','localtime'),
            updated_at = datetime('now','localtime')
          WHERE id = ?
            AND status = 'PENDENTE'
          `
        )
        .run(row.id)

      return result.changes === 1
        ? { ...row, attempts: row.attempts + 1 }
        : null
    })()
  }

  private async processItem(item: QueueRow): Promise<void> {
    try {
      const payload = JSON.parse(item.payload) as SyncPayload

      if (payload.schemaVersion !== 1 || !payload.record?.uuid) {
        throw new Error('Payload de sincronização inválido.')
      }

      switch (payload.entity) {
        case 'USUARIO':
          await this.usuarioRepository.apply(payload)
          break

        case 'SOLICITACAO_ALTERACAO_SENHA':
          await this.solicitacaoSenhaRepository.apply(payload)
          break

        case 'SETOR':
          await this.setorRepository.apply(payload)
          break

        case 'SUBSETOR':
          await this.subsetorRepository.apply(payload)
          break

        case 'POSTO':
          await this.postoRepository.apply(payload)
          break

        case 'COMPONENTE':
          await this.componenteRepository.apply(payload)
          break

        case 'CIRCUITO':
          await this.circuitoRepository.apply(payload)
          break

        case 'CIRCUITO_COMPONENTE':
          await this.circuitoComponenteRepository.apply(payload)
          break

        case 'DEFEITO':
          await this.defeitoRepository.apply(payload)
          break

        case 'POSTO_DEFEITO':
          await this.postoDefeitoRepository.apply(payload)
          break

        case 'ROTEIRO':
          await this.roteiroRepository.apply(payload)
          break

        case 'REFUGO':
          await this.refugoRepository.apply(payload)
          break

        default:
          throw new Error('Entidade de sincronização não suportada.')
      }

      this.markAsSynced(item.id, payload.entity, payload.record.uuid)
    } catch (error) {
      this.markAsFailed(item, error)
    }
  }

  private markAsSynced(
    id: number,
    entity: SyncPayload['entity'],
    recordUuid: string
  ): void {
    db.transaction(() => {
      db.prepare(
        `
        UPDATE sync_queue
        SET
          status = 'SINCRONIZADO',
          last_error = NULL,
          next_attempt_at = NULL,
          processing_at = NULL,
          synced_at = datetime('now','localtime'),
          updated_at = datetime('now','localtime')
        WHERE id = ?
        `
      ).run(id)

      this.pullStateRepository.resolveLocalQueueConflictIfPossible(
        entity,
        recordUuid
      )

      db.prepare(
        `
        UPDATE sync_state
        SET
          last_push_at = datetime('now','localtime'),
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
      error instanceof Error
        ? error.message
        : 'Erro desconhecido durante a sincronização.'

    const exhausted = item.attempts >= item.maxAttempts
    const schedule = [30, 60, 120, 300, 600, 1800]
    const delay =
      schedule[
        Math.min(
          Math.max(item.attempts - 1, 0),
          schedule.length - 1
        )
      ]

    db.transaction(() => {
      db.prepare(
        `
        UPDATE sync_queue
        SET
          status = ?,
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
        SET
          last_error = ?,
          updated_at = datetime('now','localtime')
        WHERE id = 1
        `
      ).run(message.slice(0, 2000))
    })()
  }
}
