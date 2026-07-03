import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { APP } from "../../config/app"
import Button from "../../components/Button/Button"
import Input from "../../components/Input/Input"

function LoginPage() {
  const navigate = useNavigate()

  const [isReady, setIsReady] = useState(false)
  const [message, setMessage] = useState("Inicializando sistema...")
  const [progress, setProgress] = useState(10)
  const [error, setError] = useState("")

  useEffect(() => {
    window.api.app.onStartupProgress((data) => {
      setMessage(data.message)
      setProgress(data.progress)
    })

    window.api.app.onReady(() => {
      setIsReady(true)
      setMessage("Sistema pronto para uso")
      setProgress(100)
    })

    window.api.app.onStartupError((data) => {
      setError(data.message)
    })

    window.api.app.isReady().then((ready) => {
      setIsReady(ready)

      if (ready) {
        setMessage("Sistema pronto para uso")
        setProgress(100)
      }
    })
  }, [])


  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-sm">
        {/* Logo Centralizado */}
        <div className="mb-10 flex flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600 text-3xl font-bold text-white shadow-lg shadow-orange-900/20">
            F
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">{APP.name}</h1>
            <p className="text-slate-400">Sistema industrial de gestão</p>
          </div>
        </div>

        {/* Card de Login */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-7">
            <p className="text-sm font-medium text-orange-500">Acesso ao sistema</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Entrar</h2>
            <p className="mt-2 text-sm text-slate-400">Informe sua matrícula e senha.</p>
          </div>

          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault()
              if (!isReady) return
              navigate("/dashboard")
            }}
          >
            <Input label="Matrícula" placeholder="Digite sua matrícula" disabled={!isReady} />
            <Input label="Senha" type="password" placeholder="Digite sua senha" disabled={!isReady} />

            <div className="space-y-2 rounded-2xl bg-slate-950 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{message}</span>
                <span className="font-semibold text-orange-500">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-orange-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-900/30 bg-red-950/20 px-3 py-2 text-center text-sm text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" disabled={!isReady}>
              {isReady ? "Entrar" : "Aguarde..."}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            <p>Versão 1.4.0</p>
            <p>Desenvolvido por EliasJuk</p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default LoginPage