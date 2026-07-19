import { pool } from '../../database/postgres/connection'
import { IdGenerator } from '../../shared/ids/IdGenerator'

export interface RefugoItemInput {
  componenteId: number
  defeitoId: number
  quantidade: number
}

export interface CriarRefugoInput {
  matriculaOperador: string
  usuarioId?: number | null
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
  private normalizarDataHora(dataHora: unknown) {
    if (dataHora instanceof Date) {
      return dataHora.toISOString()
    }

    return dataHora
  }

  private async buscarPrecoAtualComponente(componenteId: number): Promise<number> {
    const result = await pool.query<{ valorUnitario: number }>(
      `
        SELECT valor_unitario as "valorUnitario"
        FROM componentes_precos
        WHERE componente_id = $1
          AND ativo = true
          AND vigencia_fim IS NULL
        ORDER BY id DESC
        LIMIT 1
      `,
      [componenteId]
    )

    return Number(result.rows[0]?.valorUnitario ?? 0)
  }

  async criar(input: CriarRefugoInput): Promise<{ id: number; numeroRefugo: string }> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const ano = new Date().getFullYear()

      const setorResult = await client.query<{
        nome: string
        sigla: string | null
      }>(
        `
          SELECT nome, sigla
          FROM setores
          WHERE id = $1
        `,
        [input.setorId]
      )

      const setor = setorResult.rows[0]

      if (!setor) {
        throw new Error('Setor não encontrado.')
      }

      const sigla =
        setor.sigla && setor.sigla.trim() !== ''
          ? setor.sigla.trim().toUpperCase()
          : setor.nome.substring(0, 3).toUpperCase()

      const ultimaSequenciaResult = await client.query<{ seq: number | null }>(
        `
          SELECT MAX(sequencia) AS seq
          FROM refugos
          WHERE ano = $1
            AND sigla_setor = $2
        `,
        [ano, sigla]
      )

      const sequencia = Number(ultimaSequenciaResult.rows[0]?.seq ?? 0) + 1
      const numeroRefugo = `${sigla}-${ano}-${String(sequencia).padStart(6, '0')}`

