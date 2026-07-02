import { app } from "electron"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"

export type DatabaseProvider = "sqlite" | "postgres"

export type AppConfig = {
  database: {
    provider: DatabaseProvider
    postgres: {
      host: string
      port: number
      database: string
      user: string
      password: string
    }
  }
}

const defaultConfig: AppConfig = {
  database: {
    provider: "sqlite",
    postgres: {
      host: "localhost",
      port: 5432,
      database: "factoryflow",
      user: "postgres",
      password: ""
    }
  }
}

export function getApplicationFolder() {
  if (!app.isPackaged) return process.cwd()

  return process.env.PORTABLE_EXECUTABLE_DIR || dirname(app.getPath("exe"))
}

export function getConfigPath() {
  return join(getApplicationFolder(), "config", "config.json")
}

export function loadConfig(): AppConfig {
  const configPath = getConfigPath()
  const configFolder = dirname(configPath)

  if (!existsSync(configFolder)) {
    mkdirSync(configFolder, { recursive: true })
  }

  if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), "utf8")
    return defaultConfig
  }

  const savedConfig = JSON.parse(readFileSync(configPath, "utf8")) as Partial<AppConfig>

  return {
    ...defaultConfig,
    ...savedConfig,
    database: {
      ...defaultConfig.database,
      ...savedConfig.database,
      postgres: {
        ...defaultConfig.database.postgres,
        ...savedConfig.database?.postgres
      }
    }
  }
}

export function saveConfig(config: AppConfig) {
  const configPath = getConfigPath()
  const configFolder = dirname(configPath)

  if (!existsSync(configFolder)) {
    mkdirSync(configFolder, { recursive: true })
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8")
}