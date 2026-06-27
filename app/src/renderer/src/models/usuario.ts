export interface Usuario {
  id: number
  matricula: string
  nome: string
  senha: string
  perfil: "OPERADOR" | "QUALIDADE" | "ADMIN"
  ativo: boolean
}