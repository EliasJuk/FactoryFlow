import type { PoolClient } from 'pg'
import { pool } from '../../database/postgres/connection'
import type { RefugoSyncPayload } from '../sync.types'

type ForeignIds = {
  usuarioId: number | null
  setorId: number
  subsetorId: number
  postoId: number
  circuitoId: number
  importadoPorId: number | null
  createdById: number | null
  updatedById: number | null
  deletedById: number | null
}

export class PostgresRefugoSyncRepository {
  async apply(payload: RefugoSyncPayload): Promise<void> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')
      const ids = await this.resolveForeignIds(client, payload)
      const refugoId = await this.upsertRefugo(client, payload, ids)
      await this.upsertItems(client, refugoId, payload)
      await this.softDeleteMissingItems(client, refugoId, payload)
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  private async resolveForeignIds(
    client: PoolClient,
    payload: RefugoSyncPayload
  ): Promise<ForeignIds> {
    const r = payload.record
    return {
      usuarioId: await this.findOptionalUserId(client, r.usuarioUuid),
      setorId: await this.findRequiredId(client, 'setores', r.setorUuid),
      subsetorId: await this.findRequiredId(client, 'subsetores', r.subsetorUuid),
      postoId: await this.findRequiredId(client, 'postos', r.postoUuid),
      circuitoId: await this.findRequiredId(client, 'circuitos', r.circuitoUuid),
      importadoPorId: await this.findOptionalUserId(client, r.importadoPorUuid),
      createdById: await this.findOptionalUserId(client, r.createdByUuid),
      updatedById: await this.findOptionalUserId(client, r.updatedByUuid),
      deletedById: await this.findOptionalUserId(client, r.deletedByUuid)
    }
  }

  private async upsertRefugo(
    client: PoolClient,
    payload: RefugoSyncPayload,
    ids: ForeignIds
  ): Promise<number> {
    const r = payload.record
    const result = await client.query<{ id: number }>(`
      INSERT INTO refugos (
        uuid, numero_refugo, sigla_setor, ano, sequencia, data_hora,
        turno, matricula_operador, usuario_id, setor_id, subsetor_id,
        posto_id, circuito_id, quantidade_produzida, observacao, status,
        motivo_cancelamento, origem, id_origem, importado_em, importado_por,
        created_at, updated_at, deleted_at, created_by, updated_by, deleted_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
        $18,$19,$20,$21,$22,$23,$24,$25,$26,$27
      )
      ON CONFLICT (uuid) DO UPDATE SET
        numero_refugo = EXCLUDED.numero_refugo,
        sigla_setor = EXCLUDED.sigla_setor,
        ano = EXCLUDED.ano,
        sequencia = EXCLUDED.sequencia,
        data_hora = EXCLUDED.data_hora,
        turno = EXCLUDED.turno,
        matricula_operador = EXCLUDED.matricula_operador,
        usuario_id = EXCLUDED.usuario_id,
        setor_id = EXCLUDED.setor_id,
        subsetor_id = EXCLUDED.subsetor_id,
        posto_id = EXCLUDED.posto_id,
        circuito_id = EXCLUDED.circuito_id,
        quantidade_produzida = EXCLUDED.quantidade_produzida,
        observacao = EXCLUDED.observacao,
        status = EXCLUDED.status,
        motivo_cancelamento = EXCLUDED.motivo_cancelamento,
        origem = EXCLUDED.origem,
        id_origem = EXCLUDED.id_origem,
        importado_em = EXCLUDED.importado_em,
        importado_por = EXCLUDED.importado_por,
        updated_at = EXCLUDED.updated_at,
        deleted_at = EXCLUDED.deleted_at,
        updated_by = EXCLUDED.updated_by,
        deleted_by = EXCLUDED.deleted_by
      RETURNING id
    `, [
      r.uuid, r.numeroRefugo, r.siglaSetor, r.ano, r.sequencia, r.dataHora,
      r.turno, r.matriculaOperador, ids.usuarioId, ids.setorId, ids.subsetorId,
      ids.postoId, ids.circuitoId, r.quantidadeProduzida, r.observacao, r.status,
      r.motivoCancelamento, r.origem, r.idOrigem, r.importadoEm,
      ids.importadoPorId, r.createdAt, r.updatedAt, r.deletedAt,
      ids.createdById, ids.updatedById, ids.deletedById
    ])

    const id = result.rows[0]?.id
    if (!id) throw new Error('PostgreSQL não retornou o ID do refugo.')
    return id
  }

