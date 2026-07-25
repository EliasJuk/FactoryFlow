import { loadConfig } from '../config/appConfig'
import { PostgresPullRepository } from './PostgresPullRepository'
import { SqliteRemoteApplyRepository } from './SqliteRemoteApplyRepository'
import { SyncPullStateRepository } from './SyncPullStateRepository'
import type { PullEntity, PullRecordBase } from './pull.types'

export class SyncPullWorker {
  private timer: NodeJS.Timeout | null = null
  private running = false

  private readonly remote = new PostgresPullRepository()
  private readonly local = new SqliteRemoteApplyRepository()
  private readonly state = new SyncPullStateRepository()

  constructor(
    private readonly intervalMs = 30_000,
    private readonly batchSize = 200
  ) {}

  start(): void {
    if (this.timer) return
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
      await this.pullUsuarios()
      await this.pullSetores()
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

  private async pullUsuarios(): Promise<void> {
    await this.pullEntity(
      'USUARIO',
      (cursor) => this.remote.fetchUsuarios(cursor, this.batchSize),
      (record) => this.local.applyUsuario(record)
    )
  }

  private async pullSetores(): Promise<void> {
    await this.pullEntity(
      'SETOR',
      (cursor) => this.remote.fetchSetores(cursor, this.batchSize),
      (record) => this.local.applySetor(record)
    )
  }

  private async pullEntity<T extends PullRecordBase>(
    entity: PullEntity,
    fetchBatch: (cursor: { lastUpdatedAt: string | null; lastUuid: string | null }) => Promise<T[]>,
    applyRecord: (record: T) => void
  ): Promise<void> {
    try {
      while (this.shouldRun()) {
        const cursor = this.state.getCursor(entity)
        const records = await fetchBatch(cursor)

        if (records.length === 0) {
          this.state.markSuccess(entity, cursor)
          return
        }

        for (const record of records) {
          if (this.state.hasLocalConflict(entity, record.uuid)) {
            this.state.registerConflict(
              entity,
              record.uuid,
              record.updatedAt,
              'Existe alteração local ainda não sincronizada.'
            )
            return
          }

          applyRecord(record)

          this.state.markSuccess(entity, {
            lastUpdatedAt: record.updatedAt,
            lastUuid: record.uuid
          })
        }

        if (records.length < this.batchSize) return
      }
    } catch (error) {
      this.state.markError(entity, error)
    }
  }
}
