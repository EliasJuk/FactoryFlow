import { pool } from '../database/postgres/connection'
import type {
  CircuitoComponentePullRecord,
  CircuitoPullRecord,
  ComponentePullRecord,
  DefeitoPullRecord,
  PostoDefeitoPullRecord,
  PostoPullRecord,
  PullCursor,
  RefugoPullItemRecord,
  RefugoPullRecord,
  RoteiroPullRecord,
  SetorPullRecord,
  SubsetorPullRecord,
  UsuarioPullRecord
} from './pull.types'

type RefugoItemPullRow = RefugoPullItemRecord & { refugoUuid: string }

export class PostgresPullRepository {
  async fetchUsuarios(cursor: PullCursor, limit: number): Promise<UsuarioPullRecord[]> {
    const result = await pool.query<UsuarioPullRecord>(
      `
      SELECT
        u.uuid, u.nome, u.matricula, u.perfil,
        u.senha_hash AS "senhaHash",
        u.deve_trocar_senha AS "deveTrocarSenha",
        u.ativo,
        u.created_at AS "createdAt",
        u.updated_at AS "updatedAt",
        u.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM usuarios u
      LEFT JOIN usuarios created_by ON created_by.id = u.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = u.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = u.deleted_by
      ${this.cursorWhere('u')}
      ORDER BY u.updated_at, u.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )
    return this.normalizeRows(result.rows)
  }

  async fetchSetores(cursor: PullCursor, limit: number): Promise<SetorPullRecord[]> {
    const result = await pool.query<SetorPullRecord>(
      `
      SELECT s.uuid, s.nome, s.sigla, s.ativo,
        s.created_at AS "createdAt", s.updated_at AS "updatedAt",
        s.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM setores s
      LEFT JOIN usuarios created_by ON created_by.id = s.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = s.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = s.deleted_by
      ${this.cursorWhere('s')}
      ORDER BY s.updated_at, s.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )
    return this.normalizeRows(result.rows)
  }

  async fetchSubsetores(cursor: PullCursor, limit: number): Promise<SubsetorPullRecord[]> {
    const result = await pool.query<SubsetorPullRecord>(
      `
      SELECT ss.uuid, ss.nome, setor.uuid AS "setorUuid", ss.ativo,
        ss.created_at AS "createdAt", ss.updated_at AS "updatedAt",
        ss.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM subsetores ss
      INNER JOIN setores setor ON setor.id = ss.setor_id
      LEFT JOIN usuarios created_by ON created_by.id = ss.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = ss.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = ss.deleted_by
      ${this.cursorWhere('ss')}
      ORDER BY ss.updated_at, ss.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )
    return this.normalizeRows(result.rows)
  }

  async fetchPostos(cursor: PullCursor, limit: number): Promise<PostoPullRecord[]> {
    const result = await pool.query<PostoPullRecord>(
      `
      SELECT p.uuid, p.nome, subsetor.uuid AS "subsetorUuid", p.ativo,
        p.created_at AS "createdAt", p.updated_at AS "updatedAt",
        p.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM postos p
      INNER JOIN subsetores subsetor ON subsetor.id = p.subsetor_id
      LEFT JOIN usuarios created_by ON created_by.id = p.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = p.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = p.deleted_by
      ${this.cursorWhere('p')}
      ORDER BY p.updated_at, p.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )
    return this.normalizeRows(result.rows)
  }

  async fetchComponentes(cursor: PullCursor, limit: number): Promise<ComponentePullRecord[]> {
    const result = await pool.query<ComponentePullRecord>(
      `
      SELECT c.uuid, c.codigo, c.nome,
        COALESCE((SELECT cp.valor_unitario FROM componentes_precos cp
          WHERE cp.componente_id = c.id ORDER BY cp.id DESC LIMIT 1), 0) AS "precoAtual",
        c.ativo, c.created_at AS "createdAt", c.updated_at AS "updatedAt",
        c.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM componentes c
      LEFT JOIN usuarios created_by ON created_by.id = c.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = c.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = c.deleted_by
      ${this.cursorWhere('c')}
      ORDER BY c.updated_at, c.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )
    return this.normalizeRows(result.rows).map((row) => ({
      ...row,
      precoAtual: Number(row.precoAtual ?? 0)
    }))
  }

  async fetchCircuitos(cursor: PullCursor, limit: number): Promise<CircuitoPullRecord[]> {
    const result = await pool.query<CircuitoPullRecord>(
      `
      SELECT c.uuid, c.codigo, c.nome, c.ativo,
        c.created_at AS "createdAt", c.updated_at AS "updatedAt",
        c.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM circuitos c
      LEFT JOIN usuarios created_by ON created_by.id = c.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = c.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = c.deleted_by
      ${this.cursorWhere('c')}
      ORDER BY c.updated_at, c.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )
    return this.normalizeRows(result.rows)
  }

