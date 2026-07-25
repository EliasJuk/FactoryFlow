import db from '../database/database'
import { IdGenerator } from '../shared/ids/IdGenerator'
import type {
  CircuitoComponentePullRecord,
  CircuitoPullRecord,
  ComponentePullRecord,
  DefeitoPullRecord,
  PostoDefeitoPullRecord,
  PostoPullRecord,
  RefugoPullRecord,
  SetorPullRecord,
  SubsetorPullRecord,
  UsuarioPullRecord
} from './pull.types'

export class SqliteRemoteApplyRepository {
  applyUsuario(record: UsuarioPullRecord): void {
    this.applyAuditedEntity(
      `INSERT INTO usuarios (uuid,nome,matricula,perfil,senha_hash,deve_trocar_senha,ativo,created_at,updated_at,deleted_at,created_by,updated_by,deleted_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(uuid) DO UPDATE SET nome=excluded.nome,matricula=excluded.matricula,perfil=excluded.perfil,senha_hash=excluded.senha_hash,deve_trocar_senha=excluded.deve_trocar_senha,ativo=excluded.ativo,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,updated_by=excluded.updated_by,deleted_by=excluded.deleted_by`,
      record,
      [
        record.uuid,
        record.nome,
        record.matricula,
        record.perfil,
        record.senhaHash,
        record.deveTrocarSenha ? 1 : 0,
        record.ativo ? 1 : 0
      ]
    )
  }
  applySetor(record: SetorPullRecord): void {
    this.applyAuditedEntity(
      `INSERT INTO setores (uuid,nome,sigla,ativo,created_at,updated_at,deleted_at,created_by,updated_by,deleted_by) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(uuid) DO UPDATE SET nome=excluded.nome,sigla=excluded.sigla,ativo=excluded.ativo,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,updated_by=excluded.updated_by,deleted_by=excluded.deleted_by`,
      record,
      [record.uuid, record.nome, record.sigla, record.ativo ? 1 : 0]
    )
  }
  applySubsetor(record: SubsetorPullRecord): void {
    const setorId = this.requiredId('setores', record.setorUuid)
    this.applyAuditedEntity(
      `INSERT INTO subsetores (uuid,nome,setor_id,ativo,created_at,updated_at,deleted_at,created_by,updated_by,deleted_by) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(uuid) DO UPDATE SET nome=excluded.nome,setor_id=excluded.setor_id,ativo=excluded.ativo,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,updated_by=excluded.updated_by,deleted_by=excluded.deleted_by`,
      record,
      [record.uuid, record.nome, setorId, record.ativo ? 1 : 0]
    )
  }
  applyPosto(record: PostoPullRecord): void {
    const subsetorId = this.requiredId('subsetores', record.subsetorUuid)
    this.applyAuditedEntity(
      `INSERT INTO postos (uuid,nome,subsetor_id,ativo,created_at,updated_at,deleted_at,created_by,updated_by,deleted_by) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(uuid) DO UPDATE SET nome=excluded.nome,subsetor_id=excluded.subsetor_id,ativo=excluded.ativo,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,updated_by=excluded.updated_by,deleted_by=excluded.deleted_by`,
      record,
      [record.uuid, record.nome, subsetorId, record.ativo ? 1 : 0]
    )
  }
  applyComponente(record: ComponentePullRecord): void {
    db.transaction(() => {
      db.prepare(
        `INSERT INTO componentes (uuid,codigo,nome,ativo,created_at,updated_at,deleted_at,created_by,updated_by,deleted_by) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(uuid) DO UPDATE SET codigo=excluded.codigo,nome=excluded.nome,ativo=excluded.ativo,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,updated_by=excluded.updated_by,deleted_by=excluded.deleted_by`
      ).run(
        record.uuid,
        record.codigo,
        record.nome,
        record.ativo ? 1 : 0,
        record.createdAt,
        record.updatedAt,
        record.deletedAt,
        this.userId(record.createdByUuid),
        this.userId(record.updatedByUuid),
        this.userId(record.deletedByUuid)
      )
      this.applyCurrentPrice(this.requiredId('componentes', record.uuid), record.precoAtual)
    })()
  }
  applyCircuito(record: CircuitoPullRecord): void {
    this.applyAuditedEntity(
      `INSERT INTO circuitos (uuid,codigo,nome,ativo,created_at,updated_at,deleted_at,created_by,updated_by,deleted_by) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(uuid) DO UPDATE SET codigo=excluded.codigo,nome=excluded.nome,ativo=excluded.ativo,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,updated_by=excluded.updated_by,deleted_by=excluded.deleted_by`,
      record,
      [record.uuid, record.codigo, record.nome, record.ativo ? 1 : 0]
    )
  }
  applyDefeito(record: DefeitoPullRecord): void {
    this.applyAuditedEntity(
      `INSERT INTO defeitos (uuid,codigo,descricao,ativo,created_at,updated_at,deleted_at,created_by,updated_by,deleted_by) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(uuid) DO UPDATE SET codigo=excluded.codigo,descricao=excluded.descricao,ativo=excluded.ativo,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,updated_by=excluded.updated_by,deleted_by=excluded.deleted_by`,
      record,
      [record.uuid, record.codigo, record.descricao, record.ativo ? 1 : 0]
    )
  }

