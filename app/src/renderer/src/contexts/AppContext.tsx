import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'

export type PerfilUsuario = 'OPERADOR' | 'TECNICO' | 'LIDER' | 'SUPERVISOR' | 'QUALIDADE' | 'ADMIN'

export type Usuario = {
  id?: number
  nome: string
  matricula: string
  perfil: PerfilUsuario
  deveTrocarSenha?: boolean
}

type AppContextData = {
  usuario: Usuario
  sessaoCarregada: boolean
  definirUsuario: (usuario: Usuario) => void
  limparUsuario: () => void
  atualizarTrocaSenha: (deveTrocarSenha: boolean) => void
  setorSelecionado: string
  subsetorSelecionado: string
  alterarSetor: (setor: string) => void
  alterarSubsetor: (subsetor: string) => void
}

const usuarioPadrao: Usuario = {
  nome: '',
  matricula: '',
  perfil: 'OPERADOR',
  deveTrocarSenha: false
}

const AppContext = createContext<AppContextData | undefined>(undefined)

type AppProviderProps = {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [usuario, setUsuario] = useState<Usuario>(usuarioPadrao)
  const [sessaoCarregada, setSessaoCarregada] = useState(false)
  const [setorSelecionado, setSetorSelecionado] = useState('SETOR-1')
  const [subsetorSelecionado, setSubsetorSelecionado] = useState('SUB-SETOR A')

  useEffect(() => {
    let ativo = true

    void window.api.auth
      .sessaoAtual()
      .then((sessao) => {
        if (!ativo) return

        if (!sessao) {
          setUsuario(usuarioPadrao)
          return
        }

        setUsuario({
          ...sessao,
          perfil: sessao.perfil as PerfilUsuario
        })
      })
      .catch(() => {
        if (ativo) {
          setUsuario(usuarioPadrao)
        }
      })
      .finally(() => {
        if (ativo) {
          setSessaoCarregada(true)
        }
      })

    return () => {
      ativo = false
    }
  }, [])

  function definirUsuario(novoUsuario: Usuario) {
    setUsuario(novoUsuario)
    setSessaoCarregada(true)
  }

  function limparUsuario() {
    setUsuario(usuarioPadrao)
    setSessaoCarregada(true)
  }

  function atualizarTrocaSenha(deveTrocarSenha: boolean) {
    setUsuario((atual) => ({
      ...atual,
      deveTrocarSenha
    }))
  }

  return (
    <AppContext.Provider
      value={{
        usuario,
        sessaoCarregada,
        definirUsuario,
        limparUsuario,
        atualizarTrocaSenha,
        setorSelecionado,
        subsetorSelecionado,
        alterarSetor: setSetorSelecionado,
        alterarSubsetor: setSubsetorSelecionado
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider')
  }

  return context
}
