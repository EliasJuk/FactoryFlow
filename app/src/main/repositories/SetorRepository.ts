import db from "../database/database"

export type Setor = {
  id: number
  nome: string
  ativo: boolean
}

export class SetorRepository {
  listar(): Setor[] {
    const setores = db
      .prepare("SELECT id, nome, ativo FROM setores WHERE ativo = 1 ORDER BY nome")
      .all() as Array<{ id: number; nome: string; ativo: number }>

    return setores.map((setor) => ({
      ...setor,
      ativo: Boolean(setor.ativo)
    }))
  }

  criar(nome: string): void {
    db.prepare("INSERT INTO setores (nome, ativo) VALUES (?, 1)").run(nome)
  }

  editar(id: number, nome: string): void {
    db.prepare("UPDATE setores SET nome = ? WHERE id = ?").run(nome, id)
  }

  excluir(id: number): void {
    db.prepare("UPDATE setores SET ativo = 0 WHERE id = ?").run(id)
  }
}