import crypto from "crypto"
import { dialog } from "electron"
import { existsSync, readFileSync, writeFileSync } from "fs"
import db from "../database/database"

type TipoImportacao =
  | "setores"
  | "subsetores"
  | "postos"
  | "componentes"
  | "circuitos"
  | "defeitos"
  | "usuarios"
  | "circuitoComponentes"
  | "roteiros"

type ResultadoImportacao = {
  sucesso: boolean
  mensagem: string
  inseridos: number
  atualizados: number
  ignorados: number
}

const modelos: Record<TipoImportacao, string> = {
  setores: `nome,sigla
Setor A,SA
Setor B,SB
`,

  subsetores: `setor_sigla,nome
SA,Área de Montagem
SA,Área de Preparação
SA,Área de Inspeção
SB,Área de Processo
SB,Área de TESTE
`,

  postos: `setor_sigla,subsetor_nome,nome
SA,Área de Montagem,Posto 01
SA,Área de Montagem,Posto 02
SA,Área de Inspeção,Inspeção Final
SB,Área de Processo,Posto Processo 01
`,

  componentes: `codigo,nome,preco
COMP-0001,Componente A,10.50
COMP-0002,Componente B,25.00
COMP-0003,Componente C,0
`,

  circuitos: `codigo,nome
PROD-0001,Produto A
PROD-0002,Produto B
`,

  defeitos: `codigo,descricao
D001,Defeito visual
D002,Defeito dimensional
D003,Defeito de montagem
`,

  usuarios: `matricula,nome,perfil,senha
1001,Usuario Admin,ADMIN,1234
1002,Usuario Operador,OPERADOR,1234
1003,Usuario Lider,LIDER,1234
`,

  circuitoComponentes: `circuito_codigo,componente_codigo,quantidade
PROD-0001,COMP-0001,1
PROD-0001,COMP-0002,1
PROD-0002,COMP-0003,1
`,

  roteiros: `circuito_codigo,posto_nome,componente_codigo,quantidade
PROD-0001,Posto 01,COMP-0001,1
PROD-0001,Posto 02,COMP-0002,1
PROD-0002,Posto Processo 01,COMP-0003,1
`
}

function normalizar(valor: unknown) {
  return String(valor ?? "").trim()
}

function normalizarPreco(valor: unknown) {
  const texto = normalizar(valor)
    .replace(/\./g, "")
    .replace(",", ".")

  const preco = Number(texto || 0)

  return Number.isFinite(preco) ? preco : 0
}


function gerarHashSenha(senha: string) {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto
    .pbkdf2Sync(senha, salt, 100000, 64, "sha512")
    .toString("hex")

  return `${salt}:${hash}`
}

function detectarSeparador(conteudo: string) {
  const primeiraLinha = conteudo.split(/\r?\n/)[0] ?? ""

  if (primeiraLinha.includes(",") && !primeiraLinha.includes(";")) {
    return ","
  }

  if (primeiraLinha.includes(";") && !primeiraLinha.includes(",")) {
    return ";"
  }

  const virgulas = (primeiraLinha.match(/,/g) ?? []).length
  const pontosVirgula = (primeiraLinha.match(/;/g) ?? []).length

  return virgulas >= pontosVirgula ? "," : ";"
}

function dividirLinhaCsv(linha: string, separador: string) {
  const valores: string[] = []
  let atual = ""
  let dentroAspas = false

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i]
    const proximo = linha[i + 1]

    if (char === '"' && proximo === '"') {
      atual += '"'
      i++
      continue
    }

    if (char === '"') {
      dentroAspas = !dentroAspas
      continue
    }

    if (char === separador && !dentroAspas) {
      valores.push(atual.trim())
      atual = ""
      continue
    }

    atual += char
  }

  valores.push(atual.trim())

  return valores
}

function limparLinhaCsv(linha: string) {
  const texto = linha.trim()

  // Corrige linhas geradas assim:
  // "nome,sigla"
  // "SETOR-1,ST-01"
  if (texto.startsWith('"') && texto.endsWith('"')) {
    return texto.slice(1, -1).replaceAll('""', '"')
  }

  return texto
}

