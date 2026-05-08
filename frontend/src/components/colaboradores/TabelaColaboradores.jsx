import { Link } from "react-router-dom";
export default function TabelaColaboradores({
  colaboradores,
  abrirEdicao,
  inativarColaborador,
}) {
  return (
    <div className="mt-10 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <table className="w-full">
        <thead className="bg-zinc-800">
          <tr>
            <th className="text-left p-4">Nome</th>
            <th className="text-left p-4">CPF</th>
            <th className="text-left p-4">Telefone</th>
            <th className="text-left p-4">Status</th>
            <th className="text-left p-4">Ações</th>
          </tr>
        </thead>

        <tbody>
          {colaboradores.map((colaborador) => (
            <tr key={colaborador.id} className="border-t border-zinc-800">
              <td className="p-4">{colaborador.nome}</td>
              <td className="p-4">{colaborador.cpf}</td>
              <td className="p-4">{colaborador.telefone}</td>

              <td className="p-4">
                {colaborador.ativo ? (
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                    Ativo
                  </span>
                ) : (
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                    Inativo
                  </span>
                )}
              </td>

              <td className="p-4 flex gap-2">

                <Link
                  to={`/colaboradores/${colaborador.id}`}
                  className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
                >
                  Histórico
                </Link>

                <button
                  onClick={() => abrirEdicao(colaborador)}
                  className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                >
                  Editar
                </button>

                {colaborador.ativo && (
                  <button
                    onClick={() => inativarColaborador(colaborador.id)}
                    className="px-3 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30"
                  >
                    Inativar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}