import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { exportarCsv } from "../services/utils/exportCsv";
import { dataDentroPeriodo, formatarData } from "../services/utils/formatters";

const relatorios = {
  colaboradores: {
    titulo: "Colaboradores",
    arquivo: "colaboradores.csv",
    endpoint: "/colaboradores/",
    dataCampo: "data_admissao",
    colunas: [
      { id: "nome", label: "Nome", valor: "nome" },
      { id: "matricula", label: "Matricula", valor: (item) => item.matricula || "-" },
      { id: "cargo", label: "Cargo", valor: (item) => item.cargo || "-" },
      { id: "setor", label: "Setor", valor: (item) => item.setor || "-" },
      { id: "tipo_contrato", label: "Contrato", valor: (item) => item.tipo_contrato || "-" },
      { id: "cpf", label: "CPF", valor: (item) => item.cpf || "-" },
      { id: "rg", label: "RG", valor: (item) => item.rg || "-" },
      { id: "email", label: "E-mail", valor: (item) => item.email || "-" },
      { id: "telefone", label: "Telefone", valor: (item) => item.telefone || "-" },
      { id: "admissao", label: "Admissao", valor: (item) => formatarData(item.data_admissao) },
      { id: "desligamento", label: "Desligamento", valor: (item) => formatarData(item.data_desligamento) },
      { id: "aso", label: "ASO", valor: (item) => formatarData(item.data_aso) },
      { id: "observacoes", label: "Observacoes", valor: (item) => item.observacoes || "-" },
      { id: "status", label: "Status", valor: (item) => item.ativo ? "Ativo" : "Inativo" },
    ],
  },
  faltas: {
    titulo: "Faltas",
    arquivo: "faltas.csv",
    endpoint: "/faltas/",
    dataCampo: "data_falta",
    colunas: [
      { id: "colaborador", label: "Colaborador", valor: (item, nomes) => nomes[item.colaborador_id] || "-" },
      { id: "data", label: "Data", valor: (item) => formatarData(item.data_falta) },
      { id: "motivo", label: "Motivo", valor: (item) => item.motivo || "Sem motivo informado" },
    ],
  },
  atestados: {
    titulo: "Atestados",
    arquivo: "atestados.csv",
    endpoint: "/atestados/",
    dataCampo: "data_atestado",
    colunas: [
      { id: "colaborador", label: "Colaborador", valor: (item, nomes) => nomes[item.colaborador_id] || "-" },
      { id: "data", label: "Data", valor: (item) => formatarData(item.data_atestado) },
      { id: "cid", label: "CID", valor: (item) => item.cid || "-" },
      { id: "dias", label: "Dias", valor: "dias" },
      { id: "observacao", label: "Observacao", valor: (item) => item.observacao || "-" },
    ],
  },
  advertencias: {
    titulo: "Advertencias",
    arquivo: "advertencias.csv",
    endpoint: "/advertencias/",
    dataCampo: "data_advertencia",
    colunas: [
      { id: "colaborador", label: "Colaborador", valor: (item, nomes) => nomes[item.colaborador_id] || "-" },
      { id: "data", label: "Data", valor: (item) => formatarData(item.data_advertencia) },
      { id: "tipo", label: "Tipo", valor: "tipo" },
      { id: "motivo", label: "Motivo", valor: "motivo" },
    ],
  },
  suspensoes: {
    titulo: "Suspensoes",
    arquivo: "suspensoes.csv",
    endpoint: "/suspensoes/",
    dataCampo: "data_inicio",
    colunas: [
      { id: "colaborador", label: "Colaborador", valor: (item, nomes) => nomes[item.colaborador_id] || "-" },
      { id: "inicio", label: "Inicio", valor: (item) => formatarData(item.data_inicio) },
      { id: "dias", label: "Dias", valor: "dias" },
      { id: "motivo", label: "Motivo", valor: "motivo" },
      { id: "status", label: "Status", valor: "status" },
    ],
  },
  usuarios: {
    titulo: "Usuarios",
    arquivo: "usuarios.csv",
    endpoint: "/usuarios/",
    colunas: [
      { id: "nome", label: "Nome", valor: "nome" },
      { id: "email", label: "E-mail", valor: "email" },
      { id: "perfil", label: "Perfil", valor: "perfil" },
      { id: "status", label: "Status", valor: (item) => item.ativo ? "Ativo" : "Inativo" },
    ],
  },
};

