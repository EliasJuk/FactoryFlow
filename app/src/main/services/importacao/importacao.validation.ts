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

function analisarPrecoImportacao(valor: unknown): { valido: boolean; valor: number } {
  const original = normalizar(valor)
  if (!original) return { valido: false, valor: 0 }

  const texto = original.replace(/\s+/g, '')
  let normalizado = texto

  if (texto.includes(',') && texto.includes('.')) {
    normalizado =
      texto.lastIndexOf(',') > texto.lastIndexOf('.')
        ? texto.replace(/\./g, '').replace(',', '.')
        : texto.replace(/,/g, '')
  } else if (texto.includes(',')) {
    normalizado = texto.replace(',', '.')
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalizado)) {
    return { valido: false, valor: 0 }
  }

  const preco = Number(normalizado)
  return Number.isFinite(preco) && preco >= 0
    ? { valido: true, valor: preco }
    : { valido: false, valor: 0 }
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

export async function analisarComponentes(registros: RegistroCsv[]): Promise<RegistroPreview[]> {
  const repository = RepositoryFactory.componentes()
  const [ativos, inativos] = await Promise.all([repository.listar(), repository.listarInativos()])

  const porCodigo = new Map(
    [...ativos, ...inativos].map((item) => [normalizarCodigo(item.codigo), item])
  )

  const ocorrencias = new Map<string, number>()
  for (const registro of registros) {
    const codigo = normalizarCodigo(registro.codigo)
    if (codigo) ocorrencias.set(codigo, (ocorrencias.get(codigo) ?? 0) + 1)
  }

  return registros.map((registro, index) => {
    const linha = Number(registro.__linha ?? index + 2)
    const codigo = normalizarCodigo(registro.codigo)
    const nome = normalizar(registro.nome)
    const precoAnalisado = analisarPrecoImportacao(registro.preco ?? registro.preco_atual)
    const mensagens: string[] = []
    const alteracoes: AlteracaoCampoImportacao[] = []

    if (!codigo) mensagens.push('O código do componente é obrigatório.')
    if (!nome) mensagens.push('O nome do componente é obrigatório.')

    const precoOriginal = normalizar(registro.preco ?? registro.preco_atual)
    if (!precoOriginal) {
      mensagens.push('O preço do componente é obrigatório.')
    } else if (!precoAnalisado.valido) {
      mensagens.push('O preço deve ser um número válido maior ou igual a zero.')
    }

    if (codigo && (ocorrencias.get(codigo) ?? 0) > 1) {
      mensagens.push(`O código ${codigo} aparece mais de uma vez neste arquivo.`)
    }

    const preco = precoAnalisado.valor
    const dados = { ...registro, codigo, nome, preco: String(preco) }

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

    const existente = porCodigo.get(codigo)
    if (!existente) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'NOVO' as const,
        resumo: `O componente ${codigo} será criado.`,
        mensagens,
        alteracoes
      }
    }

    const nomeAlterado = normalizarComparacao(existente.nome) !== normalizarComparacao(nome)
    const precoAlterado = Math.abs(Number(existente.precoAtual) - preco) > 0.0001

    if (nomeAlterado) {
      alteracoes.push({
        campo: 'Nome',
        valorAtual: existente.nome,
        novoValor: nome
      })
    }

    if (precoAlterado) {
      alteracoes.push({
        campo: 'Preço',
        valorAtual: Number(existente.precoAtual).toFixed(2),
        novoValor: preco.toFixed(2)
      })
    }

    if (!existente.ativo) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'RESTAURAR' as const,
        resumo:
          nomeAlterado || precoAlterado
            ? `O componente ${codigo} será restaurado e atualizado.`
            : `O componente ${codigo} existe, mas está inativo e será restaurado.`,
        mensagens,
        alteracoes,
        registroExistenteId: existente.id
      }
    }

    if (nomeAlterado || precoAlterado) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'ATUALIZAR' as const,
        resumo: `O componente ${codigo} já existe e terá alterações.`,
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
      resumo: `O componente ${codigo} já existe com os mesmos dados.`,
      mensagens,
      alteracoes,
      registroExistenteId: existente.id
    }
  })
}

export async function analisarCircuitos(registros: RegistroCsv[]): Promise<RegistroPreview[]> {
  const repository = RepositoryFactory.circuitos()
  const [ativos, inativos] = await Promise.all([repository.listar(), repository.listarInativos()])

  const porCodigo = new Map(
    [...ativos, ...inativos].map((item) => [normalizarCodigo(item.codigo), item])
  )

  const ocorrencias = new Map<string, number>()
  for (const registro of registros) {
    const codigo = normalizarCodigo(registro.codigo)
    if (codigo) ocorrencias.set(codigo, (ocorrencias.get(codigo) ?? 0) + 1)
  }

  return registros.map((registro, index) => {
    const linha = Number(registro.__linha ?? index + 2)
    const codigo = normalizarCodigo(registro.codigo)
    const nome = normalizar(registro.nome)
    const mensagens: string[] = []
    const alteracoes: AlteracaoCampoImportacao[] = []
    const dados = { ...registro, codigo, nome }

    if (!codigo) mensagens.push('O código do circuito é obrigatório.')
    if (!nome) mensagens.push('O nome do circuito é obrigatório.')
    if (codigo && (ocorrencias.get(codigo) ?? 0) > 1) {
      mensagens.push(`O código ${codigo} aparece mais de uma vez neste arquivo.`)
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

    const existente = porCodigo.get(codigo)

    if (!existente) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'NOVO' as const,
        resumo: `O circuito ${codigo} será criado.`,
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
        dados,
        status: 'RESTAURAR' as const,
        resumo: nomeAlterado
          ? `O circuito ${codigo} será restaurado e seu nome será atualizado.`
          : `O circuito ${codigo} existe, mas está inativo e será restaurado.`,
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
        dados,
        status: 'ATUALIZAR' as const,
        resumo: `O circuito ${codigo} já existe e terá seu nome atualizado.`,
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
      resumo: `O circuito ${codigo} já existe com os mesmos dados.`,
      mensagens,
      alteracoes,
      registroExistenteId: existente.id
    }
  })
}