  applyCircuitoComponente(record: CircuitoComponentePullRecord): void {
    const circuitoId = this.requiredId('circuitos', record.circuitoUuid)
    const componenteId = this.requiredId('componentes', record.componenteUuid)

    this.applyAuditedEntity(
      `
      INSERT INTO circuito_componentes (
        uuid, circuito_id, componente_id, quantidade, ativo,
        created_at, updated_at, deleted_at,
        created_by, updated_by, deleted_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        circuito_id = excluded.circuito_id,
        componente_id = excluded.componente_id,
        quantidade = excluded.quantidade,
        ativo = excluded.ativo,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        updated_by = excluded.updated_by,
        deleted_by = excluded.deleted_by
      `,
      record,
      [record.uuid, circuitoId, componenteId, record.quantidade, record.ativo ? 1 : 0]
    )
  }

  applyPostoDefeito(record: PostoDefeitoPullRecord): void {
    const postoId = this.requiredId('postos', record.postoUuid)
    const defeitoId = this.requiredId('defeitos', record.defeitoUuid)

    this.applyAuditedEntity(
      `
      INSERT INTO posto_defeitos (
        uuid, posto_id, defeito_id, ativo,
        created_at, updated_at, deleted_at,
        created_by, updated_by, deleted_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        posto_id = excluded.posto_id,
        defeito_id = excluded.defeito_id,
        ativo = excluded.ativo,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        updated_by = excluded.updated_by,
        deleted_by = excluded.deleted_by
      `,
      record,
      [record.uuid, postoId, defeitoId, record.ativo ? 1 : 0]
    )
  }

