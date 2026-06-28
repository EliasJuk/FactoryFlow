import db from "../database/database"

export interface RefugoItemInput {
  componenteId: number
  defeitoId: number
  quantidade: number
}

export interface CriarRefugoInput {
  matriculaOperador: string
  usuarioId?: number | null
  setorId: number
  subsetorId: number
  postoId: number
  circuitoId: number
  turno: string
  quantidadeProduzida: number
  observacao?: string
  itens: RefugoItemInput[]
}

export class RefugoRepository {
  criar(input: CriarRefugoInput): string {
    const ano = new Date().getFullYear()

    const setor = db
      .prepare(`
        SELECT nome, sigla
        FROM setores
        WHERE id = ?
      `)
      .get(input.setorId) as { nome: string; sigla: string | null }

    const sigla =
      setor.sigla && setor.sigla.trim() !== ""
        ? setor.sigla.trim().toUpperCase()
        : setor.nome.substring(0, 3).toUpperCase()

    const ultimaSequencia = db
      .prepare(`
        SELECT MAX(sequencia) AS seq
        FROM refugos
        WHERE ano = ?
          AND sigla_setor = ?
      `)
      .get(ano, sigla) as { seq: number | null }

    const sequencia = (ultimaSequencia.seq ?? 0) + 1
    const numeroRefugo = `${sigla}-${ano}-${String(sequencia).padStart(6, "0")}`

    const transaction = db.transaction(() => {
      const resultado = db
        .prepare(`
          INSERT INTO refugos (
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
            status
          ) VALUES (
            ?,
            ?,
            ?,
            ?,
            datetime('now','localtime'),
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'ATIVO'
          )
        `)
        .run(
          numeroRefugo,
          sigla,
          ano,
          sequencia,
          input.turno,
          input.matriculaOperador,
          input.usuarioId ?? 1,
          input.setorId,
          input.subsetorId,
          input.postoId,
          input.circuitoId,
          input.quantidadeProduzida,
          input.observacao ?? null
        )

      const refugoId = Number(resultado.lastInsertRowid)

      const insertItem = db.prepare(`
        INSERT INTO refugo_itens (
          refugo_id,
          componente_id,
          defeito_id,
          quantidade
        ) VALUES (?, ?, ?, ?)
      `)

      for (const item of input.itens) {
        insertItem.run(
          refugoId,
          item.componenteId,
          item.defeitoId,
          item.quantidade
        )
      }
    })

    transaction()

    return numeroRefugo
  }

  listar(busca = "", pagina = 1, limite = 10) {
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
    `

    const parametrosFiltro = [
      busca,
      termo,
      termo,
      termo,
      termo,
      termo,
      termo,
      termo
    ]

    const refugos = db
      .prepare(`
        SELECT
          r.id,
          r.numero_refugo as numeroRefugo,
          r.data_hora as dataHora,
          r.turno,
          r.matricula_operador as matriculaOperador,
          r.quantidade_produzida as quantidadeProduzida,
          r.observacao,
          r.status,
          r.motivo_cancelamento as motivoCancelamento,

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

        WHERE ${filtros}

        ORDER BY r.id DESC
        LIMIT ?
        OFFSET ?
      `)
      .all(...parametrosFiltro, limite, offset) as any[]

    const total = db
      .prepare(`
        SELECT COUNT(*) as total
        FROM refugos r
        INNER JOIN setores s ON s.id = r.setor_id
        INNER JOIN subsetores sub ON sub.id = r.subsetor_id
        INNER JOIN postos p ON p.id = r.posto_id
        INNER JOIN circuitos c ON c.id = r.circuito_id

        WHERE ${filtros}
      `)
      .get(...parametrosFiltro) as { total: number }

    const itensStmt = db.prepare(`
      SELECT
        ri.id,
        ri.defeito_id as defeitoId,
        comp.codigo as componenteCodigo,
        comp.nome as componenteNome,
        d.codigo as defeitoCodigo,
        d.descricao as defeitoDescricao,
        ri.quantidade as quantidadeRefugada
      FROM refugo_itens ri
      INNER JOIN componentes comp ON comp.id = ri.componente_id
      INNER JOIN defeitos d ON d.id = ri.defeito_id
      WHERE ri.refugo_id = ?
      ORDER BY comp.codigo
    `)

    return {
      dados: refugos.map((refugo) => ({
        ...refugo,
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
    itens: { id: number; defeitoId: number; quantidade: number }[]
  ) {
    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE refugos
        SET
          matricula_operador = ?,
          turno = ?,
          quantidade_produzida = ?,
          observacao = ?
        WHERE id = ?
          AND status = 'ATIVO'
      `).run(
        matriculaOperador,
        turno,
        quantidadeProduzida,
        observacao ?? null,
        id
      )

      const updateItem = db.prepare(`
        UPDATE refugo_itens
        SET
          defeito_id = ?,
          quantidade = ?
        WHERE id = ?
      `)

      for (const item of itens) {
        updateItem.run(item.defeitoId, item.quantidade, item.id)
      }
    })

    transaction()
  }

  cancelar(id: number, motivo: string) {
    db.prepare(`
      UPDATE refugos
      SET
        status = 'CANCELADO',
        motivo_cancelamento = ?
      WHERE id = ?
        AND status = 'ATIVO'
    `).run(motivo, id)
  }
}