import { createContext, ReactNode, useContext, useState } from "react"

export type PerfilUsuario =
  | "OPERADOR"
  | "TECNICO"
  | "LIDER"
  | "SUPERVISOR"
  | "QUALIDADE"
  | "ADMIN"

export type Usuario = {
  id?: number
  nome: string
  matricula: string
  perfil: PerfilUsuario
}

type AppContextData = {
  usuario: Usuario
  definirUsuario: (usuario: Usuario) => void
  limparUsuario: () => void
  setorSelecionado: string
  subsetorSelecionado: string
  alterarSetor: (setor: string) => void
  alterarSubsetor: (subsetor: string) => void
}

const usuarioPadrao: Usuario = {
  nome: "",
  matricula: "",
  perfil: "OPERADOR"
}

const AppContext = createContext<AppContextData | undefined>(undefined)

type AppProviderProps = {
  children: ReactNode
}

function carregarUsuarioSalvo(): Usuario {
  try {
    const salvo = localStorage.getItem("factoryflow.usuario")

    if (!salvo) return usuarioPadrao

    return JSON.parse(salvo) as Usuario
  } catch {
    return usuarioPadrao
  }
}

export function AppProvider({ children }: AppProviderProps) {
  const [usuario, setUsuario] = useState<Usuario>(carregarUsuarioSalvo)

  const [setorSelecionado, setSetorSelecionado] = useState("SETOR-1")
  const [subsetorSelecionado, setSubsetorSelecionado] = useState("SUB-SETOR A")

  function definirUsuario(usuario: Usuario) {
    localStorage.setItem("factoryflow.usuario", JSON.stringify(usuario))
    setUsuario(usuario)
  }

  function limparUsuario() {
    localStorage.removeItem("factoryflow.usuario")
    setUsuario(usuarioPadrao)
  }

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
        definirUsuario,
        limparUsuario,
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