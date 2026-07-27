import db from '../database/database'
import { loadConfig } from '../config/appConfig'
import { IdGenerator } from '../shared/ids/IdGenerator'

import type {
  CircuitoComponenteSyncPayload,
  CircuitoSyncPayload,
  ComponenteSyncPayload,
  DefeitoSyncPayload,
  PostoDefeitoSyncPayload,
  PostoSyncPayload,
  RefugoSyncItemPayload,
  RoteiroSyncPayload,
  RefugoSyncPayload,
  SetorSyncPayload,
  SolicitacaoAlteracaoSenhaSyncPayload,
  SubsetorSyncPayload,
  SyncEntity,
  SyncOperation,
  SyncPayload,
  UsuarioSyncPayload
} from './sync.types'

type RefugoRow = Omit<RefugoSyncPayload['record'], 'itens'>
type RefugoItemRow = RefugoSyncItemPayload

export class SyncQueueRepository {
  private shouldEnqueue(): boolean {
    const config = loadConfig()
    return (
      config.database.mode === 'sqliteSync' &&
      config.sync.enabled &&
      config.sync.destination === 'postgres'
    )
  }

  private installationUuid(): string {
    const row = db
      .prepare('SELECT machine_uuid AS machineUuid FROM sync_installation WHERE id = 1')
      .get() as { machineUuid: string } | undefined

    if (!row) throw new Error('Instalação de sincronização não inicializada.')
    return row.machineUuid
  }

  private enqueue(
    entity: SyncEntity,
    recordUuid: string,
    operation: SyncOperation,
    payload: SyncPayload,
    ifMissing = false
  ): void {
    if (!this.shouldEnqueue()) return

    if (ifMissing) {
      const exists = db
        .prepare('SELECT 1 FROM sync_queue WHERE entity = ? AND record_uuid = ? LIMIT 1')
        .get(entity, recordUuid)
      if (exists) return
    }

    db.prepare(
      `
      INSERT INTO sync_queue (
        uuid, entity, record_uuid, operation, payload,
        status, attempts, max_attempts, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, 'PENDENTE', 0, 10,
        datetime('now','localtime'), datetime('now','localtime')
      )
    `
    ).run(IdGenerator.generate(), entity, recordUuid, operation, JSON.stringify(payload))
  }

  enqueueUsuario(id: number, operation: UsuarioSyncPayload['operation'], ifMissing = false): void {
    if (!this.shouldEnqueue()) return

    const row = db
      .prepare(
        `
      SELECT usuario.uuid,
             usuario.nome,
             usuario.matricula,
             usuario.perfil,
             usuario.senha_hash AS senhaHash,
             usuario.deve_trocar_senha AS deveTrocarSenha,
             usuario.ativo,
             usuario.created_at AS createdAt,
             usuario.updated_at AS updatedAt,
             usuario.deleted_at AS deletedAt,
             criador.uuid AS createdByUuid,
             atualizador.uuid AS updatedByUuid,
             excluidor.uuid AS deletedByUuid
      FROM usuarios usuario
      LEFT JOIN usuarios criador ON criador.id = usuario.created_by
      LEFT JOIN usuarios atualizador ON atualizador.id = usuario.updated_by
      LEFT JOIN usuarios excluidor ON excluidor.id = usuario.deleted_by
      WHERE usuario.id = ?
    `
      )
      .get(id) as
      | {
          uuid: string
          nome: string
          matricula: string
          perfil: string
          senhaHash: string | null
          deveTrocarSenha: number
          ativo: number
          createdAt: string
          updatedAt: string
          deletedAt: string | null
          createdByUuid: string | null
          updatedByUuid: string | null
          deletedByUuid: string | null
        }
      | undefined

    if (!row) throw new Error('Usuário não encontrado para sincronização.')

    const payload: UsuarioSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'USUARIO',
      operation,
      record: {
        ...row,
        deveTrocarSenha: Boolean(row.deveTrocarSenha),
        ativo: Boolean(row.ativo)
      }
    }

