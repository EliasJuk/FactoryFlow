export type PerfilUsuario = "OPERADOR" | "QUALIDADE" | "ADMIN"

export interface Usuario {
  id: number
  matricula: string
  nome: string
  senha: string
  perfil: PerfilUsuario
  ativo: boolean
}