export default function Exportacoes() {
  const [tipo, setTipo] = useState("colaboradores");
  const [dados, setDados] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [colunasSelecionadas, setColunasSelecionadas] = useState(
    relatorios.colaboradores.colunas.map((coluna) => coluna.id)
  );
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [carregando, setCarregando] = useState(true);

  const config = relatorios[tipo];

  const nomesColaboradores = useMemo(() => {
    return colaboradores.reduce((nomes, colaborador) => {
      nomes[colaborador.id] = colaborador.nome;
      return nomes;
    }, {});
  }, [colaboradores]);

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true);

      try {
        const requisicoes = [api.get(config.endpoint)];

        if (tipo !== "colaboradores" && tipo !== "usuarios") {
          requisicoes.push(api.get("/colaboradores/"));
        }

        const [resDados, resColaboradores] = await Promise.all(requisicoes);

        setDados(resDados.data);
        setColaboradores(resColaboradores?.data || resDados.data);
      } catch (error) {
        toast.error("Erro ao carregar dados para exportacao.");
        console.error(error);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [config.endpoint, tipo]);

  const dadosFiltrados = dados.filter((item) => {
    const textoBusca = busca.toLowerCase();
    const textoItem = JSON.stringify({
      ...item,
      colaborador: nomesColaboradores[item.colaborador_id],
    }).toLowerCase();
    const periodoOk = config.dataCampo
      ? dataDentroPeriodo(item[config.dataCampo], dataInicio, dataFim)
      : true;

    return textoItem.includes(textoBusca) && periodoOk;
  });

  function alternarColuna(colunaId) {
    setColunasSelecionadas((selecionadas) => {
      if (selecionadas.includes(colunaId)) {
        return selecionadas.filter((id) => id !== colunaId);
      }

      return [...selecionadas, colunaId];
    });
  }

  function trocarRelatorio(novoTipo) {
    setTipo(novoTipo);
    setColunasSelecionadas(
      relatorios[novoTipo].colunas.map((coluna) => coluna.id)
    );
  }

  function exportarRelatorio() {
    const colunas = config.colunas
      .filter((coluna) => colunasSelecionadas.includes(coluna.id))
      .map((coluna) => ({
        ...coluna,
        valor: typeof coluna.valor === "function"
          ? (item) => coluna.valor(item, nomesColaboradores)
          : coluna.valor,
      }));

    if (colunas.length === 0) {
      toast.error("Selecione pelo menos uma coluna.");
      return;
    }

    exportarCsv(config.arquivo, colunas, dadosFiltrados);
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-3xl md:text-4xl font-bold">Exportacoes</h2>

        <button
          type="button"
          onClick={exportarRelatorio}
          className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-semibold transition"
        >
          Exportar CSV
        </button>
      </div>

      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            Relatorio
          </label>

          <select
            className="input w-full"
            value={tipo}
            onChange={(e) => trocarRelatorio(e.target.value)}
          >
            {Object.entries(relatorios).map(([id, relatorio]) => (
              <option key={id} value={id}>
                {relatorio.titulo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">Busca</label>

          <input
            className="input w-full"
            placeholder="Filtrar conteudo"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            Data inicial
          </label>

          <input
            className="input w-full"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            disabled={!config.dataCampo}
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            Data final
          </label>

          <input
            className="input w-full"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            disabled={!config.dataCampo}
          />
        </div>
      </div>

      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Colunas do arquivo</h3>
          <span className="text-sm text-zinc-400">
            {dadosFiltrados.length} registro(s)
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {config.colunas.map((coluna) => (
            <label
              key={coluna.id}
              className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
            >
              <input
                type="checkbox"
                checked={colunasSelecionadas.includes(coluna.id)}
                onChange={() => alternarColuna(coluna.id)}
              />

              <span>{coluna.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        {carregando ? (
          <p className="text-zinc-400">Carregando dados...</p>
        ) : (
          <p className="text-zinc-400">
            O arquivo sera gerado com as colunas marcadas e os filtros aplicados.
          </p>
        )}
      </div>
    </>
  );
}
