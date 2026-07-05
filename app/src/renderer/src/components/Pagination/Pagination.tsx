type PaginationProps = {
  paginaAtual: number
  totalPaginas: number
  onPaginaAnterior: () => void
  onProximaPagina: () => void
}

export function Pagination({
  paginaAtual,
  totalPaginas,
  onPaginaAnterior,
  onProximaPagina
}: PaginationProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-[var(--text-light)]">
        Página {paginaAtual} de {totalPaginas}
      </p>

      <div className="flex justify-end gap-2">
        <button
          onClick={onPaginaAnterior}
          disabled={paginaAtual === 1}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>

        <button
          onClick={onProximaPagina}
          disabled={paginaAtual === totalPaginas}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  )
}