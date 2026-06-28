type RefugoPrintItem = {
  componenteCodigo: string
  componenteNome: string
  defeitoCodigo: string
  defeitoDescricao: string
  quantidadeRefugada: number
}

export type RefugoPrintData = {
  numeroRefugo: string
  dataHora: string
  turno: string
  matriculaOperador: string
  quantidadeProduzida: number
  observacao?: string | null
  status: string
  motivoCancelamento?: string | null

  setorNome: string
  subsetorNome: string
  postoNome: string
  circuitoCodigo: string
  circuitoNome: string

  itens: RefugoPrintItem[]
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function gerarFichaRefugoHtml(refugo: RefugoPrintData) {
  const totalRefugado = refugo.itens.reduce(
    (total, item) => total + item.quantidadeRefugada,
    0
  )

  const cancelado = refugo.status === "CANCELADO"

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />

<style>
  @page {
    size: A6 portrait;
    margin: 5mm;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    color: #111;
    font-size: 9px;
  }

  .ficha {
    width: 100%;
    border: 1px solid #111;
    padding: 5px;
    position: relative;
  }

  .marca-cancelado {
    display: ${cancelado ? "block" : "none"};
    position: absolute;
    top: 45%;
    left: 8%;
    transform: rotate(-25deg);
    font-size: 32px;
    font-weight: 900;
    color: rgba(180, 0, 0, 0.18);
    border: 3px solid rgba(180, 0, 0, 0.18);
    padding: 8px 18px;
  }

  .topo {
    display: grid;
    grid-template-columns: 1fr auto;
    border-bottom: 1px solid #111;
    padding-bottom: 4px;
    margin-bottom: 4px;
  }

  .titulo {
    text-align: center;
    font-size: 13px;
    font-weight: bold;
  }

  .numero {
    font-size: 10px;
    font-weight: bold;
    text-align: right;
  }

  .linha {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3px;
    margin-bottom: 3px;
  }

  .campo {
    border: 1px solid #555;
    padding: 2px 3px;
    min-height: 18px;
  }

  .label {
    font-size: 7px;
    font-weight: bold;
    color: #333;
  }

  .valor {
    font-size: 9px;
    font-weight: bold;
    margin-top: 1px;
  }

  .status {
    color: ${cancelado ? "#b00000" : "#008000"};
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 4px;
  }

  th,
  td {
    border: 1px solid #333;
    padding: 2px;
    vertical-align: top;
  }

  th {
    background: #eee;
    font-size: 8px;
  }

  td {
    font-size: 8px;
  }

  .obs {
    margin-top: 4px;
    border: 1px solid #333;
    min-height: 32px;
    padding: 3px;
  }

  .assinaturas {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 4px;
    margin-top: 12px;
  }

  .assinatura {
    text-align: center;
    font-size: 7px;
  }

  .linha-assinatura {
    border-top: 1px solid #111;
    margin-bottom: 2px;
  }

  .rodape {
    margin-top: 5px;
    text-align: center;
    font-size: 7px;
    font-weight: bold;
  }
</style>
</head>

<body>
  <div class="ficha">
    <div class="marca-cancelado">CANCELADO</div>

    <div class="topo">
      <div class="titulo">FICHA DE REFUGO</div>
      <div class="numero">${escapeHtml(refugo.numeroRefugo)}</div>
    </div>

    <div class="linha">
      <div class="campo">
        <div class="label">Data / Hora</div>
        <div class="valor">${escapeHtml(refugo.dataHora)}</div>
      </div>

      <div class="campo">
        <div class="label">Turno / Matrícula</div>
        <div class="valor">${escapeHtml(refugo.turno)} / ${escapeHtml(refugo.matriculaOperador)}</div>
      </div>
    </div>

    <div class="linha">
      <div class="campo">
        <div class="label">Setor / Subsetor</div>
        <div class="valor">${escapeHtml(refugo.setorNome)} / ${escapeHtml(refugo.subsetorNome)}</div>
      </div>

      <div class="campo">
        <div class="label">Posto</div>
        <div class="valor">${escapeHtml(refugo.postoNome)}</div>
      </div>
    </div>

    <div class="campo">
      <div class="label">Circuito</div>
      <div class="valor">${escapeHtml(refugo.circuitoCodigo)} - ${escapeHtml(refugo.circuitoNome)}</div>
    </div>

    <div class="linha" style="margin-top: 3px;">
      <div class="campo">
        <div class="label">Quantidade Produzida</div>
        <div class="valor">${escapeHtml(refugo.quantidadeProduzida)}</div>
      </div>

      <div class="campo">
        <div class="label">Quantidade Refugada</div>
        <div class="valor">${escapeHtml(totalRefugado)}</div>
      </div>
    </div>

    <div class="campo">
      <div class="label">Status</div>
      <div class="valor status">${escapeHtml(refugo.status)}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Componente</th>
          <th>Defeito</th>
          <th>Qtde</th>
        </tr>
      </thead>

      <tbody>
        ${refugo.itens
          .map(
            (item) => `
              <tr>
                <td>
                  <strong>${escapeHtml(item.componenteCodigo)}</strong><br />
                  ${escapeHtml(item.componenteNome)}
                </td>
                <td>
                  ${escapeHtml(item.defeitoCodigo)} - ${escapeHtml(item.defeitoDescricao)}
                </td>
                <td style="text-align:center; font-weight:bold;">
                  ${escapeHtml(item.quantidadeRefugada)}
                </td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>

    <div class="obs">
      <div class="label">Observação / Justificativa</div>
      ${escapeHtml(cancelado ? refugo.motivoCancelamento : refugo.observacao)}
    </div>

    <div class="assinaturas">
      <div class="assinatura">
        <div class="linha-assinatura"></div>
        Operador
      </div>

      <div class="assinatura">
        <div class="linha-assinatura"></div>
        Líder
      </div>

      <div class="assinatura">
        <div class="linha-assinatura"></div>
        Técnico
      </div>
    </div>

    <div class="rodape">
      ${escapeHtml(refugo.numeroRefugo)} - FactoryFlow
    </div>
  </div>
</body>
</html>
`
}