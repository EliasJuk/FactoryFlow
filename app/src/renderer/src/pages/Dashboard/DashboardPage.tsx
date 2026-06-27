import { useState } from "react"
import { APP } from "../../config/app"
import { useApp } from "../../contexts/AppContext"

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
  const [setorSelecionado, setSetorSelecionado] = useState(1)
  const [subsetorSelecionado, setSubsetorSelecionado] = useState("SUB-SETOR A")

  const setorAtual = setores.find((setor) => setor.id === setorSelecionado)

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex h-20 items-center justify-center border-b bg-white">
        <h1 className="text-2xl font-bold text-slate-800">{APP.name}</h1>
      </header>

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

      <section className="grid grid-cols-2 gap-6 p-10 md:grid-cols-4">
        <button className="h-36 rounded-xl bg-white p-6 text-lg font-bold shadow hover:shadow-md">
          ♻️
          <div className="mt-4">Lançar Refugo</div>
        </button>

        <button className="h-36 rounded-xl bg-white p-6 text-lg font-bold shadow hover:shadow-md">
          📋
          <div className="mt-4">Ver Lançamentos</div>
        </button>

        <button className="h-36 rounded-xl bg-white p-6 text-lg font-bold shadow hover:shadow-md">
          📦
          <div className="mt-4">Cadastrar Componentes</div>
        </button>

        <button className="h-36 rounded-xl bg-white p-6 text-lg font-bold shadow hover:shadow-md">
          🧩
          <div className="mt-4">Cadastrar Circuitos</div>
        </button>
      </section>
    </main>
  )
}

export default DashboardPage