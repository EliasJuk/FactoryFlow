import { app } from "electron"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { Client } from "pg"

export type DatabaseProvider = "sqlite" | "postgres"

export type ConfiguracaoBanco = {
  provider: DatabaseProvider
  postgres: {
    host: string
    port: number
    database: string
    user: string
    password: string
  }
}

function getApplicationFolder() {
  if (!app.isPackaged) {
    return process.cwd()
  }

  return process.env.PORTABLE_EXECUTABLE_DIR || dirname(app.getPath("exe"))
}

const configFolder = join(getApplicationFolder(), "config")
const configPath = join(configFolder, "database-config.json")

const configPadrao: ConfiguracaoBanco = {
  provider: "sqlite",
  postgres: {
    host: "localhost",
    port: 5432,
    database: "factoryflow",
    user: "postgres",
    password: ""
  }
}

export class ConfiguracaoService {
  carregarBanco(): ConfiguracaoBanco {
    if (!existsSync(configFolder)) {
      mkdirSync(configFolder, { recursive: true })
    }

    if (!existsSync(configPath)) {
      writeFileSync(configPath, JSON.stringify(configPadrao, null, 2), "utf8")
      return configPadrao
    }

    const conteudo = readFileSync(configPath, "utf8")
    return {
      ...configPadrao,
      ...JSON.parse(conteudo)
    }
  }

  salvarBanco(config: ConfiguracaoBanco) {
    if (!existsSync(configFolder)) {
      mkdirSync(configFolder, { recursive: true })
    }

    writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8")

    return {
      sucesso: true,
      mensagem: "Configuração salva com sucesso. Reinicie o sistema para aplicar a troca de banco."
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
    } finally {
      await client.end()
    }
  }
}