import { useEffect, useMemo, useState } from "react"
import {
  Eye,
  Pencil,
  RotateCcw,
  Trash2,
  UserX
} from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { Pagination } from "../../components/Pagination/Pagination"
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog"
import { CrudHeader } from "../../components/Crud/CrudHeader/CrudHeader"
import { SearchBar } from "../../components/Crud/SearchBar/SearchBar"
import { InativosCard } from "../../components/Crud/InativosCard/InativosCard"
import { ui } from "../../theme/ui"

import { UsuarioFormModal } from "./components/UsuarioFormModal"
import { UsuarioInfoModal } from "./components/UsuarioInfoModal"

type ModalModo = "novo" | "editar"

type Usuario = {
  id: number
  nome: string
  matricula: string
  perfil: string
  ativo: boolean
  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null
  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null
  createdByNome?: string | null
  updatedByNome?: string | null
  deletedByNome?: string | null
}

type ResultadoAcao = {
  sucesso: boolean
  mensagem: string
}

const perfis = ["OPERADOR", "TECNICO", "LIDER", "SUPERVISOR", "QUALIDADE", "ADMIN"]

const ITENS_POR_PAGINA = 10

function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuariosInativos, setUsuariosInativos] = useState<Usuario[]>([])

  const [busca, setBusca] = useState("")
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [mostrarInativos, setMostrarInativos] = useState(false)

  const [modalAberto, setModalAberto] = useState(false)
  const [modalModo, setModalModo] = useState<ModalModo>("novo")
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [usuarioInfo, setUsuarioInfo] = useState<Usuario | null>(null)

  const [nome, setNome] = useState("")
  const [matricula, setMatricula] = useState("")
  const [perfil, setPerfil] = useState("OPERADOR")
  const [senha, setSenha] = useState("")
  const [alterarSenha, setAlterarSenha] = useState(false)

  const [mensagemErro, setMensagemErro] = useState("")
  const [mensagemSucesso, setMensagemSucesso] = useState("")
  const [processando, setProcessando] = useState(false)

  const [usuarioParaInativar, setUsuarioParaInativar] =
    useState<Usuario | null>(null)
  const [usuarioParaRestaurar, setUsuarioParaRestaurar] =
    useState<Usuario | null>(null)
  const [usuarioParaRemover, setUsuarioParaRemover] =
    useState<Usuario | null>(null)

  async function carregarUsuarios() {
    const [ativos, inativos] = await Promise.all([
      window.api.usuarios.listar(),
      window.api.usuarios.listarInativos()
    ])

    setUsuarios(ativos)
    setUsuariosInativos(inativos)
  }

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return usuarios

    return usuarios.filter((usuario) => {
      return (
        usuario.nome.toLowerCase().includes(termo) ||
        usuario.matricula.toLowerCase().includes(termo) ||
        usuario.perfil.toLowerCase().includes(termo)
      )
    })
  }, [usuarios, busca])

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / ITENS_POR_PAGINA)
  )

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
    return usuariosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [usuariosFiltrados, paginaAtual])

  useEffect(() => {
    setPaginaAtual(1)
  }, [busca])

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas)
    }
  }, [paginaAtual, totalPaginas])

  function limparMensagens() {
    setMensagemErro("")
    setMensagemSucesso("")
  }

  function limparFormulario() {
    setNome("")
    setMatricula("")
    setPerfil("OPERADOR")
    setSenha("")
    setAlterarSenha(false)
    setUsuarioEditando(null)
    setMensagemErro("")
  }

  function abrirNovoUsuario() {
    if (processando) return

    limparMensagens()
    limparFormulario()
    setModalModo("novo")
    setModalAberto(true)
  }

  function abrirEditarUsuario(usuario: Usuario) {
    if (processando) return

    limparMensagens()
    setModalModo("editar")
    setUsuarioEditando(usuario)
    setNome(usuario.nome)
    setMatricula(usuario.matricula)
    setPerfil(usuario.perfil)
    setSenha("")
    setAlterarSenha(false)
    setModalAberto(true)
  }

  function fecharModal() {
    if (processando) return

    setModalAberto(false)
    limparFormulario()
  }

  async function salvarUsuario() {
    if (processando) return

    setMensagemErro("")

    if (!nome.trim() || !matricula.trim()) {
      setMensagemErro("Informe o nome e a matrícula do usuário.")
      return
    }

    if (modalModo === "novo" && !senha.trim()) {
      setMensagemErro("Informe uma senha inicial para o usuário.")
      return
    }

    if (modalModo === "editar" && alterarSenha && !senha.trim()) {
      setMensagemErro("Informe a nova senha do usuário.")
      return
    }

    const input = {
      nome: nome.trim(),
      matricula: matricula.trim(),
      perfil,
      senha:
        modalModo === "novo" || alterarSenha
          ? senha.trim() || undefined
          : undefined,
      usuarioId: 1
    }

    setProcessando(true)

    try {
      let resultado: ResultadoAcao

      if (modalModo === "editar" && usuarioEditando) {
        resultado = await window.api.usuarios.editar(usuarioEditando.id, input)
      } else {
        resultado = await window.api.usuarios.criar(input)
      }

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setMensagemSucesso(resultado.mensagem)
      fecharModal()
      await carregarUsuarios()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarInativacao() {
    if (!usuarioParaInativar || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.usuarios.excluir(
        usuarioParaInativar.id,
        1
      )

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setUsuarioParaInativar(null)
      setMensagemSucesso(resultado.mensagem)
      await carregarUsuarios()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarRestauracao() {
    if (!usuarioParaRestaurar || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.usuarios.ativar(
        usuarioParaRestaurar.id,
        1
      )

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setUsuarioParaRestaurar(null)
      setMensagemSucesso(resultado.mensagem)
      await carregarUsuarios()
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarRemocao() {
    if (!usuarioParaRemover || processando) return

    setProcessando(true)
    limparMensagens()

    try {
      const resultado = await window.api.usuarios.remover(
        usuarioParaRemover.id,
        1
      )

      if (!resultado.sucesso) {
        setMensagemErro(resultado.mensagem)
        return
      }

      setUsuarioParaRemover(null)
      setMensagemSucesso(resultado.mensagem)
      await carregarUsuarios()
    } finally {
      setProcessando(false)
    }
  }

  function renderStatus(usuario: Usuario) {
    return (
      <span
        className={`rounded px-2 py-1 text-xs font-bold ${
          usuario.ativo
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {usuario.ativo ? "ATIVO" : "INATIVO"}
      </span>
    )
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Cadastro de Usuários"
        subtitle="Gerencie operadores, líderes, técnicos e administradores."
      />

      <section className={ui.section}>
        {mensagemSucesso && (
          <div className="rounded-md bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {mensagemSucesso}
          </div>
        )}

        {mensagemErro && !modalAberto && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {mensagemErro}
          </div>
        )}

        <CrudHeader
          titulo="Usuários ativos"
          descricao={`Exibindo ${usuariosFiltrados.length} usuário(s) ativo(s). Limite de ${ITENS_POR_PAGINA} por página.`}
          textoBotao="Novo Usuário"
          disabled={processando}
          onNovo={abrirNovoUsuario}
        >
          <SearchBar
            value={busca}
            onChange={setBusca}
            placeholder="Pesquisar por nome, matrícula ou perfil..."
          />
        </CrudHeader>

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
              {usuariosPaginados.map((usuario) => (
                <tr
                  key={usuario.id}
                  className="border-t border-[var(--border)]"
                >
                  <td className={ui.tableCellStrong}>{usuario.matricula}</td>
                  <td className={ui.tableCell}>{usuario.nome}</td>
                  <td className={ui.tableCell}>{usuario.perfil}</td>
                  <td className={ui.tableCell}>{renderStatus(usuario)}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setUsuarioInfo(usuario)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Informações"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        onClick={() => abrirEditarUsuario(usuario)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => setUsuarioParaInativar(usuario)}
                        disabled={processando}
                        className={ui.buttonDanger}
                        title="Inativar"
                      >
                        <UserX size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {usuariosPaginados.length === 0 && (
                <tr>
                  <td colSpan={5} className={ui.empty}>
                    Nenhum usuário ativo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          onPaginaAnterior={() =>
            setPaginaAtual((pagina) => Math.max(1, pagina - 1))
          }
          onProximaPagina={() =>
            setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))
          }
        />

        <InativosCard
          titulo="Usuários inativos"
          descricao={`${usuariosInativos.length} usuário(s) inativo(s). Use esta área para restaurar ou remover usuários.`}
          aberto={mostrarInativos}
          onToggle={() => setMostrarInativos(!mostrarInativos)}
        >
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
              {usuariosInativos.map((usuario) => (
                <tr
                  key={usuario.id}
                  className="border-t border-[var(--border)] bg-slate-50"
                >
                  <td className={ui.tableCellStrong}>{usuario.matricula}</td>
                  <td className={ui.tableCell}>{usuario.nome}</td>
                  <td className={ui.tableCell}>{usuario.perfil}</td>
                  <td className={ui.tableCell}>{renderStatus(usuario)}</td>

                  <td className={ui.tableCell}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setUsuarioInfo(usuario)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Informações"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        onClick={() => setUsuarioParaRestaurar(usuario)}
                        disabled={processando}
                        className={ui.buttonSecondary}
                        title="Restaurar"
                      >
                        <RotateCcw size={15} />
                        Restaurar
                      </button>

                      <button
                        onClick={() => setUsuarioParaRemover(usuario)}
                        disabled={processando}
                        className={ui.buttonDanger}
                        title="Remover"
                      >
                        <Trash2 size={15} />
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {usuariosInativos.length === 0 && (
                <tr>
                  <td colSpan={5} className={ui.empty}>
                    Nenhum usuário inativo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </InativosCard>

        <div className="rounded-lg bg-white shadow-sm">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-4 text-left"
          >
            <div>
              <h2 className={ui.title}>Solicitações de alteração de senha</h2>
              <p className={ui.subtitle}>
                Área reservada para futuras solicitações de redefinição de senha.
              </p>
            </div>

            <span className="rounded bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              0 pendente(s)
            </span>
          </button>
        </div>

        {modalAberto && (
          <UsuarioFormModal
            modo={modalModo}
            usuarioEditando={usuarioEditando}
            nome={nome}
            matricula={matricula}
            perfil={perfil}
            senha={senha}
            alterarSenha={alterarSenha}
            mensagemErro={mensagemErro}
            processando={processando}
            perfis={perfis}
            onNomeChange={setNome}
            onMatriculaChange={setMatricula}
            onPerfilChange={setPerfil}
            onSenhaChange={setSenha}
            onAlterarSenhaChange={setAlterarSenha}
            onFechar={fecharModal}
            onSalvar={salvarUsuario}
          />
        )}

        {usuarioInfo && (
          <UsuarioInfoModal
            usuario={usuarioInfo}
            onFechar={() => setUsuarioInfo(null)}
          />
        )}

        {usuarioParaInativar && (
          <ConfirmDialog
            titulo="Inativar usuário"
            descricao={
              <>
                O usuário{" "}
                <strong>
                  {usuarioParaInativar.matricula} - {usuarioParaInativar.nome}
                </strong>{" "}
                ficará inativo e não poderá ser utilizado normalmente.
              </>
            }
            textoConfirmar="Confirmar inativação"
            perigo
            onCancelar={() => setUsuarioParaInativar(null)}
            onConfirmar={confirmarInativacao}
          />
        )}

        {usuarioParaRestaurar && (
          <ConfirmDialog
            titulo="Restaurar usuário"
            descricao={
              <>
                O usuário{" "}
                <strong>
                  {usuarioParaRestaurar.matricula} - {usuarioParaRestaurar.nome}
                </strong>{" "}
                voltará a ficar ativo.
              </>
            }
            textoConfirmar="Restaurar"
            onCancelar={() => setUsuarioParaRestaurar(null)}
            onConfirmar={confirmarRestauracao}
          />
        )}

        {usuarioParaRemover && (
          <ConfirmDialog
            titulo="Remover usuário"
            descricao={
              <>
                O usuário{" "}
                <strong>
                  {usuarioParaRemover.matricula} - {usuarioParaRemover.nome}
                </strong>{" "}
                será removido da aplicação. Ele não aparecerá mais nas listas de
                usuários ativos ou inativos.
              </>
            }
            textoConfirmar="Remover"
            perigo
            onCancelar={() => setUsuarioParaRemover(null)}
            onConfirmar={confirmarRemocao}
          />
        )}
      </section>
    </main>
  )
}

export default UsuariosPage