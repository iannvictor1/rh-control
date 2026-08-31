import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getUsuarioToken, isAdmin } from "../services/utils/auth";
import NotasFlutuantes from "./NotasFlutuantes";

function Icon({ children }) {
  return (
    <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

const icons = {
  dashboard: (
    <Icon>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Icon>
  ),
  colaboradores: (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  ),
  faltas: (
    <Icon>
      <path d="m9 11 3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </Icon>
  ),
  calendario: (
    <Icon>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </Icon>
  ),
  ferias: (
    <Icon>
      <path d="M4 7h16" />
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </Icon>
  ),
  advertencias: (
    <Icon>
      <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.3" />
      <path d="M8 7h8" />
      <path d="M8 11h5" />
      <path d="M19 16v3" />
      <path d="M19 22v.01" />
    </Icon>
  ),
  suspensoes: (
    <Icon>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 3v6h6" />
      <path d="M12 7v5l3 2" />
    </Icon>
  ),
  exportacoes: (
    <Icon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M12 18v-6" />
      <path d="m9 15 3 3 3-3" />
    </Icon>
  ),
  notas: (
    <Icon>
      <path d="M5 3h14a2 2 0 0 1 2 2v10l-6 6H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M15 21v-6h6" />
      <path d="M8 8h8" />
      <path d="M8 12h5" />
    </Icon>
  ),
  usuarios: (
    <Icon>
      <path d="M18 21a6 6 0 0 0-12 0" />
      <circle cx="12" cy="8" r="5" />
      <path d="M20 8v6" />
      <path d="M23 11h-6" />
    </Icon>
  ),
};

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12a9 9 0 0 1-15.4 6.4" />
      <path d="M3 12A9 9 0 0 1 18.4 5.6" />
      <path d="M18 2v4h-4" />
      <path d="M6 22v-4h4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.8 13.2A8.4 8.4 0 1 1 10.8 3.2a7 7 0 0 0 10 10Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.9 4.9 1.4 1.4" />
      <path d="m17.7 17.7 1.4 1.4" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.3 17.7-1.4 1.4" />
      <path d="m19.1 4.9-1.4 1.4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 17 15 12l-5-5" />
      <path d="M15 12H3" />
      <path d="M14 4h4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-4" />
    </svg>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = isAdmin();
  const usuario = getUsuarioToken();
  const [tema, setTema] = useState(() => localStorage.getItem("tema") || "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("theme-light", tema === "light");
    localStorage.setItem("tema", tema);
  }, [tema]);

  const links = [
    { to: "/", label: "Dashboard", icon: icons.dashboard },
    { to: "/colaboradores", label: "Colaboradores", icon: icons.colaboradores },
    { to: "/faltas", label: "Faltas", icon: icons.faltas },
    { to: "/atestados", label: "Atestados", icon: icons.calendario },
    { to: "/advertencias", label: "Advertências", icon: icons.advertencias },
    { to: "/suspensoes", label: "Suspensões", icon: icons.suspensoes },
    { to: "/ferias", label: "Férias", icon: icons.ferias },
    { to: "/calendario-rh", label: "Calendário RH", icon: icons.calendario },
    { to: "/exportacoes", label: "Exportações", icon: icons.exportacoes },
  ];

  links.splice(
    links.findIndex((link) => link.to === "/exportacoes"),
    0,
    { to: "/notas", label: "Notas", icon: icons.notas },
  );

  if (admin) {
    links.push({ to: "/usuarios", label: "Usuários", icon: icons.usuarios });
  }

  function estaAtivo(to) {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  }

  function atualizarPagina() {
    window.location.reload();
  }

  function alternarTema() {
    setTema((atual) => (atual === "dark" ? "light" : "dark"));
  }

  function logout() {
    clearSession();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <aside className="sidebar-shell">
        <div className="sidebar-top">
          <div>
            <span className="sidebar-kicker">RH CONTROL</span>
            <span className="sidebar-user">
              Logado como {usuario?.nome || "usuário"}
            </span>
          </div>

          <nav className="sidebar-nav">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`sidebar-link ${estaAtivo(link.to) ? "sidebar-link-active" : ""}`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="layout-actions">
          <button
            type="button"
            className="layout-action-button"
            onClick={atualizarPagina}
            aria-label="Atualizar página"
            title="Atualizar"
          >
            <RefreshIcon />
          </button>

          <button
            type="button"
            className="layout-action-button"
            onClick={alternarTema}
            aria-label={tema === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            title={tema === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {tema === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          <button
            type="button"
            className="layout-action-button layout-action-danger"
            onClick={logout}
            aria-label="Sair"
            title="Sair"
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <main className="app-main flex-1 min-w-0">
        <Outlet />
      </main>

      <NotasFlutuantes />
    </div>
  );
}
