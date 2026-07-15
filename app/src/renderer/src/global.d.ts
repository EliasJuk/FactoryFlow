import type { PerfilUsuario } from './models/Usuario'

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
  codigo: string
  nome: string
  ativo: boolean
  totalComponentes: number
}

type CircuitoComponenteApi = {
  id: number
  circuitoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean
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

type DefeitoApi = {
  id: number
  codigo: string
  descricao: string
  ativo: boolean
}

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

type RoteiroComponenteApi = {
  id: number
  circuitoId: number
  postoId: number
  componenteId: number
  codigoComponente: string
  nomeComponente: string
  quantidade: number
  ativo: boolean
}

type RefugoListagemApi = {
  id: number
  numeroRefugo: string
  dataHora: string
  turno: string
  matriculaOperador: string
  quantidadeProduzida: number
  observacao?: string | null
  status: string
  motivoCancelamento?: string | null

  setorNome: string
  subsetorNome: string
  postoNome: string
  circuitoCodigo: string
  circuitoNome: string

  itens: {
    id: number
    defeitoId: number
    componenteCodigo: string
    componenteNome: string
    defeitoCodigo: string
    defeitoDescricao: string
    quantidadeRefugada: number
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
          }
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

        criar: (codigo: string, nome: string) => Promise<{ sucesso: boolean; mensagem: string }>

        editar: (
          id: number,
          codigo: string,
          nome: string
        ) => Promise<{ sucesso: boolean; mensagem: string }>

        excluir: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>
        restaurar: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>
        excluirPermanente: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>
      }

      circuitoComponentes: {
        listarPorCircuito: (circuitoId: number) => Promise<CircuitoComponenteApi[]>
        adicionar: (circuitoId: number, componenteId: number, quantidade: number) => Promise<void>
        remover: (id: number) => Promise<void>
      }

      postos: {
        listar: () => Promise<PostoApi[]>

        criar: (nome: string, subsetorId: number) => Promise<{ sucesso: boolean; mensagem: string }>

        editar: (
          id: number,
          nome: string,
          subsetorId: number
        ) => Promise<{ sucesso: boolean; mensagem: string }>

        contarRoteirosAtivos: (id: number) => Promise<number>
        excluir: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>
        listarInativos: () => Promise<PostoApi[]>
        restaurar: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>

        excluirPermanente: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>
      }

      defeitos: {
        listar: () => Promise<DefeitoApi[]>
        criar: (
          codigo: string,
          descricao: string
        ) => Promise<{
          sucesso: boolean
          mensagem: string
        }>
        editar: (
          id: number,
          codigo: string,
          descricao: string
        ) => Promise<{
          sucesso: boolean
          mensagem: string
        }>
        excluir: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>
        listarInativos: () => Promise<DefeitoApi[]>
        restaurar: (id: number) => Promise<{ sucesso: boolean; mensagem: string }>
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
          itens: { id: number; defeitoId: number; quantidade: number }[]
        ) => Promise<void>

        cancelar: (id: number, motivo: string) => Promise<void>

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
          quantidade: number
        ) => Promise<void>

        editarQuantidade: (id: number, quantidade: number) => Promise<void>

        remover: (id: number) => Promise<void>
      }

      usuarios: {
        listar: () => Promise<UsuarioApi[]>

        listarInativos: () => Promise<UsuarioApi[]>

        criar: (input: {
          nome: string
          matricula: string
          perfil: string
          senha?: string
          usuarioId?: number
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
            usuarioId?: number
          }
        ) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        excluir: (
          id: number,
          usuarioId?: number
        ) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        ativar: (
          id: number,
          usuarioId?: number
        ) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        remover: (
          id: number,
          usuarioId?: number
        ) => Promise<{
          sucesso: boolean
          mensagem: string
        }>
      }

      importacao: {
        baixarModelo: (tipo: string) => Promise<{
          sucesso: boolean
          mensagem: string
        }>

        importar: (tipo: string) => Promise<{
          sucesso: boolean
          mensagem: string
          inseridos: number
          atualizados: number
          ignorados: number
        }>

        preVisualizar: (tipo: string) => Promise<{
          sucesso: boolean
          mensagem: string
          registros: {
            id: number
            linha: number
            selecionado: boolean
            dados: Record<string, string>
          }[]
        }>

        importarRegistros: (
          tipo: string,
          registros: Record<string, string>[]
        ) => Promise<{
          sucesso: boolean
          mensagem: string
          inseridos: number
          atualizados: number
          ignorados: number
        }>
      }

      exportacaoDados: {
        refugosCsv: (filtros: { dataInicio: string; dataFim: string }) => Promise<{
          sucesso: boolean
          mensagem: string
        }>
      }

      configuracao: {
        carregarBanco: () => Promise<{
          provider: 'sqlite' | 'postgres'
          postgres: {
            host: string
            port: number
            database: string
            user: string
            password: string
          }
        }>

        salvarBanco: (config: {
          provider: 'sqlite' | 'postgres'
          postgres: {
            host: string
            port: number
            database: string
            user: string
            password: string
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
          password: string
        }) => Promise<{
          sucesso: boolean
          mensagem: string
        }>
      }
    }
  }
}
