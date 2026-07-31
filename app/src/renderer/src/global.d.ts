import type { PerfilUsuario } from './models/Usuario'
import type {
  ResultadoImportacaoApi,
  ResultadoOperacaoImportacaoApi,
  ResultadoPreVisualizacaoApi,
  TipoImportacao
} from './pages/Importacao/importacao.types'

export {}

type SetorApi = {
  id: number
  uuid: string
  nome: string
  sigla: string
  ativo: boolean

  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null

  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null

  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}

type SubsetorApi = {
  id: number
  uuid: string
  nome: string
  setorId: number
  setorNome: string
  ativo: boolean

  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null

  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null

  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}

type CircuitoApi = {
  id: number
  uuid: string
  codigo: string
  nome: string
  ativo: boolean
  totalComponentes: number

  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null

  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null

  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}

type CircuitoComponenteApi = {
  id: number
  uuid: string
  circuitoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean

  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null

  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null

  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}

type PostoApi = {
  id: number
  uuid: string
  nome: string
  subsetorId: number
  subsetorNome: string
  setorNome: string
  ativo: boolean

  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null

  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null

  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}

type PostoDefeitoApi = {
  id: number
  uuid: string
  postoId: number
  defeitoId: number
  codigoDefeito: string
  descricaoDefeito: string
  ativo: boolean
  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null
  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null
  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}

type DefeitoApi = {
  id: number
  uuid: string
  codigo: string
  descricao: string
  ativo: boolean

  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null

  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null

  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}

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

type RoteiroComponenteApi = {
  id: number
  uuid: string
  circuitoId: number
  postoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean

  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null

  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null

  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}

type RefugoListagemApi = {
  id: number
  uuid: string
  numeroRefugo: string
  dataHora: string
  turno: string
  matriculaOperador: string
  quantidadeProduzida: number
  observacao?: string | null
  status: string
  motivoCancelamento?: string | null

  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null
  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null
  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null

  setorNome: string
  subsetorNome: string
  postoNome: string
  circuitoCodigo: string
  circuitoNome: string

  itens: {
    id: number
    uuid: string
    defeitoId: number
    componenteCodigo: string
    componenteNome: string
    defeitoCodigo: string
    defeitoDescricao: string
    quantidadeRefugada: number
    createdAt?: string | null
    updatedAt?: string | null
    deletedAt?: string | null
    createdBy?: number | null
    updatedBy?: number | null
    deletedBy?: number | null
  }[]
}

type UsuarioApi = {
  id: number
  uuid: string

  nome: string
  matricula: string
  perfil: PerfilUsuario
  ativo: boolean

  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null

  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null

  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}

type CircuitoPorPostoApi = {
  circuitoId: number
  codigoCircuito: string
  nomeCircuito: string
  postoId: number
  postoNome: string
  subsetorNome: string
  totalComponentes: number
}

type ResultadoFiltrosApi = {
  dataInicio?: string
  dataFim?: string
  setorId?: number | null
  subsetorId?: number | null
  postoId?: number | null
  circuitoId?: number | null
}

type ResultadoItemApi = {
  nome: string
  total: number
}

type ResultadosApi = {
  resumo: {
    totalLancamentos: number
    totalPecasRefugadas: number
    custoTotalRefugo: number
    defeitoMaisComum: string
    circuitoMaisCritico: string
    turnoMaisCritico: string
  }
  custoPorDiaTurno: {
    dia: string
    turnoA: number
    turnoB: number
    turnoC: number
    total: number
  }[]
  custoPorTurno: ResultadoItemApi[]
  topDefeitos: ResultadoItemApi[]
  topSetores: ResultadoItemApi[]
  topPostos: ResultadoItemApi[]
  topComponentes: ResultadoItemApi[]
  topCustoComponentes: ResultadoItemApi[]
}

type ComponenteApi = {
  id: number
  uuid: string
  codigo: string
  nome: string
  precoAtual: number
  ativo: boolean

  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null

  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null

  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}

