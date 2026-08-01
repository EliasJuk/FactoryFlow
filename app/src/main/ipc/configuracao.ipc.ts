import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import { type ConfiguracaoBanco, ConfiguracaoService } from '../services/ConfiguracaoService'

const service = new ConfiguracaoService()
const PERFIS_ADMINISTRACAO = ['ADMIN'] as const

export function registerConfiguracaoIpc() {
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
