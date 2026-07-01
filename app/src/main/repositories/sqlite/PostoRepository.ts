//import db from "../database/database"
import { getDatabase } from "../../database/connection"
const db = getDatabase()

export interface Posto {
  id: number
  nome: string
  subsetorId: number
  subsetorNome: string
  setorNome: string
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
        setores.nome as setorNome,
        postos.ativo
      FROM postos
      INNER JOIN subsetores ON subsetores.id = postos.subsetor_id
      INNER JOIN setores ON setores.id = subsetores.setor_id
      WHERE postos.ativo = 1
      ORDER BY setores.nome, subsetores.nome, postos.nome
    `).all() as Array<{
      id: number
      nome: string
      subsetorId: number
      subsetorNome: string
      setorNome: string
      ativo: number
    }>

    return postos.map((posto) => ({
      ...posto,
      ativo: Boolean(posto.ativo)
    }))
  }

  criar(nome: string, subsetorId: number): void {
    const nomeFormatado = nome.trim()

    const existente = db.prepare(`
      SELECT id, ativo
      FROM postos
      WHERE nome = ?
        AND subsetor_id = ?
    `).get(nomeFormatado, subsetorId) as
      | { id: number; ativo: number }
      | undefined

    if (existente && existente.ativo === 1) {
      throw new Error("POSTO_DUPLICADO")
    }

    if (existente && existente.ativo === 0) {
      db.prepare(`
        UPDATE postos
        SET nome = ?, subsetor_id = ?, ativo = 1
        WHERE id = ?
      `).run(nomeFormatado, subsetorId, existente.id)

      return
    }

    db.prepare(`
      INSERT INTO postos (nome, subsetor_id, ativo)
      VALUES (?, ?, 1)
    `).run(nomeFormatado, subsetorId)
  }

  editar(id: number, nome: string, subsetorId: number): void {
    const nomeFormatado = nome.trim()

    const duplicado = db.prepare(`
      SELECT id
      FROM postos
      WHERE nome = ?
        AND subsetor_id = ?
        AND ativo = 1
        AND id <> ?
    `).get(nomeFormatado, subsetorId, id) as { id: number } | undefined

    if (duplicado) {
      throw new Error("POSTO_DUPLICADO")
    }

    db.prepare(`
      UPDATE postos
      SET nome = ?, subsetor_id = ?
      WHERE id = ?
    `).run(nomeFormatado, subsetorId, id)
  }

  contarRoteirosAtivos(id: number): number {
    const resultado = db.prepare(`
      SELECT COUNT(*) as total
      FROM circuito_posto_componentes
      WHERE posto_id = ?
        AND ativo = 1
    `).get(id) as { total: number }

    return resultado.total
  }

  excluir(id: number): void {
    const total = this.contarRoteirosAtivos(id)

    if (total > 0) {
      throw new Error("POSTO_COM_VINCULOS")
    }

    db.prepare(`
      UPDATE postos
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }
}