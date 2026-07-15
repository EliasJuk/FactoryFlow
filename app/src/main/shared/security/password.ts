import crypto from 'crypto'

const ITERACOES = 100000
const TAMANHO_CHAVE = 64
const ALGORITMO = 'sha512'

export function gerarHashSenha(senha: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(senha, salt, ITERACOES, TAMANHO_CHAVE, ALGORITMO)
    .toString('hex')

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
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const numeros = '23456789'
  const simbolos = '@#_-'
  const todos = `${letras}${numeros}${simbolos}`

  const escolher = (conjunto: string) =>
    conjunto[crypto.randomInt(0, conjunto.length)]

  const caracteres = [
    escolher('ABCDEFGHJKLMNPQRSTUVWXYZ'),
    escolher('abcdefghijkmnopqrstuvwxyz'),
    escolher(numeros),
    escolher(simbolos)
  ]

  while (caracteres.length < 10) {
    caracteres.push(escolher(todos))
  }

  for (let i = caracteres.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1)
    ;[caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]]
  }

  return caracteres.join('')
}
