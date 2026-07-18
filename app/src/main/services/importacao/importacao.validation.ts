import { RepositoryFactory } from '../../repositories/factory/RepositoryFactory'
import { normalizar, normalizarCodigo } from './importacao.csv'
import type {
  AlteracaoCampoImportacao,
  AvisoImportacao,
  RegistroCsv,
  RegistroPreview
} from './importacao.types'

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

export type ResultadoAnaliseSubsetores = {
  registros: RegistroPreview[]
  avisos: AvisoImportacao[]
}

export async function analisarSubsetores(
  registros: RegistroCsv[]
): Promise<ResultadoAnaliseSubsetores> {
  const setoresRepository = RepositoryFactory.setores()
  const subsetoresRepository = RepositoryFactory.subsetores()

  const [setoresAtivos, setoresInativos, subsetoresAtivos, subsetoresInativos] = await Promise.all([
    setoresRepository.listar(),
    setoresRepository.listarInativos(),
    subsetoresRepository.listar(),
    subsetoresRepository.listarInativos()
  ])

  const setoresPorSigla = new Map(
    [...setoresAtivos, ...setoresInativos].map((setor) => [normalizarCodigo(setor.sigla), setor])
  )

  const subsetoresPorChave = new Map(
    [...subsetoresAtivos, ...subsetoresInativos].map((subsetor) => [
      `${subsetor.setorId}::${normalizarComparacao(subsetor.nome)}`,
      subsetor
    ])
  )

  const ocorrenciasPorChave = new Map<string, number>()
  const setoresInativosUsados = new Map<string, string>()

  for (const registro of registros) {
    const setorSigla = normalizarCodigo(registro.setor_sigla)
    const nome = normalizar(registro.nome)

    if (!setorSigla || !nome) continue

    const chave = `${setorSigla}::${normalizarComparacao(nome)}`
    ocorrenciasPorChave.set(chave, (ocorrenciasPorChave.get(chave) ?? 0) + 1)
  }

  const registrosAnalisados = registros.map((registro, index) => {
    const linha = Number(registro.__linha ?? index + 2)
    const setorSigla = normalizarCodigo(registro.setor_sigla)
    const nome = normalizar(registro.nome)
    const mensagens: string[] = []
    const alteracoes: AlteracaoCampoImportacao[] = []

    if (!setorSigla) {
      mensagens.push('A sigla do setor é obrigatória.')
    }

    if (!nome) {
      mensagens.push('O nome do subsetor é obrigatório.')
    }

    const chaveArquivo = setorSigla && nome ? `${setorSigla}::${normalizarComparacao(nome)}` : ''

    if (chaveArquivo && (ocorrenciasPorChave.get(chaveArquivo) ?? 0) > 1) {
      mensagens.push(
        `O subsetor ${nome} aparece mais de uma vez para o setor ${setorSigla} neste arquivo.`
      )
    }

    const setor = setorSigla ? setoresPorSigla.get(setorSigla) : undefined

    if (setorSigla && !setor) {
      mensagens.push(`O setor ${setorSigla} não está cadastrado.`)
    }

    if (setor && !setor.ativo) {
      mensagens.push(`O setor ${setor.sigla} está inativo. Reative o setor para continuar.`)
      setoresInativosUsados.set(
        normalizarCodigo(setor.sigla),
        `${setor.nome} (${normalizarCodigo(setor.sigla)})`
      )
    }

    if (mensagens.length > 0) {
      return {
        id: index + 1,
        linha,
        selecionado: false,
        dados: {
          ...registro,
          setor_sigla: setorSigla,
          nome
        },
        status: 'ERRO' as const,
        resumo: 'A linha possui erros e não poderá ser importada.',
        mensagens,
        alteracoes
      }
    }

    const existente = subsetoresPorChave.get(`${setor!.id}::${normalizarComparacao(nome)}`)

    if (!existente) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados: {
          ...registro,
          setor_sigla: setorSigla,
          nome
        },
        status: 'NOVO' as const,
        resumo: `O subsetor ${nome} será criado em ${setor!.nome} (${setorSigla}).`,
        mensagens,
        alteracoes
      }
    }

    if (!existente.ativo) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados: {
          ...registro,
          setor_sigla: setorSigla,
          nome
        },
        status: 'RESTAURAR' as const,
        resumo: `O subsetor ${nome} existe, mas está inativo e será restaurado.`,
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
        setor_sigla: setorSigla,
        nome
      },
      status: 'SEM_ALTERACAO' as const,
      resumo: `O subsetor ${nome} já existe em ${setor!.nome}.`,
      mensagens,
      alteracoes,
      registroExistenteId: existente.id
    }
  })

  const itens = [...setoresInativosUsados.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'))

  const avisos: AvisoImportacao[] =
    itens.length > 0
      ? [
          {
            tipo: 'DEPENDENCIA_INATIVA',
            titulo: 'Há setores inativos necessários para esta importação',
            mensagem:
              'Reative os setores abaixo no cadastro de setores e analise o arquivo novamente:',
            itens
          }
        ]
      : []

  return {
    registros: registrosAnalisados,
    avisos
  }
}

