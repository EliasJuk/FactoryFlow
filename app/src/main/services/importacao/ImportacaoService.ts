import { dialog } from 'electron'
import { writeFileSync } from 'fs'

import { lerCsv } from './importacao.csv'
import {
  analisarCircuitoComponentes,
  analisarCircuitos,
  analisarComponentes,
  analisarDefeitos,
  analisarPostoDefeitos,
  analisarPostos,
  analisarSetores,
  analisarSubsetores,
  validarColunasObrigatorias
} from './importacao.validation'
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
import { importarPostoDefeitos } from './importadores/importarPostoDefeitos'

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
`,

  postoDefeitos: `setor_sigla,subsetor_nome,posto_nome,defeito_codigo
SA,Área de Montagem,Posto 01,D001
SA,Área de Montagem,Posto 01,D002
`
}

async function executarImportacao(
  tipo: TipoImportacao,
  registros: RegistroCsv[],
  usuarioId?: number | null
): Promise<ResumoImportacao> {
  switch (tipo) {
    case 'setores':
      return importarSetores(registros)

    case 'subsetores':
      return importarSubsetores(registros)

    case 'postos':
      return importarPostos(registros, usuarioId)

    case 'componentes':
      return importarComponentes(registros, usuarioId)

    case 'circuitos':
      return importarCircuitos(registros, usuarioId)

    case 'defeitos':
      return importarDefeitos(registros, usuarioId)

    case 'usuarios':
      return importarUsuarios(registros)

    case 'circuitoComponentes':
      return importarCircuitoComponentes(registros, usuarioId)

    case 'roteiros':
      return importarRoteiros(registros)

    case 'postoDefeitos':
      return importarPostoDefeitos(registros, usuarioId)

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

  async importar(tipo: TipoImportacao, usuarioId?: number | null): Promise<ResultadoImportacao> {
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
    const resumo = await executarImportacao(tipo, registros, usuarioId)

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
          registros: [] as RegistroPreview[],
          avisos: []
        }
      }

      const registrosAnalisados = await analisarSetores(registros)

      return {
        sucesso: true,
        mensagem: 'Arquivo analisado com sucesso.',
        registros: registrosAnalisados,
        avisos: []
      }
    }

    if (tipo === 'subsetores') {
      const estrutura = validarColunasObrigatorias(registros, ['setor_sigla', 'nome'])

      if (!estrutura.valido) {
        return {
          sucesso: false,
          mensagem: estrutura.erros.join(' '),
          registros: [] as RegistroPreview[],
          avisos: []
        }
      }

      const analise = await analisarSubsetores(registros)

      return {
        sucesso: true,
        mensagem: 'Arquivo analisado com sucesso.',
        registros: analise.registros,
        avisos: analise.avisos
      }
    }

    if (tipo === 'postos') {
      const estrutura = validarColunasObrigatorias(registros, [
        'setor_sigla',
        'subsetor_nome',
        'nome'
      ])

      if (!estrutura.valido) {
        return {
          sucesso: false,
          mensagem: estrutura.erros.join(' '),
          registros: [] as RegistroPreview[],
          avisos: []
        }
      }

      const analise = await analisarPostos(registros)

      return {
        sucesso: true,
        mensagem: 'Arquivo analisado com sucesso.',
        registros: analise.registros,
        avisos: analise.avisos
      }
    }

    if (tipo === 'componentes') {
      const estrutura = validarColunasObrigatorias(registros, ['codigo', 'nome', 'preco'])

      if (!estrutura.valido) {
        return {
          sucesso: false,
          mensagem: estrutura.erros.join(' '),
          registros: [] as RegistroPreview[],
          avisos: []
        }
      }

      const registrosAnalisados = await analisarComponentes(registros)

      return {
        sucesso: true,
        mensagem: 'Arquivo analisado com sucesso.',
        registros: registrosAnalisados,
        avisos: []
      }
    }

    if (tipo === 'circuitos') {
      const estrutura = validarColunasObrigatorias(registros, ['codigo', 'nome'])

      if (!estrutura.valido) {
        return {
          sucesso: false,
          mensagem: estrutura.erros.join(' '),
          registros: [] as RegistroPreview[],
          avisos: []
        }
      }

      const registrosAnalisados = await analisarCircuitos(registros)

      return {
        sucesso: true,
        mensagem: 'Arquivo analisado com sucesso.',
        registros: registrosAnalisados,
        avisos: []
      }
    }

    if (tipo === 'circuitoComponentes') {
      const estrutura = validarColunasObrigatorias(registros, [
        'circuito_codigo',
        'componente_codigo',
        'quantidade'
      ])

      if (!estrutura.valido) {
        return {
          sucesso: false,
          mensagem: estrutura.erros.join(' '),
          registros: [] as RegistroPreview[],
          avisos: []
        }
      }

      const analise = await analisarCircuitoComponentes(registros)

      return {
        sucesso: true,
        mensagem: 'Arquivo analisado com sucesso.',
        registros: analise.registros,
        avisos: analise.avisos
      }
    }

    if (tipo === 'defeitos') {
      const estrutura = validarColunasObrigatorias(registros, ['codigo', 'descricao'])

      if (!estrutura.valido) {
        return {
          sucesso: false,
          mensagem: estrutura.erros.join(' '),
          registros: [] as RegistroPreview[],
          avisos: []
        }
      }

      const registrosAnalisados = await analisarDefeitos(registros)

      return {
        sucesso: true,
        mensagem: 'Arquivo analisado com sucesso.',
        registros: registrosAnalisados,
        avisos: []
      }
    }

    if (tipo === 'postoDefeitos') {
      const estrutura = validarColunasObrigatorias(registros, [
        'setor_sigla',
        'subsetor_nome',
        'posto_nome',
        'defeito_codigo'
      ])

      if (!estrutura.valido) {
        return {
          sucesso: false,
          mensagem: estrutura.erros.join(' '),
          registros: [] as RegistroPreview[],
          avisos: []
        }
      }

      const analise = await analisarPostoDefeitos(registros)

      return {
        sucesso: true,
        mensagem: 'Arquivo analisado com sucesso.',
        registros: analise.registros,
        avisos: analise.avisos
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
      })),
      avisos: []
    }
  }

  async importarRegistros(
    tipo: TipoImportacao,
    registros: RegistroCsv[],
    usuarioId?: number | null
  ): Promise<ResultadoImportacao> {
    const registrosLimpos = registros.map((registro) => {
      const copia = { ...registro }
      delete copia.__linha
      return copia
    })

    const resumo = await executarImportacao(tipo, registrosLimpos, usuarioId)

    return {
      sucesso: true,
      mensagem: 'Importação concluída.',
      ...resumo
    }
  }
}
