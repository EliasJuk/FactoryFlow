import { Client } from "pg"
import {
  loadConfig,
  saveConfig,
  type AppConfig,
  type DatabaseProvider
} from "../config/appConfig"

export type ConfiguracaoBanco = AppConfig["database"]

export class ConfiguracaoService {
  carregarBanco(): ConfiguracaoBanco {
    return loadConfig().database
  }

  salvarBanco(config: ConfiguracaoBanco) {
    const configuracao = loadConfig()

    saveConfig({
      ...configuracao,
      database: config
    })

    return {
      sucesso: true,
      mensagem:
        "Configuração salva com sucesso. Reinicie o FactoryFlow para aplicar a alteração do banco de dados."
    }
  }

  async testarPostgres(config: ConfiguracaoBanco["postgres"]) {
    const client = new Client({
      host: config.host,
      port: Number(config.port),
      database: config.database,
      user: config.user,
      password: config.password
    })

    try {
      await client.connect()
      await client.query("SELECT 1")

      return {
        sucesso: true,
        mensagem: "Conexão com PostgreSQL realizada com sucesso."
      }
    } catch (error) {
      return {
        sucesso: false,
        mensagem: `Erro ao conectar: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      }
    } finally {
      await client.end().catch(() => {})
    }
  }

  getProvider(): DatabaseProvider {
    return loadConfig().database.provider
  }

  isSqlite(): boolean {
    return this.getProvider() === "sqlite"
  }

  isPostgres(): boolean {
    return this.getProvider() === "postgres"
  }
}