export type ResultadoAnalisePostos = {
  registros: RegistroPreview[]
  avisos: AvisoImportacao[]
}

export async function analisarPostos(registros: RegistroCsv[]): Promise<ResultadoAnalisePostos> {
  const setoresRepository = RepositoryFactory.setores()
  const subsetoresRepository = RepositoryFactory.subsetores()
  const postosRepository = RepositoryFactory.postos()

  const [
    setoresAtivos,
    setoresInativos,
    subsetoresAtivos,
    subsetoresInativos,
    postosAtivos,
    postosInativos
  ] = await Promise.all([
    setoresRepository.listar(),
    setoresRepository.listarInativos(),
    subsetoresRepository.listar(),
    subsetoresRepository.listarInativos(),
    postosRepository.listar(),
    postosRepository.listarInativos()
  ])

  const setoresPorSigla = new Map(
    [...setoresAtivos, ...setoresInativos].map((setor) => [normalizarCodigo(setor.sigla), setor])
  )

  const subsetoresPorChave = new Map(
    [...subsetoresAtivos, ...subsetoresInativos].map((subsetor) => [
      `${subsetor.setorId}::${normalizarComparacao(subsetor.nome)}`,
      subsetor
    ])
  )

  const postosPorChave = new Map(
    [...postosAtivos, ...postosInativos].map((posto) => [
      `${posto.subsetorId}::${normalizarComparacao(posto.nome)}`,
      posto
    ])
  )

  const ocorrenciasPorChave = new Map<string, number>()
  const dependenciasInativas = new Map<string, string>()

  for (const registro of registros) {
    const setorSigla = normalizarCodigo(registro.setor_sigla)
    const subsetorNome = normalizar(registro.subsetor_nome)
    const nome = normalizar(registro.nome)

    if (!setorSigla || !subsetorNome || !nome) continue

    const chave = [setorSigla, normalizarComparacao(subsetorNome), normalizarComparacao(nome)].join(
      '::'
    )

    ocorrenciasPorChave.set(chave, (ocorrenciasPorChave.get(chave) ?? 0) + 1)
  }

  const registrosAnalisados = registros.map((registro, index) => {
    const linha = Number(registro.__linha ?? index + 2)
    const setorSigla = normalizarCodigo(registro.setor_sigla)
    const subsetorNome = normalizar(registro.subsetor_nome)
    const nome = normalizar(registro.nome)
    const mensagens: string[] = []
    const alteracoes: AlteracaoCampoImportacao[] = []

    if (!setorSigla) {
      mensagens.push('A sigla do setor é obrigatória.')
    }

    if (!subsetorNome) {
      mensagens.push('O nome do subsetor é obrigatório.')
    }

    if (!nome) {
      mensagens.push('O nome do posto é obrigatório.')
    }

    const chaveArquivo =
      setorSigla && subsetorNome && nome
        ? [setorSigla, normalizarComparacao(subsetorNome), normalizarComparacao(nome)].join('::')
        : ''

    if (chaveArquivo && (ocorrenciasPorChave.get(chaveArquivo) ?? 0) > 1) {
      mensagens.push(
        `O posto ${nome} aparece mais de uma vez no subsetor ${subsetorNome} do setor ${setorSigla}.`
      )
    }

    const setor = setorSigla ? setoresPorSigla.get(setorSigla) : undefined

    if (setorSigla && !setor) {
      mensagens.push(`O setor ${setorSigla} não está cadastrado.`)
    }

    if (setor && !setor.ativo) {
      mensagens.push(`O setor ${setor.sigla} está inativo. Reative o setor para continuar.`)
      dependenciasInativas.set(
        `setor-${setor.id}`,
        `Setor: ${setor.nome} (${normalizarCodigo(setor.sigla)})`
      )
    }

    const subsetor =
      setor && subsetorNome
        ? subsetoresPorChave.get(`${setor.id}::${normalizarComparacao(subsetorNome)}`)
        : undefined

    if (setor && subsetorNome && !subsetor) {
      mensagens.push(`O subsetor ${subsetorNome} não está cadastrado no setor ${setorSigla}.`)
    }

    if (subsetor && !subsetor.ativo) {
      mensagens.push(`O subsetor ${subsetor.nome} está inativo. Reative o subsetor para continuar.`)
      dependenciasInativas.set(
        `subsetor-${subsetor.id}`,
        `Subsetor: ${subsetor.nome} — setor ${setorSigla}`
      )
    }

    const dados = {
      ...registro,
      setor_sigla: setorSigla,
      subsetor_nome: subsetorNome,
      nome
    }

    if (mensagens.length > 0 || !setor || !subsetor) {
      return {
        id: index + 1,
        linha,
        selecionado: false,
        dados,
        status: 'ERRO' as const,
        resumo: 'A linha possui erros e não poderá ser importada.',
        mensagens,
        alteracoes
      }
    }

    const existente = postosPorChave.get(`${subsetor.id}::${normalizarComparacao(nome)}`)

    if (!existente) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'NOVO' as const,
        resumo: `O posto ${nome} será criado em ${setor.nome} / ${subsetor.nome}.`,
        mensagens,
        alteracoes
      }
    }

    if (!existente.ativo) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'RESTAURAR' as const,
        resumo: `O posto ${nome} existe, mas está inativo e será restaurado.`,
        mensagens,
        alteracoes,
        registroExistenteId: existente.id
      }
    }

    return {
      id: index + 1,
      linha,
      selecionado: false,
      dados,
      status: 'SEM_ALTERACAO' as const,
      resumo: `O posto ${nome} já existe em ${setor.nome} / ${subsetor.nome}.`,
      mensagens,
      alteracoes,
      registroExistenteId: existente.id
    }
  })

  const itens = [...dependenciasInativas.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'))

  const avisos: AvisoImportacao[] =
    itens.length > 0
      ? [
          {
            tipo: 'DEPENDENCIA_INATIVA',
            titulo: 'Há dependências inativas necessárias para importar os postos',
            mensagem: 'Reative os setores e subsetores abaixo e analise o arquivo novamente:',
            itens
          }
        ]
      : []

  return {
    registros: registrosAnalisados,
    avisos
  }
}

