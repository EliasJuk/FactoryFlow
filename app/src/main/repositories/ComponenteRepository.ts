import db from "../database/database"

export interface Componente {
  id: number
  codigo: string
  nome: string
  precoAtual: number
  ativo: boolean
}

export class ComponenteRepository {
  listar(): Componente[] {
    const componentes = db
      .prepare(`
        SELECT
          c.id,
          c.codigo,
          c.nome,
          COALESCE(cp.valor_unitario, 0) as precoAtual,
          c.ativo
        FROM componentes c
        LEFT JOIN componentes_precos cp
          ON cp.componente_id = c.id
         AND cp.ativo = 1
         AND cp.vigencia_fim IS NULL
        WHERE c.ativo = 1
        ORDER BY c.codigo
      `)
      .all() as Array<{
        id: number
        codigo: string
        nome: string
        precoAtual: number
        ativo: number
      }>

    return componentes.map((componente) => ({
      ...componente,
      ativo: Boolean(componente.ativo)
    }))
  }

  criar(codigo: string, nome: string, precoAtual = 0): void {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const duplicado = db
      .prepare(`
        SELECT id
        FROM componentes
        WHERE codigo = ?
          AND ativo = 1
      `)
      .get(codigoFormatado) as { id: number } | undefined

    if (duplicado) {
      throw new Error("COMPONENTE_DUPLICADO")
    }

    const resultado = db
      .prepare(`
        INSERT INTO componentes (codigo, nome, ativo)
        VALUES (?, ?, 1)
      `)
      .run(codigoFormatado, nomeFormatado)

    const componenteId = Number(resultado.lastInsertRowid)

    if (precoAtual > 0) {
      this.atualizarPreco(componenteId, precoAtual)
    }
  }

  editar(id: number, codigo: string, nome: string, precoAtual = 0): void {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const duplicado = db
      .prepare(`
        SELECT id
        FROM componentes
        WHERE codigo = ?
          AND ativo = 1
          AND id <> ?
      `)
      .get(codigoFormatado, id) as { id: number } | undefined

    if (duplicado) {
      throw new Error("COMPONENTE_DUPLICADO")
    }

    db.prepare(`
      UPDATE componentes
      SET codigo = ?, nome = ?
      WHERE id = ?
    `).run(codigoFormatado, nomeFormatado, id)

    this.atualizarPreco(id, precoAtual)
  }

  atualizarPreco(componenteId: number, valorUnitario: number): void {
    const valor = Number(valorUnitario) || 0

    const precoAtual = db
      .prepare(`
        SELECT id, valor_unitario as valorUnitario
        FROM componentes_precos
        WHERE componente_id = ?
          AND ativo = 1
          AND vigencia_fim IS NULL
        LIMIT 1
      `)
      .get(componenteId) as
      | { id: number; valorUnitario: number }
      | undefined

    if (precoAtual && Number(precoAtual.valorUnitario) === valor) {
      return
    }

    if (precoAtual) {
      db.prepare(`
        UPDATE componentes_precos
        SET
          ativo = 0,
          vigencia_fim = date('now','localtime')
        WHERE id = ?
      `).run(precoAtual.id)
    }

    if (valor > 0) {
      db.prepare(`
        INSERT INTO componentes_precos (
          componente_id,
          valor_unitario,
          vigencia_inicio,
          vigencia_fim,
          ativo
        ) VALUES (
          ?,
          ?,
          date('now','localtime'),
          NULL,
          1
        )
      `).run(componenteId, valor)
    }
  }

  excluir(id: number): void {
    db.prepare(`
      UPDATE componentes
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }
}