import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

import FiltrosColaboradores from "../components/colaboradores/FiltrosColaboradores";
import TabelaColaboradores from "../components/colaboradores/TabelaColaboradores";
import ModalColaborador from "../components/colaboradores/ModalColaborador";

const formInicial = {
  nome: "",
  data_nascimento: "",
  rg: "",
  cpf: "",
  data_admissao: "",
  endereco: "",
  email: "",
  telefone: "",
  telefone_emergencia: "",
};

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

  const [form, setForm] = useState(formInicial);

  async function carregarColaboradores() {
    const response = await api.get("/colaboradores/");
    setColaboradores(response.data);
  }

  useEffect(() => {
    carregarColaboradores();
  }, []);

  function atualizarCampo(e) {
    const { name, value } = e.target;

    let valorFormatado = value;

    if (name === "cpf") {
      valorFormatado = formatarCPF(value);
    }

    if (name === "telefone" || name === "telefone_emergencia") {
      valorFormatado = formatarTelefone(value);
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
      nome: colaborador.nome || "",
      data_nascimento: colaborador.data_nascimento || "",
      rg: colaborador.rg || "",
      cpf: colaborador.cpf || "",
      data_admissao: colaborador.data_admissao || "",
      endereco: colaborador.endereco || "",
      email: colaborador.email || "",
      telefone: colaborador.telefone || "",
      telefone_emergencia: colaborador.telefone_emergencia || "",
    });

    setModalAberto(true);
  }

  async function salvarColaborador(e) {
    e.preventDefault();

    try {
      const dados = {
        ...form,
        data_nascimento: form.data_nascimento || null,
        data_admissao: form.data_admissao || null,
      };

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
      toast.error("Erro ao salvar colaborador.");
      console.error(error);
    }
  }

  async function inativarColaborador(id) {
    const confirmar = confirm("Deseja realmente inativar este colaborador?");

    if (!confirmar) return;

    try {
      await api.patch(`/colaboradores/${id}/inativar`);
      toast.success("Colaborador inativado com sucesso!");
      carregarColaboradores();
    } catch (error) {
      toast.error("Erro ao inativar colaborador.");
      console.error(error);
    }
  }

  const colaboradoresFiltrados = colaboradores.filter((colaborador) => {
    const textoBusca = busca.toLowerCase();

    const correspondeBusca =
      colaborador.nome?.toLowerCase().includes(textoBusca) ||
      colaborador.cpf?.toLowerCase().includes(textoBusca) ||
      colaborador.telefone?.toLowerCase().includes(textoBusca);

    const correspondeStatus =
      filtroStatus === "todos" ||
      (filtroStatus === "ativos" && colaborador.ativo) ||
      (filtroStatus === "inativos" && !colaborador.ativo);

    return correspondeBusca && correspondeStatus;
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold">Colaboradores</h2>

        <button
          onClick={abrirCadastro}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold transition"
        >
          Novo Colaborador
        </button>
      </div>

      <FiltrosColaboradores
        busca={busca}
        setBusca={setBusca}
        filtroStatus={filtroStatus}
        setFiltroStatus={setFiltroStatus}
      />

      <TabelaColaboradores
        colaboradores={colaboradoresFiltrados}
        abrirEdicao={abrirEdicao}
        inativarColaborador={inativarColaborador}
      />

      <ModalColaborador
        modalAberto={modalAberto}
        setModalAberto={setModalAberto}
        modoEdicao={modoEdicao}
        salvarColaborador={salvarColaborador}
        form={form}
        atualizarCampo={atualizarCampo}
      />
    </>
  );
}