import { pool } from "../../database/postgres/connection"

export interface Componente {
  id: number
  codigo: string
  nome: string
  precoAtual: number
  ativo: boolean
}

export class ComponenteRepository {
  async listar(): Promise<Componente[]> {
    const result = await pool.query<any>(`
      SELECT
        c.id,
        c.codigo,
        c.nome,
        COALESCE(cp.valor_unitario, 0) as "precoAtual",
        c.ativo
      FROM componentes c
      LEFT JOIN componentes_precos cp
        ON cp.componente_id = c.id
       AND cp.ativo = true
       AND cp.vigencia_fim IS NULL
      WHERE c.ativo = true
      ORDER BY c.codigo
    `)

    return result.rows.map((componente) => ({
      ...componente,
      precoAtual: Number(componente.precoAtual ?? 0),
      ativo: Boolean(componente.ativo)
    }))
  }

  async criar(codigo: string, nome: string, precoAtual = 0): Promise<void> {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const duplicado = await pool.query<{ id: number }>(`
      SELECT id
      FROM componentes
      WHERE codigo = $1
        AND ativo = true
      LIMIT 1
    `, [codigoFormatado])

    if (duplicado.rows[0]) {
      throw new Error("COMPONENTE_DUPLICADO")
    }

    const result = await pool.query<{ id: number }>(`
      INSERT INTO componentes (codigo, nome, ativo)
      VALUES ($1, $2, true)
      RETURNING id
    `, [codigoFormatado, nomeFormatado])

    const componenteId = result.rows[0].id

    if (precoAtual > 0) {
      await this.atualizarPreco(componenteId, precoAtual)
    }
  }

  async editar(id: number, codigo: string, nome: string, precoAtual = 0): Promise<void> {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const duplicado = await pool.query<{ id: number }>(`
      SELECT id
      FROM componentes
      WHERE codigo = $1
        AND ativo = true
        AND id <> $2
      LIMIT 1
    `, [codigoFormatado, id])

    if (duplicado.rows[0]) {
      throw new Error("COMPONENTE_DUPLICADO")
    }

    await pool.query(`
      UPDATE componentes
      SET codigo = $1, nome = $2
      WHERE id = $3
    `, [codigoFormatado, nomeFormatado, id])

    await this.atualizarPreco(id, precoAtual)
  }

  async atualizarPreco(componenteId: number, valorUnitario: number): Promise<void> {
    const valor = Number(valorUnitario) || 0

    const precoAtual = await pool.query<{ id: number; valorUnitario: number }>(`
      SELECT id, valor_unitario as "valorUnitario"
      FROM componentes_precos
      WHERE componente_id = $1
        AND ativo = true
        AND vigencia_fim IS NULL
      ORDER BY id DESC
      LIMIT 1
    `, [componenteId])

    const atual = precoAtual.rows[0]

    if (atual && Number(atual.valorUnitario) === valor) {
      return
    }

    if (atual) {
      await pool.query(`
        UPDATE componentes_precos
        SET
          ativo = false,
          vigencia_fim = CURRENT_DATE
        WHERE id = $1
      `, [atual.id])
    }

    if (valor > 0) {
      await pool.query(`
        INSERT INTO componentes_precos (
          componente_id,
          valor_unitario,
          vigencia_inicio,
          vigencia_fim,
          ativo
        ) VALUES ($1, $2, CURRENT_DATE, NULL, true)
      `, [componenteId, valor])
    }
  }

  async excluir(id: number): Promise<void> {
    await pool.query(`
      UPDATE componentes
      SET ativo = false
      WHERE id = $1
    `, [id])
  }
}
