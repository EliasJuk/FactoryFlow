import db from '../../database/database'
import { IdGenerator } from '../../shared/ids/IdGenerator'
import { SyncQueueRepository } from '../../sync/SyncQueueRepository'

const USUARIO_SISTEMA_ID = 1

export interface Defeito {
  id: number
  uuid: string
  codigo: string
  descricao: string
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

type DefeitoRow = {
  id: number
  uuid: string
  codigo: string
  descricao: string
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

export class DefeitoRepository {
  private readonly syncQueue = new SyncQueueRepository()

  private consultaBase(): string {
    return `
      SELECT
        d.id,
        d.uuid,
        d.codigo,
        d.descricao,
        d.ativo,
        d.created_at AS createdAt,
        d.updated_at AS updatedAt,
        d.deleted_at AS deletedAt,
        d.created_by AS createdBy,
        d.updated_by AS updatedBy,
        d.deleted_by AS deletedBy,
        criado.nome AS createdByNome,
        atualizado.nome AS updatedByNome,
        removido.nome AS deletedByNome
      FROM defeitos d
      LEFT JOIN usuarios criado ON criado.id = d.created_by
      LEFT JOIN usuarios atualizado ON atualizado.id = d.updated_by
      LEFT JOIN usuarios removido ON removido.id = d.deleted_by
    `
  }

  private mapear(defeito: DefeitoRow): Defeito {
    return {
      ...defeito,
      ativo: Boolean(defeito.ativo)
    }
  }

  listar(): Defeito[] {
    const defeitos = db
      .prepare(
        `
        ${this.consultaBase()}
        WHERE d.ativo = 1
        ORDER BY d.codigo
      `
      )
      .all() as DefeitoRow[]

    return defeitos.map((defeito) => this.mapear(defeito))
  }

  listarInativos(): Defeito[] {
    const defeitos = db
      .prepare(
        `
        ${this.consultaBase()}
        WHERE d.ativo = 0
        ORDER BY d.codigo
      `
      )
      .all() as DefeitoRow[]

    return defeitos.map((defeito) => this.mapear(defeito))
  }

  criar(codigo: string, descricao: string, usuarioId: number = USUARIO_SISTEMA_ID): void {
    const codigoFormatado = codigo.trim().toUpperCase()
    const descricaoFormatada = descricao.trim()

    const existente = db
      .prepare(
        `
        SELECT id, ativo
        FROM defeitos
        WHERE codigo = ?
        LIMIT 1
      `
      )
      .get(codigoFormatado) as { id: number; ativo: number } | undefined

    if (existente?.ativo === 1) {
      throw new Error('DEFEITO_DUPLICADO')
    }

    if (existente?.ativo === 0) {
      throw new Error(
        'Já existe um defeito inativo com este código. Restaure o defeito em vez de criar outro.'
      )
    }

    db.transaction(() => {
      const resultado = db
        .prepare(
          `
          INSERT INTO defeitos (
            uuid,
            codigo,
            descricao,
            ativo,
            created_at,
            updated_at,
            created_by,
            updated_by
          )
          VALUES (?, ?, ?, 1, datetime('now','localtime'), datetime('now','localtime'), ?, ?)
        `
        )
        .run(IdGenerator.generate(), codigoFormatado, descricaoFormatada, usuarioId, usuarioId)

      const defeitoId = Number(resultado.lastInsertRowid)

      this.syncQueue.enqueueDefeito(defeitoId, 'CREATE')
    })()
  }

  editar(
    id: number,
    codigo: string,
    descricao: string,
    usuarioId: number = USUARIO_SISTEMA_ID
  ): void {
    const codigoFormatado = codigo.trim().toUpperCase()
    const descricaoFormatada = descricao.trim()

    const duplicado = db
      .prepare(
        `
        SELECT id, ativo
        FROM defeitos
        WHERE codigo = ?
          AND id <> ?
        LIMIT 1
      `
      )
      .get(codigoFormatado, id) as { id: number; ativo: number } | undefined

    if (duplicado?.ativo === 1) {
      throw new Error('DEFEITO_DUPLICADO')
    }

    if (duplicado?.ativo === 0) {
      throw new Error(
        'Já existe um defeito inativo com este código. Altere o código ou restaure o defeito inativo.'
      )
    }

    db.transaction(() => {
      const resultado = db
        .prepare(
          `
          UPDATE defeitos
          SET
            codigo = ?,
            descricao = ?,
            updated_at = datetime('now','localtime'),
            updated_by = ?
          WHERE id = ?
        `
        )
        .run(codigoFormatado, descricaoFormatada, usuarioId, id)

      if (resultado.changes === 0) {
        throw new Error('Defeito não encontrado.')
      }

      this.syncQueue.enqueueDefeito(id, 'UPDATE')
    })()
  }

  excluir(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    db.transaction(() => {
      const resultado = db
        .prepare(
          `
          UPDATE defeitos
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
        throw new Error('Defeito não encontrado ou já está inativo.')
      }

      this.syncQueue.enqueueDefeito(id, 'DELETE')
    })()
  }

  restaurar(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    db.transaction(() => {
      const resultado = db
        .prepare(
          `
          UPDATE defeitos
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
        throw new Error('Defeito não encontrado ou já está ativo.')
      }

      this.syncQueue.enqueueDefeito(id, 'UPDATE')
    })()
  }

  excluirPermanente(id: number): void {
    const emUso = db
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM refugo_itens
        WHERE defeito_id = ?
      `
      )
      .get(id) as { total: number } | undefined

    if (Number(emUso?.total ?? 0) > 0) {
      throw new Error('DEFEITO_EM_USO')
    }

    db.prepare(
      `
      DELETE FROM defeitos
      WHERE id = ?
        AND ativo = 0
    `
    ).run(id)
  }
}
