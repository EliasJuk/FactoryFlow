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
    const data = new Date()

    const ano = data.getFullYear()

    const setor = db.prepare(`
      SELECT sigla
      FROM setores
      WHERE id = ?
    `).get(input.setorId) as { sigla: string }

    const sigla = setor.sigla

    const ultimaSequencia = db.prepare(`
      SELECT MAX(sequencia) AS seq
      FROM refugos
      WHERE ano = ?
        AND sigla_setor = ?
    `).get(ano, sigla) as { seq: number | null }

    const sequencia = (ultimaSequencia.seq ?? 0) + 1

    const numeroRefugo =
      `${sigla}-${ano}-${String(sequencia).padStart(6, "0")}`

    const insert = db.prepare(`
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

        observacao

      )

      VALUES (

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

        ?

      )
    `)

    const resultado = insert.run(

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

      )

      VALUES (?, ?, ?, ?)
    `)

    const transaction = db.transaction(() => {
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
}