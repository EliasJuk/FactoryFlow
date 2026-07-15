import { getDatabase } from '../../database/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

const db = getDatabase()
const USUARIO_SISTEMA_ID = 1

export interface Posto {
  id: number
  uuid: string
  nome: string
  subsetorId: number
  subsetorNome: string
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

type PostoRow = {
  id: number
  uuid: string
  nome: string
  subsetorId: number
  subsetorNome: string
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

export class PostoRepository {
  private mapear(posto: PostoRow): Posto {
    return {
      ...posto,
      ativo: Boolean(posto.ativo)
    }
  }

  private consultaBase(): string {
    return `
      SELECT
        p.id,
        p.uuid,
        p.nome,
        p.subsetor_id AS subsetorId,
        ss.nome AS subsetorNome,
        s.nome AS setorNome,
        p.ativo,
        p.created_at AS createdAt,
        p.updated_at AS updatedAt,
        p.deleted_at AS deletedAt,
        p.created_by AS createdBy,
        p.updated_by AS updatedBy,
        p.deleted_by AS deletedBy,
        criado.nome AS createdByNome,
        atualizado.nome AS updatedByNome,
        removido.nome AS deletedByNome
      FROM postos p
      INNER JOIN subsetores ss ON ss.id = p.subsetor_id
      INNER JOIN setores s ON s.id = ss.setor_id
      LEFT JOIN usuarios criado ON criado.id = p.created_by
      LEFT JOIN usuarios atualizado ON atualizado.id = p.updated_by
      LEFT JOIN usuarios removido ON removido.id = p.deleted_by
    `
  }

  listar(): Posto[] {
    const postos = db
      .prepare(
        `
        ${this.consultaBase()}
        WHERE p.ativo = 1
        ORDER BY s.nome, ss.nome, p.nome
      `
      )
      .all() as PostoRow[]

    return postos.map((posto) => this.mapear(posto))
  }

  listarInativos(): Posto[] {
    const postos = db
      .prepare(
        `
        ${this.consultaBase()}
        WHERE p.ativo = 0
        ORDER BY s.nome, ss.nome, p.nome
      `
      )
      .all() as PostoRow[]

    return postos.map((posto) => this.mapear(posto))
  }

  criar(nome: string, subsetorId: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    const nomeFormatado = nome.trim()
    const uuid = IdGenerator.generate()

    const existente = db
      .prepare(
        `
        SELECT id, ativo
        FROM postos
        WHERE nome = ?
          AND subsetor_id = ?
        LIMIT 1
      `
      )
      .get(nomeFormatado, subsetorId) as { id: number; ativo: number } | undefined

    if (existente?.ativo === 1) {
      throw new Error('POSTO_DUPLICADO')
    }

    if (existente?.ativo === 0) {
      throw new Error(
        'Já existe um posto inativo com esse nome neste subsetor. Restaure o posto em vez de criar outro.'
      )
    }

    db.prepare(
      `
      INSERT INTO postos (
        uuid,
        nome,
        subsetor_id,
        ativo,
        created_at,
        updated_at,
        created_by,
        updated_by
      )
      VALUES (?, ?, ?, 1, datetime('now','localtime'), datetime('now','localtime'), ?, ?)
    `
    ).run(uuid, nomeFormatado, subsetorId, usuarioId, usuarioId)
  }

  editar(
    id: number,
    nome: string,
    subsetorId: number,
    usuarioId: number = USUARIO_SISTEMA_ID
  ): void {
    const nomeFormatado = nome.trim()

    const duplicado = db
      .prepare(
        `
        SELECT id, ativo
        FROM postos
        WHERE nome = ?
          AND subsetor_id = ?
          AND id <> ?
        LIMIT 1
      `
      )
      .get(nomeFormatado, subsetorId, id) as { id: number; ativo: number } | undefined

    if (duplicado?.ativo === 1) {
      throw new Error('POSTO_DUPLICADO')
    }

    if (duplicado?.ativo === 0) {
      throw new Error(
        'Já existe um posto inativo com esse nome neste subsetor. Altere o nome ou restaure o posto inativo.'
      )
    }

    db.prepare(
      `
      UPDATE postos
      SET
        nome = ?,
        subsetor_id = ?,
        updated_at = datetime('now','localtime'),
        updated_by = ?
      WHERE id = ?
    `
    ).run(nomeFormatado, subsetorId, usuarioId, id)
  }

  contarRoteirosAtivos(id: number): number {
    const resultado = db
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM circuito_posto_componentes
        WHERE posto_id = ?
          AND ativo = 1
      `
      )
      .get(id) as { total: number }

    return resultado.total
  }

  excluir(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    const total = this.contarRoteirosAtivos(id)

    if (total > 0) {
      throw new Error('POSTO_COM_VINCULOS')
    }

    db.prepare(
      `
      UPDATE postos
      SET
        ativo = 0,
        updated_at = datetime('now','localtime'),
        updated_by = ?,
        deleted_at = datetime('now','localtime'),
        deleted_by = ?
      WHERE id = ?
    `
    ).run(usuarioId, usuarioId, id)
  }

  restaurar(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    db.prepare(
      `
      UPDATE postos
      SET
        ativo = 1,
        updated_at = datetime('now','localtime'),
        updated_by = ?,
        deleted_at = NULL,
        deleted_by = NULL
      WHERE id = ?
    `
    ).run(usuarioId, id)
  }

  excluirPermanente(id: number): void {
    const resultado = db
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM circuito_posto_componentes
        WHERE posto_id = ?
      `
      )
      .get(id) as { total: number }

    if (resultado.total > 0) {
      throw new Error('POSTO_COM_VINCULOS')
    }

    db.prepare(
      `
      DELETE FROM postos
      WHERE id = ?
        AND ativo = 0
    `
    ).run(id)
  }
}
