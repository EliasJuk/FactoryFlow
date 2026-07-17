import { existsSync, readFileSync } from 'fs'

import type { RegistroCsv } from './importacao.types'

export function normalizar(valor: unknown) {
  return String(valor ?? '').trim()
}

export function normalizarCodigo(valor: unknown) {
  return normalizar(valor).toUpperCase()
}

export function normalizarNumero(valor: unknown, padrao = 1) {
  const numero = Number(normalizar(valor).replace(',', '.'))

  return Number.isFinite(numero) && numero > 0 ? numero : padrao
}

export function normalizarPreco(valor: unknown) {
  const texto = normalizar(valor).replace(/\./g, '').replace(',', '.')
  const preco = Number(texto || 0)

  return Number.isFinite(preco) ? preco : 0
}

function detectarSeparador(conteudo: string) {
  const primeiraLinha = conteudo.split(/\r?\n/)[0] ?? ''

  if (primeiraLinha.includes(',') && !primeiraLinha.includes(';')) return ','
  if (primeiraLinha.includes(';') && !primeiraLinha.includes(',')) return ';'

  const virgulas = (primeiraLinha.match(/,/g) ?? []).length
  const pontosVirgula = (primeiraLinha.match(/;/g) ?? []).length

  return virgulas >= pontosVirgula ? ',' : ';'
}

function dividirLinhaCsv(linha: string, separador: string) {
  const valores: string[] = []
  let atual = ''
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
      atual = ''
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

export function lerCsv(caminho: string): RegistroCsv[] {
  if (!existsSync(caminho)) {
    throw new Error('Arquivo não encontrado.')
  }

  const conteudo = readFileSync(caminho, 'utf8')
    .replace(/^\uFEFF/, '')
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
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  )

  if (cabecalhos.length === 1 && cabecalhos[0].includes(',')) {
    separador = ','

    cabecalhos = dividirLinhaCsv(linhas[0], separador).map((item) =>
      item
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    )
  }

  console.log('[IMPORTACAO] Arquivo:', caminho)
  console.log('[IMPORTACAO] Separador:', separador)
  console.log('[IMPORTACAO] Cabeçalhos:', cabecalhos)

  return linhas.slice(1).map((linha, index) => {
    const valores = dividirLinhaCsv(linha, separador)
    const registro: RegistroCsv = {}

    cabecalhos.forEach((cabecalho, indice) => {
      registro[cabecalho] = normalizar(valores[indice])
    })

    registro.__linha = String(index + 2)

    return registro
  })
}
