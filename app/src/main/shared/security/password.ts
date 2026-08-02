import crypto from 'crypto'

const ITERACOES = 100000
const TAMANHO_CHAVE = 64
const ALGORITMO = 'sha512'

const LETRAS_MAIUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LETRAS_MINUSCULAS = 'abcdefghijkmnopqrstuvwxyz'
const NUMEROS = '23456789'
const CARACTERES_TEMPORARIOS = `${LETRAS_MAIUSCULAS}${LETRAS_MINUSCULAS}${NUMEROS}`
const TAMANHO_SENHA_TEMPORARIA = 12

function caractereAleatorio(conjunto: string): string {
  return conjunto[crypto.randomInt(0, conjunto.length)]
}

function embaralharSeguro(caracteres: string[]): string {
  for (let indice = caracteres.length - 1; indice > 0; indice--) {
    const troca = crypto.randomInt(0, indice + 1)
    ;[caracteres[indice], caracteres[troca]] = [caracteres[troca], caracteres[indice]]
  }

  return caracteres.join('')
}

export function gerarHashSenha(senha: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(senha, salt, ITERACOES, TAMANHO_CHAVE, ALGORITMO).toString('hex')

  return `${salt}:${hash}`
}

export function verificarSenha(senha: string, senhaHash: string): boolean {
  const [salt, hashOriginal] = senhaHash.split(':')

  if (!salt || !hashOriginal) return false

  const hashDigitado = crypto
    .pbkdf2Sync(senha, salt, ITERACOES, TAMANHO_CHAVE, ALGORITMO)
    .toString('hex')

  const original = Buffer.from(hashOriginal, 'hex')
  const digitado = Buffer.from(hashDigitado, 'hex')

  if (original.length !== digitado.length) return false

  return crypto.timingSafeEqual(original, digitado)
}

export function gerarSenhaTemporaria(): string {
  const caracteres = [
    caractereAleatorio(LETRAS_MAIUSCULAS),
    caractereAleatorio(LETRAS_MINUSCULAS),
    caractereAleatorio(NUMEROS)
  ]

  while (caracteres.length < TAMANHO_SENHA_TEMPORARIA) {
    caracteres.push(caractereAleatorio(CARACTERES_TEMPORARIOS))
  }

  return embaralharSeguro(caracteres)
}