declare global {
  interface Window {
    api: {
      app: {
        isReady: () => Promise<boolean>
        onStartupProgress: (callback: (data: { message: string; progress: number }) => void) => void
        onReady: (callback: () => void) => void
        onStartupError: (callback: (data: { message: string }) => void) => void
      }

      auth: {
        login: (
          matricula: string,
          senha: string
        ) => Promise<{
          sucesso: boolean
          mensagem: string
          usuario?: {
            id: number
            nome: string
            matricula: string
            perfil: string
            deveTrocarSenha: boolean
          }
        }>

        sessaoAtual: () => Promise<{
          id: number
          nome: string
          matricula: string
          perfil: PerfilUsuario
          deveTrocarSenha: boolean
        } | null>

        logout: () => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        solicitarRedefinicao: (matricula: string) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        alterarSenhaObrigatoria: (
          senhaAtual: string,
          novaSenha: string
        ) => Promise<{
          sucesso: boolean
          mensagem: string
        }>
      }

      setores: {
        listar: () => Promise<SetorApi[]>

        criar: (
          nome: string,
          sigla: string
        ) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        editar: (
          id: number,
          nome: string,
          sigla: string
        ) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        excluir: (id: number) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        contarSubsetoresAtivos: (id: number) => Promise<number>

        listarInativos: () => Promise<SetorApi[]>

        restaurar: (id: number) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        excluirPermanente: (id: number) => Promise<{
          sucesso: boolean
          mensagem: string
        }>
      }

      subsetores: {
        listar: () => Promise<SubsetorApi[]>

        criar: (nome: string, setorId: number) => Promise<{ sucesso: boolean; mensagem: string }>

        editar: (
          id: number,
          nome: string,
          setorId: number
        ) => Promise<{ sucesso: boolean; mensagem: string }>

        contarPostosAtivos: (id: number) => Promise<number>

        excluir: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>

        listarInativos: () => Promise<SubsetorApi[]>

        restaurar: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>

        excluirPermanente: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>
      }

      componentes: {
        listar: () => Promise<ComponenteApi[]>
        listarInativos: () => Promise<ComponenteApi[]>

        criar: (
          codigo: string,
          nome: string,
          precoAtual: number
        ) => Promise<{ sucesso: boolean; mensagem: string }>

        editar: (
          id: number,
          codigo: string,
          nome: string,
          precoAtual: number
        ) => Promise<{ sucesso: boolean; mensagem: string }>

        excluir: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>

        restaurar: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>

        excluirPermanente: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>
      }

      circuitos: {
        listar: () => Promise<CircuitoApi[]>
        listarInativos: () => Promise<CircuitoApi[]>

        criar: (
          codigo: string,
          nome: string,
          usuarioId: number
        ) => Promise<{ sucesso: boolean; mensagem: string }>

        editar: (
          id: number,
          codigo: string,
          nome: string,
          usuarioId: number
        ) => Promise<{ sucesso: boolean; mensagem: string }>

        excluir: (id: number, usuarioId: number) => Promise<{ sucesso: boolean; mensagem: string }>
        restaurar: (
          id: number,
          usuarioId: number
        ) => Promise<{ sucesso: boolean; mensagem: string }>
        excluirPermanente: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>
      }

      circuitoComponentes: {
        listarPorCircuito: (circuitoId: number) => Promise<CircuitoComponenteApi[]>
        adicionar: (
          circuitoId: number,
          componenteId: number,
          quantidade: number,
          usuarioId: number
        ) => Promise<
          | {
              sucesso: true
              mensagem: string
            }
          | {
              sucesso: false
              codigo: 'QUANTIDADE_INVALIDA' | 'COMPONENTE_JA_VINCULADO'
              mensagem: string
            }
        >
        editarQuantidade: (id: number, quantidade: number, usuarioId: number) => Promise<void>
        remover: (id: number, usuarioId: number) => Promise<void>
        restaurar: (id: number, usuarioId: number) => Promise<void>
      }

      postos: {
        listar: () => Promise<PostoApi[]>

        criar: (
          nome: string,
          subsetorId: number
        ) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        editar: (
          id: number,
          nome: string,
          subsetorId: number
        ) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        contarRoteirosAtivos: (id: number) => Promise<number>

        excluir: (id: number) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        listarInativos: () => Promise<PostoApi[]>

        restaurar: (id: number) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        excluirPermanente: (id: number) => Promise<{
          sucesso: boolean
          mensagem: string
        }>
      }

      postoDefeitos: {
        listarPorPosto: (postoId: number, incluirInativos?: boolean) => Promise<PostoDefeitoApi[]>
        listarPermitidosPorPosto: (postoId: number) => Promise<PostoDefeitoApi[]>
        adicionar: (
          postoId: number,
          defeitoId: number,
          usuarioId: number
        ) => Promise<
          | { sucesso: true; mensagem: string }
          | { sucesso: false; codigo: 'DEFEITO_JA_VINCULADO'; mensagem: string }
        >
        remover: (id: number, usuarioId: number) => Promise<void>
        restaurar: (id: number, usuarioId: number) => Promise<void>
      }

      defeitos: {
        listar: () => Promise<DefeitoApi[]>

        criar: (
          codigo: string,
          descricao: string,
          usuarioId: number
        ) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        editar: (
          id: number,
          codigo: string,
          descricao: string,
          usuarioId: number
        ) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        excluir: (id: number, usuarioId: number) => Promise<{ sucesso: boolean; mensagem: string }>

        listarInativos: () => Promise<DefeitoApi[]>

        restaurar: (
          id: number,
          usuarioId: number
        ) => Promise<{ sucesso: boolean; mensagem: string }>

        excluirPermanente: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>
      }

      refugos: {
        criar: (input: RefugoInput) => Promise<string>

        listar: (
          busca: string,
          pagina: number,
          limite: number
        ) => Promise<{
          dados: RefugoListagemApi[]
          totalRegistros: number
          totalPaginas: number
        }>

        editarCompleto: (
          id: number,
          matricula: string,
          turno: string,
          quantidadeProduzida: number,
          observacao: string | undefined,
          itens: { id: number; defeitoId: number; quantidade: number }[],
          usuarioId: number
        ) => Promise<void>

        cancelar: (id: number, motivo: string, usuarioId: number) => Promise<void>

        imprimir: (id: number) => Promise<void>

        resultados: (filtros: ResultadoFiltrosApi) => Promise<ResultadosApi>
      }

      roteiro: {
        listarTodos: () => Promise<RoteiroComponenteApi[]>

        listarCircuitosPorPosto: (postoId: number, busca: string) => Promise<CircuitoPorPostoApi[]>

        listarPorCircuitoEPosto: (
          circuitoId: number,
          postoId: number
        ) => Promise<RoteiroComponenteApi[]>

        adicionar: (
          circuitoId: number,
          postoId: number,
          componenteId: number,
          quantidade: number,
          usuarioId: number
        ) => Promise<void>

        editarQuantidade: (id: number, quantidade: number, usuarioId: number) => Promise<void>

        remover: (id: number, usuarioId: number) => Promise<void>
      }

      usuarios: {
        listar: () => Promise<UsuarioApi[]>

        listarInativos: () => Promise<UsuarioApi[]>

        criar: (input: {
          nome: string
          matricula: string
          perfil: string
          senha?: string
        }) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        editar: (
          id: number,
          input: {
            nome: string
            matricula: string
            perfil: string
            senha?: string
          }
        ) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        excluir: (id: number) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        ativar: (id: number) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        remover: (id: number) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        listarSolicitacoesSenha: () => Promise<
          {
            id: number
            uuid: string
            usuarioId: number
            usuarioNome: string
            usuarioMatricula: string
            status: 'PENDENTE' | 'ATENDIDA' | 'CANCELADA'
            solicitadoEm: string
            atendidoEm: string | null
            canceladoEm: string | null
            atendidoPor: number | null
            atendidoPorNome: string | null
            canceladoPor: number | null
            canceladoPorNome: string | null
          }[]
        >

        atenderSolicitacaoSenha: (solicitacaoId: number) => Promise<{
          sucesso: boolean
          mensagem: string
          senhaTemporaria?: string
        }>

        cancelarSolicitacaoSenha: (solicitacaoId: number) => Promise<{
          sucesso: boolean
          mensagem: string
        }>
      }

      importacao: {
        baixarModelo: (tipo: TipoImportacao) => Promise<ResultadoOperacaoImportacaoApi>

        importar: (tipo: TipoImportacao) => Promise<ResultadoImportacaoApi>

        preVisualizar: (tipo: TipoImportacao) => Promise<ResultadoPreVisualizacaoApi>

        importarRegistros: (
          tipo: TipoImportacao,
          registros: Record<string, string>[]
        ) => Promise<ResultadoImportacaoApi>
      }

      exportacaoDados: {
        refugosCsv: (filtros: { dataInicio: string; dataFim: string }) => Promise<{
          sucesso: boolean
          mensagem: string
        }>
      }

      configuracao: {
        carregarBanco: () => Promise<{
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
        }>

        salvarBanco: (config: {
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
        }) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        testarPostgres: (config: {
          host: string
          port: number
          database: string
          user: string
          password?: string
          passwordConfigured: boolean
          clearPassword?: boolean
          timeoutSeconds: number
          ssl: boolean
        }) => Promise<{
          sucesso: boolean
          mensagem: string
        }>
      }
    }
  }
}
