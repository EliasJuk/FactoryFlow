import db from "../database/database"

export interface Componente {
  id: number
  codigo: string
  nome: string
  ativo: boolean
}

export class ComponenteRepository {
  listar(): Componente[] {
    const componentes = db
      .prepare(`
        SELECT id, codigo, nome, ativo 
        FROM componentes 
        WHERE ativo = 1 
        ORDER BY codigo
      `)
      .all() as Array<{
        id: number
        codigo: string
        nome: string
        ativo: number
      }>

    return componentes.map((componente) => ({
      ...componente,
      ativo: Boolean(componente.ativo)
    }))
  }

  criar(codigo: string, nome: string): void {
    db.prepare(`
      INSERT INTO componentes (codigo, nome, ativo) 
      VALUES (?, ?, 1)
    `).run(codigo, nome)
  }

  editar(id: number, codigo: string, nome: string): void {
    db.prepare(`
      UPDATE componentes 
      SET codigo = ?, nome = ? 
      WHERE id = ?
    `).run(codigo, nome, id)
  }

  excluir(id: number): void {
    db.prepare(`
      UPDATE componentes 
      SET ativo = 0 
      WHERE id = ?
    `).run(id)
  }
}