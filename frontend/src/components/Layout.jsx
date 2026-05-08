import { Link, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";

export default function Layout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <Toaster position="top-right" />

      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6">
        <h1 className="text-2xl font-bold text-blue-500">RH Control</h1>

        <nav className="mt-10 flex flex-col gap-4">
          <Link to="/" className="hover:text-blue-400 transition">
            Dashboard
          </Link>

          <Link to="/colaboradores" className="hover:text-blue-400 transition">
            Colaboradores
          </Link>

          <Link to="/faltas" className="hover:text-blue-400 transition">
            Faltas
          </Link>

          <Link to="/advertencias" className="hover:text-blue-400 transition">
            Advertências
          </Link>
          <Link to="/suspensoes" className="hover:text-blue-400 transition">
            Suspensões
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-10">
        <Outlet />
      </main>
    </div>
  );
}