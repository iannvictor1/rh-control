import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { canManageRh } from "../services/utils/auth";
import { getApiErrorMessage } from "../services/utils/errors";
import { formatarData } from "../services/utils/formatters";

function classeStatusAso(status) {
  if (status === "Vencido") return "bg-red-500/20 text-red-400";
  if (status === "Vencendo") return "bg-yellow-500/20 text-yellow-400";
  return "bg-green-500/20 text-green-400";
}

function classeStatusExperiencia(status) {
  if (status === "Vencido") return "bg-red-500/20 text-red-400";
  if (status === "Vencendo") return "bg-green-500/20 text-green-300";
  return "bg-zinc-700/60 text-zinc-300";
}

function textoDiasAso(dias) {
  if (dias < 0) return `${Math.abs(dias)} dia(s) vencido`;
  if (dias === 0) return "Vence hoje";
  return `${dias} dia(s)`;
}

function textoDiasLimiteFerias(dias) {
  if (dias === null || dias === undefined) return "-";
  if (dias < 0) return `${Math.abs(dias)} dia(s) vencido`;
  if (dias === 0) return "Limite hoje";
  return `${dias} dia(s)`;
}

function classeStatusLimiteFerias(status) {
  if (status === "Limite vencido") return "bg-red-500/20 text-red-400";
  if (status === "Limite vencendo") return "bg-yellow-500/20 text-yellow-300";
  return "bg-zinc-700/60 text-zinc-300";
}

function formatarMes(mes) {
  const [ano, numeroMes] = mes.split("-");
  return `${numeroMes}/${ano.slice(2)}`;
}

