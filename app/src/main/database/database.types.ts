export type DatabaseDriver = 'sqlite' | 'postgres'
export type StorageMode = 'sqliteSync' | 'api' | 'postgres'
export type SyncDestination = 'postgres' | 'api'

export type DatabaseConfig = {
  mode: StorageMode
  driver: DatabaseDriver
  syncEnabled: boolean
  syncDestination: SyncDestination
}
