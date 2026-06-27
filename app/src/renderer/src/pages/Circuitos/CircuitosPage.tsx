import { useNavigate } from "react-router-dom"

function CircuitosPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-6 rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-800"
      >
        ← Voltar
      </button>

      <h1 className="text-3xl font-bold">Cadastrar um circuito</h1>
    </main>
  )
}

export default CircuitosPage