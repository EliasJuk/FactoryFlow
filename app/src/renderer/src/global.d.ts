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
      },

      subsetores: {
        listar: () => Promise<SubsetorApi[]>
        criar: (nome: string, setorId: number) => Promise<void>
        editar: (id: number, nome: string, setorId: number) => Promise<void>
        excluir: (id: number) => Promise<void>
      },

            componentes: {
        listar: () => Promise<ComponenteApi[]>
        criar: (codigo: string, nome: string) => Promise<void>
        editar: (
          id: number,
          codigo: string,
          nome: string
        ) => Promise<void>
        excluir: (id: number) => Promise<void>
      },
      
    }
  }
}