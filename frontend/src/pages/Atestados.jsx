import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ActionMenu from "../components/ActionMenu";
import ConfirmDialog from "../components/ConfirmDialog";
import api from "../services/api";
import { canManageRh } from "../services/utils/auth";
import { dataDentroPeriodo, formatarData } from "../services/utils/formatters";

const formInicial = {
  colaborador_id: "",
  data_atestado: "",
  cid: "",
  dias: "",
  observacao: "",
};

export default function Atestados() {
  const [atestados, setAtestados] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [atestadoParaExcluir, setAtestadoParaExcluir] = useState(null);
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const podeGerenciar = canManageRh();

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
      try {
        const [resAtestados, resColaboradores] = await Promise.all([
          api.get("/atestados/"),
          api.get("/colaboradores/"),
        ]);

        setAtestados(resAtestados.data);
        setColaboradores(resColaboradores.data);
      } catch (error) {
        toast.error("Erro ao carregar atestados.");
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

  function editarAtestado(atestado) {
    setEditando(atestado);
    setMenuAberto(null);
    setForm({
      colaborador_id: String(atestado.colaborador_id),
      data_atestado: atestado.data_atestado || "",
      cid: atestado.cid || "",
      dias: String(atestado.dias || ""),
      observacao: atestado.observacao || "",
    });
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(formInicial);
  }

  async function salvarAtestado(e) {
    e.preventDefault();

    const dados = {
      colaborador_id: Number(form.colaborador_id),
      data_atestado: form.data_atestado,
      cid: form.cid || null,
      dias: Number(form.dias),
      observacao: form.observacao || null,
    };

    try {
      if (editando) {
        await api.put(`/atestados/${editando.id}`, dados);
        toast.success("Atestado medico atualizado!");
      } else {
        await api.post("/atestados/", dados);
        toast.success("Atestado medico registrado!");
      }

      cancelarEdicao();
      carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao salvar atestado.");
      console.error(error);
    }
  }

  async function excluirAtestado(atestado) {
    setMenuAberto(null);
    setAtestadoParaExcluir(atestado);
  }

  async function confirmarExclusao() {
    if (!atestadoParaExcluir) return;

    try {
      await api.delete(`/atestados/${atestadoParaExcluir.id}`);
      toast.success("Atestado medico excluido!");

      if (editando?.id === atestadoParaExcluir.id) {
        cancelarEdicao();
      }

      setAtestadoParaExcluir(null);
      carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao excluir atestado.");
      console.error(error);
    }
  }

  const atestadosFiltrados = atestados.filter((atestado) => {
    const textoBusca = busca.toLowerCase();
    const nome = buscarNomeColaborador(atestado.colaborador_id).toLowerCase();
    const cid = (atestado.cid || "").toLowerCase();
    const observacao = (atestado.observacao || "").toLowerCase();

    return (
      (nome.includes(textoBusca) ||
        cid.includes(textoBusca) ||
        observacao.includes(textoBusca)) &&
      dataDentroPeriodo(atestado.data_atestado, dataInicio, dataFim)
    );
  });

  return (
    <>
      <h2 className="text-4xl font-bold">Atestados medicos</h2>

      {podeGerenciar && (
        <form
          onSubmit={salvarAtestado}
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
            name="data_atestado"
            value={form.data_atestado}
            onChange={atualizarCampo}
            required
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">CID</label>

          <input
            className="input w-full"
            name="cid"
            placeholder="Opcional"
            value={form.cid}
            onChange={atualizarCampo}
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

        <div className="col-span-5">
          <label className="text-sm text-zinc-400 mb-1 block">
            Observacao
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
      )}

      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          className="input w-full"
          placeholder="Buscar por colaborador, CID ou observacao"
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
              <th className="text-left p-4">CID</th>
              <th className="text-left p-4">Dias</th>
              <th className="text-left p-4">Observacao</th>
              {podeGerenciar && <th className="text-left p-4">Acoes</th>}
            </tr>
          </thead>

          <tbody>
            {carregando && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 6 : 5}>
                  Carregando atestados...
                </td>
              </tr>
            )}

            {!carregando && atestadosFiltrados.length === 0 && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 6 : 5}>
                  Nenhum atestado registrado.
                </td>
              </tr>
            )}

            {!carregando && atestadosFiltrados.map((atestado) => (
              <tr key={atestado.id} className="border-t border-zinc-800">
                <td className="p-4">
                  {buscarNomeColaborador(atestado.colaborador_id)}
                </td>

                <td className="p-4">{formatarData(atestado.data_atestado)}</td>
                <td className="p-4">{atestado.cid || "-"}</td>
                <td className="p-4">{atestado.dias} dia(s)</td>

                <td className="p-4">
                  {atestado.observacao || "Sem observacao"}
                </td>

                {podeGerenciar && (
                  <td className="p-4">
                    <ActionMenu
                      aberto={menuAberto === atestado.id}
                      onClose={() => setMenuAberto(null)}
                      onToggle={() =>
                        setMenuAberto(
                          menuAberto === atestado.id ? null : atestado.id
                        )
                      }
                      onEditar={() => editarAtestado(atestado)}
                      onExcluir={() => excluirAtestado(atestado)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        aberto={Boolean(atestadoParaExcluir)}
        titulo="Excluir atestado"
        mensagem="Esta acao remove o atestado medico definitivamente."
        onCancelar={() => setAtestadoParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </>
  );
}
