import db from '../database/database'
import { loadConfig } from '../config/appConfig'
import { IdGenerator } from '../shared/ids/IdGenerator'

import type {
  PostoSyncPayload,
  RefugoSyncItemPayload,
  RefugoSyncPayload,
  SetorSyncPayload,
  SubsetorSyncPayload,
  SyncEntity,
  SyncOperation,
  SyncPayload
} from './sync.types'

type RefugoRow = Omit<RefugoSyncPayload['record'], 'itens'>
type RefugoItemRow = RefugoSyncItemPayload

export class SyncQueueRepository {
  private shouldEnqueue(): boolean {
    const config = loadConfig()
    return (
      config.database.mode === 'sqliteSync' &&
      config.sync.enabled &&
      config.sync.destination === 'postgres'
    )
  }

  private installationUuid(): string {
    const row = db
      .prepare('SELECT machine_uuid AS machineUuid FROM sync_installation WHERE id = 1')
      .get() as { machineUuid: string } | undefined

    if (!row) throw new Error('Instalação de sincronização não inicializada.')
    return row.machineUuid
  }

  private enqueue(
    entity: SyncEntity,
    recordUuid: string,
    operation: SyncOperation,
    payload: SyncPayload,
    ifMissing = false
  ): void {
    if (!this.shouldEnqueue()) return

    if (ifMissing) {
      const exists = db
        .prepare('SELECT 1 FROM sync_queue WHERE entity = ? AND record_uuid = ? LIMIT 1')
        .get(entity, recordUuid)
      if (exists) return
    }

    db.prepare(
      `
      INSERT INTO sync_queue (
        uuid, entity, record_uuid, operation, payload,
        status, attempts, max_attempts, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, 'PENDENTE', 0, 10,
        datetime('now','localtime'), datetime('now','localtime')
      )
    `
    ).run(IdGenerator.generate(), entity, recordUuid, operation, JSON.stringify(payload))
  }

  enqueueSetor(id: number, operation: SetorSyncPayload['operation'], ifMissing = false): void {
    if (!this.shouldEnqueue()) return

    const row = db
      .prepare(
        `
      SELECT s.uuid, s.nome, s.sigla, s.ativo,
             s.created_at AS createdAt,
             s.updated_at AS updatedAt,
             s.deleted_at AS deletedAt,
             c.uuid AS createdByUuid,
             u.uuid AS updatedByUuid,
             d.uuid AS deletedByUuid
      FROM setores s
      LEFT JOIN usuarios c ON c.id = s.created_by
      LEFT JOIN usuarios u ON u.id = s.updated_by
      LEFT JOIN usuarios d ON d.id = s.deleted_by
      WHERE s.id = ?
    `
      )
      .get(id) as any

    if (!row) throw new Error('Setor não encontrado para sincronização.')

    const payload: SetorSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'SETOR',
      operation,
      record: { ...row, ativo: Boolean(row.ativo) }
    }

