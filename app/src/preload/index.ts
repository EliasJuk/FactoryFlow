import { contextBridge, ipcRenderer } from 'electron'

import type {
  ResultadoImportacao,
  TipoImportacao
} from '../main/services/importacao/importacao.types'

type RefugoItemInput = {
  componenteId: number
  defeitoId: number
  quantidade: number
}

type RefugoInput = {
  matriculaOperador: string
  usuarioId: number
  dataHora?: string
  setorId: number
  subsetorId: number
  postoId: number
  circuitoId: number
  turno: string
  quantidadeProduzida: number
  observacao?: string
  itens: RefugoItemInput[]
}

type ConfiguracaoBanco = {
  mode: 'sqliteSync' | 'api' | 'postgres'
  sqlite: {
    path: string
  }
  postgres: {
    host: string
    port: number
    database: string
    user: string
    password?: string
    passwordConfigured: boolean
    clearPassword?: boolean
    timeoutSeconds: number
    ssl: boolean
  }
  api: {
    baseUrl: string
    version: string
    authMethod: 'bearer'
    timeoutSeconds: number
    validateSsl: boolean
    retryOnError: boolean
  }
  sync: {
    enabled: boolean
    destination: 'postgres' | 'api'
    syncOnStartup: boolean
    syncOnReconnect: boolean
    retryFailed: boolean
    refugoRetention: {
      enabled: boolean
      months: number | null
    }
  }
}