function lerCsv(caminho: string) {
  if (!existsSync(caminho)) {
    throw new Error("Arquivo não encontrado.")
  }

  const conteudo = readFileSync(caminho, "utf8")
    .replace(/^\uFEFF/, "")
    .trim()

  const linhas = conteudo
    .split(/\r?\n/)
    .map((linha) => limparLinhaCsv(linha))
    .filter(Boolean)

  if (linhas.length <= 1) return []

  let separador = detectarSeparador(linhas[0])

  let cabecalhos = dividirLinhaCsv(linhas[0], separador).map((item) =>
    item
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  )

  if (cabecalhos.length === 1 && cabecalhos[0].includes(",")) {
    separador = ","

    cabecalhos = dividirLinhaCsv(linhas[0], separador).map((item) =>
      item
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    )
  }

  console.log("[IMPORTACAO] Arquivo:", caminho)
  console.log("[IMPORTACAO] Separador:", separador)
  console.log("[IMPORTACAO] Cabeçalhos:", cabecalhos)

  return linhas.slice(1).map((linha) => {
    const valores = dividirLinhaCsv(linha, separador)
    const registro: Record<string, string> = {}

    cabecalhos.forEach((cabecalho, index) => {
      registro[cabecalho] = normalizar(valores[index])
    })

    return registro
  })
}

export class ImportacaoService {
  async baixarModelo(tipo: TipoImportacao) {
    const modelo = modelos[tipo]

    const resultado = await dialog.showSaveDialog({
      title: "Salvar modelo CSV",
      defaultPath: `modelo-${tipo}.csv`,
      filters: [{ name: "CSV", extensions: ["csv"] }]
    })

    if (resultado.canceled || !resultado.filePath) {
      return { sucesso: false, mensagem: "Operação cancelada." }
    }

    writeFileSync(resultado.filePath, modelo, "utf8")

    return {
      sucesso: true,
      mensagem: "Modelo salvo com sucesso."
    }
  }

  async importar(tipo: TipoImportacao): Promise<ResultadoImportacao> {
    const resultado = await dialog.showOpenDialog({
      title: "Selecionar arquivo CSV",
      properties: ["openFile"],
      filters: [{ name: "CSV", extensions: ["csv"] }]
    })

    if (resultado.canceled || resultado.filePaths.length === 0) {
      return {
        sucesso: false,
        mensagem: "Importação cancelada.",
        inseridos: 0,
        atualizados: 0,
        ignorados: 0
      }
    }

    const registros = lerCsv(resultado.filePaths[0])

    const transaction = db.transaction(() => {
      switch (tipo) {
        case "setores":
          return this.importarSetores(registros)

        case "subsetores":
          return this.importarSubsetores(registros)

        case "postos":
          return this.importarPostos(registros)

        case "componentes":
          return this.importarComponentes(registros)

        case "circuitos":
          return this.importarCircuitos(registros)

        case "defeitos":
          return this.importarDefeitos(registros)

        case "usuarios":
          return this.importarUsuarios(registros)

        case "circuitoComponentes":
          return this.importarCircuitoComponentes(registros)

        case "roteiros":
          return this.importarRoteiros(registros)

        default:
          throw new Error("Tipo de importação inválido.")
      }
    })

    const resumo = transaction()

    return {
      sucesso: true,
      mensagem: "Importação concluída.",
      ...resumo
    }
  }

  private importarSetores(registros: Record<string, string>[]) {
    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const nome = normalizar(item.nome)
      const sigla = normalizar(item.sigla).toUpperCase()

      if (!nome || !sigla) {
        ignorados++
        continue
      }

      const existente = db
        .prepare(`SELECT id FROM setores WHERE sigla = ?`)
        .get(sigla) as { id: number } | undefined

      if (existente) {
        db.prepare(`
          UPDATE setores
          SET nome = ?, ativo = 1
          WHERE id = ?
        `).run(nome, existente.id)

        atualizados++
      } else {
        db.prepare(`
          INSERT INTO setores (nome, sigla, ativo)
          VALUES (?, ?, 1)
        `).run(nome, sigla)

        inseridos++
      }
    }

