import { contextBridge, ipcRenderer } from 'electron'

import type {
  RegistroPreview,
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
  usuarioId?: number | null
  setorId: number
  subsetorId: number
  postoId: number
  circuitoId: number
  turno: string
  quantidadeProduzida: number
  observacao?: string
  itens: RefugoItemInput[]
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

    solicitarRedefinicao: (matricula: string) =>
      ipcRenderer.invoke('auth:solicitar-redefinicao', matricula),

    alterarSenhaObrigatoria: (usuarioId: number, senhaAtual: string, novaSenha: string) =>
      ipcRenderer.invoke('auth:alterar-senha-obrigatoria', usuarioId, senhaAtual, novaSenha)
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

    criar: (nome: string, setorId: number) => ipcRenderer.invoke('subsetores:criar', nome, setorId),

    editar: (id: number, nome: string, setorId: number) =>
      ipcRenderer.invoke('subsetores:editar', id, nome, setorId),

    contarPostosAtivos: (id: number) => ipcRenderer.invoke('subsetores:contar-postos-ativos', id),

    excluir: (id: number) => ipcRenderer.invoke('subsetores:excluir', id),

    listarInativos: () => ipcRenderer.invoke('subsetores:listar-inativos'),

    restaurar: (id: number) => ipcRenderer.invoke('subsetores:restaurar', id),

    excluirPermanente: (id: number) => ipcRenderer.invoke('subsetores:excluir-permanente', id)
  },

  componentes: {
    listar: () => ipcRenderer.invoke('componentes:listar'),

    listarInativos: () => ipcRenderer.invoke('componentes:listar-inativos'),

    criar: (codigo: string, nome: string, precoAtual: number) =>
      ipcRenderer.invoke('componentes:criar', codigo, nome, precoAtual),

    editar: (id: number, codigo: string, nome: string, precoAtual: number) =>
      ipcRenderer.invoke('componentes:editar', id, codigo, nome, precoAtual),

    excluir: (id: number) => ipcRenderer.invoke('componentes:excluir', id),

    restaurar: (id: number) => ipcRenderer.invoke('componentes:restaurar', id),

    excluirPermanente: (id: number) => ipcRenderer.invoke('componentes:excluir-permanente', id)
  },

  circuitos: {
    listar: () => ipcRenderer.invoke('circuitos:listar'),

    listarInativos: () => ipcRenderer.invoke('circuitos:listar-inativos'),

    criar: (codigo: string, nome: string) => ipcRenderer.invoke('circuitos:criar', codigo, nome),

    editar: (id: number, codigo: string, nome: string) =>
      ipcRenderer.invoke('circuitos:editar', id, codigo, nome),

    excluir: (id: number) => ipcRenderer.invoke('circuitos:excluir', id),

    restaurar: (id: number) => ipcRenderer.invoke('circuitos:restaurar', id),

    excluirPermanente: (id: number) => ipcRenderer.invoke('circuitos:excluir-permanente', id)
  },

  circuitoComponentes: {
    listarPorCircuito: (circuitoId: number) =>
      ipcRenderer.invoke('circuito-componentes:listar-por-circuito', circuitoId),
    adicionar: (
      circuitoId: number,
      componenteId: number,
      quantidade: number,
      usuarioId?: number | null
    ) =>
      ipcRenderer.invoke(
        'circuito-componentes:adicionar',
        circuitoId,
        componenteId,
        quantidade,
        usuarioId
      ),
    editarQuantidade: (id: number, quantidade: number, usuarioId?: number | null) =>
      ipcRenderer.invoke('circuito-componentes:editar-quantidade', id, quantidade, usuarioId),
    remover: (id: number, usuarioId?: number | null) =>
      ipcRenderer.invoke('circuito-componentes:remover', id, usuarioId),
    restaurar: (id: number, usuarioId?: number | null) =>
      ipcRenderer.invoke('circuito-componentes:restaurar', id, usuarioId)
  },

  postos: {
    listar: () => ipcRenderer.invoke('postos:listar'),

    criar: (nome: string, subsetorId: number) =>
      ipcRenderer.invoke('postos:criar', nome, subsetorId),

    editar: (id: number, nome: string, subsetorId: number) =>
      ipcRenderer.invoke('postos:editar', id, nome, subsetorId),

    contarRoteirosAtivos: (id: number) => ipcRenderer.invoke('postos:contar-roteiros-ativos', id),

    excluir: (id: number) => ipcRenderer.invoke('postos:excluir', id),

    listarInativos: () => ipcRenderer.invoke('postos:listar-inativos'),

    restaurar: (id: number) => ipcRenderer.invoke('postos:restaurar', id),

    excluirPermanente: (id: number) => ipcRenderer.invoke('postos:excluir-permanente', id)
  },

  postoDefeitos: {
    listarPorPosto: (postoId: number, incluirInativos = false) =>
      ipcRenderer.invoke('posto-defeitos:listar-por-posto', postoId, incluirInativos),
    listarPermitidosPorPosto: (postoId: number) =>
      ipcRenderer.invoke('posto-defeitos:listar-permitidos-por-posto', postoId),
    adicionar: (postoId: number, defeitoId: number, usuarioId?: number | null) =>
      ipcRenderer.invoke('posto-defeitos:adicionar', postoId, defeitoId, usuarioId),
    remover: (id: number, usuarioId?: number | null) =>
      ipcRenderer.invoke('posto-defeitos:remover', id, usuarioId),
    restaurar: (id: number, usuarioId?: number | null) =>
      ipcRenderer.invoke('posto-defeitos:restaurar', id, usuarioId)
  },

  defeitos: {
    listar: () => ipcRenderer.invoke('defeitos:listar'),

    listarInativos: () => ipcRenderer.invoke('defeitos:listar-inativos'),

    criar: (codigo: string, descricao: string) =>
      ipcRenderer.invoke('defeitos:criar', codigo, descricao),

    editar: (id: number, codigo: string, descricao: string) =>
      ipcRenderer.invoke('defeitos:editar', id, codigo, descricao),

    excluir: (id: number) => ipcRenderer.invoke('defeitos:excluir', id),

    restaurar: (id: number) => ipcRenderer.invoke('defeitos:restaurar', id),

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
      usuarioId?: number | null
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

    cancelar: (id: number, motivo: string, usuarioId?: number | null) =>
      ipcRenderer.invoke('refugos:cancelar', id, motivo, usuarioId),

    imprimir: (id: number) => ipcRenderer.invoke('refugos:imprimir', id),

    resultados: (filtros: {
      dataInicio?: string
      dataFim?: string
      setorId?: number | null
      subsetorId?: number | null
      postoId?: number | null
      circuitoId?: number | null
    }) => ipcRenderer.invoke('refugos:resultados', filtros)
  },

  roteiro: {
    listarTodos: () => ipcRenderer.invoke('roteiro:listar-todos'),

    listarCircuitosPorPosto: (postoId: number, busca: string) =>
      ipcRenderer.invoke('roteiro:listar-circuitos-por-posto', postoId, busca),

    listarPorCircuitoEPosto: (circuitoId: number, postoId: number) =>
      ipcRenderer.invoke('roteiro:listar-por-circuito-e-posto', circuitoId, postoId),

    adicionar: (circuitoId: number, postoId: number, componenteId: number, quantidade: number) =>
      ipcRenderer.invoke('roteiro:adicionar', circuitoId, postoId, componenteId, quantidade),

    editarQuantidade: (id: number, quantidade: number) =>
      ipcRenderer.invoke('roteiro:editar-quantidade', id, quantidade),

    remover: (id: number) => ipcRenderer.invoke('roteiro:remover', id)
  },

  usuarios: {
    listar: () => ipcRenderer.invoke('usuarios:listar'),

    listarInativos: () => ipcRenderer.invoke('usuarios:listar-inativos'),

    criar: (input: {
      nome: string
      matricula: string
      perfil: string
      senha?: string
      usuarioId?: number | null
    }) => ipcRenderer.invoke('usuarios:criar', input),

    editar: (
      id: number,
      input: {
        nome: string
        matricula: string
        perfil: string
        senha?: string
        usuarioId?: number | null
      }
    ) => ipcRenderer.invoke('usuarios:editar', id, input),

    excluir: (id: number, usuarioId?: number | null) =>
      ipcRenderer.invoke('usuarios:excluir', id, usuarioId),

    ativar: (id: number, usuarioId?: number | null) =>
      ipcRenderer.invoke('usuarios:ativar', id, usuarioId),

    remover: (id: number, usuarioId?: number | null) =>
      ipcRenderer.invoke('usuarios:remover', id, usuarioId),

    listarSolicitacoesSenha: () => ipcRenderer.invoke('usuarios:listar-solicitacoes-senha'),

    atenderSolicitacaoSenha: (solicitacaoId: number, atendenteId: number) =>
      ipcRenderer.invoke('usuarios:atender-solicitacao-senha', solicitacaoId, atendenteId),

    cancelarSolicitacaoSenha: (solicitacaoId: number, responsavelId: number) =>
      ipcRenderer.invoke('usuarios:cancelar-solicitacao-senha', solicitacaoId, responsavelId)
  },

  importacao: {
    baixarModelo: (tipo: TipoImportacao) =>
      ipcRenderer.invoke('importacao:baixar-modelo', tipo) as Promise<{
        sucesso: boolean
        mensagem: string
      }>,

    preVisualizar: (tipo: TipoImportacao) =>
      ipcRenderer.invoke('importacao:pre-visualizar', tipo) as Promise<{
        sucesso: boolean
        mensagem: string
        registros: RegistroPreview[]
        avisos: {
          tipo: 'DEPENDENCIA_INATIVA'
          titulo: string
          mensagem: string
          itens: string[]
        }[]
      }>,

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

  resultados: (filtros: {
    dataInicio?: string
    dataFim?: string
    setorId?: number | null
    subsetorId?: number | null
    postoId?: number | null
    circuitoId?: number | null
  }) => ipcRenderer.invoke('refugos:resultados', filtros),

  exportacaoDados: {
    refugosCsv: (filtros: { dataInicio: string; dataFim: string }) =>
      ipcRenderer.invoke('exportacao:refugos-csv', filtros)
  },

  configuracao: {
    carregarBanco: () => ipcRenderer.invoke('configuracao:banco-carregar'),

    salvarBanco: (config: {
      provider: 'sqlite' | 'postgres'
      postgres: {
        host: string
        port: number
        database: string
        user: string
        password: string
      }
    }) => ipcRenderer.invoke('configuracao:banco-salvar', config),

    testarPostgres: (config: {
      host: string
      port: number
      database: string
      user: string
      password: string
    }) => ipcRenderer.invoke('configuracao:postgres-testar', config)
  }
})
