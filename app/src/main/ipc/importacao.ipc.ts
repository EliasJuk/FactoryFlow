import { ipcMain } from 'electron'

import { requireSession } from '../auth/requireSession'
import { ImportacaoService } from '../services/ImportacaoService'
import type { TipoImportacao } from '../services/importacao/importacao.types'

const service = new ImportacaoService()

const PERFIS_IMPORTACAO = ['QUALIDADE', 'ADMIN'] as const

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
  ipcMain.handle('importacao:baixar-modelo', (event, tipo: unknown) => {
    requireSession(event, {
      perfis: PERFIS_IMPORTACAO
    })

    return service.baixarModelo(validarTipoImportacao(tipo))
  })

  ipcMain.handle('importacao:pre-visualizar', (event, tipo: unknown) => {
    requireSession(event, {
      perfis: PERFIS_IMPORTACAO
    })

    return service.preVisualizar(validarTipoImportacao(tipo))
  })

  ipcMain.handle(
    'importacao:importar-registros',
    (event, tipo: unknown, registros: Record<string, string>[]) => {
      const sessao = requireSession(event, {
        perfis: PERFIS_IMPORTACAO
      })

      return service.importarRegistros(validarTipoImportacao(tipo), registros, sessao.usuarioId)
    }
  )

  ipcMain.handle('importacao:importar', (event, tipo: unknown) => {
    const sessao = requireSession(event, {
      perfis: PERFIS_IMPORTACAO
    })

    return service.importar(validarTipoImportacao(tipo), sessao.usuarioId)
  })
}
