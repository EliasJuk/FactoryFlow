import { RepositoryFactory } from '../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo } from './importacao.csv'
import type { AlteracaoCampoImportacao, RegistroCsv, RegistroPreview } from './importacao.types'

export type ResultadoValidacaoEstrutural = {
  valido: boolean
  erros: string[]
}

export function validarColunasObrigatorias(
  registros: RegistroCsv[],
  colunasObrigatorias: string[]
): ResultadoValidacaoEstrutural {
  if (registros.length === 0) {
    return {
      valido: false,
      erros: ['O arquivo não possui registros para análise.']
    }
  }

  const colunasEncontradas = new Set(
    Object.keys(registros[0]).filter((coluna) => coluna !== '__linha')
  )

  const ausentes = colunasObrigatorias.filter((coluna) => !colunasEncontradas.has(coluna))

  return {
    valido: ausentes.length === 0,
    erros: ausentes.map((coluna) => `Coluna obrigatória ausente: ${coluna}.`)
  }
}

function normalizarComparacao(valor: unknown) {
  return normalizar(valor).toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ')
}

export async function analisarSetores(registros: RegistroCsv[]): Promise<RegistroPreview[]> {
  const repository = RepositoryFactory.setores()

  const [ativos, inativos] = await Promise.all([repository.listar(), repository.listarInativos()])

  const setoresPorSigla = new Map(
    [...ativos, ...inativos].map((setor) => [normalizarCodigo(setor.sigla), setor])
  )

  const ocorrenciasPorSigla = new Map<string, number>()

  for (const registro of registros) {
    const sigla = normalizarCodigo(registro.sigla)

    if (sigla) {
      ocorrenciasPorSigla.set(sigla, (ocorrenciasPorSigla.get(sigla) ?? 0) + 1)
    }
  }

  return registros.map((registro, index) => {
    const linha = Number(registro.__linha ?? index + 2)
    const nome = normalizar(registro.nome)
    const sigla = normalizarCodigo(registro.sigla)
    const mensagens: string[] = []
    const alteracoes: AlteracaoCampoImportacao[] = []

    if (!nome) {
      mensagens.push('O nome do setor é obrigatório.')
    }

    if (!sigla) {
      mensagens.push('A sigla do setor é obrigatória.')
    }

    if (sigla && (ocorrenciasPorSigla.get(sigla) ?? 0) > 1) {
      mensagens.push(`A sigla ${sigla} aparece mais de uma vez neste arquivo.`)
    }

    if (mensagens.length > 0) {
      return {
        id: index + 1,
        linha,
        selecionado: false,
        dados: {
          ...registro,
          nome,
          sigla
        },
        status: 'ERRO' as const,
        resumo: 'A linha possui erros e não poderá ser importada.',
        mensagens,
        alteracoes
      }
    }

    const existente = setoresPorSigla.get(sigla)

    if (!existente) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados: {
          ...registro,
          nome,
          sigla
        },
        status: 'NOVO' as const,
        resumo: `O setor ${nome} (${sigla}) será criado.`,
        mensagens,
        alteracoes
      }
    }

    const nomeAlterado = normalizarComparacao(existente.nome) !== normalizarComparacao(nome)

    if (nomeAlterado) {
      alteracoes.push({
        campo: 'Nome',
        valorAtual: existente.nome,
        novoValor: nome
      })
    }

    if (!existente.ativo) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados: {
          ...registro,
          nome,
          sigla
        },
        status: 'RESTAURAR' as const,
        resumo: nomeAlterado
          ? 'O setor será restaurado e seu nome será atualizado.'
          : 'O setor existe, mas está inativo e será restaurado.',
        mensagens,
        alteracoes,
        registroExistenteId: existente.id
      }
    }

    if (nomeAlterado) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados: {
          ...registro,
          nome,
          sigla
        },
        status: 'ATUALIZAR' as const,
        resumo: 'O setor já existe e terá alterações.',
        mensagens,
        alteracoes,
        registroExistenteId: existente.id
      }
    }

    return {
      id: index + 1,
      linha,
      selecionado: false,
      dados: {
        ...registro,
        nome,
        sigla
      },
      status: 'SEM_ALTERACAO' as const,
      resumo: 'O setor já existe com os mesmos dados.',
      mensagens,
      alteracoes,
      registroExistenteId: existente.id
    }
  })
}
