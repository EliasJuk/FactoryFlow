import { Navigate, Outlet } from 'react-router-dom'

import { useApp } from '../contexts/AppContext'

export function ProtectedRoute() {
  const { usuario, sessaoCarregada } = useApp()

  if (!sessaoCarregada) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Validando sessão...
      </main>
    )
  }

  if (!usuario.id) {
    return <Navigate to="/" replace />
  }

  if (usuario.deveTrocarSenha) {
    return <Navigate to="/trocar-senha" replace />
  }

  return <Outlet />
}
