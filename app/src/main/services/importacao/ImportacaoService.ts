import { dialog } from 'electron'
import { writeFileSync } from 'fs'

import { lerCsv } from './importacao.csv'
import { analisarSetores, validarColunasObrigatorias } from './importacao.validation'
import type {
  RegistroCsv,
  RegistroPreview,
  ResultadoImportacao,
  ResumoImportacao,
  TipoImportacao
} from './importacao.types'
import { importarSetores } from './importadores/importarSetores'
import { importarSubsetores } from './importadores/importarSubsetores'
import { importarPostos } from './importadores/importarPostos'
import { importarComponentes } from './importadores/importarComponentes'
import { importarCircuitos } from './importadores/importarCircuitos'
import { importarDefeitos } from './importadores/importarDefeitos'
import { importarUsuarios } from './importadores/importarUsuarios'
import { importarCircuitoComponentes } from './importadores/importarCircuitoComponentes'
import { importarRoteiros } from './importadores/importarRoteiros'

const modelos: Record<TipoImportacao, string> = {
  setores: `nome,sigla
Setor A,SA
Setor B,SB
`,

  subsetores: `setor_sigla,nome
SA,Área de Montagem
SA,Área de Preparação
SA,Área de Inspeção
SB,Área de Processo
SB,Área de TESTE
`,

  postos: `setor_sigla,subsetor_nome,nome
SA,Área de Montagem,Posto 01
SA,Área de Montagem,Posto 02
SA,Área de Inspeção,Inspeção Final
SB,Área de Processo,Posto Processo 01
`,

  componentes: `codigo,nome,preco
COMP-0001,Componente A,10.50
COMP-0002,Componente B,25.00
COMP-0003,Componente C,0
`,

  circuitos: `codigo,nome
PROD-0001,Produto A
PROD-0002,Produto B
`,

  defeitos: `codigo,descricao
D001,Defeito visual
D002,Defeito dimensional
D003,Defeito de montagem
`,

  usuarios: `matricula,nome,perfil,senha
1001,Usuario Admin,ADMIN,1234
1002,Usuario Operador,OPERADOR,1234
1003,Usuario Lider,LIDER,1234
`,

  circuitoComponentes: `circuito_codigo,componente_codigo,quantidade
PROD-0001,COMP-0001,1
PROD-0001,COMP-0002,1
PROD-0002,COMP-0003,1
`,

  roteiros: `circuito_codigo,posto_nome,componente_codigo,quantidade
PROD-0001,Posto 01,COMP-0001,1
PROD-0001,Posto 02,COMP-0002,1
PROD-0002,Posto Processo 01,COMP-0003,1
`
}

async function executarImportacao(
  tipo: TipoImportacao,
  registros: RegistroCsv[]
): Promise<ResumoImportacao> {
  switch (tipo) {
    case 'setores':
      return importarSetores(registros)

    case 'subsetores':
      return importarSubsetores(registros)

    case 'postos':
      return importarPostos(registros)

    case 'componentes':
      return importarComponentes(registros)

    case 'circuitos':
      return importarCircuitos(registros)

    case 'defeitos':
      return importarDefeitos(registros)

    case 'usuarios':
      return importarUsuarios(registros)

    case 'circuitoComponentes':
      return importarCircuitoComponentes(registros)

    case 'roteiros':
      return importarRoteiros(registros)

    default: {
      const tipoInvalido: never = tipo
      throw new Error(`Tipo de importação inválido: ${tipoInvalido}`)
    }
  }
}

export class ImportacaoService {
  async baixarModelo(tipo: TipoImportacao) {
    const modelo = modelos[tipo]

    const resultado = await dialog.showSaveDialog({
      title: 'Salvar modelo CSV',
      defaultPath: `modelo-${tipo}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })

    if (resultado.canceled || !resultado.filePath) {
      return { sucesso: false, mensagem: 'Operação cancelada.' }
    }

    writeFileSync(resultado.filePath, modelo, 'utf8')

    return {
      sucesso: true,
      mensagem: 'Modelo salvo com sucesso.'
    }
  }

  async importar(tipo: TipoImportacao): Promise<ResultadoImportacao> {
    const resultado = await dialog.showOpenDialog({
      title: 'Selecionar arquivo CSV',
      properties: ['openFile'],
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })

    if (resultado.canceled || resultado.filePaths.length === 0) {
      return {
        sucesso: false,
        mensagem: 'Importação cancelada.',
        inseridos: 0,
        atualizados: 0,
        ignorados: 0
      }
    }

    const registros = lerCsv(resultado.filePaths[0])
    const resumo = await executarImportacao(tipo, registros)

    return {
      sucesso: true,
      mensagem: 'Importação concluída.',
      ...resumo
    }
  }

  async preVisualizar(tipo: TipoImportacao) {
    const resultado = await dialog.showOpenDialog({
      title: 'Selecionar arquivo CSV',
      properties: ['openFile'],
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })

    if (resultado.canceled || resultado.filePaths.length === 0) {
      return {
        sucesso: false,
        mensagem: 'Operação cancelada.',
        registros: [] as RegistroPreview[]
      }
    }

    const registros = lerCsv(resultado.filePaths[0])

    if (tipo === 'setores') {
      const estrutura = validarColunasObrigatorias(registros, ['nome', 'sigla'])

      if (!estrutura.valido) {
        return {
          sucesso: false,
          mensagem: estrutura.erros.join(' '),
          registros: [] as RegistroPreview[]
        }
      }

      const registrosAnalisados = await analisarSetores(registros)

      return {
        sucesso: true,
        mensagem: 'Arquivo analisado com sucesso.',
        registros: registrosAnalisados
      }
    }

    return {
      sucesso: true,
      mensagem: 'Arquivo carregado com sucesso.',
      registros: registros.map((registro, index) => ({
        id: index + 1,
        linha: Number(registro.__linha ?? index + 2),
        selecionado: true,
        dados: registro,
        status: 'NOVO' as const,
        resumo: 'Registro ainda não possui análise enriquecida.',
        mensagens: [],
        alteracoes: []
      }))
    }
  }

  async importarRegistros(
    tipo: TipoImportacao,
    registros: RegistroCsv[]
  ): Promise<ResultadoImportacao> {
    const registrosLimpos = registros.map((registro) => {
      const copia = { ...registro }
      delete copia.__linha
      return copia
    })

    const resumo = await executarImportacao(tipo, registrosLimpos)

    return {
      sucesso: true,
      mensagem: 'Importação concluída.',
      ...resumo
    }
  }
}
