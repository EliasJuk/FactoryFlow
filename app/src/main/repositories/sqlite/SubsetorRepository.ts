import { getDatabase } from '../../database/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'
import { SyncQueueRepository } from '../../sync/SyncQueueRepository'

const db = getDatabase()
const USUARIO_SISTEMA_ID = 1

export interface Subsetor {
  id: number
  uuid: string
  nome: string
  setorId: number
  setorNome: string
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

type SubsetorRow = {
  id: number
  uuid: string
  nome: string
  setorId: number
  setorNome: string
  ativo: number
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

export class SubsetorRepository {
  private readonly syncQueue = new SyncQueueRepository()

  private mapear(subsetor: SubsetorRow): Subsetor {
    return {
      ...subsetor,
      ativo: Boolean(subsetor.ativo)
    }
  }

  private consultaBase(): string {
    return `
      SELECT
        ss.id,
        ss.uuid,
        ss.nome,
        ss.setor_id AS setorId,
        s.nome AS setorNome,
        ss.ativo,
        ss.created_at AS createdAt,
        ss.updated_at AS updatedAt,
        ss.deleted_at AS deletedAt,
        ss.created_by AS createdBy,
        ss.updated_by AS updatedBy,
        ss.deleted_by AS deletedBy,
        criado.nome AS createdByNome,
        atualizado.nome AS updatedByNome,
        removido.nome AS deletedByNome
      FROM subsetores ss
      INNER JOIN setores s ON s.id = ss.setor_id
      LEFT JOIN usuarios criado ON criado.id = ss.created_by
      LEFT JOIN usuarios atualizado ON atualizado.id = ss.updated_by
      LEFT JOIN usuarios removido ON removido.id = ss.deleted_by
    `
  }

  listar(): Subsetor[] {
    const subsetores = db
      .prepare(
        `
        ${this.consultaBase()}
        WHERE ss.ativo = 1
        ORDER BY s.nome, ss.nome
      `
      )
      .all() as SubsetorRow[]

    return subsetores.map((subsetor) => this.mapear(subsetor))
  }

  listarInativos(): Subsetor[] {
    const subsetores = db
      .prepare(
        `
        ${this.consultaBase()}
        WHERE ss.ativo = 0
        ORDER BY s.nome, ss.nome
      `
      )
      .all() as SubsetorRow[]

    return subsetores.map((subsetor) => this.mapear(subsetor))
  }

  criar(nome: string, setorId: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    const nomeFormatado = nome.trim()
    const uuid = IdGenerator.generate()

    const existente = db
      .prepare(
        `
          SELECT id, ativo
          FROM subsetores
          WHERE nome = ?
            AND setor_id = ?
        `
      )
      .get(nomeFormatado, setorId) as { id: number; ativo: number } | undefined

    if (existente?.ativo) {
      throw new Error('Já existe um subsetor ativo com este nome neste setor.')
    }

    if (existente && !existente.ativo) {
      throw new Error(
        'Já existe um subsetor inativo com este nome neste setor. Restaure o subsetor em vez de criar outro.'
      )
    }

    const transaction = db.transaction(() => {
      const resultado = db
        .prepare(
          `
            INSERT INTO subsetores (
              uuid,
              nome,
              setor_id,
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
        .run(uuid, nomeFormatado, setorId, usuarioId, usuarioId)

      const subsetorId = Number(resultado.lastInsertRowid)

      this.syncQueue.enqueueSubsetor(subsetorId, 'CREATE')
    })

    transaction()
  }

  editar(id: number, nome: string, setorId: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    const nomeFormatado = nome.trim()

    const existente = db
      .prepare(
        `
          SELECT id, ativo
          FROM subsetores
          WHERE nome = ?
            AND setor_id = ?
            AND id <> ?
          LIMIT 1
        `
      )
      .get(nomeFormatado, setorId, id) as { id: number; ativo: number } | undefined

    if (existente?.ativo) {
      throw new Error('Já existe outro subsetor ativo com este nome neste setor.')
    }

    if (existente && !existente.ativo) {
      throw new Error(
        'Já existe um subsetor inativo com este nome neste setor. Altere o nome ou restaure o subsetor inativo.'
      )
    }

    const transaction = db.transaction(() => {
      const resultado = db
        .prepare(
          `
            UPDATE subsetores
            SET
              nome = ?,
              setor_id = ?,
              updated_at = datetime('now','localtime'),
              updated_by = ?
            WHERE id = ?
          `
        )
        .run(nomeFormatado, setorId, usuarioId, id)

      if (resultado.changes === 0) {
        throw new Error('Subsetor não encontrado.')
      }

      this.syncQueue.enqueueSubsetor(id, 'UPDATE')
    })

    transaction()
  }

  contarPostosAtivos(id: number): number {
    const resultado = db
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM postos
        WHERE subsetor_id = ?
          AND ativo = 1
      `
      )
      .get(id) as { total: number }

    return resultado.total
  }

  excluir(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    const total = this.contarPostosAtivos(id)

    if (total > 0) {
      throw new Error(
        'Há postos de trabalho vinculados a este subsetor. Para inativar este subsetor, primeiro remova ou inative esses postos e depois retorne aqui.'
      )
    }

    const transaction = db.transaction(() => {
      const resultado = db
        .prepare(
          `
            UPDATE subsetores
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
        throw new Error('Subsetor não encontrado ou já está inativo.')
      }

      this.syncQueue.enqueueSubsetor(id, 'DELETE')
    })

    transaction()
  }

  restaurar(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    const transaction = db.transaction(() => {
      const resultado = db
        .prepare(
          `
            UPDATE subsetores
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
        throw new Error('Subsetor não encontrado ou já está ativo.')
      }

      this.syncQueue.enqueueSubsetor(id, 'UPDATE')
    })

    transaction()
  }

  excluirPermanente(id: number): void {
    const total = db
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM postos
        WHERE subsetor_id = ?
      `
      )
      .get(id) as { total: number }

    if (total.total > 0) {
      throw new Error(
        'Não é possível excluir permanentemente. Existem postos vinculados a este subsetor.'
      )
    }

    db.prepare(
      `
      DELETE FROM subsetores
      WHERE id = ?
        AND ativo = 0
    `
    ).run(id)
  }
}
