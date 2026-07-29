import { CriarRefugoInput } from '../repositories/postgres/RefugoRepository'

import type { ResultadoFiltros } from '../repositories/postgres/ResultadoRepository'

import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'
import { RefugoPrintService } from './RefugoPrintService'

export class RefugoService {
  private repository = RepositoryFactory.refugos()
  private resultadoRepository = RepositoryFactory.resultados()
  private printService = new RefugoPrintService()
  private usuarioRepository = RepositoryFactory.usuarios()
  private postoDefeitoRepository = RepositoryFactory.postoDefeitos()

  private async validarUsuarioAtivo(
    usuarioId?: number | null,
    perfisPermitidos?: ReadonlySet<string>
  ): Promise<number> {
    if (!usuarioId) {
      throw new Error('USUARIO_NAO_IDENTIFICADO')
    }

    const usuario = await this.usuarioRepository.buscarPerfilPorId(usuarioId)

    if (!usuario || !usuario.ativo) {
      throw new Error('USUARIO_NAO_IDENTIFICADO')
    }

    if (perfisPermitidos && !perfisPermitidos.has(usuario.perfil)) {
      throw new Error('SEM_PERMISSAO_REFUGO')
    }

    return usuarioId
  }

  private async validarPermissaoAlteracao(usuarioId?: number | null): Promise<number> {
    const perfisPermitidos = new Set(['ADMIN', 'TECNICO', 'QUALIDADE', 'LIDER'])
    return await this.validarUsuarioAtivo(usuarioId, perfisPermitidos)
  }

  async criar(input: CriarRefugoInput) {
    const usuarioId = await this.validarUsuarioAtivo(input.usuarioId)

    const defeitosValidos = await this.postoDefeitoRepository.defeitosPertencemAoPosto(
      input.postoId,
      input.itens.map((item) => item.defeitoId)
    )

    if (!defeitosValidos) {
      throw new Error('DEFEITO_NAO_PERMITIDO_NO_POSTO')
    }

    const resultado = await this.repository.criar({ ...input, usuarioId })

    try {
      const refugo = await this.repository.buscarParaImpressao(resultado.id)
      await this.printService.imprimir(refugo)
    } catch (error) {
      console.error('[REFUGO] Erro ao imprimir ficha:', error)
    }

    return resultado.numeroRefugo
  }

  async listar(busca = '', pagina = 1, limite = 10) {
    return await this.repository.listar(busca, pagina, limite)
  }

  async editarCompleto(
    id: number,
    matricula: string,
    turno: string,
    quantidadeProduzida: number,
    observacao: string | undefined,
    itens: { id: number; defeitoId: number; quantidade: number }[],
    usuarioId?: number | null
  ) {
    const responsavelId = await this.validarPermissaoAlteracao(usuarioId)

    return await this.repository.editarCompleto(
      id,
      matricula,
      turno,
      quantidadeProduzida,
      observacao,
      itens,
      responsavelId
    )
  }

  async cancelar(id: number, motivo: string, usuarioId?: number | null) {
    const responsavelId = await this.validarPermissaoAlteracao(usuarioId)
    return await this.repository.cancelar(id, motivo, responsavelId)
  }

  async imprimir(id: number) {
    const refugo = await this.repository.buscarParaImpressao(id)
    await this.printService.imprimir(refugo)
  }

  async resultados(filtros: ResultadoFiltros) {
    return await this.resultadoRepository.resultados(filtros)
  }
}
