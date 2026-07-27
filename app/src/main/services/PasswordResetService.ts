import { getDatabase } from '../database/connection'
import { pool } from '../database/postgres/connection'
import { getDatabaseProvider } from '../repositories/factory/getDatabaseProvider'
import { IdGenerator } from '../shared/ids/IdGenerator'
import { SyncQueueRepository } from '../sync/SyncQueueRepository'
import {
  gerarHashSenha,
  gerarSenhaTemporaria,
  verificarSenha
} from '../shared/security/password'

export type SolicitacaoSenha = {
  id: number
  uuid: string
  usuarioId: number
  usuarioNome: string
  usuarioMatricula: string
  status: 'PENDENTE' | 'ATENDIDA' | 'CANCELADA'
  solicitadoEm: string
  atendidoEm: string | null
  canceladoEm: string | null
  atendidoPor: number | null
  atendidoPorNome: string | null
  canceladoPor: number | null
  canceladoPorNome: string | null
}

type Resultado = {
  sucesso: boolean
  mensagem: string
  senhaTemporaria?: string
}

const db = getDatabase()
const syncQueue = new SyncQueueRepository()

function podeAdministrarSenha(perfil: string): boolean {
  return perfil === 'ADMIN' || perfil === 'QUALIDADE'
}

export class PasswordResetService {
  async solicitar(matricula: string): Promise<Resultado> {
    const matriculaNormalizada = matricula.trim()

    if (!matriculaNormalizada) {
      return {
        sucesso: true,
        mensagem:
          'Se a matrícula estiver cadastrada e ativa, a solicitação será encaminhada.'
      }
    }

    if (getDatabaseProvider() === 'postgres') {
      const usuario = await pool.query<{
        id: number
        ativo: boolean
        deleted_at: string | null
      }>(
        `
          SELECT id, ativo, deleted_at
          FROM usuarios
          WHERE matricula = $1
          LIMIT 1
        `,
        [matriculaNormalizada]
      )

      const encontrado = usuario.rows[0]

      if (encontrado?.ativo && !encontrado.deleted_at) {
        await pool.query(
          `
            INSERT INTO solicitacoes_alteracao_senha (
              uuid,
              usuario_id,
              status,
              solicitado_em,
              created_at,
              updated_at
            )
            SELECT
              $1,
              $2,
              'PENDENTE',
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP
            WHERE NOT EXISTS (
              SELECT 1
              FROM solicitacoes_alteracao_senha
              WHERE usuario_id = $2
                AND status = 'PENDENTE'
            )
          `,
          [IdGenerator.generate(), encontrado.id]
        )
      }

      return {
        sucesso: true,
        mensagem:
          'Se a matrícula estiver cadastrada e ativa, a solicitação será encaminhada.'
      }
    }

    const usuario = db
      .prepare(
        `
          SELECT id, ativo, deleted_at AS deletedAt
          FROM usuarios
          WHERE matricula = ?
          LIMIT 1
        `
      )
      .get(matriculaNormalizada) as
      | { id: number; ativo: number; deletedAt: string | null }
      | undefined

    if (usuario && Boolean(usuario.ativo) && !usuario.deletedAt) {
      db.transaction(() => {
        const result = db
          .prepare(
            `
              INSERT INTO solicitacoes_alteracao_senha (
                uuid,
                usuario_id,
                status,
                solicitado_em,
                created_at,
                updated_at
              )
              SELECT
                ?,
                ?,
                'PENDENTE',
                datetime('now','localtime'),
                datetime('now','localtime'),
                datetime('now','localtime')
              WHERE NOT EXISTS (
                SELECT 1
                FROM solicitacoes_alteracao_senha
                WHERE usuario_id = ?
                  AND status = 'PENDENTE'
              )
            `
          )
          .run(IdGenerator.generate(), usuario.id, usuario.id)

        if (result.changes > 0) {
          syncQueue.enqueueSolicitacaoAlteracaoSenha(
            Number(result.lastInsertRowid),
            'CREATE'
          )
        }
      })()
    }

    return {
      sucesso: true,
      mensagem:
        'Se a matrícula estiver cadastrada e ativa, a solicitação será encaminhada.'
    }
  }

