import { type FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useApp } from '../../contexts/AppContext'

function TrocarSenhaPage() {
  const navigate = useNavigate()
  const { usuario, sessaoCarregada, atualizarTrocaSenha, limparUsuario } = useApp()

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [processando, setProcessando] = useState(false)

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

  if (!usuario.deveTrocarSenha) {
    return <Navigate to="/dashboard" replace />
  }

  async function salvar(event: FormEvent) {
    event.preventDefault()
    setMensagem('')

    if (!senhaAtual || !novaSenha || !confirmacao) {
      setMensagem('Preencha a senha temporária, a nova senha e a confirmação.')
      return
    }

    if (novaSenha.length < 8) {
      setMensagem('A nova senha deve possuir pelo menos 8 caracteres.')
      return
    }

    if (novaSenha !== confirmacao) {
      setMensagem('A confirmação da nova senha não confere.')
      return
    }

    if (senhaAtual === novaSenha) {
      setMensagem('A nova senha deve ser diferente da senha temporária.')
      return
    }

    setProcessando(true)

    try {
      const resultado = await window.api.auth.alterarSenhaObrigatoria(senhaAtual, novaSenha)

      if (!resultado.sucesso) {
        setMensagem(resultado.mensagem)
        return
      }

      atualizarTrocaSenha(false)
      navigate('/dashboard', { replace: true })
    } finally {
      setProcessando(false)
    }
  }

  async function voltarAoLogin() {
    try {
      await window.api.auth.logout()
    } finally {
      limparUsuario()
      navigate('/', { replace: true })
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="text-sm font-semibold text-orange-500">Primeiro acesso</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Defina uma nova senha</h1>
        <p className="mt-2 text-sm text-slate-400">
          A senha temporária precisa ser substituída antes de acessar o sistema. A nova senha deve
          possuir pelo menos 8 caracteres.
        </p>

        <form className="mt-7 space-y-4" onSubmit={salvar}>
          <input
            type="password"
            value={senhaAtual}
            onChange={(event) => setSenhaAtual(event.target.value)}
            disabled={processando}
            autoComplete="current-password"
            placeholder="Senha temporária"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-orange-500 disabled:opacity-50"
          />
          <input
            type="password"
            value={novaSenha}
            onChange={(event) => setNovaSenha(event.target.value)}
            disabled={processando}
            autoComplete="new-password"
            placeholder="Nova senha"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-orange-500 disabled:opacity-50"
          />
          <input
            type="password"
            value={confirmacao}
            onChange={(event) => setConfirmacao(event.target.value)}
            disabled={processando}
            autoComplete="new-password"
            placeholder="Confirmar nova senha"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-orange-500 disabled:opacity-50"
          />

          {mensagem && (
            <p className="rounded-xl border border-red-900/30 bg-red-950/20 px-3 py-2 text-sm text-red-400">
              {mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={processando}
            className="w-full rounded-xl bg-orange-600 px-4 py-3 font-bold text-white disabled:opacity-50"
          >
            {processando ? 'Alterando...' : 'Alterar senha'}
          </button>

          <button
            type="button"
            disabled={processando}
            onClick={() => void voltarAoLogin()}
            className="w-full text-sm font-semibold text-slate-400 hover:text-white disabled:opacity-50"
          >
            Voltar ao login
          </button>
        </form>
      </div>
    </main>
  )
}

export default TrocarSenhaPage
