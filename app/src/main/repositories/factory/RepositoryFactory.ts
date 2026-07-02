import { ConfiguracaoService } from "../../services/ConfiguracaoService"

import { SetorRepository as SqliteSetorRepository } from "../sqlite/SetorRepository"
import { SetorRepository as PostgresSetorRepository } from "../postgres/SetorRepository"

const configuracaoService = new ConfiguracaoService()

export class RepositoryFactory {
  static setores() {
    const provider = configuracaoService.getProvider()

    if (provider === "postgres") {
      return new PostgresSetorRepository()
    }

    return new SqliteSetorRepository()
  }
}