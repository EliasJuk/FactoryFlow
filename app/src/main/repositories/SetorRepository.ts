//import db from "../database/database"
import { getDatabase } from "../database/connection"
const db = getDatabase()

export interface Setor {
  id: number
  nome: string
  sigla: string
  ativo: boolean
}

export class SetorRepository {
  listar(): Setor[] {
    const setores = db.prepare(`
      SELECT id, nome, sigla, ativo
      FROM setores
      WHERE ativo = 1
      ORDER BY nome
    `).all() as Array<{
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
    const nomeFormatado = nome.trim()
    const siglaFormatada = sigla.trim().toUpperCase()

    const existente = db.prepare(`
      SELECT id, ativo
      FROM setores
      WHERE sigla = ?
    `).get(siglaFormatada) as { id: number; ativo: number } | undefined

    if (existente) {
      db.prepare(`
        UPDATE setores
        SET nome = ?, sigla = ?, ativo = 1
        WHERE id = ?
      `).run(nomeFormatado, siglaFormatada, existente.id)

      return
    }

    db.prepare(`
      INSERT INTO setores (nome, sigla, ativo)
      VALUES (?, ?, 1)
    `).run(nomeFormatado, siglaFormatada)
  }

  editar(id: number, nome: string, sigla: string): void {
    db.prepare(`
      UPDATE setores
      SET nome = ?, sigla = ?
      WHERE id = ?
    `).run(nome.trim(), sigla.trim().toUpperCase(), id)
  }

  excluir(id: number): void {
    const vinculos = db.prepare(`
      SELECT COUNT(*) as total
      FROM subsetores
      WHERE setor_id = ?
        AND ativo = 1
    `).get(id) as { total: number }

    if (vinculos.total > 0) {
      throw new Error(
        "Há subsetores vinculados a este setor. Para inativar este setor, primeiro remova ou inative esses subsetores e depois retorne aqui."
      )
    }

    db.prepare(`
      UPDATE setores
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }

  contarSubsetoresAtivos(id: number): number {
    const resultado = db.prepare(`
      SELECT COUNT(*) as total
      FROM subsetores
      WHERE setor_id = ?
        AND ativo = 1
    `).get(id) as { total: number }

    return resultado.total
  }
}