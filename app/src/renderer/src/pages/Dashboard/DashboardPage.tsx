import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { APP } from "../../config/app"
import { useApp } from "../../contexts/AppContext"
import MenuCard from "../../components/MenuCard/MenuCard"
import {
  Package,
  Boxes,
  Recycle,
  ClipboardList
} from "lucide-react"

const setores = [
  {
    id: 1,
    nome: "SETOR-1",
    subsetores: [
      "SUB-SETOR A",
      "SUB-SETOR B",
      "SUB-SETOR C",
      "SUB-SETOR D",
      "SUB-SETOR E",
      "SUB-SETOR F",
      "SUB-SETOR G"
    ]
  },
  {
    id: 2,
    nome: "SETOR-2",
    subsetores: ["SUB-SETOR A", "SUB-SETOR B", "SUB-SETOR C"]
  },
  {
    id: 3,
    nome: "SETOR-3",
    subsetores: ["SUB-SETOR A", "SUB-SETOR B"]
  },
  {
    id: 4,
    nome: "SETOR-4",
    subsetores: ["SUB-SETOR A"]
  }
]

function DashboardPage() {
  const navigate = useNavigate()
  const { usuario } = useApp()

  const [setorSelecionado, setSetorSelecionado] = useState(1)
  const [subsetorSelecionado, setSubsetorSelecionado] =
    useState("SUB-SETOR A")

  const setorAtual = setores.find((setor) => setor.id === setorSelecionado)

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
                onClick={() => {
                  setSetorSelecionado(setor.id)
                  setSubsetorSelecionado(setor.subsetores[0])
                }}
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
          {setorAtual?.subsetores.map((subsetor) => {
            const ativo = subsetor === subsetorSelecionado

            return (
              <button
                key={subsetor}
                onClick={() => setSubsetorSelecionado(subsetor)}
                className={`border px-4 py-3 text-sm font-semibold ${
                  ativo
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-green-500 text-green-700 hover:bg-green-50"
                }`}
              >
                {subsetor}
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
      </section>
    </main>
  )
}

export default DashboardPage