import { Setor } from "../models/Setor"

export class SetorRepository {
  private static setores: Setor[] = [
    {
      id: 1,
      nome: "SETOR-1",
      ativo: true
    },
    {
      id: 2,
      nome: "SETOR-2",
      ativo: true
    },
    {
      id: 3,
      nome: "SETOR-3",
      ativo: true
    },
    {
      id: 4,
      nome: "SETOR-4",
      ativo: true
    }
  ]

  static listar(): Setor[] {
    return this.setores
  }

  static adicionar(nome: string): void {
    this.setores.push({
      id: Date.now(),
      nome,
      ativo: true
    })
  }

  static editar(id: number, nome: string): void {
    const setor = this.setores.find((s) => s.id === id)

    if (setor) {
      setor.nome = nome
    }
  }

  static excluir(id: number): void {
    this.setores = this.setores.filter((s) => s.id !== id)
  }
}