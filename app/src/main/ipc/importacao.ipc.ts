import { ipcMain } from 'electron'

import { ImportacaoService } from '../services/ImportacaoService'
import type { TipoImportacao } from '../services/importacao/importacao.types'

const service = new ImportacaoService()

const TIPOS_IMPORTACAO: ReadonlySet<TipoImportacao> = new Set([
  'setores',
  'subsetores',
  'postos',
  'componentes',
  'circuitos',
  'defeitos',
  'usuarios',
  'circuitoComponentes',
  'roteiros',
  'postoDefeitos',
  'refugosHistoricos'
])

function validarTipoImportacao(tipo: unknown): TipoImportacao {
  if (typeof tipo === 'string' && TIPOS_IMPORTACAO.has(tipo as TipoImportacao)) {
    return tipo as TipoImportacao
  }

  throw new Error('Tipo de importação inválido.')
}

export function registerImportacaoIpc() {
  ipcMain.handle('importacao:baixar-modelo', (_, tipo: unknown) => {
    return service.baixarModelo(validarTipoImportacao(tipo))
  })

  ipcMain.handle('importacao:pre-visualizar', (_, tipo: unknown) => {
    return service.preVisualizar(validarTipoImportacao(tipo))
  })

  ipcMain.handle(
    'importacao:importar-registros',
    (_, tipo: unknown, registros: Record<string, string>[], usuarioId?: number | null) => {
      return service.importarRegistros(validarTipoImportacao(tipo), registros, usuarioId)
    }
  )

  ipcMain.handle('importacao:importar', (_, tipo: unknown, usuarioId?: number | null) => {
    return service.importar(validarTipoImportacao(tipo), usuarioId)
  })
}
