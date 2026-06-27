import { contextBridge, ipcRenderer } from "electron"

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

})