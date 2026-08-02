import { HashRouter, Route, Routes } from 'react-router-dom'

import LoginPage from '../pages/Login/LoginPage'
import DashboardPage from '../pages/Dashboard/DashboardPage'

import LancarRefugoPage from '../pages/LancarRefugo/LancarRefugoPage'
import VerLancamentosPage from '../pages/VerLancamentos/VerLancamentosPage'
import ComponentesPage from '../pages/Componentes/ComponentesPage'
import CircuitosPage from '../pages/Circuitos/CircuitosPage'
import ComposicaoCircuitosPage from '../pages/ComposicaoCircuitos/ComposicaoCircuitosPage'
import DefeitosPage from '../pages/Defeitos/DefeitosPage'
import DefeitosPorPostoPage from '../pages/DefeitosPorPosto/DefeitosPorPostoPage'

import SetoresPage from '../pages/Setores/SetoresPage'
import Subsetores from '../pages/Subsetores/SubsetoresPage'
import Postos from '../pages/Postos/PostosPage'
import RoteiroPage from '../pages/Roteiro/RoteiroPage'
import UsuariosPage from '../pages/Usuarios/UsuariosPage'
import ImportacaoPage from '../pages/Importacao/ImportacaoPage'
import ResultadosPage from '../pages/Resultados/ResultadosPage'
import ExportacaoPage from '../pages/Exportacao/ExportacaoPage'
import ConfiguracoesPage from '../pages/Configuracoes/ConfiguracoesPage'
import TrocarSenhaPage from '../pages/TrocarSenha/TrocarSenhaPage'
import ConfiguracaoInicialPage from '../pages/ConfiguracaoInicial/ConfiguracaoInicialPage'
import { ProtectedRoute } from './ProtectedRoute'

function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/configuracao-inicial" element={<ConfiguracaoInicialPage />} />
        <Route path="/trocar-senha" element={<TrocarSenhaPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/lancar-refugo" element={<LancarRefugoPage />} />
          <Route path="/ver-lancamentos" element={<VerLancamentosPage />} />
          <Route path="/componentes" element={<ComponentesPage />} />
          <Route path="/circuitos" element={<CircuitosPage />} />
          <Route path="/composicao-circuitos" element={<ComposicaoCircuitosPage />} />
          <Route path="/defeitos" element={<DefeitosPage />} />
          <Route path="/defeitos-por-posto" element={<DefeitosPorPostoPage />} />
          <Route path="/setores" element={<SetoresPage />} />
          <Route path="/subSetores" element={<Subsetores />} />
          <Route path="/postos" element={<Postos />} />
          <Route path="/roteiro" element={<RoteiroPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/importacao" element={<ImportacaoPage />} />
          <Route path="/resultados" element={<ResultadosPage />} />
          <Route path="/exportacao" element={<ExportacaoPage />} />
          <Route element={<ProtectedRoute perfisPermitidos={['ADMIN']} />}>
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default AppRoutes
