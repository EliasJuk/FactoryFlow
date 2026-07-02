import {
  CriarRefugoInput
} from "../repositories/postgres/RefugoRepository"

import type { ResultadoFiltros } from "../repositories/postgres/ResultadoRepository"

import { RepositoryFactory } from "../repositories/factory/RepositoryFactory"
import { RefugoPrintService } from "./RefugoPrintService"

export class RefugoService {
  private repository = RepositoryFactory.refugos()
  private resultadoRepository = RepositoryFactory.resultados()
  private printService = new RefugoPrintService()

  async criar(input: CriarRefugoInput) {
    const resultado = await this.repository.criar(input)

    try {
      const refugo = await this.repository.buscarParaImpressao(resultado.id)
      await this.printService.imprimir(refugo)
    } catch (error) {
      console.error("[REFUGO] Erro ao imprimir ficha:", error)
    }

    return resultado.numeroRefugo
  }

  async listar(busca = "", pagina = 1, limite = 10) {
    return await this.repository.listar(busca, pagina, limite)
  }

  async editarCompleto(
    id: number,
    matricula: string,
    turno: string,
    quantidadeProduzida: number,
    observacao: string | undefined,
    itens: { id: number; defeitoId: number; quantidade: number }[]
  ) {
    return await this.repository.editarCompleto(
      id,
      matricula,
      turno,
      quantidadeProduzida,
      observacao,
      itens
    )
  }

  async cancelar(id: number, motivo: string) {
    return await this.repository.cancelar(id, motivo)
  }

  async imprimir(id: number) {
    const refugo = await this.repository.buscarParaImpressao(id)
    await this.printService.imprimir(refugo)
  }

  async resultados(filtros: ResultadoFiltros) {
    return await this.resultadoRepository.resultados(filtros)
  }
}