  async fetchDefeitos(cursor: PullCursor, limit: number): Promise<DefeitoPullRecord[]> {
    const result = await pool.query<DefeitoPullRecord>(
      `
      SELECT d.uuid, d.codigo, d.descricao, d.ativo,
        d.created_at AS "createdAt", d.updated_at AS "updatedAt",
        d.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM defeitos d
      LEFT JOIN usuarios created_by ON created_by.id = d.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = d.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = d.deleted_by
      ${this.cursorWhere('d')}
      ORDER BY d.updated_at, d.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )
    return this.normalizeRows(result.rows)
  }

  async fetchCircuitoComponentes(
    cursor: PullCursor,
    limit: number
  ): Promise<CircuitoComponentePullRecord[]> {
    const result = await pool.query<CircuitoComponentePullRecord>(
      `
      SELECT
        cc.uuid,
        circuito.uuid AS "circuitoUuid",
        componente.uuid AS "componenteUuid",
        cc.quantidade,
        cc.ativo,
        cc.created_at AS "createdAt",
        cc.updated_at AS "updatedAt",
        cc.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM circuito_componentes cc
      INNER JOIN circuitos circuito ON circuito.id = cc.circuito_id
      INNER JOIN componentes componente ON componente.id = cc.componente_id
      LEFT JOIN usuarios created_by ON created_by.id = cc.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = cc.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = cc.deleted_by
      ${this.cursorWhere('cc')}
      ORDER BY cc.updated_at, cc.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )

    return this.normalizeRows(result.rows).map((row) => ({
      ...row,
      quantidade: Number(row.quantidade)
    }))
  }

  async fetchPostoDefeitos(cursor: PullCursor, limit: number): Promise<PostoDefeitoPullRecord[]> {
    const result = await pool.query<PostoDefeitoPullRecord>(
      `
      SELECT
        pd.uuid,
        posto.uuid AS "postoUuid",
        defeito.uuid AS "defeitoUuid",
        pd.ativo,
        pd.created_at AS "createdAt",
        pd.updated_at AS "updatedAt",
        pd.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM posto_defeitos pd
      INNER JOIN postos posto ON posto.id = pd.posto_id
      INNER JOIN defeitos defeito ON defeito.id = pd.defeito_id
      LEFT JOIN usuarios created_by ON created_by.id = pd.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = pd.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = pd.deleted_by
      ${this.cursorWhere('pd')}
      ORDER BY pd.updated_at, pd.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )

    return this.normalizeRows(result.rows)
  }

  async fetchRoteiros(cursor: PullCursor, limit: number): Promise<RoteiroPullRecord[]> {
    const result = await pool.query<RoteiroPullRecord>(
      `
      SELECT
        cpc.uuid,
        circuito.uuid AS "circuitoUuid",
        posto.uuid AS "postoUuid",
        componente.uuid AS "componenteUuid",
        cpc.quantidade,
        cpc.ativo,
        cpc.created_at AS "createdAt",
        cpc.updated_at AS "updatedAt",
        cpc.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM circuito_posto_componentes cpc
      INNER JOIN circuitos circuito ON circuito.id = cpc.circuito_id
      INNER JOIN postos posto ON posto.id = cpc.posto_id
      INNER JOIN componentes componente ON componente.id = cpc.componente_id
      LEFT JOIN usuarios created_by ON created_by.id = cpc.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = cpc.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = cpc.deleted_by
      ${this.cursorWhere('cpc')}
      ORDER BY cpc.updated_at, cpc.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )

    return this.normalizeRows(result.rows).map((row) => ({
      ...row,
      quantidade: Number(row.quantidade)
    }))
  }

