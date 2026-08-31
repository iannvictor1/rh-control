import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import ActionMenu from "../components/ActionMenu";
import AuditInfo from "../components/AuditInfo";
import ConfirmDialog from "../components/ConfirmDialog";
import api from "../services/api";
import { canManageRh } from "../services/utils/auth";
import { formatarData, formatarMoeda } from "../services/utils/formatters";

const endpointsPorTipo = {
  falta: "/faltas",
  atestado: "/atestados",
  advertencia: "/advertencias",
  suspensao: "/suspensoes",
};

function calcularVencimentoAso(dataAso) {
  if (!dataAso) return null;

  const data = new Date(`${dataAso}T00:00:00`);
  data.setFullYear(data.getFullYear() + 1);

  return data.toISOString().slice(0, 10);
}

function calcularStatusAso(dataAso, vencimentoAso) {
  if (!dataAso || !vencimentoAso) {
    return {
      texto: "ASO não informado",
      classe: "bg-zinc-700/60 text-zinc-300",
      detalhe: "-",
    };
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const vencimento = new Date(`${vencimentoAso}T00:00:00`);
  const dias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));

  if (dias < 0) {
    return {
      texto: "Vencido",
      classe: "bg-red-500/20 text-red-400",
      detalhe: `${Math.abs(dias)} dia(s) vencido`,
    };
  }

  if (dias <= 30) {
    return {
      texto: "Vencendo",
      classe: "bg-yellow-500/20 text-yellow-300",
      detalhe: dias === 0 ? "Vence hoje" : `${dias} dia(s)`,
    };
  }

  return {
    texto: "Em dia",
    classe: "bg-green-500/20 text-green-400",
    detalhe: `${dias} dia(s)`,
  };
}

function CampoFicha({ label, value }) {
  return (
    <div>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-base text-white break-words">
        {value || "Não informado"}
      </p>
    </div>
  );
}

function ResumoCard({ titulo, valor, detalhe, classe = "text-white" }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-sm text-zinc-500">{titulo}</p>
      <p className={`mt-3 text-3xl font-black ${classe}`}>{valor}</p>
      {detalhe && <p className="mt-2 text-sm text-zinc-400">{detalhe}</p>}
    </div>
  );
}

