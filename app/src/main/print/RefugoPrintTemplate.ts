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

function formatarData(dataHora: string) {
  const data = new Date(dataHora)

  if (Number.isNaN(data.getTime())) {
    return escapeHtml(dataHora)
  }

  return data.toLocaleDateString("pt-BR")
}

function preencherLinhas(itens: RefugoPrintItem[]) {
  const linhas = [...itens]

  while (linhas.length < 20) {
    linhas.push({
      componenteCodigo: "",
      componenteNome: "",
      defeitoCodigo: "",
      defeitoDescricao: "",
      quantidadeRefugada: 0
    })
  }

  return linhas.slice(0, 20)
}

export function gerarFichaRefugoHtml(refugo: RefugoPrintData) {
  const itens = preencherLinhas(refugo.itens)
  const cancelado = refugo.status === "CANCELADO"

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />

<style>
  @page {
    size: A6 portrait;
    margin: 2.5mm;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 6.2px;
  }

  .ficha {
    width: 100%;
    height: auto;
    border: 0.1px solid #000;
    overflow: hidden;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  td,
  th {
    border: 0.55px solid #000;
    padding: 0.6px 1.3px;
    vertical-align: middle;
    overflow: hidden;
    white-space: nowrap;
  }

  .topo td {
    height: 4mm;
  }

  .marca {
    width: 23mm;
    font-size: 7.5px;
    font-weight: bold;
    text-align: center;
  }

  .titulo {
    width: 57mm;
    text-align: center;
    font-size: 8.5px;
    font-weight: 900;
    letter-spacing: 0.1px;
  }

  .id {
    width: 20mm;
    text-align: center;
    font-size: 7px;
    font-weight: bold;
  }

  .id-numero {
    border-top: 0.55px solid #000;
    margin: 1px -1.3px -0.6px;
    padding-top: 1px;
    font-size: 7px;
  }

  .info td {
    height: 4mm;
    font-size: 6.4px;
  }

  .label {
    font-weight: 900;
    margin-right: 2px;
  }

  .valor {
    font-weight: 700;
  }

  .ctf-produzido {
    font-size: 6.5px;
    font-weight: 900;
    text-align: center;
  }

  .tabela-defeitos th {
    height: 4mm;
    background: #e9e9e9;
    font-size: 6.4px;
    font-weight: 900;
    text-align: left;
  }

  .tabela-defeitos td {
    height: 4mm;
    font-size: 5px;
  }

  .col-ctf {
    width: 34%;
  }

  .col-defeito {
    width: 46%;
  }

  .col-qtd {
    width: 20%;
    text-align: center;
  }

  .qtd {
    text-align: center;
    font-weight: 700;
  }

  .rodape-area {
    margin-top: 2px;
    height: auto;
  }

  .instrucoes {
    width: 41%;
    height: 37mm;
    vertical-align: top;
    white-space: normal;
    font-size: 4.8px;
    line-height: 1.17;
    padding: 1.5px 2px;
  }

  .justificativa-area {
    width: 59%;
    height: 37mm;
    padding: 0;
    vertical-align: top;
  }

  .just-title {
    height: 4.5mm;
    border-bottom: 0.55px solid #000;
    text-align: center;
    font-size: 6.8px;
    font-weight: normal;
    padding-top: 1px;
  }

  .just-box {
    height: 15.5mm;
    border-bottom: 0.55px solid #000;
    white-space: normal;
    padding: 1px 2px;
    font-size: 5.8px;
  }

  .assinaturas {
    height: 17mm;
    padding: 0 4px;
  }

  .assinaturas-grid {
    width: 100%;
    height: 100%;
    border-collapse: separate;
    border-spacing: 4px 3px;
  }

  .assinaturas-grid td {
    border: none;
    text-align: center;
    vertical-align: bottom;
    font-size: 4.9px;
    height: 7mm;
    padding: 0;
  }

  .linha-ass {
    border-top: 0.55px solid #000;
    height: 1px;
    margin-bottom: 1.2px;
  }

  .cancelado {
    display: ${cancelado ? "block" : "none"};
    position: absolute;
    top: 58mm;
    left: 14mm;
    transform: rotate(-22deg);
    font-size: 19px;
    font-weight: 900;
    color: rgba(150, 0, 0, 0.18);
    border: 1.5px solid rgba(150, 0, 0, 0.18);
    padding: 3px 10px;
  }
</style>
</head>

<body>
  <div class="ficha">
    <div class="cancelado">CANCELADO</div>

    <table class="topo">
      <tr>
        <td class="marca">FactoryFlow</td>
        <td class="titulo">FICHA DE DEFEITOS ${escapeHtml(refugo.setorNome).toUpperCase()}</td>
        <td class="id">
          ID
          <div class="id-numero">${escapeHtml(refugo.numeroRefugo)}</div>
        </td>
      </tr>
    </table>

    <table class="info">
      <tr>
        <td style="width: 33%;">
          <span class="label">Data:</span>
          <span class="valor">${formatarData(refugo.dataHora)}</span>
        </td>

        <td style="width: 34%;">
          <span class="label">Matrícula:</span>
          <span class="valor">${escapeHtml(refugo.matriculaOperador)}</span>
        </td>

        <td style="width: 33%;">
          <span class="label">Turno:</span>
          <span class="valor">${escapeHtml(refugo.turno)}</span>
        </td>
      </tr>

      <tr>
        <td style="width: 33%;">
          <span class="label">Setor:</span>
          <span class="valor">${escapeHtml(refugo.subsetorNome || refugo.setorNome)}</span>
        </td>

        <td colspan="2">
          <span class="label">Posto de trabalho:</span>
          <span class="valor">${escapeHtml(refugo.postoNome)}</span>
        </td>
      </tr>

      <tr>
        <td colspan="2">
          <span class="label">CTF Produzido:</span>
          <span class="ctf-produzido">${escapeHtml(refugo.circuitoCodigo)} - ${escapeHtml(refugo.circuitoNome)}</span>
        </td>

        <td>
          <span class="label">Qtd. Produzido:</span>
          <span class="valor">${escapeHtml(refugo.quantidadeProduzida)}</span>
        </td>
      </tr>
    </table>

    <table class="tabela-defeitos">
      <thead>
        <tr>
          <th class="col-ctf">CTF</th>
          <th class="col-defeito">Defeito</th>
          <th class="col-qtd">Quantidade</th>
        </tr>
      </thead>

      <tbody>
        ${itens
          .map(
            (item) => `
              <tr>
                <td class="col-ctf">${escapeHtml(item.componenteCodigo)}</td>
                <td class="col-defeito">
                  ${
                    item.defeitoCodigo || item.defeitoDescricao
                      ? `${escapeHtml(item.defeitoCodigo)} - ${escapeHtml(item.defeitoDescricao)}`
                      : ""
                  }
                </td>
                <td class="col-qtd qtd">
                  ${item.quantidadeRefugada > 0 ? escapeHtml(item.quantidadeRefugada) : ""}
                </td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>

    <table class="rodape-area">
      <tr>
        <td class="instrucoes">
          * <strong>Líder de Linha</strong> deve conferir durante o processo:<br />
          &nbsp;&nbsp;* Quantidade de peças refugadas indicada na ficha é a mesma que no físico?<br />
          &nbsp;&nbsp;* Defeito indicado na ficha de refugo está correto?<br />
          &nbsp;&nbsp;* Para casos de mais de 20 peças preencher campo Justificativa/Causa<br />
          * <strong>Técnico de Produção</strong> deve conferir durante a mesa em conjunto com QA se a peça realmente é refugo e se a ficha esta preenchida corretamente<br />
          * <strong>Coordenador</strong> da área deverá assinar quando:<br />
          &nbsp;&nbsp;* Refugo da Pré fabricados for maior que 20 peças;<br />
          &nbsp;&nbsp;* Circuitos acabados for maior que 5 peças;<br />
          * <strong>Qualidade</strong> irá conferir todos se todos os campos acima estão corretos e realmente se a peça refugado deve ser sucateada
        </td>

        <td class="justificativa-area">
          <div class="just-title">Justificativa/Causa:</div>

          <div class="just-box">
            ${escapeHtml(cancelado ? refugo.motivoCancelamento : refugo.observacao)}
          </div>

          <div class="assinaturas">
            <table class="assinaturas-grid">
              <tr>
                <td>
                  <div class="linha-ass"></div>
                  Operador do Posto
                </td>

                <td>
                  <div class="linha-ass"></div>
                  Líder de Linha
                </td>
              </tr>

              <tr>
                <td>
                  <div class="linha-ass"></div>
                  Técnico de Produção
                </td>

                <td>
                  <div class="linha-ass"></div>
                  Coordenador de Produção
                </td>

                <td>
                  <div class="linha-ass"></div>
                  Qualidade
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`
}