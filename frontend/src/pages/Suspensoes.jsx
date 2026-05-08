import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function Suspensoes() {
  const [suspensoes, setSuspensoes] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);

  const [form, setForm] = useState({
    colaborador_id: "",
    data_inicio: "",
    dias: "",
    motivo: "",
  });

  async function carregarDados() {
    const [resSuspensoes, resColaboradores] = await Promise.all([
      api.get("/suspensoes/"),
      api.get("/colaboradores/"),
    ]);

    setSuspensoes(resSuspensoes.data);
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
    const colaborador = colaboradores.find(
      (c) => c.id === id
    );

    return colaborador
      ? colaborador.nome
      : "Não encontrado";
  }

  async function cadastrarSuspensao(e) {
    e.preventDefault();

    try {
      await api.post("/suspensoes/", {
        colaborador_id: Number(form.colaborador_id),
        data_inicio: form.data_inicio,
        dias: Number(form.dias),
        motivo: form.motivo,
      });

      toast.success("Suspensão registrada!");

      setForm({
        colaborador_id: "",
        data_inicio: "",
        dias: "",
        motivo: "",
      });

      carregarDados();

    } catch (error) {
      toast.error("Erro ao registrar suspensão.");
      console.error(error);
    }
  }

  return (
    <>
      <h2 className="text-4xl font-bold">
        Suspensões
      </h2>

      <form
        onSubmit={cadastrarSuspensao}
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
            Data início
          </label>

          <input
            className="input w-full"
            type="date"
            name="data_inicio"
            value={form.data_inicio}
            onChange={atualizarCampo}
            required
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            Dias
          </label>

          <input
            className="input w-full"
            type="number"
            name="dias"
            value={form.dias}
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
        overflow-hidden
      ">

        <table className="w-full">

          <thead className="bg-zinc-800">

            <tr>
              <th className="text-left p-4">
                Colaborador
              </th>

              <th className="text-left p-4">
                Início
              </th>

              <th className="text-left p-4">
                Dias
              </th>

              <th className="text-left p-4">
                Motivo
              </th>

              <th className="text-left p-4">
                Status
              </th>
            </tr>

          </thead>

          <tbody>

            {suspensoes.map((suspensao) => (

              <tr
                key={suspensao.id}
                className="border-t border-zinc-800"
              >

                <td className="p-4">
                  {buscarNomeColaborador(
                    suspensao.colaborador_id
                  )}
                </td>

                <td className="p-4">
                  {suspensao.data_inicio}
                </td>

                <td className="p-4">
                  {suspensao.dias} dia(s)
                </td>

                <td className="p-4">
                  {suspensao.motivo}
                </td>

                <td className="p-4">

                  <span className="
                    bg-red-500/20
                    text-red-400
                    px-3
                    py-1
                    rounded-full
                    text-sm
                  ">
                    {suspensao.status}
                  </span>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>
    </>
  );
}