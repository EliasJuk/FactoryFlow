import { useNavigate } from "react-router-dom"

type PageHeaderProps = {
  title: string
  subtitle?: string
  backTo?: string
}

function PageHeader({ title, subtitle, backTo = "/dashboard" }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="border-b bg-white px-8 py-5">
      <button
        onClick={() => navigate(backTo)}
        className="mb-4 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        ← Voltar
      </button>

      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>

      {subtitle && (
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      )}
    </header>
  )
}

export default PageHeader