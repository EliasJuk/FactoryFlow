import { X } from 'lucide-react'

import type { PerfilUsuario, Usuario } from '../../../models/Usuario'
import { ui } from '../../../theme/ui'

type ModalModo = 'novo' | 'editar'

type Props = {
  modo: ModalModo
  usuarioEditando: Usuario | null
  nome: string
  matricula: string
  perfil: PerfilUsuario
  senha: string
  alterarSenha: boolean
  mensagemErro: string
  processando: boolean
  perfis: PerfilUsuario[]
  onNomeChange: (valor: string) => void
  onMatriculaChange: (valor: string) => void
  onPerfilChange: (valor: PerfilUsuario) => void
  onSenhaChange: (valor: string) => void
  onAlterarSenhaChange: (valor: boolean) => void
  onFechar: () => void
  onSalvar: () => void
}

export function UsuarioFormModal({
  modo,
  usuarioEditando,
  nome,
  matricula,
  perfil,
  senha,
  alterarSenha,
  mensagemErro,
  processando,
  perfis,
  onNomeChange,
  onMatriculaChange,
  onPerfilChange,
  onSenhaChange,
  onAlterarSenhaChange,
  onFechar,
  onSalvar
}: Props) {
  const editando = modo === 'editar'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className={ui.title}>{editando ? 'Editar Usuário' : 'Novo Usuário'}</h2>

            <p className={ui.subtitle}>
              {editando && usuarioEditando
                ? `${usuarioEditando.matricula} - ${usuarioEditando.nome}`
                : 'Cadastre um novo usuário do sistema.'}
            </p>
          </div>

          <button onClick={onFechar} disabled={processando} className={ui.buttonSecondary}>
            <X size={16} />
          </button>
        </div>

        {mensagemErro && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {mensagemErro}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-[1fr_160px_180px]">
          <div>
            <label className={ui.label}>Nome</label>
            <input
              value={nome}
              onChange={(event) => onNomeChange(event.target.value)}
              disabled={processando}
              placeholder="Ex: João Silva"
              className={ui.input}
            />
          </div>

          <div>
            <label className={ui.label}>Matrícula</label>
            <input
              value={matricula}
              onChange={(event) => onMatriculaChange(event.target.value)}
              disabled={processando}
              placeholder="Ex: 12345"
              className={ui.input}
            />
          </div>

          <div>
            <label className={ui.label}>Perfil</label>
            <select
              value={perfil}
              onChange={(event) => onPerfilChange(event.target.value as PerfilUsuario)}
              disabled={processando}
              className={ui.select}
            >
              {perfis.map((perfilItem) => (
                <option key={perfilItem} value={perfilItem}>
                  {perfilItem}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!editando && (
          <div className="mt-4 max-w-md">
            <label className={ui.label}>Senha inicial</label>
            <input
              type="password"
              value={senha}
              onChange={(event) => onSenhaChange(event.target.value)}
              disabled={processando}
              placeholder="Senha"
              className={ui.input}
            />
          </div>
        )}

        {editando && (
          <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--soft)] p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <input
                type="checkbox"
                checked={alterarSenha}
                onChange={(event) => onAlterarSenhaChange(event.target.checked)}
                disabled={processando}
              />
              Alterar senha deste usuário
            </label>

            {alterarSenha && (
              <div className="mt-3 max-w-md">
                <label className={ui.label}>Nova senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(event) => onSenhaChange(event.target.value)}
                  disabled={processando}
                  placeholder="Nova senha"
                  className={ui.input}
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onFechar} disabled={processando} className={ui.buttonSecondary}>
            Cancelar
          </button>

          <button onClick={onSalvar} disabled={processando} className={ui.buttonPrimary}>
            {processando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
