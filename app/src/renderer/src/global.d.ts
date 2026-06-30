export {}

type SetorApi = {
  id: number
  nome: string
  sigla: string
  ativo: boolean
}

type CircuitoApi = {
  id: number
  codigo: string
  nome: string
  ativo: boolean
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
  nome: string
  subsetorId: number
  subsetorNome: string
  setorNome: string
  ativo: boolean
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
  nome: string
  matricula: string
  perfil: string
  ativo: boolean
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
    defeitoMaisComum: string
    circuitoMaisCritico: string
  }
  topDefeitos: ResultadoItemApi[]
  topSetores: ResultadoItemApi[]
  topPostos: ResultadoItemApi[]
  topComponentes: ResultadoItemApi[]
}

type ComponenteApi = {
  id: number
  codigo: string
  nome: string
  precoAtual: number
  ativo: boolean
}

declare global {
  interface Window {
    api: {
      setores: {
        listar: () => Promise<SetorApi[]>
        criar: (nome: string, sigla: string) => Promise<void>
        editar: (id: number, nome: string, sigla: string) => Promise<void>
        excluir: (id: number) => Promise<void>
        contarSubsetoresAtivos: (id: number) => Promise<number>
      },

      subsetores: {
        listar: () => Promise<SubsetorApi[]>
        criar: (nome: string, setorId: number) => Promise<void>
        editar: (id: number, nome: string, setorId: number) => Promise<void>
        contarPostosAtivos: (id: number) => Promise<number>
        excluir: (id: number) => Promise<void>
      },

      componentes: {
        listar: () => Promise<ComponenteApi[]>
        criar: (codigo: string, nome: string, precoAtual: number) => Promise<void>
        editar: (
          id: number,
          codigo: string,
          nome: string,
          precoAtual: number
        ) => Promise<void>
        excluir: (id: number) => Promise<void>
      },

      circuitos: {
        listar: () => Promise<CircuitoApi[]>
        criar: (codigo: string, nome: string) => Promise<void>
        editar: (id: number, codigo: string, nome: string) => Promise<void>
        excluir: (id: number) => Promise<void>
      },

      circuitoComponentes: {
        listarPorCircuito: (circuitoId: number) => Promise<CircuitoComponenteApi[]>
        adicionar: (
          circuitoId: number,
          componenteId: number,
          quantidade: number
        ) => Promise<void>
        remover: (id: number) => Promise<void>
      },

      postos: {
        listar: () => Promise<PostoApi[]>
        criar: (nome: string, subsetorId: number) => Promise<void>
        editar: (id: number, nome: string, subsetorId: number) => Promise<void>
        contarRoteirosAtivos: (id: number) => Promise<number>
        excluir: (id: number) => Promise<void>
      },

      defeitos: {
        listar: () => Promise<DefeitoApi[]>
        criar: (codigo: string, descricao: string) => Promise<void>
        editar: (id: number, codigo: string, descricao: string) => Promise<void>
        excluir: (id: number) => Promise<void>
      },

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

        listarCircuitosPorPosto: (
          postoId: number,
          busca: string
        ) => Promise<CircuitoPorPostoApi[]>

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
      },

      usuarios: {
        listar: () => Promise<UsuarioApi[]>

        criar: (input: {
          nome: string
          matricula: string
          perfil: string
          senha?: string
        }) => Promise<void>

        editar: (
          id: number,
          input: {
            nome: string
            matricula: string
            perfil: string
            senha?: string
          }
        ) => Promise<void>

        excluir: (id: number) => Promise<void>
        ativar: (id: number) => Promise<void>
      },

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
      },

      exportacaoDados: {
        refugosCsv: (filtros: {
          dataInicio: string
          dataFim: string
        }) => Promise<{
          sucesso: boolean
          mensagem: string
        }>
      },
    }
  }
}