import { safeStorage } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname } from 'path'

import { getSecretsPath } from '../config/appConfig'

type SecretsFile = {
  postgresPassword?: string
  apiToken?: string
}

export class SecretStorageService {
  private readSecrets(): SecretsFile {
    const path = getSecretsPath()

    if (!existsSync(path)) {
      return {}
    }

    try {
      return JSON.parse(readFileSync(path, 'utf8')) as SecretsFile
    } catch {
      throw new Error('O arquivo de credenciais protegidas está inválido.')
    }
  }

  private writeSecrets(secrets: SecretsFile) {
    const path = getSecretsPath()
    const folder = dirname(path)

    if (!existsSync(folder)) {
      mkdirSync(folder, { recursive: true })
    }

    writeFileSync(path, JSON.stringify(secrets, null, 2), 'utf8')
  }

  private ensureEncryptionAvailable() {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error(
        'A proteção de credenciais do sistema operacional não está disponível neste computador.'
      )
    }
  }

  hasPostgresPassword(): boolean {
    return Boolean(this.readSecrets().postgresPassword)
  }

  savePostgresPassword(password: string): void {
    this.ensureEncryptionAvailable()

    let secrets: SecretsFile = {}

    try {
      secrets = this.readSecrets()
    } catch {
      // Arquivo inválido: inicia um novo conteúdo e sobrescreve com a nova credencial.
    }

    secrets.postgresPassword = safeStorage.encryptString(password).toString('base64')

    this.writeSecrets(secrets)
  }

  getPostgresPassword(): string | null {
    const encrypted = this.readSecrets().postgresPassword

    if (!encrypted) {
      return null
    }

    this.ensureEncryptionAvailable()

    try {
      return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    } catch {
      throw new Error(
        'Não foi possível abrir a senha do PostgreSQL neste usuário do Windows. Configure-a novamente.'
      )
    }
  }

  clearPostgresPassword() {
    const secrets = this.readSecrets()
    delete secrets.postgresPassword
    this.writeSecrets(secrets)
  }
}
