import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { useEffect } from "react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login", {
        email,
        senha,
      });

      localStorage.setItem(
        "token",
        response.data.access_token
      );

      toast.success("Login realizado!");

      navigate("/");
    } catch {
      toast.error("E-mail ou senha inválidos");
    }
  }

  useEffect(() => {
  const token = localStorage.getItem("token");

  if (token) {
    navigate("/");
  }
}, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="bg-zinc-900 w-full max-w-md p-8 rounded-3xl border border-zinc-800"
      >
        <h1 className="text-4xl font-bold text-white mb-8">
          RH Control
        </h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white"
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-xl py-3 text-white font-semibold"
          >
            Entrar
          </button>
        </div>
      </form>
    </div>
  );
}
