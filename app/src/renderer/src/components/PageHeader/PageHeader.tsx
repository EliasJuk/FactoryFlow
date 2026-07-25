import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type PageHeaderProps = {
  title: string
  subtitle?: string
  backTo?: string
}

function PageHeader({ title, subtitle, backTo = '/dashboard' }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="border-b border-slate-300 bg-white px-5 py-4 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-slate-700 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={17} />
          Voltar
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>

          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
    </header>
  )
}

export default PageHeader
