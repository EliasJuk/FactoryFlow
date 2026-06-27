import db from "../database/database"

export interface Posto {
  id: number
  nome: string
  subsetorId: number
  subsetorNome: string
  ativo: boolean
}

export class PostoRepository {
  listar(): Posto[] {
    const postos = db.prepare(`
      SELECT
        postos.id,
        postos.nome,
        postos.subsetor_id as subsetorId,
        subsetores.nome as subsetorNome,
        postos.ativo
      FROM postos
      INNER JOIN subsetores
        ON subsetores.id = postos.subsetor_id
      WHERE postos.ativo = 1
      ORDER BY subsetores.nome, postos.nome
    `).all() as Array<{
      id: number
      nome: string
      subsetorId: number
      subsetorNome: string
      ativo: number
    }>

    return postos.map((posto) => ({
      ...posto,
      ativo: Boolean(posto.ativo)
    }))
  }

  criar(nome: string, subsetorId: number): void {
    db.prepare(`
      INSERT INTO postos
        (nome, subsetor_id, ativo)
      VALUES (?, ?, 1)
    `).run(nome, subsetorId)
  }

  editar(id: number, nome: string, subsetorId: number): void {
    db.prepare(`
      UPDATE postos
      SET nome = ?, subsetor_id = ?
      WHERE id = ?
    `).run(nome, subsetorId, id)
  }

  excluir(id: number): void {
    db.prepare(`
      UPDATE postos
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }
}