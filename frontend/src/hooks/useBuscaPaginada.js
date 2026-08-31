import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { getApiErrorMessage } from "../services/utils/errors";

const LIMITE_PADRAO = 10;

function limparParametros(parametros) {
  return Object.fromEntries(
    Object.entries(parametros).filter(([, valor]) => {
      return valor !== undefined && valor !== null && valor !== "";
    })
  );
}

export default function useBuscaPaginada({
  endpoint,
  filtros = {},
  limitePorPagina = LIMITE_PADRAO,
  mensagemErro = "Erro ao carregar dados.",
}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);

    try {
      const response = await api.get(endpoint, {
        params: limparParametros({
          ...filtros,
          skip: (pagina - 1) * limitePorPagina,
          limit: limitePorPagina,
        }),
      });

      setItems(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      toast.error(getApiErrorMessage(error, mensagemErro));
      console.error(error);
    } finally {
      setCarregando(false);
    }
  }, [endpoint, filtros, limitePorPagina, mensagemErro, pagina]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      carregar();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [carregar]);

  function atualizarFiltro(setter) {
    return (e) => {
      setter(e.target.value);
      setPagina(1);
    };
  }

  return {
    items,
    total,
    pagina,
    setPagina,
    carregando,
    limitePorPagina,
    carregar,
    atualizarFiltro,
  };
}
