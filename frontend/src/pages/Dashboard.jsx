import { useEffect, useState } from "react";
import api from "../services/api";

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [ranking, setRanking] = useState([]);

  async function carregarDashboard() {
    try {
      const [resumo, score] = await Promise.all([
        api.get("/dashboard/resumo"),
        api.get("/dashboard/score"),
      ]);

      setDados(resumo.data);
      setRanking(score.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
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
      titulo: "Advertências no mês",
      valor: dados.advertencias_mes,
    },
    {
      titulo: "Suspensões no mês",
      valor: dados.suspensoes_mes,
    },
  ];

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
                    className={`nivel-badge ${item.nivel.toLowerCase()}`}
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