import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ActionMenu from "../components/ActionMenu";
import ConfirmDialog from "../components/ConfirmDialog";
import api from "../services/api";
import { canManageRh } from "../services/utils/auth";
import { dataDentroPeriodo, formatarData } from "../services/utils/formatters";

const formInicial = {
  colaborador_id: "",
  data_falta: "",
  motivo: "",
};

export default function Faltas() {
  const [faltas, setFaltas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [faltaParaExcluir, setFaltaParaExcluir] = useState(null);
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const podeGerenciar = canManageRh();

  async function carregarDados() {
    const [resFaltas, resColaboradores] = await Promise.all([
      api.get("/faltas/"),
      api.get("/colaboradores/"),
    ]);

    setFaltas(resFaltas.data);
    setColaboradores(resColaboradores.data);
  }

  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        const [resFaltas, resColaboradores] = await Promise.all([
          api.get("/faltas/"),
          api.get("/colaboradores/"),
        ]);

        setFaltas(resFaltas.data);
        setColaboradores(resColaboradores.data);
      } catch (error) {
        toast.error("Erro ao carregar faltas.");
        console.error(error);
      } finally {
        setCarregando(false);
      }
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
    return colaborador ? colaborador.nome : "Colaborador nao encontrado";
  }

  function editarFalta(falta) {
    setEditando(falta);
    setMenuAberto(null);
    setForm({
      colaborador_id: String(falta.colaborador_id),
      data_falta: falta.data_falta || "",
      motivo: falta.motivo || "",
    });
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(formInicial);
  }

  async function salvarFalta(e) {
    e.preventDefault();

    const dados = {
      colaborador_id: Number(form.colaborador_id),
      data_falta: form.data_falta,
      motivo: form.motivo || null,
    };

    try {
      if (editando) {
        await api.put(`/faltas/${editando.id}`, dados);
        toast.success("Falta atualizada com sucesso!");
      } else {
        await api.post("/faltas/", dados);
        toast.success("Falta registrada com sucesso!");
      }

      cancelarEdicao();
      carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao salvar falta.");
      console.error(error);
    }
  }

  async function excluirFalta(falta) {
    setMenuAberto(null);
    setFaltaParaExcluir(falta);
  }

  async function confirmarExclusao() {
    if (!faltaParaExcluir) return;

    try {
      await api.delete(`/faltas/${faltaParaExcluir.id}`);
      toast.success("Falta excluida com sucesso!");

      if (editando?.id === faltaParaExcluir.id) {
        cancelarEdicao();
      }

      setFaltaParaExcluir(null);
      carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao excluir falta.");
      console.error(error);
    }
  }

  const faltasFiltradas = faltas.filter((falta) => {
    const textoBusca = busca.toLowerCase();
    const nome = buscarNomeColaborador(falta.colaborador_id).toLowerCase();
    const motivo = (falta.motivo || "").toLowerCase();

    return (
      (nome.includes(textoBusca) || motivo.includes(textoBusca)) &&
      dataDentroPeriodo(falta.data_falta, dataInicio, dataFim)
    );
  });

  return (
    <>
      <h2 className="text-4xl font-bold">Faltas</h2>

      {podeGerenciar && (
        <form
          onSubmit={salvarFalta}
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

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold transition"
          >
            {editando ? "Atualizar" : "Registrar"}
          </button>

          {editando && (
            <button
              type="button"
              onClick={cancelarEdicao}
              className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700"
            >
              Cancelar
            </button>
          )}
        </div>
        </form>
      )}

      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          className="input w-full"
          placeholder="Buscar por colaborador ou motivo"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <input
          className="input w-full"
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />

        <input
          className="input w-full"
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
        />

      </div>

      <div className="mt-10 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Colaborador</th>
              <th className="text-left p-4">Data</th>
              <th className="text-left p-4">Motivo</th>
              {podeGerenciar && <th className="text-left p-4">Acoes</th>}
            </tr>
          </thead>

          <tbody>
            {carregando && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 4 : 3}>
                  Carregando faltas...
                </td>
              </tr>
            )}

            {!carregando && faltasFiltradas.length === 0 && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 4 : 3}>
                  Nenhuma falta registrada.
                </td>
              </tr>
            )}

            {!carregando && faltasFiltradas.map((falta) => (
              <tr key={falta.id} className="border-t border-zinc-800">
                <td className="p-4">
                  {buscarNomeColaborador(falta.colaborador_id)}
                </td>

                <td className="p-4">{formatarData(falta.data_falta)}</td>

                <td className="p-4">
                  {falta.motivo || "Sem motivo informado"}
                </td>

                {podeGerenciar && (
                  <td className="p-4">
                    <ActionMenu
                      aberto={menuAberto === falta.id}
                      onClose={() => setMenuAberto(null)}
                      onToggle={() =>
                        setMenuAberto(menuAberto === falta.id ? null : falta.id)
                      }
                      onEditar={() => editarFalta(falta)}
                      onExcluir={() => excluirFalta(falta)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        aberto={Boolean(faltaParaExcluir)}
        titulo="Excluir falta"
        mensagem="Esta acao remove o registro de falta definitivamente."
        onCancelar={() => setFaltaParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </>
  );
}
