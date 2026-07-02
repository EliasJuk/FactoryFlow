import { useEffect, useState } from "react"
import { Database, HardDrive, Printer, Save, Server, TestTube, X } from "lucide-react"

import PageHeader from "../../components/PageHeader/PageHeader"
import { ui } from "../../theme/ui"

type DatabaseProvider = "sqlite" | "postgres"
type Aba = "banco" | "impressao" | "sistema"

type ConfiguracaoBanco = {
  provider: DatabaseProvider
  postgres: {
    host: string
    port: number
    database: string
    user: string
    password: string
  }
}

const configInicial: ConfiguracaoBanco = {
  provider: "sqlite",
  postgres: {
    host: "localhost",
    port: 5432,
    database: "factoryflow",
    user: "postgres",
    password: ""
  }
}

function ConfiguracoesPage() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>("banco")
  const [config, setConfig] = useState<ConfiguracaoBanco>(configInicial)
  const [configOriginal, setConfigOriginal] = useState<ConfiguracaoBanco>(configInicial)
  const [mensagem, setMensagem] = useState("")
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro" | "info">("info")
  const [carregando, setCarregando] = useState(false)

  async function carregarConfiguracao() {
    const dados = await window.api.configuracao.carregarBanco()
    setConfig(dados)
    setConfigOriginal(dados)
  }

  useEffect(() => {
    carregarConfiguracao()
  }, [])

  function selecionarProvider(provider: DatabaseProvider) {
    setMensagem("")

    setConfig((atual) => ({
      ...atual,
      provider
    }))
  }

  function alterarPostgres(campo: keyof ConfiguracaoBanco["postgres"], valor: string) {
    setConfig((atual) => ({
      ...atual,
      postgres: {
        ...atual.postgres,
        [campo]: campo === "port" ? Number(valor) : valor
      }
    }))
  }

  async function testarPostgres() {
    const confirmar = confirm(
      "Deseja testar a conexão com o PostgreSQL?\n\nO FactoryFlow tentará se conectar usando os dados informados nesta tela."
    )

    if (!confirmar) return

    setCarregando(true)
    setMensagem("")

    try {
      const resultado = await window.api.configuracao.testarPostgres(config.postgres)

      setTipoMensagem(resultado.sucesso ? "sucesso" : "erro")
      setMensagem(resultado.mensagem)
    } catch (error) {
      setTipoMensagem("erro")
      setMensagem(
        error instanceof Error
          ? `Não foi possível conectar ao PostgreSQL. Detalhes: ${error.message}`
          : "Não foi possível conectar ao PostgreSQL."
      )
    } finally {
      setCarregando(false)
    }
  }

  async function salvarConfiguracao() {
    const mudouProvider = config.provider !== configOriginal.provider

    const confirmar = confirm(
      mudouProvider
        ? `Deseja alterar o banco de dados para ${
            config.provider === "sqlite" ? "SQLite" : "PostgreSQL"
          }?\n\nEssa alteração será salva, mas só terá efeito após reiniciar o FactoryFlow.`
        : "Deseja salvar as configurações atuais?\n\nAlgumas alterações podem exigir reiniciar o FactoryFlow."
    )

    if (!confirmar) return

    setCarregando(true)
    setMensagem("")

    try {
      const resultado = await window.api.configuracao.salvarBanco(config)

      setTipoMensagem("sucesso")
      setMensagem(resultado.mensagem)
      setConfigOriginal(config)
    } catch (error) {
      setTipoMensagem("erro")
      setMensagem(
        error instanceof Error
          ? `Erro ao salvar configuração: ${error.message}`
          : "Erro ao salvar configuração."
      )
    } finally {
      setCarregando(false)
    }
  }

  function cancelarAlteracoes() {
    const confirmar = confirm(
      "Deseja cancelar as alterações?\n\nAs informações ainda não salvas serão descartadas."
    )

    if (!confirmar) return

    setConfig(configOriginal)
    setMensagem("")
  }

  const mensagemClassName =
    tipoMensagem === "sucesso"
      ? "bg-green-50 text-green-700"
      : tipoMensagem === "erro"
        ? "bg-red-50 text-red-700"
        : "bg-orange-50 text-orange-700"

  return (
    <main className={ui.page}>
      <PageHeader
        title="Configurações"
        subtitle="Gerencie parâmetros do sistema, banco de dados e recursos futuros."
      />

      <section className={ui.section}>
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="flex border-b border-[var(--border)] bg-[var(--soft)]">
            <button
              onClick={() => setAbaAtiva("banco")}
              className={`px-4 py-3 text-sm font-bold ${
                abaAtiva === "banco" ? "bg-white text-[var(--primary)]" : "text-[var(--text)]"
              }`}
            >
              Banco de dados
            </button>

            <button
              onClick={() => setAbaAtiva("impressao")}
              className={`px-4 py-3 text-sm font-bold ${
                abaAtiva === "impressao" ? "bg-white text-[var(--primary)]" : "text-[var(--text)]"
              }`}
            >
              Impressão
            </button>

            <button
              onClick={() => setAbaAtiva("sistema")}
              className={`px-4 py-3 text-sm font-bold ${
                abaAtiva === "sistema" ? "bg-white text-[var(--primary)]" : "text-[var(--text)]"
              }`}
            >
              Sistema
            </button>
          </div>

          <div className="p-4">
            {abaAtiva === "banco" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Database size={20} className="text-[var(--primary)]" />
                  <div>
                    <h2 className={ui.title}>Banco de dados</h2>
                    <p className={ui.subtitle}>
                      Selecione o provedor. A alteração só será aplicada depois de salvar e reiniciar.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => selecionarProvider("sqlite")}
                    className={`rounded-lg border p-4 text-left transition ${
                      config.provider === "sqlite"
                        ? "border-[var(--primary)] bg-orange-50"
                        : "border-[var(--border)] bg-white hover:bg-[var(--soft)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                      <HardDrive size={18} />
                      SQLite
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-light)]">
                      Banco local em arquivo. Recomendado para testes, demonstrações e uso inicial.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => selecionarProvider("postgres")}
                    className={`rounded-lg border p-4 text-left transition ${
                      config.provider === "postgres"
                        ? "border-[var(--primary)] bg-orange-50"
                        : "border-[var(--border)] bg-white hover:bg-[var(--soft)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                      <Server size={18} />
                      PostgreSQL
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-light)]">
                      Banco em servidor. Planejado para ambientes com múltiplos usuários e operação em rede.
                    </p>
                  </button>
                </div>

                {config.provider === "sqlite" && (
                  <div className="rounded-lg border border-[var(--border)] p-4">
                    <h3 className="font-bold text-[var(--text)]">Banco SQLite local</h3>
                    <p className="mt-1 text-xs text-[var(--text-light)]">
                      O FactoryFlow utilizará um banco local armazenado junto aos arquivos da aplicação.
                    </p>

                    <div className="mt-3 rounded-md bg-[var(--soft)] p-3">
                      <p className="text-xs font-bold text-[var(--text)]">Caminho padrão:</p>
                      <p className="mt-2 rounded bg-white px-3 py-2 font-mono text-sm">
                        database/factoryflow.db
                      </p>
                      <p className="mt-2 text-xs text-[var(--text-light)]">
                        Sempre mantenha a pasta database no mesmo diretório do executável.
                      </p>
                    </div>
                  </div>
                )}

                {config.provider === "postgres" && (
                  <div className="rounded-lg border border-[var(--border)] p-4">
                    <h3 className="font-bold text-[var(--text)]">Conexão PostgreSQL</h3>
                    <p className="mt-1 text-xs text-[var(--text-light)]">
                      Informe os dados do servidor PostgreSQL que será utilizado futuramente pelo FactoryFlow.
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className={ui.label}>Host</label>
                        <input
                          value={config.postgres.host}
                          onChange={(e) => alterarPostgres("host", e.target.value)}
                          className={ui.input}
                        />
                      </div>

                      <div>
                        <label className={ui.label}>Porta</label>
                        <input
                          type="number"
                          value={config.postgres.port}
                          onChange={(e) => alterarPostgres("port", e.target.value)}
                          className={ui.input}
                        />
                      </div>

                      <div>
                        <label className={ui.label}>Banco</label>
                        <input
                          value={config.postgres.database}
                          onChange={(e) => alterarPostgres("database", e.target.value)}
                          className={ui.input}
                        />
                      </div>

                      <div>
                        <label className={ui.label}>Usuário</label>
                        <input
                          value={config.postgres.user}
                          onChange={(e) => alterarPostgres("user", e.target.value)}
                          className={ui.input}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className={ui.label}>Senha</label>
                        <input
                          type="password"
                          value={config.postgres.password}
                          onChange={(e) => alterarPostgres("password", e.target.value)}
                          className={ui.input}
                          placeholder="Senha do PostgreSQL"
                        />
                      </div>
                    </div>

                    <div className="mt-3 rounded-md bg-[var(--soft)] p-3 text-xs text-[var(--text-light)]">
                      A troca para PostgreSQL não migra dados automaticamente.
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {config.provider === "postgres" && (
                    <button
                      type="button"
                      onClick={testarPostgres}
                      disabled={carregando}
                      className={ui.buttonSecondary}
                    >
                      <span className="flex items-center gap-2">
                        <TestTube size={16} />
                        Testar conexão
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={cancelarAlteracoes}
                    disabled={carregando}
                    className={ui.buttonSecondary}
                  >
                    <span className="flex items-center gap-2">
                      <X size={16} />
                      Cancelar
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={salvarConfiguracao}
                    disabled={carregando}
                    className={ui.buttonPrimary}
                  >
                    <span className="flex items-center gap-2">
                      <Save size={16} />
                      Salvar configuração
                    </span>
                  </button>
                </div>
              </div>
            )}

            {abaAtiva === "impressao" && (
              <div>
                <div className="flex items-center gap-2">
                  <Printer size={20} className="text-[var(--primary)]" />
                  <div>
                    <h2 className={ui.title}>Impressão</h2>
                    <p className={ui.subtitle}>
                      Área reservada para configuração de impressoras em versões futuras.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input disabled placeholder="Impressora da ficha A6 - Em desenvolvimento..." className={`${ui.input} opacity-70`} />
                  <input disabled placeholder="Impressoras - Em desenvolvimento..." className={`${ui.input} opacity-70`} />
                </div>
              </div>
            )}

            {abaAtiva === "sistema" && (
              <div>
                <h2 className={ui.title}>Sistema</h2>
                <p className={ui.subtitle}>
                  Informações técnicas e recursos administrativos serão adicionados futuramente.
                </p>
              </div>
            )}

            {mensagem && (
              <div className={`mt-4 rounded-md px-4 py-3 text-sm font-semibold ${mensagemClassName}`}>
                {mensagem}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default ConfiguracoesPage