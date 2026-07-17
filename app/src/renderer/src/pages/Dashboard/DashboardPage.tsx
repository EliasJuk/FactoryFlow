import { useNavigate } from 'react-router-dom'

import { APP } from '../../config/app'
import { useApp } from '../../contexts/AppContext'
import { ui } from '../../theme/ui'

import {
  Package,
  Boxes,
  Recycle,
  ClipboardList,
  Building2,
  Route,
  AlertTriangle,
  MapPinned,
  Layers3,
  Settings,
  Users,
  Upload,
  BarChart3,
  FileDown,
  Workflow,
  ListChecks
} from 'lucide-react'

type DashboardCardProps = {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
}

function DashboardCard({ title, description, icon, onClick }: DashboardCardProps) {
  return (
    <button onClick={onClick} className={ui.dashboardCard}>
      <div className={ui.dashboardCardIcon}>{icon}</div>

      <div>
        <div className={ui.dashboardCardTitle}>{title}</div>
        <div className={ui.dashboardCardDescription}>{description}</div>
      </div>
    </button>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const { usuario } = useApp()
  const perfil = usuario.perfil?.toUpperCase()
  const podeVerAdministracao = perfil !== 'OPERADOR'

  return (
    <main className={ui.page}>
      <header className={ui.dashboardHeader}>
        <h1 className={ui.dashboardTitle}>{APP.name}</h1>
      </header>

      <div className={ui.dashboardUserBar}>
        Olá, <span className="font-semibold">{usuario.nome}</span>
      </div>

      <section className="p-6">
        <div className={ui.dashboardGroup}>
          <h2 className={ui.dashboardGroupTitle}>Operação</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <DashboardCard
              title="Lançar Refugo"
              description="Registrar novos refugos"
              icon={<Recycle size={24} />}
              onClick={() => navigate('/lancar-refugo')}
            />

            <DashboardCard
              title="Ver Lançamentos"
              description="Consultar registros"
              icon={<ClipboardList size={24} />}
              onClick={() => navigate('/ver-lancamentos')}
            />

            <DashboardCard
              title="Ver Resultados"
              description="Indicadores e gráficos"
              icon={<BarChart3 size={24} />}
              onClick={() => navigate('/resultados')}
            />
          </div>
        </div>
        {podeVerAdministracao && (
          <>
            {/* PROCESSO PRODUTIVO */}
            <div className="mt-6 space-y-3">
              <h2 className={ui.dashboardGroupTitle}>PROCESSO PRODUTIVO</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <DashboardCard
                  title="Defeitos"
                  description="Códigos de defeito"
                  icon={<AlertTriangle size={24} />}
                  onClick={() => navigate('/defeitos')}
                />
                <DashboardCard
                  title="Defeitos por Posto"
                  description="Definir defeitos permitidos em cada posto"
                  icon={<ListChecks size={24} />}
                  onClick={() => navigate('/defeitos-por-posto')}
                />
                <DashboardCard
                  title="Componentes"
                  description="Cadastrar componentes"
                  icon={<Package size={24} />}
                  onClick={() => navigate('/componentes')}
                />
                <DashboardCard
                  title="Circuitos"
                  description="Cadastrar circuitos"
                  icon={<Boxes size={24} />}
                  onClick={() => navigate('/circuitos')}
                />
                <DashboardCard
                  title="Composição de Circuitos"
                  description="Gerenciar componentes dos circuitos"
                  icon={<Workflow size={24} />}
                  onClick={() => navigate('/composicao-circuitos')}
                />
                <DashboardCard
                  title="Roteiro"
                  description="Roteiros dos postos de trabalho"
                  icon={<Route size={24} />}
                  onClick={() => navigate('/roteiro')}
                />
              </div>
            </div>

            {/*ESTRUTURA DA FABRICA*/}
            <div className="mt-6 space-y-3">
              <h2 className={ui.dashboardGroupTitle}>ESTRUTURA DA FABRICA</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <DashboardCard
                  title="Setores"
                  description="Cadastrar setores"
                  icon={<Building2 size={24} />}
                  onClick={() => navigate('/setores')}
                />
                <DashboardCard
                  title="Subsetores"
                  description="Cadastrar subsetores"
                  icon={<Layers3 size={24} />}
                  onClick={() => navigate('/subsetores')}
                />
                <DashboardCard
                  title="Postos de Trabalho"
                  description="gerenciar Postos de trabalho"
                  icon={<MapPinned size={24} />}
                  onClick={() => navigate('/postos')}
                />
              </div>
            </div>

            {/**/}
            <div className="mt-6 space-y-3">
              <h2 className={ui.dashboardGroupTitle}>Demais cadastros</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <DashboardCard
                  title="Usuários"
                  description="Perfis e acessos"
                  icon={<Users size={24} />}
                  onClick={() => navigate('/usuarios')}
                />
                <DashboardCard
                  title="Configurações"
                  description="Sistema e impressão"
                  icon={<Settings size={24} />}
                  onClick={() => navigate('/configuracoes')}
                />
                <DashboardCard
                  title="Importação de Dados"
                  description="Importar cadastros por modelos CSV."
                  icon={<Upload size={24} />}
                  onClick={() => navigate('/importacao')}
                />
                <DashboardCard
                  title="Exportação de Dados"
                  description="Gerar CSV para SAP e Power BI"
                  icon={<FileDown size={24} />}
                  onClick={() => navigate('/exportacao')}
                />
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default DashboardPage
