import { ConfiguracaoService } from "../services/ConfiguracaoService"

import { SetorRepository as SqliteSetorRepository } from "./sqlite/SetorRepository"
import { SetorRepository as PostgresSetorRepository } from "./postgres/SetorRepository"

import { SubsetorRepository as SqliteSubsetorRepository } from "./sqlite/SubsetorRepository"
import { SubsetorRepository as PostgresSubsetorRepository } from "./postgres/SubsetorRepository"

import { PostoRepository as SqlitePostoRepository } from "./sqlite/PostoRepository"
import { PostoRepository as PostgresPostoRepository } from "./postgres/PostoRepository"

const configuracao = new ConfiguracaoService()

export class RepositoryProvider {
  private static get provider() {
    return configuracao.getProvider()
  }

  static get setores() {
    if (this.provider === "postgres") {
      return new PostgresSetorRepository()
    }

    return new SqliteSetorRepository()
  }

  static get subsetores() {
    if (this.provider === "postgres") {
      return new PostgresSubsetorRepository()
    }

    return new SqliteSubsetorRepository()
  }

  static get postos() {
    if (this.provider === "postgres") {
      return new PostgresPostoRepository()
    }

    return new SqlitePostoRepository()
  }
}