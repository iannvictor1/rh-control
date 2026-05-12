import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

function calcularVencimentoAso(dataAso) {
  if (!dataAso) return null;

  const data = new Date(`${dataAso}T00:00:00`);
  data.setFullYear(data.getFullYear() + 1);

  return data.toISOString().slice(0, 10);
}

export default function DetalheColaborador() {
  const { id } = useParams();

  const [dados, setDados] = useState(null);

  useEffect(() => {
    async function carregarDados() {
      const response = await api.get(
        `/colaboradores/${id}`
      );

      setDados(response.data);
    }

    carregarDados();
  }, [id]);

  if (!dados) {
    return (
      <div className="text-white">
        Carregando...
      </div>
    );
  }

  const {
    colaborador,
    faltas,
    advertencias,
    suspensoes,
    atestados = [],
  } = dados;

  const vencimentoAso = calcularVencimentoAso(colaborador.data_aso);

  const eventos = [
    ...faltas.map((falta) => ({
      id: `falta-${falta.id}`,
      data: falta.data_falta || falta.data,
      tipo: "Falta",
      titulo: "Falta registrada",
      descricao: falta.motivo || "Sem motivo informado",
      cor: "bg-yellow-500/20 text-yellow-400",
    })),

    ...atestados.map((atestado) => ({
      id: `atestado-${atestado.id}`,
      data: atestado.data_atestado,
      tipo: "Atestado médico",
      titulo: `${atestado.dias} dia(s)`,
      descricao: atestado.cid
        ? `CID: ${atestado.cid}`
        : atestado.observacao || "Sem CID informado",
      cor: "bg-cyan-500/20 text-cyan-400",
    })),

    ...advertencias.map((advertencia) => ({
      id: `advertencia-${advertencia.id}`,
      data: advertencia.data_advertencia || advertencia.data,
      tipo: "Advertência",
      titulo: advertencia.tipo,
      descricao: advertencia.motivo,
      cor: "bg-orange-500/20 text-orange-400",
    })),

    ...suspensoes.map((suspensao) => ({
      id: `suspensao-${suspensao.id}`,
      data: suspensao.data_inicio,
      tipo: "Suspensão",
      titulo: `${suspensao.dias} dia(s)`,
      descricao: suspensao.motivo,
      cor: "bg-red-500/20 text-red-400",
    })),
  ].sort((a, b) => new Date(b.data) - new Date(a.data));

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            {colaborador.nome}
          </h1>

          <p className="text-zinc-400 mt-2">
            CPF: {colaborador.cpf || "Não informado"}
          </p>
        </div>

        <span
          className={`
            px-4
            py-2
            rounded-full
            text-sm
            font-medium
            ${
              colaborador.ativo
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }
          `}
        >
          {colaborador.ativo ? "Ativo" : "Inativo"}
        </span>
      </div>

      <div className="mt-10 grid grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">Faltas</h2>

          <p className="text-4xl font-bold">{faltas.length}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Atestados
          </h2>

          <p className="text-4xl font-bold">{atestados.length}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Advertências
          </h2>

          <p className="text-4xl font-bold">{advertencias.length}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Suspensões
          </h2>

          <p className="text-4xl font-bold">{suspensoes.length}</p>
        </div>
      </div>

      <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">ASO</h2>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-zinc-500">Data do ASO</p>
            <p className="mt-1 text-lg">
              {colaborador.data_aso || "Não informado"}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">Vencimento</p>
            <p className="mt-1 text-lg">
              {vencimentoAso || "Não informado"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">
          Timeline de ocorrências
        </h2>

        {eventos.length === 0 ? (
          <p className="text-zinc-500">
            Nenhuma ocorrência registrada.
          </p>
        ) : (
          <div className="space-y-4">
            {eventos.map((evento) => (
              <div
                key={evento.id}
                className="border border-zinc-800 rounded-xl p-4 flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`
                        px-3
                        py-1
                        rounded-full
                        text-sm
                        ${evento.cor}
                      `}
                    >
                      {evento.tipo}
                    </span>

                    <strong>{evento.titulo}</strong>
                  </div>

                  <p className="text-zinc-400 mt-2">
                    {evento.descricao}
                  </p>
                </div>

                <span className="text-zinc-500 text-sm">
                  {evento.data}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
