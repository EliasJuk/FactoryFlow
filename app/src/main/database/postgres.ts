import { Pool } from "pg"

export const postgres = new Pool({
  host: "...",
  port: 5432,
  database: "...",
  user: "...",
  password: "..."
})