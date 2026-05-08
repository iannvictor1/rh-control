import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function Faltas() {
  const [faltas, setFaltas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);

  const [form, setForm] = useState({
    colaborador_id: "",
    data_falta: "",
    motivo: "",
  });

  async function carregarDados() {
    const [resFaltas, resColaboradores] = await Promise.all([
      api.get("/faltas/"),
      api.get("/colaboradores/"),
    ]);

    setFaltas(resFaltas.data);
    setColaboradores(resColaboradores.data);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function atualizarCampo(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function buscarNomeColaborador(id) {
    const colaborador = colaboradores.find((c) => c.id === id);
    return colaborador ? colaborador.nome : "Colaborador não encontrado";
  }

  async function cadastrarFalta(e) {
    e.preventDefault();

    try {
      await api.post("/faltas/", {
        colaborador_id: Number(form.colaborador_id),
        data_falta: form.data_falta,
        motivo: form.motivo || null,
      });

      toast.success("Falta registrada com sucesso!");

      setForm({
        colaborador_id: "",
        data_falta: "",
        motivo: "",
      });

      carregarDados();
    } catch (error) {
      toast.error("Erro ao registrar falta.");
      console.error(error);
    }
  }

  return (
    <>
      <h2 className="text-4xl font-bold">Faltas</h2>

      <form
        onSubmit={cadastrarFalta}
        className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 grid grid-cols-4 gap-4"
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
            <option value="">Selecione</option>

            {colaboradores
              .filter((colaborador) => colaborador.ativo)
              .map((colaborador) => (
                <option key={colaborador.id} value={colaborador.id}>
                  {colaborador.nome}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            Data da falta
          </label>

          <input
            className="input w-full"
            type="date"
            name="data_falta"
            value={form.data_falta}
            onChange={atualizarCampo}
            required
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            Motivo
          </label>

          <input
            className="input w-full"
            name="motivo"
            placeholder="Opcional"
            value={form.motivo}
            onChange={atualizarCampo}
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold transition"
          >
            Registrar Falta
          </button>
        </div>
      </form>

      <div className="mt-10 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Colaborador</th>
              <th className="text-left p-4">Data</th>
              <th className="text-left p-4">Motivo</th>
            </tr>
          </thead>

          <tbody>
            {faltas.map((falta) => (
              <tr key={falta.id} className="border-t border-zinc-800">
                <td className="p-4">
                  {buscarNomeColaborador(falta.colaborador_id)}
                </td>

                <td className="p-4">
                  {falta.data_falta}
                </td>

                <td className="p-4">
                  {falta.motivo || "Sem motivo informado"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}