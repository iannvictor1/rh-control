import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import { formatarData } from "../services/utils/formatters";

function classeNivel(nivel) {
  return nivel
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function classeStatusAso(status) {
  if (status === "Vencido") return "bg-red-500/20 text-red-400";
  if (status === "Vencendo") return "bg-yellow-500/20 text-yellow-400";
  return "bg-green-500/20 text-green-400";
}

function textoDiasAso(dias) {
  if (dias < 0) return `${Math.abs(dias)} dia(s) vencido`;
  if (dias === 0) return "Vence hoje";
  return `${dias} dia(s)`;
}

function formatarMes(mes) {
  const [ano, numeroMes] = mes.split("-");
  return `${numeroMes}/${ano.slice(2)}`;
}

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [asos, setAsos] = useState([]);
  const [mensal, setMensal] = useState([]);
  const [setores, setSetores] = useState([]);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        const [resumo, score, statusAsos, ocorrencias, setoresAtivos] =
          await Promise.all([
            api.get("/dashboard/resumo"),
            api.get("/dashboard/score"),
            api.get("/dashboard/asos"),
            api.get("/dashboard/mensal"),
            api.get("/dashboard/setores"),
          ]);

        setDados(resumo.data);
        setRanking(score.data);
        setAsos(statusAsos.data);
        setMensal(ocorrencias.data);
        setSetores(setoresAtivos.data);
      } catch (error) {
        console.error(error);
      }
    }

    carregarDashboard();
  }, []);

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
      titulo: "Faltas no mes",
      valor: dados.faltas_mes,
      detalhe: "Ocorrencias registradas",
      to: "/faltas",
      cor: "text-yellow-300",
    },
    {
      titulo: "Atestados no mes",
      valor: dados.atestados_mes,
      detalhe: "Afastamentos medicos",
      to: "/atestados",
      cor: "text-cyan-300",
    },
    {
      titulo: "Advertencias no mes",
      valor: dados.advertencias_mes,
      detalhe: "Verbais e escritas",
      to: "/advertencias",
      cor: "text-orange-300",
    },
    {
      titulo: "Suspensoes no mes",
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
  ];

  const asosEmAlerta = asos.filter((aso) => aso.status !== "Em dia");
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
            Visao geral operacional do RH
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Link
            to={card.to}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-blue-500/70 transition"
            key={card.titulo}
          >
            <span className="text-sm text-zinc-500">{card.titulo}</span>
            <h2 className={`mt-3 text-4xl font-black ${card.cor}`}>
              {card.valor}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">{card.detalhe}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Ocorrencias por mes</h2>
            <span className="text-sm text-zinc-500">Ultimos 6 meses</span>
          </div>

          <div className="mt-6 space-y-4">
            {mensal.map((item) => (
              <div key={item.mes} className="grid grid-cols-[4rem_1fr] gap-4 items-center">
                <span className="text-sm text-zinc-400">{formatarMes(item.mes)}</span>

                <div className="grid grid-cols-4 gap-2 h-20 items-end">
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
                          height: `${Math.max(8, (valor / maxMensal) * 64)}px`,
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

          <div className="mt-5 flex flex-wrap gap-3 text-xs text-zinc-400">
            <span>Faltas</span>
            <span>Atestados</span>
            <span>Advertencias</span>
            <span>Suspensoes</span>
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold">Ativos por setor</h2>

          <div className="mt-6 space-y-4">
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

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-2xl font-bold">ASOs em alerta</h2>
          </div>

          {asosEmAlerta.length === 0 ? (
            <p className="p-6 text-zinc-500">
              Nenhum ASO vencido ou proximo do vencimento.
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

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-2xl font-bold">Ranking disciplinar</h2>
          </div>

          <table className="ranking-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Score</th>
                <th>Nivel</th>
              </tr>
            </thead>

            <tbody>
              {ranking.slice(0, 8).map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link
                      to={`/colaboradores/${item.id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {item.nome}
                    </Link>
                  </td>
                  <td>{item.score}</td>
                  <td>
                    <span className={`nivel-badge ${classeNivel(item.nivel)}`}>
                      {item.nivel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