  async listarPendentes(): Promise<SolicitacaoSenha[]> {
    if (getDatabaseProvider() === 'postgres') {
      const result = await pool.query<SolicitacaoSenha>(`
        SELECT
          s.id,
          s.uuid,
          s.usuario_id AS "usuarioId",
          u.nome AS "usuarioNome",
          u.matricula AS "usuarioMatricula",
          s.status,
          s.solicitado_em AS "solicitadoEm",
          s.atendido_em AS "atendidoEm",
          s.cancelado_em AS "canceladoEm",
          s.atendido_por AS "atendidoPor",
          au.nome AS "atendidoPorNome",
          s.cancelado_por AS "canceladoPor",
          cu.nome AS "canceladoPorNome"
        FROM solicitacoes_alteracao_senha s
        INNER JOIN usuarios u ON u.id = s.usuario_id
        LEFT JOIN usuarios au ON au.id = s.atendido_por
        LEFT JOIN usuarios cu ON cu.id = s.cancelado_por
        WHERE s.status = 'PENDENTE'
        ORDER BY s.solicitado_em ASC
      `)

      return result.rows
    }

    return db
      .prepare(
        `
          SELECT
            s.id,
            s.uuid,
            s.usuario_id AS usuarioId,
            u.nome AS usuarioNome,
            u.matricula AS usuarioMatricula,
            s.status,
            s.solicitado_em AS solicitadoEm,
            s.atendido_em AS atendidoEm,
            s.cancelado_em AS canceladoEm,
            s.atendido_por AS atendidoPor,
            au.nome AS atendidoPorNome,
            s.cancelado_por AS canceladoPor,
            cu.nome AS canceladoPorNome
          FROM solicitacoes_alteracao_senha s
          INNER JOIN usuarios u ON u.id = s.usuario_id
          LEFT JOIN usuarios au ON au.id = s.atendido_por
          LEFT JOIN usuarios cu ON cu.id = s.cancelado_por
          WHERE s.status = 'PENDENTE'
          ORDER BY s.solicitado_em ASC
        `
      )
      .all() as SolicitacaoSenha[]
  }