export async function analisarDefeitos(registros: RegistroCsv[]): Promise<RegistroPreview[]> {
  const repository = RepositoryFactory.defeitos()

  const [ativos, inativos] = await Promise.all([repository.listar(), repository.listarInativos()])

  const defeitosPorCodigo = new Map(
    [...ativos, ...inativos].map((defeito) => [normalizarCodigo(defeito.codigo), defeito])
  )

  const ocorrenciasPorCodigo = new Map<string, number>()

  for (const registro of registros) {
    const codigo = normalizarCodigo(registro.codigo)

    if (codigo) {
      ocorrenciasPorCodigo.set(codigo, (ocorrenciasPorCodigo.get(codigo) ?? 0) + 1)
    }
  }

  return registros.map((registro, index) => {
    const linha = Number(registro.__linha ?? index + 2)
    const codigo = normalizarCodigo(registro.codigo)
    const descricao = normalizar(registro.descricao)
    const mensagens: string[] = []
    const alteracoes: AlteracaoCampoImportacao[] = []

    if (!codigo) {
      mensagens.push('O código do defeito é obrigatório.')
    }

    if (!descricao) {
      mensagens.push('A descrição do defeito é obrigatória.')
    }

    if (codigo && (ocorrenciasPorCodigo.get(codigo) ?? 0) > 1) {
      mensagens.push(`O código ${codigo} aparece mais de uma vez neste arquivo.`)
    }

    const dados = {
      ...registro,
      codigo,
      descricao
    }

    if (mensagens.length > 0) {
      return {
        id: index + 1,
        linha,
        selecionado: false,
        dados,
        status: 'ERRO' as const,
        resumo: 'A linha possui erros e não poderá ser importada.',
        mensagens,
        alteracoes
      }
    }

    const existente = defeitosPorCodigo.get(codigo)

    if (!existente) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'NOVO' as const,
        resumo: `O defeito ${codigo} será criado.`,
        mensagens,
        alteracoes
      }
    }

    const descricaoAlterada =
      normalizarComparacao(existente.descricao) !== normalizarComparacao(descricao)

    if (descricaoAlterada) {
      alteracoes.push({
        campo: 'Descrição',
        valorAtual: existente.descricao,
        novoValor: descricao
      })
    }

    if (!existente.ativo) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'RESTAURAR' as const,
        resumo: descricaoAlterada
          ? `O defeito ${codigo} será restaurado e sua descrição será atualizada.`
          : `O defeito ${codigo} existe, mas está inativo e será restaurado.`,
        mensagens,
        alteracoes,
        registroExistenteId: existente.id
      }
    }

    if (descricaoAlterada) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'ATUALIZAR' as const,
        resumo: `O defeito ${codigo} já existe e terá sua descrição atualizada.`,
        mensagens,
        alteracoes,
        registroExistenteId: existente.id
      }
    }

    return {
      id: index + 1,
      linha,
      selecionado: false,
      dados,
      status: 'SEM_ALTERACAO' as const,
      resumo: `O defeito ${codigo} já existe com os mesmos dados.`,
      mensagens,
      alteracoes,
      registroExistenteId: existente.id
    }
  })
}

