export default function Paginacao({
  total,
  pagina,
  limitePorPagina,
  onPaginaChange,
  textoTotal,
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / limitePorPagina));

  return (
    <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-zinc-400">
      <span>{textoTotal}</span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={pagina <= 1}
          onClick={() => onPaginaChange(Math.max(1, pagina - 1))}
        >
          Anterior
        </button>

        <span className="px-3">
          Página {pagina} de {totalPaginas}
        </span>

        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={pagina >= totalPaginas}
          onClick={() => onPaginaChange(Math.min(totalPaginas, pagina + 1))}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
