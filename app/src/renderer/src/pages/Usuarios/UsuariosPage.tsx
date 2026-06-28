import { useEffect, useMemo, useState } from "react"
import { Pencil, RotateCcw, Search, Trash2 } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { ui } from "../../theme/ui"

type Usuario = {
  id: number
  nome: string
  matricula: string
  perfil: string
  ativo: boolean
}

const perfis = [
  "OPERADOR",
  "TECNICO",
  "LIDER",
  "SUPERVISOR",
  "ADMIN"
]

function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [busca, setBusca] = useState("")

  const [nome, setNome] = useState("")
  const [matricula, setMatricula] = useState("")
  const [perfil, setPerfil] = useState("OPERADOR")
  const [senha, setSenha] = useState("")
  const [editando, setEditando] = useState<Usuario | null>(null)

  async function carregarUsuarios() {
    const lista = await window.api.usuarios.listar()
    setUsuarios(lista)
  }

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return usuarios

    return usuarios.filter((usuario) =>
      usuario.nome.toLowerCase().includes(termo) ||
      usuario.matricula.toLowerCase().includes(termo) ||
      usuario.perfil.toLowerCase().includes(termo)
    )
  }, [usuarios, busca])

  async function salvarUsuario() {
    if (!nome.trim() || !matricula.trim()) return

    const input = {
      nome: nome.trim(),
      matricula: matricula.trim(),
      perfil,
      senha: senha.trim() || undefined
    }

    if (editando) {
      await window.api.usuarios.editar(editando.id, input)
    } else {
      await window.api.usuarios.criar(input)
    }

    limparFormulario()
    await carregarUsuarios()
  }

  function editarUsuario(usuario: Usuario) {
    setEditando(usuario)
    setNome(usuario.nome)
    setMatricula(usuario.matricula)
    setPerfil(usuario.perfil)
    setSenha("")
  }

  async function excluirUsuario(id: number) {
    await window.api.usuarios.excluir(id)
    await carregarUsuarios()
  }

  async function ativarUsuario(id: number) {
    await window.api.usuarios.ativar(id)
    await carregarUsuarios()
  }

  function limparFormulario() {
    setEditando(null)
    setNome("")
    setMatricula("")
    setPerfil("OPERADOR")
    setSenha("")
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Usuários"
        subtitle="Gerencie operadores, líderes, técnicos e administradores."
      />

      <section className={ui.section}>
        <div className={ui.card}>
          <div className="grid gap-3 md:grid-cols-[1fr_140px_160px_180px_180px]">
            <div>
              <label className={ui.label}>Nome</label>
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex: João Silva"
                className={ui.input}
              />
            </div>

            <div>
              <label className={ui.label}>Matrícula</label>
              <input
                value={matricula}
                onChange={(event) => setMatricula(event.target.value)}
                placeholder="Ex: 12345"
                className={ui.input}
              />
            </div>

            <div>
              <label className={ui.label}>Perfil</label>
              <select
                value={perfil}
                onChange={(event) => setPerfil(event.target.value)}
                className={ui.select}
              >
                {perfis.map((perfilItem) => (
                  <option key={perfilItem} value={perfilItem}>
                    {perfilItem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={ui.label}>
                Senha {editando ? "(opcional)" : ""}
              </label>
              <input
                type="password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder={editando ? "Nova senha" : "Senha"}
                className={ui.input}
              />
            </div>

            <div className="flex items-end gap-2">
              <button onClick={salvarUsuario} className={ui.buttonPrimary}>
                {editando ? "Atualizar" : "Salvar"}
              </button>

              {editando && (
                <button onClick={limparFormulario} className={ui.buttonSecondary}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={ui.card}>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className={ui.label}>Buscar</label>
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Nome, matrícula ou perfil..."
                className={ui.input}
              />
            </div>

            <button className={ui.buttonSecondary} title="Buscar">
              <Search size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className={ui.table}>
            <thead className="[background-color:var(--soft)]">
              <tr>
                <th className={ui.tableHeader}>Matrícula</th>
                <th className={ui.tableHeader}>Nome</th>
                <th className={ui.tableHeader}>Perfil</th>
                <th className={ui.tableHeader}>Status</th>
                <th className={ui.tableHeaderRight}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {usuariosFiltrados.map((usuario) => (
                <tr
                  key={usuario.id}
                  className={`border-t border-[var(--border)] ${
                    !usuario.ativo ? "bg-slate-200 opacity-80" : ""
                  }`}
                >
                  <td className={ui.tableCell}>{usuario.matricula}</td>
                  <td className={ui.tableCellStrong}>{usuario.nome}</td>
                  <td className={ui.tableCell}>{usuario.perfil}</td>

                  <td className={ui.tableCell}>
                    <span
                      className={`rounded px-2 py-1 text-xs font-bold ${
                        usuario.ativo
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {usuario.ativo ? "ATIVO" : "INATIVO"}
                    </span>
                  </td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      {usuario.ativo ? (
                        <>
                          <button
                            onClick={() => editarUsuario(usuario)}
                            className={ui.buttonSecondary}
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            onClick={() => excluirUsuario(usuario.id)}
                            className={ui.buttonDanger}
                            title="Inativar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => ativarUsuario(usuario.id)}
                          className={ui.buttonSecondary}
                          title="Reativar"
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className={ui.empty}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default UsuariosPage