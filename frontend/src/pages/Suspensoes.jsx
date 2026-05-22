import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ActionMenu from "../components/ActionMenu";
import ConfirmDialog from "../components/ConfirmDialog";
import api from "../services/api";
import { canManageRh } from "../services/utils/auth";
import { dataDentroPeriodo, formatarData } from "../services/utils/formatters";

const formInicial = {
  colaborador_id: "",
  data_inicio: "",
  dias: "",
  motivo: "",
  status: "Ativa",
};

export default function Suspensoes() {
  const [suspensoes, setSuspensoes] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [suspensaoParaExcluir, setSuspensaoParaExcluir] = useState(null);
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const podeGerenciar = canManageRh();

  async function carregarDados() {
    const [resSuspensoes, resColaboradores] = await Promise.all([
      api.get("/suspensoes/"),
      api.get("/colaboradores/"),
    ]);

    setSuspensoes(resSuspensoes.data);
    setColaboradores(resColaboradores.data);
  }

  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        const [resSuspensoes, resColaboradores] = await Promise.all([
          api.get("/suspensoes/"),
          api.get("/colaboradores/"),
        ]);

        setSuspensoes(resSuspensoes.data);
        setColaboradores(resColaboradores.data);
      } catch (error) {
        toast.error("Erro ao carregar suspensoes.");
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
    return colaborador ? colaborador.nome : "Nao encontrado";
  }

  function editarSuspensao(suspensao) {
    setEditando(suspensao);
    setMenuAberto(null);
    setForm({
      colaborador_id: String(suspensao.colaborador_id),
      data_inicio: suspensao.data_inicio || "",
      dias: String(suspensao.dias || ""),
      motivo: suspensao.motivo || "",
      status: suspensao.status || "Ativa",
    });
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(formInicial);
  }

  async function salvarSuspensao(e) {
    e.preventDefault();

    const dados = {
      colaborador_id: Number(form.colaborador_id),
      data_inicio: form.data_inicio,
      dias: Number(form.dias),
      motivo: form.motivo,
    };

    if (editando) {
      dados.status = form.status;
    }

    try {
      if (editando) {
        await api.put(`/suspensoes/${editando.id}`, dados);
        toast.success("Suspensao atualizada!");
      } else {
        await api.post("/suspensoes/", dados);
        toast.success("Suspensao registrada!");
      }

      cancelarEdicao();
      carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao salvar suspensao.");
      console.error(error);
    }
  }

  async function excluirSuspensao(suspensao) {
    setMenuAberto(null);
    setSuspensaoParaExcluir(suspensao);
  }

  async function confirmarExclusao() {
    if (!suspensaoParaExcluir) return;

    try {
      await api.delete(`/suspensoes/${suspensaoParaExcluir.id}`);
      toast.success("Suspensao excluida!");

      if (editando?.id === suspensaoParaExcluir.id) {
        cancelarEdicao();
      }

      setSuspensaoParaExcluir(null);
      carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao excluir suspensao.");
      console.error(error);
    }
  }

  const suspensoesFiltradas = suspensoes.filter((suspensao) => {
    const textoBusca = busca.toLowerCase();
    const nome = buscarNomeColaborador(suspensao.colaborador_id).toLowerCase();
    const motivo = (suspensao.motivo || "").toLowerCase();
    const statusOk =
      filtroStatus === "todos" || suspensao.status === filtroStatus;

    return (
      statusOk &&
      (nome.includes(textoBusca) || motivo.includes(textoBusca)) &&
      dataDentroPeriodo(suspensao.data_inicio, dataInicio, dataFim)
    );
  });

  return (
    <>
      <h2 className="text-4xl font-bold">Suspensoes</h2>

      {podeGerenciar && (
        <form
          onSubmit={salvarSuspensao}
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
            Data inicio
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
          <label className="text-sm text-zinc-400 mb-1 block">Dias</label>

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

        {editando ? (
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Status</label>

            <select
              className="input w-full"
              name="status"
              value={form.status}
              onChange={atualizarCampo}
            >
              <option value="Ativa">Ativa</option>
              <option value="Finalizada">Finalizada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
        ) : (
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
        )}

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

        {editando && (
          <div className="col-span-5">
            <label className="text-sm text-zinc-400 mb-1 block">Motivo</label>

            <input
              className="input w-full"
              name="motivo"
              value={form.motivo}
              onChange={atualizarCampo}
              required
            />
          </div>
        )}
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
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="todos">Todos os status</option>
          <option value="Ativa">Ativa</option>
          <option value="Finalizada">Finalizada</option>
          <option value="Cancelada">Cancelada</option>
        </select>

      </div>

      <div className="mt-10 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Colaborador</th>
              <th className="text-left p-4">Inicio</th>
              <th className="text-left p-4">Dias</th>
              <th className="text-left p-4">Motivo</th>
              <th className="text-left p-4">Status</th>
              {podeGerenciar && <th className="text-left p-4">Acoes</th>}
            </tr>
          </thead>

          <tbody>
            {carregando && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 6 : 5}>
                  Carregando suspensoes...
                </td>
              </tr>
            )}

            {!carregando && suspensoesFiltradas.length === 0 && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 6 : 5}>
                  Nenhuma suspensao registrada.
                </td>
              </tr>
            )}

            {!carregando && suspensoesFiltradas.map((suspensao) => (
              <tr key={suspensao.id} className="border-t border-zinc-800">
                <td className="p-4">
                  {buscarNomeColaborador(suspensao.colaborador_id)}
                </td>

                <td className="p-4">{formatarData(suspensao.data_inicio)}</td>
                <td className="p-4">{suspensao.dias} dia(s)</td>
                <td className="p-4">{suspensao.motivo}</td>

                <td className="p-4">
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                    {suspensao.status}
                  </span>
                </td>

                {podeGerenciar && (
                  <td className="p-4">
                    <ActionMenu
                      aberto={menuAberto === suspensao.id}
                      onClose={() => setMenuAberto(null)}
                      onToggle={() =>
                        setMenuAberto(
                          menuAberto === suspensao.id ? null : suspensao.id
                        )
                      }
                      onEditar={() => editarSuspensao(suspensao)}
                      onExcluir={() => excluirSuspensao(suspensao)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        aberto={Boolean(suspensaoParaExcluir)}
        titulo="Excluir suspensao"
        mensagem="Esta acao remove a suspensao definitivamente."
        onCancelar={() => setSuspensaoParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </>
  );
}
