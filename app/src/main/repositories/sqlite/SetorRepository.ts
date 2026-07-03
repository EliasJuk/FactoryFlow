import { getDatabase } from "../../database/connection"

const db = getDatabase()

export interface Setor {
  id: number
  nome: string
  sigla: string
  ativo: boolean
}

type SetorRow = {
  id: number
  nome: string
  sigla: string | null
  ativo: number
}

export class SetorRepository {
  private mapear(setor: SetorRow): Setor {
    return {
      id: setor.id,
      nome: setor.nome,
      sigla: setor.sigla ?? "",
      ativo: Boolean(setor.ativo)
    }
  }

  listar(): Setor[] {
    const setores = db
      .prepare(`
        SELECT id, nome, sigla, ativo
        FROM setores
        WHERE ativo = 1
        ORDER BY nome
      `)
      .all() as SetorRow[]

    return setores.map((setor) => this.mapear(setor))
  }

  listarInativos(): Setor[] {
    const setores = db
      .prepare(`
        SELECT id, nome, sigla, ativo
        FROM setores
        WHERE ativo = 0
        ORDER BY nome
      `)
      .all() as SetorRow[]

    return setores.map((setor) => this.mapear(setor))
  }

  criar(nome: string, sigla: string): void {
    const nomeFormatado = nome.trim()
    const siglaFormatada = sigla.trim().toUpperCase()

    const existente = db
      .prepare(`
        SELECT id, ativo
        FROM setores
        WHERE sigla = ?
        LIMIT 1
      `)
      .get(siglaFormatada) as { id: number; ativo: number } | undefined

    if (existente?.ativo) {
      throw new Error("Já existe um setor ativo cadastrado com esta sigla.")
    }

    if (existente && !existente.ativo) {
      throw new Error(
        "Já existe um setor inativo com esta sigla. Restaure o setor inativo em vez de criar outro."
      )
    }

    db.prepare(`
      INSERT INTO setores (nome, sigla, ativo)
      VALUES (?, ?, 1)
    `).run(nomeFormatado, siglaFormatada)
  }

  editar(id: number, nome: string, sigla: string): void {
    const nomeFormatado = nome.trim()
    const siglaFormatada = sigla.trim().toUpperCase()

    const existente = db
      .prepare(`
        SELECT id, ativo
        FROM setores
        WHERE sigla = ?
          AND id <> ?
        LIMIT 1
      `)
      .get(siglaFormatada, id) as { id: number; ativo: number } | undefined

    if (existente?.ativo) {
      throw new Error("Já existe outro setor ativo cadastrado com esta sigla.")
    }

    if (existente && !existente.ativo) {
      throw new Error(
        "Já existe um setor inativo com esta sigla. Altere a sigla ou restaure o setor inativo."
      )
    }

    db.prepare(`
      UPDATE setores
      SET nome = ?, sigla = ?
      WHERE id = ?
    `).run(nomeFormatado, siglaFormatada, id)
  }

  excluir(id: number): void {
    const vinculos = this.contarSubsetoresAtivos(id)

    if (vinculos > 0) {
      throw new Error(
        "Há subsetores vinculados a este setor. Para inativar este setor, primeiro remova ou inative os subsetores vinculados."
      )
    }

    db.prepare(`
      UPDATE setores
      SET ativo = 0
      WHERE id = ?
    `).run(id)
  }

  restaurar(id: number): void {
    db.prepare(`
      UPDATE setores
      SET ativo = 1
      WHERE id = ?
    `).run(id)
  }

  excluirPermanente(id: number): void {
    const vinculos = db
      .prepare(`
        SELECT COUNT(*) as total
        FROM subsetores
        WHERE setor_id = ?
      `)
      .get(id) as { total: number }

    if (vinculos.total > 0) {
      throw new Error(
        "Não é possível excluir permanentemente. Existem subsetores vinculados a este setor."
      )
    }

    db.prepare(`
      DELETE FROM setores
      WHERE id = ?
        AND ativo = 0
    `).run(id)
  }

  contarSubsetoresAtivos(id: number): number {
    const resultado = db
      .prepare(`
        SELECT COUNT(*) as total
        FROM subsetores
        WHERE setor_id = ?
          AND ativo = 1
      `)
      .get(id) as { total: number }

    return resultado.total
  }
}