    this.enqueue('SETOR', row.uuid, operation, payload, ifMissing)
  }

  enqueueSubsetor(
    id: number,
    operation: SubsetorSyncPayload['operation'],
    ifMissing = false
  ): void {
    if (!this.shouldEnqueue()) return

    const row = db
      .prepare(
        `
      SELECT ss.uuid, ss.nome, s.uuid AS setorUuid, ss.ativo,
             ss.created_at AS createdAt,
             ss.updated_at AS updatedAt,
             ss.deleted_at AS deletedAt,
             c.uuid AS createdByUuid,
             u.uuid AS updatedByUuid,
             d.uuid AS deletedByUuid
      FROM subsetores ss
      INNER JOIN setores s ON s.id = ss.setor_id
      LEFT JOIN usuarios c ON c.id = ss.created_by
      LEFT JOIN usuarios u ON u.id = ss.updated_by
      LEFT JOIN usuarios d ON d.id = ss.deleted_by
      WHERE ss.id = ?
    `
      )
      .get(id) as any

    if (!row) throw new Error('Subsetor não encontrado para sincronização.')

    const payload: SubsetorSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'SUBSETOR',
      operation,
      record: { ...row, ativo: Boolean(row.ativo) }
    }

    this.enqueue('SUBSETOR', row.uuid, operation, payload, ifMissing)
  }

  enqueuePosto(id: number, operation: PostoSyncPayload['operation'], ifMissing = false): void {
    if (!this.shouldEnqueue()) return

    const row = db
      .prepare(
        `
      SELECT p.uuid, p.nome, ss.uuid AS subsetorUuid, p.ativo,
             p.created_at AS createdAt,
             p.updated_at AS updatedAt,
             p.deleted_at AS deletedAt,
             c.uuid AS createdByUuid,
             u.uuid AS updatedByUuid,
             d.uuid AS deletedByUuid
      FROM postos p
      INNER JOIN subsetores ss ON ss.id = p.subsetor_id
      LEFT JOIN usuarios c ON c.id = p.created_by
      LEFT JOIN usuarios u ON u.id = p.updated_by
      LEFT JOIN usuarios d ON d.id = p.deleted_by
      WHERE p.id = ?
    `
      )
      .get(id) as any

    if (!row) throw new Error('Posto não encontrado para sincronização.')

    const payload: PostoSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'POSTO',
      operation,
      record: { ...row, ativo: Boolean(row.ativo) }
    }

    this.enqueue('POSTO', row.uuid, operation, payload, ifMissing)
  }

  enqueueRefugo(refugoId: number, operation: RefugoSyncPayload['operation']): void {
    if (!this.shouldEnqueue()) return

    const refugo = db
      .prepare(
        `
      SELECT r.uuid, r.numero_refugo as numeroRefugo,
             r.sigla_setor as siglaSetor, r.ano, r.sequencia,
             r.data_hora as dataHora, r.turno,
             r.matricula_operador as matriculaOperador,
             usuario.uuid as usuarioUuid,
             setor.uuid as setorUuid,
             subsetor.uuid as subsetorUuid,
             posto.uuid as postoUuid,
             circuito.uuid as circuitoUuid,
             r.quantidade_produzida as quantidadeProduzida,
             r.observacao, r.status,
             r.motivo_cancelamento as motivoCancelamento,
             r.origem, r.id_origem as idOrigem,
             r.importado_em as importadoEm,
             importador.uuid as importadoPorUuid,
             r.created_at as createdAt,
             r.updated_at as updatedAt,
             r.deleted_at as deletedAt,
             criador.uuid as createdByUuid,
             atualizador.uuid as updatedByUuid,
             excluidor.uuid as deletedByUuid
      FROM refugos r
      INNER JOIN setores setor ON setor.id = r.setor_id
      INNER JOIN subsetores subsetor ON subsetor.id = r.subsetor_id
      INNER JOIN postos posto ON posto.id = r.posto_id
      INNER JOIN circuitos circuito ON circuito.id = r.circuito_id
      LEFT JOIN usuarios usuario ON usuario.id = r.usuario_id
      LEFT JOIN usuarios importador ON importador.id = r.importado_por
      LEFT JOIN usuarios criador ON criador.id = r.created_by
      LEFT JOIN usuarios atualizador ON atualizador.id = r.updated_by
      LEFT JOIN usuarios excluidor ON excluidor.id = r.deleted_by
      WHERE r.id = ?
    `
      )
      .get(refugoId) as RefugoRow | undefined

    if (!refugo) throw new Error('Refugo não encontrado para sincronização.')

    const itens = db
      .prepare(
        `
      SELECT item.uuid,
             componente.uuid as componenteUuid,
             defeito.uuid as defeitoUuid,
             item.quantidade,
             item.codigo_componente_snapshot as codigoComponenteSnapshot,
             item.nome_componente_snapshot as nomeComponenteSnapshot,
             item.codigo_defeito_snapshot as codigoDefeitoSnapshot,
             item.descricao_defeito_snapshot as descricaoDefeitoSnapshot,
             item.preco_unitario_snapshot as precoUnitarioSnapshot,
             item.custo_total_snapshot as custoTotalSnapshot,
             item.created_at as createdAt,
             item.updated_at as updatedAt,
             item.deleted_at as deletedAt,
             criador.uuid as createdByUuid,
             atualizador.uuid as updatedByUuid,
             excluidor.uuid as deletedByUuid
      FROM refugo_itens item
      INNER JOIN componentes componente ON componente.id = item.componente_id
      INNER JOIN defeitos defeito ON defeito.id = item.defeito_id
      LEFT JOIN usuarios criador ON criador.id = item.created_by
      LEFT JOIN usuarios atualizador ON atualizador.id = item.updated_by
      LEFT JOIN usuarios excluidor ON excluidor.id = item.deleted_by
      WHERE item.refugo_id = ?
      ORDER BY item.id
    `
      )
      .all(refugoId) as RefugoItemRow[]

    const payload: RefugoSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'REFUGO',
      operation,
      record: { ...refugo, itens }
    }

    this.enqueue('REFUGO', refugo.uuid, operation, payload)
  }
}
