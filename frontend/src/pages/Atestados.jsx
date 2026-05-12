import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function Atestados() {
  const [atestados, setAtestados] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);

  const [form, setForm] = useState({
    colaborador_id: "",
    data_atestado: "",
    cid: "",
    dias: "",
    observacao: "",
  });

  async function carregarDados() {
    const [resAtestados, resColaboradores] = await Promise.all([
      api.get("/atestados/"),
      api.get("/colaboradores/"),
    ]);

    setAtestados(resAtestados.data);
    setColaboradores(resColaboradores.data);
  }

  useEffect(() => {
    async function carregarDadosIniciais() {
      const [resAtestados, resColaboradores] = await Promise.all([
        api.get("/atestados/"),
        api.get("/colaboradores/"),
      ]);

      setAtestados(resAtestados.data);
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
    return colaborador ? colaborador.nome : "Colaborador não encontrado";
  }

  async function cadastrarAtestado(e) {
    e.preventDefault();

    try {
      await api.post("/atestados/", {
        colaborador_id: Number(form.colaborador_id),
        data_atestado: form.data_atestado,
        cid: form.cid || null,
        dias: Number(form.dias),
        observacao: form.observacao || null,
      });

      toast.success("Atestado médico registrado!");

      setForm({
        colaborador_id: "",
        data_atestado: "",
        cid: "",
        dias: "",
        observacao: "",
      });

      carregarDados();
    } catch (error) {
      toast.error("Erro ao registrar atestado médico.");
      console.error(error);
    }
  }

  return (
    <>
      <h2 className="text-4xl font-bold">Atestados médicos</h2>

      <form
        onSubmit={cadastrarAtestado}
        className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 grid grid-cols-5 gap-4"
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
            Data
          </label>

          <input
            className="input w-full"
            type="date"
            name="data_atestado"
            value={form.data_atestado}
            onChange={atualizarCampo}
            required
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            CID
          </label>

          <input
            className="input w-full"
            name="cid"
            placeholder="Opcional"
            value={form.cid}
            onChange={atualizarCampo}
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            Dias
          </label>

          <input
            className="input w-full"
            type="number"
            min="1"
            name="dias"
            value={form.dias}
            onChange={atualizarCampo}
            required
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold transition"
          >
            Registrar
          </button>
        </div>

        <div className="col-span-5">
          <label className="text-sm text-zinc-400 mb-1 block">
            Observação
          </label>

          <input
            className="input w-full"
            name="observacao"
            placeholder="Opcional"
            value={form.observacao}
            onChange={atualizarCampo}
          />
        </div>
      </form>

      <div className="mt-10 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Colaborador</th>
              <th className="text-left p-4">Data</th>
              <th className="text-left p-4">CID</th>
              <th className="text-left p-4">Dias</th>
              <th className="text-left p-4">Observação</th>
            </tr>
          </thead>

          <tbody>
            {atestados.map((atestado) => (
              <tr key={atestado.id} className="border-t border-zinc-800">
                <td className="p-4">
                  {buscarNomeColaborador(atestado.colaborador_id)}
                </td>

                <td className="p-4">{atestado.data_atestado}</td>

                <td className="p-4">{atestado.cid || "-"}</td>

                <td className="p-4">{atestado.dias} dia(s)</td>

                <td className="p-4">
                  {atestado.observacao || "Sem observação"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
