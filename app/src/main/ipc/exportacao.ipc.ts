import { dialog, ipcMain } from 'electron'
import { writeFileSync } from 'fs'

import { requireSession } from '../auth/requireSession'
import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'

const exportacaoRepository = RepositoryFactory.exportacoes()

const PERFIS_PERMITIDOS = ['ADMIN', 'QUALIDADE', 'TECNICO', 'LIDER', 'SUPERVISOR'] as const

type FiltrosExportacaoRefugos = {
  dataInicio: string
  dataFim: string
}

function dataIsoValida(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false
  }

  const [ano, mes, dia] = valor.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)

  return (
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia
  )
}

function validarFiltros(filtros: unknown): FiltrosExportacaoRefugos {
  if (!filtros || typeof filtros !== 'object') {
    throw new Error('FILTROS_EXPORTACAO_INVALIDOS')
  }

  const { dataInicio, dataFim } = filtros as Record<string, unknown>

  if (!dataIsoValida(dataInicio) || !dataIsoValida(dataFim)) {
    throw new Error('FILTROS_EXPORTACAO_INVALIDOS')
  }

  if (dataInicio > dataFim) {
    throw new Error('PERIODO_EXPORTACAO_INVALIDO')
  }

  return { dataInicio, dataFim }
}

function mensagemErroExportacao(error: unknown): string {
  const codigo = error instanceof Error ? error.message : String(error)

  if (codigo === 'FILTROS_EXPORTACAO_INVALIDOS') {
    return 'Informe uma data inicial e uma data final válidas.'
  }

  if (codigo === 'PERIODO_EXPORTACAO_INVALIDO') {
    return 'A data inicial não pode ser maior que a data final.'
  }

  return 'Não foi possível exportar o arquivo CSV.'
}

export function registerExportacaoIpc() {
  ipcMain.handle('exportacao:refugos-csv', async (event, filtros: unknown) => {
    requireSession(event, { perfis: PERFIS_PERMITIDOS })

    try {
      const filtrosValidados = validarFiltros(filtros)

      const resultado = await dialog.showSaveDialog({
        title: 'Salvar exportação de refugos',
        defaultPath: `exportacao-refugos-${filtrosValidados.dataInicio}-${filtrosValidados.dataFim}.csv`,
        filters: [{ name: 'CSV', extensions: ['csv'] }]
      })

      if (resultado.canceled || !resultado.filePath) {
        return {
          sucesso: false,
          mensagem: 'Exportação cancelada.'
        }
      }

      const csv = await exportacaoRepository.gerarCsvRefugos(filtrosValidados)

      writeFileSync(resultado.filePath, csv, 'utf8')

      return {
        sucesso: true,
        mensagem: 'Arquivo CSV exportado com sucesso.'
      }
    } catch (error) {
      console.error('[EXPORTACAO] Erro ao exportar refugos:', error)

      return {
        sucesso: false,
        mensagem: mensagemErroExportacao(error)
      }
    }
  })
}
