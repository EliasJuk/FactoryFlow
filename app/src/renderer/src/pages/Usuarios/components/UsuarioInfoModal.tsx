import { X } from "lucide-react"

import { ui } from "../../../theme/ui"

type Usuario = {
  id: number
  nome: string
  matricula: string
  perfil: string
  ativo: boolean
  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null
  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}

type Props = {
  usuario: Usuario
  onFechar: () => void
}

function formatarData(valor?: string | null) {
  if (!valor) return "Não registrado"

  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) {
    return valor
  }

  return data.toLocaleString("pt-BR")
}

export function UsuarioInfoModal({ usuario, onFechar }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className={ui.title}>Informações do usuário</h2>
            <p className={ui.subtitle}>
              {usuario.matricula} - {usuario.nome}
            </p>
          </div>

          <button onClick={onFechar} className={ui.buttonSecondary}>
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="rounded-md bg-[var(--soft)] p-3">
            <strong>Status:</strong> {usuario.ativo ? "Ativo" : "Inativo"}
            <br />
            <strong>Perfil:</strong> {usuario.perfil}
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Criado por:</strong>{" "}
            {usuario.createdByNome ?? "Sistema"}
            <br />
            <strong>Criado em:</strong> {formatarData(usuario.createdAt)}
          </div>

          <div className="rounded-md border border-[var(--border)] p-3">
            <strong>Última alteração por:</strong>{" "}
            {usuario.updatedByNome ?? "Sistema"}
            <br />
            <strong>Última alteração em:</strong>{" "}
            {formatarData(usuario.updatedAt)}
          </div>

          {!usuario.ativo && (
            <div className="rounded-md border border-[var(--border)] p-3">
              <strong>Inativado por:</strong>{" "}
              {usuario.updatedByNome ?? "Não registrado"}
              <br />
              <strong>Inativado em:</strong> {formatarData(usuario.updatedAt)}
            </div>
          )}

          {usuario.deletedAt && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
              <strong>Removido por:</strong>{" "}
              {usuario.deletedByNome ?? "Não registrado"}
              <br />
              <strong>Removido em:</strong> {formatarData(usuario.deletedAt)}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={onFechar} className={ui.buttonSecondary}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}