    this.enqueue('USUARIO', row.uuid, operation, payload, ifMissing)
  }


  enqueueSolicitacaoAlteracaoSenha(
    id: number,
    operation: SolicitacaoAlteracaoSenhaSyncPayload['operation'],
    ifMissing = false
  ): void {
    if (!this.shouldEnqueue()) return

    const row = db
      .prepare(
        `
        SELECT
          solicitacao.uuid,
          usuario.uuid AS usuarioUuid,
          solicitacao.status,
          solicitacao.solicitado_em AS solicitadoEm,
          solicitacao.atendido_em AS atendidoEm,
          solicitacao.cancelado_em AS canceladoEm,
          atendente.uuid AS atendidoPorUuid,
          cancelador.uuid AS canceladoPorUuid,
          solicitacao.created_at AS createdAt,
          solicitacao.updated_at AS updatedAt,
          NULL AS deletedAt,
          NULL AS createdByUuid,
          NULL AS updatedByUuid,
          NULL AS deletedByUuid
        FROM solicitacoes_alteracao_senha solicitacao
        INNER JOIN usuarios usuario ON usuario.id = solicitacao.usuario_id
        LEFT JOIN usuarios atendente ON atendente.id = solicitacao.atendido_por
        LEFT JOIN usuarios cancelador ON cancelador.id = solicitacao.cancelado_por
        WHERE solicitacao.id = ?
        `
      )
      .get(id) as SolicitacaoAlteracaoSenhaSyncPayload['record'] | undefined

    if (!row) {
      throw new Error('Solicitação de alteração de senha não encontrada para sincronização.')
    }

    const payload: SolicitacaoAlteracaoSenhaSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'SOLICITACAO_ALTERACAO_SENHA',
      operation,
      record: row
    }

    this.enqueue(
      'SOLICITACAO_ALTERACAO_SENHA',
      row.uuid,
      operation,
      payload,
      ifMissing
    )
  }

  enqueueSetor(id: number, operation: SetorSyncPayload['operation'], ifMissing = false): void {
    if (!this.shouldEnqueue()) return

    const row = db
      .prepare(
        `
      SELECT s.uuid, s.nome, s.sigla, s.ativo,
             s.created_at AS createdAt,
             s.updated_at AS updatedAt,
             s.deleted_at AS deletedAt,
             c.uuid AS createdByUuid,
             u.uuid AS updatedByUuid,
             d.uuid AS deletedByUuid
      FROM setores s
      LEFT JOIN usuarios c ON c.id = s.created_by
      LEFT JOIN usuarios u ON u.id = s.updated_by
      LEFT JOIN usuarios d ON d.id = s.deleted_by
      WHERE s.id = ?
    `
      )
      .get(id) as any

    if (!row) throw new Error('Setor não encontrado para sincronização.')

    const payload: SetorSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'SETOR',
      operation,
      record: { ...row, ativo: Boolean(row.ativo) }
    }

    this.enqueue('SETOR', row.uuid, operation, payload, ifMissing)
  }

  enqueueSubsetor(
    id: number,
    operation: SubsetorSyncPayload['operation'],
    ifMissing = false
  ): void {
    if (!this.shouldEnqueue()) return

    const row = db
      .prepare(
        `
      SELECT ss.uuid, ss.nome, s.uuid AS setorUuid, ss.ativo,
             ss.created_at AS createdAt,
             ss.updated_at AS updatedAt,
             ss.deleted_at AS deletedAt,
             c.uuid AS createdByUuid,
             u.uuid AS updatedByUuid,
             d.uuid AS deletedByUuid
      FROM subsetores ss
      INNER JOIN setores s ON s.id = ss.setor_id
      LEFT JOIN usuarios c ON c.id = ss.created_by
      LEFT JOIN usuarios u ON u.id = ss.updated_by
      LEFT JOIN usuarios d ON d.id = ss.deleted_by
      WHERE ss.id = ?
    `
      )
      .get(id) as any

    if (!row) throw new Error('Subsetor não encontrado para sincronização.')

    const payload: SubsetorSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'SUBSETOR',
      operation,
      record: { ...row, ativo: Boolean(row.ativo) }
    }

    this.enqueue('SUBSETOR', row.uuid, operation, payload, ifMissing)
  }

  enqueuePosto(id: number, operation: PostoSyncPayload['operation'], ifMissing = false): void {
    if (!this.shouldEnqueue()) return

    const row = db
      .prepare(
        `
      SELECT p.uuid, p.nome, ss.uuid AS subsetorUuid, p.ativo,
             p.created_at AS createdAt,
             p.updated_at AS updatedAt,
             p.deleted_at AS deletedAt,
             c.uuid AS createdByUuid,
             u.uuid AS updatedByUuid,
             d.uuid AS deletedByUuid
      FROM postos p
      INNER JOIN subsetores ss ON ss.id = p.subsetor_id
      LEFT JOIN usuarios c ON c.id = p.created_by
      LEFT JOIN usuarios u ON u.id = p.updated_by
      LEFT JOIN usuarios d ON d.id = p.deleted_by
      WHERE p.id = ?
    `
      )
      .get(id) as any

    if (!row) throw new Error('Posto não encontrado para sincronização.')

    const payload: PostoSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'POSTO',
      operation,
      record: { ...row, ativo: Boolean(row.ativo) }
    }

    this.enqueue('POSTO', row.uuid, operation, payload, ifMissing)
  }

  enqueueComponente(
    id: number,
    operation: ComponenteSyncPayload['operation'],
    ifMissing = false
  ): void {
    if (!this.shouldEnqueue()) return

    const row = db
      .prepare(
        `
      SELECT comp.uuid, comp.codigo, comp.nome,
             COALESCE((
               SELECT cp.valor_unitario
               FROM componentes_precos cp
               WHERE cp.componente_id = comp.id
               ORDER BY cp.id DESC
               LIMIT 1
             ), 0) AS precoAtual,
             comp.ativo,
             comp.created_at AS createdAt,
             comp.updated_at AS updatedAt,
             comp.deleted_at AS deletedAt,
             c.uuid AS createdByUuid,
             u.uuid AS updatedByUuid,
             d.uuid AS deletedByUuid
      FROM componentes comp
      LEFT JOIN usuarios c ON c.id = comp.created_by
      LEFT JOIN usuarios u ON u.id = comp.updated_by
      LEFT JOIN usuarios d ON d.id = comp.deleted_by
      WHERE comp.id = ?
    `
      )
      .get(id) as
      | {
          uuid: string
          codigo: string
          nome: string
          precoAtual: number
          ativo: number
          createdAt: string
          updatedAt: string
          deletedAt: string | null
          createdByUuid: string | null
          updatedByUuid: string | null
          deletedByUuid: string | null
        }
      | undefined

    if (!row) throw new Error('Componente não encontrado para sincronização.')

    const payload: ComponenteSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'COMPONENTE',
      operation,
      record: {
        ...row,
        precoAtual: Number(row.precoAtual ?? 0),
        ativo: Boolean(row.ativo)
      }
    }

    this.enqueue('COMPONENTE', row.uuid, operation, payload, ifMissing)
  }

  enqueueCircuito(
    id: number,
    operation: CircuitoSyncPayload['operation'],
    ifMissing = false
  ): void {
    if (!this.shouldEnqueue()) return

    const row = db
      .prepare(
        `
      SELECT circ.uuid, circ.codigo, circ.nome, circ.ativo,
             circ.created_at AS createdAt,
             circ.updated_at AS updatedAt,
             circ.deleted_at AS deletedAt,
             c.uuid AS createdByUuid,
             u.uuid AS updatedByUuid,
             d.uuid AS deletedByUuid
      FROM circuitos circ
      LEFT JOIN usuarios c ON c.id = circ.created_by
      LEFT JOIN usuarios u ON u.id = circ.updated_by
      LEFT JOIN usuarios d ON d.id = circ.deleted_by
      WHERE circ.id = ?
    `
      )
      .get(id) as
      | {
          uuid: string
          codigo: string
          nome: string
          ativo: number
          createdAt: string
          updatedAt: string
          deletedAt: string | null
          createdByUuid: string | null
          updatedByUuid: string | null
          deletedByUuid: string | null
        }
      | undefined

    if (!row) throw new Error('Circuito não encontrado para sincronização.')

    const payload: CircuitoSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'CIRCUITO',
      operation,
      record: { ...row, ativo: Boolean(row.ativo) }
    }

    this.enqueue('CIRCUITO', row.uuid, operation, payload, ifMissing)
  }

  enqueueCircuitoComponente(
    id: number,
    operation: CircuitoComponenteSyncPayload['operation'],
    ifMissing = false
  ): void {
    if (!this.shouldEnqueue()) return

    const row = db
      .prepare(
        `
      SELECT cc.uuid,
             circ.uuid AS circuitoUuid,
             comp.uuid AS componenteUuid,
             cc.quantidade,
             cc.ativo,
             cc.created_at AS createdAt,
             cc.updated_at AS updatedAt,
             cc.deleted_at AS deletedAt,
             c.uuid AS createdByUuid,
             u.uuid AS updatedByUuid,
             d.uuid AS deletedByUuid
      FROM circuito_componentes cc
      INNER JOIN circuitos circ ON circ.id = cc.circuito_id
      INNER JOIN componentes comp ON comp.id = cc.componente_id
      LEFT JOIN usuarios c ON c.id = cc.created_by
      LEFT JOIN usuarios u ON u.id = cc.updated_by
      LEFT JOIN usuarios d ON d.id = cc.deleted_by
      WHERE cc.id = ?
    `
      )
      .get(id) as
      | {
          uuid: string
          circuitoUuid: string
          componenteUuid: string
          quantidade: number
          ativo: number
          createdAt: string
          updatedAt: string
          deletedAt: string | null
          createdByUuid: string | null
          updatedByUuid: string | null
          deletedByUuid: string | null
        }
      | undefined

    if (!row) throw new Error('Vínculo circuito-componente não encontrado para sincronização.')

    const payload: CircuitoComponenteSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'CIRCUITO_COMPONENTE',
      operation,
      record: { ...row, quantidade: Number(row.quantidade), ativo: Boolean(row.ativo) }
    }

    this.enqueue('CIRCUITO_COMPONENTE', row.uuid, operation, payload, ifMissing)
  }

  enqueueDefeito(id: number, operation: DefeitoSyncPayload['operation'], ifMissing = false): void {
    if (!this.shouldEnqueue()) return

    const row = db
      .prepare(
        `
      SELECT def.uuid, def.codigo, def.descricao, def.ativo,
             def.created_at AS createdAt,
             def.updated_at AS updatedAt,
             def.deleted_at AS deletedAt,
             c.uuid AS createdByUuid,
             u.uuid AS updatedByUuid,
             d.uuid AS deletedByUuid
      FROM defeitos def
      LEFT JOIN usuarios c ON c.id = def.created_by
      LEFT JOIN usuarios u ON u.id = def.updated_by
      LEFT JOIN usuarios d ON d.id = def.deleted_by
      WHERE def.id = ?
    `
      )
      .get(id) as
      | {
          uuid: string
          codigo: string
          descricao: string
          ativo: number
          createdAt: string
          updatedAt: string
          deletedAt: string | null
          createdByUuid: string | null
          updatedByUuid: string | null
          deletedByUuid: string | null
        }
      | undefined

    if (!row) throw new Error('Defeito não encontrado para sincronização.')

    const payload: DefeitoSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'DEFEITO',
      operation,
      record: { ...row, ativo: Boolean(row.ativo) }
    }

    this.enqueue('DEFEITO', row.uuid, operation, payload, ifMissing)
  }

  enqueuePostoDefeito(
    id: number,
    operation: PostoDefeitoSyncPayload['operation'],
    ifMissing = false
  ): void {
    if (!this.shouldEnqueue()) return

    const row = db
      .prepare(
        `
      SELECT pd.uuid,
             posto.uuid AS postoUuid,
             defeito.uuid AS defeitoUuid,
             pd.ativo,
             pd.created_at AS createdAt,
             pd.updated_at AS updatedAt,
             pd.deleted_at AS deletedAt,
             c.uuid AS createdByUuid,
             u.uuid AS updatedByUuid,
             d.uuid AS deletedByUuid
      FROM posto_defeitos pd
      INNER JOIN postos posto ON posto.id = pd.posto_id
      INNER JOIN defeitos defeito ON defeito.id = pd.defeito_id
      LEFT JOIN usuarios c ON c.id = pd.created_by
      LEFT JOIN usuarios u ON u.id = pd.updated_by
      LEFT JOIN usuarios d ON d.id = pd.deleted_by
      WHERE pd.id = ?
    `
      )
      .get(id) as
      | {
          uuid: string
          postoUuid: string
          defeitoUuid: string
          ativo: number
          createdAt: string
          updatedAt: string
          deletedAt: string | null
          createdByUuid: string | null
          updatedByUuid: string | null
          deletedByUuid: string | null
        }
      | undefined

    if (!row) throw new Error('Vínculo posto-defeito não encontrado para sincronização.')

    const payload: PostoDefeitoSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'POSTO_DEFEITO',
      operation,
      record: { ...row, ativo: Boolean(row.ativo) }
    }

    this.enqueue('POSTO_DEFEITO', row.uuid, operation, payload, ifMissing)
  }

  enqueueRoteiro(id: number, operation: RoteiroSyncPayload['operation'], ifMissing = false): void {
    if (!this.shouldEnqueue()) return

    const row = db
      .prepare(
        `
        SELECT
          cpc.uuid,
          circuito.uuid AS circuitoUuid,
          posto.uuid AS postoUuid,
          componente.uuid AS componenteUuid,
          cpc.quantidade,
          cpc.ativo,
          cpc.created_at AS createdAt,
          cpc.updated_at AS updatedAt,
          cpc.deleted_at AS deletedAt,
          created_by.uuid AS createdByUuid,
          updated_by.uuid AS updatedByUuid,
          deleted_by.uuid AS deletedByUuid
        FROM circuito_posto_componentes cpc
        INNER JOIN circuitos circuito ON circuito.id = cpc.circuito_id
        INNER JOIN postos posto ON posto.id = cpc.posto_id
        INNER JOIN componentes componente ON componente.id = cpc.componente_id
        LEFT JOIN usuarios created_by ON created_by.id = cpc.created_by
        LEFT JOIN usuarios updated_by ON updated_by.id = cpc.updated_by
        LEFT JOIN usuarios deleted_by ON deleted_by.id = cpc.deleted_by
        WHERE cpc.id = ?
        `
      )
      .get(id) as
      | {
          uuid: string
          circuitoUuid: string
          postoUuid: string
          componenteUuid: string
          quantidade: number
          ativo: number
          createdAt: string
          updatedAt: string
          deletedAt: string | null
          createdByUuid: string | null
          updatedByUuid: string | null
          deletedByUuid: string | null
        }
      | undefined

    if (!row) {
      throw new Error('Roteiro não encontrado para sincronização.')
    }

    const payload: RoteiroSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'ROTEIRO',
      operation,
      record: {
        ...row,
        quantidade: Number(row.quantidade),
        ativo: Boolean(row.ativo)
      }
    }

    this.enqueue('ROTEIRO', row.uuid, operation, payload, ifMissing)
  }

  enqueueRefugo(refugoId: number, operation: RefugoSyncPayload['operation']): void {
    if (!this.shouldEnqueue()) return

    const refugo = db
      .prepare(
        `
      SELECT r.uuid, r.numero_refugo as numeroRefugo,
             r.sigla_setor as siglaSetor, r.ano, r.sequencia,
             r.data_hora as dataHora, r.turno,
             r.matricula_operador as matriculaOperador,
             usuario.uuid as usuarioUuid,
             setor.uuid as setorUuid,
             subsetor.uuid as subsetorUuid,
             posto.uuid as postoUuid,
             circuito.uuid as circuitoUuid,
             r.quantidade_produzida as quantidadeProduzida,
             r.observacao, r.status,
             r.motivo_cancelamento as motivoCancelamento,
             r.origem, r.id_origem as idOrigem,
             r.importado_em as importadoEm,
             importador.uuid as importadoPorUuid,
             r.created_at as createdAt,
             r.updated_at as updatedAt,
             r.deleted_at as deletedAt,
             criador.uuid as createdByUuid,
             atualizador.uuid as updatedByUuid,
             excluidor.uuid as deletedByUuid
      FROM refugos r
      INNER JOIN setores setor ON setor.id = r.setor_id
      INNER JOIN subsetores subsetor ON subsetor.id = r.subsetor_id
      INNER JOIN postos posto ON posto.id = r.posto_id
      INNER JOIN circuitos circuito ON circuito.id = r.circuito_id
      LEFT JOIN usuarios usuario ON usuario.id = r.usuario_id
      LEFT JOIN usuarios importador ON importador.id = r.importado_por
      LEFT JOIN usuarios criador ON criador.id = r.created_by
      LEFT JOIN usuarios atualizador ON atualizador.id = r.updated_by
      LEFT JOIN usuarios excluidor ON excluidor.id = r.deleted_by
      WHERE r.id = ?
    `
      )
      .get(refugoId) as RefugoRow | undefined

    if (!refugo) throw new Error('Refugo não encontrado para sincronização.')

    const itens = db
      .prepare(
        `
      SELECT item.uuid,
             componente.uuid as componenteUuid,
             defeito.uuid as defeitoUuid,
             item.quantidade,
             item.codigo_componente_snapshot as codigoComponenteSnapshot,
             item.nome_componente_snapshot as nomeComponenteSnapshot,
             item.codigo_defeito_snapshot as codigoDefeitoSnapshot,
             item.descricao_defeito_snapshot as descricaoDefeitoSnapshot,
             item.preco_unitario_snapshot as precoUnitarioSnapshot,
             item.custo_total_snapshot as custoTotalSnapshot,
             item.created_at as createdAt,
             item.updated_at as updatedAt,
             item.deleted_at as deletedAt,
             criador.uuid as createdByUuid,
             atualizador.uuid as updatedByUuid,
             excluidor.uuid as deletedByUuid
      FROM refugo_itens item
      INNER JOIN componentes componente ON componente.id = item.componente_id
      INNER JOIN defeitos defeito ON defeito.id = item.defeito_id
      LEFT JOIN usuarios criador ON criador.id = item.created_by
      LEFT JOIN usuarios atualizador ON atualizador.id = item.updated_by
      LEFT JOIN usuarios excluidor ON excluidor.id = item.deleted_by
      WHERE item.refugo_id = ?
      ORDER BY item.id
    `
      )
      .all(refugoId) as RefugoItemRow[]

    const payload: RefugoSyncPayload = {
      schemaVersion: 1,
      sourceInstallationUuid: this.installationUuid(),
      entity: 'REFUGO',
      operation,
      record: { ...refugo, itens }
    }

    this.enqueue('REFUGO', refugo.uuid, operation, payload)
  }
}
