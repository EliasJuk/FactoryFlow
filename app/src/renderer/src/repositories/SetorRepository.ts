import { Setor } from "../models/Setor"

export class SetorRepository {
  private setores: Setor[] = [
    { id: 1, nome: "SETOR-1", ativo: true },
    { id: 2, nome: "SETOR-2", ativo: true },
    { id: 3, nome: "SETOR-3", ativo: true },
    { id: 4, nome: "SETOR-4", ativo: true }
  ]

  listar(): Setor[] {
    return this.setores.filter((setor) => setor.ativo)
  }

  adicionar(nome: string): void {
    this.setores.push({
      id: Date.now(),
      nome,
      ativo: true
    })
  }

  editar(id: number, nome: string): void {
    const setor = this.setores.find((setor) => setor.id === id)

    if (setor) {
      setor.nome = nome
    }
  }

  excluir(id: number): void {
    const setor = this.setores.find((setor) => setor.id === id)

    if (setor) {
      setor.ativo = false
    }
  }
}