function CabecalhoColaborador({ colaborador, statusAso }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
      <div>
        <Link
          to="/colaboradores"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Voltar para colaboradores
        </Link>

        <h1 className="mt-3 text-4xl font-black">{colaborador.nome}</h1>

        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
            Matrícula: {colaborador.matricula || "-"}
          </span>
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
            {colaborador.cargo || "Cargo não informado"}
          </span>
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
            {colaborador.setor || "Setor não informado"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            colaborador.ativo
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {colaborador.ativo ? "Ativo" : "Inativo"}
        </span>

        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusAso.classe}`}>
          ASO {statusAso.texto}
        </span>
      </div>
    </div>
  );
}

function ResumoColaborador({
  faltas,
  atestados,
  advertencias,
  suspensoes,
  vencimentoAso,
  statusAso,
}) {
  return (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <ResumoCard titulo="Faltas" valor={faltas.length} />
      <ResumoCard titulo="Atestados" valor={atestados.length} />
      <ResumoCard titulo="Advertências" valor={advertencias.length} />
      <ResumoCard titulo="Suspensões" valor={suspensoes.length} />
      <ResumoCard
        titulo="Vencimento ASO"
        valor={formatarData(vencimentoAso)}
        detalhe={statusAso.detalhe}
        classe={statusAso.texto === "Vencido" ? "text-red-400" : "text-white"}
      />
    </div>
  );
}

function FichaCadastral({ colaborador, vencimentoAso }) {
  return (
    <section className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6">Ficha cadastral</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <CampoFicha label="Empresa" value={colaborador.empresa} />
        <CampoFicha label="Contrato" value={colaborador.tipo_contrato} />
        <CampoFicha label="Salário" value={formatarMoeda(colaborador.salario)} />
        <CampoFicha label="Tipo bonificação" value={colaborador.tipo_bonificacao} />
        <CampoFicha label="Bonificação" value={formatarMoeda(colaborador.bonificacao)} />
        <CampoFicha label="Data de nascimento" value={formatarData(colaborador.data_nascimento)} />
        <CampoFicha label="RG" value={colaborador.rg} />
        <CampoFicha label="CPF" value={colaborador.cpf} />
        <CampoFicha label="Admissão" value={formatarData(colaborador.data_admissao)} />
        <CampoFicha label="Desligamento" value={formatarData(colaborador.data_desligamento)} />
        <CampoFicha label="Motivo do desligamento" value={colaborador.motivo_desligamento} />
        <CampoFicha label="E-mail" value={colaborador.email} />
        <CampoFicha label="Telefone" value={colaborador.telefone} />
        <CampoFicha label="Telefone emergência" value={colaborador.telefone_emergencia} />
        <CampoFicha label="Endereço" value={colaborador.endereco} />
        <CampoFicha label="Data do ASO" value={formatarData(colaborador.data_aso)} />
        <CampoFicha label="Vencimento do ASO" value={formatarData(vencimentoAso)} />
        <div className="sm:col-span-2 xl:col-span-4">
          <CampoFicha label="Observações" value={colaborador.observacoes} />
        </div>
      </div>
    </section>
  );
}

function HistoricoOcorrencias({
  eventosFiltrados,
  busca,
  setBusca,
  filtroTipo,
  setFiltroTipo,
  podeGerenciar,
  menuAberto,
  setMenuAberto,
  abrirEdicaoEvento,
  setEventoParaExcluir,
}) {
  return (
    <section className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h2 className="text-2xl font-bold">Histórico de ocorrências</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
          <input
            className="input w-full lg:w-80"
            placeholder="Buscar no histórico"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="input w-full lg:w-56"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="todos">Todos os tipos</option>
            <option value="faltas">Faltas</option>
            <option value="atestados">Atestados</option>
            <option value="advertencias">Advertências</option>
            <option value="suspensoes">Suspensões</option>
          </select>
        </div>
      </div>

      {eventosFiltrados.length === 0 ? (
        <p className="mt-6 text-zinc-500">Nenhuma ocorrência encontrada.</p>
      ) : (
        <div className="mt-6 relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-800" />

          <div className="space-y-4">
            {eventosFiltrados.map((evento) => (
              <div key={evento.id} className="relative pl-10">
                <div className="absolute left-[0.55rem] top-6 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-zinc-900" />

                <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/50 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-sm ${evento.cor}`}>
                        {evento.tipo}
                      </span>

                      <strong>{evento.titulo}</strong>

                      <span className="text-sm text-zinc-500">
                        {formatarData(evento.data)}
                      </span>
                    </div>

                    <p className="text-zinc-400 mt-2 break-words">
                      {evento.descricao}
                    </p>

                    <AuditInfo registro={evento.original} />
                  </div>

                  {podeGerenciar && (
                    <ActionMenu
                      aberto={menuAberto === evento.id}
                      onClose={() => setMenuAberto(null)}
                      onToggle={() =>
                        setMenuAberto(menuAberto === evento.id ? null : evento.id)
                      }
                      onEditar={() => abrirEdicaoEvento(evento)}
                      onExcluir={() => setEventoParaExcluir(evento)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function DetalheColaborador() {
  const { id } = useParams();
  const podeGerenciar = canManageRh();

  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(null);
  const [eventoParaExcluir, setEventoParaExcluir] = useState(null);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [formEdicao, setFormEdicao] = useState({});

  async function carregarDados() {
    try {
      const response = await api.get(`/colaboradores/${id}`);
      setDados(response.data);
    } catch (error) {
      toast.error("Erro ao carregar colaborador.");
      console.error(error);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        const response = await api.get(`/colaboradores/${id}`);
        setDados(response.data);
      } catch (error) {
        toast.error("Erro ao carregar colaborador.");
        console.error(error);
      } finally {
        setCarregando(false);
      }
    }

    carregarDadosIniciais();
  }, [id]);

  if (carregando) {
    return <div className="text-white">Carregando...</div>;
  }

  if (!dados) {
    return <div className="text-zinc-400">Colaborador não encontrado.</div>;
  }

  const {
    colaborador,
    faltas = [],
    advertencias = [],
    suspensoes = [],
    atestados = [],
  } = dados;

  const vencimentoAso =
    colaborador.vencimento_aso || calcularVencimentoAso(colaborador.data_aso);
  const statusAso = calcularStatusAso(colaborador.data_aso, vencimentoAso);

  const eventos = [
    ...faltas.map((falta) => ({
      id: `falta-${falta.id}`,
      itemId: falta.id,
      endpointTipo: "falta",
      original: falta,
      data: falta.data_falta,
      tipo: "Falta",
      filtro: "faltas",
      titulo: "Falta registrada",
      descricao: falta.motivo || "Sem motivo informado",
      cor: "bg-yellow-500/20 text-yellow-300",
    })),
    ...atestados.map((atestado) => ({
      id: `atestado-${atestado.id}`,
      itemId: atestado.id,
      endpointTipo: "atestado",
      original: atestado,
      data: atestado.data_atestado,
      tipo: "Atestado",
      filtro: "atestados",
      titulo: `${atestado.dias} dia(s)`,
      descricao: atestado.cid
        ? `CID: ${atestado.cid}`
        : atestado.observacao || "Sem CID informado",
      cor: "bg-cyan-500/20 text-cyan-300",
    })),
    ...advertencias.map((advertencia) => ({
      id: `advertencia-${advertencia.id}`,
      itemId: advertencia.id,
      endpointTipo: "advertencia",
      original: advertencia,
      data: advertencia.data_advertencia,
      tipo: "Advertência",
      filtro: "advertencias",
      titulo: advertencia.tipo,
      descricao: advertencia.motivo,
      cor: "bg-orange-500/20 text-orange-300",
    })),
    ...suspensoes.map((suspensao) => ({
      id: `suspensao-${suspensao.id}`,
      itemId: suspensao.id,
      endpointTipo: "suspensao",
      original: suspensao,
      data: suspensao.data_inicio,
      tipo: "Suspensão",
      filtro: "suspensoes",
      titulo: `${suspensao.dias} dia(s)`,
      descricao: `${suspensao.motivo} - ${suspensao.status}`,
      cor: "bg-red-500/20 text-red-300",
    })),
  ].sort((a, b) => new Date(b.data) - new Date(a.data));

  const eventosFiltrados = eventos.filter((evento) => {
    const textoBusca = busca.toLowerCase();
    const correspondeTipo = filtroTipo === "todos" || evento.filtro === filtroTipo;
    const correspondeBusca =
      evento.tipo.toLowerCase().includes(textoBusca) ||
      evento.titulo.toLowerCase().includes(textoBusca) ||
      evento.descricao.toLowerCase().includes(textoBusca);

    return correspondeTipo && correspondeBusca;
  });

  async function confirmarExclusao() {
    if (!eventoParaExcluir) return;

    try {
      const endpoint = endpointsPorTipo[eventoParaExcluir.endpointTipo];
      await api.delete(`${endpoint}/${eventoParaExcluir.itemId}`);
      toast.success("Ocorrência excluída com sucesso!");
      setEventoParaExcluir(null);
      setMenuAberto(null);
      carregarDados();
    } catch (error) {
      toast.error("Erro ao excluir ocorrência.");
      console.error(error);
    }
  }

  function abrirEdicaoEvento(evento) {
    setMenuAberto(null);
    setEventoEditando(evento);

    if (evento.endpointTipo === "falta") {
      setFormEdicao({
        data_falta: evento.original.data_falta || "",
        motivo: evento.original.motivo || "",
      });
    }

    if (evento.endpointTipo === "atestado") {
      setFormEdicao({
        data_atestado: evento.original.data_atestado || "",
        cid: evento.original.cid || "",
        dias: String(evento.original.dias || ""),
        observacao: evento.original.observacao || "",
      });
    }

    if (evento.endpointTipo === "advertencia") {
      setFormEdicao({
        data_advertencia: evento.original.data_advertencia || "",
        tipo: evento.original.tipo || "Verbal",
        motivo: evento.original.motivo || "",
      });
    }

    if (evento.endpointTipo === "suspensao") {
      setFormEdicao({
        data_inicio: evento.original.data_inicio || "",
        dias: String(evento.original.dias || ""),
        motivo: evento.original.motivo || "",
        status: evento.original.status || "Ativa",
      });
    }
  }

  function atualizarCampoEdicao(e) {
    const { name, value } = e.target;

    setFormEdicao({
      ...formEdicao,
      [name]: value,
    });
  }

  async function salvarEdicaoEvento(e) {
    e.preventDefault();

    if (!eventoEditando) return;

    const endpoint = endpointsPorTipo[eventoEditando.endpointTipo];
    const dados = {
      colaborador_id: Number(id),
      ...formEdicao,
    };

    if ("dias" in dados) {
      dados.dias = Number(dados.dias);
    }

    for (const campo of ["motivo", "cid", "observacao"]) {
      if (campo in dados && dados[campo] === "") {
        dados[campo] = null;
      }
    }

    try {
      await api.put(`${endpoint}/${eventoEditando.itemId}`, dados);
      toast.success("Ocorrência atualizada com sucesso!");
      setEventoEditando(null);
      setFormEdicao({});
      carregarDados();
    } catch (error) {
      toast.error("Erro ao atualizar ocorrência.");
      console.error(error);
    }
  }

  function tituloModalEdicao() {
    if (!eventoEditando) return "";
    return `Editar ${eventoEditando.tipo.toLowerCase()}`;
  }

  return (
    <>
      <CabecalhoColaborador colaborador={colaborador} statusAso={statusAso} />

      <ResumoColaborador
        faltas={faltas}
        atestados={atestados}
        advertencias={advertencias}
        suspensoes={suspensoes}
        vencimentoAso={vencimentoAso}
        statusAso={statusAso}
      />

      <FichaCadastral
        colaborador={colaborador}
        vencimentoAso={vencimentoAso}
      />

      <HistoricoOcorrencias
        eventosFiltrados={eventosFiltrados}
        busca={busca}
        setBusca={setBusca}
        filtroTipo={filtroTipo}
        setFiltroTipo={setFiltroTipo}
        podeGerenciar={podeGerenciar}
        menuAberto={menuAberto}
        setMenuAberto={setMenuAberto}
        abrirEdicaoEvento={abrirEdicaoEvento}
        setEventoParaExcluir={setEventoParaExcluir}
      />

      <ConfirmDialog
        aberto={Boolean(eventoParaExcluir)}
        titulo="Excluir ocorrência"
        mensagem="Esta ação remove o registro do histórico definitivamente."
        onCancelar={() => setEventoParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />

      {eventoEditando && (
        <div className="dialog-backdrop" role="presentation">
          <form
            className="dialog-box max-w-2xl"
            role="dialog"
            aria-modal="true"
            onSubmit={salvarEdicaoEvento}
          >
            <h3>{tituloModalEdicao()}</h3>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventoEditando.endpointTipo === "falta" && (
                <>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">
                      Data
                    </label>
                    <input
                      className="input w-full"
                      type="date"
                      name="data_falta"
                      value={formEdicao.data_falta || ""}
                      onChange={atualizarCampoEdicao}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">
                      Motivo
                    </label>
                    <input
                      className="input w-full"
                      name="motivo"
                      value={formEdicao.motivo || ""}
                      onChange={atualizarCampoEdicao}
                    />
                  </div>
                </>
              )}

              {eventoEditando.endpointTipo === "atestado" && (
                <>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">
                      Data
                    </label>
                    <input
                      className="input w-full"
                      type="date"
                      name="data_atestado"
                      value={formEdicao.data_atestado || ""}
                      onChange={atualizarCampoEdicao}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">
                      Dias
                    </label>
                    <input
                      className="input w-full"
                      type="number"
                      min="1"
                      name="dias"
                      value={formEdicao.dias || ""}
                      onChange={atualizarCampoEdicao}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">
                      CID
                    </label>
                    <input
                      className="input w-full"
                      name="cid"
                      value={formEdicao.cid || ""}
                      onChange={atualizarCampoEdicao}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">
                      Observação
                    </label>
                    <input
                      className="input w-full"
                      name="observacao"
                      value={formEdicao.observacao || ""}
                      onChange={atualizarCampoEdicao}
                    />
                  </div>
                </>
              )}

              {eventoEditando.endpointTipo === "advertencia" && (
                <>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">
                      Data
                    </label>
                    <input
                      className="input w-full"
                      type="date"
                      name="data_advertencia"
                      value={formEdicao.data_advertencia || ""}
                      onChange={atualizarCampoEdicao}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">
                      Tipo
                    </label>
                    <select
                      className="input w-full"
                      name="tipo"
                      value={formEdicao.tipo || "Verbal"}
                      onChange={atualizarCampoEdicao}
                    >
                      <option value="Verbal">Verbal</option>
                      <option value="Escrita">Escrita</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-zinc-400 mb-1 block">
                      Motivo
                    </label>
                    <input
                      className="input w-full"
                      name="motivo"
                      value={formEdicao.motivo || ""}
                      onChange={atualizarCampoEdicao}
                      required
                    />
                  </div>
                </>
              )}

              {eventoEditando.endpointTipo === "suspensao" && (
                <>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">
                      Início
                    </label>
                    <input
                      className="input w-full"
                      type="date"
                      name="data_inicio"
                      value={formEdicao.data_inicio || ""}
                      onChange={atualizarCampoEdicao}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">
                      Dias
                    </label>
                    <input
                      className="input w-full"
                      type="number"
                      min="1"
                      name="dias"
                      value={formEdicao.dias || ""}
                      onChange={atualizarCampoEdicao}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">
                      Status
                    </label>
                    <select
                      className="input w-full"
                      name="status"
                      value={formEdicao.status || "Ativa"}
                      onChange={atualizarCampoEdicao}
                    >
                      <option value="Ativa">Ativa</option>
                      <option value="Finalizada">Finalizada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-1 block">
                      Motivo
                    </label>
                    <input
                      className="input w-full"
                      name="motivo"
                      value={formEdicao.motivo || ""}
                      onChange={atualizarCampoEdicao}
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <div className="dialog-actions">
              <button
                type="button"
                className="dialog-button-secondary"
                onClick={() => {
                  setEventoEditando(null);
                  setFormEdicao({});
                }}
              >
                Cancelar
              </button>

              <button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-3 font-bold">
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
