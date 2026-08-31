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
import {
  extrairPdfDisciplinar,
  labelModeloRegistro,
  modelosAdvertencia,
} from "../services/utils/documentosDisciplinares";
import { getApiErrorMessage } from "../services/utils/errors";
import { formatarData } from "../services/utils/formatters";

const formInicial = {
  colaborador_id: "",
  data_advertencia: "",
  tipo: "Verbal",
  modelo: "falta_injustificada",
  modelo_outro: "",
  dias_ocorrencia: "",
  funcao_ocorrencia: "",
  motivo: "",
  observacoes: "",
};

export default function Advertencias() {
  const [colaboradores, setColaboradores] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [advertenciaParaExcluir, setAdvertenciaParaExcluir] = useState(null);
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const podeGerenciar = canManageRh();
  const hoje = new Date().toISOString().slice(0, 10);

  const filtros = useMemo(() => ({
    q: busca,
    tipo: filtroTipo,
    data_inicio: dataInicio,
    data_fim: dataFim,
  }), [busca, dataInicio, dataFim, filtroTipo]);

  const {
    items: advertencias,
    total,
    pagina,
    setPagina,
    carregando,
    limitePorPagina,
    carregar: carregarAdvertencias,
    atualizarFiltro,
  } = useBuscaPaginada({
    endpoint: "/advertencias/busca",
    filtros,
    mensagemErro: "Erro ao carregar advertências.",
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

  function editarAdvertencia(advertencia) {
    setEditando(advertencia);
    setMenuAberto(null);
    setForm({
      colaborador_id: String(advertencia.colaborador_id),
      data_advertencia: advertencia.data_advertencia || "",
      tipo: advertencia.tipo || "Verbal",
      modelo: advertencia.detalhes?.modelo || "falta_injustificada",
      modelo_outro: advertencia.detalhes?.modelo_outro || "",
      dias_ocorrencia: advertencia.detalhes?.dias_ocorrencia || "",
      funcao_ocorrencia: advertencia.detalhes?.funcao_ocorrencia || "",
      motivo: advertencia.motivo || "",
      observacoes: advertencia.detalhes?.observacoes || "",
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
      detalhes: {
        modelo: form.modelo,
        modelo_outro: form.modelo_outro,
        dias_ocorrencia: form.dias_ocorrencia,
        funcao_ocorrencia: form.funcao_ocorrencia,
        observacoes: form.observacoes,
      },
    };

    try {
      if (editando) {
        await api.put(`/advertencias/${editando.id}`, dados);
        toast.success("Advertência atualizada!");
      } else {
        await api.post("/advertencias/", dados);
        toast.success("Advertência registrada!");
      }

      cancelarEdicao();
      carregarAdvertencias();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao salvar advertência."));
      console.error(error);
    }
  }

  function excluirAdvertencia(advertencia) {
    setMenuAberto(null);
    setAdvertenciaParaExcluir(advertencia);
  }

  async function confirmarExclusao() {
    if (!advertenciaParaExcluir) return;

    try {
      await api.delete(`/advertencias/${advertenciaParaExcluir.id}`);
      toast.success("Advertência excluída!");

      if (editando?.id === advertenciaParaExcluir.id) {
        cancelarEdicao();
      }

      setAdvertenciaParaExcluir(null);
      carregarAdvertencias();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao excluir advertência."));
      console.error(error);
    }
  }

  return (
    <>
      <h2 className="text-4xl font-bold">Advertências</h2>

      {podeGerenciar && (
        <FormOcorrencia
          form={form}
          editando={editando}
          colaboradores={colaboradores}
          hoje={hoje}
          onChange={atualizarCampo}
          onSubmit={salvarAdvertencia}
          onCancel={cancelarEdicao}
          campos={[
            {
              name: "modelo",
              label: "Tipo de advertência",
              type: "select",
              required: true,
              options: modelosAdvertencia,
            },
            ...(form.modelo === "outro"
              ? [
                  {
                    name: "modelo_outro",
                    label: "Tipo personalizado",
                    required: true,
                    placeholder: "Ex.: Uso indevido de celular",
                  },
                ]
              : []),
            {
              name: "data_advertencia",
              label: "Data",
              type: "date",
              required: true,
            },
            {
              name: "tipo",
              label: "Tipo",
              type: "select",
              options: [
                { value: "Verbal", label: "Verbal" },
                { value: "Escrita", label: "Escrita" },
              ],
            },
            {
              name: "motivo",
              label: "Motivo / descrição",
              required: true,
              type: "textarea",
              className: "md:col-span-2",
            },
            {
              name: "dias_ocorrencia",
              label: "Dia(s) da ocorrência",
              required: true,
              placeholder: "Ex.: 12/08/2026 ou 12/08/2026 e 13/08/2026",
              className: "md:col-span-2",
            },
            ...(form.modelo === "insubordinacao_ma_conduta"
              ? [
                  {
                    name: "funcao_ocorrencia",
                    label: "Função exercida na ocorrência",
                    required: true,
                  },
                ]
              : []),
            {
              name: "observacoes",
              label: "Observações adicionais",
              type: "textarea",
              className: "md:col-span-5",
            },
          ]}
        />
      )}

      <FiltrosOcorrencias
        busca={busca}
        placeholderBusca="Buscar por colaborador, tipo ou motivo"
        dataInicio={dataInicio}
        dataFim={dataFim}
        hoje={hoje}
        onBuscaChange={atualizarFiltro(setBusca)}
        onDataInicioChange={atualizarFiltro(setDataInicio)}
        onDataFimChange={atualizarFiltro(setDataFim)}
        filtrosExtras={[
          {
            id: "tipo",
            value: filtroTipo,
            onChange: atualizarFiltro(setFiltroTipo),
            options: [
              { value: "todos", label: "Todos os tipos" },
              { value: "Verbal", label: "Verbal" },
              { value: "Escrita", label: "Escrita" },
            ],
          },
        ]}
      />

      <div className="mt-10 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Colaborador</th>
              <th className="text-left p-4">Data</th>
              <th className="text-left p-4">Tipo</th>
              <th className="text-left p-4">Documento</th>
              <th className="text-left p-4">Motivo</th>
              {podeGerenciar && <th className="text-left p-4">Ações</th>}
            </tr>
          </thead>

          <tbody>
            {carregando && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 6 : 5}>
                  Carregando advertências...
                </td>
              </tr>
            )}

            {!carregando && advertencias.length === 0 && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 6 : 5}>
                  Nenhuma advertência registrada.
                </td>
              </tr>
            )}

            {!carregando && advertencias.map((advertencia) => (
              <tr key={advertencia.id} className="border-t border-zinc-800">
                <td className="p-4">
                  {buscarNomeColaborador(advertencia)}
                  <AuditInfo registro={advertencia} compacto />
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

                <td className="p-4">
                  {labelModeloRegistro(modelosAdvertencia, advertencia.detalhes)}
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
                      actions={[
                        {
                          label: "Editar",
                          onClick: () => editarAdvertencia(advertencia),
                        },
                        {
                          label: "Extrair PDF",
                          onClick: () =>
                            extrairPdfDisciplinar(
                              "advertencia",
                              advertencia,
                              colaboradores
                            ),
                        },
                        {
                          label: "Excluir",
                          onClick: () => excluirAdvertencia(advertencia),
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
        textoTotal={`${total} advertência(s) encontrada(s)`}
      />

      <ConfirmDialog
        aberto={Boolean(advertenciaParaExcluir)}
        titulo="Excluir advertência"
        mensagem="Esta ação remove a advertência do histórico."
        onCancelar={() => setAdvertenciaParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </>
  );
}
