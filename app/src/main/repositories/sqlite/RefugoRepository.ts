import db from '../../database/database'
import { IdGenerator } from '../../shared/ids/IdGenerator'
import { SyncQueueRepository } from '../../sync/SyncQueueRepository'

export interface RefugoItemInput {
  componenteId: number
  defeitoId: number
  quantidade: number
}

export interface CriarRefugoInput {
  matriculaOperador: string
  usuarioId: number
  dataHora?: string
  setorId: number
  subsetorId: number
  postoId: number
  circuitoId: number
  turno: string
  quantidadeProduzida: number
  observacao?: string
  itens: RefugoItemInput[]
}

export interface RefugoItemHistoricoInput extends RefugoItemInput {
  precoUnitario?: number
}

export interface CriarRefugoHistoricoInput extends Omit<CriarRefugoInput, 'itens' | 'dataHora'> {
  idOrigem: string
  dataHora: string
  itens: RefugoItemHistoricoInput[]
}

export class RefugoRepository {
  private readonly syncQueue = new SyncQueueRepository()

  private buscarPrecoAtualComponente(componenteId: number): number {
    const preco = db
      .prepare(
        `
        SELECT valor_unitario as valorUnitario
        FROM componentes_precos
        WHERE componente_id = ?
          AND ativo = 1
          AND vigencia_fim IS NULL
        ORDER BY id DESC
        LIMIT 1
      `
      )
      .get(componenteId) as { valorUnitario: number } | undefined

    return preco?.valorUnitario ?? 0
  }

