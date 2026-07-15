import { pool } from '../../database/postgres/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

const USUARIO_SISTEMA_ID = 1

export interface RoteiroComponente {
  id: number
  uuid: string
  circuitoId: number
  postoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
  createdBy: number | null
  updatedBy: number | null
  deletedBy: number | null
  createdByNome: string | null
  updatedByNome: string | null
  deletedByNome: string | null
}

export interface CircuitoPorPosto {
  circuitoId: number
  codigoCircuito: string
  nomeCircuito: string
  postoId: number
  postoNome: string
  subsetorNome: string
  totalComponentes: number
}

type RoteiroComponenteRow = {
  id: number
  uuid: string
  circuitoId: number
  postoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean
  created_at: string | Date | null
  updated_at: string | Date | null
  deleted_at: string | Date | null
  created_by: number | null
  updated_by: number | null
  deleted_by: number | null
  created_by_nome: string | null
  updated_by_nome: string | null
  deleted_by_nome: string | null
}

export class RoteiroRepository {
  private mapearData(valor: string | Date | null): string | null {
    if (!valor) return null
    return valor instanceof Date ? valor.toISOString() : valor
  }

  private mapear(item: RoteiroComponenteRow): RoteiroComponente {
    return {
      id: item.id,
      uuid: item.uuid,
      circuitoId: item.circuitoId,
      postoId: item.postoId,
      componenteId: item.componenteId,
      codigoComponente: item.codigoComponente,
      nomeComponente: item.nomeComponente,
      quantidade: item.quantidade,
      ativo: Boolean(item.ativo),
      createdAt: this.mapearData(item.created_at),
      updatedAt: this.mapearData(item.updated_at),
      deletedAt: this.mapearData(item.deleted_at),
      createdBy: item.created_by,
      updatedBy: item.updated_by,
      deletedBy: item.deleted_by,
      createdByNome: item.created_by_nome,
      updatedByNome: item.updated_by_nome,
      deletedByNome: item.deleted_by_nome
    }
  }

  private consultaItensBase(): string {
    return `
      SELECT
        cpc.id,
        cpc.uuid,
        cpc.circuito_id AS "circuitoId",
        cpc.posto_id AS "postoId",
        cpc.componente_id AS "componenteId",
        comp.codigo AS "codigoComponente",
        comp.nome AS "nomeComponente",
        cpc.quantidade,
        cpc.ativo,
        cpc.created_at,
        cpc.updated_at,
        cpc.deleted_at,
        cpc.created_by,
        cpc.updated_by,
        cpc.deleted_by,
        criado.nome AS created_by_nome,
        atualizado.nome AS updated_by_nome,
        removido.nome AS deleted_by_nome
      FROM circuito_posto_componentes cpc
      INNER JOIN componentes comp ON comp.id = cpc.componente_id
      LEFT JOIN usuarios criado ON criado.id = cpc.created_by
      LEFT JOIN usuarios atualizado ON atualizado.id = cpc.updated_by
      LEFT JOIN usuarios removido ON removido.id = cpc.deleted_by
    `
  }

  async listarCircuitosPorPosto(postoId: number, busca = ''): Promise<CircuitoPorPosto[]> {
    const termo = `%${busca}%`

    const result = await pool.query<CircuitoPorPosto>(
      `
        SELECT
          c.id AS "circuitoId",
          c.codigo AS "codigoCircuito",
          c.nome AS "nomeCircuito",
          p.id AS "postoId",
          p.nome AS "postoNome",
          sub.nome AS "subsetorNome",
          COUNT(cpc.id)::int AS "totalComponentes"
        FROM circuito_posto_componentes cpc
        INNER JOIN circuitos c ON c.id = cpc.circuito_id
        INNER JOIN postos p ON p.id = cpc.posto_id
        INNER JOIN subsetores sub ON sub.id = p.subsetor_id
        WHERE cpc.posto_id = $1
          AND cpc.ativo = true
          AND (
            $2 = ''
            OR c.codigo ILIKE $3
            OR c.nome ILIKE $4
          )
        GROUP BY c.id, c.codigo, c.nome, p.id, p.nome, sub.nome
        ORDER BY c.codigo
      `,
      [postoId, busca, termo, termo]
    )

    return result.rows
  }

  async listarPorCircuitoEPosto(circuitoId: number, postoId: number): Promise<RoteiroComponente[]> {
    const result = await pool.query<RoteiroComponenteRow>(
      `
        ${this.consultaItensBase()}
        WHERE cpc.circuito_id = $1
          AND cpc.posto_id = $2
          AND cpc.ativo = true
        ORDER BY comp.codigo
      `,
      [circuitoId, postoId]
    )

    return result.rows.map((item) => this.mapear(item))
  }

  async adicionar(
    circuitoId: number,
    postoId: number,
    componenteId: number,
    quantidade: number,
    usuarioId: number = USUARIO_SISTEMA_ID
  ): Promise<void> {
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      throw new Error('QUANTIDADE_INVALIDA')
    }

    const existente = await pool.query<{ id: number }>(
      `
        SELECT id
        FROM circuito_posto_componentes
        WHERE circuito_id = $1
          AND posto_id = $2
          AND componente_id = $3
        LIMIT 1
      `,
      [circuitoId, postoId, componenteId]
    )

    if (existente.rows[0]) {
      await pool.query(
        `
          UPDATE circuito_posto_componentes
          SET
            quantidade = $1,
            ativo = true,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $2,
            deleted_at = NULL,
            deleted_by = NULL
          WHERE id = $3
        `,
        [quantidade, usuarioId, existente.rows[0].id]
      )

      return
    }

    await pool.query(
      `
        INSERT INTO circuito_posto_componentes (
          uuid,
          circuito_id,
          posto_id,
          componente_id,
          quantidade,
          ativo,
          created_at,
          updated_at,
          created_by,
          updated_by
        )
        VALUES (
          $1, $2, $3, $4, $5, true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          $6,
          $6
        )
      `,
      [IdGenerator.generate(), circuitoId, postoId, componenteId, quantidade, usuarioId]
    )
  }

  async editarQuantidade(
    id: number,
    quantidade: number,
    usuarioId: number = USUARIO_SISTEMA_ID
  ): Promise<void> {
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      throw new Error('QUANTIDADE_INVALIDA')
    }

    await pool.query(
      `
        UPDATE circuito_posto_componentes
        SET
          quantidade = $1,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $2
        WHERE id = $3
          AND ativo = true
      `,
      [quantidade, usuarioId, id]
    )
  }

  async remover(id: number, usuarioId: number = USUARIO_SISTEMA_ID): Promise<void> {
    await pool.query(
      `
        UPDATE circuito_posto_componentes
        SET
          ativo = false,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1,
          deleted_at = CURRENT_TIMESTAMP,
          deleted_by = $1
        WHERE id = $2
      `,
      [usuarioId, id]
    )
  }

  async listarTodos(): Promise<RoteiroComponente[]> {
    const result = await pool.query<RoteiroComponenteRow>(`
      ${this.consultaItensBase()}
      WHERE cpc.ativo = true
      ORDER BY comp.codigo
    `)

    return result.rows.map((item) => this.mapear(item))
  }
}
