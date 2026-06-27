import { HashRouter, Route, Routes } from "react-router-dom"

import LoginPage from "../pages/Login/LoginPage"
import DashboardPage from "../pages/Dashboard/DashboardPage"

import LancarRefugoPage from "../pages/LancarRefugo/LancarRefugoPage"
import VerLancamentosPage from "../pages/VerLancamentos/VerLancamentosPage"
import ComponentesPage from "../pages/Componentes/ComponentesPage"
import CircuitosPage from "../pages/Circuitos/CircuitosPage"

function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/lancar-refugo" element={<LancarRefugoPage />} />
        <Route path="/ver-lancamentos" element={<VerLancamentosPage />} />
        <Route path="/componentes" element={<ComponentesPage />} />
        <Route path="/circuitos" element={<CircuitosPage />} />
      </Routes>
    </HashRouter>
  )
}

export default AppRoutes