import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { formatarData } from "../services/utils/formatters";

const tipos = [
  { value: "todos", label: "Todos" },
  { value: "faltas", label: "Faltas" },
  { value: "atestados", label: "Atestados" },
  { value: "suspensoes", label: "Suspensões" },
  { value: "asos", label: "ASOs" },
  { value: "experiencia", label: "Experiência" },
  { value: "ferias", label: "Férias" },
];

const classesTipo = {
  faltas: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  atestados: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  suspensoes: "bg-red-500/15 text-red-300 border-red-500/30",
  asos: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  experiencia: "bg-green-500/15 text-green-300 border-green-500/30",
  ferias: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

function chaveData(data) {
  return data.toISOString().slice(0, 10);
}

function inicioMes(data) {
  return new Date(data.getFullYear(), data.getMonth(), 1);
}

function fimMes(data) {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0);
}

function montarDiasCalendario(referencia) {
  const inicio = inicioMes(referencia);
  const primeiroDiaGrade = new Date(inicio);
  primeiroDiaGrade.setDate(inicio.getDate() - inicio.getDay());

  const dias = [];
  const cursor = new Date(primeiroDiaGrade);

  while (dias.length < 42) {
    dias.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dias;
}

function formatarMesAno(data) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(data);
}

function valorMesInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");

  return `${ano}-${mes}`;
}

function descricaoEvento(evento) {
  const partes = [evento.colaborador_nome];

  if (evento.status) partes.push(evento.status);
  if (evento.descricao) partes.push(evento.descricao);

  return partes.join(" - ");
}

export default function CalendarioRh() {
  const [referencia, setReferencia] = useState(() => inicioMes(new Date()));
  const [tipo, setTipo] = useState("todos");
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const dias = useMemo(() => montarDiasCalendario(referencia), [referencia]);
  const hoje = chaveData(new Date());
  const inicio = chaveData(inicioMes(referencia));
  const fim = chaveData(fimMes(referencia));

  const eventosPorDia = useMemo(() => {
    return eventos.reduce((acc, evento) => {
      const chave = evento.data_inicio;
      acc[chave] = acc[chave] || [];
      acc[chave].push(evento);
      return acc;
    }, {});
  }, [eventos]);

  useEffect(() => {
    async function carregarEventos() {
      setCarregando(true);

      try {
        const response = await api.get("/calendario/rh", {
          params: {
            data_inicio: inicio,
            data_fim: fim,
            tipo,
          },
        });
        setEventos(response.data);
      } catch (error) {
        toast.error("Erro ao carregar calendário.");
        console.error(error);
      } finally {
        setCarregando(false);
      }
    }

    carregarEventos();
  }, [fim, inicio, tipo]);

  function alterarMes(delta) {
    setReferencia((atual) => new Date(atual.getFullYear(), atual.getMonth() + delta, 1));
  }

  function voltarHoje() {
    setReferencia(inicioMes(new Date()));
  }

  function escolherMes(e) {
    const [ano, mes] = e.target.value.split("-").map(Number);

    if (!ano || !mes) return;

    setReferencia(new Date(ano, mes - 1, 1));
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendário RH</h1>
          <p className="mt-2 text-zinc-500">
            Eventos operacionais por data
          </p>
        </div>
      </div>

      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-center">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-semibold"
              onClick={() => alterarMes(-1)}
            >
              Anterior
            </button>
            <button
              type="button"
              className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-semibold"
              onClick={() => alterarMes(1)}
            >
              Próximo
            </button>
            <input
              type="month"
              className="input w-44"
              value={valorMesInput(referencia)}
              onChange={escolherMes}
              title="Escolher mês"
              aria-label="Escolher mês do calendário"
            />
          </div>

          <h2 className="text-2xl font-bold capitalize text-center">
            {formatarMesAno(referencia)}
          </h2>

          <div className="flex gap-2">
            <select
              className="input w-full"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {tipos.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold"
              onClick={voltarHoje}
            >
              Hoje
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1fr_24rem] gap-6">
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-7 bg-zinc-800 text-sm font-bold text-zinc-300">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
              <div key={dia} className="p-3 text-center">
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {dias.map((dia) => {
              const data = chaveData(dia);
              const eventosDia = eventosPorDia[data] || [];
              const foraDoMes = dia.getMonth() !== referencia.getMonth();
              const ehHoje = data === hoje;

              return (
                <div
                  key={data}
                  className={`min-h-32 border-t border-r border-zinc-800 p-3 ${foraDoMes ? "bg-zinc-950/50 text-zinc-600" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-bold ${ehHoje ? "text-blue-300" : ""}`}>
                      {dia.getDate()}
                    </span>
                    {eventosDia.length > 0 && (
                      <span className="text-xs text-zinc-500">
                        {eventosDia.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {eventosDia.slice(0, 3).map((evento) => (
                      <div
                        key={evento.id}
                        className={`rounded-lg border px-2 py-1 text-xs ${classesTipo[evento.tipo]}`}
                        title={descricaoEvento(evento)}
                      >
                        <strong className="block truncate">{evento.titulo}</strong>
                        <span className="block truncate">{evento.colaborador_nome}</span>
                      </div>
                    ))}
                    {eventosDia.length > 3 && (
                      <span className="text-xs text-zinc-500">
                        +{eventosDia.length - 3} evento(s)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Eventos</h2>
            {carregando && <span className="text-sm text-zinc-500">Carregando...</span>}
          </div>

          <div className="mt-6 space-y-3">
            {eventos.length === 0 && !carregando ? (
              <p className="text-zinc-500">Nenhum evento no período.</p>
            ) : (
              eventos.map((evento) => (
                <div key={evento.id} className="border border-zinc-800 rounded-xl p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${classesTipo[evento.tipo]}`}>
                      {evento.titulo}
                    </span>
                    <span className="text-sm text-zinc-500">
                      {formatarData(evento.data_inicio)}
                    </span>
                  </div>

                  <strong className="mt-3 block">{evento.colaborador_nome}</strong>
                  <p className="mt-1 text-sm text-zinc-400">
                    {descricaoEvento(evento)}
                  </p>
                  {evento.data_fim && evento.data_fim !== evento.data_inicio && (
                    <p className="mt-2 text-sm text-zinc-500">
                      Até {formatarData(evento.data_fim)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
