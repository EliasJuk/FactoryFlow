import PageHeader from "../../components/PageHeader/PageHeader"

function PostosPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <PageHeader
        title="Cadastro um posto de trabalhos"
        subtitle="Cadastre e gerencie um posto de trabalhos."
      />

      <section className="p-8">
        Posto de Trabalho
      </section>
    </main>
  )
}

export default PostosPage