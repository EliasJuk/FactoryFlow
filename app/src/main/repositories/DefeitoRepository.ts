//import db from "../database/database"
import { getDatabase } from "../database/connection"
const db = getDatabase()

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
    db.prepare(`
      INSERT INTO defeitos (codigo, descricao, ativo)
      VALUES (?, ?, 1)
    `).run(codigo, descricao)
  }

  editar(id: number, codigo: string, descricao: string): void {
    db.prepare(`
      UPDATE defeitos
      SET codigo = ?, descricao = ?
      WHERE id = ?
    `).run(codigo, descricao, id)
  }

  excluir(id: number): void {
    db.prepare(`
      UPDATE defeitos
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }
}