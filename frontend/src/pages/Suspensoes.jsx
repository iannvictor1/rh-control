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
  dataRetorno,
  extrairPdfDisciplinar,
  labelModeloRegistro,
  modelosSuspensao,
} from "../services/utils/documentosDisciplinares";
import { getApiErrorMessage } from "../services/utils/errors";
import { formatarData } from "../services/utils/formatters";

const formInicial = {
  colaborador_id: "",
  modelo: "falta_injustificada",
  modelo_outro: "",
  data_advertencia_anterior: "",
  dias_ocorrencia: "",
  horario_ocorrencia: "",
  data_inicio: "",
  dias: "",
  motivo: "",
  observacoes: "",
  status: "Ativa",
};

export default function Suspensoes() {
  const [colaboradores, setColaboradores] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [suspensaoParaExcluir, setSuspensaoParaExcluir] = useState(null);
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const podeGerenciar = canManageRh();
  const hoje = new Date().toISOString().slice(0, 10);
  const camposSuspensao = [
    {
      name: "modelo",
      label: "Tipo de suspensão",
      type: "select",
      required: true,
      options: modelosSuspensao,
    },
    ...(form.modelo === "outro"
      ? [
          {
            name: "modelo_outro",
            label: "Tipo personalizado",
            required: true,
            placeholder: "Ex.: Descumprimento de procedimento interno",
          },
        ]
      : []),
    {
      name: "data_advertencia_anterior",
      label: "Data da advertência anterior",
      type: "date",
      required: true,
    },
    {
      name: "dias_ocorrencia",
      label: "Dia(s) da reincidência",
      required: true,
      placeholder: "Ex.: 12/08/2026 ou 12/08/2026 e 13/08/2026",
    },
    ...(form.modelo === "abandono_posto"
      ? [
          {
            name: "horario_ocorrencia",
            label: "Horário da ocorrência",
            type: "time",
            required: true,
          },
        ]
      : []),
    {
      name: "data_inicio",
      label: "Data de início",
      type: "date",
      required: true,
    },
    {
      name: "dias",
      label: "Dias",
      type: "number",
      min: "1",
      required: true,
    },
    {
      name: "motivo",
      label: "Motivo / descrição",
      required: true,
      type: "textarea",
      className: "md:col-span-2",
    },
    {
      name: "observacoes",
      label: "Observações adicionais",
      type: "textarea",
      className: "md:col-span-3",
    },
  ];

  if (editando) {
    camposSuspensao.push({
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "Ativa", label: "Ativa" },
        { value: "Finalizada", label: "Finalizada" },
        { value: "Cancelada", label: "Cancelada" },
      ],
    });
  }

  const filtros = useMemo(() => ({
    q: busca,
    status: filtroStatus,
    data_inicio: dataInicio,
    data_fim: dataFim,
  }), [busca, dataInicio, dataFim, filtroStatus]);

  const {
    items: suspensoes,
    total,
    pagina,
    setPagina,
    carregando,
    limitePorPagina,
    carregar: carregarSuspensoes,
    atualizarFiltro,
  } = useBuscaPaginada({
    endpoint: "/suspensoes/busca",
    filtros,
    mensagemErro: "Erro ao carregar suspensões.",
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

  function editarSuspensao(suspensao) {
    setEditando(suspensao);
    setMenuAberto(null);
    setForm({
      colaborador_id: String(suspensao.colaborador_id),
      modelo: suspensao.detalhes?.modelo || "falta_injustificada",
      modelo_outro: suspensao.detalhes?.modelo_outro || "",
      data_advertencia_anterior: suspensao.detalhes?.data_advertencia_anterior || "",
      dias_ocorrencia: suspensao.detalhes?.dias_ocorrencia || "",
      horario_ocorrencia: suspensao.detalhes?.horario_ocorrencia || "",
      data_inicio: suspensao.data_inicio || "",
      dias: String(suspensao.dias || ""),
      motivo: suspensao.motivo || "",
      observacoes: suspensao.detalhes?.observacoes || "",
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
      detalhes: {
        modelo: form.modelo,
        modelo_outro: form.modelo_outro,
        data_advertencia_anterior: form.data_advertencia_anterior,
        dias_ocorrencia: form.dias_ocorrencia,
        horario_ocorrencia: form.horario_ocorrencia,
        data_retorno: dataRetorno(form.data_inicio, form.dias),
        observacoes: form.observacoes,
      },
    };

    if (editando) {
      dados.status = form.status;
    }

    try {
      if (editando) {
        await api.put(`/suspensoes/${editando.id}`, dados);
        toast.success("Suspensão atualizada!");
      } else {
        await api.post("/suspensoes/", dados);
        toast.success("Suspensão registrada!");
      }

      cancelarEdicao();
      carregarSuspensoes();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao salvar suspensão."));
      console.error(error);
    }
  }

  function excluirSuspensao(suspensao) {
    setMenuAberto(null);
    setSuspensaoParaExcluir(suspensao);
  }

  async function confirmarExclusao() {
    if (!suspensaoParaExcluir) return;

    try {
      await api.delete(`/suspensoes/${suspensaoParaExcluir.id}`);
      toast.success("Suspensão excluída!");

      if (editando?.id === suspensaoParaExcluir.id) {
        cancelarEdicao();
      }

      setSuspensaoParaExcluir(null);
      carregarSuspensoes();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao excluir suspensão."));
      console.error(error);
    }
  }

  return (
    <>
      <h2 className="text-4xl font-bold">Suspensões</h2>

      {podeGerenciar && (
        <FormOcorrencia
          form={form}
          editando={editando}
          colaboradores={colaboradores}
          hoje={hoje}
          onChange={atualizarCampo}
          onSubmit={salvarSuspensao}
          onCancel={cancelarEdicao}
          campos={camposSuspensao}
        />
      )}

      <FiltrosOcorrencias
        busca={busca}
        placeholderBusca="Buscar por colaborador, status ou motivo"
        dataInicio={dataInicio}
        dataFim={dataFim}
        hoje={hoje}
        onBuscaChange={atualizarFiltro(setBusca)}
        onDataInicioChange={atualizarFiltro(setDataInicio)}
        onDataFimChange={atualizarFiltro(setDataFim)}
        filtrosExtras={[
          {
            id: "status",
            value: filtroStatus,
            onChange: atualizarFiltro(setFiltroStatus),
            options: [
              { value: "todos", label: "Todos os status" },
              { value: "Ativa", label: "Ativa" },
              { value: "Finalizada", label: "Finalizada" },
              { value: "Cancelada", label: "Cancelada" },
            ],
          },
        ]}
      />

      <div className="mt-10 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Colaborador</th>
              <th className="text-left p-4">Início</th>
              <th className="text-left p-4">Dias</th>
              <th className="text-left p-4">Documento</th>
              <th className="text-left p-4">Motivo</th>
              <th className="text-left p-4">Status</th>
              {podeGerenciar && <th className="text-left p-4">Ações</th>}
            </tr>
          </thead>

          <tbody>
            {carregando && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 7 : 6}>
                  Carregando suspensões...
                </td>
              </tr>
            )}

            {!carregando && suspensoes.length === 0 && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 7 : 6}>
                  Nenhuma suspensão registrada.
                </td>
              </tr>
            )}

            {!carregando && suspensoes.map((suspensao) => (
              <tr key={suspensao.id} className="border-t border-zinc-800">
                <td className="p-4">
                  {buscarNomeColaborador(suspensao)}
                  <AuditInfo registro={suspensao} compacto />
                </td>

                <td className="p-4">{formatarData(suspensao.data_inicio)}</td>
                <td className="p-4">{suspensao.dias} dia(s)</td>
                <td className="p-4">
                  {labelModeloRegistro(modelosSuspensao, suspensao.detalhes)}
                </td>
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
                      actions={[
                        {
                          label: "Editar",
                          onClick: () => editarSuspensao(suspensao),
                        },
                        {
                          label: "Extrair PDF",
                          onClick: () =>
                            extrairPdfDisciplinar(
                              "suspensao",
                              suspensao,
                              colaboradores
                            ),
                        },
                        {
                          label: "Excluir",
                          onClick: () => excluirSuspensao(suspensao),
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
        textoTotal={`${total} suspensão(ões) encontrada(s)`}
      />

      <ConfirmDialog
        aberto={Boolean(suspensaoParaExcluir)}
        titulo="Excluir suspensão"
        mensagem="Esta ação remove a suspensão do histórico."
        onCancelar={() => setSuspensaoParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </>
  );
}
