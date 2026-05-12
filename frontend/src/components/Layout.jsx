import { Link, Outlet, useNavigate } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");

    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <aside className="w-full md:w-64 md:h-screen md:sticky md:top-0 bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-800 p-4 md:p-6 flex flex-col md:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-blue-500 whitespace-nowrap">
            RH Control
          </h1>

          <nav className="mt-4 md:mt-10 flex md:flex-col gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 text-sm md:text-base">
            <Link
              to="/"
              className="hover:text-blue-400 transition whitespace-nowrap"
            >
              Dashboard
            </Link>

            <Link
              to="/colaboradores"
              className="hover:text-blue-400 transition whitespace-nowrap"
            >
              Colaboradores
            </Link>

            <Link
              to="/faltas"
              className="hover:text-blue-400 transition whitespace-nowrap"
            >
              Faltas
            </Link>

            <Link
              to="/atestados"
              className="hover:text-blue-400 transition whitespace-nowrap"
            >
              Atestados médicos
            </Link>

            <Link
              to="/advertencias"
              className="hover:text-blue-400 transition whitespace-nowrap"
            >
              Advertências
            </Link>

            <Link
              to="/suspensoes"
              className="hover:text-blue-400 transition whitespace-nowrap"
            >
              Suspensões
            </Link>
          </nav>
        </div>

        <button
          onClick={logout}
          className="hidden md:block mt-10 bg-red-600 hover:bg-red-700 transition rounded-xl py-3 font-semibold"
        >
          Sair
        </button>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
