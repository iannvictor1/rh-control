import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Colaboradores from "./pages/Colaboradores";
import Faltas from "./pages/Faltas";
import Advertencias from "./pages/Advertencias";
import Suspensoes from "./pages/Suspensoes";
import DetalheColaborador from "./pages/DetalheColaborador";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/colaboradores" element={<Colaboradores />} />
          <Route path="/colaboradores/:id" element={<DetalheColaborador />} />
          <Route path="/faltas" element={<Faltas />} />
          <Route path="/advertencias" element={<Advertencias />} />
          <Route path="/suspensoes" element={<Suspensoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}