      const refugoResult = await client.query<{ id: number; uuid: string }>(
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
            $1,
            $2,
            $3,
            $4,
            $5,
            COALESCE($6::timestamp, NOW()),
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            'ATIVO',
            $16,
            $16
          )
          RETURNING id, uuid
        `,
        [
          IdGenerator.generate(),
          numeroRefugo,
          sigla,
          ano,
          sequencia,
          input.dataHora ?? null,
          input.turno,
          input.matriculaOperador,
          input.usuarioId ?? 1,
          input.setorId,
          input.subsetorId,
          input.postoId,
          input.circuitoId,
          input.quantidadeProduzida,
          input.observacao ?? null,
          input.usuarioId ?? 1
        ]
      )

      const refugoId = refugoResult.rows[0].id

      for (const item of input.itens) {
        const componenteResult = await client.query<{
          codigo: string
          nome: string
        }>(
          `
            SELECT codigo, nome
            FROM componentes
            WHERE id = $1
          `,
          [item.componenteId]
        )

        const defeitoResult = await client.query<{
          codigo: string
          descricao: string
        }>(
          `
            SELECT codigo, descricao
            FROM defeitos
            WHERE id = $1
          `,
          [item.defeitoId]
        )

        const componente = componenteResult.rows[0]
        const defeito = defeitoResult.rows[0]

        if (!componente) {
          throw new Error('Componente não encontrado.')
        }

        if (!defeito) {
          throw new Error('Defeito não encontrado.')
        }

        const precoUnitario = await this.buscarPrecoAtualComponente(item.componenteId)
        const custoTotal = precoUnitario * item.quantidade

        await client.query(
          `
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
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
          `,
          [
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
            input.usuarioId ?? 1
          ]
        )
      }

      await client.query('COMMIT')

      return {
        id: refugoId,
        numeroRefugo
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async listar(busca = '', pagina = 1, limite = 10) {
    const termo = `%${busca}%`
    const offset = (pagina - 1) * limite

    const filtros = `
      $1 = ''
      OR r.numero_refugo ILIKE $2
      OR r.matricula_operador ILIKE $3
      OR s.nome ILIKE $4
      OR sub.nome ILIKE $5
      OR p.nome ILIKE $6
      OR c.codigo ILIKE $7
      OR c.nome ILIKE $8
      OR d.codigo ILIKE $9
      OR d.descricao ILIKE $10
    `

    const parametrosFiltro = [busca, termo, termo, termo, termo, termo, termo, termo, termo, termo]

    const refugos = await pool.query<any>(
      `
        SELECT DISTINCT
          r.id,
          r.uuid,
          r.numero_refugo as "numeroRefugo",
          r.data_hora as "dataHora",
          r.turno,
          r.matricula_operador as "matriculaOperador",
          r.quantidade_produzida as "quantidadeProduzida",
          r.observacao,
          r.status,
          r.motivo_cancelamento as "motivoCancelamento",
          r.created_at as "createdAt",
          r.updated_at as "updatedAt",
          r.deleted_at as "deletedAt",
          r.created_by as "createdBy",
          r.updated_by as "updatedBy",
          r.deleted_by as "deletedBy",
          uc.nome as "createdByNome",
          uu.nome as "updatedByNome",
          ud.nome as "deletedByNome",
          s.nome as "setorNome",
          sub.nome as "subsetorNome",
          p.nome as "postoNome",
          c.codigo as "circuitoCodigo",
          c.nome as "circuitoNome"
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
        LIMIT $11
        OFFSET $12
      `,
      [...parametrosFiltro, limite, offset]
    )

    const total = await pool.query<{ total: string }>(
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
      `,
      parametrosFiltro
    )

    const itensQuery = `
      SELECT
        ri.id,
        ri.uuid,
        ri.defeito_id as "defeitoId",
        COALESCE(ri.codigo_componente_snapshot, comp.codigo) as "componenteCodigo",
        COALESCE(ri.nome_componente_snapshot, comp.nome) as "componenteNome",
        COALESCE(ri.codigo_defeito_snapshot, d.codigo) as "defeitoCodigo",
        COALESCE(ri.descricao_defeito_snapshot, d.descricao) as "defeitoDescricao",
        ri.quantidade as "quantidadeRefugada",
        ri.preco_unitario_snapshot as "precoUnitario",
        ri.custo_total_snapshot as "custoTotal",
        ri.created_at as "createdAt",
        ri.updated_at as "updatedAt",
        ri.deleted_at as "deletedAt",
        ri.created_by as "createdBy",
        ri.updated_by as "updatedBy",
        ri.deleted_by as "deletedBy"
      FROM refugo_itens ri
      INNER JOIN componentes comp ON comp.id = ri.componente_id
      INNER JOIN defeitos d ON d.id = ri.defeito_id
      WHERE ri.refugo_id = $1
      ORDER BY comp.codigo
    `

    const dados: any[] = []

    for (const refugo of refugos.rows) {
      const itens = await pool.query(itensQuery, [refugo.id])

      dados.push({
        ...refugo,
        dataHora: this.normalizarDataHora(refugo.dataHora),
        status: refugo.status ?? 'ATIVO',
        itens: itens.rows
      })
    }

    const totalRegistros = Number(total.rows[0]?.total ?? 0)

    return {
      dados,
      totalRegistros,
      totalPaginas: Math.max(1, Math.ceil(totalRegistros / limite))
    }
  }

  async editarCompleto(
    id: number,
    matriculaOperador: string,
    turno: string,
    quantidadeProduzida: number,
    observacao: string | undefined,
    itens: { id: number; defeitoId: number; quantidade: number }[],
    usuarioId?: number | null
  ): Promise<void> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      await client.query(
        `
          UPDATE refugos
          SET
            matricula_operador = $1,
            turno = $2,
            quantidade_produzida = $3,
            observacao = $4,
            updated_at = NOW(),
            updated_by = $5
          WHERE id = $6
            AND status = 'ATIVO'
        `,
        [matriculaOperador, turno, quantidadeProduzida, observacao ?? null, usuarioId ?? 1, id]
      )

      for (const item of itens) {
        const defeitoResult = await client.query<{
          codigo: string
          descricao: string
        }>(
          `
            SELECT codigo, descricao
            FROM defeitos
            WHERE id = $1
          `,
          [item.defeitoId]
        )

        const defeito = defeitoResult.rows[0]

        if (!defeito) {
          throw new Error('Defeito não encontrado.')
        }

        await client.query(
          `
            UPDATE refugo_itens
            SET
              defeito_id = $1,
              quantidade = $2,
              codigo_defeito_snapshot = $3,
              descricao_defeito_snapshot = $4,
              custo_total_snapshot = preco_unitario_snapshot * $5,
              updated_at = NOW(),
              updated_by = $6
            WHERE id = $7
          `,
          [
            item.defeitoId,
            item.quantidade,
            defeito.codigo,
            defeito.descricao,
            item.quantidade,
            usuarioId ?? 1,
            item.id
          ]
        )
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async cancelar(id: number, motivo: string, usuarioId?: number | null): Promise<void> {
    await pool.query(
      `
        UPDATE refugos
        SET
          status = 'CANCELADO',
          motivo_cancelamento = $1,
          updated_at = NOW(),
          updated_by = $2,
          deleted_at = NOW(),
          deleted_by = $2
        WHERE id = $3
          AND status = 'ATIVO'
      `,
      [motivo, usuarioId ?? 1, id]
    )

    await pool.query(
      `
        UPDATE refugo_itens
        SET updated_at = NOW(),
            updated_by = $1,
            deleted_at = NOW(),
            deleted_by = $1
        WHERE refugo_id = $2
      `,
      [usuarioId ?? 1, id]
    )
  }

  async buscarParaImpressao(id: number) {
    const refugoResult = await pool.query<any>(
      `
        SELECT
          r.id,
          r.uuid,
          r.numero_refugo as "numeroRefugo",
          r.data_hora as "dataHora",
          r.turno,
          r.matricula_operador as "matriculaOperador",
          r.quantidade_produzida as "quantidadeProduzida",
          r.observacao,
          r.status,
          r.motivo_cancelamento as "motivoCancelamento",
          r.created_at as "createdAt",
          r.updated_at as "updatedAt",
          r.deleted_at as "deletedAt",
          r.created_by as "createdBy",
          r.updated_by as "updatedBy",
          r.deleted_by as "deletedBy",
          s.nome as "setorNome",
          sub.nome as "subsetorNome",
          p.nome as "postoNome",
          c.codigo as "circuitoCodigo",
          c.nome as "circuitoNome"
        FROM refugos r
        INNER JOIN setores s ON s.id = r.setor_id
        INNER JOIN subsetores sub ON sub.id = r.subsetor_id
        INNER JOIN postos p ON p.id = r.posto_id
        INNER JOIN circuitos c ON c.id = r.circuito_id
        WHERE r.id = $1
      `,
      [id]
    )

    const refugo = refugoResult.rows[0]

    if (!refugo) {
      throw new Error('Refugo não encontrado para impressão.')
    }

    const itens = await pool.query(
      `
        SELECT
          COALESCE(ri.codigo_componente_snapshot, comp.codigo) as "componenteCodigo",
          COALESCE(ri.nome_componente_snapshot, comp.nome) as "componenteNome",
          COALESCE(ri.codigo_defeito_snapshot, d.codigo) as "defeitoCodigo",
          COALESCE(ri.descricao_defeito_snapshot, d.descricao) as "defeitoDescricao",
          ri.quantidade as "quantidadeRefugada",
          ri.preco_unitario_snapshot as "precoUnitario",
          ri.custo_total_snapshot as "custoTotal",
        ri.created_at as "createdAt",
        ri.updated_at as "updatedAt",
        ri.deleted_at as "deletedAt",
        ri.created_by as "createdBy",
        ri.updated_by as "updatedBy",
        ri.deleted_by as "deletedBy"
        FROM refugo_itens ri
        INNER JOIN componentes comp ON comp.id = ri.componente_id
        INNER JOIN defeitos d ON d.id = ri.defeito_id
        WHERE ri.refugo_id = $1
        ORDER BY comp.codigo
      `,
      [id]
    )

    return {
      ...refugo,
      dataHora: this.normalizarDataHora(refugo.dataHora),
      status: refugo.status ?? 'ATIVO',
      itens: itens.rows
    }
  }

  async existeIdOrigemHistorica(idOrigem: string): Promise<boolean> {
    const result = await pool.query(
      `
        SELECT 1
        FROM refugos
        WHERE id_origem = $1
        LIMIT 1
      `,
      [idOrigem.trim()]
    )

    return (result.rowCount ?? 0) > 0
  }

  async criarHistorico(
    input: CriarRefugoHistoricoInput
  ): Promise<{ id: number; numeroRefugo: string }> {
    const idOrigem = input.idOrigem.trim()

    if (!idOrigem) {
      throw new Error('ID_ORIGEM_OBRIGATORIO')
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const duplicado = await client.query(`SELECT 1 FROM refugos WHERE id_origem = $1 LIMIT 1`, [
        idOrigem
      ])

      if ((duplicado.rowCount ?? 0) > 0) {
        throw new Error('REFUGO_HISTORICO_DUPLICADO')
      }

      const ano = Number(input.dataHora.slice(0, 4))

      if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
        throw new Error('DATA_HISTORICA_INVALIDA')
      }

      const setorResult = await client.query<{ nome: string; sigla: string | null }>(
        `SELECT nome, sigla FROM setores WHERE id = $1`,
        [input.setorId]
      )

      const setor = setorResult.rows[0]
      if (!setor) throw new Error('Setor não encontrado.')

      const sigla =
        setor.sigla && setor.sigla.trim() !== ''
          ? setor.sigla.trim().toUpperCase()
          : setor.nome.substring(0, 3).toUpperCase()

      const sequenciaResult = await client.query<{ seq: number | null }>(
        `
          SELECT MAX(sequencia) AS seq
          FROM refugos
          WHERE ano = $1
            AND sigla_setor = $2
        `,
        [ano, sigla]
      )

      const sequencia = Number(sequenciaResult.rows[0]?.seq ?? 0) + 1
      const numeroRefugo = `${sigla}-${ano}-${String(sequencia).padStart(6, '0')}`

      const refugoResult = await client.query<{ id: number }>(
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
            $1, $2, $3, $4, $5, $6::timestamp, $7, $8, $9, $10, $11, $12,
            $13, $14, $15, 'ATIVO', 'IMPORTACAO_HISTORICA', $16,
            CURRENT_TIMESTAMP, $17, $6::timestamp, $6::timestamp, $17, $17
          )
          RETURNING id
        `,
        [
          IdGenerator.generate(),
          numeroRefugo,
          sigla,
          ano,
          sequencia,
          input.dataHora,
          input.turno,
          input.matriculaOperador,
          input.usuarioId ?? 1,
          input.setorId,
          input.subsetorId,
          input.postoId,
          input.circuitoId,
          input.quantidadeProduzida,
          input.observacao ?? null,
          idOrigem,
          input.usuarioId ?? 1
        ]
      )

      const refugoId = refugoResult.rows[0].id

      for (const item of input.itens) {
        const componenteResult = await client.query<{ codigo: string; nome: string }>(
          `SELECT codigo, nome FROM componentes WHERE id = $1`,
          [item.componenteId]
        )
        const defeitoResult = await client.query<{ codigo: string; descricao: string }>(
          `SELECT codigo, descricao FROM defeitos WHERE id = $1`,
          [item.defeitoId]
        )

        const componente = componenteResult.rows[0]
        const defeito = defeitoResult.rows[0]
        if (!componente) throw new Error('Componente não encontrado.')
        if (!defeito) throw new Error('Defeito não encontrado.')

        const precoUnitario =
          item.precoUnitario !== undefined && item.precoUnitario >= 0
            ? item.precoUnitario
            : await this.buscarPrecoAtualComponente(item.componenteId)

        await client.query(
          `
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
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
              $12::timestamp, $12::timestamp, $13, $13
            )
          `,
          [
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
            input.dataHora,
            input.usuarioId ?? 1
          ]
        )
      }

      await client.query('COMMIT')
      return { id: refugoId, numeroRefugo }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}