  async atender(solicitacaoId: number, atendenteId: number): Promise<Resultado> {
    const senhaTemporaria = gerarSenhaTemporaria()
    const senhaHash = gerarHashSenha(senhaTemporaria)

    if (getDatabaseProvider() === 'postgres') {
      const client = await pool.connect()

      try {
        await client.query('BEGIN')

        const atendente = await client.query<{ perfil: string }>(
          `
            SELECT perfil
            FROM usuarios
            WHERE id = $1
              AND ativo = true
              AND deleted_at IS NULL
          `,
          [atendenteId]
        )

        if (!atendente.rows[0] || !podeAdministrarSenha(atendente.rows[0].perfil)) {
          throw new Error('SEM_PERMISSAO')
        }

        const solicitacao = await client.query<{ usuario_id: number }>(
          `
            SELECT usuario_id
            FROM solicitacoes_alteracao_senha
            WHERE id = $1
              AND status = 'PENDENTE'
            FOR UPDATE
          `,
          [solicitacaoId]
        )

        if (!solicitacao.rows[0]) {
          throw new Error('SOLICITACAO_INDISPONIVEL')
        }

        await client.query(
          `
            UPDATE usuarios
            SET
              senha_hash = $1,
              deve_trocar_senha = true,
              updated_at = CURRENT_TIMESTAMP,
              updated_by = $2
            WHERE id = $3
              AND ativo = true
              AND deleted_at IS NULL
          `,
          [senhaHash, atendenteId, solicitacao.rows[0].usuario_id]
        )

        await client.query(
          `
            UPDATE solicitacoes_alteracao_senha
            SET
              status = 'ATENDIDA',
              atendido_em = CURRENT_TIMESTAMP,
              atendido_por = $2,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `,
          [solicitacaoId, atendenteId]
        )

        await client.query('COMMIT')

        return {
          sucesso: true,
          mensagem: 'Senha temporária gerada com sucesso.',
          senhaTemporaria
        }
      } catch (error) {
        await client.query('ROLLBACK')

        const mensagem =
          error instanceof Error && error.message === 'SEM_PERMISSAO'
            ? 'Você não possui permissão para gerar senhas temporárias.'
            : error instanceof Error && error.message === 'SOLICITACAO_INDISPONIVEL'
              ? 'Esta solicitação já foi atendida ou cancelada.'
              : 'Não foi possível atender a solicitação.'

        return { sucesso: false, mensagem }
      } finally {
        client.release()
      }
    }

    const transacao = db.transaction(() => {
      const atendente = db
        .prepare(
          `
            SELECT perfil
            FROM usuarios
            WHERE id = ?
              AND ativo = 1
              AND deleted_at IS NULL
          `
        )
        .get(atendenteId) as { perfil: string } | undefined

      if (!atendente || !podeAdministrarSenha(atendente.perfil)) {
        throw new Error('SEM_PERMISSAO')
      }

      const solicitacao = db
        .prepare(
          `
            SELECT usuario_id AS usuarioId
            FROM solicitacoes_alteracao_senha
            WHERE id = ?
              AND status = 'PENDENTE'
          `
        )
        .get(solicitacaoId) as { usuarioId: number } | undefined

      if (!solicitacao) {
        throw new Error('SOLICITACAO_INDISPONIVEL')
      }

      const usuarioAtualizado = db
        .prepare(
          `
            UPDATE usuarios
            SET
              senha_hash = ?,
              deve_trocar_senha = 1,
              updated_at = datetime('now','localtime'),
              updated_by = ?
            WHERE id = ?
              AND ativo = 1
              AND deleted_at IS NULL
          `
        )
        .run(senhaHash, atendenteId, solicitacao.usuarioId)

      if (usuarioAtualizado.changes !== 1) {
        throw new Error('SOLICITACAO_INDISPONIVEL')
      }

      const solicitacaoAtualizada = db
        .prepare(
          `
            UPDATE solicitacoes_alteracao_senha
            SET
              status = 'ATENDIDA',
              atendido_em = datetime('now','localtime'),
              atendido_por = ?,
              updated_at = datetime('now','localtime')
            WHERE id = ?
              AND status = 'PENDENTE'
          `
        )
        .run(atendenteId, solicitacaoId)

      if (solicitacaoAtualizada.changes !== 1) {
        throw new Error('SOLICITACAO_INDISPONIVEL')
      }

      syncQueue.enqueueUsuario(solicitacao.usuarioId, 'UPDATE')
      syncQueue.enqueueSolicitacaoAlteracaoSenha(solicitacaoId, 'UPDATE')
    })

    try {
      transacao()

      return {
        sucesso: true,
        mensagem: 'Senha temporária gerada com sucesso.',
        senhaTemporaria
      }
    } catch (error) {
      const mensagem =
        error instanceof Error && error.message === 'SEM_PERMISSAO'
          ? 'Você não possui permissão para gerar senhas temporárias.'
          : error instanceof Error && error.message === 'SOLICITACAO_INDISPONIVEL'
            ? 'Esta solicitação já foi atendida ou cancelada.'
            : 'Não foi possível atender a solicitação.'

      return { sucesso: false, mensagem }
    }
  }

  async cancelar(solicitacaoId: number, responsavelId: number): Promise<Resultado> {
    if (getDatabaseProvider() === 'postgres') {
      const responsavel = await pool.query<{ perfil: string }>(
        `
          SELECT perfil
          FROM usuarios
          WHERE id = $1
            AND ativo = true
            AND deleted_at IS NULL
        `,
        [responsavelId]
      )

      if (!responsavel.rows[0] || !podeAdministrarSenha(responsavel.rows[0].perfil)) {
        return {
          sucesso: false,
          mensagem: 'Você não possui permissão para cancelar solicitações.'
        }
      }

      const result = await pool.query(
        `
          UPDATE solicitacoes_alteracao_senha
          SET
            status = 'CANCELADA',
            cancelado_em = CURRENT_TIMESTAMP,
            cancelado_por = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
            AND status = 'PENDENTE'
        `,
        [solicitacaoId, responsavelId]
      )

      return {
        sucesso: (result.rowCount ?? 0) > 0,
        mensagem:
          (result.rowCount ?? 0) > 0
            ? 'Solicitação cancelada.'
            : 'Esta solicitação já foi atendida ou cancelada.'
      }
    }

    const responsavel = db
      .prepare(
        `
          SELECT perfil
          FROM usuarios
          WHERE id = ?
            AND ativo = 1
            AND deleted_at IS NULL
        `
      )
      .get(responsavelId) as { perfil: string } | undefined

    if (!responsavel || !podeAdministrarSenha(responsavel.perfil)) {
      return {
        sucesso: false,
        mensagem: 'Você não possui permissão para cancelar solicitações.'
      }
    }

    const changes = db.transaction(() => {
      const result = db
        .prepare(
          `
            UPDATE solicitacoes_alteracao_senha
            SET
              status = 'CANCELADA',
              cancelado_em = datetime('now','localtime'),
              cancelado_por = ?,
              updated_at = datetime('now','localtime')
            WHERE id = ?
              AND status = 'PENDENTE'
          `
        )
        .run(responsavelId, solicitacaoId)

      if (result.changes > 0) {
        syncQueue.enqueueSolicitacaoAlteracaoSenha(solicitacaoId, 'UPDATE')
      }

      return result.changes
    })()

    return {
      sucesso: changes > 0,
      mensagem:
        changes > 0
          ? 'Solicitação cancelada.'
          : 'Esta solicitação já foi atendida ou cancelada.'
    }
  }

