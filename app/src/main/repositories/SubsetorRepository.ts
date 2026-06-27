import db from "../database/database"

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
    db.prepare(
      "INSERT INTO subsetores (nome, setor_id, ativo) VALUES (?, ?, 1)"
    ).run(nome, setorId)
  }

  editar(id: number, nome: string, setorId: number): void {
    db.prepare(
      "UPDATE subsetores SET nome = ?, setor_id = ? WHERE id = ?"
    ).run(nome, setorId, id)
  }

  excluir(id: number): void {
    db.prepare("UPDATE subsetores SET ativo = 0 WHERE id = ?").run(id)
  }
}