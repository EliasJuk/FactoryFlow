import { contextBridge, ipcRenderer } from "electron"

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
  observacao?: string
  itens: RefugoItemInput[]
}

contextBridge.exposeInMainWorld("api", {
  app: {
    isReady: () => ipcRenderer.invoke('app:is-ready'),

    onStartupProgress: (
      callback: (data: { message: string; progress: number }) => void
    ) => {
      ipcRenderer.on('app:startup-progress', (_, data) => callback(data))
    },

    onReady: (callback: () => void) => {
      ipcRenderer.on('app:ready', () => callback())
    },

    onStartupError: (callback: (data: { message: string }) => void) => {
      ipcRenderer.on('app:startup-error', (_, data) => callback(data))
    }
  },

  setores: {
    listar: () => ipcRenderer.invoke("setores:listar"),

    criar: (nome: string, sigla: string) =>
      ipcRenderer.invoke("setores:criar", nome, sigla),

    editar: (id: number, nome: string, sigla: string) =>
      ipcRenderer.invoke("setores:editar", id, nome, sigla),

    excluir: (id: number) =>
      ipcRenderer.invoke("setores:excluir", id),

    contarSubsetoresAtivos: (id: number) =>
      ipcRenderer.invoke("setores:contar-subsetores-ativos", id),
  },

  subsetores: {
    listar: () => ipcRenderer.invoke("subsetores:listar"),

    criar: (nome: string, setorId: number) =>
      ipcRenderer.invoke("subsetores:criar", nome, setorId),

    editar: (id: number, nome: string, setorId: number) =>
      ipcRenderer.invoke("subsetores:editar", id, nome, setorId),

    contarPostosAtivos: (id: number) =>
      ipcRenderer.invoke("subsetores:contar-postos-ativos", id),

    excluir: (id: number) =>
      ipcRenderer.invoke("subsetores:excluir", id)
  },

  componentes: {
    listar: () => ipcRenderer.invoke("componentes:listar"),

    criar: (codigo: string, nome: string, precoAtual: number) =>
      ipcRenderer.invoke("componentes:criar", codigo, nome, precoAtual),

    editar: (id: number, codigo: string, nome: string, precoAtual: number) =>
      ipcRenderer.invoke("componentes:editar", id, codigo, nome, precoAtual),

    excluir: (id: number) => ipcRenderer.invoke("componentes:excluir", id)
  },

  circuitos: {
    listar: () => ipcRenderer.invoke("circuitos:listar"),
    criar: (codigo: string, nome: string) =>
      ipcRenderer.invoke("circuitos:criar", codigo, nome),
    editar: (id: number, codigo: string, nome: string) =>
      ipcRenderer.invoke("circuitos:editar", id, codigo, nome),
    excluir: (id: number) =>
      ipcRenderer.invoke("circuitos:excluir", id)
  },

  circuitoComponentes: {
    listarPorCircuito: (circuitoId: number) =>
      ipcRenderer.invoke("circuito-componentes:listar-por-circuito", circuitoId),
    adicionar: (circuitoId: number, componenteId: number, quantidade: number) =>
      ipcRenderer.invoke(
        "circuito-componentes:adicionar",
        circuitoId,
        componenteId,
        quantidade
      ),
    remover: (id: number) =>
      ipcRenderer.invoke("circuito-componentes:remover", id)
  },

  postos: {
    listar: () => ipcRenderer.invoke("postos:listar"),

    criar: (nome: string, subsetorId: number) =>
      ipcRenderer.invoke("postos:criar", nome, subsetorId),

    editar: (id: number, nome: string, subsetorId: number) =>
      ipcRenderer.invoke("postos:editar", id, nome, subsetorId),

    contarRoteirosAtivos: (id: number) =>
      ipcRenderer.invoke("postos:contar-roteiros-ativos", id),

    excluir: (id: number) =>
      ipcRenderer.invoke("postos:excluir", id)
  },

  defeitos: {
    listar: () => ipcRenderer.invoke("defeitos:listar"),
    criar: (codigo: string, descricao: string) =>
      ipcRenderer.invoke("defeitos:criar", codigo, descricao),
    editar: (id: number, codigo: string, descricao: string) =>
      ipcRenderer.invoke("defeitos:editar", id, codigo, descricao),
    excluir: (id: number) => ipcRenderer.invoke("defeitos:excluir", id)
  },

  refugos: {
    criar: (input: RefugoInput) =>
      ipcRenderer.invoke("refugos:criar", input),

    listar: (busca: string, pagina: number, limite: number) =>
      ipcRenderer.invoke("refugos:listar", busca, pagina, limite),

    editarCompleto: (
      id: number,
      matricula: string,
      turno: string,
      quantidadeProduzida: number,
      observacao: string | undefined,
      itens: { id: number; defeitoId: number; quantidade: number }[]
    ) =>
      ipcRenderer.invoke(
        "refugos:editar-completo",
        id,
        matricula,
        turno,
        quantidadeProduzida,
        observacao,
        itens
      ),

    cancelar: (id: number, motivo: string) =>
      ipcRenderer.invoke("refugos:cancelar", id, motivo),

    imprimir: (id: number) =>
      ipcRenderer.invoke("refugos:imprimir", id),

    resultados: (filtros: {
      dataInicio?: string
      dataFim?: string
      setorId?: number | null
      subsetorId?: number | null
      postoId?: number | null
      circuitoId?: number | null
    }) => ipcRenderer.invoke("refugos:resultados", filtros),
  }, 

  roteiro: {
    listarTodos: () => ipcRenderer.invoke("roteiro:listar-todos"),

    listarCircuitosPorPosto: (postoId: number, busca: string) =>
      ipcRenderer.invoke("roteiro:listar-circuitos-por-posto", postoId, busca),

    listarPorCircuitoEPosto: (circuitoId: number, postoId: number) =>
      ipcRenderer.invoke("roteiro:listar-por-circuito-e-posto", circuitoId, postoId),

    adicionar: (
      circuitoId: number,
      postoId: number,
      componenteId: number,
      quantidade: number
    ) =>
      ipcRenderer.invoke(
        "roteiro:adicionar",
        circuitoId,
        postoId,
        componenteId,
        quantidade
      ),

    editarQuantidade: (id: number, quantidade: number) =>
      ipcRenderer.invoke("roteiro:editar-quantidade", id, quantidade),

    remover: (id: number) => ipcRenderer.invoke("roteiro:remover", id)
  },

  usuarios: {
    listar: () => ipcRenderer.invoke("usuarios:listar"),

    criar: (input: {
      nome: string
      matricula: string
      perfil: string
      senha?: string
    }) => ipcRenderer.invoke("usuarios:criar", input),

    editar: (
      id: number,
      input: {
        nome: string
        matricula: string
        perfil: string
        senha?: string
      }
    ) => ipcRenderer.invoke("usuarios:editar", id, input),

    excluir: (id: number) => ipcRenderer.invoke("usuarios:excluir", id),

    ativar: (id: number) => ipcRenderer.invoke("usuarios:ativar", id)
  },

  importacao: {
    baixarModelo: (tipo: string) =>
      ipcRenderer.invoke("importacao:baixar-modelo", tipo),

    importar: (tipo: string) =>
      ipcRenderer.invoke("importacao:importar", tipo)
  },

  resultados: (filtros: {
  dataInicio?: string
  dataFim?: string
  setorId?: number | null
  subsetorId?: number | null
  postoId?: number | null
  circuitoId?: number | null
  }) => ipcRenderer.invoke("refugos:resultados", filtros),

  exportacaoDados: {
    refugosCsv: (filtros: { dataInicio: string; dataFim: string }) =>
      ipcRenderer.invoke("exportacao:refugos-csv", filtros)
  },

  configuracao: {
    carregarBanco: () =>
      ipcRenderer.invoke("configuracao:banco-carregar"),

    salvarBanco: (config: {
      provider: "sqlite" | "postgres"
      postgres: {
        host: string
        port: number
        database: string
        user: string
        password: string
      }
    }) =>
      ipcRenderer.invoke("configuracao:banco-salvar", config),

    testarPostgres: (config: {
      host: string
      port: number
      database: string
      user: string
      password: string
    }) =>
      ipcRenderer.invoke("configuracao:postgres-testar", config)
  },
})