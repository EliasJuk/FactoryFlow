import db from "../database/database"

export interface Defeito {
  id: number
  codigo: string
  descricao: string
  ativo: boolean
}

export class DefeitoRepository {
  listar(): Defeito[] {
    const defeitos = db
      .prepare(`
        SELECT id, codigo, descricao, ativo
        FROM defeitos
        WHERE ativo = 1
        ORDER BY codigo
      `)
      .all() as Array<{
        id: number
        codigo: string
        descricao: string
        ativo: number
      }>

    return defeitos.map((defeito) => ({
      ...defeito,
      ativo: Boolean(defeito.ativo)
    }))
  }

  criar(codigo: string, descricao: string): void {
    const codigoFormatado = codigo.trim().toUpperCase()
    const descricaoFormatada = descricao.trim()

    const duplicado = db
      .prepare(`
        SELECT id
        FROM defeitos
        WHERE codigo = ?
          AND ativo = 1
      `)
      .get(codigoFormatado) as { id: number } | undefined

    if (duplicado) {
      throw new Error("DEFEITO_DUPLICADO")
    }

    db.prepare(`
      INSERT INTO defeitos (codigo, descricao, ativo)
      VALUES (?, ?, 1)
    `).run(codigoFormatado, descricaoFormatada)
  }

  editar(id: number, codigo: string, descricao: string): void {
    const codigoFormatado = codigo.trim().toUpperCase()
    const descricaoFormatada = descricao.trim()

    const duplicado = db
      .prepare(`
        SELECT id
        FROM defeitos
        WHERE codigo = ?
          AND ativo = 1
          AND id <> ?
      `)
      .get(codigoFormatado, id) as { id: number } | undefined

    if (duplicado) {
      throw new Error("DEFEITO_DUPLICADO")
    }

    db.prepare(`
      UPDATE defeitos
      SET codigo = ?, descricao = ?
      WHERE id = ?
    `).run(codigoFormatado, descricaoFormatada, id)
  }

  excluir(id: number): void {
    db.prepare(`
      UPDATE defeitos
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }
}