import { useState } from 'react'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import { useApp } from '../../contexts/AppContext'
import { ui } from '../../theme/ui'
import { ConfirmarImportacaoModal } from './components/ConfirmarImportacaoModal'
import { ImportacaoPreviewModal } from './components/ImportacaoPreviewModal'
import type { AvisoImportacao, RegistroPreview, TipoImportacao } from './importacao.types'

type TipoMensagem = 'sucesso' | 'erro'

type MensagemTela = {
  tipo: TipoMensagem
  texto: string
}

type AbaImportacao = {
  id: TipoImportacao
  titulo: string
  descricao: string
  colunas: string[]
}

const abas: AbaImportacao[] = [
  {
    id: 'setores',
    titulo: 'Setores',
    descricao: 'Importe os setores principais da fábrica.',
    colunas: ['nome', 'sigla']
  },
  {
    id: 'subsetores',
    titulo: 'Subsetores',
    descricao: 'Importe subsetores vinculados aos setores.',
    colunas: ['setor_sigla', 'nome']
  },
  {
    id: 'postos',
    titulo: 'Postos',
    descricao: 'Importe postos de trabalho vinculados aos subsetores.',
    colunas: ['setor_sigla', 'subsetor_nome', 'nome']
  },
  {
    id: 'componentes',
    titulo: 'Componentes',
    descricao: 'Importe componentes e peças.',
    colunas: ['codigo', 'nome', 'preco']
  },
  {
    id: 'circuitos',
    titulo: 'Circuitos',
    descricao: 'Importe circuitos/produtos.',
    colunas: ['codigo', 'nome']
  },
  {
    id: 'circuitoComponentes',
    titulo: 'Circuito x Componentes',
    descricao: 'Vincule componentes aos circuitos.',
    colunas: ['circuito_codigo', 'componente_codigo', 'quantidade']
  },
  {
    id: 'roteiros',
    titulo: 'Roteiros',
    descricao: 'Vincule circuito, posto e componente.',
    colunas: ['circuito_codigo', 'posto_nome', 'componente_codigo', 'quantidade']
  },
  {
    id: 'defeitos',
    titulo: 'Defeitos',
    descricao: 'Importe códigos e descrições de defeitos.',
    colunas: ['codigo', 'descricao']
  },
  {
    id: 'postoDefeitos',
    titulo: 'Posto x Defeitos',
    descricao: 'Vincule os defeitos permitidos a cada posto de trabalho.',
    colunas: ['setor_sigla', 'subsetor_nome', 'posto_nome', 'defeito_codigo']
  },
  {
    id: 'usuarios',
    titulo: 'Usuários',
    descricao: 'Importe usuários, perfis e senhas iniciais.',
    colunas: ['matricula', 'nome', 'perfil', 'senha']
  },
  {
    id: 'refugosHistoricos',
    titulo: 'Refugos históricos',
    descricao: 'Migre lançamentos antigos agrupados por id_origem.',
    colunas: [
      'id_origem',
      'data_hora',
      'matricula_operador',
      'setor_sigla',
      'subsetor_nome',
      'posto_nome',
      'circuito_codigo',
      'turno',
      'quantidade_produzida',
      'total_itens',
      'observacao'
    ]
  }
]

