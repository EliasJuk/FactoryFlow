import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, Settings } from 'lucide-react'

import { APP } from '../../config/app'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import { useApp, type Usuario } from '../../contexts/AppContext'
import { ForgotPasswordModal } from './components/ForgotPasswordModal'

type StorageMode = 'sqliteSync' | 'api' | 'postgres'

type ConfigBanco = Awaited<ReturnType<typeof window.api.configuracao.carregarBanco>>

function LoginPage() {
  const navigate = useNavigate()

  const [isReady, setIsReady] = useState(false)
  const [message, setMessage] = useState('Inicializando sistema...')
  const [progress, setProgress] = useState(10)
  const [startupError, setStartupError] = useState('')

  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')
  const [erroLogin, setErroLogin] = useState('')
  const [carregandoLogin, setCarregandoLogin] = useState(false)
  const [mostrarEsqueciSenha, setMostrarEsqueciSenha] = useState(false)

  const [configBanco, setConfigBanco] = useState<ConfigBanco | null>(null)
  const [mostrarBanco, setMostrarBanco] = useState(false)
  const [salvandoBanco, setSalvandoBanco] = useState(false)
  const [mensagemBanco, setMensagemBanco] = useState('')
  const { definirUsuario } = useApp()

  async function carregarConfigBanco() {
    const config = await window.api.configuracao.carregarBanco()
    setConfigBanco(config)
  }

  useEffect(() => {
    carregarConfigBanco()

    window.api.app.onStartupProgress((data) => {
      setMessage(data.message)
      setProgress(data.progress)
    })

    window.api.app.onReady(() => {
      setIsReady(true)
      setStartupError('')
      setMessage('Sistema pronto para uso')
      setProgress(100)
    })

    window.api.app.onStartupError((data) => {
      setStartupError(data.message)
      setIsReady(false)
    })

    window.api.app.isReady().then((ready) => {
      setIsReady(ready)

      if (ready) {
        setMessage('Sistema pronto para uso')
        setProgress(100)
      }
    })
  }, [])

  async function salvarModo(mode: StorageMode) {
    if (!configBanco || mode === 'api') return

    setSalvandoBanco(true)
    setMensagemBanco('')

    try {
      const novaConfig: ConfigBanco = {
        ...configBanco,
        mode
      }

      const resultado = await window.api.configuracao.salvarBanco(novaConfig)
      const configAtualizada = await window.api.configuracao.carregarBanco()

      setConfigBanco(configAtualizada)
      setMensagemBanco(resultado.mensagem)
    } catch (error) {
      setMensagemBanco(
        error instanceof Error ? error.message : 'Não foi possível salvar o modo de armazenamento.'
      )
    } finally {
      setSalvandoBanco(false)
    }
  }

  async function fazerLogin(event: React.FormEvent) {
    event.preventDefault()

    if (!isReady) return

    setErroLogin('')

    if (!matricula.trim() || !senha.trim()) {
      setErroLogin('Informe matrícula e senha.')
      return
    }

    setCarregandoLogin(true)

    try {
      const resultado = await window.api.auth.login(matricula.trim(), senha)

      if (!resultado.sucesso) {
        setErroLogin(resultado.mensagem)
        return
      }

      if (resultado.usuario) {
        definirUsuario({
          ...resultado.usuario,
          perfil: resultado.usuario.perfil as Usuario['perfil']
        })
      }

      navigate(resultado.usuario?.deveTrocarSenha ? '/trocar-senha' : '/dashboard')
    } finally {
      setCarregandoLogin(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="absolute right-6 top-6">
        <button
          type="button"
          onClick={() => setMostrarBanco((valor) => !valor)}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
        >
          <Database size={14} />
          Banco: {configBanco?.mode === 'postgres' ? 'PostgreSQL' : 'SQLite + Sync'}
          <Settings size={14} />
        </button>

        {mostrarBanco && configBanco && (
          <div className="mt-2 w-72 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
            <p className="text-xs font-bold text-slate-300">Modo de armazenamento</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={salvandoBanco}
                onClick={() => salvarModo('sqliteSync')}
                className={`rounded-lg px-3 py-2 text-xs font-bold ${
                  configBanco.mode === 'sqliteSync'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                SQLite + Sync
              </button>

              <button
                type="button"
                disabled={salvandoBanco}
                onClick={() => salvarModo('postgres')}
                className={`rounded-lg px-3 py-2 text-xs font-bold ${
                  configBanco.mode === 'postgres'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                PostgreSQL
              </button>
            </div>

            {mensagemBanco && (
              <p className="mt-3 rounded-lg bg-orange-950/30 px-3 py-2 text-xs text-orange-300">
                {mensagemBanco}
              </p>
            )}
          </div>
        )}
      </div>

      {startupError && (
        <div className="absolute top-6 max-w-xl rounded-2xl border border-red-900/40 bg-red-950/40 px-5 py-3 text-center text-sm font-semibold text-red-300">
          {startupError}
        </div>
      )}

      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600 text-3xl font-bold text-white shadow-lg shadow-orange-900/20">
            F
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">{APP.name}</h1>
            <p className="text-slate-400">Sistema industrial de gestão</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-7">
            <p className="text-sm font-medium text-orange-500">Acesso ao sistema</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Entrar</h2>
            <p className="mt-2 text-sm text-slate-400">Informe sua matrícula e senha.</p>
          </div>

          <form className="space-y-5" onSubmit={fazerLogin}>
            <Input
              label="Matrícula"
              placeholder="Digite sua matrícula"
              value={matricula}
              onChange={(event) => setMatricula(event.target.value)}
              disabled={!isReady || carregandoLogin}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              disabled={!isReady || carregandoLogin}
            />

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

            {erroLogin && (
              <p className="rounded-xl border border-red-900/30 bg-red-950/20 px-3 py-2 text-center text-sm text-red-400">
                {erroLogin}
              </p>
            )}

            <button
              type="button"
              onClick={() => setMostrarEsqueciSenha(true)}
              disabled={!isReady || carregandoLogin}
              className="w-full text-center text-sm font-semibold text-orange-500 hover:text-orange-400 disabled:opacity-50"
            >
              Esqueci minha senha
            </button>

            <Button type="submit" disabled={!isReady || carregandoLogin}>
              {carregandoLogin ? 'Entrando...' : isReady ? 'Entrar' : 'Aguarde...'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            <p>Versão 1.9.0</p>
            <p>Desenvolvido por EliasJuk</p>
          </div>
        </div>
      </div>
      {mostrarEsqueciSenha && (
        <ForgotPasswordModal onFechar={() => setMostrarEsqueciSenha(false)} />
      )}
    </main>
  )
}

export default LoginPage
