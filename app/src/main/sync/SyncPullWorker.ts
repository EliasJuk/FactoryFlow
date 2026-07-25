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
    private readonly intervalMs = 30000,
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
      await this.pullSubsetores()
      await this.pullPostos()
      await this.pullComponentes()
      await this.pullCircuitos()
      await this.pullDefeitos()
      await this.pullCircuitoComponentes()
      await this.pullPostoDefeitos()
    } finally {
      this.running = false
    }
  }
  private shouldRun(): boolean {
    const c = loadConfig()
    return c.database.mode === 'sqliteSync' && c.sync.enabled && c.sync.destination === 'postgres'
  }
  private pullUsuarios() {
    return this.pullEntity(
      'USUARIO',
      (c) => this.remote.fetchUsuarios(c, this.batchSize),
      (r) => this.local.applyUsuario(r)
    )
  }
  private pullSetores() {
    return this.pullEntity(
      'SETOR',
      (c) => this.remote.fetchSetores(c, this.batchSize),
      (r) => this.local.applySetor(r)
    )
  }
  private pullSubsetores() {
    return this.pullEntity(
      'SUBSETOR',
      (c) => this.remote.fetchSubsetores(c, this.batchSize),
      (r) => this.local.applySubsetor(r)
    )
  }
  private pullPostos() {
    return this.pullEntity(
      'POSTO',
      (c) => this.remote.fetchPostos(c, this.batchSize),
      (r) => this.local.applyPosto(r)
    )
  }
  private pullComponentes() {
    return this.pullEntity(
      'COMPONENTE',
      (c) => this.remote.fetchComponentes(c, this.batchSize),
      (r) => this.local.applyComponente(r)
    )
  }
  private pullCircuitos() {
    return this.pullEntity(
      'CIRCUITO',
      (c) => this.remote.fetchCircuitos(c, this.batchSize),
      (r) => this.local.applyCircuito(r)
    )
  }
  private pullDefeitos() {
    return this.pullEntity(
      'DEFEITO',
      (c) => this.remote.fetchDefeitos(c, this.batchSize),
      (r) => this.local.applyDefeito(r)
    )
  }

  private pullCircuitoComponentes(): Promise<void> {
    return this.pullEntity(
      'CIRCUITO_COMPONENTE',
      (cursor) => this.remote.fetchCircuitoComponentes(cursor, this.batchSize),
      (record) => this.local.applyCircuitoComponente(record)
    )
  }

  private pullPostoDefeitos(): Promise<void> {
    return this.pullEntity(
      'POSTO_DEFEITO',
      (cursor) => this.remote.fetchPostoDefeitos(cursor, this.batchSize),
      (record) => this.local.applyPostoDefeito(record)
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
          this.state.markSuccess(entity, { lastUpdatedAt: record.updatedAt, lastUuid: record.uuid })
        }
        if (records.length < this.batchSize) return
      }
    } catch (error) {
      this.state.markError(entity, error)
    }
  }
}
