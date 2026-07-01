//import db from "../database/database"
import { getDatabase } from "../../database/connection"
const db = getDatabase()

export interface Subsetor {
  id: number
  nome: string
  setorId: number
  setorNome: string
  ativo: boolean
}

export class SubsetorRepository {
  listar(): Subsetor[] {
    const subsetores = db
      .prepare(`
        SELECT 
          subsetores.id,
          subsetores.nome,
          subsetores.setor_id as setorId,
          setores.nome as setorNome,
          subsetores.ativo
        FROM subsetores
        INNER JOIN setores ON setores.id = subsetores.setor_id
        WHERE subsetores.ativo = 1
        ORDER BY setores.nome, subsetores.nome
      `)
      .all() as Array<{
        id: number
        nome: string
        setorId: number
        setorNome: string
        ativo: number
      }>

    return subsetores.map((subsetor) => ({
      ...subsetor,
      ativo: Boolean(subsetor.ativo)
    }))
  }

  criar(nome: string, setorId: number): void {
    const nomeFormatado = nome.trim()

    const existente = db
      .prepare(`
        SELECT id, ativo
        FROM subsetores
        WHERE nome = ?
          AND setor_id = ?
      `)
      .get(nomeFormatado, setorId) as { id: number; ativo: number } | undefined

    if (existente) {
      db.prepare(`
        UPDATE subsetores
        SET nome = ?, setor_id = ?, ativo = 1
        WHERE id = ?
      `).run(nomeFormatado, setorId, existente.id)

      return
    }

    db.prepare(`
      INSERT INTO subsetores (nome, setor_id, ativo)
      VALUES (?, ?, 1)
    `).run(nomeFormatado, setorId)
  }

  editar(id: number, nome: string, setorId: number): void {
    db.prepare(`
      UPDATE subsetores
      SET nome = ?, setor_id = ?
      WHERE id = ?
    `).run(nome.trim(), setorId, id)
  }

  contarPostosAtivos(id: number): number {
    const resultado = db
      .prepare(`
        SELECT COUNT(*) as total
        FROM postos
        WHERE subsetor_id = ?
          AND ativo = 1
      `)
      .get(id) as { total: number }

    return resultado.total
  }

  excluir(id: number): void {
    const total = this.contarPostosAtivos(id)

    if (total > 0) {
      throw new Error(
        "Há postos de trabalho vinculados a este subsetor. Para inativar este subsetor, primeiro remova ou inative esses postos e depois retorne aqui."
      )
    }

    db.prepare(`
      UPDATE subsetores
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }
}