import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import {
  type ConfiguracaoBanco,
  type PrimeiroAdministradorInput,
  ConfiguracaoService
} from '../services/ConfiguracaoService'

const service = new ConfiguracaoService()
const PERFIS_ADMINISTRACAO = ['ADMIN'] as const

export function registerConfiguracaoIpc() {
  ipcMain.handle('configuracao:inicial-status', () => {
    return service.obterStatusConfiguracaoInicial()
  })

  ipcMain.handle('configuracao:inicial-postgres-carregar', () => {
    return service.carregarPostgresConfiguracaoInicial()
  })

  ipcMain.handle(
    'configuracao:inicial-postgres-testar',
    (_, config: ConfiguracaoBanco['postgres']) => {
      return service.testarPostgresConfiguracaoInicial(config)
    }
  )

  ipcMain.handle(
    'configuracao:inicial-postgres-salvar',
    (_, config: ConfiguracaoBanco['postgres']) => {
      return service.salvarPostgresConfiguracaoInicial(config)
    }
  )

  ipcMain.handle(
    'configuracao:inicial-admin-criar',
    (_, input: PrimeiroAdministradorInput) => {
      return service.criarPrimeiroAdministrador(input)
    }
  )

  ipcMain.handle('configuracao:banco-carregar', (event) => {
    requireSession(event, {
      perfis: PERFIS_ADMINISTRACAO
    })

    return service.carregarBanco()
  })

  ipcMain.handle(
    'configuracao:banco-salvar',
    (event, config: ConfiguracaoBanco) => {
      requireSession(event, {
        perfis: PERFIS_ADMINISTRACAO
      })

      return service.salvarBanco(config)
    }
  )

  ipcMain.handle(
    'configuracao:postgres-testar',
    (event, config: ConfiguracaoBanco['postgres']) => {
      requireSession(event, {
        perfis: PERFIS_ADMINISTRACAO
      })

      return service.testarPostgres(config)
    }
  )
}