function formatarPeriodoFerias(item) {
  if (item.data_base_ferias && item.data_fim_periodo_aquisitivo) {
    return `${formatarData(item.data_base_ferias)} a ${formatarData(item.data_fim_periodo_aquisitivo)}`;
  }

  return formatarData(item.data_base_ferias);
}

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [asos, setAsos] = useState([]);
  const [experiencias, setExperiencias] = useState([]);
  const [ferias, setFerias] = useState([]);
  const [mensal, setMensal] = useState([]);
  const [setores, setSetores] = useState([]);
  const [opcoesSetor, setOpcoesSetor] = useState([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [setor, setSetor] = useState("todos");
  const [status, setStatus] = useState("ativos");
  const hoje = new Date().toISOString().slice(0, 10);
  const podeGerenciar = canManageRh();

  const filtros = useMemo(() => ({
    data_inicio: dataInicio,
    data_fim: dataFim,
    setor,
    status,
  }), [dataInicio, dataFim, setor, status]);

  const filtrosAtivos = dataInicio || dataFim || setor !== "todos" || status !== "ativos";

  async function carregarDashboard() {
    try {
      const params = Object.fromEntries(
        Object.entries(filtros).filter(([, valor]) => valor && valor !== "todos")
      );

      const [resumo, statusAsos, statusExperiencias, statusFerias, ocorrencias, setoresAtivos] =
        await Promise.all([
          api.get("/dashboard/resumo", { params }),
          api.get("/dashboard/asos", { params }),
          api.get("/dashboard/experiencia", { params }),
          api.get("/dashboard/ferias", { params }),
          api.get("/dashboard/mensal", { params }),
          api.get("/dashboard/setores", { params }),
        ]);

      setDados(resumo.data);
      setAsos(statusAsos.data);
      setExperiencias(statusExperiencias.data);
      setFerias(statusFerias.data);
      setMensal(ocorrencias.data);
      setSetores(setoresAtivos.data);
      setOpcoesSetor((opcoesAtuais) => {
        const setoresRecebidos = setoresAtivos.data.map((item) => item.setor);
        return [...new Set([...opcoesAtuais, ...setoresRecebidos])].sort();
      });
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, [filtros]);

  async function marcarExperienciaOk(experiencia) {
    try {
      await api.post(`/experiencias/${experiencia.id}/concluir`, {
        etapa: experiencia.etapa,
        vencimento_experiencia: experiencia.vencimento_experiencia,
      });

      toast.success("Experiência marcada como OK.");
      await carregarDashboard();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Erro ao marcar experiência como OK.")
      );
    }
  }

  function limparFiltros() {
    setDataInicio("");
    setDataFim("");
    setSetor("todos");
    setStatus("ativos");
  }

  if (!dados) {
    return (
      <div className="page-container">
        <h1 className="page-title">Dashboard</h1>
        <p className="mt-4 text-zinc-500">Carregando indicadores...</p>
      </div>
    );
  }

  const cards = [
    {
      titulo: "Colaboradores",
      valor: dados.total_colaboradores,
      detalhe: `${dados.ativos} ativos, ${dados.inativos} inativos`,
      to: "/colaboradores",
      cor: "text-blue-400",
    },
    {
      titulo: "Faltas no período",
      valor: dados.faltas_mes,
      detalhe: "Ocorrências registradas",
      to: "/faltas",
      cor: "text-yellow-300",
    },
    {
      titulo: "Atestados no período",
      valor: dados.atestados_mes,
      detalhe: "Afastamentos médicos",
      to: "/atestados",
      cor: "text-cyan-300",
    },
    {
      titulo: "Advertências no período",
      valor: dados.advertencias_mes,
      detalhe: "Verbais e escritas",
      to: "/advertencias",
      cor: "text-orange-300",
    },
    {
      titulo: "Suspensões no período",
      valor: dados.suspensoes_mes,
      detalhe: "Medidas disciplinares",
      to: "/suspensoes",
      cor: "text-red-300",
    },
    {
      titulo: "ASOs em alerta",
      valor: dados.asos_vencidos + dados.asos_vencendo_30_dias,
      detalhe: `${dados.asos_vencidos} vencidos, ${dados.asos_vencendo_30_dias} vencendo`,
      to: "/colaboradores",
      cor: dados.asos_vencidos > 0 ? "text-red-400" : "text-yellow-300",
    },
    {
      titulo: "Experiência em alerta",
      valor: dados.experiencias_vencidas + dados.experiencias_vencendo_30_dias,
      detalhe: `${dados.experiencias_vencidas} vencidos, ${dados.experiencias_vencendo_30_dias} vencendo`,
      to: "/calendario-rh",
      cor: dados.experiencias_vencidas > 0 ? "text-red-400" : "text-green-300",
    },
    {
      titulo: "Férias em alerta",
      valor: dados.ferias_vencidas + dados.ferias_vencendo_30_dias,
      detalhe: `${dados.ferias_vencidas} vencidas, ${dados.ferias_vencendo_30_dias} vencendo, ${(dados.ferias_limite_vencidas || 0) + (dados.ferias_limite_vencendo_30_dias || 0)} no limite`,
      to: "/ferias",
      cor: dados.ferias_vencidas > 0 || dados.ferias_limite_vencidas > 0 ? "text-red-400" : "text-emerald-300",
    },
  ];

  const asosEmAlerta = asos.filter((aso) => aso.status !== "Em dia");
  const experienciasEmAlerta = experiencias.filter((item) => item.status !== "Em dia");
  const feriasEmAlerta = ferias.filter(
    (item) => item.status !== "Em dia" || item.alerta_data_limite_ferias
  );
  const maxMensal = Math.max(
    1,
    ...mensal.flatMap((item) => [
      item.faltas,
      item.atestados,
      item.advertencias,
      item.suspensoes,
    ])
  );
  const maxSetor = Math.max(1, ...setores.map((setor) => setor.total));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="mt-2 text-zinc-500">
            Visão geral operacional do RH
          </p>
        </div>
      </div>

      <div className="mt-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            className="input w-full"
            type="date"
            value={dataInicio}
            max={hoje}
            onChange={(e) => setDataInicio(e.target.value)}
            aria-label="Data inicial"
          />

          <input
            className="input w-full"
            type="date"
            value={dataFim}
            min={dataInicio || undefined}
            max={hoje}
            onChange={(e) => setDataFim(e.target.value)}
            aria-label="Data final"
          />

          <select
            className="input w-full"
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
            aria-label="Setor"
          >
            <option value="todos">Todos os setores</option>
            {opcoesSetor.map((opcao) => (
              <option
                key={opcao}
                value={opcao === "Sem setor" ? "__sem_setor__" : opcao}
              >
                {opcao}
              </option>
            ))}
          </select>

          <select
            className="input w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Status"
          >
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
            <option value="todos">Todos os status</option>
          </select>

          <button
            className="input w-full font-bold hover:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={limparFiltros}
            disabled={!filtrosAtivos}
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map((card) => (
          <Link
            to={card.to}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-blue-500/70 transition"
            key={card.titulo}
          >
            <span className="text-sm text-zinc-500">{card.titulo}</span>
            <h2 className={`mt-2 text-2xl font-black ${card.cor}`}>
              {card.valor}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">{card.detalhe}</p>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Ocorrências por mês</h2>
            <span className="text-sm text-zinc-500">
              {filtrosAtivos ? "Filtros aplicados" : "Últimos 6 meses"}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {mensal.map((item) => (
              <div key={item.mes} className="grid grid-cols-[4rem_1fr] gap-4 items-center">
                <span className="text-sm text-zinc-400">{formatarMes(item.mes)}</span>

                <div className="grid grid-cols-4 gap-2 h-16 items-end">
                  {[
                    ["faltas", "bg-yellow-400", item.faltas],
                    ["atestados", "bg-cyan-400", item.atestados],
                    ["advertencias", "bg-orange-400", item.advertencias],
                    ["suspensoes", "bg-red-400", item.suspensoes],
                  ].map(([label, classe, valor]) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t-md ${classe}`}
                        style={{
                          height: `${Math.max(8, (valor / maxMensal) * 50)}px`,
                        }}
                        title={`${label}: ${valor}`}
                      />
                      <span className="text-xs text-zinc-500">{valor}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-[4rem_1fr] gap-4">
            <span />
            <div className="grid grid-cols-4 gap-2 text-xs text-zinc-400 text-center">
              <span>Faltas</span>
              <span>Atestados</span>
              <span>Advertências</span>
              <span>Suspensões</span>
            </div>
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-xl font-bold">Ativos por setor</h2>

          <div className="mt-5 space-y-3">
            {setores.length === 0 ? (
              <p className="text-zinc-500">Nenhum setor informado.</p>
            ) : (
              setores.slice(0, 8).map((setor) => (
                <div key={setor.setor}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-zinc-300 truncate">{setor.setor}</span>
                    <strong>{setor.total}</strong>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${(setor.total / maxSetor) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
          <div className="p-5 border-b border-zinc-800">
            <h2 className="text-xl font-bold">ASOs em alerta</h2>
          </div>

          {asosEmAlerta.length === 0 ? (
            <p className="p-5 text-zinc-500">
              Nenhum ASO vencido ou próximo do vencimento.
            </p>
          ) : (
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Prazo</th>
                </tr>
              </thead>

              <tbody>
                {asosEmAlerta.slice(0, 8).map((aso) => (
                  <tr key={aso.id}>
                    <td>
                      <Link
                        to={`/colaboradores/${aso.id}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {aso.nome}
                      </Link>
                    </td>
                    <td>{formatarData(aso.vencimento_aso)}</td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${classeStatusAso(aso.status)}`}>
                        {aso.status}
                      </span>
                    </td>
                    <td>{textoDiasAso(aso.dias_para_vencer)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mt-5 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
          <div className="p-5 border-b border-zinc-800">
            <h2 className="text-xl font-bold">Experiência em alerta</h2>
          </div>

          {experienciasEmAlerta.length === 0 ? (
            <p className="p-5 text-zinc-500">
              Nenhum período de experiência vencido ou próximo do vencimento.
            </p>
          ) : (
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Etapa</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Prazo</th>
                  {podeGerenciar && <th>Ações</th>}
                </tr>
              </thead>

              <tbody>
                {experienciasEmAlerta.slice(0, 10).map((experiencia) => (
                  <tr key={`${experiencia.id}-${experiencia.etapa}`}>
                    <td>
                      <Link
                        to={`/colaboradores/${experiencia.id}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {experiencia.nome}
                      </Link>
                    </td>
                    <td>{experiencia.etapa}</td>
                    <td>{formatarData(experiencia.vencimento_experiencia)}</td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${classeStatusExperiencia(experiencia.status)}`}>
                        {experiencia.status}
                      </span>
                    </td>
                    <td>{textoDiasAso(experiencia.dias_para_vencer)}</td>
                    {podeGerenciar && (
                      <td>
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg bg-green-600 text-sm font-bold text-white hover:bg-green-500 transition"
                          onClick={() => marcarExperienciaOk(experiencia)}
                        >
                          OK
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mt-5 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
          <div className="p-5 border-b border-zinc-800">
            <h2 className="text-xl font-bold">Férias em alerta</h2>
          </div>

          {feriasEmAlerta.length === 0 ? (
            <p className="p-5 text-zinc-500">
              Nenhum período de férias vencido ou próximo do vencimento.
            </p>
          ) : (
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Período aquisitivo</th>
                  <th>Vencimento</th>
                  <th>Data limite</th>
                  <th>Alerta limite</th>
                  <th>Status</th>
                  <th>Prazo</th>
                </tr>
              </thead>

              <tbody>
                {feriasEmAlerta.slice(0, 10).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link
                        to={`/colaboradores/${item.id}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {item.nome}
                      </Link>
                    </td>
                    <td>{formatarPeriodoFerias(item)}</td>
                    <td>{formatarData(item.vencimento_ferias)}</td>
                    <td>{formatarData(item.data_limite_ferias)}</td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${classeStatusLimiteFerias(item.status_limite_ferias)}`}>
                        {item.status_limite_ferias || "Sem limite"} | {textoDiasLimiteFerias(item.dias_para_limite_ferias)}
                      </span>
                    </td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${classeStatusAso(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{textoDiasAso(item.dias_para_vencer)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

      </div>
    </div>
  );
}
