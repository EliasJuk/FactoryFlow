import db from '../database/database'
import { loadConfig } from '../config/appConfig'
import { IdGenerator } from '../shared/ids/IdGenerator'

import type {
  RefugoSyncItemPayload,
  RefugoSyncPayload,
  SyncOperation
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

  enqueueRefugo(refugoId: number, operation: SyncOperation): void {
    if (!this.shouldEnqueue()) return

    const installation = db
      .prepare(
        `
          SELECT machine_uuid as machineUuid
          FROM sync_installation
          WHERE id = 1
        `
      )
      .get() as { machineUuid: string } | undefined

    if (!installation) {
      throw new Error('Instalação de sincronização não inicializada.')
    }

    const refugo = db
      .prepare(
        `
          SELECT
            r.uuid,
            r.numero_refugo as numeroRefugo,
            r.sigla_setor as siglaSetor,
            r.ano,
            r.sequencia,
            r.data_hora as dataHora,
            r.turno,
            r.matricula_operador as matriculaOperador,
            usuario.uuid as usuarioUuid,
            setor.uuid as setorUuid,
            subsetor.uuid as subsetorUuid,
            posto.uuid as postoUuid,
            circuito.uuid as circuitoUuid,
            r.quantidade_produzida as quantidadeProduzida,
            r.observacao,
            r.status,
            r.motivo_cancelamento as motivoCancelamento,
            r.origem,
            r.id_origem as idOrigem,
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

    if (!refugo) {
      throw new Error('Refugo não encontrado para sincronização.')
    }

    const itens = db
      .prepare(
        `
          SELECT
            item.uuid,
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
      sourceInstallationUuid: installation.machineUuid,
      entity: 'REFUGO',
      operation,
      record: { ...refugo, itens }
    }

    db.prepare(
      `
        INSERT INTO sync_queue (
          uuid,
          entity,
          record_uuid,
          operation,
          payload,
          status,
          attempts,
          max_attempts,
          created_at,
          updated_at
        ) VALUES (
          ?,
          'REFUGO',
          ?,
          ?,
          ?,
          'PENDENTE',
          0,
          10,
          datetime('now','localtime'),
          datetime('now','localtime')
        )
      `
    ).run(IdGenerator.generate(), refugo.uuid, operation, JSON.stringify(payload))
  }
}