function ImportacaoPage() {
  const { usuario } = useApp()
  const [abaAtiva, setAbaAtiva] = useState<TipoImportacao>('setores')
  const [mensagem, setMensagem] = useState<MensagemTela | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false)
  const [registrosPreview, setRegistrosPreview] = useState<RegistroPreview[]>([])
  const [avisosImportacao, setAvisosImportacao] = useState<AvisoImportacao[]>([])

  const aba = abas.find((item) => item.id === abaAtiva) ?? abas[0]

  function mensagemErro(error: unknown, padrao: string) {
    return error instanceof Error && error.message ? error.message : padrao
  }

  async function baixarModelo() {
    setCarregando(true)
    setMensagem(null)

    try {
      const resultado = await window.api.importacao.baixarModelo(aba.id)

      setMensagem({
        tipo: resultado.sucesso ? 'sucesso' : 'erro',
        texto: resultado.mensagem
      })
    } catch (error) {
      setMensagem({
        tipo: 'erro',
        texto: mensagemErro(error, 'Não foi possível salvar o modelo CSV.')
      })
    } finally {
      setCarregando(false)
    }
  }

  async function selecionarArquivo() {
    setCarregando(true)
    setMensagem(null)

    try {
      const resultado = await window.api.importacao.preVisualizar(aba.id)

      if (!resultado.sucesso) {
        setMensagem({
          tipo: 'erro',
          texto: resultado.mensagem
        })
        return
      }

      setRegistrosPreview(resultado.registros)
      setAvisosImportacao(resultado.avisos ?? [])
      setModalAberto(true)
    } catch (error) {
      setMensagem({
        tipo: 'erro',
        texto: mensagemErro(error, 'Não foi possível analisar o arquivo CSV.')
      })
    } finally {
      setCarregando(false)
    }
  }

  function alternarTodos(selecionado: boolean) {
    setRegistrosPreview((registros) =>
      registros.map((registro) => ({
        ...registro,
        selecionado:
          registro.status === 'ERRO' || registro.status === 'SEM_ALTERACAO' ? false : selecionado
      }))
    )
  }

  function alternarLinha(id: number) {
    setRegistrosPreview((registros) =>
      registros.map((registro) =>
        registro.id === id && registro.status !== 'ERRO' && registro.status !== 'SEM_ALTERACAO'
          ? { ...registro, selecionado: !registro.selecionado }
          : registro
      )
    )
  }

  const registrosSelecionados = registrosPreview.filter((registro) => registro.selecionado)

  function solicitarConfirmacaoImportacao() {
    if (registrosSelecionados.length === 0) return

    setConfirmacaoAberta(true)
  }

  async function importarSelecionados() {
    if (registrosSelecionados.length === 0) return

    setCarregando(true)
    setMensagem(null)

    try {
      const resultado = await window.api.importacao.importarRegistros(
        aba.id,
        registrosSelecionados.map((registro) => registro.dados),
        usuario.id ?? null
      )

      setMensagem({
        tipo: resultado.sucesso ? 'sucesso' : 'erro',
        texto: `${resultado.mensagem} Inseridos: ${resultado.inseridos} | Atualizados: ${resultado.atualizados} | Ignorados: ${resultado.ignorados}`
      })

      if (!resultado.sucesso) return

      setConfirmacaoAberta(false)
      setModalAberto(false)
      setRegistrosPreview([])
      setAvisosImportacao([])
    } catch (error) {
      setMensagem({
        tipo: 'erro',
        texto: mensagemErro(error, 'Não foi possível concluir a importação.')
      })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className={ui.page}>
      <PageHeader
        title="Importação de Dados"
        subtitle="Baixe modelos CSV e importe cadastros em lote para o FactoryFlow."
      />

      <section className={ui.section}>
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="flex flex-wrap border-b border-[var(--border)] bg-[var(--soft)]">
            {abas.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setAbaAtiva(item.id)
                  setMensagem(null)
                  setRegistrosPreview([])
                  setAvisosImportacao([])
                }}
                className={`border-r border-[var(--border)] px-4 py-3 text-sm font-semibold ${
                  abaAtiva === item.id
                    ? 'bg-white text-[var(--primary)]'
                    : 'text-[var(--text)] hover:bg-white/70'
                }`}
              >
                {item.titulo}
              </button>
            ))}
          </div>

          <div className="p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={20} className="text-[var(--primary)]" />
                  <h2 className={ui.title}>{aba.titulo}</h2>
                </div>

                <p className={ui.subtitle}>{aba.descricao}</p>
              </div>

              {carregando && (
                <span className="rounded bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                  Processando...
                </span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[var(--border)] p-4">
                <h3 className="text-sm font-bold text-[var(--text)]">Modelo do arquivo</h3>

                <p className="mt-1 text-xs text-[var(--text-light)]">
                  Baixe o modelo e preencha as colunas obrigatórias.
                </p>

                <div className="mt-3 rounded-md bg-[var(--soft)] p-3">
                  <p className="text-xs font-bold text-[var(--text)]">Colunas esperadas:</p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {aba.colunas.map((coluna) => (
                      <span
                        key={coluna}
                        className="rounded bg-white px-2 py-1 text-xs font-semibold text-[var(--text)]"
                      >
                        {coluna}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={baixarModelo}
                  disabled={carregando}
                  className="mt-4 flex items-center gap-2 rounded-md border border-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-orange-50 disabled:opacity-60"
                >
                  <Download size={16} />
                  Baixar modelo CSV
                </button>
              </div>

              <div className="rounded-lg border border-[var(--border)] p-4">
                <h3 className="text-sm font-bold text-[var(--text)]">Importar arquivo</h3>

                <p className="mt-1 text-xs text-[var(--text-light)]">
                  Selecione um arquivo CSV para pré-visualizar antes de importar.
                </p>

                <div className="mt-3 rounded-md bg-[var(--soft)] p-3 text-xs text-[var(--text)]">
                  O sistema irá carregar o arquivo em uma prévia. Você poderá selecionar todos os
                  registros ou apenas algumas linhas antes de confirmar a importação.
                </div>

                {aba.id === 'refugosHistoricos' && (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                    Uso exclusivo para migração de dados antigos. Cada id_origem forma um único
                    refugo, mesmo quando houver várias linhas de itens. Registros já importados não
                    serão duplicados.
                  </div>
                )}

                <button
                  onClick={selecionarArquivo}
                  disabled={carregando}
                  className="mt-4 flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  <Upload size={16} />
                  Selecionar CSV
                </button>
              </div>
            </div>

            {mensagem && (
              <div
                role={mensagem.tipo === 'erro' ? 'alert' : 'status'}
                className={`mt-4 rounded-md px-4 py-3 text-sm font-semibold ${
                  mensagem.tipo === 'erro'
                    ? 'border border-red-200 bg-red-50 text-red-700'
                    : 'border border-green-200 bg-green-50 text-green-700'
                }`}
              >
                {mensagem.texto}
              </div>
            )}
          </div>
        </div>
      </section>

      {modalAberto && (
        <ImportacaoPreviewModal
          titulo={aba.titulo}
          colunas={aba.colunas}
          registros={registrosPreview}
          avisos={avisosImportacao}
          carregando={carregando}
          onFechar={() => {
            setConfirmacaoAberta(false)
            setModalAberto(false)
            setRegistrosPreview([])
            setAvisosImportacao([])
          }}
          onToggleTodos={alternarTodos}
          onToggleLinha={alternarLinha}
          onConfirmar={solicitarConfirmacaoImportacao}
        />
      )}

      {confirmacaoAberta && (
        <ConfirmarImportacaoModal
          titulo={aba.titulo}
          registros={registrosSelecionados}
          carregando={carregando}
          onCancelar={() => setConfirmacaoAberta(false)}
          onConfirmar={importarSelecionados}
        />
      )}
    </main>
  )
}

export default ImportacaoPage