export type ResultadoAnaliseCircuitoComponentes = {
  registros: RegistroPreview[]
  avisos: AvisoImportacao[]
}

export async function analisarCircuitoComponentes(
  registros: RegistroCsv[]
): Promise<ResultadoAnaliseCircuitoComponentes> {
  const circuitosRepository = RepositoryFactory.circuitos()
  const componentesRepository = RepositoryFactory.componentes()
  const vinculosRepository = RepositoryFactory.circuitoComponentes()

  const [circuitosAtivos, circuitosInativos, componentesAtivos, componentesInativos] =
    await Promise.all([
      circuitosRepository.listar(),
      circuitosRepository.listarInativos(),
      componentesRepository.listar(),
      componentesRepository.listarInativos()
    ])

  const circuitosPorCodigo = new Map(
    [...circuitosAtivos, ...circuitosInativos].map((circuito) => [
      normalizarCodigo(circuito.codigo),
      circuito
    ])
  )

  const componentesPorCodigo = new Map(
    [...componentesAtivos, ...componentesInativos].map((componente) => [
      normalizarCodigo(componente.codigo),
      componente
    ])
  )

  const ocorrencias = new Map<string, number>()
  const dependenciasInativas = new Map<string, string>()
  const vinculosPorCircuito = new Map<
    number,
    Awaited<ReturnType<typeof vinculosRepository.listarPorCircuito>>
  >()

  for (const registro of registros) {
    const circuitoCodigo = normalizarCodigo(registro.circuito_codigo)
    const componenteCodigo = normalizarCodigo(registro.componente_codigo)

    if (!circuitoCodigo || !componenteCodigo) continue

    const chave = `${circuitoCodigo}::${componenteCodigo}`
    ocorrencias.set(chave, (ocorrencias.get(chave) ?? 0) + 1)
  }

  const registrosAnalisados: RegistroPreview[] = []

  for (let index = 0; index < registros.length; index++) {
    const registro = registros[index]
    const linha = Number(registro.__linha ?? index + 2)
    const circuitoCodigo = normalizarCodigo(registro.circuito_codigo)
    const componenteCodigo = normalizarCodigo(registro.componente_codigo)
    const quantidadeTexto = normalizar(registro.quantidade)
    const quantidade = Number(quantidadeTexto.replace(',', '.'))
    const mensagens: string[] = []
    const alteracoes: AlteracaoCampoImportacao[] = []

    if (!circuitoCodigo) {
      mensagens.push('O código do circuito é obrigatório.')
    }

    if (!componenteCodigo) {
      mensagens.push('O código do componente é obrigatório.')
    }

    if (!quantidadeTexto) {
      mensagens.push('A quantidade é obrigatória.')
    } else if (!Number.isInteger(quantidade) || quantidade <= 0) {
      mensagens.push('A quantidade deve ser um número inteiro maior que zero.')
    }

    const chaveArquivo =
      circuitoCodigo && componenteCodigo ? `${circuitoCodigo}::${componenteCodigo}` : ''

    if (chaveArquivo && (ocorrencias.get(chaveArquivo) ?? 0) > 1) {
      mensagens.push('Este vínculo aparece mais de uma vez no arquivo.')
    }

    const circuito = circuitoCodigo ? circuitosPorCodigo.get(circuitoCodigo) : undefined

    if (circuitoCodigo && !circuito) {
      mensagens.push(`O circuito ${circuitoCodigo} não está cadastrado.`)
    }

    if (circuito && !circuito.ativo) {
      mensagens.push(`O circuito ${circuito.codigo} está inativo.`)
      dependenciasInativas.set(
        `circuito-${circuito.id}`,
        `Circuito: ${circuito.codigo} — ${circuito.nome}`
      )
    }

    const componente = componenteCodigo ? componentesPorCodigo.get(componenteCodigo) : undefined

    if (componenteCodigo && !componente) {
      mensagens.push(`O componente ${componenteCodigo} não está cadastrado.`)
    }

    if (componente && !componente.ativo) {
      mensagens.push(`O componente ${componente.codigo} está inativo.`)
      dependenciasInativas.set(
        `componente-${componente.id}`,
        `Componente: ${componente.codigo} — ${componente.nome}`
      )
    }

    const dados = {
      ...registro,
      circuito_codigo: circuitoCodigo,
      componente_codigo: componenteCodigo,
      quantidade: Number.isFinite(quantidade) ? String(quantidade) : quantidadeTexto
    }

    if (mensagens.length > 0 || !circuito || !componente) {
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

    let vinculos = vinculosPorCircuito.get(circuito.id)

    if (!vinculos) {
      vinculos = await vinculosRepository.listarPorCircuito(circuito.id, true)
      vinculosPorCircuito.set(circuito.id, vinculos)
    }

    const existente = vinculos.find((vinculo) => vinculo.componenteId === componente.id)

    if (!existente) {
      registrosAnalisados.push({
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'NOVO',
        resumo: `O componente ${componente.codigo} será vinculado ao circuito ${circuito.codigo}.`,
        mensagens,
        alteracoes
      })
      continue
    }

    if (existente.quantidade !== quantidade) {
      alteracoes.push({
        campo: 'Quantidade',
        valorAtual: String(existente.quantidade),
        novoValor: String(quantidade)
      })
    }

    if (!existente.ativo) {
      registrosAnalisados.push({
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'RESTAURAR',
        resumo:
          existente.quantidade !== quantidade
            ? 'O vínculo será restaurado com a nova quantidade.'
            : 'O vínculo existe, mas está inativo e será restaurado.',
        mensagens,
        alteracoes,
        registroExistenteId: existente.id
      })
      continue
    }

    if (existente.quantidade !== quantidade) {
      registrosAnalisados.push({
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'ATUALIZAR',
        resumo: 'O vínculo já existe e terá sua quantidade atualizada.',
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
      resumo: `O componente ${componente.codigo} já está vinculado ao circuito ${circuito.codigo} com a mesma quantidade.`,
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
            mensagem: 'Reative os circuitos e componentes abaixo e analise o arquivo novamente:',
            itens
          }
        ]
      : []

  return {
    registros: registrosAnalisados,
    avisos
  }
}

export type ResultadoAnaliseRoteiros = {
  registros: RegistroPreview[]
  avisos: AvisoImportacao[]
}

export async function analisarRoteiros(
  registros: RegistroCsv[]
): Promise<ResultadoAnaliseRoteiros> {
  const circuitosRepository = RepositoryFactory.circuitos()
  const postosRepository = RepositoryFactory.postos()
  const componentesRepository = RepositoryFactory.componentes()
  const circuitoComponentesRepository = RepositoryFactory.circuitoComponentes()
  const roteirosRepository = RepositoryFactory.roteiros()

  const [
    circuitosAtivos,
    circuitosInativos,
    postosAtivos,
    postosInativos,
    componentesAtivos,
    componentesInativos
  ] = await Promise.all([
    circuitosRepository.listar(),
    circuitosRepository.listarInativos(),
    postosRepository.listar(),
    postosRepository.listarInativos(),
    componentesRepository.listar(),
    componentesRepository.listarInativos()
  ])

  const circuitosPorCodigo = new Map(
    [...circuitosAtivos, ...circuitosInativos].map((circuito) => [
      normalizarCodigo(circuito.codigo),
      circuito
    ])
  )

  const componentesPorCodigo = new Map(
    [...componentesAtivos, ...componentesInativos].map((componente) => [
      normalizarCodigo(componente.codigo),
      componente
    ])
  )

  const postosPorNome = new Map<string, typeof postosAtivos>()

  for (const posto of [...postosAtivos, ...postosInativos]) {
    const chave = normalizarComparacao(posto.nome)
    const lista = postosPorNome.get(chave) ?? []
    lista.push(posto)
    postosPorNome.set(chave, lista)
  }

  const ocorrencias = new Map<string, number>()
  const dependenciasInativas = new Map<string, string>()
  const componentesPorCircuito = new Map<
    number,
    Awaited<ReturnType<typeof circuitoComponentesRepository.listarPorCircuito>>
  >()
  const roteirosPorCircuitoPosto = new Map<
    string,
    Awaited<ReturnType<typeof roteirosRepository.listarPorCircuitoEPosto>>
  >()

  for (const registro of registros) {
    const circuitoCodigo = normalizarCodigo(registro.circuito_codigo)
    const postoNome = normalizarComparacao(registro.posto_nome)
    const componenteCodigo = normalizarCodigo(registro.componente_codigo)

    if (!circuitoCodigo || !postoNome || !componenteCodigo) continue

    const chave = `${circuitoCodigo}::${postoNome}::${componenteCodigo}`
    ocorrencias.set(chave, (ocorrencias.get(chave) ?? 0) + 1)
  }

  const registrosAnalisados: RegistroPreview[] = []

  for (let index = 0; index < registros.length; index++) {
    const registro = registros[index]
    const linha = Number(registro.__linha ?? index + 2)
    const circuitoCodigo = normalizarCodigo(registro.circuito_codigo)
    const postoNome = normalizar(registro.posto_nome)
    const componenteCodigo = normalizarCodigo(registro.componente_codigo)
    const quantidadeTexto = normalizar(registro.quantidade)
    const quantidade = Number(quantidadeTexto.replace(',', '.'))
    const mensagens: string[] = []
    const alteracoes: AlteracaoCampoImportacao[] = []

    if (!circuitoCodigo) mensagens.push('O código do circuito é obrigatório.')
    if (!postoNome) mensagens.push('O nome do posto é obrigatório.')
    if (!componenteCodigo) mensagens.push('O código do componente é obrigatório.')

    if (!quantidadeTexto) {
      mensagens.push('A quantidade é obrigatória.')
    } else if (!Number.isInteger(quantidade) || quantidade <= 0) {
      mensagens.push('A quantidade deve ser um número inteiro maior que zero.')
    }

    const chaveArquivo =
      circuitoCodigo && postoNome && componenteCodigo
        ? `${circuitoCodigo}::${normalizarComparacao(postoNome)}::${componenteCodigo}`
        : ''

    if (chaveArquivo && (ocorrencias.get(chaveArquivo) ?? 0) > 1) {
      mensagens.push('Este item do roteiro aparece mais de uma vez no arquivo.')
    }

    const circuito = circuitoCodigo ? circuitosPorCodigo.get(circuitoCodigo) : undefined

    if (circuitoCodigo && !circuito) {
      mensagens.push(`O circuito ${circuitoCodigo} não está cadastrado.`)
    }

    if (circuito && !circuito.ativo) {
      mensagens.push(`O circuito ${circuito.codigo} está inativo.`)
      dependenciasInativas.set(
        `circuito-${circuito.id}`,
        `Circuito: ${circuito.codigo} — ${circuito.nome}`
      )
    }

    const postosEncontrados = postoNome
      ? (postosPorNome.get(normalizarComparacao(postoNome)) ?? [])
      : []

    if (postoNome && postosEncontrados.length === 0) {
      mensagens.push(`O posto ${postoNome} não está cadastrado.`)
    }

    if (postosEncontrados.length > 1) {
      mensagens.push(
        `Há mais de um posto chamado ${postoNome}. Use nomes únicos nos cadastros antes de importar o roteiro.`
      )
    }

    const posto = postosEncontrados.length === 1 ? postosEncontrados[0] : undefined

    if (posto && !posto.ativo) {
      mensagens.push(`O posto ${posto.nome} está inativo.`)
      dependenciasInativas.set(
        `posto-${posto.id}`,
        `Posto: ${posto.nome} — ${posto.setorNome} / ${posto.subsetorNome}`
      )
    }

    const componente = componenteCodigo ? componentesPorCodigo.get(componenteCodigo) : undefined

    if (componenteCodigo && !componente) {
      mensagens.push(`O componente ${componenteCodigo} não está cadastrado.`)
    }

    if (componente && !componente.ativo) {
      mensagens.push(`O componente ${componente.codigo} está inativo.`)
      dependenciasInativas.set(
        `componente-${componente.id}`,
        `Componente: ${componente.codigo} — ${componente.nome}`
      )
    }

    let componenteDoCircuito = false

    if (circuito && componente && circuito.ativo && componente.ativo) {
      let vinculos = componentesPorCircuito.get(circuito.id)

      if (!vinculos) {
        vinculos = await circuitoComponentesRepository.listarPorCircuito(circuito.id, true)
        componentesPorCircuito.set(circuito.id, vinculos)
      }

      const vinculo = vinculos.find((item) => item.componenteId === componente.id)

      if (!vinculo) {
        mensagens.push(
          `O componente ${componente.codigo} não pertence ao circuito ${circuito.codigo}.`
        )
      } else if (!vinculo.ativo) {
        mensagens.push(
          `O vínculo do componente ${componente.codigo} com o circuito ${circuito.codigo} está inativo.`
        )
        dependenciasInativas.set(
          `circuito-componente-${vinculo.id}`,
          `Circuito x Componente: ${circuito.codigo} / ${componente.codigo}`
        )
      } else {
        componenteDoCircuito = true
      }
    }

    const dados = {
      ...registro,
      circuito_codigo: circuitoCodigo,
      posto_nome: postoNome,
      componente_codigo: componenteCodigo,
      quantidade: Number.isFinite(quantidade) ? String(quantidade) : quantidadeTexto
    }

    if (mensagens.length > 0 || !circuito || !posto || !componente || !componenteDoCircuito) {
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

    const chaveRoteiro = `${circuito.id}::${posto.id}`
    let itensRoteiro = roteirosPorCircuitoPosto.get(chaveRoteiro)

    if (!itensRoteiro) {
      itensRoteiro = await roteirosRepository.listarPorCircuitoEPosto(circuito.id, posto.id, true)
      roteirosPorCircuitoPosto.set(chaveRoteiro, itensRoteiro)
    }

    const existente = itensRoteiro.find((item) => item.componenteId === componente.id)

    if (!existente) {
      registrosAnalisados.push({
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'NOVO',
        resumo: `O componente ${componente.codigo} será adicionado ao roteiro do circuito ${circuito.codigo} no posto ${posto.nome}.`,
        mensagens,
        alteracoes
      })
      continue
    }

    if (existente.quantidade !== quantidade) {
      alteracoes.push({
        campo: 'Quantidade',
        valorAtual: String(existente.quantidade),
        novoValor: String(quantidade)
      })
    }

    if (!existente.ativo) {
      registrosAnalisados.push({
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'RESTAURAR',
        resumo:
          existente.quantidade !== quantidade
            ? 'O item do roteiro será restaurado com a nova quantidade.'
            : 'O item do roteiro existe, mas está inativo e será restaurado.',
        mensagens,
        alteracoes,
        registroExistenteId: existente.id
      })
      continue
    }

    if (existente.quantidade !== quantidade) {
      registrosAnalisados.push({
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'ATUALIZAR',
        resumo: 'O item do roteiro já existe e terá sua quantidade atualizada.',
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
      resumo: 'O item do roteiro já existe com a mesma quantidade.',
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
            titulo: 'Há dependências inativas necessárias para importar os roteiros',
            mensagem: 'Reative os cadastros e vínculos abaixo e analise o arquivo novamente:',
            itens
          }
        ]
      : []

  return {
    registros: registrosAnalisados,
    avisos
  }
}

const PERFIS_USUARIO_PERMITIDOS = new Set([
  'OPERADOR',
  'TECNICO',
  'LIDER',
  'SUPERVISOR',
  'QUALIDADE',
  'ADMIN'
])

function normalizarPerfilUsuario(valor: unknown): string {
  return normalizar(valor).toUpperCase()
}

export async function analisarUsuarios(
  registros: RegistroCsv[],
  usuarioId: number
): Promise<RegistroPreview[]> {
  const repository = RepositoryFactory.usuarios()

  const [ativos, inativos, responsavel] = await Promise.all([
    repository.listar(),
    repository.listarInativos(),
    repository.buscarPerfilPorId(usuarioId)
  ])

  const perfilResponsavel = normalizarPerfilUsuario(responsavel?.perfil)

  if (
    !responsavel ||
    !responsavel.ativo ||
    (perfilResponsavel !== 'ADMIN' && perfilResponsavel !== 'QUALIDADE')
  ) {
    throw new Error('Usuário autenticado não possui permissão para importar usuários.')
  }

  const todosUsuarios = [...ativos, ...inativos]
  const usuariosPorMatricula = new Map(
    todosUsuarios.map((usuario) => [normalizar(usuario.matricula), usuario])
  )

  const ocorrenciasPorMatricula = new Map<string, number>()

  for (const registro of registros) {
    const matricula = normalizar(registro.matricula)

    if (matricula) {
      ocorrenciasPorMatricula.set(matricula, (ocorrenciasPorMatricula.get(matricula) ?? 0) + 1)
    }
  }

  const estadoFinal = new Map(
    todosUsuarios.map((usuario) => [
      usuario.id,
      {
        ativo: usuario.ativo,
        perfil: normalizarPerfilUsuario(usuario.perfil)
      }
    ])
  )

  let proximoIdVirtual = -1

  for (const registro of registros) {
    const matricula = normalizar(registro.matricula)
    const nome = normalizar(registro.nome)
    const perfil = normalizarPerfilUsuario(registro.perfil || 'OPERADOR')
    const senha = normalizar(registro.senha)

    if (
      !matricula ||
      !nome ||
      !PERFIS_USUARIO_PERMITIDOS.has(perfil) ||
      (senha && senha.length < 8) ||
      (ocorrenciasPorMatricula.get(matricula) ?? 0) > 1
    ) {
      continue
    }

    const existente = usuariosPorMatricula.get(matricula)

    if (!existente && !senha) {
      continue
    }

    const perfilExistente = normalizarPerfilUsuario(existente?.perfil)

    if (
      perfilResponsavel === 'QUALIDADE' &&
      (perfil === 'ADMIN' || perfilExistente === 'ADMIN')
    ) {
      continue
    }

    if (existente?.id === usuarioId && perfil !== perfilExistente) {
      continue
    }

    if (existente) {
      estadoFinal.set(existente.id, {
        ativo: true,
        perfil
      })
    } else {
      estadoFinal.set(proximoIdVirtual--, {
        ativo: true,
        perfil
      })
    }
  }

  const totalAdminsAtivosAposImportacao = [...estadoFinal.values()].filter(
    (usuario) => usuario.ativo && usuario.perfil === 'ADMIN'
  ).length

  return registros.map((registro, index) => {
    const linha = Number(registro.__linha ?? index + 2)
    const matricula = normalizar(registro.matricula)
    const nome = normalizar(registro.nome)
    const perfil = normalizarPerfilUsuario(registro.perfil || 'OPERADOR')
    const senha = normalizar(registro.senha)
    const mensagens: string[] = []
    const alteracoes: AlteracaoCampoImportacao[] = []

    if (!matricula) {
      mensagens.push('A matrícula do usuário é obrigatória.')
    }

    if (!nome) {
      mensagens.push('O nome do usuário é obrigatório.')
    }

    if (!PERFIS_USUARIO_PERMITIDOS.has(perfil)) {
      mensagens.push(
        `O perfil ${perfil || '(vazio)'} é inválido. Use OPERADOR, TECNICO, LIDER, SUPERVISOR, QUALIDADE ou ADMIN.`
      )
    }

    if (senha && senha.length < 8) {
      mensagens.push('A senha temporária deve possuir pelo menos 8 caracteres.')
    }

    if (matricula && (ocorrenciasPorMatricula.get(matricula) ?? 0) > 1) {
      mensagens.push(`A matrícula ${matricula} aparece mais de uma vez neste arquivo.`)
    }

    const existente = matricula ? usuariosPorMatricula.get(matricula) : undefined
    const perfilExistente = normalizarPerfilUsuario(existente?.perfil)

    if (!existente && !senha) {
      mensagens.push('A senha temporária é obrigatória para novos usuários.')
    }

    if (
      perfilResponsavel === 'QUALIDADE' &&
      (perfil === 'ADMIN' || perfilExistente === 'ADMIN')
    ) {
      mensagens.push('A Qualidade não pode criar, restaurar ou alterar contas de administrador.')
    }

    if (existente?.id === usuarioId && perfil !== perfilExistente) {
      mensagens.push('Você não pode alterar o perfil da sua própria conta pela importação.')
    }

    if (
      existente?.ativo &&
      perfilExistente === 'ADMIN' &&
      perfil !== 'ADMIN' &&
      totalAdminsAtivosAposImportacao < 1
    ) {
      mensagens.push('A importação não pode remover o último administrador ativo.')
    }

    const dados = {
      ...registro,
      matricula,
      nome,
      perfil,
      senha
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

    if (!existente) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'NOVO' as const,
        resumo: `O usuário ${nome} (${matricula}) será criado.`,
        mensagens,
        alteracoes
      }
    }

    const nomeAlterado = normalizarComparacao(existente.nome) !== normalizarComparacao(nome)
    const perfilAlterado = perfilExistente !== perfil

    if (nomeAlterado) {
      alteracoes.push({
        campo: 'Nome',
        valorAtual: existente.nome,
        novoValor: nome
      })
    }

    if (perfilAlterado) {
      alteracoes.push({
        campo: 'Perfil',
        valorAtual: existente.perfil,
        novoValor: perfil
      })
    }

    if (senha) {
      alteracoes.push({
        campo: 'Senha',
        valorAtual: 'Mantida',
        novoValor: 'Redefinir senha temporária'
      })
    }

    const possuiAlteracoes = nomeAlterado || perfilAlterado || Boolean(senha)

    if (!existente.ativo) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'RESTAURAR' as const,
        resumo: possuiAlteracoes
          ? `O usuário ${matricula} será reativado e atualizado.`
          : `O usuário ${matricula} existe, mas está inativo e será reativado.`,
        mensagens,
        alteracoes,
        registroExistenteId: existente.id
      }
    }

    if (possuiAlteracoes) {
      return {
        id: index + 1,
        linha,
        selecionado: true,
        dados,
        status: 'ATUALIZAR' as const,
        resumo: senha
          ? `O usuário ${matricula} será atualizado e receberá uma nova senha temporária.`
          : `O usuário ${matricula} já existe e terá alterações.`,
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
      resumo: `O usuário ${matricula} já existe com os mesmos dados.`,
      mensagens,
      alteracoes,
      registroExistenteId: existente.id
    }
  })
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

type ItemRefugoHistoricoNormalizado = {
  componenteId: number
  defeitoId: number
  quantidade: number
  precoUnitario?: number
  componenteCodigo: string
  defeitoCodigo: string
}

function analisarInteiroPositivo(valor: unknown): number | null {
  const texto = normalizar(valor)
  if (!/^\d+$/.test(texto)) return null

  const numero = Number(texto)
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null
}

function analisarPrecoHistorico(valor: unknown): number | undefined | null {
  const texto = normalizar(valor)
  if (!texto) return undefined

  const resultado = analisarPrecoImportacao(texto)
  return resultado.valido ? resultado.valor : null
}

function normalizarDataHoraHistorica(valor: unknown): string | null {
  const texto = normalizar(valor).replace('T', ' ')
  const correspondencia = texto.match(/^(\d{4})-(\d{2})-(\d{2})[ ](\d{2}):(\d{2})(?::(\d{2}))?$/)

  if (!correspondencia) return null

  const [, ano, mes, dia, hora, minuto, segundo = '00'] = correspondencia
  const data = new Date(
    Number(ano),
    Number(mes) - 1,
    Number(dia),
    Number(hora),
    Number(minuto),
    Number(segundo)
  )

  const valida =
    data.getFullYear() === Number(ano) &&
    data.getMonth() === Number(mes) - 1 &&
    data.getDate() === Number(dia) &&
    data.getHours() === Number(hora) &&
    data.getMinutes() === Number(minuto)

  return valida ? `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}` : null
}

export async function analisarRefugosHistoricos(
  registros: RegistroCsv[]
): Promise<{ registros: RegistroPreview[]; avisos: AvisoImportacao[] }> {
  const setoresRepository = RepositoryFactory.setores()
  const subsetoresRepository = RepositoryFactory.subsetores()
  const postosRepository = RepositoryFactory.postos()
  const circuitosRepository = RepositoryFactory.circuitos()
  const componentesRepository = RepositoryFactory.componentes()
  const defeitosRepository = RepositoryFactory.defeitos()
  const circuitoComponentesRepository = RepositoryFactory.circuitoComponentes()
  const roteirosRepository = RepositoryFactory.roteiros()
  const postoDefeitosRepository = RepositoryFactory.postoDefeitos()
  const refugosRepository = RepositoryFactory.refugos()

  const [
    setoresAtivos,
    setoresInativos,
    subsetoresAtivos,
    subsetoresInativos,
    postosAtivos,
    postosInativos,
    circuitosAtivos,
    circuitosInativos,
    componentesAtivos,
    componentesInativos,
    defeitosAtivos,
    defeitosInativos
  ] = await Promise.all([
    setoresRepository.listar(),
    setoresRepository.listarInativos(),
    subsetoresRepository.listar(),
    subsetoresRepository.listarInativos(),
    postosRepository.listar(),
    postosRepository.listarInativos(),
    circuitosRepository.listar(),
    circuitosRepository.listarInativos(),
    componentesRepository.listar(),
    componentesRepository.listarInativos(),
    defeitosRepository.listar(),
    defeitosRepository.listarInativos()
  ])

  const setoresPorSigla = new Map(
    [...setoresAtivos, ...setoresInativos].map((item) => [normalizarCodigo(item.sigla), item])
  )
  const subsetoresPorChave = new Map(
    [...subsetoresAtivos, ...subsetoresInativos].map((item) => [
      `${item.setorId}::${normalizarComparacao(item.nome)}`,
      item
    ])
  )
  const postosPorChave = new Map(
    [...postosAtivos, ...postosInativos].map((item) => [
      `${item.subsetorId}::${normalizarComparacao(item.nome)}`,
      item
    ])
  )
  const circuitosPorCodigo = new Map(
    [...circuitosAtivos, ...circuitosInativos].map((item) => [normalizarCodigo(item.codigo), item])
  )
  const componentesPorCodigo = new Map(
    [...componentesAtivos, ...componentesInativos].map((item) => [
      normalizarCodigo(item.codigo),
      item
    ])
  )
  const defeitosPorCodigo = new Map(
    [...defeitosAtivos, ...defeitosInativos].map((item) => [normalizarCodigo(item.codigo), item])
  )

  const grupos = new Map<string, RegistroCsv[]>()

  for (const registro of registros) {
    const idOrigem = normalizar(registro.id_origem)
    const chave = idOrigem || `__linha_${registro.__linha ?? grupos.size + 2}`
    const grupo = grupos.get(chave) ?? []
    grupo.push(registro)
    grupos.set(chave, grupo)
  }

  const avisosPrecoAtual = new Set<string>()
  const dependenciasInativas = new Set<string>()
  const previews: RegistroPreview[] = []
  let indice = 0

  for (const [chaveGrupo, linhas] of grupos) {
    indice++
    const primeira = linhas[0]
    const linha = Number(primeira.__linha ?? indice + 1)
    const idOrigem = normalizar(primeira.id_origem)
    const dataHora = normalizarDataHoraHistorica(primeira.data_hora)
    const matriculaOperador = normalizar(primeira.matricula_operador)
    const setorSigla = normalizarCodigo(primeira.setor_sigla)
    const subsetorNome = normalizar(primeira.subsetor_nome)
    const postoNome = normalizar(primeira.posto_nome)
    const circuitoCodigo = normalizarCodigo(primeira.circuito_codigo)
    const turno = normalizarCodigo(primeira.turno)
    const quantidadeProduzida = analisarInteiroPositivo(primeira.quantidade_produzida)
    const observacao = normalizar(primeira.observacao)
    const mensagens: string[] = []

    if (!idOrigem) mensagens.push('O id_origem é obrigatório.')
    if (!dataHora) mensagens.push('A data_hora deve usar o formato AAAA-MM-DD HH:mm.')
    if (!matriculaOperador) mensagens.push('A matrícula do operador é obrigatória.')
    if (!setorSigla) mensagens.push('A sigla do setor é obrigatória.')
    if (!subsetorNome) mensagens.push('O subsetor é obrigatório.')
    if (!postoNome) mensagens.push('O posto é obrigatório.')
    if (!circuitoCodigo) mensagens.push('O circuito é obrigatório.')
    if (!['A', 'B', 'C'].includes(turno)) mensagens.push('O turno deve ser A, B ou C.')
    if (quantidadeProduzida === null) {
      mensagens.push('A quantidade produzida deve ser um inteiro maior que zero.')
    }

    const cabecalhos = [
      'data_hora',
      'matricula_operador',
      'setor_sigla',
      'subsetor_nome',
      'posto_nome',
      'circuito_codigo',
      'turno',
      'quantidade_produzida',
      'observacao'
    ]

    for (const outra of linhas.slice(1)) {
      for (const campo of cabecalhos) {
        if (normalizarComparacao(outra[campo]) !== normalizarComparacao(primeira[campo])) {
          mensagens.push(
            `O refugo ${idOrigem || chaveGrupo} possui valores diferentes na coluna ${campo}.`
          )
          break
        }
      }
    }

    const setor = setorSigla ? setoresPorSigla.get(setorSigla) : undefined
    if (setorSigla && !setor) mensagens.push(`O setor ${setorSigla} não está cadastrado.`)

    const subsetor =
      setor && subsetorNome
        ? subsetoresPorChave.get(`${setor.id}::${normalizarComparacao(subsetorNome)}`)
        : undefined
    if (setor && subsetorNome && !subsetor) {
      mensagens.push(`O subsetor ${subsetorNome} não pertence ao setor ${setorSigla}.`)
    }

    const posto =
      subsetor && postoNome
        ? postosPorChave.get(`${subsetor.id}::${normalizarComparacao(postoNome)}`)
        : undefined
    if (subsetor && postoNome && !posto) {
      mensagens.push(`O posto ${postoNome} não pertence ao subsetor ${subsetorNome}.`)
    }

    const circuito = circuitoCodigo ? circuitosPorCodigo.get(circuitoCodigo) : undefined
    if (circuitoCodigo && !circuito) {
      mensagens.push(`O circuito ${circuitoCodigo} não está cadastrado.`)
    }

    for (const dependencia of [
      setor && !setor.ativo ? `Setor: ${setor.nome} (${setorSigla})` : '',
      subsetor && !subsetor.ativo ? `Subsetor: ${subsetor.nome}` : '',
      posto && !posto.ativo ? `Posto: ${posto.nome}` : '',
      circuito && !circuito.ativo ? `Circuito: ${circuito.codigo}` : ''
    ]) {
      if (dependencia) dependenciasInativas.add(dependencia)
    }

    let vinculosCircuito: Awaited<
      ReturnType<typeof circuitoComponentesRepository.listarPorCircuito>
    > = []
    let vinculosRoteiro: Awaited<ReturnType<typeof roteirosRepository.listarPorCircuitoEPosto>> = []
    let vinculosDefeitos: Awaited<ReturnType<typeof postoDefeitosRepository.listarPorPosto>> = []

    if (circuito) {
      vinculosCircuito = await circuitoComponentesRepository.listarPorCircuito(circuito.id, true)
    }
    if (circuito && posto) {
      vinculosRoteiro = await roteirosRepository.listarPorCircuitoEPosto(
        circuito.id,
        posto.id,
        true
      )
    }
    if (posto) {
      vinculosDefeitos = await postoDefeitosRepository.listarPorPosto(posto.id, true)
    }

    const componentesPermitidos = new Set(vinculosCircuito.map((item) => item.componenteId))
    const componentesRoteiro = new Set(vinculosRoteiro.map((item) => item.componenteId))
    const defeitosPermitidos = new Set(vinculosDefeitos.map((item) => item.defeitoId))
    const itens: ItemRefugoHistoricoNormalizado[] = []
    const pares = new Set<string>()

    for (const registro of linhas) {
      const componenteCodigo = normalizarCodigo(registro.componente_codigo)
      const defeitoCodigo = normalizarCodigo(registro.defeito_codigo)
      const quantidade = analisarInteiroPositivo(registro.quantidade_refugada)
      const precoUnitario = analisarPrecoHistorico(registro.preco_unitario)
      const linhaItem = Number(registro.__linha ?? linha)

      if (!componenteCodigo) {
        mensagens.push(`Linha ${linhaItem}: componente_codigo é obrigatório.`)
        continue
      }
      if (!defeitoCodigo) {
        mensagens.push(`Linha ${linhaItem}: defeito_codigo é obrigatório.`)
        continue
      }
      if (quantidade === null) {
        mensagens.push(`Linha ${linhaItem}: quantidade_refugada deve ser maior que zero.`)
        continue
      }
      if (precoUnitario === null) {
        mensagens.push(`Linha ${linhaItem}: preco_unitario é inválido.`)
        continue
      }

      const componente = componentesPorCodigo.get(componenteCodigo)
      const defeito = defeitosPorCodigo.get(defeitoCodigo)

      if (!componente) {
        mensagens.push(`Linha ${linhaItem}: componente ${componenteCodigo} não cadastrado.`)
        continue
      }
      if (!defeito) {
        mensagens.push(`Linha ${linhaItem}: defeito ${defeitoCodigo} não cadastrado.`)
        continue
      }

      if (!componentesPermitidos.has(componente.id)) {
        mensagens.push(
          `Linha ${linhaItem}: componente ${componenteCodigo} não pertence ao circuito ${circuitoCodigo}.`
        )
      }
      if (!componentesRoteiro.has(componente.id)) {
        mensagens.push(
          `Linha ${linhaItem}: componente ${componenteCodigo} não está no roteiro do posto ${postoNome}.`
        )
      }
      if (!defeitosPermitidos.has(defeito.id)) {
        mensagens.push(
          `Linha ${linhaItem}: defeito ${defeitoCodigo} não está vinculado ao posto ${postoNome}.`
        )
      }

      if (!componente.ativo) dependenciasInativas.add(`Componente: ${componente.codigo}`)
      if (!defeito.ativo) dependenciasInativas.add(`Defeito: ${defeito.codigo}`)

      const par = `${componente.id}::${defeito.id}`
      if (pares.has(par)) {
        mensagens.push(
          `Linha ${linhaItem}: o par ${componenteCodigo} / ${defeitoCodigo} está repetido no mesmo refugo.`
        )
      }
      pares.add(par)

      if (precoUnitario === undefined) {
        avisosPrecoAtual.add(idOrigem || chaveGrupo)
      }

      itens.push({
        componenteId: componente.id,
        defeitoId: defeito.id,
        quantidade,
        precoUnitario,
        componenteCodigo,
        defeitoCodigo
      })
    }

    const duplicado = idOrigem ? await refugosRepository.existeIdOrigemHistorica(idOrigem) : false

    const dados: RegistroCsv = {
      id_origem: idOrigem,
      data_hora: dataHora ?? normalizar(primeira.data_hora),
      matricula_operador: matriculaOperador,
      setor_sigla: setorSigla,
      subsetor_nome: subsetorNome,
      posto_nome: postoNome,
      circuito_codigo: circuitoCodigo,
      turno,
      quantidade_produzida: quantidadeProduzida?.toString() ?? '',
      total_itens: itens.length.toString(),
      observacao,
      __setor_id: setor?.id.toString() ?? '',
      __subsetor_id: subsetor?.id.toString() ?? '',
      __posto_id: posto?.id.toString() ?? '',
      __circuito_id: circuito?.id.toString() ?? '',
      __itens_json: JSON.stringify(itens)
    }

    if (duplicado) {
      previews.push({
        id: indice,
        linha,
        selecionado: false,
        dados,
        status: 'SEM_ALTERACAO',
        resumo: `O refugo histórico ${idOrigem} já foi importado.`,
        mensagens: [],
        alteracoes: []
      })
      continue
    }

    if (mensagens.length > 0 || itens.length === 0 || !setor || !subsetor || !posto || !circuito) {
      previews.push({
        id: indice,
        linha,
        selecionado: false,
        dados,
        status: 'ERRO',
        resumo: `O grupo ${idOrigem || chaveGrupo} possui erros e não será importado.`,
        mensagens: [...new Set(mensagens)],
        alteracoes: []
      })
      continue
    }

    previews.push({
      id: indice,
      linha,
      selecionado: true,
      dados,
      status: 'NOVO',
      resumo: `O refugo histórico ${idOrigem} será criado com ${itens.length} item(ns).`,
      mensagens: [],
      alteracoes: []
    })
  }

  const avisos: AvisoImportacao[] = []

  if (dependenciasInativas.size > 0) {
    avisos.push({
      tipo: 'DEPENDENCIA_INATIVA',
      titulo: 'A migração utiliza cadastros inativos',
      mensagem: 'Os registros serão preservados como históricos sem reativar estes cadastros:',
      itens: [...dependenciasInativas].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    })
  }

  if (avisosPrecoAtual.size > 0) {
    avisos.push({
      tipo: 'DEPENDENCIA_INATIVA',
      titulo: 'Alguns itens não possuem preço histórico',
      mensagem:
        'Quando preco_unitario estiver vazio, o sistema usará o preço atual do componente. Revise estes IDs:',
      itens: [...avisosPrecoAtual].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    })
  }

  return { registros: previews, avisos }
}
