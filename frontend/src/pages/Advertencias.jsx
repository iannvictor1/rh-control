import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ActionMenu from "../components/ActionMenu";
import ConfirmDialog from "../components/ConfirmDialog";
import api from "../services/api";
import { canManageRh } from "../services/utils/auth";
import { dataDentroPeriodo, formatarData } from "../services/utils/formatters";

const formInicial = {
  colaborador_id: "",
  data_advertencia: "",
  tipo: "Verbal",
  motivo: "",
};

export default function Advertencias() {
  const [advertencias, setAdvertencias] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [advertenciaParaExcluir, setAdvertenciaParaExcluir] = useState(null);
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const podeGerenciar = canManageRh();

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
      try {
        const [resAdvertencias, resColaboradores] = await Promise.all([
          api.get("/advertencias/"),
          api.get("/colaboradores/"),
        ]);

        setAdvertencias(resAdvertencias.data);
        setColaboradores(resColaboradores.data);
      } catch (error) {
        toast.error("Erro ao carregar advertencias.");
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

  function editarAdvertencia(advertencia) {
    setEditando(advertencia);
    setMenuAberto(null);
    setForm({
      colaborador_id: String(advertencia.colaborador_id),
      data_advertencia: advertencia.data_advertencia || "",
      tipo: advertencia.tipo || "Verbal",
      motivo: advertencia.motivo || "",
    });
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(formInicial);
  }

  async function salvarAdvertencia(e) {
    e.preventDefault();

    const dados = {
      colaborador_id: Number(form.colaborador_id),
      data_advertencia: form.data_advertencia,
      tipo: form.tipo,
      motivo: form.motivo,
    };

    try {
      if (editando) {
        await api.put(`/advertencias/${editando.id}`, dados);
        toast.success("Advertencia atualizada!");
      } else {
        await api.post("/advertencias/", dados);
        toast.success("Advertencia registrada!");
      }

      cancelarEdicao();
      carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao salvar advertencia.");
      console.error(error);
    }
  }

  async function excluirAdvertencia(advertencia) {
    setMenuAberto(null);
    setAdvertenciaParaExcluir(advertencia);
  }

  async function confirmarExclusao() {
    if (!advertenciaParaExcluir) return;

    try {
      await api.delete(`/advertencias/${advertenciaParaExcluir.id}`);
      toast.success("Advertencia excluida!");

      if (editando?.id === advertenciaParaExcluir.id) {
        cancelarEdicao();
      }

      setAdvertenciaParaExcluir(null);
      carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao excluir advertencia.");
      console.error(error);
    }
  }

  const advertenciasFiltradas = advertencias.filter((advertencia) => {
    const textoBusca = busca.toLowerCase();
    const nome = buscarNomeColaborador(advertencia.colaborador_id).toLowerCase();
    const motivo = (advertencia.motivo || "").toLowerCase();
    const tipoOk = filtroTipo === "todos" || advertencia.tipo === filtroTipo;

    return (
      tipoOk &&
      (nome.includes(textoBusca) || motivo.includes(textoBusca)) &&
      dataDentroPeriodo(advertencia.data_advertencia, dataInicio, dataFim)
    );
  });

  return (
    <>
      <h2 className="text-4xl font-bold">Advertencias</h2>

      {podeGerenciar && (
        <form
          onSubmit={salvarAdvertencia}
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
          <label className="text-sm text-zinc-400 mb-1 block">Data</label>

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
          <label className="text-sm text-zinc-400 mb-1 block">Tipo</label>

          <select
            className="input w-full"
            name="tipo"
            value={form.tipo}
            onChange={atualizarCampo}
          >
            <option value="Verbal">Verbal</option>
            <option value="Escrita">Escrita</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">Motivo</label>

          <input
            className="input w-full"
            name="motivo"
            value={form.motivo}
            onChange={atualizarCampo}
            required
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

      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <select
          className="input w-full"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="todos">Todos os tipos</option>
          <option value="Verbal">Verbal</option>
          <option value="Escrita">Escrita</option>
        </select>

      </div>

      <div className="mt-10 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Colaborador</th>
              <th className="text-left p-4">Data</th>
              <th className="text-left p-4">Tipo</th>
              <th className="text-left p-4">Motivo</th>
              {podeGerenciar && <th className="text-left p-4">Acoes</th>}
            </tr>
          </thead>

          <tbody>
            {carregando && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 5 : 4}>
                  Carregando advertencias...
                </td>
              </tr>
            )}

            {!carregando && advertenciasFiltradas.length === 0 && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 5 : 4}>
                  Nenhuma advertencia registrada.
                </td>
              </tr>
            )}

            {!carregando && advertenciasFiltradas.map((advertencia) => (
              <tr key={advertencia.id} className="border-t border-zinc-800">
                <td className="p-4">
                  {buscarNomeColaborador(advertencia.colaborador_id)}
                </td>

                <td className="p-4">
                  {formatarData(advertencia.data_advertencia)}
                </td>

                <td className="p-4">
                  {advertencia.tipo === "Verbal" ? (
                    <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                      Verbal
                    </span>
                  ) : (
                    <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                      Escrita
                    </span>
                  )}
                </td>

                <td className="p-4">{advertencia.motivo}</td>

                {podeGerenciar && (
                  <td className="p-4">
                    <ActionMenu
                      aberto={menuAberto === advertencia.id}
                      onClose={() => setMenuAberto(null)}
                      onToggle={() =>
                        setMenuAberto(
                          menuAberto === advertencia.id ? null : advertencia.id
                        )
                      }
                      onEditar={() => editarAdvertencia(advertencia)}
                      onExcluir={() => excluirAdvertencia(advertencia)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        aberto={Boolean(advertenciaParaExcluir)}
        titulo="Excluir advertencia"
        mensagem="Esta acao remove a advertencia definitivamente."
        onCancelar={() => setAdvertenciaParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </>
  );
}
