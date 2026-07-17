import type { RegistroCsv, ResumoImportacao } from '../importacao.types'

/**
 * Reservado para a próxima etapa.
 *
 * A associação Posto x Defeito será implementada junto da prévia enriquecida,
 * para que nenhum vínculo seja criado sem validação prévia.
 */
export async function importarPostoDefeitos(_registros: RegistroCsv[]): Promise<ResumoImportacao> {
  throw new Error('A importação de defeitos por posto ainda não foi habilitada.')
}
