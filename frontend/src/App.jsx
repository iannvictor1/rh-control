import { useEffect, useState } from "react";
import api from "./services/api";

export default function App() {

  const [colaboradores, setColaboradores] = useState([]);

  async function carregarColaboradores() {

    try {

      const response = await api.get("/colaboradores/");

      setColaboradores(response.data);

    } catch (error) {

      console.error(error);

    }
  }

  useEffect(() => {

    carregarColaboradores();

  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">

      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6">

        <h1 className="text-2xl font-bold text-blue-500">
          RH Control
        </h1>

        <nav className="mt-10 flex flex-col gap-4">

          <button className="text-left hover:text-blue-400 transition">
            Dashboard
          </button>

          <button className="text-left hover:text-blue-400 transition">
            Colaboradores
          </button>

          <button className="text-left hover:text-blue-400 transition">
            Faltas
          </button>

          <button className="text-left hover:text-blue-400 transition">
            Advertências
          </button>

        </nav>

      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-10">

        <div className="flex items-center justify-between">

          <h2 className="text-4xl font-bold">
            Colaboradores
          </h2>

        </div>

        <div className="mt-10 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">

          <table className="w-full">

            <thead className="bg-zinc-800">

              <tr>

                <th className="text-left p-4">
                  Nome
                </th>

                <th className="text-left p-4">
                  CPF
                </th>

                <th className="text-left p-4">
                  Telefone
                </th>

                <th className="text-left p-4">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {colaboradores.map((colaborador) => (

                <tr
                  key={colaborador.id}
                  className="border-t border-zinc-800"
                >

                  <td className="p-4">
                    {colaborador.nome}
                  </td>

                  <td className="p-4">
                    {colaborador.cpf}
                  </td>

                  <td className="p-4">
                    {colaborador.telefone}
                  </td>

                  <td className="p-4">

                    <span className="
                      bg-green-500/20
                      text-green-400
                      px-3
                      py-1
                      rounded-full
                      text-sm
                    ">
                      Ativo
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </main>

    </div>
  );
}