//import db from "../database/database"
import { getDatabase } from "../../database/connection"
const db = getDatabase()

export interface Circuito {
  id: number
  codigo: string
  nome: string
  ativo: boolean
}

export class CircuitoRepository {
  listar(): Circuito[] {
    const circuitos = db
      .prepare(`
        SELECT id, codigo, nome, ativo
        FROM circuitos
        WHERE ativo = 1
        ORDER BY codigo
      `)
      .all() as Array<{
        id: number
        codigo: string
        nome: string
        ativo: number
      }>

    return circuitos.map((circuito) => ({
      ...circuito,
      ativo: Boolean(circuito.ativo)
    }))
  }

  criar(codigo: string, nome: string): void {
    db.prepare(`
      INSERT INTO circuitos (codigo, nome, ativo)
      VALUES (?, ?, 1)
    `).run(codigo, nome)
  }

  editar(id: number, codigo: string, nome: string): void {
    db.prepare(`
      UPDATE circuitos
      SET codigo = ?, nome = ?
      WHERE id = ?
    `).run(codigo, nome, id)
  }

  excluir(id: number): void {
    db.prepare(`
      UPDATE circuitos
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }
}