import { useState } from 'react'
import { X } from 'lucide-react'

type Props = {
  onFechar: () => void
}

export function ForgotPasswordModal({ onFechar }: Props) {
  const [matricula, setMatricula] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar() {
    if (enviando) return

    setEnviando(true)

    try {
      const resultado = await window.api.auth.solicitarRedefinicao(matricula)
      setMensagem(resultado.mensagem)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Esqueci minha senha</h2>
            <p className="mt-1 text-sm text-slate-400">
              Informe sua matrícula para registrar a solicitação.
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <label className="mt-5 block text-sm font-semibold text-slate-300">
          Matrícula
        </label>
        <input
          value={matricula}
          onChange={(event) => setMatricula(event.target.value)}
          disabled={enviando}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-orange-500"
          placeholder="Digite sua matrícula"
        />

        {mensagem && (
          <p className="mt-4 rounded-xl bg-slate-950 px-4 py-3 text-sm text-slate-300">
            {mensagem}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={enviar}
            disabled={enviando}
            className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {enviando ? 'Enviando...' : 'Enviar solicitação'}
          </button>
        </div>
      </div>
    </div>
  )
}
