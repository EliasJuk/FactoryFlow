import {
  RefugoRepository,
  CriarRefugoInput
} from "../repositories/RefugoRepository"

import { RefugoPrintService } from "./RefugoPrintService"

export class RefugoService {
  private repository = new RefugoRepository()
  private printService = new RefugoPrintService()

  async criar(input: CriarRefugoInput) {
    const resultado = this.repository.criar(input)

    try {
      const refugo = this.repository.buscarParaImpressao(resultado.id)
      await this.printService.imprimir(refugo)
    } catch (error) {
      console.error("[REFUGO] Erro ao imprimir ficha:", error)
    }

    return resultado.numeroRefugo
  }

  listar(busca = "", pagina = 1, limite = 10) {
    return this.repository.listar(busca, pagina, limite)
  }

  editarCompleto(
    id: number,
    matricula: string,
    turno: string,
    quantidadeProduzida: number,
    observacao: string | undefined,
    itens: { id: number; defeitoId: number; quantidade: number }[]
  ) {
    return this.repository.editarCompleto(
      id,
      matricula,
      turno,
      quantidadeProduzida,
      observacao,
      itens
    )
  }

  cancelar(id: number, motivo: string) {
    return this.repository.cancelar(id, motivo)
  }

  async imprimir(id: number) {
    const refugo = this.repository.buscarParaImpressao(id)
    await this.printService.imprimir(refugo)
  }
}