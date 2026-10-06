import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ActionMenu from "../components/ActionMenu";
import AuditInfo from "../components/AuditInfo";
import ConfirmDialog from "../components/ConfirmDialog";
import FiltrosOcorrencias from "../components/FiltrosOcorrencias";
import Paginacao from "../components/Paginacao";
import useBuscaPaginada from "../hooks/useBuscaPaginada";
import api from "../services/api";
import { canManageRh } from "../services/utils/auth";
import { extrairPdfDisciplinar } from "../services/utils/documentosDisciplinares";
import { getApiErrorMessage } from "../services/utils/errors";
import { formatarData } from "../services/utils/formatters";

const formInicial = {
  colaborador_id: "",
  data_ocorrencia: new Date().toISOString().slice(0, 10),
  ocorrencia: "",
  motivo: "",
  observacoes: "",
};

export default function FichaFeedback() {
  const [colaboradores, setColaboradores] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [fichaParaExcluir, setFichaParaExcluir] = useState(null);
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const podeGerenciar = canManageRh();
  const hoje = new Date().toISOString().slice(0, 10);

  const filtros = useMemo(() => ({
    q: busca,
    data_inicio: dataInicio,
    data_fim: dataFim,
  }), [busca, dataInicio, dataFim]);

  const {
    items: fichas,
    total,
    pagina,
    setPagina,
    carregando,
    limitePorPagina,
    carregar: carregarFichas,
    atualizarFiltro,
  } = useBuscaPaginada({
    endpoint: "/fichas-feedback/busca",
    filtros,
    mensagemErro: "Erro ao carregar fichas de feedback.",
  });

  useEffect(() => {
    async function carregarColaboradores() {
      try {
        const response = await api.get("/colaboradores/");
        setColaboradores(response.data);
      } catch (error) {
        toast.error("Erro ao carregar colaboradores.");
        console.error(error);
      }
    }

    carregarColaboradores();
  }, []);

  function atualizarCampo(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function buscarNomeColaborador(registro) {
    return registro.colaborador?.nome || "Colaborador não encontrado";
  }

  function montarRegistroDocumento(registro) {
    return {
      colaborador_id: Number(registro.colaborador_id),
      colaborador: registro.colaborador,
      data_ocorrencia: registro.data_ocorrencia,
      ocorrencia: registro.ocorrencia,
      motivo: registro.motivo,
      observacoes: registro.observacoes,
    };
  }

  function editarFicha(ficha) {
    setEditando(ficha);
    setMenuAberto(null);
    setForm({
      colaborador_id: String(ficha.colaborador_id),
      data_ocorrencia: ficha.data_ocorrencia || "",
      ocorrencia: ficha.ocorrencia || "",
      motivo: ficha.motivo || "",
      observacoes: ficha.observacoes || "",
    });
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(formInicial);
  }

  async function salvarFicha(e) {
    e.preventDefault();

    const dados = {
      colaborador_id: Number(form.colaborador_id),
      data_ocorrencia: form.data_ocorrencia,
      ocorrencia: form.ocorrencia,
      motivo: form.motivo,
      observacoes: form.observacoes,
    };

    try {
      let fichaSalva;

      if (editando) {
        const response = await api.put(`/fichas-feedback/${editando.id}`, dados);
        fichaSalva = response.data;
        toast.success("Ficha de feedback atualizada!");
      } else {
        const response = await api.post("/fichas-feedback/", dados);
        fichaSalva = response.data;
        toast.success("Ficha de feedback registrada!");
      }

      cancelarEdicao();
      carregarFichas();
      extrairPdfDisciplinar("feedback", montarRegistroDocumento(fichaSalva), colaboradores);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao salvar ficha de feedback."));
      console.error(error);
    }
  }

  function excluirFicha(ficha) {
    setMenuAberto(null);
    setFichaParaExcluir(ficha);
  }

  async function confirmarExclusao() {
    if (!fichaParaExcluir) return;

    try {
      await api.delete(`/fichas-feedback/${fichaParaExcluir.id}`);
      toast.success("Ficha de feedback excluída!");

      if (editando?.id === fichaParaExcluir.id) {
        cancelarEdicao();
      }

      setFichaParaExcluir(null);
      carregarFichas();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao excluir ficha de feedback."));
      console.error(error);
    }
  }

  return (
    <>
      <h2 className="text-4xl font-bold">Ficha de Feedback</h2>

      {!podeGerenciar && (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-300">
          Seu perfil não permite registrar fichas de feedback.
        </div>
      )}

      {podeGerenciar && (
        <form
          onSubmit={salvarFicha}
          className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="md:col-span-2">
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
              max={hoje}
              name="data_ocorrencia"
              value={form.data_ocorrencia}
              onChange={atualizarCampo}
              required
            />
          </div>

          <div className="md:col-span-4">
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

          <div className="md:col-span-4">
            <label className="text-sm text-zinc-400 mb-1 block">
              Ocorrência
            </label>

            <textarea
              className="input w-full min-h-40 resize-y"
              name="ocorrencia"
              value={form.ocorrencia}
              onChange={atualizarCampo}
              required
            />
          </div>

          <div className="md:col-span-4">
            <label className="text-sm text-zinc-400 mb-1 block">
              Observações
            </label>

            <textarea
              className="input w-full min-h-32 resize-y"
              name="observacoes"
              value={form.observacoes}
              onChange={atualizarCampo}
            />
          </div>

          <div className="flex items-end gap-2 md:col-span-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold transition"
            >
              {editando ? "Atualizar e gerar documento" : "Registrar e gerar documento"}
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

      <FiltrosOcorrencias
        busca={busca}
        placeholderBusca="Buscar por colaborador, motivo, ocorrência ou observações"
        dataInicio={dataInicio}
        dataFim={dataFim}
        hoje={hoje}
        onBuscaChange={atualizarFiltro(setBusca)}
        onDataInicioChange={atualizarFiltro(setDataInicio)}
        onDataFimChange={atualizarFiltro(setDataFim)}
      />

      <div className="mt-10 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Colaborador</th>
              <th className="text-left p-4">Data</th>
              <th className="text-left p-4">Ocorrência</th>
              <th className="text-left p-4">Observações</th>
              {podeGerenciar && <th className="text-left p-4">Ações</th>}
            </tr>
          </thead>

          <tbody>
            {carregando && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 5 : 4}>
                  Carregando fichas de feedback...
                </td>
              </tr>
            )}

            {!carregando && fichas.length === 0 && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 5 : 4}>
                  Nenhuma ficha de feedback registrada.
                </td>
              </tr>
            )}

            {!carregando && fichas.map((ficha) => (
              <tr key={ficha.id} className="border-t border-zinc-800">
                <td className="p-4">
                  {buscarNomeColaborador(ficha)}
                  <AuditInfo registro={ficha} compacto />
                </td>
                <td className="p-4">{formatarData(ficha.data_ocorrencia)}</td>
                <td className="p-4 max-w-xl whitespace-pre-wrap">{ficha.ocorrencia}</td>
                <td className="p-4 max-w-xl whitespace-pre-wrap">{ficha.observacoes || "-"}</td>

                {podeGerenciar && (
                  <td className="p-4">
                    <ActionMenu
                      aberto={menuAberto === ficha.id}
                      onClose={() => setMenuAberto(null)}
                      onToggle={() =>
                        setMenuAberto(menuAberto === ficha.id ? null : ficha.id)
                      }
                      actions={[
                        {
                          label: "Editar",
                          onClick: () => editarFicha(ficha),
                        },
                        {
                          label: "Gerar documento",
                          onClick: () =>
                            extrairPdfDisciplinar(
                              "feedback",
                              montarRegistroDocumento(ficha),
                              colaboradores
                            ),
                        },
                        {
                          label: "Excluir",
                          onClick: () => excluirFicha(ficha),
                        },
                      ]}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginacao
        total={total}
        pagina={pagina}
        limitePorPagina={limitePorPagina}
        onPaginaChange={setPagina}
        textoTotal={`${total} ficha(s) de feedback encontrada(s)`}
      />

      <ConfirmDialog
        aberto={Boolean(fichaParaExcluir)}
        titulo="Excluir ficha de feedback"
        mensagem="Esta ação remove a ficha do histórico."
        onCancelar={() => setFichaParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </>
  );
}
