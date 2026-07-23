import { getDatabase } from '../../database/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'
import { SyncQueueRepository } from '../../sync/SyncQueueRepository'

const db = getDatabase()
const USUARIO_SISTEMA_ID = 1

export interface Setor {
  id: number
  uuid: string
  nome: string
  sigla: string
  ativo: boolean
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
  createdBy: number | null
  updatedBy: number | null
  deletedBy: number | null
  createdByNome: string | null
  updatedByNome: string | null
  deletedByNome: string | null
}

type SetorRow = {
  id: number
  uuid: string
  nome: string
  sigla: string | null
  ativo: number
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  created_by: number | null
  updated_by: number | null
  deleted_by: number | null
  created_by_nome: string | null
  updated_by_nome: string | null
  deleted_by_nome: string | null
}

export class SetorRepository {
  private readonly syncQueue = new SyncQueueRepository()

  private mapear(setor: SetorRow): Setor {
    return {
      id: setor.id,
      uuid: setor.uuid,
      nome: setor.nome,
      sigla: setor.sigla ?? '',
      ativo: Boolean(setor.ativo),
      createdAt: setor.created_at,
      updatedAt: setor.updated_at,
      deletedAt: setor.deleted_at,
      createdBy: setor.created_by,
      updatedBy: setor.updated_by,
      deletedBy: setor.deleted_by,
      createdByNome: setor.created_by_nome,
      updatedByNome: setor.updated_by_nome,
      deletedByNome: setor.deleted_by_nome
    }
  }

  private consultaBase(): string {
    return `
      SELECT
        s.id,
        s.uuid,
        s.nome,
        s.sigla,
        s.ativo,
        s.created_at,
        s.updated_at,
        s.deleted_at,
        s.created_by,
        s.updated_by,
        s.deleted_by,
        criado.nome AS created_by_nome,
        atualizado.nome AS updated_by_nome,
        removido.nome AS deleted_by_nome
      FROM setores s
      LEFT JOIN usuarios criado ON criado.id = s.created_by
      LEFT JOIN usuarios atualizado ON atualizado.id = s.updated_by
      LEFT JOIN usuarios removido ON removido.id = s.deleted_by
    `
  }

  listar(): Setor[] {
    const setores = db
      .prepare(
        `
        ${this.consultaBase()}
        WHERE s.ativo = 1
        ORDER BY s.nome
      `
      )
      .all() as SetorRow[]

    return setores.map((setor) => this.mapear(setor))
  }

  listarInativos(): Setor[] {
    const setores = db
      .prepare(
        `
        ${this.consultaBase()}
        WHERE s.ativo = 0
        ORDER BY s.nome
      `
      )
      .all() as SetorRow[]

    return setores.map((setor) => this.mapear(setor))
  }

  criar(nome: string, sigla: string, usuarioId: number = USUARIO_SISTEMA_ID): void {
    const nomeFormatado = nome.trim()
    const siglaFormatada = sigla.trim().toUpperCase()
    const uuid = IdGenerator.generate()

    const existente = db
      .prepare(
        `
          SELECT id, ativo
          FROM setores
          WHERE sigla = ?
          LIMIT 1
        `
      )
      .get(siglaFormatada) as { id: number; ativo: number } | undefined

    if (existente?.ativo) {
      throw new Error('Já existe um setor ativo cadastrado com esta sigla.')
    }

    if (existente && !existente.ativo) {
      throw new Error(
        'Já existe um setor inativo com esta sigla. Restaure o setor inativo em vez de criar outro.'
      )
    }

    const transaction = db.transaction(() => {
      const resultado = db
        .prepare(
          `
            INSERT INTO setores (
              uuid,
              nome,
              sigla,
              ativo,
              created_at,
              updated_at,
              created_by,
              updated_by
            )
            VALUES (
              ?,
              ?,
              ?,
              1,
              datetime('now','localtime'),
              datetime('now','localtime'),
              ?,
              ?
            )
          `
        )
        .run(uuid, nomeFormatado, siglaFormatada, usuarioId, usuarioId)

      const setorId = Number(resultado.lastInsertRowid)

      this.syncQueue.enqueueSetor(setorId, 'CREATE')
    })

    transaction()
  }

  editar(id: number, nome: string, sigla: string, usuarioId: number = USUARIO_SISTEMA_ID): void {
    const nomeFormatado = nome.trim()
    const siglaFormatada = sigla.trim().toUpperCase()

    const existente = db
      .prepare(
        `
          SELECT id, ativo
          FROM setores
          WHERE sigla = ?
            AND id <> ?
          LIMIT 1
        `
      )
      .get(siglaFormatada, id) as { id: number; ativo: number } | undefined

    if (existente?.ativo) {
      throw new Error('Já existe outro setor ativo cadastrado com esta sigla.')
    }

    if (existente && !existente.ativo) {
      throw new Error(
        'Já existe um setor inativo com esta sigla. Altere a sigla ou restaure o setor inativo.'
      )
    }

    const transaction = db.transaction(() => {
      const resultado = db
        .prepare(
          `
            UPDATE setores
            SET
              nome = ?,
              sigla = ?,
              updated_at = datetime('now','localtime'),
              updated_by = ?
            WHERE id = ?
          `
        )
        .run(nomeFormatado, siglaFormatada, usuarioId, id)

      if (resultado.changes === 0) {
        throw new Error('Setor não encontrado.')
      }

      this.syncQueue.enqueueSetor(id, 'UPDATE')
    })

    transaction()
  }

  excluir(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    const vinculos = this.contarSubsetoresAtivos(id)

    if (vinculos > 0) {
      throw new Error(
        'Há subsetores vinculados a este setor. Para inativar este setor, primeiro remova ou inative os subsetores vinculados.'
      )
    }

    const transaction = db.transaction(() => {
      const resultado = db
        .prepare(
          `
            UPDATE setores
            SET
              ativo = 0,
              updated_at = datetime('now','localtime'),
              updated_by = ?,
              deleted_at = datetime('now','localtime'),
              deleted_by = ?
            WHERE id = ?
              AND ativo = 1
          `
        )
        .run(usuarioId, usuarioId, id)

      if (resultado.changes === 0) {
        throw new Error('Setor não encontrado ou já está inativo.')
      }

      this.syncQueue.enqueueSetor(id, 'DELETE')
    })

    transaction()
  }

  restaurar(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    const transaction = db.transaction(() => {
      const resultado = db
        .prepare(
          `
            UPDATE setores
            SET
              ativo = 1,
              updated_at = datetime('now','localtime'),
              updated_by = ?,
              deleted_at = NULL,
              deleted_by = NULL
            WHERE id = ?
              AND ativo = 0
          `
        )
        .run(usuarioId, id)

      if (resultado.changes === 0) {
        throw new Error('Setor não encontrado ou já está ativo.')
      }

      this.syncQueue.enqueueSetor(id, 'UPDATE')
    })

    transaction()
  }

  excluirPermanente(id: number): void {
    const vinculos = db
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM subsetores
        WHERE setor_id = ?
      `
      )
      .get(id) as { total: number }

    if (vinculos.total > 0) {
      throw new Error(
        'Não é possível excluir permanentemente. Existem subsetores vinculados a este setor.'
      )
    }

    db.prepare(
      `
      DELETE FROM setores
      WHERE id = ?
        AND ativo = 0
    `
    ).run(id)
  }

  contarSubsetoresAtivos(id: number): number {
    const resultado = db
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM subsetores
        WHERE setor_id = ?
          AND ativo = 1
      `
      )
      .get(id) as { total: number }

    return resultado.total
  }
}
