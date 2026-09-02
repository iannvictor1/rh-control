import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { canManageRh } from "../services/utils/auth";
import { getApiErrorMessage } from "../services/utils/errors";

import FiltrosColaboradores from "../components/colaboradores/FiltrosColaboradores";
import TabelaColaboradores from "../components/colaboradores/TabelaColaboradores";
import ModalColaborador from "../components/colaboradores/ModalColaborador";
import ConfirmDialog from "../components/ConfirmDialog";
import Paginacao from "../components/Paginacao";

const formInicial = {
  empresa: "",
  nome: "",
  matricula: "",
  cargo: "",
  salario: "",
  tipo_bonificacao: "",
  bonificacao: "",
  setor: "",
  tipo_contrato: "",
  data_nascimento: "",
  rg: "",
  cpf: "",
  data_admissao: "",
  data_desligamento: "",
  motivo_desligamento_opcao: "",
  motivo_desligamento: "",
  data_aso: "",
  data_limite_ferias: "",
  endereco: "",
  email: "",
  telefone: "",
  telefone_emergencia: "",
  observacoes: "",
};

const motivosDesligamentoPadrao = [
  "Pedido de Demissao",
  "Demissao Sem Justa Causa",
  "Demissao Por Justa Causa",
  "Fim do Prazo Determinado",
  "Termino Antecipado Contrato de Experiencia - Empregado",
  "Termino Antecipado Contrato de Experiencia - Empregador",
  "Rescisao em Comum Acordo",
];

function obterOpcaoMotivoDesligamento(motivo) {
  if (!motivo) {
    return "";
  }

  return motivosDesligamentoPadrao.includes(motivo) ? motivo : "Outro";
}

