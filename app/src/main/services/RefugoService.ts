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

  editarBasico(
    id: number,
    matricula: string,
    turno: string,
    quantidadeProduzida: number,
    observacao?: string
  ) {
    return this.repository.editarBasico(
      id,
      matricula,
      turno,
      quantidadeProduzida,
      observacao
    )
  }

  cancelar(id: number, motivo: string) {
    return this.repository.cancelar(id, motivo)
  }
}