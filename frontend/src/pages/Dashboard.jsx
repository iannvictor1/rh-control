import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [asos, setAsos] = useState([]);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        const [resumo, score, statusAsos] = await Promise.all([
          api.get("/dashboard/resumo"),
          api.get("/dashboard/score"),
          api.get("/dashboard/asos"),
        ]);

        setDados(resumo.data);
        setRanking(score.data);
        setAsos(statusAsos.data);
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
      </div>
    );
  }

  const cards = [
    {
      titulo: "Total de colaboradores",
      valor: dados.total_colaboradores,
    },
    {
      titulo: "Ativos",
      valor: dados.ativos,
    },
    {
      titulo: "Inativos",
      valor: dados.inativos,
    },
    {
      titulo: "Faltas no mês",
      valor: dados.faltas_mes,
    },
    {
      titulo: "Atestados no mês",
      valor: dados.atestados_mes,
    },
    {
      titulo: "Advertências no mês",
      valor: dados.advertencias_mes,
    },
    {
      titulo: "Suspensões no mês",
      valor: dados.suspensoes_mes,
    },
    {
      titulo: "ASOs vencidos",
      valor: dados.asos_vencidos,
    },
    {
      titulo: "ASOs vencendo em 30 dias",
      valor: dados.asos_vencendo_30_dias,
    },
  ];

  const asosEmAlerta = asos.filter((aso) => aso.status !== "Em dia");

  function classeNivel(nivel) {
    return nivel
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function classeStatusAso(status) {
    if (status === "Vencido") {
      return "bg-red-500/20 text-red-400";
    }

    if (status === "Vencendo") {
      return "bg-yellow-500/20 text-yellow-400";
    }

    return "bg-green-500/20 text-green-400";
  }

  function textoDiasAso(dias) {
    if (dias < 0) {
      return `${Math.abs(dias)} dia(s) vencido`;
    }

    if (dias === 0) {
      return "Vence hoje";
    }

    return `${dias} dia(s)`;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <div className="dashboard-card" key={card.titulo}>
            <span className="dashboard-card-title">
              {card.titulo}
            </span>

            <h2 className="dashboard-card-value">
              {card.valor}
            </h2>
          </div>
        ))}
      </div>

      <div className="ranking-card">
        <div className="ranking-header">
          <h2>ASOs em alerta</h2>
        </div>

        {asosEmAlerta.length === 0 ? (
          <p className="p-6 text-zinc-500">
            Nenhum ASO vencido ou próximo do vencimento.
          </p>
        ) : (
          <table className="ranking-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Data do ASO</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Prazo</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {asosEmAlerta.map((aso) => (
                <tr key={aso.id}>
                  <td>{aso.nome}</td>
                  <td>{aso.data_aso}</td>
                  <td>{aso.vencimento_aso}</td>
                  <td>
                    <span
                      className={`
                        px-3
                        py-1
                        rounded-full
                        text-sm
                        font-semibold
                        ${classeStatusAso(aso.status)}
                      `}
                    >
                      {aso.status}
                    </span>
                  </td>
                  <td>{textoDiasAso(aso.dias_para_vencer)}</td>
                  <td>
                    <Link
                      to={`/colaboradores/${aso.id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Ver histórico
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="ranking-card">
        <div className="ranking-header">
          <h2>Ranking disciplinar</h2>
        </div>

        <table className="ranking-table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Score</th>
              <th>Nível</th>
            </tr>
          </thead>

          <tbody>
            {ranking.map((item) => (
              <tr key={item.id}>
                <td>{item.nome}</td>

                <td>{item.score}</td>

                <td>
                  <span
                    className={`nivel-badge ${classeNivel(item.nivel)}`}
                  >
                    {item.nivel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
