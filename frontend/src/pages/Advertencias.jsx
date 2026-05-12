import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function Advertencias() {
  const [advertencias, setAdvertencias] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);

  const [form, setForm] = useState({
    colaborador_id: "",
    data_advertencia: "",
    tipo: "Verbal",
    motivo: "",
  });

  async function carregarDados() {
    const [resAdvertencias, resColaboradores] = await Promise.all([
      api.get("/advertencias/"),
      api.get("/colaboradores/"),
    ]);

    setAdvertencias(resAdvertencias.data);
    setColaboradores(resColaboradores.data);
  }

  useEffect(() => {
    async function carregarDadosIniciais() {
      const [resAdvertencias, resColaboradores] = await Promise.all([
        api.get("/advertencias/"),
        api.get("/colaboradores/"),
      ]);

      setAdvertencias(resAdvertencias.data);
      setColaboradores(resColaboradores.data);
    }

    carregarDadosIniciais();
  }, []);

  function atualizarCampo(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function buscarNomeColaborador(id) {
    const colaborador = colaboradores.find((c) => c.id === id);

    return colaborador
      ? colaborador.nome
      : "Colaborador não encontrado";
  }

  async function cadastrarAdvertencia(e) {
    e.preventDefault();

    try {
      await api.post("/advertencias/", {
        colaborador_id: Number(form.colaborador_id),
        data_advertencia: form.data_advertencia,
        tipo: form.tipo,
        motivo: form.motivo,
      });

      toast.success("Advertência registrada!");

      setForm({
        colaborador_id: "",
        data_advertencia: "",
        tipo: "Verbal",
        motivo: "",
      });

      carregarDados();

    } catch (error) {
      toast.error("Erro ao registrar advertência.");
      console.error(error);
    }
  }

  return (
    <>
      <h2 className="text-4xl font-bold">
        Advertências
      </h2>

      <form
        onSubmit={cadastrarAdvertencia}
        className="
          mt-8
          bg-zinc-900
          border
          border-zinc-800
          rounded-2xl
          p-6
          grid
          grid-cols-5
          gap-4
        "
      >

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            Colaborador
          </label>

          <select
            className="input w-full"
            name="colaborador_id"
            value={form.colaborador_id}
            onChange={atualizarCampo}
            required
          >
            <option value="">
              Selecione
            </option>

            {colaboradores
              .filter((c) => c.ativo)
              .map((colaborador) => (
                <option
                  key={colaborador.id}
                  value={colaborador.id}
                >
                  {colaborador.nome}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            Data
          </label>

          <input
            className="input w-full"
            type="date"
            name="data_advertencia"
            value={form.data_advertencia}
            onChange={atualizarCampo}
            required
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            Tipo
          </label>

          <select
            className="input w-full"
            name="tipo"
            value={form.tipo}
            onChange={atualizarCampo}
          >
            <option value="Verbal">
              Verbal
            </option>

            <option value="Escrita">
              Escrita
            </option>
          </select>
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            Motivo
          </label>

          <input
            className="input w-full"
            name="motivo"
            value={form.motivo}
            onChange={atualizarCampo}
            required
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="
              w-full
              bg-blue-600
              hover:bg-blue-700
              px-5
              py-3
              rounded-xl
              font-semibold
              transition
            "
          >
            Registrar
          </button>
        </div>

      </form>

      <div className="
        mt-10
        bg-zinc-900
        rounded-2xl
        border
        border-zinc-800
        overflow-x-auto
      ">

        <table className="w-full">

          <thead className="bg-zinc-800">

            <tr>
              <th className="text-left p-4">
                Colaborador
              </th>

              <th className="text-left p-4">
                Data
              </th>

              <th className="text-left p-4">
                Tipo
              </th>

              <th className="text-left p-4">
                Motivo
              </th>
            </tr>

          </thead>

          <tbody>

            {advertencias.map((advertencia) => (

              <tr
                key={advertencia.id}
                className="border-t border-zinc-800"
              >

                <td className="p-4">
                  {buscarNomeColaborador(
                    advertencia.colaborador_id
                  )}
                </td>

                <td className="p-4">
                  {advertencia.data_advertencia}
                </td>

                <td className="p-4">

                  {advertencia.tipo === "Verbal" ? (
                    <span className="
                      bg-yellow-500/20
                      text-yellow-400
                      px-3
                      py-1
                      rounded-full
                      text-sm
                    ">
                      Verbal
                    </span>
                  ) : (
                    <span className="
                      bg-red-500/20
                      text-red-400
                      px-3
                      py-1
                      rounded-full
                      text-sm
                    ">
                      Escrita
                    </span>
                  )}

                </td>

                <td className="p-4">
                  {advertencia.motivo}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>
    </>
  );
}
