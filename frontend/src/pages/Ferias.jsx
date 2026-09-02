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
import { getApiErrorMessage } from "../services/utils/errors";
import { formatarData } from "../services/utils/formatters";

const formInicial = {
  colaborador_id: "",
  data_inicio: "",
  data_fim: "",
  data_retorno: "",
  observacoes: "",
};

const DIAS_ALERTA_RETORNO = 7;

function calcularRetorno(dataFim) {
  if (!dataFim) return "";

  const data = new Date(`${dataFim}T00:00:00`);
  data.setDate(data.getDate() + 1);

  return data.toISOString().slice(0, 10);
}

function diasEntre(dataFinal, dataInicial) {
  const final = new Date(`${dataFinal}T00:00:00`);
  const inicial = new Date(`${dataInicial}T00:00:00`);

  return Math.ceil((final - inicial) / (1000 * 60 * 60 * 24));
}

function statusClasse(status) {
  if (status === "Vencido") return "bg-red-500/20 text-red-300";
  if (status === "Vencendo") return "bg-yellow-500/20 text-yellow-300";
  return "bg-green-500/20 text-green-300";
}

function textoAlertaLimite(alerta) {
  if (!alerta.status_limite_ferias || alerta.dias_para_limite_ferias === null) {
    return "Sem alerta de limite";
  }

  if (alerta.dias_para_limite_ferias < 0) {
    return `Data limite vencida há ${Math.abs(alerta.dias_para_limite_ferias)} dia(s)`;
  }

  if (alerta.dias_para_limite_ferias === 0) {
    return "Data limite vence hoje";
  }

  return `Data limite em ${alerta.dias_para_limite_ferias} dia(s)`;
}

function formatarPeriodoAquisitivo(alerta) {
  if (alerta.data_base_ferias && alerta.data_fim_periodo_aquisitivo) {
    return `${formatarData(alerta.data_base_ferias)} a ${formatarData(alerta.data_fim_periodo_aquisitivo)}`;
  }

  return formatarData(alerta.data_base_ferias);
}

