import { RepositoryFactory } from '../../../repositories/factory/RepositoryFactory'
import type { RegistroCsv, ResumoImportacao } from '../importacao.types'

type ItemHistoricoSerializado = {
  componenteId: number
  defeitoId: number
  quantidade: number
  precoUnitario?: number
}

function inteiroObrigatorio(valor: string, campo: string): number {
  const numero = Number(valor)
  if (!Number.isSafeInteger(numero) || numero <= 0) {
    throw new Error(`Valor inválido para ${campo}.`)
  }
  return numero
}

export async function importarRefugosHistoricos(
  registros: RegistroCsv[],
  usuarioId: number
): Promise<ResumoImportacao> {
  if (!usuarioId) {
    throw new Error('USUARIO_NAO_IDENTIFICADO')
  }

  const usuariosRepository = RepositoryFactory.usuarios()
  const usuario = await usuariosRepository.buscarPerfilPorId(usuarioId)

  if (!usuario || !usuario.ativo || !new Set(['ADMIN', 'QUALIDADE']).has(usuario.perfil)) {
    throw new Error('SEM_PERMISSAO_MIGRACAO_REFUGOS')
  }

  const repository = RepositoryFactory.refugos()
  let inseridos = 0
  let ignorados = 0

  for (const registro of registros) {
    const idOrigem = registro.id_origem?.trim()

    if (!idOrigem) {
      ignorados++
      continue
    }

    if (await repository.existeIdOrigemHistorica(idOrigem)) {
      ignorados++
      continue
    }

    const itens = JSON.parse(registro.__itens_json ?? '[]') as ItemHistoricoSerializado[]

    if (!Array.isArray(itens) || itens.length === 0) {
      throw new Error(`O refugo ${idOrigem} não possui itens válidos.`)
    }

    await repository.criarHistorico({
      idOrigem,
      dataHora: registro.data_hora,
      matriculaOperador: registro.matricula_operador,
      usuarioId,
      setorId: inteiroObrigatorio(registro.__setor_id, 'setor'),
      subsetorId: inteiroObrigatorio(registro.__subsetor_id, 'subsetor'),
      postoId: inteiroObrigatorio(registro.__posto_id, 'posto'),
      circuitoId: inteiroObrigatorio(registro.__circuito_id, 'circuito'),
      turno: registro.turno,
      quantidadeProduzida: inteiroObrigatorio(
        registro.quantidade_produzida,
        'quantidade produzida'
      ),
      observacao: registro.observacao || undefined,
      itens
    })

    inseridos++
  }

  return {
    inseridos,
    atualizados: 0,
    ignorados
  }
}
