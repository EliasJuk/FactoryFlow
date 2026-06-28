import {
  RefugoRepository,
  CriarRefugoInput
} from "../repositories/RefugoRepository"

export class RefugoService {
  private repository = new RefugoRepository()

  criar(input: CriarRefugoInput) {
    return this.repository.criar(input)
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
    itens: { id: number; quantidade: number }[]
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
}