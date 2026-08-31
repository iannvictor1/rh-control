import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ActionMenu from "../components/ActionMenu";
import AuditInfo from "../components/AuditInfo";
import ConfirmDialog from "../components/ConfirmDialog";
import FiltrosOcorrencias from "../components/FiltrosOcorrencias";
import FormOcorrencia from "../components/FormOcorrencia";
import Paginacao from "../components/Paginacao";
import useBuscaPaginada from "../hooks/useBuscaPaginada";
import api from "../services/api";
import { canManageRh } from "../services/utils/auth";
import { formatarData } from "../services/utils/formatters";

const formInicial = {
  colaborador_id: "",
  data_falta: "",
  motivo: "",
};

export default function Faltas() {
  const [colaboradores, setColaboradores] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [faltaParaExcluir, setFaltaParaExcluir] = useState(null);
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
    items: faltas,
    total,
    pagina,
    setPagina,
    carregando,
    limitePorPagina,
    carregar: carregarFaltas,
    atualizarFiltro,
  } = useBuscaPaginada({
    endpoint: "/faltas/busca",
    filtros,
    mensagemErro: "Erro ao carregar faltas.",
  });

  useEffect(() => {
    async function carregarColaboradores() {
      try {
        const response = await api.get("/colaboradores/opcoes", {
          params: { ativo: true },
        });
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
      carregarFaltas();
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
      toast.success("Falta excluída com sucesso!");

      if (editando?.id === faltaParaExcluir.id) {
        cancelarEdicao();
      }

      setFaltaParaExcluir(null);
      carregarFaltas();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao excluir falta.");
      console.error(error);
    }
  }

  return (
    <>
      <h2 className="text-4xl font-bold">Faltas</h2>

      {podeGerenciar && (
        <FormOcorrencia
          form={form}
          editando={editando}
          colaboradores={colaboradores}
          hoje={hoje}
          onChange={atualizarCampo}
          onSubmit={salvarFalta}
          onCancel={cancelarEdicao}
          campos={[
            {
              name: "data_falta",
              label: "Data da falta",
              type: "date",
              required: true,
            },
            {
              name: "motivo",
              label: "Motivo",
              placeholder: "Opcional",
            },
          ]}
        />
      )}

      <FiltrosOcorrencias
        busca={busca}
        placeholderBusca="Buscar por colaborador ou motivo"
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
              <th className="text-left p-4">Motivo</th>
              {podeGerenciar && <th className="text-left p-4">Ações</th>}
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

            {!carregando && faltas.length === 0 && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 4 : 3}>
                  Nenhuma falta registrada.
                </td>
              </tr>
            )}

            {!carregando && faltas.map((falta) => (
              <tr key={falta.id} className="border-t border-zinc-800">
                <td className="p-4">
                  {buscarNomeColaborador(falta)}
                  <AuditInfo registro={falta} compacto />
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

      <Paginacao
        total={total}
        pagina={pagina}
        limitePorPagina={limitePorPagina}
        onPaginaChange={setPagina}
        textoTotal={`${total} falta(s) encontrada(s)`}
      />

      <ConfirmDialog
        aberto={Boolean(faltaParaExcluir)}
        titulo="Excluir falta"
        mensagem="Esta ação remove o registro de falta definitivamente."
        onCancelar={() => setFaltaParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </>
  );
}
