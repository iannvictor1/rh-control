export default function FiltrosOcorrencias({
  busca,
  placeholderBusca,
  dataInicio,
  dataFim,
  hoje,
  onBuscaChange,
  onDataInicioChange,
  onDataFimChange,
  filtrosExtras = [],
}) {
  const colunas = filtrosExtras.length > 0 ? "md:grid-cols-4" : "md:grid-cols-3";

  return (
    <div className={`mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 grid grid-cols-1 ${colunas} gap-4`}>
      <input
        className="input w-full"
        placeholder={placeholderBusca}
        value={busca}
        onChange={onBuscaChange}
      />

      <input
        className="input w-full"
        type="date"
        value={dataInicio}
        max={hoje}
        onChange={onDataInicioChange}
      />

      <input
        className="input w-full"
        type="date"
        value={dataFim}
        max={hoje}
        onChange={onDataFimChange}
      />

      {filtrosExtras.map((filtro) => (
        <select
          key={filtro.id}
          className="input w-full"
          value={filtro.value}
          onChange={filtro.onChange}
        >
          {filtro.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
