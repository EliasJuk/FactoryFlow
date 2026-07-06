import { dialog } from "electron"
import { existsSync, readFileSync, writeFileSync } from "fs"
import { RepositoryFactory } from "../repositories/factory/RepositoryFactory"

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

type RegistroPreview = {
  id: number
  linha: number
  selecionado: boolean
  dados: Record<string, string>
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

function normalizarCodigo(valor: unknown) {
  return normalizar(valor).toUpperCase()
}

function normalizarNumero(valor: unknown, padrao = 1) {
  const numero = Number(normalizar(valor).replace(",", "."))
  return Number.isFinite(numero) && numero > 0 ? numero : padrao
}

function normalizarPreco(valor: unknown) {
  const texto = normalizar(valor).replace(/\./g, "").replace(",", ".")
  const preco = Number(texto || 0)
  return Number.isFinite(preco) ? preco : 0
}

function detectarSeparador(conteudo: string) {
  const primeiraLinha = conteudo.split(/\r?\n/)[0] ?? ""

  if (primeiraLinha.includes(",") && !primeiraLinha.includes(";")) return ","
  if (primeiraLinha.includes(";") && !primeiraLinha.includes(",")) return ";"

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

  return linhas.slice(1).map((linha, index) => {
    const valores = dividirLinhaCsv(linha, separador)
    const registro: Record<string, string> = {}

    cabecalhos.forEach((cabecalho, index) => {
      registro[cabecalho] = normalizar(valores[index])
    })

    registro.__linha = String(index + 2)

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

    let resumo: Omit<ResultadoImportacao, "sucesso" | "mensagem">

    switch (tipo) {
      case "setores":
        resumo = await this.importarSetores(registros)
        break

      case "subsetores":
        resumo = await this.importarSubsetores(registros)
        break

      case "postos":
        resumo = await this.importarPostos(registros)
        break

      case "componentes":
        resumo = await this.importarComponentes(registros)
        break

      case "circuitos":
        resumo = await this.importarCircuitos(registros)
        break

      case "defeitos":
        resumo = await this.importarDefeitos(registros)
        break

      case "usuarios":
        resumo = await this.importarUsuarios(registros)
        break

      case "circuitoComponentes":
        resumo = await this.importarCircuitoComponentes(registros)
        break

      case "roteiros":
        resumo = await this.importarRoteiros(registros)
        break

      default:
        throw new Error("Tipo de importação inválido.")
    }

    return {
      sucesso: true,
      mensagem: "Importação concluída.",
      ...resumo
    }
  }

  private async importarSetores(registros: Record<string, string>[]) {
    const repository = RepositoryFactory.setores()

    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const nome = normalizar(item.nome)
      const sigla = normalizarCodigo(item.sigla)

      if (!nome || !sigla) {
        ignorados++
        continue
      }

      const ativos = await repository.listar()
      const inativos = await repository.listarInativos()

      const ativo = ativos.find((setor) => setor.sigla === sigla)
      const inativo = inativos.find((setor) => setor.sigla === sigla)

      if (ativo) {
        await repository.editar(ativo.id, nome, sigla)
        atualizados++
        continue
      }

      if (inativo) {
        await repository.restaurar(inativo.id)
        await repository.editar(inativo.id, nome, sigla)
        atualizados++
        continue
      }

      await repository.criar(nome, sigla)
      inseridos++
    }

    return { inseridos, atualizados, ignorados }
  }

  private async importarSubsetores(registros: Record<string, string>[]) {
    const setoresRepository = RepositoryFactory.setores()
    const subsetoresRepository = RepositoryFactory.subsetores()

    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const setorSigla = normalizarCodigo(item.setor_sigla)
      const nome = normalizar(item.nome)

      if (!setorSigla || !nome) {
        ignorados++
        continue
      }

      const setores = [
        ...(await setoresRepository.listar()),
        ...(await setoresRepository.listarInativos())
      ]

      const setor = setores.find((item) => item.sigla === setorSigla)

      if (!setor) {
        ignorados++
        continue
      }

      if (!setor.ativo) {
        await setoresRepository.restaurar(setor.id)
      }

      const subsetores = [
        ...(await subsetoresRepository.listar()),
        ...(await subsetoresRepository.listarInativos())
      ]

      const existente = subsetores.find(
        (subsetor) =>
          subsetor.nome.trim().toLowerCase() === nome.toLowerCase() &&
          subsetor.setorId === setor.id
      )

      if (existente) {
        if (!existente.ativo) {
          await subsetoresRepository.restaurar(existente.id)
        }

        await subsetoresRepository.editar(existente.id, nome, setor.id)
        atualizados++
        continue
      }

      await subsetoresRepository.criar(nome, setor.id)
      inseridos++
    }

    return { inseridos, atualizados, ignorados }
  }

  private async importarPostos(registros: Record<string, string>[]) {
    const setoresRepository = RepositoryFactory.setores()
    const subsetoresRepository = RepositoryFactory.subsetores()
    const postosRepository = RepositoryFactory.postos()

    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const setorSigla = normalizarCodigo(item.setor_sigla)
      const subsetorNome = normalizar(item.subsetor_nome)
      const nome = normalizar(item.nome)

      if (!setorSigla || !subsetorNome || !nome) {
        ignorados++
        continue
      }

      const setores = [
        ...(await setoresRepository.listar()),
        ...(await setoresRepository.listarInativos())
      ]

      const setor = setores.find((item) => item.sigla === setorSigla)

      if (!setor) {
        ignorados++
        continue
      }

      const subsetores = [
        ...(await subsetoresRepository.listar()),
        ...(await subsetoresRepository.listarInativos())
      ]

      const subsetor = subsetores.find(
        (item) =>
          item.setorId === setor.id &&
          item.nome.trim().toLowerCase() === subsetorNome.toLowerCase()
      )

      if (!subsetor) {
        ignorados++
        continue
      }

      if (!subsetor.ativo) {
        await subsetoresRepository.restaurar(subsetor.id)
      }

      const postos = [
        ...(await postosRepository.listar()),
        ...(await postosRepository.listarInativos())
      ]

      const existente = postos.find(
        (posto) =>
          posto.subsetorId === subsetor.id &&
          posto.nome.trim().toLowerCase() === nome.toLowerCase()
      )

      if (existente) {
        if (!existente.ativo) {
          await postosRepository.restaurar(existente.id)
        }

        await postosRepository.editar(existente.id, nome, subsetor.id)
        atualizados++
        continue
      }

      await postosRepository.criar(nome, subsetor.id)
      inseridos++
    }

    return { inseridos, atualizados, ignorados }
  }

  private async importarComponentes(registros: Record<string, string>[]) {
    const repository = RepositoryFactory.componentes()

    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const codigo = normalizarCodigo(item.codigo)
      const nome = normalizar(item.nome)
      const precoAtual = normalizarPreco(item.preco ?? item.preco_atual)

      if (!codigo || !nome) {
        ignorados++
        continue
      }

      const componentes = [
        ...(await repository.listar()),
        ...(await repository.listarInativos())
      ]

      const existente = componentes.find(
        (componente) => componente.codigo === codigo
      )

      if (existente) {
        if (!existente.ativo) {
          await repository.restaurar(existente.id)
        }

        await repository.editar(existente.id, codigo, nome, precoAtual)
        atualizados++
        continue
      }

      await repository.criar(codigo, nome, precoAtual)
      inseridos++
    }

    return { inseridos, atualizados, ignorados }
  }

  private async importarCircuitos(registros: Record<string, string>[]) {
    const repository = RepositoryFactory.circuitos()

    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const codigo = normalizarCodigo(item.codigo)
      const nome = normalizar(item.nome)

      if (!codigo || !nome) {
        ignorados++
        continue
      }

      const circuitos = [
        ...(await repository.listar()),
        ...(await repository.listarInativos())
      ]

      const existente = circuitos.find((circuito) => circuito.codigo === codigo)

      if (existente) {
        if (!existente.ativo) {
          await repository.restaurar(existente.id)
        }

        await repository.editar(existente.id, codigo, nome)
        atualizados++
        continue
      }

      await repository.criar(codigo, nome)
      inseridos++
    }

    return { inseridos, atualizados, ignorados }
  }

  private async importarDefeitos(registros: Record<string, string>[]) {
    const repository = RepositoryFactory.defeitos()

    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const codigo = normalizarCodigo(item.codigo)
      const descricao = normalizar(item.descricao)

      if (!codigo || !descricao) {
        ignorados++
        continue
      }

      const defeitos = [
        ...(await repository.listar()),
        ...(await repository.listarInativos())
      ]

      const existente = defeitos.find((defeito) => defeito.codigo === codigo)

      if (existente) {
        if (!existente.ativo) {
          await repository.restaurar(existente.id)
        }

        await repository.editar(existente.id, codigo, descricao)
        atualizados++
        continue
      }

      await repository.criar(codigo, descricao)
      inseridos++
    }

    return { inseridos, atualizados, ignorados }
  }

  private async importarUsuarios(registros: Record<string, string>[]) {
    const repository = RepositoryFactory.usuarios()

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

      const usuarios = await repository.listar()

      const existente = usuarios.find(
        (usuario) => usuario.matricula === matricula
      )

      if (existente) {
        if (!existente.ativo) {
          await repository.ativar(existente.id)
        }

        await repository.editar(existente.id, {
          nome,
          matricula,
          perfil,
          senha: senha || undefined
        })

        atualizados++
        continue
      }

      await repository.criar({
        nome,
        matricula,
        perfil,
        senha: senha || undefined
      })

      inseridos++
    }

    return { inseridos, atualizados, ignorados }
  }

  private async importarCircuitoComponentes(
    registros: Record<string, string>[]
  ) {
    const circuitosRepository = RepositoryFactory.circuitos()
    const componentesRepository = RepositoryFactory.componentes()
    const circuitoComponentesRepository =
      RepositoryFactory.circuitoComponentes()

    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const circuitoCodigo = normalizarCodigo(item.circuito_codigo)
      const componenteCodigo = normalizarCodigo(item.componente_codigo)
      const quantidade = normalizarNumero(item.quantidade, 1)

      if (!circuitoCodigo || !componenteCodigo) {
        ignorados++
        continue
      }

      const circuitos = [
        ...(await circuitosRepository.listar()),
        ...(await circuitosRepository.listarInativos())
      ]

      const componentes = [
        ...(await componentesRepository.listar()),
        ...(await componentesRepository.listarInativos())
      ]

      const circuito = circuitos.find(
        (item) => item.codigo === circuitoCodigo
      )

      const componente = componentes.find(
        (item) => item.codigo === componenteCodigo
      )

      if (!circuito || !componente) {
        ignorados++
        continue
      }

      if (!circuito.ativo) {
        await circuitosRepository.restaurar(circuito.id)
      }

      if (!componente.ativo) {
        await componentesRepository.restaurar(componente.id)
      }

      const atuais = await circuitoComponentesRepository.listarPorCircuito(
        circuito.id
      )

      const existente = atuais.find(
        (item) => item.componenteId === componente.id
      )

      if (existente) {
        await circuitoComponentesRepository.remover(existente.id)
        await circuitoComponentesRepository.adicionar(
          circuito.id,
          componente.id,
          quantidade
        )

        atualizados++
        continue
      }

      await circuitoComponentesRepository.adicionar(
        circuito.id,
        componente.id,
        quantidade
      )

      inseridos++
    }

    return { inseridos, atualizados, ignorados }
  }

  private async importarRoteiros(registros: Record<string, string>[]) {
    const circuitosRepository = RepositoryFactory.circuitos()
    const postosRepository = RepositoryFactory.postos()
    const componentesRepository = RepositoryFactory.componentes()
    const roteiroRepository = RepositoryFactory.roteiros()

    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const item of registros) {
      const circuitoCodigo = normalizarCodigo(item.circuito_codigo)
      const postoNome = normalizar(item.posto_nome)
      const componenteCodigo = normalizarCodigo(item.componente_codigo)
      const quantidade = normalizarNumero(item.quantidade, 1)

      if (!circuitoCodigo || !postoNome || !componenteCodigo) {
        ignorados++
        continue
      }

      const circuitos = [
        ...(await circuitosRepository.listar()),
        ...(await circuitosRepository.listarInativos())
      ]

      const postos = [
        ...(await postosRepository.listar()),
        ...(await postosRepository.listarInativos())
      ]

      const componentes = [
        ...(await componentesRepository.listar()),
        ...(await componentesRepository.listarInativos())
      ]

      const circuito = circuitos.find(
        (item) => item.codigo === circuitoCodigo
      )

      const posto = postos.find(
        (item) => item.nome.trim().toLowerCase() === postoNome.toLowerCase()
      )

      const componente = componentes.find(
        (item) => item.codigo === componenteCodigo
      )

      if (!circuito || !posto || !componente) {
        ignorados++
        continue
      }

      if (!circuito.ativo) {
        await circuitosRepository.restaurar(circuito.id)
      }

      if (!posto.ativo) {
        await postosRepository.restaurar(posto.id)
      }

      if (!componente.ativo) {
        await componentesRepository.restaurar(componente.id)
      }

      const atuais = await roteiroRepository.listarPorCircuitoEPosto(
        circuito.id,
        posto.id
      )

      const existente = atuais.find(
        (item) => item.componenteId === componente.id
      )

      await roteiroRepository.adicionar(
        circuito.id,
        posto.id,
        componente.id,
        quantidade
      )

      if (existente) {
        atualizados++
      } else {
        inseridos++
      }
    }

    return { inseridos, atualizados, ignorados }
  }

  async preVisualizar(_tipo: TipoImportacao) {
    const resultado = await dialog.showOpenDialog({
      title: "Selecionar arquivo CSV",
      properties: ["openFile"],
      filters: [{ name: "CSV", extensions: ["csv"] }]
    })

    if (resultado.canceled || resultado.filePaths.length === 0) {
      return {
        sucesso: false,
        mensagem: "Operação cancelada.",
        registros: [] as RegistroPreview[]
      }
    }

    const registros = lerCsv(resultado.filePaths[0])

    return {
      sucesso: true,
      mensagem: "Arquivo carregado com sucesso.",
      registros: registros.map((registro, index) => ({
        id: index + 1,
        linha: Number(registro.__linha ?? index + 2),
        selecionado: true,
        dados: registro
      }))
    }
  }

  async importarRegistros(
    tipo: TipoImportacao,
    registros: Record<string, string>[]
  ): Promise<ResultadoImportacao> {
    const registrosLimpos = registros.map((registro) => {
      const copia = { ...registro }
      delete copia.__linha
      return copia
    })

    let resumo: Omit<ResultadoImportacao, "sucesso" | "mensagem">

    switch (tipo) {
      case "setores":
        resumo = await this.importarSetores(registrosLimpos)
        break
      case "subsetores":
        resumo = await this.importarSubsetores(registrosLimpos)
        break
      case "postos":
        resumo = await this.importarPostos(registrosLimpos)
        break
      case "componentes":
        resumo = await this.importarComponentes(registrosLimpos)
        break
      case "circuitos":
        resumo = await this.importarCircuitos(registrosLimpos)
        break
      case "defeitos":
        resumo = await this.importarDefeitos(registrosLimpos)
        break
      case "usuarios":
        resumo = await this.importarUsuarios(registrosLimpos)
        break
      case "circuitoComponentes":
        resumo = await this.importarCircuitoComponentes(registrosLimpos)
        break
      case "roteiros":
        resumo = await this.importarRoteiros(registrosLimpos)
        break
      default:
        throw new Error("Tipo de importação inválido.")
    }

    return {
      sucesso: true,
      mensagem: "Importação concluída.",
      ...resumo
    }
  }
}