function formatarCPF(valor) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarTelefone(valor) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [colaboradorEditando, setColaboradorEditando] = useState(null);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [colaboradorParaInativar, setColaboradorParaInativar] = useState(null);

  const [form, setForm] = useState(formInicial);
  const inputImportacaoRef = useRef(null);
  const inputImportacaoFeriasRef = useRef(null);
  const podeGerenciar = canManageRh();
  const limitePorPagina = 10;

  const carregarColaboradores = useCallback(async () => {
    setCarregando(true);

    try {
      const response = await api.get("/colaboradores/busca", {
        params: {
          q: busca || undefined,
          status: filtroStatus,
          skip: (pagina - 1) * limitePorPagina,
          limit: limitePorPagina,
        },
      });

      setColaboradores(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao carregar colaboradores."));
      console.error(error);
    } finally {
      setCarregando(false);
    }
  }, [busca, filtroStatus, pagina]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      carregarColaboradores();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [carregarColaboradores]);

  function atualizarCampo(e) {
    const { name, value } = e.target;

    let valorFormatado = value;

    if (name === "cpf") {
      valorFormatado = formatarCPF(value);
    }

    if (name === "rg") {
      valorFormatado = value.replace(/\D/g, "");
    }

    if (name === "telefone" || name === "telefone_emergencia") {
      valorFormatado = formatarTelefone(value);
    }

    if (name === "tipo_bonificacao") {
      setForm({
        ...form,
        tipo_bonificacao: value,
        bonificacao: value === "Fixa" ? form.bonificacao : "",
      });
      return;
    }

    if (name === "data_desligamento" && !value) {
      setForm({
        ...form,
        data_desligamento: "",
        motivo_desligamento_opcao: "",
        motivo_desligamento: "",
      });
      return;
    }

    if (name === "motivo_desligamento_opcao") {
      setForm({
        ...form,
        motivo_desligamento_opcao: value,
        motivo_desligamento: value === "Outro" ? "" : value,
      });
      return;
    }

    setForm({
      ...form,
      [name]: valorFormatado,
    });
  }

  function abrirCadastro() {
    setModoEdicao(false);
    setColaboradorEditando(null);
    setForm(formInicial);
    setModalAberto(true);
  }

  function abrirEdicao(colaborador) {
    setModoEdicao(true);
    setColaboradorEditando(colaborador);

    setForm({
      empresa: colaborador.empresa || "",
      nome: colaborador.nome || "",
      matricula: colaborador.matricula || "",
      cargo: colaborador.cargo || "",
      salario: colaborador.salario || "",
      tipo_bonificacao: colaborador.tipo_bonificacao || "",
      bonificacao: colaborador.bonificacao || "",
      setor: colaborador.setor || "",
      tipo_contrato: colaborador.tipo_contrato || "",
      data_nascimento: colaborador.data_nascimento || "",
      rg: colaborador.rg || "",
      cpf: colaborador.cpf || "",
      data_admissao: colaborador.data_admissao || "",
      data_desligamento: colaborador.data_desligamento || "",
      motivo_desligamento_opcao: obterOpcaoMotivoDesligamento(
        colaborador.motivo_desligamento
      ),
      motivo_desligamento: colaborador.motivo_desligamento || "",
      data_aso: colaborador.data_aso || "",
      data_limite_ferias: colaborador.data_limite_ferias || "",
      endereco: colaborador.endereco || "",
      email: colaborador.email || "",
      telefone: colaborador.telefone || "",
      telefone_emergencia: colaborador.telefone_emergencia || "",
      observacoes: colaborador.observacoes || "",
    });

    setModalAberto(true);
  }

  async function salvarColaborador(e) {
    e.preventDefault();

    try {
      const dados = {
        ...form,
        data_nascimento: form.data_nascimento || null,
        salario: form.salario || null,
        tipo_bonificacao: form.tipo_bonificacao || null,
        bonificacao: form.tipo_bonificacao === "Fixa"
          ? form.bonificacao || null
          : null,
        data_admissao: form.data_admissao || null,
        data_desligamento: form.data_desligamento || null,
        motivo_desligamento: form.data_desligamento
          ? form.motivo_desligamento
          : null,
        data_aso: form.data_aso || null,
        data_limite_ferias: form.data_limite_ferias || null,
      };
      delete dados.motivo_desligamento_opcao;

      if (modoEdicao) {
        await api.put(`/colaboradores/${colaboradorEditando.id}`, dados);
        toast.success("Colaborador atualizado com sucesso!");
      } else {
        await api.post("/colaboradores/", dados);
        toast.success("Colaborador cadastrado com sucesso!");
      }

      setModalAberto(false);
      setForm(formInicial);
      setModoEdicao(false);
      setColaboradorEditando(null);

      carregarColaboradores();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao salvar colaborador."));
      console.error(error);
    }
  }

  function pedirInativacaoColaborador(colaborador) {
    setColaboradorParaInativar(colaborador);
  }

  async function confirmarInativacaoColaborador() {
    if (!colaboradorParaInativar) return;

    try {
      await api.patch(`/colaboradores/${colaboradorParaInativar.id}/inativar`);
      toast.success("Colaborador inativado com sucesso!");
      setColaboradorParaInativar(null);
      carregarColaboradores();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao inativar colaborador."));
      console.error(error);
    }
  }

  async function ativarColaborador(id) {
    try {
      await api.patch(`/colaboradores/${id}/ativar`);
      toast.success("Colaborador ativado com sucesso!");
      carregarColaboradores();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao ativar colaborador."));
      console.error(error);
    }
  }

  async function importarColaboradores(e) {
    const arquivo = e.target.files?.[0];

    if (!arquivo) {
      return;
    }

    const dados = new FormData();
    dados.append("arquivo", arquivo);

    try {
      const response = await api.post("/colaboradores/importar", dados, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const { importados, ignorados, linhas_ignoradas = [], erros } = response.data;

      toast.success(
        `${importados} colaborador(es) importado(s). ${ignorados} linha(s) ignorada(s).`
      );

      if (linhas_ignoradas.length > 0) {
        const linhas = linhas_ignoradas
          .slice(0, 8)
          .map((item) => `linha ${item.linha}`)
          .join(", ");
        const complemento = linhas_ignoradas.length > 8 ? "..." : "";

        toast(
          `Ignoradas por nome vazio: ${linhas}${complemento}`,
          { icon: "!" }
        );
      }

      if (erros.length > 0) {
        const primeiroErro = erros[0];
        toast.error(
          `${erros.length} linha(s) não foram importadas. Linha ${primeiroErro.linha}: ${primeiroErro.erro}`
        );
      }

      carregarColaboradores();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao importar planilha."));
      console.error(error);
    } finally {
      e.target.value = "";
    }
  }

  async function importarFeriasPdf(e) {
    const arquivo = e.target.files?.[0];

    if (!arquivo) {
      return;
    }

    const dados = new FormData();
    dados.append("arquivo", arquivo);

    try {
      const response = await api.post("/colaboradores/importar-ferias-pdf", dados, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const { importados, ignorados, erros } = response.data;

      toast.success(
        `${importados} data(s) limite de férias importada(s). ${ignorados} registro(s) ignorado(s).`
      );

      if (erros.length > 0) {
        const primeiroErro = erros[0];
        toast.error(
          `${erros.length} registro(s) não foram importados. ${primeiroErro.erro}`
        );
      }

      carregarColaboradores();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao importar PDF de férias."));
      console.error(error);
    } finally {
      e.target.value = "";
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-3xl md:text-4xl font-bold">Colaboradores</h2>

        {podeGerenciar && (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              ref={inputImportacaoRef}
              type="file"
              accept=".xlsx"
              onChange={importarColaboradores}
              className="hidden"
            />

            <input
              ref={inputImportacaoFeriasRef}
              type="file"
              accept=".pdf"
              onChange={importarFeriasPdf}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => inputImportacaoRef.current?.click()}
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl font-semibold transition"
            >
              Importar planilha
            </button>

            <button
              type="button"
              onClick={() => inputImportacaoFeriasRef.current?.click()}
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl font-semibold transition"
            >
              Importar férias PDF
            </button>

            <button
              onClick={abrirCadastro}
              className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold transition"
            >
              Novo Colaborador
            </button>
          </div>
        )}
      </div>

      <FiltrosColaboradores
        busca={busca}
        setBusca={(valor) => {
          setBusca(valor);
          setPagina(1);
        }}
        filtroStatus={filtroStatus}
        setFiltroStatus={(valor) => {
          setFiltroStatus(valor);
          setPagina(1);
        }}
      />

      <TabelaColaboradores
        colaboradores={colaboradores}
        abrirEdicao={abrirEdicao}
        inativarColaborador={pedirInativacaoColaborador}
        ativarColaborador={ativarColaborador}
        podeGerenciar={podeGerenciar}
        carregando={carregando}
      />

      <Paginacao
        total={total}
        pagina={pagina}
        limitePorPagina={limitePorPagina}
        onPaginaChange={setPagina}
        textoTotal={`${total} colaborador(es) encontrado(s)`}
      />

      {podeGerenciar && (
        <ModalColaborador
          modalAberto={modalAberto}
          setModalAberto={setModalAberto}
          modoEdicao={modoEdicao}
          salvarColaborador={salvarColaborador}
          form={form}
          atualizarCampo={atualizarCampo}
          motivosDesligamentoPadrao={motivosDesligamentoPadrao}
        />
      )}

      <ConfirmDialog
        aberto={Boolean(colaboradorParaInativar)}
        titulo="Inativar colaborador"
        mensagem={`Deseja realmente inativar ${colaboradorParaInativar?.nome || "este colaborador"}?`}
        textoConfirmar="Inativar"
        onCancelar={() => setColaboradorParaInativar(null)}
        onConfirmar={confirmarInativacaoColaborador}
      />
    </>
  );
}
