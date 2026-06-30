export type DatabaseDriver = "sqlite" | "postgres"

export type DatabaseConfig = {
  driver: DatabaseDriver
}