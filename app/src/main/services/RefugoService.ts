import { CriarRefugoInput } from '../repositories/postgres/RefugoRepository'

import type { ResultadoFiltros } from '../repositories/postgres/ResultadoRepository'

import { RepositoryFactory } from '../repositories/factory/RepositoryFactory'
import { RefugoPrintService } from './RefugoPrintService'

export class RefugoService {
  private repository = RepositoryFactory.refugos()
  private resultadoRepository = RepositoryFactory.resultados()
  private printService = new RefugoPrintService()
  private usuarioRepository = RepositoryFactory.usuarios()

  private async validarPermissaoAlteracao(usuarioId?: number | null) {
    if (!usuarioId) {
      throw new Error('USUARIO_NAO_IDENTIFICADO')
    }

    const usuario = await this.usuarioRepository.buscarPerfilPorId(usuarioId)
    const perfisPermitidos = new Set(['ADMIN', 'TECNICO', 'QUALIDADE', 'LIDER'])

    if (!usuario || !usuario.ativo || !perfisPermitidos.has(usuario.perfil)) {
      throw new Error('SEM_PERMISSAO_REFUGO')
    }
  }

  private async validarDataHoraPersonalizada(input: CriarRefugoInput) {
    if (!input.dataHora) return

    if (!input.usuarioId) {
      throw new Error('USUARIO_NAO_IDENTIFICADO')
    }

    const dataHora = new Date(input.dataHora)

    if (Number.isNaN(dataHora.getTime())) {
      throw new Error('DATA_HORA_INVALIDA')
    }

    const usuario = await this.usuarioRepository.buscarPerfilPorId(input.usuarioId)
    const perfisPermitidos = new Set(['ADMIN', 'TECNICO', 'QUALIDADE', 'LIDER', 'SUPERVISOR'])

    if (!usuario || !usuario.ativo || !perfisPermitidos.has(usuario.perfil)) {
      throw new Error('SEM_PERMISSAO_DATA_HORA_REFUGO')
    }
  }

  async criar(input: CriarRefugoInput) {
    await this.validarDataHoraPersonalizada(input)

    const resultado = await this.repository.criar(input)

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
    await this.validarPermissaoAlteracao(usuarioId)

    return await this.repository.editarCompleto(
      id,
      matricula,
      turno,
      quantidadeProduzida,
      observacao,
      itens,
      usuarioId
    )
  }

  async cancelar(id: number, motivo: string, usuarioId?: number | null) {
    await this.validarPermissaoAlteracao(usuarioId)
    return await this.repository.cancelar(id, motivo, usuarioId)
  }

  async imprimir(id: number) {
    const refugo = await this.repository.buscarParaImpressao(id)
    await this.printService.imprimir(refugo)
  }

  async resultados(filtros: ResultadoFiltros) {
    return await this.resultadoRepository.resultados(filtros)
  }
}
