import db from "../database/database"

export interface Setor {
  id: number
  nome: string
  sigla: string
  ativo: boolean
}

export class SetorRepository {
  listar(): Setor[] {
    const setores = db
      .prepare(`
        SELECT id, nome, sigla, ativo
        FROM setores
        WHERE ativo = 1
        ORDER BY nome
      `)
      .all() as Array<{
        id: number
        nome: string
        sigla: string | null
        ativo: number
      }>

    return setores.map((setor) => ({
      ...setor,
      sigla: setor.sigla ?? "",
      ativo: Boolean(setor.ativo)
    }))
  }

  criar(nome: string, sigla: string): void {
    db.prepare(`
      INSERT INTO setores (nome, sigla, ativo)
      VALUES (?, ?, 1)
    `).run(nome, sigla)
  }

  editar(id: number, nome: string, sigla: string): void {
    db.prepare(`
      UPDATE setores
      SET nome = ?, sigla = ?
      WHERE id = ?
    `).run(nome, sigla, id)
  }

  excluir(id: number): void {
    db.prepare(`
      UPDATE setores
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }
}