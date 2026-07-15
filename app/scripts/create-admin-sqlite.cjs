const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const readline = require('node:readline')
const { DatabaseSync } = require('node:sqlite')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const cor = {
  reset: '\x1b[0m',
  negrito: '\x1b[1m',
  ciano: '\x1b[36m',
  verde: '\x1b[32m',
  amarelo: '\x1b[33m',
  vermelho: '\x1b[31m',
  branco: '\x1b[97m'
}

function destaque(texto) {
  return `${cor.negrito}${cor.ciano}${texto}${cor.reset}`
}

function aviso(texto) {
  return `${cor.negrito}${cor.amarelo}${texto}${cor.reset}`
}

function sucesso(texto) {
  return `${cor.negrito}${cor.verde}${texto}${cor.reset}`
}

function erro(texto) {
  return `${cor.negrito}${cor.vermelho}${texto}${cor.reset}`
}

function perguntar(texto) {
  return new Promise((resolve) => {
    rl.question(texto, (resposta) => resolve(resposta.trim()))
  })
}

function gerarHashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(senha, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

function gerarUuidV7() {
  const timestamp = BigInt(Date.now())
  const bytes = crypto.randomBytes(16)

  bytes[0] = Number((timestamp >> 40n) & 0xffn)
  bytes[1] = Number((timestamp >> 32n) & 0xffn)
  bytes[2] = Number((timestamp >> 24n) & 0xffn)
  bytes[3] = Number((timestamp >> 16n) & 0xffn)
  bytes[4] = Number((timestamp >> 8n) & 0xffn)
  bytes[5] = Number(timestamp & 0xffn)

  bytes[6] = (bytes[6] & 0x0f) | 0x70
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = bytes.toString('hex')

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20)
  ].join('-')
}

function tabelaExiste(db, tabela) {
  return Boolean(
    db
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1")
      .get(tabela)
  )
}

function colunaExiste(db, tabela, coluna) {
  return db
    .prepare(`PRAGMA table_info(${tabela})`)
    .all()
    .some((item) => item.name === coluna)
}

function encontrarBancos(diretorioBase) {
  const candidatosDiretos = [
    path.join(diretorioBase, 'database', 'factoryflow.db'),
    path.join(diretorioBase, 'database', 'database.db'),
    path.join(diretorioBase, 'data', 'factoryflow.db'),
    path.join(diretorioBase, 'factoryflow.db')
  ]

  const encontrados = candidatosDiretos.filter((arquivo) => fs.existsSync(arquivo))

  for (const pasta of ['database', 'data']) {
    const caminho = path.join(diretorioBase, pasta)

    if (!fs.existsSync(caminho) || !fs.statSync(caminho).isDirectory()) {
      continue
    }

    for (const nome of fs.readdirSync(caminho)) {
      if (!nome.toLowerCase().endsWith('.db')) {
        continue
      }

      const arquivo = path.join(caminho, nome)

      if (!encontrados.includes(arquivo)) {
        encontrados.push(arquivo)
      }
    }
  }

  return encontrados
}

async function escolherBanco() {
  const informado = process.argv[2]

  if (informado) {
    const absoluto = path.resolve(informado.replace(/^"|"$/g, ''))

    if (!fs.existsSync(absoluto)) {
      throw new Error(`Banco não encontrado: ${absoluto}`)
    }

    return absoluto
  }

  const encontrados = encontrarBancos(process.cwd())

  if (encontrados.length === 0) {
    const digitado = await perguntar('Caminho completo do arquivo SQLite (.db): ')
    const absoluto = path.resolve(digitado.replace(/^"|"$/g, ''))

    if (!fs.existsSync(absoluto)) {
      throw new Error(`Banco não encontrado: ${absoluto}`)
    }

    return absoluto
  }

  if (encontrados.length === 1) {
    return encontrados[0]
  }

  console.log('\nBancos SQLite encontrados:\n')

  encontrados.forEach((arquivo, indice) => {
    console.log(`  ${indice + 1}. ${arquivo}`)
  })

  const escolha = Number(await perguntar('\nEscolha o número do banco: '))

  if (!Number.isInteger(escolha) || escolha < 1 || escolha > encontrados.length) {
    throw new Error('Opção inválida.')
  }

  return encontrados[escolha - 1]
}