  criar(input: CriarRefugoInput): { id: number; numeroRefugo: string } {
    const ano = new Date().getFullYear()

    const setor = db
      .prepare(
        `
        SELECT nome, sigla
        FROM setores
        WHERE id = ?
      `
      )
      .get(input.setorId) as { nome: string; sigla: string | null }

    if (!setor) {
      throw new Error('Setor não encontrado.')
    }

    const sigla =
      setor.sigla && setor.sigla.trim() !== ''
        ? setor.sigla.trim().toUpperCase()
        : setor.nome.substring(0, 3).toUpperCase()

    const ultimaSequencia = db
      .prepare(
        `
        SELECT MAX(sequencia) AS seq
        FROM refugos
        WHERE ano = ?
          AND sigla_setor = ?
      `
      )
      .get(ano, sigla) as { seq: number | null }

    const sequencia = (ultimaSequencia.seq ?? 0) + 1
    const numeroRefugo = `${sigla}-${ano}-${String(sequencia).padStart(6, '0')}`

    let refugoId: number | null = null

    const transaction = db.transaction(() => {
      const resultado = db
        .prepare(
          `
          INSERT INTO refugos (
            uuid,
            numero_refugo,
            sigla_setor,
            ano,
            sequencia,
            data_hora,
            turno,
            matricula_operador,
            usuario_id,
            setor_id,
            subsetor_id,
            posto_id,
            circuito_id,
            quantidade_produzida,
            observacao,
            status,
            created_by,
            updated_by
          ) VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            COALESCE(?, datetime('now','localtime')),
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'ATIVO',
            ?,
            ?
          )
        `
        )
        .run(
          IdGenerator.generate(),
          numeroRefugo,
          sigla,
          ano,
          sequencia,
          input.dataHora ? `${input.dataHora.replace('T', ' ')}:00` : null,
          input.turno,
          input.matriculaOperador,
          input.usuarioId,
          input.setorId,
          input.subsetorId,
          input.postoId,
          input.circuitoId,
          input.quantidadeProduzida,
          input.observacao ?? null,
          input.usuarioId,
          input.usuarioId
        )

      refugoId = Number(resultado.lastInsertRowid)

      const insertItem = db.prepare(`
        INSERT INTO refugo_itens (
          uuid,
          refugo_id,
          componente_id,
          defeito_id,
          quantidade,
          codigo_componente_snapshot,
          nome_componente_snapshot,
          codigo_defeito_snapshot,
          descricao_defeito_snapshot,
          preco_unitario_snapshot,
          custo_total_snapshot,
          created_by,
          updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      for (const item of input.itens) {
        const componente = db
          .prepare(
            `
            SELECT codigo, nome
            FROM componentes
            WHERE id = ?
          `
          )
          .get(item.componenteId) as { codigo: string; nome: string }

        const defeito = db
          .prepare(
            `
            SELECT codigo, descricao
            FROM defeitos
            WHERE id = ?
          `
          )
          .get(item.defeitoId) as { codigo: string; descricao: string }

        const precoUnitario = this.buscarPrecoAtualComponente(item.componenteId)
        const custoTotal = precoUnitario * item.quantidade

        insertItem.run(
          IdGenerator.generate(),
          refugoId,
          item.componenteId,
          item.defeitoId,
          item.quantidade,
          componente.codigo,
          componente.nome,
          defeito.codigo,
          defeito.descricao,
          precoUnitario,
          custoTotal,
          input.usuarioId,
          input.usuarioId
        )
      }

      this.syncQueue.enqueueRefugo(refugoId, 'CREATE')
    })

    transaction()

    if (refugoId === null) {
      throw new Error('Não foi possível criar o refugo.')
    }

    return {
      id: refugoId,
      numeroRefugo
    }
  }

  listar(busca = '', pagina = 1, limite = 10) {
    const termo = `%${busca}%`
    const offset = (pagina - 1) * limite

    const filtros = `
      ? = ''
      OR r.numero_refugo LIKE ?
      OR r.matricula_operador LIKE ?
      OR s.nome LIKE ?
      OR sub.nome LIKE ?
      OR p.nome LIKE ?
      OR c.codigo LIKE ?
      OR c.nome LIKE ?
      OR d.codigo LIKE ?
      OR d.descricao LIKE ?
    `

    const parametrosFiltro = [busca, termo, termo, termo, termo, termo, termo, termo, termo, termo]

    const refugos = db
      .prepare(
        `
        SELECT DISTINCT
          r.id,
          r.uuid,
          r.numero_refugo as numeroRefugo,
          r.data_hora as dataHora,
          r.turno,
          r.matricula_operador as matriculaOperador,
          r.quantidade_produzida as quantidadeProduzida,
          r.observacao,
          r.status,
          r.motivo_cancelamento as motivoCancelamento,
          r.created_at as createdAt,
          r.updated_at as updatedAt,
          r.deleted_at as deletedAt,
          r.created_by as createdBy,
          r.updated_by as updatedBy,
          r.deleted_by as deletedBy,
          uc.nome as createdByNome,
          uu.nome as updatedByNome,
          ud.nome as deletedByNome,

          s.nome as setorNome,
          sub.nome as subsetorNome,
          p.nome as postoNome,
          c.codigo as circuitoCodigo,
          c.nome as circuitoNome

        FROM refugos r
        INNER JOIN setores s ON s.id = r.setor_id
        INNER JOIN subsetores sub ON sub.id = r.subsetor_id
        INNER JOIN postos p ON p.id = r.posto_id
        INNER JOIN circuitos c ON c.id = r.circuito_id
        LEFT JOIN usuarios uc ON uc.id = r.created_by
        LEFT JOIN usuarios uu ON uu.id = r.updated_by
        LEFT JOIN usuarios ud ON ud.id = r.deleted_by
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        INNER JOIN defeitos d ON d.id = ri.defeito_id

        WHERE ${filtros}

        ORDER BY r.id DESC
        LIMIT ?
        OFFSET ?
      `
      )
      .all(...parametrosFiltro, limite, offset) as any[]

    const total = db
      .prepare(
        `
        SELECT COUNT(DISTINCT r.id) as total

        FROM refugos r
        INNER JOIN setores s ON s.id = r.setor_id
        INNER JOIN subsetores sub ON sub.id = r.subsetor_id
        INNER JOIN postos p ON p.id = r.posto_id
        INNER JOIN circuitos c ON c.id = r.circuito_id
        INNER JOIN refugo_itens ri ON ri.refugo_id = r.id
        INNER JOIN defeitos d ON d.id = ri.defeito_id

        WHERE ${filtros}
      `
      )
      .get(...parametrosFiltro) as { total: number }

    const itensStmt = db.prepare(`
      SELECT
        ri.id,
        ri.uuid,
        ri.defeito_id as defeitoId,

        COALESCE(ri.codigo_componente_snapshot, comp.codigo) as componenteCodigo,
        COALESCE(ri.nome_componente_snapshot, comp.nome) as componenteNome,

        COALESCE(ri.codigo_defeito_snapshot, d.codigo) as defeitoCodigo,
        COALESCE(ri.descricao_defeito_snapshot, d.descricao) as defeitoDescricao,

        ri.quantidade as quantidadeRefugada,
        ri.preco_unitario_snapshot as precoUnitario,
        ri.custo_total_snapshot as custoTotal,
        ri.created_at as createdAt,
        ri.updated_at as updatedAt,
        ri.deleted_at as deletedAt,
        ri.created_by as createdBy,
        ri.updated_by as updatedBy,
        ri.deleted_by as deletedBy

      FROM refugo_itens ri
      INNER JOIN componentes comp ON comp.id = ri.componente_id
      INNER JOIN defeitos d ON d.id = ri.defeito_id

      WHERE ri.refugo_id = ?

      ORDER BY comp.codigo
    `)

    return {
      dados: refugos.map((refugo) => ({
        ...refugo,
        status: refugo.status ?? 'ATIVO',
        itens: itensStmt.all(refugo.id)
      })),
      totalRegistros: total.total,
      totalPaginas: Math.max(1, Math.ceil(total.total / limite))
    }
  }

  editarCompleto(
    id: number,
    matriculaOperador: string,
    turno: string,
    quantidadeProduzida: number,
    observacao: string | undefined,
    itens: { id: number; defeitoId: number; quantidade: number }[],
    usuarioId: number
  ) {
    const responsavelId = usuarioId

    const transaction = db.transaction(() => {
      const resultadoRefugo = db
        .prepare(
          `
          UPDATE refugos
          SET
            matricula_operador = ?,
            turno = ?,
            quantidade_produzida = ?,
            observacao = ?,
            updated_at = datetime('now','localtime'),
            updated_by = ?
          WHERE id = ?
            AND status = 'ATIVO'
        `
        )
        .run(matriculaOperador, turno, quantidadeProduzida, observacao ?? null, responsavelId, id)

      if (resultadoRefugo.changes === 0) {
        throw new Error('Refugo não encontrado ou não está ativo.')
      }

      const updateItem = db.prepare(`
        UPDATE refugo_itens
        SET
          defeito_id = ?,
          quantidade = ?,
          codigo_defeito_snapshot = ?,
          descricao_defeito_snapshot = ?,
          custo_total_snapshot = preco_unitario_snapshot * ?,
          updated_at = datetime('now','localtime'),
          updated_by = ?
        WHERE id = ?
          AND refugo_id = ?
          AND deleted_at IS NULL
      `)

      for (const item of itens) {
        if (!Number.isInteger(item.quantidade) || item.quantidade <= 0) {
          throw new Error('QUANTIDADE_INVALIDA')
        }

        const defeito = db
          .prepare(
            `
            SELECT codigo, descricao
            FROM defeitos
            WHERE id = ?
              AND ativo = 1
          `
          )
          .get(item.defeitoId) as { codigo: string; descricao: string } | undefined

        if (!defeito) {
          throw new Error('Defeito não encontrado ou inativo.')
        }

        const resultadoItem = updateItem.run(
          item.defeitoId,
          item.quantidade,
          defeito.codigo,
          defeito.descricao,
          item.quantidade,
          responsavelId,
          item.id,
          id
        )

        if (resultadoItem.changes === 0) {
          throw new Error('Item não encontrado neste refugo ou já está removido.')
        }
      }

      this.syncQueue.enqueueRefugo(id, 'UPDATE')
    })

    transaction()
  }

  cancelar(id: number, motivo: string, usuarioId: number) {
    const transaction = db.transaction(() => {
      const resultado = db
        .prepare(
          `
          UPDATE refugos
          SET
            status = 'CANCELADO',
            motivo_cancelamento = ?,
            updated_at = datetime('now','localtime'),
            updated_by = ?,
            deleted_at = datetime('now','localtime'),
            deleted_by = ?
          WHERE id = ?
            AND status = 'ATIVO'
        `
        )
        .run(motivo, usuarioId, usuarioId, id)

      if (resultado.changes === 0) {
        throw new Error('Refugo não encontrado ou já cancelado.')
      }

      db.prepare(
        `
        UPDATE refugo_itens
        SET updated_at = datetime('now','localtime'),
            updated_by = ?,
            deleted_at = datetime('now','localtime'),
            deleted_by = ?
        WHERE refugo_id = ?
      `
      ).run(usuarioId, usuarioId, id)

      this.syncQueue.enqueueRefugo(id, 'CANCEL')
    })

    transaction()
  }

  buscarParaImpressao(id: number) {
    const refugo = db
      .prepare(
        `
        SELECT
          r.id,
          r.uuid,
          r.numero_refugo as numeroRefugo,
          r.data_hora as dataHora,
          r.turno,
          r.matricula_operador as matriculaOperador,
          r.quantidade_produzida as quantidadeProduzida,
          r.observacao,
          r.status,
          r.motivo_cancelamento as motivoCancelamento,
          r.created_at as createdAt,
          r.updated_at as updatedAt,
          r.deleted_at as deletedAt,
          r.created_by as createdBy,
          r.updated_by as updatedBy,
          r.deleted_by as deletedBy,

          s.nome as setorNome,
          sub.nome as subsetorNome,
          p.nome as postoNome,
          c.codigo as circuitoCodigo,
          c.nome as circuitoNome

        FROM refugos r
        INNER JOIN setores s ON s.id = r.setor_id
        INNER JOIN subsetores sub ON sub.id = r.subsetor_id
        INNER JOIN postos p ON p.id = r.posto_id
        INNER JOIN circuitos c ON c.id = r.circuito_id

        WHERE r.id = ?
      `
      )
      .get(id) as any

    if (!refugo) {
      throw new Error('Refugo não encontrado para impressão.')
    }

    const itens = db
      .prepare(
        `
        SELECT
          COALESCE(ri.codigo_componente_snapshot, comp.codigo) as componenteCodigo,
          COALESCE(ri.nome_componente_snapshot, comp.nome) as componenteNome,
          COALESCE(ri.codigo_defeito_snapshot, d.codigo) as defeitoCodigo,
          COALESCE(ri.descricao_defeito_snapshot, d.descricao) as defeitoDescricao,
          ri.quantidade as quantidadeRefugada,
          ri.preco_unitario_snapshot as precoUnitario,
          ri.custo_total_snapshot as custoTotal,
        ri.created_at as createdAt,
        ri.updated_at as updatedAt,
        ri.deleted_at as deletedAt,
        ri.created_by as createdBy,
        ri.updated_by as updatedBy,
        ri.deleted_by as deletedBy

        FROM refugo_itens ri
        INNER JOIN componentes comp ON comp.id = ri.componente_id
        INNER JOIN defeitos d ON d.id = ri.defeito_id

        WHERE ri.refugo_id = ?

        ORDER BY comp.codigo
      `
      )
      .all(id)

    return {
      ...refugo,
      status: refugo.status ?? 'ATIVO',
      itens
    }
  }

  existeIdOrigemHistorica(idOrigem: string): boolean {
    const registro = db
      .prepare(
        `
          SELECT 1
          FROM refugos
          WHERE id_origem = ?
          LIMIT 1
        `
      )
      .get(idOrigem.trim())

    return Boolean(registro)
  }

  criarHistorico(input: CriarRefugoHistoricoInput): { id: number; numeroRefugo: string } {
    const idOrigem = input.idOrigem.trim()

    if (!idOrigem) {
      throw new Error('ID_ORIGEM_OBRIGATORIO')
    }

    if (this.existeIdOrigemHistorica(idOrigem)) {
      throw new Error('REFUGO_HISTORICO_DUPLICADO')
    }

    const ano = Number(input.dataHora.slice(0, 4))

    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
      throw new Error('DATA_HISTORICA_INVALIDA')
    }

    const setor = db
      .prepare(
        `
          SELECT nome, sigla
          FROM setores
          WHERE id = ?
        `
      )
      .get(input.setorId) as { nome: string; sigla: string | null } | undefined

    if (!setor) {
      throw new Error('Setor não encontrado.')
    }

    const sigla =
      setor.sigla && setor.sigla.trim() !== ''
        ? setor.sigla.trim().toUpperCase()
        : setor.nome.substring(0, 3).toUpperCase()

    const ultimaSequencia = db
      .prepare(
        `
          SELECT MAX(sequencia) AS seq
          FROM refugos
          WHERE ano = ?
            AND sigla_setor = ?
        `
      )
      .get(ano, sigla) as { seq: number | null }

    const sequencia = (ultimaSequencia.seq ?? 0) + 1
    const numeroRefugo = `${sigla}-${ano}-${String(sequencia).padStart(6, '0')}`

    let refugoId: number | null = null

    const executar = db.transaction(() => {
      const resultado = db
        .prepare(
          `
            INSERT INTO refugos (
              uuid,
              numero_refugo,
              sigla_setor,
              ano,
              sequencia,
              data_hora,
              turno,
              matricula_operador,
              usuario_id,
              setor_id,
              subsetor_id,
              posto_id,
              circuito_id,
              quantidade_produzida,
              observacao,
              status,
              origem,
              id_origem,
              importado_em,
              importado_por,
              created_at,
              updated_at,
              created_by,
              updated_by
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
              'ATIVO',
              'IMPORTACAO_HISTORICA',
              ?,
              datetime('now','localtime'),
              ?,
              ?,
              ?,
              ?,
              ?
            )
          `
        )
        .run(
          IdGenerator.generate(),
          numeroRefugo,
          sigla,
          ano,
          sequencia,
          input.dataHora.replace('T', ' '),
          input.turno,
          input.matriculaOperador,
          input.usuarioId,
          input.setorId,
          input.subsetorId,
          input.postoId,
          input.circuitoId,
          input.quantidadeProduzida,
          input.observacao ?? null,
          idOrigem,
          input.usuarioId,
          input.dataHora.replace('T', ' '),
          input.dataHora.replace('T', ' '),
          input.usuarioId,
          input.usuarioId
        )

      refugoId = Number(resultado.lastInsertRowid)

      const inserirItem = db.prepare(`
        INSERT INTO refugo_itens (
          uuid,
          refugo_id,
          componente_id,
          defeito_id,
          quantidade,
          codigo_componente_snapshot,
          nome_componente_snapshot,
          codigo_defeito_snapshot,
          descricao_defeito_snapshot,
          preco_unitario_snapshot,
          custo_total_snapshot,
          created_at,
          updated_at,
          created_by,
          updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      for (const item of input.itens) {
        const componente = db
          .prepare(`SELECT codigo, nome FROM componentes WHERE id = ?`)
          .get(item.componenteId) as { codigo: string; nome: string } | undefined

        const defeito = db
          .prepare(`SELECT codigo, descricao FROM defeitos WHERE id = ?`)
          .get(item.defeitoId) as { codigo: string; descricao: string } | undefined

        if (!componente) throw new Error('Componente não encontrado.')
        if (!defeito) throw new Error('Defeito não encontrado.')

        const precoUnitario =
          item.precoUnitario !== undefined && item.precoUnitario >= 0
            ? item.precoUnitario
            : this.buscarPrecoAtualComponente(item.componenteId)

        inserirItem.run(
          IdGenerator.generate(),
          refugoId,
          item.componenteId,
          item.defeitoId,
          item.quantidade,
          componente.codigo,
          componente.nome,
          defeito.codigo,
          defeito.descricao,
          precoUnitario,
          precoUnitario * item.quantidade,
          input.dataHora.replace('T', ' '),
          input.dataHora.replace('T', ' '),
          input.usuarioId,
          input.usuarioId
        )
      }

      this.syncQueue.enqueueRefugo(refugoId, 'CREATE')
    })

    executar()

    if (refugoId === null) {
      throw new Error('Não foi possível criar o refugo histórico.')
    }

    return { id: refugoId, numeroRefugo }
  }
}
