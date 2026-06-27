import { APP } from "../../config/app"

const setores = [
  "SETOR-1",
  "SETOR-2",
  "SETOR-3",
  "SETOR-4"
]


const subsetores1 = [
  "SUB-SETOR A",
  "SUB-SETOR B",
  "SUB-SETOR C",
  "SUB-SETOR D",
  "SUB-SETOR E",
  "SUB-SETOR F",
  "SUB-SETOR G"
]

function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex h-20 items-center justify-center border-b bg-white">
        <h1 className="text-2xl font-bold text-slate-800">{APP.name}</h1>
      </header>

      <section className="border-b bg-white px-8 py-4">
        <div className="grid grid-cols-4 gap-2">
          {setores.map((setor) => (
            <button
              key={setor}
              className={`border px-4 py-3 font-semibold ${
                setor === "AC"
                  ? "bg-green-600 text-white"
                  : "bg-white text-slate-700"
              }`}
            >
              {setor}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {subsetores1.map((subsetor) => (
            <button
              key={subsetor}
              className="border border-green-500 px-4 py-3 text-sm font-semibold text-green-700"
            >
              {subsetor}
            </button>
          ))}
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