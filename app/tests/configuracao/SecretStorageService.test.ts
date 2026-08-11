import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const state = vi.hoisted(() => ({
  secretsPath: ''
}))

vi.mock('../../src/main/config/appConfig', () => ({
  getSecretsPath: () => state.secretsPath
}))

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => true,

    encryptString: (value: string) => Buffer.from(`encrypted:${value}`, 'utf8'),

    decryptString: (value: Buffer) =>
      value.toString('utf8').replace(/^encrypted:/, '')
  }
}))

import { SecretStorageService } from '../../src/main/services/SecretStorageService'

describe('SecretStorageService', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'factoryflow-secrets-'))
    state.secretsPath = join(tempDir, 'config', 'secrets.json')

    mkdirSync(join(tempDir, 'config'), { recursive: true })
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('cria o arquivo quando secrets.json não existe', () => {
    const service = new SecretStorageService()

    service.savePostgresPassword('senha-teste')

    const secrets = JSON.parse(readFileSync(state.secretsPath, 'utf8'))

    expect(secrets.postgresPassword).toBeTruthy()
    expect(service.getPostgresPassword()).toBe('senha-teste')
  })

  it('preserva outros segredos ao atualizar a senha do PostgreSQL', () => {
    const service = new SecretStorageService()

    service.savePostgresPassword('senha-antiga')

    const secrets = JSON.parse(readFileSync(state.secretsPath, 'utf8'))
    secrets.apiToken = 'token-existente'

    writeFileSync(state.secretsPath, JSON.stringify(secrets, null, 2), 'utf8')

    service.savePostgresPassword('senha-nova')

    const atualizado = JSON.parse(readFileSync(state.secretsPath, 'utf8'))

    expect(atualizado.apiToken).toBe('token-existente')
    expect(service.getPostgresPassword()).toBe('senha-nova')
  })

  it('recria secrets.json quando o arquivo existente está inválido', () => {
    const service = new SecretStorageService()

    writeFileSync(state.secretsPath, '{ invalid json', 'utf8')

    expect(() => service.savePostgresPassword('senha-recuperada')).not.toThrow()

    const secrets = JSON.parse(readFileSync(state.secretsPath, 'utf8'))

    expect(secrets.postgresPassword).toBeTruthy()
    expect(service.hasPostgresPassword()).toBe(true)
    expect(service.getPostgresPassword()).toBe('senha-recuperada')
  })
})