    return { inseridos, atualizados, ignorados }
  }

  private importarSubsetores(registros: Record<string, string>[]) {
    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const setorSigla = normalizar(item.setor_sigla).toUpperCase()
      const nome = normalizar(item.nome)

      const setor = db
        .prepare(`SELECT id FROM setores WHERE sigla = ?`)
        .get(setorSigla) as { id: number } | undefined

      if (!setor || !nome) {
        ignorados++
        continue
      }

      const existente = db
        .prepare(`
          SELECT id FROM subsetores
          WHERE nome = ? AND setor_id = ?
        `)
        .get(nome, setor.id) as { id: number } | undefined

      if (existente) {
        db.prepare(`
          UPDATE subsetores
          SET ativo = 1
          WHERE id = ?
        `).run(existente.id)

        atualizados++
      } else {
        db.prepare(`
          INSERT INTO subsetores (nome, setor_id, ativo)
          VALUES (?, ?, 1)
        `).run(nome, setor.id)

        inseridos++
      }
    }

    return { inseridos, atualizados, ignorados }
  }

  private importarPostos(registros: Record<string, string>[]) {
    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const setorSigla = normalizar(item.setor_sigla).toUpperCase()
      const subsetorNome = normalizar(item.subsetor_nome)
      const nome = normalizar(item.nome)

      const subsetor = db
        .prepare(`
          SELECT sub.id
          FROM subsetores sub
          INNER JOIN setores s ON s.id = sub.setor_id
          WHERE s.sigla = ?
            AND sub.nome = ?
        `)
        .get(setorSigla, subsetorNome) as { id: number } | undefined

      if (!subsetor || !nome) {
        ignorados++
        continue
      }

      const existente = db
        .prepare(`
          SELECT id FROM postos
          WHERE nome = ? AND subsetor_id = ?
        `)
        .get(nome, subsetor.id) as { id: number } | undefined

      if (existente) {
        db.prepare(`
          UPDATE postos
          SET ativo = 1
          WHERE id = ?
        `).run(existente.id)

        atualizados++
      } else {
        db.prepare(`
          INSERT INTO postos (nome, subsetor_id, ativo)
          VALUES (?, ?, 1)
        `).run(nome, subsetor.id)

        inseridos++
      }
    }

    return { inseridos, atualizados, ignorados }
  }

  private importarComponentes(registros: Record<string, string>[]) {
    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const codigo = normalizar(item.codigo)
      const nome = normalizar(item.nome)
      const precoAtual = normalizarPreco(item.preco ?? item.preco_atual)

      if (!codigo || !nome) {
        ignorados++
        continue
      }

      const existente = db
        .prepare(`SELECT id FROM componentes WHERE codigo = ?`)
        .get(codigo) as { id: number } | undefined

      if (existente) {
        db.prepare(`
          UPDATE componentes
          SET nome = ?, preco_atual = ?, ativo = 1
          WHERE id = ?
        `).run(nome, precoAtual, existente.id)

        atualizados++
      } else {
        db.prepare(`
          INSERT INTO componentes (codigo, nome, preco_atual, ativo)
          VALUES (?, ?, ?, 1)
        `).run(codigo, nome, precoAtual)

        inseridos++
      }
    }

    return { inseridos, atualizados, ignorados }
  }

  private importarCircuitos(registros: Record<string, string>[]) {
    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const codigo = normalizar(item.codigo)
      const nome = normalizar(item.nome)

      if (!codigo || !nome) {
        ignorados++
        continue
      }

      const existente = db
        .prepare(`SELECT id FROM circuitos WHERE codigo = ?`)
        .get(codigo) as { id: number } | undefined

      if (existente) {
        db.prepare(`
          UPDATE circuitos
          SET nome = ?, ativo = 1
          WHERE id = ?
        `).run(nome, existente.id)

        atualizados++
      } else {
        db.prepare(`
          INSERT INTO circuitos (codigo, nome, ativo)
          VALUES (?, ?, 1)
        `).run(codigo, nome)

        inseridos++
      }
    }

    return { inseridos, atualizados, ignorados }
  }

  private importarDefeitos(registros: Record<string, string>[]) {
    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const codigo = normalizar(item.codigo)
      const descricao = normalizar(item.descricao)

      if (!codigo || !descricao) {
        ignorados++
        continue
      }

      const existente = db
        .prepare(`SELECT id FROM defeitos WHERE codigo = ?`)
        .get(codigo) as { id: number } | undefined

      if (existente) {
        db.prepare(`
          UPDATE defeitos
          SET descricao = ?, ativo = 1
          WHERE id = ?
        `).run(descricao, existente.id)

        atualizados++
      } else {
        db.prepare(`
          INSERT INTO defeitos (codigo, descricao, ativo)
          VALUES (?, ?, 1)
        `).run(codigo, descricao)

        inseridos++
      }
    }

    return { inseridos, atualizados, ignorados }
  }

  private importarUsuarios(registros: Record<string, string>[]) {
    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const matricula = normalizar(item.matricula)
      const nome = normalizar(item.nome)
      const perfil = normalizar(item.perfil || "OPERADOR").toUpperCase()
      const senha = normalizar(item.senha)

      if (!matricula || !nome) {
        ignorados++
        continue
      }

      const senhaHash = senha ? gerarHashSenha(senha) : null

      const existente = db
        .prepare(`SELECT id FROM usuarios WHERE matricula = ?`)
        .get(matricula) as { id: number } | undefined

      if (existente) {
        if (senhaHash) {
          db.prepare(`
            UPDATE usuarios
            SET nome = ?, perfil = ?, senha_hash = ?, ativo = 1
            WHERE id = ?
          `).run(nome, perfil, senhaHash, existente.id)
        } else {
          db.prepare(`
            UPDATE usuarios
            SET nome = ?, perfil = ?, ativo = 1
            WHERE id = ?
          `).run(nome, perfil, existente.id)
        }

        atualizados++
      } else {
        db.prepare(`
          INSERT INTO usuarios (nome, matricula, perfil, senha_hash, ativo)
          VALUES (?, ?, ?, ?, 1)
        `).run(nome, matricula, perfil, senhaHash)

        inseridos++
      }
    }

    return { inseridos, atualizados, ignorados }
  }

  private importarCircuitoComponentes(registros: Record<string, string>[]) {
    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const circuitoCodigo = normalizar(item.circuito_codigo)
      const componenteCodigo = normalizar(item.componente_codigo)
      const quantidade = Number(item.quantidade || 1)

      const circuito = db
        .prepare(`SELECT id FROM circuitos WHERE codigo = ?`)
        .get(circuitoCodigo) as { id: number } | undefined

      const componente = db
        .prepare(`SELECT id FROM componentes WHERE codigo = ?`)
        .get(componenteCodigo) as { id: number } | undefined

      if (!circuito || !componente) {
        ignorados++
        continue
      }

      const existente = db
        .prepare(`
          SELECT id FROM circuito_componentes
          WHERE circuito_id = ?
            AND componente_id = ?
        `)
        .get(circuito.id, componente.id) as { id: number } | undefined

      if (existente) {
        db.prepare(`
          UPDATE circuito_componentes
          SET quantidade = ?, ativo = 1
          WHERE id = ?
        `).run(quantidade, existente.id)

        atualizados++
      } else {
        db.prepare(`
          INSERT INTO circuito_componentes (
            circuito_id,
            componente_id,
            quantidade,
            ativo
          ) VALUES (?, ?, ?, 1)
        `).run(circuito.id, componente.id, quantidade)

        inseridos++
      }
    }

    return { inseridos, atualizados, ignorados }
  }

  private importarRoteiros(registros: Record<string, string>[]) {
    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const circuitoCodigo = normalizar(item.circuito_codigo)
      const postoNome = normalizar(item.posto_nome)
      const componenteCodigo = normalizar(item.componente_codigo)
      const quantidade = Number(item.quantidade || 1)

      const circuito = db
        .prepare(`SELECT id FROM circuitos WHERE codigo = ?`)
        .get(circuitoCodigo) as { id: number } | undefined

      const posto = db
        .prepare(`SELECT id FROM postos WHERE nome = ?`)
        .get(postoNome) as { id: number } | undefined

      const componente = db
        .prepare(`SELECT id FROM componentes WHERE codigo = ?`)
        .get(componenteCodigo) as { id: number } | undefined

      if (!circuito || !posto || !componente) {
        ignorados++
        continue
      }

      const existente = db
        .prepare(`
          SELECT id FROM circuito_posto_componentes
          WHERE circuito_id = ?
            AND posto_id = ?
            AND componente_id = ?
        `)
        .get(circuito.id, posto.id, componente.id) as { id: number } | undefined

      if (existente) {
        db.prepare(`
          UPDATE circuito_posto_componentes
          SET quantidade = ?, ativo = 1
          WHERE id = ?
        `).run(quantidade, existente.id)

        atualizados++
      } else {
        db.prepare(`
          INSERT INTO circuito_posto_componentes (
            circuito_id,
            posto_id,
            componente_id,
            quantidade,
            ativo
          ) VALUES (?, ?, ?, ?, 1)
        `).run(circuito.id, posto.id, componente.id, quantidade)

        inseridos++
      }
    }

    return { inseridos, atualizados, ignorados }
  }
}