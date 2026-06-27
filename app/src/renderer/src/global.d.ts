export {}

type SetorApi = {
  id: number
  nome: string
  ativo: boolean
}

declare global {
  interface Window {
    api: {
      setores: {
        listar: () => Promise<SetorApi[]>
        criar: (nome: string) => Promise<void>
        editar: (id: number, nome: string) => Promise<void>
        excluir: (id: number) => Promise<void>
      }
    }
  }
}