  async fetchRefugos(cursor: PullCursor, limit: number): Promise<RefugoPullRecord[]> {
    const result = await pool.query<Omit<RefugoPullRecord, 'itens'>>(
      `
      SELECT
        r.uuid,
        r.numero_refugo AS "numeroRefugo",
        r.sigla_setor AS "siglaSetor",
        r.ano,
        r.sequencia,
        r.data_hora AS "dataHora",
        r.turno,
        r.matricula_operador AS "matriculaOperador",
        usuario.uuid AS "usuarioUuid",
        setor.uuid AS "setorUuid",
        subsetor.uuid AS "subsetorUuid",
        posto.uuid AS "postoUuid",
        circuito.uuid AS "circuitoUuid",
        r.quantidade_produzida AS "quantidadeProduzida",
        r.observacao,
        r.status,
        r.motivo_cancelamento AS "motivoCancelamento",
        r.origem,
        r.id_origem AS "idOrigem",
        r.importado_em AS "importadoEm",
        importador.uuid AS "importadoPorUuid",
        r.created_at AS "createdAt",
        r.updated_at AS "updatedAt",
        r.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM refugos r
      INNER JOIN setores setor ON setor.id = r.setor_id
      INNER JOIN subsetores subsetor ON subsetor.id = r.subsetor_id
      INNER JOIN postos posto ON posto.id = r.posto_id
      INNER JOIN circuitos circuito ON circuito.id = r.circuito_id
      LEFT JOIN usuarios usuario ON usuario.id = r.usuario_id
      LEFT JOIN usuarios importador ON importador.id = r.importado_por
      LEFT JOIN usuarios created_by ON created_by.id = r.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = r.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = r.deleted_by
      ${this.cursorWhere('r')}
      ORDER BY r.updated_at, r.uuid
      LIMIT $3
      `,
      [cursor.lastUpdatedAt, cursor.lastUuid, limit]
    )

    const refugos = this.normalizeRows(result.rows).map((row) => ({
      ...row,
      ano: Number(row.ano),
      sequencia: Number(row.sequencia),
      quantidadeProduzida: Number(row.quantidadeProduzida),
      dataHora: this.normalizeDate(row.dataHora),
      importadoEm: this.normalizeNullableDate(row.importadoEm)
    }))

    if (refugos.length === 0) {
      return []
    }

    const uuids = refugos.map((refugo) => refugo.uuid)
    const itensResult = await pool.query<RefugoItemPullRow>(
      `
      SELECT
        r.uuid AS "refugoUuid",
        item.uuid,
        componente.uuid AS "componenteUuid",
        defeito.uuid AS "defeitoUuid",
        item.quantidade,
        item.codigo_componente_snapshot AS "codigoComponenteSnapshot",
        item.nome_componente_snapshot AS "nomeComponenteSnapshot",
        item.codigo_defeito_snapshot AS "codigoDefeitoSnapshot",
        item.descricao_defeito_snapshot AS "descricaoDefeitoSnapshot",
        item.preco_unitario_snapshot AS "precoUnitarioSnapshot",
        item.custo_total_snapshot AS "custoTotalSnapshot",
        item.created_at AS "createdAt",
        item.updated_at AS "updatedAt",
        item.deleted_at AS "deletedAt",
        created_by.uuid AS "createdByUuid",
        updated_by.uuid AS "updatedByUuid",
        deleted_by.uuid AS "deletedByUuid"
      FROM refugo_itens item
      INNER JOIN refugos r ON r.id = item.refugo_id
      INNER JOIN componentes componente ON componente.id = item.componente_id
      INNER JOIN defeitos defeito ON defeito.id = item.defeito_id
      LEFT JOIN usuarios created_by ON created_by.id = item.created_by
      LEFT JOIN usuarios updated_by ON updated_by.id = item.updated_by
      LEFT JOIN usuarios deleted_by ON deleted_by.id = item.deleted_by
      WHERE r.uuid = ANY($1::uuid[])
      ORDER BY item.id
      `,
      [uuids]
    )

    const itensPorRefugo = new Map<string, RefugoPullItemRecord[]>()

    for (const rawItem of itensResult.rows) {
      const [item] = this.normalizeRows([rawItem])
      const normalizedItem: RefugoPullItemRecord = {
        ...item,
        quantidade: Number(item.quantidade),
        precoUnitarioSnapshot: Number(item.precoUnitarioSnapshot ?? 0),
        custoTotalSnapshot: Number(item.custoTotalSnapshot ?? 0)
      }

      const lista = itensPorRefugo.get(rawItem.refugoUuid) ?? []
      lista.push(normalizedItem)
      itensPorRefugo.set(rawItem.refugoUuid, lista)
    }

    return refugos.map((refugo) => ({
      ...refugo,
      itens: itensPorRefugo.get(refugo.uuid) ?? []
    }))
  }

  private cursorWhere(alias: string): string {
    return `WHERE $1::timestamp IS NULL OR ${alias}.updated_at > $1::timestamp OR (${alias}.updated_at = $1::timestamp AND ${alias}.uuid::text > COALESCE($2, ''))`
  }

  private normalizeRows<T extends { createdAt: unknown; updatedAt: unknown; deletedAt: unknown }>(
    rows: T[]
  ): Array<
    Omit<T, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
      createdAt: string
      updatedAt: string
      deletedAt: string | null
    }
  > {
    return rows.map((row) => ({
      ...row,
      createdAt: this.normalizeDate(row.createdAt),
      updatedAt: this.normalizeDate(row.updatedAt),
      deletedAt: this.normalizeNullableDate(row.deletedAt)
    }))
  }

  private normalizeDate(value: unknown): string {
    if (value instanceof Date) {
      const pad = (part: number, size = 2): string => String(part).padStart(size, '0')

      return [
        `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
        `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}.${pad(
          value.getMilliseconds(),
          3
        )}`
      ].join(' ')
    }

    if (typeof value === 'string') return value

    throw new Error('Data inválida recebida do PostgreSQL.')
  }

  private normalizeNullableDate(value: unknown): string | null {
    if (value === null || value === undefined) return null
    return this.normalizeDate(value)
  }
}
