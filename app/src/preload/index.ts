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

  
})