  private async upsertItems(
    client: PoolClient,
    refugoId: number,
    payload: RefugoSyncPayload
  ): Promise<void> {
    for (const item of payload.record.itens) {
      const componenteId = await this.findRequiredId(
        client, 'componentes', item.componenteUuid
      )
      const defeitoId = await this.findRequiredId(
        client, 'defeitos', item.defeitoUuid
      )

      await client.query(`
        INSERT INTO refugo_itens (
          uuid, refugo_id, componente_id, defeito_id, quantidade,
          codigo_componente_snapshot, nome_componente_snapshot,
          codigo_defeito_snapshot, descricao_defeito_snapshot,
          preco_unitario_snapshot, custo_total_snapshot,
          created_at, updated_at, deleted_at,
          created_by, updated_by, deleted_by
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
        )
        ON CONFLICT (uuid) DO UPDATE SET
          refugo_id = EXCLUDED.refugo_id,
          componente_id = EXCLUDED.componente_id,
          defeito_id = EXCLUDED.defeito_id,
          quantidade = EXCLUDED.quantidade,
          codigo_componente_snapshot = EXCLUDED.codigo_componente_snapshot,
          nome_componente_snapshot = EXCLUDED.nome_componente_snapshot,
          codigo_defeito_snapshot = EXCLUDED.codigo_defeito_snapshot,
          descricao_defeito_snapshot = EXCLUDED.descricao_defeito_snapshot,
          preco_unitario_snapshot = EXCLUDED.preco_unitario_snapshot,
          custo_total_snapshot = EXCLUDED.custo_total_snapshot,
          updated_at = EXCLUDED.updated_at,
          deleted_at = EXCLUDED.deleted_at,
          updated_by = EXCLUDED.updated_by,
          deleted_by = EXCLUDED.deleted_by
      `, [
        item.uuid, refugoId, componenteId, defeitoId, item.quantidade,
        item.codigoComponenteSnapshot, item.nomeComponenteSnapshot,
        item.codigoDefeitoSnapshot, item.descricaoDefeitoSnapshot,
        item.precoUnitarioSnapshot, item.custoTotalSnapshot,
        item.createdAt, item.updatedAt, item.deletedAt,
        await this.findOptionalUserId(client, item.createdByUuid),
        await this.findOptionalUserId(client, item.updatedByUuid),
        await this.findOptionalUserId(client, item.deletedByUuid)
      ])
    }
  }

  private async softDeleteMissingItems(
    client: PoolClient,
    refugoId: number,
    payload: RefugoSyncPayload
  ): Promise<void> {
    const uuids = payload.record.itens.map((item) => item.uuid)

    if (uuids.length === 0) {
      await client.query(`
        UPDATE refugo_itens
        SET deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP),
            updated_at = CURRENT_TIMESTAMP
        WHERE refugo_id = $1
      `, [refugoId])
      return
    }

    await client.query(`
      UPDATE refugo_itens
      SET deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
      WHERE refugo_id = $1
        AND NOT (uuid = ANY($2::uuid[]))
    `, [refugoId, uuids])
  }

  private async findRequiredId(
    client: PoolClient,
    table: 'setores' | 'subsetores' | 'postos' | 'circuitos' | 'componentes' | 'defeitos',
    uuid: string
  ): Promise<number> {
    const result = await client.query<{ id: number }>(
      `SELECT id FROM ${table} WHERE uuid = $1 LIMIT 1`,
      [uuid]
    )
    const id = result.rows[0]?.id
    if (!id) {
      throw new Error(`Dependência ausente no PostgreSQL: ${table}/${uuid}`)
    }
    return id
  }

  private async findOptionalUserId(
    client: PoolClient,
    uuid: string | null
  ): Promise<number | null> {
    if (!uuid) return null
    const result = await client.query<{ id: number }>(
      'SELECT id FROM usuarios WHERE uuid = $1 LIMIT 1',
      [uuid]
    )
    return result.rows[0]?.id ?? null
  }
}