export type ResultadoAnalisePostoDefeitos = {
  registros: RegistroPreview[]
  avisos: AvisoImportacao[]
}

export async function analisarPostoDefeitos(
  registros: RegistroCsv[]
): Promise<ResultadoAnalisePostoDefeitos> {
  const setoresRepository = RepositoryFactory.setores()
  const subsetoresRepository = RepositoryFactory.subsetores()
  const postosRepository = RepositoryFactory.postos()
  const defeitosRepository = RepositoryFactory.defeitos()
  const postoDefeitosRepository = RepositoryFactory.postoDefeitos()

  const [
    setoresAtivos,
    setoresInativos,
    subsetoresAtivos,
    subsetoresInativos,
    postosAtivos,
    postosInativos,
    defeitosAtivos,
    defeitosInativos
  ] = await Promise.all([
    setoresRepository.listar(),
    setoresRepository.listarInativos(),
    subsetoresRepository.listar(),
    subsetoresRepository.listarInativos(),
    postosRepository.listar(),
    postosRepository.listarInativos(),
    defeitosRepository.listar(),
    defeitosRepository.listarInativos()
  ])

  const setoresPorSigla = new Map(
    [...setoresAtivos, ...setoresInativos].map((setor) => [normalizarCodigo(setor.sigla), setor])
  )
  const subsetoresPorChave = new Map(
    [...subsetoresAtivos, ...subsetoresInativos].map((subsetor) => [
      `${subsetor.setorId}::${normalizarComparacao(subsetor.nome)}`,
      subsetor
    ])
  )
  const postosPorChave = new Map(
    [...postosAtivos, ...postosInativos].map((posto) => [
      `${posto.subsetorId}::${normalizarComparacao(posto.nome)}`,
      posto
    ])
  )
  const defeitosPorCodigo = new Map(
    [...defeitosAtivos, ...defeitosInativos].map((defeito) => [
      normalizarCodigo(defeito.codigo),
      defeito
    ])
  )

  const ocorrencias = new Map<string, number>()
  for (const registro of registros) {
    const chave = [
      normalizarCodigo(registro.setor_sigla),
      normalizarComparacao(registro.subsetor_nome),
      normalizarComparacao(registro.posto_nome),
      normalizarCodigo(registro.defeito_codigo)
    ].join('::')

    if (!chave.includes('::::')) {
      ocorrencias.set(chave, (ocorrencias.get(chave) ?? 0) + 1)
    }
  }

  const dependenciasInativas = new Map<string, string>()
  const vinculosPorPosto = new Map<
    number,
    Awaited<ReturnType<typeof postoDefeitosRepository.listarPorPosto>>
  >()

  const registrosAnalisados: RegistroPreview[] = []

  for (let index = 0; index < registros.length; index++) {
    const registro = registros[index]
    const linha = Number(registro.__linha ?? index + 2)
    const setorSigla = normalizarCodigo(registro.setor_sigla)
    const subsetorNome = normalizar(registro.subsetor_nome)
    const postoNome = normalizar(registro.posto_nome)
    const defeitoCodigo = normalizarCodigo(registro.defeito_codigo)
    const mensagens: string[] = []
    const alteracoes: AlteracaoCampoImportacao[] = []

    if (!setorSigla) mensagens.push('A sigla do setor é obrigatória.')
    if (!subsetorNome) mensagens.push('O nome do subsetor é obrigatório.')
    if (!postoNome) mensagens.push('O nome do posto é obrigatório.')
    if (!defeitoCodigo) mensagens.push('O código do defeito é obrigatório.')

    const chaveArquivo = [
      setorSigla,
      normalizarComparacao(subsetorNome),
      normalizarComparacao(postoNome),
      defeitoCodigo
    ].join('::')

    if (
      setorSigla &&
      subsetorNome &&
      postoNome &&
      defeitoCodigo &&
      (ocorrencias.get(chaveArquivo) ?? 0) > 1
    ) {
      mensagens.push('Este vínculo aparece mais de uma vez no arquivo.')
    }

    const setor = setorSigla ? setoresPorSigla.get(setorSigla) : undefined
    if (setorSigla && !setor) mensagens.push(`O setor ${setorSigla} não está cadastrado.`)
    if (setor && !setor.ativo) {
      mensagens.push(`O setor ${setor.sigla} está inativo.`)
      dependenciasInativas.set(`setor-${setor.id}`, `Setor: ${setor.nome} (${setor.sigla})`)
    }

    const subsetor = setor
      ? subsetoresPorChave.get(`${setor.id}::${normalizarComparacao(subsetorNome)}`)
      : undefined
    if (setor && subsetorNome && !subsetor) {
      mensagens.push(`O subsetor ${subsetorNome} não está cadastrado no setor ${setorSigla}.`)
    }
    if (subsetor && !subsetor.ativo) {
      mensagens.push(`O subsetor ${subsetor.nome} está inativo.`)
      dependenciasInativas.set(
        `subsetor-${subsetor.id}`,
        `Subsetor: ${subsetor.nome} — setor ${setorSigla}`
      )
    }

    const posto = subsetor
      ? postosPorChave.get(`${subsetor.id}::${normalizarComparacao(postoNome)}`)
      : undefined
    if (subsetor && postoNome && !posto) {
      mensagens.push(`O posto ${postoNome} não está cadastrado no subsetor ${subsetorNome}.`)
    }
    if (posto && !posto.ativo) {
      mensagens.push(`O posto ${posto.nome} está inativo.`)
      dependenciasInativas.set(
        `posto-${posto.id}`,
        `Posto: ${posto.nome} — ${setorSigla} / ${subsetorNome}`
      )
    }

    const defeito = defeitoCodigo ? defeitosPorCodigo.get(defeitoCodigo) : undefined
    if (defeitoCodigo && !defeito) {
      mensagens.push(`O defeito ${defeitoCodigo} não está cadastrado.`)
    }
    if (defeito && !defeito.ativo) {
      mensagens.push(`O defeito ${defeito.codigo} está inativo.`)
      dependenciasInativas.set(
        `defeito-${defeito.id}`,
        `Defeito: ${defeito.codigo} — ${defeito.descricao}`
      )
    }

    const dados = {
      ...registro,
      setor_sigla: setorSigla,
      subsetor_nome: subsetorNome,
      posto_nome: postoNome,
      defeito_codigo: defeitoCodigo
    }

    if (mensagens.length > 0 || !posto || !defeito) {
      registrosAnalisados.push({
        id: index + 1,
        linha,
        selecionado: false,
        dados,
        status: 'ERRO',
        resumo: 'A linha possui erros e não poderá ser importada.',
        mensagens,
        alteracoes
      })
      continue
    }

    let vinculos = vinculosPorPosto.get(posto.id)
    if (!vinculos) {
      vinculos = await postoDefeitosRepository.listarPorPosto(posto.id, true)
      vinculosPorPosto.set(posto.id, vinculos)
    }

    const existente = vinculos.find((vinculo) => vinculo.defeitoId === defeito.id)

    if (!existente) {
      registrosAnalisados.push({
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'NOVO',
        resumo: `O defeito ${defeito.codigo} será vinculado ao posto ${posto.nome}.`,
        mensagens,
        alteracoes
      })
      continue
    }

    if (!existente.ativo) {
      registrosAnalisados.push({
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'RESTAURAR',
        resumo: `O vínculo entre ${posto.nome} e ${defeito.codigo} será restaurado.`,
        mensagens,
        alteracoes,
        registroExistenteId: existente.id
      })
      continue
    }

    registrosAnalisados.push({
      id: index + 1,
      linha,
      selecionado: false,
      dados,
      status: 'SEM_ALTERACAO',
      resumo: `O defeito ${defeito.codigo} já está vinculado ao posto ${posto.nome}.`,
      mensagens,
      alteracoes,
      registroExistenteId: existente.id
    })
  }

  const itens = [...dependenciasInativas.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const avisos: AvisoImportacao[] =
    itens.length > 0
      ? [
          {
            tipo: 'DEPENDENCIA_INATIVA',
            titulo: 'Há dependências inativas necessárias para esta importação',
            mensagem:
              'Reative os cadastros abaixo e analise novamente o arquivo antes de importar:',
            itens
          }
        ]
      : []

  return { registros: registrosAnalisados, avisos }
}
