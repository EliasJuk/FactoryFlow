import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { APP } from "../../config/app"
import { useApp } from "../../contexts/AppContext"
import MenuCard from "../../components/MenuCard/MenuCard"
import { Setor } from "../../models/Setor"

import {
  Package,
  Boxes,
  Recycle,
  ClipboardList,
  Building2
} from "lucide-react"

type Subsetor = {
  id: number
  nome: string
  setorId: number
  setorNome: string
  ativo: boolean
}

function DashboardPage() {
  const navigate = useNavigate()
  const { usuario } = useApp()

  const [setores, setSetores] = useState<Setor[]>([])
  const [subsetores, setSubsetores] = useState<Subsetor[]>([])
  const [setorSelecionado, setSetorSelecionado] = useState<number | null>(null)
  const [subsetorSelecionado, setSubsetorSelecionado] = useState<number | null>(null)

  async function carregarDados() {
    const setoresLista = await window.api.setores.listar()
    const subsetoresLista = await window.api.subsetores.listar()

    setSetores(setoresLista)
    setSubsetores(subsetoresLista)

    if (setoresLista.length > 0) {
      const primeiroSetor = setoresLista[0]
      setSetorSelecionado(primeiroSetor.id)

      const primeiroSubsetor = subsetoresLista.find(
        (subsetor) => subsetor.setorId === primeiroSetor.id
      )

      setSubsetorSelecionado(primeiroSubsetor ? primeiroSubsetor.id : null)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const subsetoresDoSetor = subsetores.filter(
    (subsetor) => subsetor.setorId === setorSelecionado
  )

  function selecionarSetor(setorId: number) {
    setSetorSelecionado(setorId)

    const primeiroSubsetor = subsetores.find(
      (subsetor) => subsetor.setorId === setorId
    )

    setSubsetorSelecionado(primeiroSubsetor ? primeiroSubsetor.id : null)
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex h-20 items-center justify-center border-b bg-white">
        <h1 className="text-2xl font-bold text-slate-800">{APP.name}</h1>
      </header>

      <div className="bg-white px-8 py-3 text-sm text-slate-600">
        Olá, <span className="font-semibold">{usuario.nome}</span>
      </div>

      <section className="border-b bg-white px-8 py-4">
        <div className="grid grid-cols-4 gap-2">
          {setores.map((setor) => {
            const ativo = setor.id === setorSelecionado

            return (
              <button
                key={setor.id}
                onClick={() => selecionarSetor(setor.id)}
                className={`border px-4 py-3 font-semibold ${
                  ativo
                    ? "bg-green-600 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {setor.nome}
              </button>
            )
          })}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {subsetoresDoSetor.map((subsetor) => {
            const ativo = subsetor.id === subsetorSelecionado

            return (
              <button
                key={subsetor.id}
                onClick={() => setSubsetorSelecionado(subsetor.id)}
                className={`border px-4 py-3 text-sm font-semibold ${
                  ativo
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-green-500 text-green-700 hover:bg-green-50"
                }`}
              >
                {subsetor.nome}
              </button>
            )
          })}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-6 p-10 lg:grid-cols-4">
        <MenuCard
          title="Lançar Refugo"
          description="Registrar novos refugos"
          icon={<Recycle size={48} />}
          onClick={() => navigate("/lancar-refugo")}
        />

        <MenuCard
          title="Ver Lançamentos"
          description="Consultar registros"
          icon={<ClipboardList size={48} />}
          onClick={() => navigate("/ver-lancamentos")}
        />

        <MenuCard
          title="Componentes"
          description="Cadastrar componentes"
          icon={<Package size={48} />}
          onClick={() => navigate("/componentes")}
        />

        <MenuCard
          title="Circuitos"
          description="Cadastrar circuitos"
          icon={<Boxes size={48} />}
          onClick={() => navigate("/circuitos")}
        />

        <MenuCard
          title="Setores"
          description="Cadastrar setores"
          icon={<Building2 size={48} />}
          onClick={() => navigate("/setores")}
        />

        <MenuCard
          title="Subsetores"
          description="Cadastrar subsetores"
          icon={<Building2 size={48} />}
          onClick={() => navigate("/subsetores")}
        />
      </section>
    </main>
  )
}

export default DashboardPage