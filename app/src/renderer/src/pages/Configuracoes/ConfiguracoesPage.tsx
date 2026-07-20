import { useEffect, useState } from 'react'
import { Cloud, Database, HardDrive, Save, Server, TestTube, X } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import { ui } from '../../theme/ui'

type StorageMode = 'sqliteSync' | 'api' | 'postgres'
type SyncDestination = 'postgres' | 'api'
type Aba = 'banco' | 'impressao' | 'sistema'

type ConfiguracaoBanco = {
  mode: StorageMode
  sqlite: {
    path: string
  }
  postgres: {
    host: string
    port: number
    database: string
    user: string
    password?: string
    passwordConfigured: boolean
    clearPassword?: boolean
    timeoutSeconds: number
    ssl: boolean
  }
  api: {
    baseUrl: string
    version: string
    authMethod: 'bearer'
    timeoutSeconds: number
    validateSsl: boolean
    retryOnError: boolean
  }
  sync: {
    enabled: boolean
    destination: SyncDestination
    syncOnStartup: boolean
    syncOnReconnect: boolean
    retryFailed: boolean
    refugoRetention: {
      enabled: boolean
      months: number | null
    }
  }
}

function ConfiguracoesPage() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('banco')
  const [config, setConfig] = useState<ConfiguracaoBanco | null>(null)
  const [configOriginal, setConfigOriginal] = useState<ConfiguracaoBanco | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [tipoMensagem, setTipoMensagem] = useState<'sucesso' | 'erro' | 'info'>('info')
  const [carregando, setCarregando] = useState(false)

  async function carregarConfiguracao() {
    const dados = await window.api.configuracao.carregarBanco()
    setConfig(dados)
    setConfigOriginal(dados)
  }

  useEffect(() => {
    void carregarConfiguracao()
  }, [])

  if (!config) {
    return (
      <main className={ui.page}>
        <PageHeader title="Configurações" subtitle="Carregando configurações..." />
      </main>
    )
  }

  function selecionarModo(mode: StorageMode) {
    if (mode === 'api') {
      setTipoMensagem('info')
      setMensagem('O modo API será habilitado em uma etapa futura.')
      return
    }

    setMensagem('')
    setConfig((atual) => (atual ? { ...atual, mode } : atual))
  }

  function alterarPostgres(
    campo: keyof ConfiguracaoBanco['postgres'],
    valor: string | number | boolean
  ) {
    setConfig((atual) =>
      atual
        ? {
            ...atual,
            postgres: {
              ...atual.postgres,
              [campo]: campo === 'port' || campo === 'timeoutSeconds' ? Number(valor) : valor
            }
          }
        : atual
    )
  }

  async function testarPostgres() {
    if (!config) return

    const configAtual = config

    setCarregando(true)
    setMensagem('')

    try {
      const resultado = await window.api.configuracao.testarPostgres(configAtual.postgres)
      setTipoMensagem(resultado.sucesso ? 'sucesso' : 'erro')
      setMensagem(resultado.mensagem)
    } catch (error) {
      setTipoMensagem('erro')
      setMensagem(error instanceof Error ? error.message : 'Não foi possível testar a conexão.')
    } finally {
      setCarregando(false)
    }
  }

  async function salvarConfiguracao() {
    if (!config) return

    const configAtual = config

    setCarregando(true)
    setMensagem('')

    try {
      const resultado = await window.api.configuracao.salvarBanco(configAtual)
      setTipoMensagem('sucesso')
      setMensagem(resultado.mensagem)

      const recarregada = await window.api.configuracao.carregarBanco()
      setConfig(recarregada)
      setConfigOriginal(recarregada)
    } catch (error) {
      setTipoMensagem('erro')
      setMensagem(error instanceof Error ? error.message : 'Erro ao salvar configuração.')
    } finally {
      setCarregando(false)
    }
  }

  function restaurar() {
    if (configOriginal) {
      setConfig(configOriginal)
      setMensagem('')
    }
  }

  const cardClass = (ativo: boolean, desabilitado = false) =>
    `rounded-lg border p-4 text-left transition ${
      desabilitado
        ? 'cursor-not-allowed border-[var(--border)] opacity-60'
        : ativo
          ? 'border-[var(--primary)] bg-orange-50'
          : 'border-[var(--border)] bg-white hover:bg-[var(--soft)]'
    }`

  const mensagemClassName =
    tipoMensagem === 'sucesso'
      ? 'bg-green-50 text-green-700'
      : tipoMensagem === 'erro'
        ? 'bg-red-50 text-red-700'
        : 'bg-orange-50 text-orange-700'

  const mostraPostgres =
    config.mode === 'postgres' ||
    (config.mode === 'sqliteSync' && config.sync.enabled && config.sync.destination === 'postgres')

  return (
    <main className={ui.page}>
      <PageHeader
        title="Configurações"
        subtitle="Configure o armazenamento local e os destinos remotos."
      />

      <section className={ui.section}>
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="flex border-b border-[var(--border)] bg-[var(--soft)]">
            <button
              onClick={() => setAbaAtiva('banco')}
              className={`px-4 py-3 text-sm font-bold ${
                abaAtiva === 'banco' ? 'bg-white text-[var(--primary)]' : 'text-[var(--text)]'
              }`}
            >
              Banco de dados
            </button>

            <button
              onClick={() => setAbaAtiva('impressao')}
              className={`px-4 py-3 text-sm font-bold ${
                abaAtiva === 'impressao' ? 'bg-white text-[var(--primary)]' : 'text-[var(--text)]'
              }`}
            >
              Impressão
            </button>

            <button
              onClick={() => setAbaAtiva('sistema')}
              className={`px-4 py-3 text-sm font-bold ${
                abaAtiva === 'sistema' ? 'bg-white text-[var(--primary)]' : 'text-[var(--text)]'
              }`}
            >
              Sistema
            </button>
          </div>

          <div className="p-4">
            {abaAtiva === 'banco' && (
              <div className="space-y-4">
                <div>
                  <h2 className={ui.title}>Modo de armazenamento</h2>
                  <p className={ui.subtitle}>Escolha onde a aplicação salvará os dados.</p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => selecionarModo('sqliteSync')}
                    className={cardClass(config.mode === 'sqliteSync')}
                  >
                    <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                      <HardDrive size={18} />
                      SQLite + Sync
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-light)]">
                      Salva localmente e pode sincronizar com um destino remoto.
                    </p>
                  </button>

                  <button type="button" disabled className={cardClass(false, true)}>
                    <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                      <Cloud size={18} />
                      API
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-light)]">
                      Integração futura por meio de uma API.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => selecionarModo('postgres')}
                    className={cardClass(config.mode === 'postgres')}
                  >
                    <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                      <Server size={18} />
                      PostgreSQL
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-light)]">
                      Salva diretamente no servidor e requer conexão.
                    </p>
                  </button>
                </div>

                {config.mode === 'sqliteSync' && (
                  <>
                    <div className="rounded-lg border border-[var(--border)] p-4">
                      <h3 className="font-bold text-[var(--text)]">Banco SQLite local</h3>
                      <p className="mt-1 text-xs text-[var(--text-light)]">
                        O banco fica próximo ao executável do FactoryFlow.
                      </p>

                      <div className="mt-3 rounded-md bg-[var(--soft)] p-3">
                        <p className="text-xs font-bold text-[var(--text)]">Caminho:</p>
                        <p className="mt-2 rounded bg-white px-3 py-2 font-mono text-sm">
                          database/database.db
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-[var(--border)] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-[var(--text)]">Ativar sincronização</h3>
                          <p className="mt-1 text-xs text-[var(--text-light)]">
                            O SQLite continua sendo o banco principal mesmo sem conexão.
                          </p>
                        </div>

                        <input
                          type="checkbox"
                          checked={config.sync.enabled}
                          onChange={(event) =>
                            setConfig({
                              ...config,
                              sync: {
                                ...config.sync,
                                enabled: event.target.checked
                              }
                            })
                          }
                          className="h-5 w-5"
                        />
                      </div>

                      {config.sync.enabled && (
                        <div className="mt-4">
                          <p className="text-sm font-bold text-[var(--text)]">Destino remoto</p>

                          <div className="mt-2 grid gap-3 md:grid-cols-2">
                            <button
                              type="button"
                              onClick={() =>
                                setConfig({
                                  ...config,
                                  sync: { ...config.sync, destination: 'postgres' }
                                })
                              }
                              className={cardClass(config.sync.destination === 'postgres')}
                            >
                              <span className="font-bold">PostgreSQL</span>
                              <p className="mt-1 text-xs text-[var(--text-light)]">
                                Sincronização direta com o servidor.
                              </p>
                            </button>

                            <button type="button" disabled className={cardClass(false, true)}>
                              <span className="font-bold">API</span>
                              <p className="mt-1 text-xs text-[var(--text-light)]">
                                Disponível em uma etapa futura.
                              </p>
                            </button>
                          </div>

                          <div className="mt-4 space-y-3">
                            {[
                              ['syncOnStartup', 'Sincronizar ao iniciar'],
                              ['syncOnReconnect', 'Sincronizar ao recuperar conexão'],
                              ['retryFailed', 'Repetir operações com erro']
                            ].map(([campo, titulo]) => (
                              <label
                                key={campo}
                                className="flex items-center justify-between gap-4 text-sm"
                              >
                                <span>{titulo}</span>
                                <input
                                  type="checkbox"
                                  checked={Boolean(config.sync[campo as keyof typeof config.sync])}
                                  onChange={(event) =>
                                    setConfig({
                                      ...config,
                                      sync: {
                                        ...config.sync,
                                        [campo]: event.target.checked
                                      }
                                    })
                                  }
                                  className="h-5 w-5"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {config.mode === 'postgres' && (
                  <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-700">
                    Neste modo o aplicativo depende da conexão com o PostgreSQL e não funciona
                    offline.
                  </div>
                )}

                {mostraPostgres && (
                  <div className="rounded-lg border border-[var(--border)] p-4">
                    <div className="flex items-center gap-2">
                      <Database size={18} className="text-[var(--primary)]" />
                      <h3 className="font-bold text-[var(--text)]">Conexão PostgreSQL</h3>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className={ui.label}>Host</label>
                        <input
                          value={config.postgres.host}
                          onChange={(event) => alterarPostgres('host', event.target.value)}
                          className={ui.input}
                        />
                      </div>

                      <div>
                        <label className={ui.label}>Porta</label>
                        <input
                          type="number"
                          value={config.postgres.port}
                          onChange={(event) => alterarPostgres('port', event.target.value)}
                          className={ui.input}
                        />
                      </div>

                      <div>
                        <label className={ui.label}>Banco</label>
                        <input
                          value={config.postgres.database}
                          onChange={(event) => alterarPostgres('database', event.target.value)}
                          className={ui.input}
                        />
                      </div>

                      <div>
                        <label className={ui.label}>Usuário</label>
                        <input
                          value={config.postgres.user}
                          onChange={(event) => alterarPostgres('user', event.target.value)}
                          className={ui.input}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className={ui.label}>Senha</label>
                        <input
                          type="password"
                          value={config.postgres.password ?? ''}
                          onChange={(event) => alterarPostgres('password', event.target.value)}
                          className={ui.input}
                          placeholder={
                            config.postgres.passwordConfigured
                              ? 'Senha protegida já configurada — deixe vazio para manter'
                              : 'Digite a senha do PostgreSQL'
                          }
                        />
                      </div>

                      <div>
                        <label className={ui.label}>Timeout em segundos</label>
                        <input
                          type="number"
                          min={1}
                          value={config.postgres.timeoutSeconds}
                          onChange={(event) =>
                            alterarPostgres('timeoutSeconds', event.target.value)
                          }
                          className={ui.input}
                        />
                      </div>

                      <label className="flex items-center gap-2 pt-7 text-sm">
                        <input
                          type="checkbox"
                          checked={config.postgres.ssl}
                          onChange={(event) => alterarPostgres('ssl', event.target.checked)}
                          className="h-5 w-5"
                        />
                        Usar conexão SSL
                      </label>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
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

                      {config.postgres.passwordConfigured && (
                        <label className="flex items-center gap-2 text-sm text-red-700">
                          <input
                            type="checkbox"
                            checked={Boolean(config.postgres.clearPassword)}
                            onChange={(event) =>
                              alterarPostgres('clearPassword', event.target.checked)
                            }
                          />
                          Limpar senha protegida ao salvar
                        </label>
                      )}
                    </div>

                    <div className="mt-3 rounded-md bg-[var(--soft)] p-3 text-xs text-[var(--text-light)]">
                      Host, porta, banco e usuário ficam em config/config.json. A senha fica
                      criptografada em config/secrets.json e não é devolvida para esta tela.
                    </div>
                  </div>
                )}

                <div className="rounded-md bg-[var(--soft)] p-3 text-xs text-[var(--text-light)]">
                  Nesta primeira etapa, a sincronização automática ainda não envia registros. A base
                  local segura, a identificação da máquina e a fila de sincronização serão criadas.
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={restaurar}
                    disabled={carregando}
                    className={ui.buttonSecondary}
                  >
                    <span className="flex items-center gap-2">
                      <X size={16} />
                      Restaurar
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
                      Salvar configurações
                    </span>
                  </button>
                </div>
              </div>
            )}

            {abaAtiva === 'impressao' && (
              <div>
                <h2 className={ui.title}>Impressão</h2>
                <p className={ui.subtitle}>Configurações de impressão serão adicionadas depois.</p>
              </div>
            )}

            {abaAtiva === 'sistema' && (
              <div>
                <h2 className={ui.title}>Sistema</h2>
                <p className={ui.subtitle}>Informações técnicas e administrativas.</p>
              </div>
            )}

            {mensagem && (
              <div
                className={`mt-4 rounded-md px-4 py-3 text-sm font-semibold ${mensagemClassName}`}
              >
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