export default function Ferias() {
  const [colaboradores, setColaboradores] = useState([]);
  const [alertasVencimento, setAlertasVencimento] = useState([]);
  const [feriasRegistradas, setFeriasRegistradas] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [feriasParaExcluir, setFeriasParaExcluir] = useState(null);
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
    items: ferias,
    total,
    pagina,
    setPagina,
    carregando,
    limitePorPagina,
    carregar: carregarFerias,
    atualizarFiltro,
  } = useBuscaPaginada({
    endpoint: "/ferias/busca",
    filtros,
    mensagemErro: "Erro ao carregar férias.",
  });

  const retornosProximos = useMemo(() => {
    return feriasRegistradas
      .map((registro) => ({
        ...registro,
        dias_para_retorno: diasEntre(registro.data_retorno, hoje),
      }))
      .filter((registro) =>
        registro.data_inicio <= hoje &&
        registro.data_retorno >= hoje &&
        registro.dias_para_retorno >= 0 &&
        registro.dias_para_retorno <= DIAS_ALERTA_RETORNO
      )
      .sort((a, b) => a.dias_para_retorno - b.dias_para_retorno);
  }, [feriasRegistradas, hoje]);

  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        const [resColaboradores, resAlertas, resFerias] = await Promise.all([
          api.get("/colaboradores/opcoes", { params: { ativo: true } }),
          api.get("/dashboard/ferias"),
          api.get("/ferias/"),
        ]);

        setColaboradores(resColaboradores.data);
        setAlertasVencimento(resAlertas.data.filter(
          (item) => item.status !== "Em dia" || item.alerta_data_limite_ferias
        ));
        setFeriasRegistradas(resFerias.data);
      } catch (error) {
        toast.error("Erro ao carregar dados de férias.");
        console.error(error);
      }
    }

    carregarDadosIniciais();
  }, []);

  async function carregarPainelFerias() {
    try {
      const [resAlertas, resFerias] = await Promise.all([
        api.get("/dashboard/ferias"),
        api.get("/ferias/"),
      ]);

      setAlertasVencimento(resAlertas.data.filter(
        (item) => item.status !== "Em dia" || item.alerta_data_limite_ferias
      ));
      setFeriasRegistradas(resFerias.data);
    } catch (error) {
      toast.error("Erro ao atualizar painel de férias.");
      console.error(error);
    }
  }

  function atualizarCampo(e) {
    const { name, value } = e.target;

    setForm((atual) => ({
      ...atual,
      [name]: value,
      ...(name === "data_fim" && !editando ? { data_retorno: calcularRetorno(value) } : {}),
    }));
  }

  function buscarNomeColaborador(registro) {
    return registro.colaborador?.nome || "Colaborador não encontrado";
  }

  function editarFerias(registro) {
    setEditando(registro);
    setMenuAberto(null);
    setForm({
      colaborador_id: String(registro.colaborador_id),
      data_inicio: registro.data_inicio || "",
      data_fim: registro.data_fim || "",
      data_retorno: registro.data_retorno || "",
      observacoes: registro.observacoes || "",
    });
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(formInicial);
  }

  async function salvarFerias(e) {
    e.preventDefault();

    const dados = {
      colaborador_id: Number(form.colaborador_id),
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
      data_retorno: form.data_retorno,
      observacoes: form.observacoes || null,
    };

    try {
      if (editando) {
        await api.put(`/ferias/${editando.id}`, dados);
        toast.success("Férias atualizadas com sucesso!");
      } else {
        await api.post("/ferias/", dados);
        toast.success("Férias registradas com sucesso!");
      }

      cancelarEdicao();
      carregarFerias();
      carregarPainelFerias();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao salvar férias."));
      console.error(error);
    }
  }

  function excluirFerias(registro) {
    setMenuAberto(null);
    setFeriasParaExcluir(registro);
  }

  async function confirmarExclusao() {
    if (!feriasParaExcluir) return;

    try {
      await api.delete(`/ferias/${feriasParaExcluir.id}`);
      toast.success("Férias excluídas com sucesso!");

      if (editando?.id === feriasParaExcluir.id) {
        cancelarEdicao();
      }

      setFeriasParaExcluir(null);
      carregarFerias();
      carregarPainelFerias();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao excluir férias."));
      console.error(error);
    }
  }

  return (
    <>
      <h2 className="text-4xl font-bold">Férias</h2>

      {podeGerenciar && (
        <FormOcorrencia
          form={form}
          editando={editando}
          colaboradores={colaboradores}
          hoje={hoje}
          onChange={atualizarCampo}
          onSubmit={salvarFerias}
          onCancel={cancelarEdicao}
          campos={[
            {
              name: "data_inicio",
              label: "Início das férias",
              type: "date",
              allowFuture: true,
              required: true,
            },
            {
              name: "data_fim",
              label: "Fim das férias",
              type: "date",
              min: form.data_inicio || undefined,
              allowFuture: true,
              required: true,
            },
            {
              name: "data_retorno",
              label: "Data de retorno",
              type: "date",
              min: form.data_fim || undefined,
              allowFuture: true,
              required: true,
            },
            {
              name: "observacoes",
              label: "Observações",
              type: "textarea",
              className: "md:col-span-2",
            },
          ]}
        />
      )}

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800">
            <h3 className="text-xl font-bold">Períodos perto de vencer</h3>
          </div>

          {alertasVencimento.length === 0 ? (
            <p className="p-5 text-zinc-500">
              Nenhum período de férias vencido ou próximo do vencimento.
            </p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {alertasVencimento.slice(0, 8).map((alerta) => (
                <div key={alerta.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <strong>{alerta.nome}</strong>
                    <p className="text-sm text-zinc-400">
                      Período: {formatarPeriodoAquisitivo(alerta)}
                    </p>
                    <p className="text-sm text-zinc-400">
                      Vencimento: {formatarData(alerta.vencimento_ferias)} | Limite: {formatarData(alerta.data_limite_ferias)}
                    </p>
                    {alerta.alerta_data_limite_ferias && (
                      <p className="text-sm font-semibold text-yellow-300">
                        {textoAlertaLimite(alerta)}
                      </p>
                    )}
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${statusClasse(alerta.status)}`}>
                    {alerta.status} | {Math.abs(alerta.dias_para_vencer)} dia(s)
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800">
            <h3 className="text-xl font-bold">Retornos próximos</h3>
          </div>

          {retornosProximos.length === 0 ? (
            <p className="p-5 text-zinc-500">
              Nenhum colaborador em férias com retorno nos próximos {DIAS_ALERTA_RETORNO} dias.
            </p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {retornosProximos.slice(0, 8).map((registro) => (
                <div key={registro.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <strong>{buscarNomeColaborador(registro)}</strong>
                    <p className="text-sm text-zinc-400">
                      Férias: {formatarData(registro.data_inicio)} até {formatarData(registro.data_fim)}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-300">
                    Retorno em {formatarData(registro.data_retorno)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <FiltrosOcorrencias
        busca={busca}
        placeholderBusca="Buscar por colaborador ou observação"
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
              <th className="text-left p-4">Início</th>
              <th className="text-left p-4">Fim</th>
              <th className="text-left p-4">Retorno</th>
              <th className="text-left p-4">Observações</th>
              {podeGerenciar && <th className="text-left p-4">Ações</th>}
            </tr>
          </thead>

          <tbody>
            {carregando && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 6 : 5}>
                  Carregando férias...
                </td>
              </tr>
            )}

            {!carregando && ferias.length === 0 && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 6 : 5}>
                  Nenhum registro de férias encontrado.
                </td>
              </tr>
            )}

            {!carregando && ferias.map((registro) => (
              <tr key={registro.id} className="border-t border-zinc-800">
                <td className="p-4">
                  {buscarNomeColaborador(registro)}
                  <AuditInfo registro={registro} compacto />
                </td>
                <td className="p-4">{formatarData(registro.data_inicio)}</td>
                <td className="p-4">{formatarData(registro.data_fim)}</td>
                <td className="p-4">{formatarData(registro.data_retorno)}</td>
                <td className="p-4">{registro.observacoes || "Sem observações"}</td>

                {podeGerenciar && (
                  <td className="p-4">
                    <ActionMenu
                      aberto={menuAberto === registro.id}
                      onClose={() => setMenuAberto(null)}
                      onToggle={() =>
                        setMenuAberto(menuAberto === registro.id ? null : registro.id)
                      }
                      onEditar={() => editarFerias(registro)}
                      onExcluir={() => excluirFerias(registro)}
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
        textoTotal={`${total} férias encontrada(s)`}
      />

      <ConfirmDialog
        aberto={Boolean(feriasParaExcluir)}
        titulo="Excluir férias"
        mensagem="Esta ação remove o registro de férias do histórico."
        onCancelar={() => setFeriasParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </>
  );
}
