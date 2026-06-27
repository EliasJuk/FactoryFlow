import { createContext, ReactNode, useContext, useState } from "react"

type PerfilUsuario = "OPERADOR" | "QUALIDADE" | "ADMIN"

type Usuario = {
  nome: string
  matricula: string
  perfil: PerfilUsuario
}

type AppContextData = {
  usuario: Usuario
  setorSelecionado: string
  subsetorSelecionado: string
  alterarSetor: (setor: string) => void
  alterarSubsetor: (subsetor: string) => void
}

const AppContext = createContext<AppContextData | undefined>(undefined)

type AppProviderProps = {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [usuario] = useState<Usuario>({
    nome: "Usuário Teste",
    matricula: "000000",
    perfil: "ADMIN"
  })

  const [setorSelecionado, setSetorSelecionado] = useState("SETOR-1")
  const [subsetorSelecionado, setSubsetorSelecionado] = useState("SUB-SETOR A")

  function alterarSetor(setor: string) {
    setSetorSelecionado(setor)
  }

  function alterarSubsetor(subsetor: string) {
    setSubsetorSelecionado(subsetor)
  }

  return (
    <AppContext.Provider
      value={{
        usuario,
        setorSelecionado,
        subsetorSelecionado,
        alterarSetor,
        alterarSubsetor
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error("useApp deve ser usado dentro de AppProvider")
  }

  return context
}