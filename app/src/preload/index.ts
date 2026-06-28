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
  setores: {
    listar: () => ipcRenderer.invoke("setores:listar"),
    criar: (nome: string) => ipcRenderer.invoke("setores:criar", nome),
    editar: (id: number, nome: string) =>
      ipcRenderer.invoke("setores:editar", id, nome),
    excluir: (id: number) => ipcRenderer.invoke("setores:excluir", id)
  },

subsetores: {
  listar: () => ipcRenderer.invoke("subsetores:listar"),
  criar: (nome: string, setorId: number) =>
    ipcRenderer.invoke("subsetores:criar", nome, setorId),
  editar: (id: number, nome: string, setorId: number) =>
    ipcRenderer.invoke("subsetores:editar", id, nome, setorId),
  excluir: (id: number) =>
    ipcRenderer.invoke("subsetores:excluir", id)
},

  componentes: {
    listar: () => ipcRenderer.invoke("componentes:listar"),
    criar: (codigo: string, nome: string) =>
      ipcRenderer.invoke("componentes:criar", codigo, nome),
    editar: (id: number, codigo: string, nome: string) =>
      ipcRenderer.invoke("componentes:editar", id, codigo, nome),
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
    excluir: (id: number) => ipcRenderer.invoke("postos:excluir", id)
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
      ipcRenderer.invoke("refugos:imprimir", id)
  }, 

  roteiro: {
    listarTodos: () => ipcRenderer.invoke("roteiro:listar-todos"),

    listarPorCircuitoEPosto: (circuitoId: number, postoId: number) =>
      ipcRenderer.invoke(
        "roteiro:listar-por-circuito-e-posto",
        circuitoId,
        postoId
      ),

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

    remover: (id: number) => ipcRenderer.invoke("roteiro:remover", id),

    listar: (busca: string, limite: number) =>
    ipcRenderer.invoke("refugos:listar", busca, limite)
  },
})