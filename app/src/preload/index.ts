import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("api", {
  setores: {
    listar: () => ipcRenderer.invoke("setores:listar"),
    criar: (nome: string) => ipcRenderer.invoke("setores:criar", nome),
    editar: (id: number, nome: string) =>
      ipcRenderer.invoke("setores:editar", id, nome),
    excluir: (id: number) => ipcRenderer.invoke("setores:excluir", id)
  }
})