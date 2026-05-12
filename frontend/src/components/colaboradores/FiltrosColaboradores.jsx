export default function FiltrosColaboradores({
  busca,
  setBusca,
  filtroStatus,
  setFiltroStatus,
}) {
  return (
    <div className="mt-8 flex flex-col md:flex-row gap-4">

      <input
        className="input w-full md:w-96"
        placeholder="Buscar por nome, CPF ou telefone..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <select
        className="input w-full md:w-48"
        value={filtroStatus}
        onChange={(e) => setFiltroStatus(e.target.value)}
      >
        <option value="todos">Todos</option>
        <option value="ativos">Ativos</option>
        <option value="inativos">Inativos</option>
      </select>

    </div>
  );
}