  async alterarSenhaObrigatoria(
    usuarioId: number,
    senhaAtual: string,
    novaSenha: string
  ): Promise<Resultado> {
    if (novaSenha.trim().length < 8) {
      return {
        sucesso: false,
        mensagem: 'A nova senha deve possuir pelo menos 8 caracteres.'
      }
    }

    if (senhaAtual === novaSenha) {
      return {
        sucesso: false,
        mensagem: 'A nova senha deve ser diferente da senha temporária.'
      }
    }

    if (getDatabaseProvider() === 'postgres') {
      const usuario = await pool.query<{
        senha_hash: string | null
        deve_trocar_senha: boolean
      }>(
        `
          SELECT senha_hash, deve_trocar_senha
          FROM usuarios
          WHERE id = $1
            AND ativo = true
            AND deleted_at IS NULL
        `,
        [usuarioId]
      )

      const encontrado = usuario.rows[0]

      if (
        !encontrado?.senha_hash ||
        !encontrado.deve_trocar_senha ||
        !verificarSenha(senhaAtual, encontrado.senha_hash)
      ) {
        return {
          sucesso: false,
          mensagem: 'Senha temporária inválida.'
        }
      }

      await pool.query(
        `
          UPDATE usuarios
          SET
            senha_hash = $1,
            deve_trocar_senha = false,
            senha_alterada_em = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $2
          WHERE id = $2
        `,
        [gerarHashSenha(novaSenha), usuarioId]
      )

      return {
        sucesso: true,
        mensagem: 'Senha alterada com sucesso.'
      }
    }

    try {
      db.transaction(() => {
        const usuario = db
          .prepare(
            `
              SELECT
                senha_hash AS senhaHash,
                deve_trocar_senha AS deveTrocarSenha
              FROM usuarios
              WHERE id = ?
                AND ativo = 1
                AND deleted_at IS NULL
            `
          )
          .get(usuarioId) as
          | { senhaHash: string | null; deveTrocarSenha: number }
          | undefined

        if (
          !usuario?.senhaHash ||
          !Boolean(usuario.deveTrocarSenha) ||
          !verificarSenha(senhaAtual, usuario.senhaHash)
        ) {
          throw new Error('SENHA_TEMPORARIA_INVALIDA')
        }

        const result = db
          .prepare(
            `
              UPDATE usuarios
              SET
                senha_hash = ?,
                deve_trocar_senha = 0,
                senha_alterada_em = datetime('now','localtime'),
                updated_at = datetime('now','localtime'),
                updated_by = ?
              WHERE id = ?
                AND ativo = 1
                AND deleted_at IS NULL
            `
          )
          .run(gerarHashSenha(novaSenha), usuarioId, usuarioId)

        if (result.changes !== 1) {
          throw new Error('SENHA_TEMPORARIA_INVALIDA')
        }

        syncQueue.enqueueUsuario(usuarioId, 'UPDATE')
      })()

      return {
        sucesso: true,
        mensagem: 'Senha alterada com sucesso.'
      }
    } catch (error) {
      return {
        sucesso: false,
        mensagem:
          error instanceof Error && error.message === 'SENHA_TEMPORARIA_INVALIDA'
            ? 'Senha temporária inválida.'
            : 'Não foi possível alterar a senha.'
      }
    }
  }
}