contextBridge.exposeInMainWorld('api', {
  app: {
    isReady: () => ipcRenderer.invoke('app:is-ready'),

    onStartupProgress: (callback: (data: { message: string; progress: number }) => void) => {
      ipcRenderer.on('app:startup-progress', (_, data) => callback(data))
    },

    onReady: (callback: () => void) => {
      ipcRenderer.on('app:ready', () => callback())
    },

    onStartupError: (callback: (data: { message: string }) => void) => {
      ipcRenderer.on('app:startup-error', (_, data) => callback(data))
    }
  },

  auth: {
    login: (matricula: string, senha: string) => ipcRenderer.invoke('auth:login', matricula, senha),
    sessaoAtual: () => ipcRenderer.invoke('auth:sessao-atual'),
    logout: () => ipcRenderer.invoke('auth:logout'),
    solicitarRedefinicao: (matricula: string) =>
      ipcRenderer.invoke('auth:solicitar-redefinicao', matricula),
    alterarSenhaObrigatoria: (senhaAtual: string, novaSenha: string) =>
      ipcRenderer.invoke('auth:alterar-senha-obrigatoria', senhaAtual, novaSenha)
  },

  setores: {
    listar: () => ipcRenderer.invoke('setores:listar'),

    criar: (nome: string, sigla: string) => ipcRenderer.invoke('setores:criar', nome, sigla),

    editar: (id: number, nome: string, sigla: string) =>
      ipcRenderer.invoke('setores:editar', id, nome, sigla),

    excluir: (id: number) => ipcRenderer.invoke('setores:excluir', id),

    contarSubsetoresAtivos: (id: number) =>
      ipcRenderer.invoke('setores:contar-subsetores-ativos', id),

    listarInativos: () => ipcRenderer.invoke('setores:listar-inativos'),

    restaurar: (id: number) => ipcRenderer.invoke('setores:restaurar', id),

    excluirPermanente: (id: number) => ipcRenderer.invoke('setores:excluir-permanente', id)
  },

  subsetores: {
    listar: () => ipcRenderer.invoke('subsetores:listar'),

    criar: (nome: string, setorId: number) =>
      ipcRenderer.invoke('subsetores:criar', nome, setorId),

    editar: (id: number, nome: string, setorId: number) =>
      ipcRenderer.invoke('subsetores:editar', id, nome, setorId),

    contarPostosAtivos: (id: number) =>
      ipcRenderer.invoke('subsetores:contar-postos-ativos', id),

    excluir: (id: number) => ipcRenderer.invoke('subsetores:excluir', id),

    listarInativos: () => ipcRenderer.invoke('subsetores:listar-inativos'),

    restaurar: (id: number) => ipcRenderer.invoke('subsetores:restaurar', id),

    excluirPermanente: (id: number) => ipcRenderer.invoke('subsetores:excluir-permanente', id)
  },

  componentes: {
    listar: () => ipcRenderer.invoke('componentes:listar'),
    listarInativos: () => ipcRenderer.invoke('componentes:listar-inativos'),
    criar: (codigo: string, nome: string, precoAtual: number, usuarioId: number) =>
      ipcRenderer.invoke('componentes:criar', codigo, nome, precoAtual, usuarioId),
    editar: (id: number, codigo: string, nome: string, precoAtual: number, usuarioId: number) =>
      ipcRenderer.invoke('componentes:editar', id, codigo, nome, precoAtual, usuarioId),
    excluir: (id: number, usuarioId: number) =>
      ipcRenderer.invoke('componentes:excluir', id, usuarioId),
    restaurar: (id: number, usuarioId: number) =>
      ipcRenderer.invoke('componentes:restaurar', id, usuarioId),
    excluirPermanente: (id: number) => ipcRenderer.invoke('componentes:excluir-permanente', id)
  },

  circuitos: {
    listar: () => ipcRenderer.invoke('circuitos:listar'),
    listarInativos: () => ipcRenderer.invoke('circuitos:listar-inativos'),
    criar: (codigo: string, nome: string, usuarioId: number) =>
      ipcRenderer.invoke('circuitos:criar', codigo, nome, usuarioId),
    editar: (id: number, codigo: string, nome: string, usuarioId: number) =>
      ipcRenderer.invoke('circuitos:editar', id, codigo, nome, usuarioId),
    excluir: (id: number, usuarioId: number) =>
      ipcRenderer.invoke('circuitos:excluir', id, usuarioId),
    restaurar: (id: number, usuarioId: number) =>
      ipcRenderer.invoke('circuitos:restaurar', id, usuarioId),
    excluirPermanente: (id: number) => ipcRenderer.invoke('circuitos:excluir-permanente', id)
  },

  circuitoComponentes: {
    listarPorCircuito: (circuitoId: number) =>
      ipcRenderer.invoke('circuito-componentes:listar-por-circuito', circuitoId),
    adicionar: (circuitoId: number, componenteId: number, quantidade: number, usuarioId: number) =>
      ipcRenderer.invoke(
        'circuito-componentes:adicionar',
        circuitoId,
        componenteId,
        quantidade,
        usuarioId
      ),
    editarQuantidade: (id: number, quantidade: number, usuarioId: number) =>
      ipcRenderer.invoke('circuito-componentes:editar-quantidade', id, quantidade, usuarioId),
    remover: (id: number, usuarioId: number) =>
      ipcRenderer.invoke('circuito-componentes:remover', id, usuarioId),
    restaurar: (id: number, usuarioId: number) =>
      ipcRenderer.invoke('circuito-componentes:restaurar', id, usuarioId)
  },

  postos: {
    listar: () => ipcRenderer.invoke('postos:listar'),
    criar: (nome: string, subsetorId: number, usuarioId: number) =>
      ipcRenderer.invoke('postos:criar', nome, subsetorId, usuarioId),
    editar: (id: number, nome: string, subsetorId: number, usuarioId: number) =>
      ipcRenderer.invoke('postos:editar', id, nome, subsetorId, usuarioId),
    contarRoteirosAtivos: (id: number) => ipcRenderer.invoke('postos:contar-roteiros-ativos', id),
    excluir: (id: number, usuarioId: number) => ipcRenderer.invoke('postos:excluir', id, usuarioId),
    listarInativos: () => ipcRenderer.invoke('postos:listar-inativos'),
    restaurar: (id: number, usuarioId: number) =>
      ipcRenderer.invoke('postos:restaurar', id, usuarioId),
    excluirPermanente: (id: number) => ipcRenderer.invoke('postos:excluir-permanente', id)
  },

  postoDefeitos: {
    listarPorPosto: (postoId: number, incluirInativos = false) =>
      ipcRenderer.invoke('posto-defeitos:listar-por-posto', postoId, incluirInativos),

    listarPermitidosPorPosto: (postoId: number) =>
      ipcRenderer.invoke('posto-defeitos:listar-permitidos-por-posto', postoId),

    adicionar: (postoId: number, defeitoId: number, usuarioId: number) =>
      ipcRenderer.invoke('posto-defeitos:adicionar', postoId, defeitoId, usuarioId),

    remover: (id: number, usuarioId: number) =>
      ipcRenderer.invoke('posto-defeitos:remover', id, usuarioId),

    restaurar: (id: number, usuarioId: number) =>
      ipcRenderer.invoke('posto-defeitos:restaurar', id, usuarioId)
  },

  defeitos: {
    listar: () => ipcRenderer.invoke('defeitos:listar'),
    listarInativos: () => ipcRenderer.invoke('defeitos:listar-inativos'),
    criar: (codigo: string, descricao: string, usuarioId: number) =>
      ipcRenderer.invoke('defeitos:criar', codigo, descricao, usuarioId),
    editar: (id: number, codigo: string, descricao: string, usuarioId: number) =>
      ipcRenderer.invoke('defeitos:editar', id, codigo, descricao, usuarioId),
    excluir: (id: number, usuarioId: number) =>
      ipcRenderer.invoke('defeitos:excluir', id, usuarioId),
    restaurar: (id: number, usuarioId: number) =>
      ipcRenderer.invoke('defeitos:restaurar', id, usuarioId),
    excluirPermanente: (id: number) => ipcRenderer.invoke('defeitos:excluir-permanente', id)
  },

  refugos: {
    criar: (input: RefugoInput) => ipcRenderer.invoke('refugos:criar', input),
    listar: (busca: string, pagina: number, limite: number) =>
      ipcRenderer.invoke('refugos:listar', busca, pagina, limite),
    editarCompleto: (
      id: number,
      matricula: string,
      turno: string,
      quantidadeProduzida: number,
      observacao: string | undefined,
      itens: { id: number; defeitoId: number; quantidade: number }[],
      usuarioId: number
    ) =>
      ipcRenderer.invoke(
        'refugos:editar-completo',
        id,
        matricula,
        turno,
        quantidadeProduzida,
        observacao,
        itens,
        usuarioId
      ),
    cancelar: (id: number, motivo: string, usuarioId: number) =>
      ipcRenderer.invoke('refugos:cancelar', id, motivo, usuarioId),
    imprimir: (id: number) => ipcRenderer.invoke('refugos:imprimir', id),
    resultados: (filtros: Record<string, unknown>) =>
      ipcRenderer.invoke('refugos:resultados', filtros)
  },

  roteiro: {
    listarTodos: () => ipcRenderer.invoke('roteiro:listar-todos'),
    listarCircuitosPorPosto: (postoId: number, busca: string) =>
      ipcRenderer.invoke('roteiro:listar-circuitos-por-posto', postoId, busca),
    listarPorCircuitoEPosto: (circuitoId: number, postoId: number) =>
      ipcRenderer.invoke('roteiro:listar-por-circuito-e-posto', circuitoId, postoId),
    adicionar: (
      circuitoId: number,
      postoId: number,
      componenteId: number,
      quantidade: number,
      usuarioId: number
    ) =>
      ipcRenderer.invoke(
        'roteiro:adicionar',
        circuitoId,
        postoId,
        componenteId,
        quantidade,
        usuarioId
      ),
    editarQuantidade: (id: number, quantidade: number, usuarioId: number) =>
      ipcRenderer.invoke('roteiro:editar-quantidade', id, quantidade, usuarioId),
    remover: (id: number, usuarioId: number) => ipcRenderer.invoke('roteiro:remover', id, usuarioId)
  },

  usuarios: {
    listar: () => ipcRenderer.invoke('usuarios:listar'),
    listarInativos: () => ipcRenderer.invoke('usuarios:listar-inativos'),
    criar: (input: Record<string, unknown>) => ipcRenderer.invoke('usuarios:criar', input),
    editar: (id: number, input: Record<string, unknown>) =>
      ipcRenderer.invoke('usuarios:editar', id, input),
    excluir: (id: number) => ipcRenderer.invoke('usuarios:excluir', id),
    ativar: (id: number) => ipcRenderer.invoke('usuarios:ativar', id),
    remover: (id: number) => ipcRenderer.invoke('usuarios:remover', id),
    listarSolicitacoesSenha: () => ipcRenderer.invoke('usuarios:listar-solicitacoes-senha'),
    atenderSolicitacaoSenha: (solicitacaoId: number) =>
      ipcRenderer.invoke('usuarios:atender-solicitacao-senha', solicitacaoId),
    cancelarSolicitacaoSenha: (solicitacaoId: number) =>
      ipcRenderer.invoke('usuarios:cancelar-solicitacao-senha', solicitacaoId)
  },

  importacao: {
    baixarModelo: (tipo: TipoImportacao) =>
      ipcRenderer.invoke('importacao:baixar-modelo', tipo) as Promise<{
        sucesso: boolean
        mensagem: string
      }>,
    preVisualizar: (tipo: TipoImportacao) => ipcRenderer.invoke('importacao:pre-visualizar', tipo),
    importarRegistros: (
      tipo: TipoImportacao,
      registros: Record<string, string>[],
      usuarioId?: number | null
    ) =>
      ipcRenderer.invoke(
        'importacao:importar-registros',
        tipo,
        registros,
        usuarioId
      ) as Promise<ResultadoImportacao>,
    importar: (tipo: TipoImportacao, usuarioId?: number | null) =>
      ipcRenderer.invoke('importacao:importar', tipo, usuarioId) as Promise<ResultadoImportacao>
  },

  resultados: (filtros: Record<string, unknown>) =>
    ipcRenderer.invoke('refugos:resultados', filtros),

  exportacaoDados: {
    refugosCsv: (filtros: { dataInicio: string; dataFim: string }) =>
      ipcRenderer.invoke('exportacao:refugos-csv', filtros)
  },

  configuracao: {
    carregarBanco: () =>
      ipcRenderer.invoke('configuracao:banco-carregar') as Promise<ConfiguracaoBanco>,
    salvarBanco: (config: ConfiguracaoBanco) =>
      ipcRenderer.invoke('configuracao:banco-salvar', config),
    testarPostgres: (config: ConfiguracaoBanco['postgres']) =>
      ipcRenderer.invoke('configuracao:postgres-testar', config)
  }
})
