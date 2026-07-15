import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

export function ProtectedRoute() {
  const { usuario } = useApp()

  if (!usuario.id) {
    return <Navigate to="/" replace />
  }

  if (usuario.deveTrocarSenha) {
    return <Navigate to="/trocar-senha" replace />
  }

  return <Outlet />
}
