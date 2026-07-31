import { pool } from '../../database/postgres/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

export interface Componente {
  id: number
  uuid: string
  codigo: string
  nome: string
  precoAtual: number
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

type ComponenteRow = {
  id: number
  uuid: string
  codigo: string
  nome: string
  preco_atual: string | number
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

export class ComponenteRepository {
  private mapearData(valor: string | Date | null): string | null {
    if (!valor) return null
    return valor instanceof Date ? valor.toISOString() : valor
  }

  private mapear(componente: ComponenteRow): Componente {
    return {
      id: componente.id,
      uuid: componente.uuid,
      codigo: componente.codigo,
      nome: componente.nome,
      precoAtual: Number(componente.preco_atual ?? 0),
      ativo: Boolean(componente.ativo),
      createdAt: this.mapearData(componente.created_at),
      updatedAt: this.mapearData(componente.updated_at),
      deletedAt: this.mapearData(componente.deleted_at),
      createdBy: componente.created_by,
      updatedBy: componente.updated_by,
      deletedBy: componente.deleted_by,
      createdByNome: componente.created_by_nome,
      updatedByNome: componente.updated_by_nome,
      deletedByNome: componente.deleted_by_nome
    }
  }

  private consultaBase(): string {
    return `
      SELECT
        c.id,
        c.uuid,
        c.codigo,
        c.nome,
        COALESCE(cp.valor_unitario, 0) AS preco_atual,
        c.ativo,
        c.created_at,
        c.updated_at,
        c.deleted_at,
        c.created_by,
        c.updated_by,
        c.deleted_by,
        criado.nome AS created_by_nome,
        atualizado.nome AS updated_by_nome,
        removido.nome AS deleted_by_nome
      FROM componentes c
      LEFT JOIN LATERAL (
        SELECT valor_unitario
        FROM componentes_precos
        WHERE componente_id = c.id
        ORDER BY id DESC
        LIMIT 1
      ) cp ON true
      LEFT JOIN usuarios criado ON criado.id = c.created_by
      LEFT JOIN usuarios atualizado ON atualizado.id = c.updated_by
      LEFT JOIN usuarios removido ON removido.id = c.deleted_by
    `
  }

  async listar(): Promise<Componente[]> {
    const result = await pool.query<ComponenteRow>(`
      ${this.consultaBase()}
      WHERE c.ativo = true
      ORDER BY c.codigo
    `)

    return result.rows.map((componente) => this.mapear(componente))
  }

  async listarInativos(): Promise<Componente[]> {
    const result = await pool.query<ComponenteRow>(`
      ${this.consultaBase()}
      WHERE c.ativo = false
      ORDER BY c.codigo
    `)

    return result.rows.map((componente) => this.mapear(componente))
  }

  async criar(codigo: string, nome: string, precoAtual: number, usuarioId: number): Promise<void> {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const existente = await pool.query<{ id: number; ativo: boolean }>(
      `
        SELECT id, ativo
        FROM componentes
        WHERE codigo = $1
        LIMIT 1
      `,
      [codigoFormatado]
    )

    if (existente.rows[0]?.ativo === true) {
      throw new Error('COMPONENTE_DUPLICADO')
    }

    if (existente.rows[0]?.ativo === false) {
      throw new Error(
        'Já existe um componente inativo com este código. Restaure o componente em vez de criar outro.'
      )
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const result = await client.query<{ id: number }>(
        `
          INSERT INTO componentes (
            uuid,
            codigo,
            nome,
            ativo,
            created_at,
            updated_at,
            created_by,
            updated_by
          )
          VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $4, $4)
          RETURNING id
        `,
        [IdGenerator.generate(), codigoFormatado, nomeFormatado, usuarioId]
      )

      if (precoAtual > 0) {
        await this.atualizarPreco(result.rows[0].id, precoAtual, client)
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async editar(
    id: number,
    codigo: string,
    nome: string,
    precoAtual: number,
    usuarioId: number
  ): Promise<void> {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const duplicado = await pool.query<{ id: number; ativo: boolean }>(
      `
        SELECT id, ativo
        FROM componentes
        WHERE codigo = $1
          AND id <> $2
        LIMIT 1
      `,
      [codigoFormatado, id]
    )

    if (duplicado.rows[0]?.ativo === true) {
      throw new Error('COMPONENTE_DUPLICADO')
    }

    if (duplicado.rows[0]?.ativo === false) {
      throw new Error(
        'Já existe um componente inativo com este código. Altere o código ou restaure o componente inativo.'
      )
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      await client.query(
        `
          UPDATE componentes
          SET
            codigo = $1,
            nome = $2,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $3
          WHERE id = $4
        `,
        [codigoFormatado, nomeFormatado, usuarioId, id]
      )

      await this.atualizarPreco(id, precoAtual, client)

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  private async atualizarPreco(
    componenteId: number,
    valorUnitario: number,
    executor: { query: (text: string, params?: unknown[]) => Promise<unknown> }
  ): Promise<void> {
    const valor = Number(valorUnitario) || 0

    const atualResult = (await executor.query(
      `
        SELECT id, valor_unitario
        FROM componentes_precos
        WHERE componente_id = $1
          AND ativo = true
          AND vigencia_fim IS NULL
        ORDER BY id DESC
        LIMIT 1
      `,
      [componenteId]
    )) as { rows: Array<{ id: number; valor_unitario: string | number }> }

    const atual = atualResult.rows[0]

    if (atual && Number(atual.valor_unitario) === valor) {
      return
    }

    if (atual) {
      await executor.query(
        `
          UPDATE componentes_precos
          SET ativo = false, vigencia_fim = CURRENT_DATE
          WHERE id = $1
        `,
        [atual.id]
      )
    }

    if (valor > 0) {
      await executor.query(
        `
          INSERT INTO componentes_precos (
            uuid,
            componente_id,
            valor_unitario,
            vigencia_inicio,
            vigencia_fim,
            ativo,
            criado_em
          )
          VALUES ($1, $2, $3, CURRENT_DATE, NULL, true, CURRENT_TIMESTAMP)
        `,
        [IdGenerator.generate(), componenteId, valor]
      )
    }
  }

  async excluir(id: number, usuarioId: number): Promise<void> {
    await pool.query(
      `
        UPDATE componentes
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

  async restaurar(id: number, usuarioId: number): Promise<void> {
    await pool.query(
      `
        UPDATE componentes
        SET
          ativo = true,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1,
          deleted_at = NULL,
          deleted_by = NULL
        WHERE id = $2
      `,
      [usuarioId, id]
    )
  }

  async excluirPermanente(id: number): Promise<void> {
    const verificacoes = await Promise.all([
      pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM circuito_componentes WHERE componente_id = $1`,
        [id]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM circuito_posto_componentes WHERE componente_id = $1`,
        [id]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM refugo_itens WHERE componente_id = $1`,
        [id]
      )
    ])

    if (verificacoes.some((resultado) => Number(resultado.rows[0]?.total ?? 0) > 0)) {
      throw new Error('COMPONENTE_EM_USO')
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')
      await client.query(`DELETE FROM componentes_precos WHERE componente_id = $1`, [id])
      await client.query(`DELETE FROM componentes WHERE id = $1 AND ativo = false`, [id])
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}