async function executar() {
  console.log(`\n${cor.negrito}${cor.verde}=== FactoryFlow - Criar/recuperar usuário ADMIN ===${cor.reset}\n`)

  const bancoPath = await escolherBanco()

  console.log(`\n${cor.negrito}${cor.branco}Banco selecionado:${cor.reset} ${cor.ciano}${bancoPath}${cor.reset}\n`)

  const db = new DatabaseSync(bancoPath)

  try {
    db.exec('PRAGMA foreign_keys = ON')

    if (!tabelaExiste(db, 'usuarios')) {
      throw new Error(
        'A tabela usuarios não existe. Inicie o FactoryFlow uma vez para executar as migrations.'
      )
    }

    const obrigatorias = ['uuid', 'nome', 'matricula', 'perfil', 'senha_hash', 'ativo']
    const ausentes = obrigatorias.filter((coluna) => !colunaExiste(db, 'usuarios', coluna))

    if (ausentes.length > 0) {
      throw new Error(`A tabela usuarios não possui as colunas: ${ausentes.join(', ')}`)
    }

    const nome = await perguntar(`\n${destaque('Nome do administrador:')} `)
    const matricula = await perguntar(`${destaque('Matrícula:')} `)

    if (!nome || !matricula) {
      throw new Error('Nome e matrícula são obrigatórios.')
    }

    let senha = await perguntar(`${destaque('Senha temporária numérica de 4 dígitos:')} `)

    if (!/^\d{4}$/.test(senha)) {
      console.log(`\n${aviso('A senha precisa ter exatamente 4 números.')}`)
      senha = await perguntar(`${destaque('Digite novamente a senha temporária:')} `)
    }

    if (!/^\d{4}$/.test(senha)) {
      throw new Error('Senha temporária inválida.')
    }

    const camposConsulta = ['id', 'nome', 'matricula', 'perfil', 'ativo']

    if (colunaExiste(db, 'usuarios', 'deleted_at')) {
      camposConsulta.push('deleted_at AS deletedAt')
    } else {
      camposConsulta.push('NULL AS deletedAt')
    }

    const existente = db
      .prepare(
        `
          SELECT ${camposConsulta.join(', ')}
          FROM usuarios
          WHERE matricula = ?
          LIMIT 1
        `
      )
      .get(matricula)

    const senhaHash = gerarHashSenha(senha)

    db.exec('BEGIN IMMEDIATE')

    try {
      if (existente) {
        console.log(`\n${aviso('Já existe um usuário com essa matrícula:')}`)
        console.log(`  ID: ${existente.id}`)
        console.log(`  Nome: ${existente.nome}`)
        console.log(`  Perfil: ${existente.perfil}`)
        console.log(`  Ativo: ${Boolean(existente.ativo) ? 'Sim' : 'Não'}`)

        const confirmar = (
          await perguntar(
            '\nTransformar/reativar este usuário como ADMIN e redefinir a senha? [s/N]: '
          )
        ).toLowerCase()

        if (confirmar !== 's' && confirmar !== 'sim') {
          db.exec('ROLLBACK')
          console.log(`\n${aviso('Operação cancelada. Nenhuma alteração foi feita.')}\n`)
          return
        }

        const campos = [
          'nome = ?',
          "perfil = 'ADMIN'",
          'senha_hash = ?',
          'ativo = 1'
        ]

        const valores = [nome, senhaHash]

        if (colunaExiste(db, 'usuarios', 'deve_trocar_senha')) {
          campos.push('deve_trocar_senha = 1')
        }

        if (colunaExiste(db, 'usuarios', 'deleted_at')) {
          campos.push('deleted_at = NULL')
        }

        if (colunaExiste(db, 'usuarios', 'deleted_by')) {
          campos.push('deleted_by = NULL')
        }

        if (colunaExiste(db, 'usuarios', 'updated_at')) {
          campos.push("updated_at = datetime('now','localtime')")
        }

        if (colunaExiste(db, 'usuarios', 'updated_by')) {
          campos.push('updated_by = NULL')
        }

        valores.push(existente.id)

        db.prepare(
          `
            UPDATE usuarios
            SET ${campos.join(',\n                ')}
            WHERE id = ?
          `
        ).run(...valores)

        console.log(`\n${sucesso('Usuário atualizado com sucesso.')}`)
      } else {
        const colunas = ['uuid', 'nome', 'matricula', 'perfil', 'senha_hash', 'ativo']
        const valoresSql = ['?', '?', '?', "'ADMIN'", '?', '1']
        const valores = [gerarUuidV7(), nome, matricula, senhaHash]

        if (colunaExiste(db, 'usuarios', 'deve_trocar_senha')) {
          colunas.push('deve_trocar_senha')
          valoresSql.push('1')
        }

        if (colunaExiste(db, 'usuarios', 'created_at')) {
          colunas.push('created_at')
          valoresSql.push("datetime('now','localtime')")
        }

        if (colunaExiste(db, 'usuarios', 'updated_at')) {
          colunas.push('updated_at')
          valoresSql.push("datetime('now','localtime')")
        }

        if (colunaExiste(db, 'usuarios', 'created_by')) {
          colunas.push('created_by')
          valoresSql.push('NULL')
        }

        if (colunaExiste(db, 'usuarios', 'updated_by')) {
          colunas.push('updated_by')
          valoresSql.push('NULL')
        }

        db.prepare(
          `
            INSERT INTO usuarios (${colunas.join(', ')})
            VALUES (${valoresSql.join(', ')})
          `
        ).run(...valores)

        console.log(`\n${sucesso('Administrador criado com sucesso.')}`)
      }

      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }

    console.log(`${cor.negrito}Matrícula:${cor.reset} ${cor.ciano}${matricula}${cor.reset}`)
    console.log(`${cor.negrito}Senha temporária:${cor.reset} ${cor.amarelo}${senha}${cor.reset}`)
    console.log(`${cor.verde}No primeiro login, o sistema solicitará uma nova senha.${cor.reset}\n`)
  } finally {
    db.close()
  }
}

executar()
  .catch((erro) => {
    console.error(`\n${cor.negrito}${cor.vermelho}ERRO:${cor.reset} ${erro instanceof Error ? erro.message : String(erro)}\n`)
    process.exitCode = 1
  })
  .finally(() => {
    rl.close()
  })