  applyRefugo(record: RefugoPullRecord): void {
    db.transaction(() => {
      const usuarioId = this.userId(record.usuarioUuid)
      const setorId = this.requiredId('setores', record.setorUuid)
      const subsetorId = this.requiredId('subsetores', record.subsetorUuid)
      const postoId = this.requiredId('postos', record.postoUuid)
      const circuitoId = this.requiredId('circuitos', record.circuitoUuid)
      const importadoPor = this.userId(record.importadoPorUuid)

      db.prepare(
        `
        INSERT INTO refugos (
          uuid,
          numero_refugo,
          sigla_setor,
          ano,
          sequencia,
          data_hora,
          turno,
          matricula_operador,
          usuario_id,
          setor_id,
          subsetor_id,
          posto_id,
          circuito_id,
          quantidade_produzida,
          observacao,
          status,
          motivo_cancelamento,
          origem,
          id_origem,
          importado_em,
          importado_por,
          created_at,
          updated_at,
          deleted_at,
          created_by,
          updated_by,
          deleted_by
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        )
        ON CONFLICT(uuid) DO UPDATE SET
          numero_refugo = excluded.numero_refugo,
          sigla_setor = excluded.sigla_setor,
          ano = excluded.ano,
          sequencia = excluded.sequencia,
          data_hora = excluded.data_hora,
          turno = excluded.turno,
          matricula_operador = excluded.matricula_operador,
          usuario_id = excluded.usuario_id,
          setor_id = excluded.setor_id,
          subsetor_id = excluded.subsetor_id,
          posto_id = excluded.posto_id,
          circuito_id = excluded.circuito_id,
          quantidade_produzida = excluded.quantidade_produzida,
          observacao = excluded.observacao,
          status = excluded.status,
          motivo_cancelamento = excluded.motivo_cancelamento,
          origem = excluded.origem,
          id_origem = excluded.id_origem,
          importado_em = excluded.importado_em,
          importado_por = excluded.importado_por,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          updated_by = excluded.updated_by,
          deleted_by = excluded.deleted_by
        `
      ).run(
        record.uuid,
        record.numeroRefugo,
        record.siglaSetor,
        record.ano,
        record.sequencia,
        record.dataHora,
        record.turno,
        record.matriculaOperador,
        usuarioId,
        setorId,
        subsetorId,
        postoId,
        circuitoId,
        record.quantidadeProduzida,
        record.observacao,
        record.status,
        record.motivoCancelamento,
        record.origem,
        record.idOrigem,
        record.importadoEm,
        importadoPor,
        record.createdAt,
        record.updatedAt,
        record.deletedAt,
        this.userId(record.createdByUuid),
        this.userId(record.updatedByUuid),
        this.userId(record.deletedByUuid)
      )

      const refugoId = this.requiredId('refugos', record.uuid)

      const upsertItem = db.prepare(
        `
        INSERT INTO refugo_itens (
          uuid,
          refugo_id,
          componente_id,
          defeito_id,
          quantidade,
          codigo_componente_snapshot,
          nome_componente_snapshot,
          codigo_defeito_snapshot,
          descricao_defeito_snapshot,
          preco_unitario_snapshot,
          custo_total_snapshot,
          created_at,
          updated_at,
          deleted_at,
          created_by,
          updated_by,
          deleted_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(uuid) DO UPDATE SET
          refugo_id = excluded.refugo_id,
          componente_id = excluded.componente_id,
          defeito_id = excluded.defeito_id,
          quantidade = excluded.quantidade,
          codigo_componente_snapshot = excluded.codigo_componente_snapshot,
          nome_componente_snapshot = excluded.nome_componente_snapshot,
          codigo_defeito_snapshot = excluded.codigo_defeito_snapshot,
          descricao_defeito_snapshot = excluded.descricao_defeito_snapshot,
          preco_unitario_snapshot = excluded.preco_unitario_snapshot,
          custo_total_snapshot = excluded.custo_total_snapshot,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          updated_by = excluded.updated_by,
          deleted_by = excluded.deleted_by
        `
      )

      for (const item of record.itens) {
        upsertItem.run(
          item.uuid,
          refugoId,
          this.requiredId('componentes', item.componenteUuid),
          this.requiredId('defeitos', item.defeitoUuid),
          item.quantidade,
          item.codigoComponenteSnapshot,
          item.nomeComponenteSnapshot,
          item.codigoDefeitoSnapshot,
          item.descricaoDefeitoSnapshot,
          item.precoUnitarioSnapshot,
          item.custoTotalSnapshot,
          item.createdAt,
          item.updatedAt,
          item.deletedAt,
          this.userId(item.createdByUuid),
          this.userId(item.updatedByUuid),
          this.userId(item.deletedByUuid)
        )
      }
    })()
  }

  private applyAuditedEntity(sql: string, record: any, values: unknown[]): void {
    db.transaction(() => {
      db.prepare(sql).run(
        ...values,
        record.createdAt,
        record.updatedAt,
        record.deletedAt,
        this.userId(record.createdByUuid),
        this.userId(record.updatedByUuid),
        this.userId(record.deletedByUuid)
      )
    })()
  }
  private applyCurrentPrice(componenteId: number, value: number): void {
    const normalized = Number.isFinite(value) ? value : 0
    const current = db
      .prepare(
        `SELECT id, valor_unitario AS valorUnitario FROM componentes_precos WHERE componente_id=? AND ativo=1 AND vigencia_fim IS NULL ORDER BY id DESC LIMIT 1`
      )
      .get(componenteId) as { id: number; valorUnitario: number } | undefined
    if (current && Number(current.valorUnitario) === normalized) return
    if (current)
      db.prepare(
        `UPDATE componentes_precos SET ativo=0,vigencia_fim=date('now','localtime') WHERE id=?`
      ).run(current.id)
    if (normalized > 0)
      db.prepare(
        `INSERT INTO componentes_precos (uuid,componente_id,valor_unitario,vigencia_inicio,vigencia_fim,ativo,criado_em) VALUES (?,?,?,date('now','localtime'),NULL,1,datetime('now','localtime'))`
      ).run(IdGenerator.generate(), componenteId, normalized)
  }
  private requiredId(
    table:
      'setores' | 'subsetores' | 'postos' | 'componentes' | 'circuitos' | 'defeitos' | 'refugos',
    uuid: string
  ): number {
    const row = db.prepare(`SELECT id FROM ${table} WHERE uuid=? LIMIT 1`).get(uuid) as
      { id: number } | undefined
    if (!row) throw new Error(`Dependência ausente no SQLite: ${table}/${uuid}`)
    return row.id
  }
  private userId(uuid: string | null): number | null {
    if (!uuid) return null
    const row = db.prepare('SELECT id FROM usuarios WHERE uuid=? LIMIT 1').get(uuid) as
      { id: number } | undefined
    return row?.id ?? null
  }
}
