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
      const usuarios = db.prepare('SELECT id FROM usuarios ORDER BY id').all() as Array<{
        id: number
      }>
      for (const usuario of usuarios) {
        this.queue.enqueueUsuario(usuario.id, 'CREATE', true)
      }

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

      const componentes = db.prepare('SELECT id FROM componentes ORDER BY id').all() as Array<{
        id: number
      }>
      for (const componente of componentes) {
        this.queue.enqueueComponente(componente.id, 'CREATE', true)
      }

      const circuitos = db.prepare('SELECT id FROM circuitos ORDER BY id').all() as Array<{
        id: number
      }>
      for (const circuito of circuitos) {
        this.queue.enqueueCircuito(circuito.id, 'CREATE', true)
      }

      const circuitoComponentes = db
        .prepare('SELECT id FROM circuito_componentes ORDER BY id')
        .all() as Array<{ id: number }>
      for (const circuitoComponente of circuitoComponentes) {
        this.queue.enqueueCircuitoComponente(circuitoComponente.id, 'CREATE', true)
      }

      const defeitos = db.prepare('SELECT id FROM defeitos ORDER BY id').all() as Array<{
        id: number
      }>
      for (const defeito of defeitos) {
        this.queue.enqueueDefeito(defeito.id, 'CREATE', true)
      }

      const roteiros = db
        .prepare('SELECT id FROM circuito_posto_componentes ORDER BY id')
        .all() as Array<{ id: number }>
      for (const roteiro of roteiros) {
        this.queue.enqueueRoteiro(roteiro.id, 'CREATE', true)
      }

      const postoDefeitos = db.prepare('SELECT id FROM posto_defeitos ORDER BY id').all() as Array<{
        id: number
      }>
      for (const postoDefeito of postoDefeitos) {
        this.queue.enqueuePostoDefeito(postoDefeito.id, 'CREATE', true)
      }
    })()
  }
}
