import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../services/api";
import { isAdmin } from "../services/utils/auth";

const formInicial = {
  nome: "",
  email: "",
  senha: "",
  perfil: "rh",
  ativo: true,
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  async function carregarUsuarios() {
    const response = await api.get("/usuarios/");
    setUsuarios(response.data);
  }

  useEffect(() => {
    async function carregarDadosIniciais() {
      const response = await api.get("/usuarios/");
      setUsuarios(response.data);
    }

    carregarDadosIniciais();
  }, []);

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  function atualizarCampo(e) {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  }

  function editarUsuario(usuario) {
    setEditando(usuario);

    setForm({
      nome: usuario.nome || "",
      email: usuario.email || "",
      senha: "",
      perfil: usuario.perfil || "rh",
      ativo: usuario.ativo,
    });
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(formInicial);
  }

  async function salvarUsuario(e) {
    e.preventDefault();

    try {
      if (editando) {
        const dados = {
          nome: form.nome,
          email: form.email,
          perfil: form.perfil,
          ativo: form.ativo,
        };

        if (form.senha) {
          dados.senha = form.senha;
        }

        await api.put(`/usuarios/${editando.id}`, dados);
        toast.success("Usuário atualizado!");
      } else {
        await api.post("/usuarios/", {
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          perfil: form.perfil,
        });

        toast.success("Usuário criado!");
      }

      cancelarEdicao();
      carregarUsuarios();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Erro ao salvar usuário."
      );
    }
  }

  async function alterarStatus(usuario) {
    try {
      if (usuario.ativo) {
        await api.patch(`/usuarios/${usuario.id}/inativar`);
        toast.success("Usuário inativado!");
      } else {
        await api.patch(`/usuarios/${usuario.id}/ativar`);
        toast.success("Usuário ativado!");
      }

      carregarUsuarios();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Erro ao alterar usuário."
      );
    }
  }

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const textoBusca = busca.toLowerCase();
    const correspondeBusca =
      usuario.nome?.toLowerCase().includes(textoBusca) ||
      usuario.email?.toLowerCase().includes(textoBusca);

    const correspondePerfil =
      filtroPerfil === "todos" || usuario.perfil === filtroPerfil;

    const correspondeStatus =
      filtroStatus === "todos" ||
      (filtroStatus === "ativos" && usuario.ativo) ||
      (filtroStatus === "inativos" && !usuario.ativo);

    return correspondeBusca && correspondePerfil && correspondeStatus;
  });

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-3xl md:text-4xl font-bold">Usuários</h2>
      </div>

      <form
        onSubmit={salvarUsuario}
        className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-5 gap-4"
      >
        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            Nome
          </label>

          <input
            className="input w-full"
            name="nome"
            value={form.nome}
            onChange={atualizarCampo}
            required
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            E-mail
          </label>

          <input
            className="input w-full"
            type="email"
            name="email"
            value={form.email}
            onChange={atualizarCampo}
            required
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            Senha
          </label>

          <input
            className="input w-full"
            type="password"
            name="senha"
            value={form.senha}
            onChange={atualizarCampo}
            required={!editando}
            placeholder={editando ? "Opcional" : ""}
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-1 block">
            Perfil
          </label>

          <select
            className="input w-full"
            name="perfil"
            value={form.perfil}
            onChange={atualizarCampo}
          >
            <option value="admin">Admin</option>
            <option value="rh">RH</option>
            <option value="consulta">Consulta</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold transition"
          >
            {editando ? "Atualizar" : "Criar"}
          </button>

          {editando && (
            <button
              type="button"
              onClick={cancelarEdicao}
              className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          className="input w-full"
          placeholder="Buscar por nome ou e-mail"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <select
          className="input w-full"
          value={filtroPerfil}
          onChange={(e) => setFiltroPerfil(e.target.value)}
        >
          <option value="todos">Todos os perfis</option>
          <option value="admin">Admin</option>
          <option value="rh">RH</option>
          <option value="consulta">Consulta</option>
        </select>

        <select
          className="input w-full"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="todos">Todos os status</option>
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
        </select>

      </div>

      <div className="mt-10 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Nome</th>
              <th className="text-left p-4">E-mail</th>
              <th className="text-left p-4">Perfil</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Ações</th>
            </tr>
          </thead>

          <tbody>
            {usuariosFiltrados.map((usuario) => (
              <tr key={usuario.id} className="border-t border-zinc-800">
                <td className="p-4">{usuario.nome}</td>
                <td className="p-4">{usuario.email}</td>
                <td className="p-4 uppercase">{usuario.perfil}</td>
                <td className="p-4">
                  {usuario.ativo ? (
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                      Ativo
                    </span>
                  ) : (
                    <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                      Inativo
                    </span>
                  )}
                </td>
                <td className="p-4 flex gap-2">
                  <button
                    onClick={() => editarUsuario(usuario)}
                    className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => alterarStatus(usuario)}
                    className={`px-3 py-2 rounded-lg ${
                      usuario.ativo
                        ? "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                        : "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                    }`}
                  >
                    {usuario.ativo ? "Inativar" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
