import db from '../database/database'
import { loadConfig } from '../config/appConfig'
import { SyncQueueRepository } from './SyncQueueRepository'

export class SyncBackfillService {
  private readonly queue = new SyncQueueRepository()

  runBaseEntitiesBackfill(): void {
    const config = loadConfig()

    if (
      config.database.mode !== 'sqliteSync' ||
      !config.sync.enabled ||
      config.sync.destination !== 'postgres'
    ) {
      return
    }

    db.transaction(() => {
      const setores = db.prepare('SELECT id FROM setores ORDER BY id').all() as Array<{
        id: number
      }>
      for (const setor of setores) this.queue.enqueueSetor(setor.id, 'CREATE', true)

      const subsetores = db.prepare('SELECT id FROM subsetores ORDER BY id').all() as Array<{
        id: number
      }>
      for (const subsetor of subsetores) this.queue.enqueueSubsetor(subsetor.id, 'CREATE', true)

      const postos = db.prepare('SELECT id FROM postos ORDER BY id').all() as Array<{ id: number }>
      for (const posto of postos) this.queue.enqueuePosto(posto.id, 'CREATE', true)
    })()
  }
}
