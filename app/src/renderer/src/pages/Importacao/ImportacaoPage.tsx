import { useState } from 'react'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'

import PageHeader from '../../components/PageHeader/PageHeader'
import { ui } from '../../theme/ui'
import { ConfirmarImportacaoModal } from './components/ConfirmarImportacaoModal'
import { ImportacaoPreviewModal } from './components/ImportacaoPreviewModal'

type TipoImportacao =
  | 'setores'
  | 'subsetores'
  | 'postos'
  | 'componentes'
  | 'circuitos'
  | 'defeitos'
  | 'usuarios'
  | 'circuitoComponentes'
  | 'roteiros'

type AbaImportacao = {
  id: TipoImportacao
  titulo: string
  descricao: string
  colunas: string[]
}

type RegistroPreview = {
  id: number
  linha: number
  selecionado: boolean
  dados: Record<string, string>
  status: 'NOVO' | 'ATUALIZAR' | 'RESTAURAR' | 'SEM_ALTERACAO' | 'ERRO'
  resumo: string
  mensagens: string[]
  alteracoes: {
    campo: string
    valorAtual: string | null
    novoValor: string | null
  }[]
  registroExistenteId?: number
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
    id: 'usuarios',
    titulo: 'Usuários',
    descricao: 'Importe usuários, perfis e senhas iniciais.',
    colunas: ['matricula', 'nome', 'perfil', 'senha']
  }
]

function ImportacaoPage() {
  const [abaAtiva, setAbaAtiva] = useState<TipoImportacao>('setores')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false)
  const [registrosPreview, setRegistrosPreview] = useState<RegistroPreview[]>([])

  const aba = abas.find((item) => item.id === abaAtiva) ?? abas[0]

  async function baixarModelo() {
    setCarregando(true)
    setMensagem('')

    try {
      const resultado = await window.api.importacao.baixarModelo(aba.id)
      setMensagem(resultado.mensagem)
    } finally {
      setCarregando(false)
    }
  }

  async function selecionarArquivo() {
    setCarregando(true)
    setMensagem('')

    try {
      const resultado = await window.api.importacao.preVisualizar(aba.id)

      if (!resultado.sucesso) {
        setMensagem(resultado.mensagem)
        return
      }

      setRegistrosPreview(resultado.registros)
      setModalAberto(true)
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

  const registrosSelecionados = registrosPreview.filter(
    (registro) => registro.selecionado
  )

  function solicitarConfirmacaoImportacao() {
    if (registrosSelecionados.length === 0) return

    setConfirmacaoAberta(true)
  }

  async function importarSelecionados() {
    if (registrosSelecionados.length === 0) return

    setCarregando(true)
    setMensagem('')

    try {
      const resultado = await window.api.importacao.importarRegistros(
        aba.id,
        registrosSelecionados.map((registro) => registro.dados)
      )

      setMensagem(
        `${resultado.mensagem} Inseridos: ${resultado.inseridos} | Atualizados: ${resultado.atualizados} | Ignorados: ${resultado.ignorados}`
      )

      setConfirmacaoAberta(false)
      setModalAberto(false)
      setRegistrosPreview([])
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
                  setMensagem('')
                  setRegistrosPreview([])
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
              <div className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                {mensagem}
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
          carregando={carregando}
          onFechar={() => setModalAberto(false)}
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
