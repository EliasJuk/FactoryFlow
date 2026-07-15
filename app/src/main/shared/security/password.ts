import crypto from 'crypto'

const ITERACOES = 100000
const TAMANHO_CHAVE = 64
const ALGORITMO = 'sha512'

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
  const valor = crypto.randomInt(0, 10000)
  return valor.toString().padStart(4, '0')
}
