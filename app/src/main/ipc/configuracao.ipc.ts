import { ipcMain } from 'electron'

import { type ConfiguracaoBanco, ConfiguracaoService } from '../services/ConfiguracaoService'

const service = new ConfiguracaoService()

export function registerConfiguracaoIpc() {
  ipcMain.handle('configuracao:banco-carregar', () => {
    return service.carregarBanco()
  })

  ipcMain.handle('configuracao:banco-salvar', (_, config: ConfiguracaoBanco) => {
    return service.salvarBanco(config)
  })

  ipcMain.handle('configuracao:postgres-testar', (_, config: ConfiguracaoBanco['postgres']) => {
    return service.testarPostgres(config)
  })
}
