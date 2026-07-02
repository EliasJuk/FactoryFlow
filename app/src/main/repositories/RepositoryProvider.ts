import { ConfiguracaoService } from "../services/ConfiguracaoService"

import { SetorRepository as SqliteSetorRepository } from "./sqlite/SetorRepository"
import { SetorRepository as PostgresSetorRepository } from "./postgres/SetorRepository"

const configuracao = new ConfiguracaoService()

export class RepositoryProvider {
  private static get provider() {
    return configuracao.getProvider()
  }

  static get setores() {
    console.log("====================================")
    console.log("RepositoryProvider")
    console.log("Provider:", this.provider)

    if (this.provider === "postgres") {
      console.log("Usando PostgreSQL")
      console.log("====================================")
      return new PostgresSetorRepository()
    }

    console.log("Usando SQLite")
    console.log("====================================")

    return new SqliteSetorRepository()
  }
}