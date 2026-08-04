import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

type StatusInicial = Awaited<
  ReturnType<typeof window.api.configuracao.statusInicial>
>

type PostgresInicial = Awaited<
  ReturnType<typeof window.api.configuracao.carregarPostgresInicial>
>

const postgresPadrao: PostgresInicial = {
  host: 'localhost',
  port: 5432,
  database: 'factoryflow',
  user: 'postgres',
  password: '',
  passwordConfigured: false,
  clearPassword: false,
  timeoutSeconds: 15,
  ssl: false
}

function mensagemErro(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Ocorreu um erro inesperado.'
}

function ConfiguracaoInicialPage() {
  const navigate = useNavigate()

  const [status, setStatus] = useState<StatusInicial | null>(null)
  const [postgres, setPostgres] = useState<PostgresInicial>(postgresPadrao)
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState(false)

  const [nome, setNome] = useState('')
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')

  async function atualizarStatus() {
    setCarregando(true)
    setMensagem('')

    try {
      const atual = await window.api.configuracao.statusInicial()

      if (atual.status === 'PRONTO') {
        navigate('/', { replace: true })
        return
      }

      setStatus(atual)

      if (atual.status !== 'AGUARDANDO_SINCRONIZACAO') {
        const configPostgres =
          await window.api.configuracao.carregarPostgresInicial()

        setPostgres((anterior) => ({
          ...configPostgres,
          password: anterior.password || ''
        }))
      }
    } catch (error) {
      setMensagem(mensagemErro(error))
      setMensagemSucesso(false)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void atualizarStatus()
  }, [])

  function atualizarPostgres<K extends keyof PostgresInicial>(
    campo: K,
    valor: PostgresInicial[K]
  ) {
    setPostgres((anterior) => ({
      ...anterior,
      [campo]: valor
    }))
  }

  async function testarPostgres() {
    if (processando) return

    setProcessando(true)
    setMensagem('')

    try {
      const resultado =
        await window.api.configuracao.testarPostgresInicial(postgres)

      setMensagem(resultado.mensagem)
      setMensagemSucesso(resultado.sucesso)
    } catch (error) {
      setMensagem(mensagemErro(error))
      setMensagemSucesso(false)
    } finally {
      setProcessando(false)
    }
  }

  async function salvarPostgres(event: FormEvent) {
    event.preventDefault()

    if (processando) return

    setProcessando(true)
    setMensagem('')

    try {
      const resultado =
        await window.api.configuracao.salvarPostgresInicial(postgres)

      setMensagem(resultado.mensagem)
      setMensagemSucesso(resultado.sucesso)

      if (resultado.sucesso) {
        setPostgres((anterior) => ({
          ...anterior,
          password: '',
          passwordConfigured: true
        }))

        await atualizarStatus()
      }
    } catch (error) {
      setMensagem(mensagemErro(error))
      setMensagemSucesso(false)
    } finally {
      setProcessando(false)
    }
  }

  async function criarAdministrador(event: FormEvent) {
    event.preventDefault()

    if (processando) return

    setMensagem('')
    setMensagemSucesso(false)

    if (!nome.trim() || !matricula.trim()) {
      setMensagem('Informe o nome e a matrícula do administrador.')
      return
    }

    if (senha.length < 8) {
      setMensagem('A senha deve possuir pelo menos 8 caracteres.')
      return
    }

    if (senha !== confirmacaoSenha) {
      setMensagem('A confirmação da senha não confere.')
      return
    }

    setProcessando(true)

    try {
      const resultado =
        await window.api.configuracao.criarPrimeiroAdministrador({
          nome: nome.trim(),
          matricula: matricula.trim(),
          senha
        })

      setMensagem(resultado.mensagem)
      setMensagemSucesso(resultado.sucesso)

      if (resultado.sucesso) {
        setSenha('')
        setConfirmacaoSenha('')
        await atualizarStatus()
      }
    } catch (error) {
      setMensagem(mensagemErro(error))
      setMensagemSucesso(false)
    } finally {
      setProcessando(false)
    }
  }

  const etapa =
    status?.status === 'SEM_ADMIN'
      ? 2
      : status?.status === 'AGUARDANDO_SINCRONIZACAO'
        ? 3
        : 1

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-2xl font-bold shadow-lg shadow-orange-950/30">
            F
          </div>

          <div>
            <p className="text-sm font-semibold text-orange-500">
              FactoryFlow
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Configuração inicial
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Conecte o computador ao banco central e prepare o primeiro acesso.
            </p>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-3 gap-3">
          {[
            ['1', 'PostgreSQL'],
            ['2', 'Administrador'],
            ['3', 'Finalização']
          ].map(([numero, titulo], index) => {
            const numeroEtapa = index + 1
            const ativa = etapa === numeroEtapa
            const concluida = etapa > numeroEtapa

            return (
              <div
                key={numero}
                className={`rounded-2xl border px-4 py-3 ${
                  ativa
                    ? 'border-orange-500 bg-orange-950/30'
                    : concluida
                      ? 'border-emerald-800 bg-emerald-950/20'
                      : 'border-slate-800 bg-slate-900'
                }`}
              >
                <p
                  className={`text-xs font-bold ${
                    ativa
                      ? 'text-orange-400'
                      : concluida
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                  }`}
                >
                  ETAPA {numero}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-200">
                  {titulo}
                </p>
              </div>
            )
          })}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl">
          {carregando && (
            <div className="py-16 text-center text-slate-400">
              Verificando a instalação...
            </div>
          )}

          {!carregando && status && (
            <>
              <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-wide text-orange-500">
                  {status.status.replaceAll('_', ' ')}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {status.mensagem}
                </p>
              </div>

              {(status.status === 'SEM_CONFIGURACAO' ||
                status.status === 'SEM_CONEXAO') && (
                <form className="space-y-5" onSubmit={salvarPostgres}>
                  <div>
                    <h2 className="text-xl font-bold">
                      Conexão com PostgreSQL
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      A senha é armazenada pelo serviço protegido do sistema e
                      não é gravada no config.json.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm font-semibold text-slate-300">
                      Host
                      <input
                        value={postgres.host}
                        onChange={(event) =>
                          atualizarPostgres('host', event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-normal text-white outline-none focus:border-orange-500"
                        disabled={processando}
                      />
                    </label>

                    <label className="space-y-2 text-sm font-semibold text-slate-300">
                      Porta
                      <input
                        type="number"
                        min={1}
                        max={65535}
                        value={postgres.port}
                        onChange={(event) =>
                          atualizarPostgres(
                            'port',
                            Number(event.target.value)
                          )
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-normal text-white outline-none focus:border-orange-500"
                        disabled={processando}
                      />
                    </label>

                    <label className="space-y-2 text-sm font-semibold text-slate-300">
                      Banco de dados
                      <input
                        value={postgres.database}
                        onChange={(event) =>
                          atualizarPostgres('database', event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-normal text-white outline-none focus:border-orange-500"
                        disabled={processando}
                      />
                    </label>

                    <label className="space-y-2 text-sm font-semibold text-slate-300">
                      Usuário
                      <input
                        value={postgres.user}
                        onChange={(event) =>
                          atualizarPostgres('user', event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-normal text-white outline-none focus:border-orange-500"
                        disabled={processando}
                      />
                    </label>

                    <label className="space-y-2 text-sm font-semibold text-slate-300">
                      Senha do PostgreSQL
                      <input
                        type="password"
                        value={postgres.password ?? ''}
                        onChange={(event) =>
                          atualizarPostgres('password', event.target.value)
                        }
                        placeholder={
                          postgres.passwordConfigured
                            ? 'Deixe vazio para manter a senha salva'
                            : 'Digite a senha'
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-normal text-white outline-none focus:border-orange-500"
                        disabled={processando}
                      />
                    </label>

                    <label className="space-y-2 text-sm font-semibold text-slate-300">
                      Timeout em segundos
                      <input
                        type="number"
                        min={1}
                        max={300}
                        value={postgres.timeoutSeconds}
                        onChange={(event) =>
                          atualizarPostgres(
                            'timeoutSeconds',
                            Number(event.target.value)
                          )
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-normal text-white outline-none focus:border-orange-500"
                        disabled={processando}
                      />
                    </label>
                  </div>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={postgres.ssl}
                      onChange={(event) =>
                        atualizarPostgres('ssl', event.target.checked)
                      }
                      disabled={processando}
                    />
                    Usar SSL com validação do certificado
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={testarPostgres}
                      disabled={processando}
                      className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                    >
                      Testar conexão
                    </button>

                    <button
                      type="submit"
                      disabled={processando}
                      className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-500 disabled:opacity-50"
                    >
                      {processando
                        ? 'Salvando...'
                        : 'Salvar e continuar'}
                    </button>
                  </div>
                </form>
              )}

              {status.status === 'SEM_ADMIN' && (
                <form className="space-y-5" onSubmit={criarAdministrador}>
                  <div>
                    <h2 className="text-xl font-bold">
                      Primeiro administrador
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Esta conta será criada diretamente no PostgreSQL. A
                      operação é protegida contra dois computadores tentando
                      criar o primeiro administrador ao mesmo tempo. No primeiro
                      login, o administrador deverá definir uma nova senha.
                    </p>
                  </div>

                  <label className="block space-y-2 text-sm font-semibold text-slate-300">
                    Nome
                    <input
                      value={nome}
                      onChange={(event) => setNome(event.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-normal text-white outline-none focus:border-orange-500"
                      disabled={processando}
                    />
                  </label>

                  <label className="block space-y-2 text-sm font-semibold text-slate-300">
                    Matrícula
                    <input
                      value={matricula}
                      onChange={(event) => setMatricula(event.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-normal text-white outline-none focus:border-orange-500"
                      disabled={processando}
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm font-semibold text-slate-300">
                      Senha temporária
                      <input
                        type="password"
                        value={senha}
                        onChange={(event) => setSenha(event.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-normal text-white outline-none focus:border-orange-500"
                        disabled={processando}
                      />
                    </label>

                    <label className="space-y-2 text-sm font-semibold text-slate-300">
                      Confirmar senha temporária
                      <input
                        type="password"
                        value={confirmacaoSenha}
                        onChange={(event) =>
                          setConfirmacaoSenha(event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-normal text-white outline-none focus:border-orange-500"
                        disabled={processando}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={processando}
                    className="w-full rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-500 disabled:opacity-50"
                  >
                    {processando
                      ? 'Criando administrador...'
                      : 'Criar primeiro administrador'}
                  </button>
                </form>
              )}

              {status.status === 'AGUARDANDO_SINCRONIZACAO' && (
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950 text-3xl text-emerald-400">
                    ✓
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold">
                      Administrador encontrado
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                      O PostgreSQL já possui um administrador. O FactoryFlow
                      precisa trazê-lo para o banco local antes do primeiro
                      login. Em uma configuração recém-salva, feche e abra o
                      aplicativo para iniciar a sincronização.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={() => void atualizarStatus()}
                      disabled={processando}
                      className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                    >
                      Verificar novamente
                    </button>

                    <button
                      type="button"
                      onClick={() => window.close()}
                      className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-500"
                    >
                      Fechar FactoryFlow
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {mensagem && (
            <p
              className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                mensagemSucesso
                  ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-300'
                  : 'border-red-900/50 bg-red-950/30 text-red-300'
              }`}
            >
              {mensagem}
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

export default ConfiguracaoInicialPage
