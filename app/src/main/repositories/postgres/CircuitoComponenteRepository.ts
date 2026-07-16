import { pool } from '../../database/postgres/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

const USUARIO_SISTEMA_ID = 1

export type AdicionarCircuitoComponenteResultado =
  | {
      sucesso: true
      mensagem: string
    }
  | {
      sucesso: false
      codigo: 'QUANTIDADE_INVALIDA' | 'COMPONENTE_JA_VINCULADO'
      mensagem: string
    }

export interface CircuitoComponente {
  id: number
  uuid: string
  circuitoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean
  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null
  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null
  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}

export class CircuitoComponenteRepository {
  async listarPorCircuito(circuitoId: number): Promise<CircuitoComponente[]> {
    const result = await pool.query<CircuitoComponente>(
      `
      SELECT
        cc.id,
        cc.uuid,
        cc.circuito_id AS "circuitoId",
        cc.componente_id AS "componenteId",
        c.codigo AS "codigoComponente",
        c.nome AS "nomeComponente",
        cc.quantidade,
        cc.ativo,
        cc.created_at AS "createdAt",
        cc.updated_at AS "updatedAt",
        cc.deleted_at AS "deletedAt",
        cc.created_by AS "createdBy",
        cc.updated_by AS "updatedBy",
        cc.deleted_by AS "deletedBy",
        uc.nome AS "createdByNome",
        uu.nome AS "updatedByNome",
        ud.nome AS "deletedByNome"
      FROM circuito_componentes cc
      INNER JOIN componentes c ON c.id = cc.componente_id
      LEFT JOIN usuarios uc ON uc.id = cc.created_by
      LEFT JOIN usuarios uu ON uu.id = cc.updated_by
      LEFT JOIN usuarios ud ON ud.id = cc.deleted_by
      WHERE cc.circuito_id = $1 AND cc.ativo = true
      ORDER BY c.codigo
    `,
      [circuitoId]
    )

    return result.rows.map((item) => ({ ...item, ativo: Boolean(item.ativo) }))
  }

  async adicionar(
    circuitoId: number,
    componenteId: number,
    quantidade: number,
    usuarioId: number = USUARIO_SISTEMA_ID
  ): Promise<AdicionarCircuitoComponenteResultado> {
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return {
        sucesso: false,
        codigo: 'QUANTIDADE_INVALIDA',
        mensagem: 'Informe uma quantidade inteira maior que zero.'
      }
    }

    const existente = await pool.query<{ id: number; ativo: boolean }>(
      `
      SELECT id, ativo
      FROM circuito_componentes
      WHERE circuito_id = $1 AND componente_id = $2
      ORDER BY id DESC
      LIMIT 1
    `,
      [circuitoId, componenteId]
    )

    const vinculo = existente.rows[0]

    if (vinculo?.ativo) {
      return {
        sucesso: false,
        codigo: 'COMPONENTE_JA_VINCULADO',
        mensagem: 'Este componente já está vinculado ao circuito selecionado.'
      }
    }

    if (vinculo) {
      await pool.query(
        `
        UPDATE circuito_componentes
        SET
          quantidade = $1,
          ativo = true,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $2,
          deleted_at = NULL,
          deleted_by = NULL
        WHERE id = $3
      `,
        [quantidade, usuarioId, vinculo.id]
      )
      return {
        sucesso: true,
        mensagem: 'Componente restaurado e vinculado ao circuito com sucesso.'
      }
    }

    await pool.query(
      `
      INSERT INTO circuito_componentes (
        uuid, circuito_id, componente_id, quantidade, ativo,
        created_at, updated_at, created_by, updated_by
      )
      VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $5, $5)
    `,
      [IdGenerator.generate(), circuitoId, componenteId, quantidade, usuarioId]
    )

    return {
      sucesso: true,
      mensagem: 'Componente vinculado ao circuito com sucesso.'
    }
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
      UPDATE circuito_componentes
      SET quantidade = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
      WHERE id = $3 AND ativo = true
    `,
      [quantidade, usuarioId, id]
    )
  }

  async remover(id: number, usuarioId: number = USUARIO_SISTEMA_ID): Promise<void> {
    await pool.query(
      `
      UPDATE circuito_componentes
      SET
        ativo = false,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $1,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by = $1
      WHERE id = $2 AND ativo = true
    `,
      [usuarioId, id]
    )
  }

  async restaurar(id: number, usuarioId: number = USUARIO_SISTEMA_ID): Promise<void> {
    await pool.query(
      `
      UPDATE circuito_componentes
      SET
        ativo = true,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $1,
        deleted_at = NULL,
        deleted_by = NULL
      WHERE id = $2 AND ativo = false
    `,
      [usuarioId, id]
    )
  }
}