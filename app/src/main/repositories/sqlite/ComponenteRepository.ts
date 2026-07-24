import db from '../../database/database'
import { IdGenerator } from '../../shared/ids/IdGenerator'
import { SyncQueueRepository } from '../../sync/SyncQueueRepository'

const USUARIO_SISTEMA_ID = 1

export interface Componente {
  id: number
  uuid: string
  codigo: string
  nome: string
  precoAtual: number
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

type ComponenteRow = {
  id: number
  uuid: string
  codigo: string
  nome: string
  precoAtual: number
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

export class ComponenteRepository {
  private readonly syncQueue = new SyncQueueRepository()

  private consultaBase(): string {
    return `
      SELECT
        c.id,
        c.uuid,
        c.codigo,
        c.nome,
        COALESCE((
          SELECT cp.valor_unitario
          FROM componentes_precos cp
          WHERE cp.componente_id = c.id
          ORDER BY cp.id DESC
          LIMIT 1
        ), 0) AS precoAtual,
        c.ativo,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt,
        c.deleted_at AS deletedAt,
        c.created_by AS createdBy,
        c.updated_by AS updatedBy,
        c.deleted_by AS deletedBy,
        criado.nome AS createdByNome,
        atualizado.nome AS updatedByNome,
        removido.nome AS deletedByNome
      FROM componentes c
      LEFT JOIN usuarios criado ON criado.id = c.created_by
      LEFT JOIN usuarios atualizado ON atualizado.id = c.updated_by
      LEFT JOIN usuarios removido ON removido.id = c.deleted_by
    `
  }

  private mapear(componente: ComponenteRow): Componente {
    return {
      ...componente,
      precoAtual: Number(componente.precoAtual ?? 0),
      ativo: Boolean(componente.ativo)
    }
  }

  listar(): Componente[] {
    const componentes = db
      .prepare(
        `
        ${this.consultaBase()}
        WHERE c.ativo = 1
        ORDER BY c.codigo
      `
      )
      .all() as ComponenteRow[]

    return componentes.map((componente) => this.mapear(componente))
  }

  listarInativos(): Componente[] {
    const componentes = db
      .prepare(
        `
        ${this.consultaBase()}
        WHERE c.ativo = 0
        ORDER BY c.codigo
      `
      )
      .all() as ComponenteRow[]

    return componentes.map((componente) => this.mapear(componente))
  }

  criar(
    codigo: string,
    nome: string,
    precoAtual = 0,
    usuarioId: number = USUARIO_SISTEMA_ID
  ): void {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const existente = db
      .prepare(
        `
        SELECT id, ativo
        FROM componentes
        WHERE codigo = ?
        LIMIT 1
      `
      )
      .get(codigoFormatado) as { id: number; ativo: number } | undefined

    if (existente?.ativo === 1) {
      throw new Error('COMPONENTE_DUPLICADO')
    }

    if (existente?.ativo === 0) {
      throw new Error(
        'Já existe um componente inativo com este código. Restaure o componente em vez de criar outro.'
      )
    }

    const executar = db.transaction(() => {
      const resultado = db
        .prepare(
          `
          INSERT INTO componentes (
            uuid,
            codigo,
            nome,
            ativo,
            created_at,
            updated_at,
            created_by,
            updated_by
          )
          VALUES (?, ?, ?, 1, datetime('now','localtime'), datetime('now','localtime'), ?, ?)
        `
        )
        .run(IdGenerator.generate(), codigoFormatado, nomeFormatado, usuarioId, usuarioId)

      const componenteId = Number(resultado.lastInsertRowid)

      if (precoAtual > 0) {
        this.atualizarPreco(componenteId, precoAtual)
      }

      this.syncQueue.enqueueComponente(componenteId, 'CREATE')
    })

    executar()
  }

  editar(
    id: number,
    codigo: string,
    nome: string,
    precoAtual = 0,
    usuarioId: number = USUARIO_SISTEMA_ID
  ): void {
    const codigoFormatado = codigo.trim().toUpperCase()
    const nomeFormatado = nome.trim()

    const duplicado = db
      .prepare(
        `
        SELECT id, ativo
        FROM componentes
        WHERE codigo = ?
          AND id <> ?
        LIMIT 1
      `
      )
      .get(codigoFormatado, id) as { id: number; ativo: number } | undefined

    if (duplicado?.ativo === 1) {
      throw new Error('COMPONENTE_DUPLICADO')
    }

    if (duplicado?.ativo === 0) {
      throw new Error(
        'Já existe um componente inativo com este código. Altere o código ou restaure o componente inativo.'
      )
    }

    const executar = db.transaction(() => {
      const resultado = db
        .prepare(
          `
          UPDATE componentes
          SET
            codigo = ?,
            nome = ?,
            updated_at = datetime('now','localtime'),
            updated_by = ?
          WHERE id = ?
        `
        )
        .run(codigoFormatado, nomeFormatado, usuarioId, id)

      if (resultado.changes === 0) {
        throw new Error('Componente não encontrado.')
      }

      this.atualizarPreco(id, precoAtual)
      this.syncQueue.enqueueComponente(id, 'UPDATE')
    })

    executar()
  }

  atualizarPreco(componenteId: number, valorUnitario: number): void {
    const valor = Number(valorUnitario) || 0

    const precoAtual = db
      .prepare(
        `
        SELECT id, valor_unitario AS valorUnitario
        FROM componentes_precos
        WHERE componente_id = ?
          AND ativo = 1
          AND vigencia_fim IS NULL
        ORDER BY id DESC
        LIMIT 1
      `
      )
      .get(componenteId) as { id: number; valorUnitario: number } | undefined

    if (precoAtual && Number(precoAtual.valorUnitario) === valor) {
      return
    }

    if (precoAtual) {
      db.prepare(
        `
        UPDATE componentes_precos
        SET
          ativo = 0,
          vigencia_fim = date('now','localtime')
        WHERE id = ?
      `
      ).run(precoAtual.id)
    }

    if (valor > 0) {
      db.prepare(
        `
        INSERT INTO componentes_precos (
          uuid,
          componente_id,
          valor_unitario,
          vigencia_inicio,
          vigencia_fim,
          ativo,
          criado_em
        )
        VALUES (?, ?, ?, date('now','localtime'), NULL, 1, datetime('now','localtime'))
      `
      ).run(IdGenerator.generate(), componenteId, valor)
    }
  }

  excluir(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    db.transaction(() => {
      const resultado = db
        .prepare(
          `
          UPDATE componentes
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
        throw new Error('Componente não encontrado ou já está inativo.')
      }

      this.syncQueue.enqueueComponente(id, 'DELETE')
    })()
  }

  restaurar(id: number, usuarioId: number = USUARIO_SISTEMA_ID): void {
    db.transaction(() => {
      const resultado = db
        .prepare(
          `
          UPDATE componentes
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
        throw new Error('Componente não encontrado ou já está ativo.')
      }

      this.syncQueue.enqueueComponente(id, 'UPDATE')
    })()
  }

  excluirPermanente(id: number): void {
    const vinculos = [
      db
        .prepare(
          `
        SELECT COUNT(*) AS total
        FROM circuito_componentes
        WHERE componente_id = ?
      `
        )
        .get(id) as { total: number },
      db
        .prepare(
          `
        SELECT COUNT(*) AS total
        FROM circuito_posto_componentes
        WHERE componente_id = ?
      `
        )
        .get(id) as { total: number },
      db
        .prepare(
          `
        SELECT COUNT(*) AS total
        FROM refugo_itens
        WHERE componente_id = ?
      `
        )
        .get(id) as { total: number }
    ]

    if (vinculos.some((item) => Number(item.total) > 0)) {
      throw new Error('COMPONENTE_EM_USO')
    }

    db.transaction(() => {
      db.prepare(
        `
        DELETE FROM componentes_precos
        WHERE componente_id = ?
      `
      ).run(id)

      db.prepare(
        `
        DELETE FROM componentes
        WHERE id = ?
          AND ativo = 0
      `
      ).run(id)
    })()
  }
}
