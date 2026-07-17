import { ConfiguracaoService } from '../../services/ConfiguracaoService'

import { SetorRepository as SqliteSetorRepository } from '../sqlite/SetorRepository'
import { SetorRepository as PostgresSetorRepository } from '../postgres/SetorRepository'

import { SubsetorRepository as SqliteSubsetorRepository } from '../sqlite/SubsetorRepository'
import { SubsetorRepository as PostgresSubsetorRepository } from '../postgres/SubsetorRepository'

import { UsuarioRepository as SqliteUsuarioRepository } from '../sqlite/UsuarioRepository'
import { UsuarioRepository as PostgresUsuarioRepository } from '../postgres/UsuarioRepository'

import { PostoRepository as SqlitePostoRepository } from '../sqlite/PostoRepository'
import { PostoRepository as PostgresPostoRepository } from '../postgres/PostoRepository'

import { DefeitoRepository as SqliteDefeitoRepository } from '../sqlite/DefeitoRepository'
import { DefeitoRepository as PostgresDefeitoRepository } from '../postgres/DefeitoRepository'

import { ComponenteRepository as SqliteComponenteRepository } from '../sqlite/ComponenteRepository'
import { ComponenteRepository as PostgresComponenteRepository } from '../postgres/ComponenteRepository'

import { CircuitoRepository as SqliteCircuitoRepository } from '../sqlite/CircuitoRepository'
import { CircuitoRepository as PostgresCircuitoRepository } from '../postgres/CircuitoRepository'

import { CircuitoComponenteRepository as SqliteCircuitoComponenteRepository } from '../sqlite/CircuitoComponenteRepository'
import { CircuitoComponenteRepository as PostgresCircuitoComponenteRepository } from '../postgres/CircuitoComponenteRepository'

import { PostoDefeitoRepository as SqlitePostoDefeitoRepository } from '../sqlite/PostoDefeitoRepository'
import { PostoDefeitoRepository as PostgresPostoDefeitoRepository } from '../postgres/PostoDefeitoRepository'

import { RoteiroRepository as SqliteRoteiroRepository } from '../sqlite/RoteiroRepository'
import { RoteiroRepository as PostgresRoteiroRepository } from '../postgres/RoteiroRepository'

import { RefugoRepository as SqliteRefugoRepository } from '../sqlite/RefugoRepository'
import { RefugoRepository as PostgresRefugoRepository } from '../postgres/RefugoRepository'

import { ResultadoRepository as SqliteResultadoRepository } from '../sqlite/ResultadoRepository'
import { ResultadoRepository as PostgresResultadoRepository } from '../postgres/ResultadoRepository'

import { ExportacaoRepository as SqliteExportacaoRepository } from '../sqlite/ExportacaoRepository'
import { ExportacaoRepository as PostgresExportacaoRepository } from '../postgres/ExportacaoRepository'

const configuracaoService = new ConfiguracaoService()

export class RepositoryFactory {
  private static getProvider() {
    return configuracaoService.getProvider()
  }

  static setores() {
    const provider = this.getProvider()

    if (provider === 'postgres') {
      return new PostgresSetorRepository()
    }

    return new SqliteSetorRepository()
  }

  static subsetores() {
    const provider = this.getProvider()

    if (provider === 'postgres') {
      return new PostgresSubsetorRepository()
    }

    return new SqliteSubsetorRepository()
  }

  static usuarios() {
    const provider = this.getProvider()

    if (provider === 'postgres') {
      return new PostgresUsuarioRepository()
    }

    return new SqliteUsuarioRepository()
  }

  static postos() {
    const provider = this.getProvider()

    if (provider === 'postgres') {
      return new PostgresPostoRepository()
    }

    return new SqlitePostoRepository()
  }

  static defeitos() {
    const provider = this.getProvider()

    if (provider === 'postgres') {
      return new PostgresDefeitoRepository()
    }

    return new SqliteDefeitoRepository()
  }

  static componentes() {
    const provider = this.getProvider()

    if (provider === 'postgres') {
      return new PostgresComponenteRepository()
    }

    return new SqliteComponenteRepository()
  }

  static circuitos() {
    const provider = this.getProvider()

    if (provider === 'postgres') {
      return new PostgresCircuitoRepository()
    }

    return new SqliteCircuitoRepository()
  }

  static circuitoComponentes() {
    const provider = this.getProvider()

    if (provider === 'postgres') {
      return new PostgresCircuitoComponenteRepository()
    }

    return new SqliteCircuitoComponenteRepository()
  }

  static postoDefeitos() {
    const provider = this.getProvider()

    if (provider === 'postgres') {
      return new PostgresPostoDefeitoRepository()
    }

    return new SqlitePostoDefeitoRepository()
  }

  static roteiros() {
    const provider = this.getProvider()

    if (provider === 'postgres') {
      return new PostgresRoteiroRepository()
    }

    return new SqliteRoteiroRepository()
  }

  static refugos() {
    const provider = this.getProvider()

    if (provider === 'postgres') {
      return new PostgresRefugoRepository()
    }

    return new SqliteRefugoRepository()
  }

  static resultados() {
    const provider = this.getProvider()

    if (provider === 'postgres') {
      return new PostgresResultadoRepository()
    }

    return new SqliteResultadoRepository()
  }

  static exportacoes() {
    const provider = this.getProvider()

    if (provider === 'postgres') {
      return new PostgresExportacaoRepository()
    }

    return new SqliteExportacaoRepository()
  }
}
