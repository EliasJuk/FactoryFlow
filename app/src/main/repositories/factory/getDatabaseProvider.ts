import { loadConfig } from "../../config/appConfig"

export function getDatabaseProvider() {
  return loadConfig().database.provider
}