import { getDatabase } from "../../database/connection"

const db = getDatabase()

export interface Circuito {
  id: number
  codigo: string
  nome: string
  ativo: boolean
  totalComponentes: number
}

export class CircuitoRepository {
  listar(): Circuito[] {
    const circuitos = db
      .prepare(`
        SELECT
          c.id,
          c.codigo,
          c.nome,
          c.ativo,
          COUNT(cc.id) as totalComponentes
        FROM circuitos c
        LEFT JOIN circuito_componentes cc
          ON cc.circuito_id = c.id
         AND cc.ativo = 1
        WHERE c.ativo = 1
        GROUP BY c.id, c.codigo, c.nome, c.ativo
        ORDER BY c.codigo
      `)
      .all() as Array<{
        id: number
        codigo: string
        nome: string
        ativo: number
        totalComponentes: number
      }>

    return circuitos.map((circuito) => ({
      ...circuito,
      ativo: Boolean(circuito.ativo),
      totalComponentes: Number(circuito.totalComponentes ?? 0)
    }))
  }

  listarInativos(): Circuito[] {
    const circuitos = db
      .prepare(`
        SELECT
          c.id,
          c.codigo,
          c.nome,
          c.ativo,
          COUNT(cc.id) as totalComponentes
        FROM circuitos c
        LEFT JOIN circuito_componentes cc
          ON cc.circuito_id = c.id
         AND cc.ativo = 1
        WHERE c.ativo = 0
        GROUP BY c.id, c.codigo, c.nome, c.ativo
        ORDER BY c.codigo
      `)
      .all() as Array<{
        id: number
        codigo: string
        nome: string
        ativo: number
        totalComponentes: number
      }>

    return circuitos.map((circuito) => ({
      ...circuito,
      ativo: Boolean(circuito.ativo),
      totalComponentes: Number(circuito.totalComponentes ?? 0)
    }))
  }

  criar(codigo: string, nome: string): void {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const duplicado = db
      .prepare(`
        SELECT id
        FROM circuitos
        WHERE codigo = ?
          AND ativo = 1
      `)
      .get(codigoFormatado) as { id: number } | undefined

    if (duplicado) {
      throw new Error("CIRCUITO_DUPLICADO")
    }

    db.prepare(`
      INSERT INTO circuitos (codigo, nome, ativo)
      VALUES (?, ?, 1)
    `).run(codigoFormatado, nomeFormatado)
  }

  editar(id: number, codigo: string, nome: string): void {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const duplicado = db
      .prepare(`
        SELECT id
        FROM circuitos
        WHERE codigo = ?
          AND ativo = 1
          AND id <> ?
      `)
      .get(codigoFormatado, id) as { id: number } | undefined

    if (duplicado) {
      throw new Error("CIRCUITO_DUPLICADO")
    }

    db.prepare(`
      UPDATE circuitos
      SET codigo = ?, nome = ?
      WHERE id = ?
    `).run(codigoFormatado, nomeFormatado, id)
  }

  excluir(id: number): void {
    db.prepare(`
      UPDATE circuitos
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }

  restaurar(id: number): void {
    db.prepare(`
      UPDATE circuitos
      SET ativo = 1
      WHERE id = ?
    `).run(id)
  }

  excluirPermanente(id: number): void {
    const componentes = db
      .prepare(`
        SELECT COUNT(*) as total
        FROM circuito_componentes
        WHERE circuito_id = ?
      `)
      .get(id) as { total: number } | undefined

    if (Number(componentes?.total ?? 0) > 0) {
      throw new Error("CIRCUITO_COM_COMPONENTES")
    }

    db.prepare(`
      DELETE FROM circuitos
      WHERE id = ?
        AND ativo = 0
    `).run(id)
  }
}