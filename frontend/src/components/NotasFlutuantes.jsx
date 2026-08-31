import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { getApiErrorMessage } from "../services/utils/errors";

function limparHtmlNota(html) {
  const documento = new DOMParser().parseFromString(html || "", "text/html");

  documento.querySelectorAll("script, style, iframe, object, embed").forEach((item) => {
    item.remove();
  });

  documento.body.querySelectorAll("*").forEach((elemento) => {
    [...elemento.attributes].forEach((atributo) => {
      const nome = atributo.name.toLowerCase();
      const valor = atributo.value.toLowerCase();

      if (nome.startsWith("on") || valor.includes("javascript:")) {
        elemento.removeAttribute(atributo.name);
      }
    });
  });

  return documento.body.innerHTML.trim();
}

function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(valor, maximo));
}

const NOTA_LARGURA_MINIMA = 300;
const NOTA_ALTURA_MINIMA = 360;
const NOTA_TOPO_SEGURO = 136;
const NOTA_ESQUERDA_DESKTOP = 300;

function dimensoesTela() {
  if (typeof window === "undefined") {
    return {
      largura: 1200,
      altura: 720,
    };
  }

  return {
    largura: window.innerWidth,
    altura: window.innerHeight,
  };
}

function limitesNota() {
  const { largura, altura } = dimensoesTela();

  return {
    esquerdaMinima: largura < 768 ? 8 : 16,
    topoMinimo: altura < 620 ? 56 : NOTA_TOPO_SEGURO,
    esquerdaMaxima: Math.max(8, largura - NOTA_LARGURA_MINIMA),
    topoMaximo: Math.max(56, altura - NOTA_ALTURA_MINIMA),
  };
}

function ajustarPosicaoNota(posicao) {
  const limites = limitesNota();

  return {
    left: `${limitar(
      posicao.posicao_x,
      limites.esquerdaMinima,
      limites.esquerdaMaxima
    )}px`,
    top: `${limitar(
      posicao.posicao_y,
      limites.topoMinimo,
      limites.topoMaximo
    )}px`,
  };
}

function posicaoInicial(nota, indice) {
  if (nota.posicao_x !== null && nota.posicao_y !== null) {
    return ajustarPosicaoNota({
      posicao_x: nota.posicao_x,
      posicao_y: nota.posicao_y,
    });
  }

  return ajustarPosicaoNota({
    posicao_x: NOTA_ESQUERDA_DESKTOP + (indice % 3) * 330,
    posicao_y: NOTA_TOPO_SEGURO + Math.floor(indice / 3) * 390,
  });
}

function calcularProximaPosicao(notasAtuais) {
  const notasAbertas = notasAtuais.filter((nota) => nota.aberta);
  const deslocamento = notasAbertas.length % 8;
  const limites = limitesNota();

  return {
    posicao_x: Math.round(
      limitar(
        NOTA_ESQUERDA_DESKTOP + deslocamento * 36,
        limites.esquerdaMinima,
        limites.esquerdaMaxima
      )
    ),
    posicao_y: Math.round(
      limitar(
        NOTA_TOPO_SEGURO + deslocamento * 36,
        limites.topoMinimo,
        limites.topoMaximo
      )
    ),
  };
}

const coresNota = [
  { id: "amarelo", label: "Amarelo" },
  { id: "azul", label: "Azul" },
  { id: "verde", label: "Verde" },
  { id: "rosa", label: "Rosa" },
  { id: "roxo", label: "Roxo" },
  { id: "cinza", label: "Cinza" },
];

function PinIcon() {
  return (
    <svg
      className="nota-pin-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7.6 3.8h8.8l1.1 4.9-3.1 2.9 2.1 6.2-4.5-2.1-4.5 2.1 2.1-6.2-3.1-2.9 1.1-4.9Z" />
      <path d="M12 15.7v5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      className="nota-menu-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="nota-search-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m21 21-4.3-4.3" />
      <circle cx="11" cy="11" r="7" />
    </svg>
  );
}

function textoDaNota(html) {
  const documento = new DOMParser().parseFromString(html || "", "text/html");
  return documento.body.textContent.trim();
}

function dataCurta(valor) {
  if (!valor) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(valor));
}

export default function NotasFlutuantes() {
  const [notas, setNotas] = useState([]);
  const [arrastando, setArrastando] = useState(null);
  const [arrastandoLista, setArrastandoLista] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [notaAtivaId, setNotaAtivaId] = useState(null);
  const [listaAberta, setListaAberta] = useState(false);
  const [listaBusca, setListaBusca] = useState("");
  const [listaPosicao, setListaPosicao] = useState({ x: 16, y: 16 });
  const editorAtivoRef = useRef(null);
  const selecaoAtivaRef = useRef(null);
  const notasRef = useRef([]);

  useEffect(() => {
    notasRef.current = notas;
  }, [notas]);

  async function carregarNotas() {
    try {
      const response = await api.get("/notas/");
      setNotas(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    carregarNotas();

    function atualizarNotas() {
      if (editorAtivoRef.current === document.activeElement) {
        return;
      }

      carregarNotas();
    }

    window.addEventListener("notas:atualizadas", atualizarNotas);

    return () => {
      window.removeEventListener("notas:atualizadas", atualizarNotas);
    };
  }, []);

  useEffect(() => {
    if (!arrastando) return undefined;

    function moverNota(e) {
      const limites = limitesNota();
      const novoX = limitar(
        e.clientX - arrastando.offsetX,
        limites.esquerdaMinima,
        limites.esquerdaMaxima
      );
      const novoY = limitar(
        e.clientY - arrastando.offsetY,
        limites.topoMinimo,
        limites.topoMaximo
      );

      setNotas((atuais) =>
        atuais.map((nota) =>
          nota.id === arrastando.id
            ? { ...nota, posicao_x: Math.round(novoX), posicao_y: Math.round(novoY) }
            : nota
        )
      );
    }

    async function soltarNota(e) {
      const limites = limitesNota();
      const posicao_x = Math.round(
        limitar(
          e.clientX - arrastando.offsetX,
          limites.esquerdaMinima,
          limites.esquerdaMaxima
        )
      );
      const posicao_y = Math.round(
        limitar(
          e.clientY - arrastando.offsetY,
          limites.topoMinimo,
          limites.topoMaximo
        )
      );

      setArrastando(null);

      try {
        await api.put(`/notas/${arrastando.id}`, {
          posicao_x,
          posicao_y,
        });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Erro ao salvar posição da nota."));
        console.error(error);
        carregarNotas();
      }
    }

    window.addEventListener("pointermove", moverNota);
    window.addEventListener("pointerup", soltarNota, { once: true });

    return () => {
      window.removeEventListener("pointermove", moverNota);
      window.removeEventListener("pointerup", soltarNota);
    };
  }, [arrastando]);

  useEffect(() => {
    if (!arrastandoLista) return undefined;

    function moverLista(e) {
      const novoX = limitar(e.clientX - arrastandoLista.offsetX, 0, window.innerWidth - 300);
      const novoY = limitar(e.clientY - arrastandoLista.offsetY, 0, window.innerHeight - 360);

      setListaPosicao({
        x: Math.round(novoX),
        y: Math.round(novoY),
      });
    }

    function soltarLista() {
      setArrastandoLista(null);
    }

    window.addEventListener("pointermove", moverLista);
    window.addEventListener("pointerup", soltarLista, { once: true });

    return () => {
      window.removeEventListener("pointermove", moverLista);
      window.removeEventListener("pointerup", soltarLista);
    };
  }, [arrastandoLista]);

  useEffect(() => {
    if (!menuAberto) return undefined;

    function fecharMenu() {
      setMenuAberto(null);
    }

    function fecharMenuComEsc(e) {
      if (e.key === "Escape") {
        setMenuAberto(null);
      }
    }

    window.addEventListener("pointerdown", fecharMenu);
    window.addEventListener("keydown", fecharMenuComEsc);

    return () => {
      window.removeEventListener("pointerdown", fecharMenu);
      window.removeEventListener("keydown", fecharMenuComEsc);
    };
  }, [menuAberto]);

  function iniciarArraste(e, nota) {
    if (e.button !== undefined && e.button !== 0) return;

    const cartao = e.currentTarget.closest("article");
    const retangulo = cartao.getBoundingClientRect();

    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setNotaAtivaId(nota.id);
    setArrastando({
      id: nota.id,
      offsetX: e.clientX - retangulo.left,
      offsetY: e.clientY - retangulo.top,
    });
  }

  function iniciarArrasteLista(e) {
    if (e.button !== undefined && e.button !== 0) return;

    const janela = e.currentTarget.closest("aside");
    const retangulo = janela.getBoundingClientRect();

    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setArrastandoLista({
      offsetX: e.clientX - retangulo.left,
      offsetY: e.clientY - retangulo.top,
    });
  }

  async function criarNota() {
    try {
      const posicao = calcularProximaPosicao(notasRef.current);
      const response = await api.post("/notas/", {
        titulo: "",
        conteudo: "",
        cor: "cinza",
        fixada: false,
        aberta: true,
        ...posicao,
      });

      setNotas((atuais) => [response.data, ...atuais]);
      setNotaAtivaId(response.data.id);
      window.dispatchEvent(new Event("notas:atualizadas"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao criar nota."));
      console.error(error);
    }
  }

  async function fecharNota(notaId) {
    setMenuAberto(null);

    setNotas((atuais) =>
      atuais.map((nota) =>
        nota.id === notaId ? { ...nota, aberta: false } : nota
      )
    );

    try {
      await api.put(`/notas/${notaId}`, {
        aberta: false,
      });
      window.dispatchEvent(new Event("notas:atualizadas"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao fechar nota."));
      console.error(error);
      carregarNotas();
    }
  }

  async function abrirNota(notaId, dadosExtras = {}) {
    setNotaAtivaId(notaId);
    setNotas((atuais) =>
      atuais.map((nota) =>
        nota.id === notaId ? { ...nota, ...dadosExtras, aberta: true } : nota
      )
    );
    setMenuAberto(null);

    try {
      await api.put(`/notas/${notaId}`, {
        aberta: true,
        ...dadosExtras,
      });
      window.dispatchEvent(new Event("notas:atualizadas"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao abrir nota."));
      console.error(error);
      carregarNotas();
    }
  }

  async function abrirNotasFixadas() {
    const idsFixadas = notas
      .filter((nota) => nota.fixada)
      .map((nota) => nota.id);

    if (idsFixadas.length === 0) {
      toast.error("Nenhuma nota fixada.");
      return;
    }

    setNotas((atuais) =>
      atuais.map((nota) =>
        idsFixadas.includes(nota.id) ? { ...nota, aberta: true } : nota
      )
    );
    setMenuAberto(null);

    try {
      await Promise.all(
        idsFixadas.map((notaId) =>
          api.put(`/notas/${notaId}`, {
            aberta: true,
          })
        )
      );
      window.dispatchEvent(new Event("notas:atualizadas"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao abrir notas fixadas."));
      console.error(error);
      carregarNotas();
    }
  }

  useEffect(() => {
    function criarNotaPelaSidebar() {
      criarNota();
    }

    function abrirFixadasPelaSidebar() {
      abrirNotasFixadas();
    }

    window.addEventListener("notas:criar", criarNotaPelaSidebar);
    window.addEventListener("notas:abrir-fixadas", abrirFixadasPelaSidebar);

    return () => {
      window.removeEventListener("notas:criar", criarNotaPelaSidebar);
      window.removeEventListener("notas:abrir-fixadas", abrirFixadasPelaSidebar);
    };
  }, [notas]);

  useEffect(() => {
    function reabrirNota(evento) {
      const nota = evento.detail?.nota;
      const notaId = evento.detail?.notaId || nota?.id;

      if (!notaId) return;

      const posicao =
        nota && (nota.posicao_x === null || nota.posicao_y === null)
          ? calcularProximaPosicao(notasRef.current)
          : {};

      if (nota) {
        setNotas((atuais) => [
          { ...nota, ...posicao, aberta: true },
          ...atuais.filter((item) => item.id !== notaId),
        ]);
      }

      setNotaAtivaId(notaId);
      abrirNota(notaId, posicao);
    }

    window.addEventListener("notas:reabrir", reabrirNota);

    return () => {
      window.removeEventListener("notas:reabrir", reabrirNota);
    };
  }, []);

  useEffect(() => {
    function removerNotaExcluida(evento) {
      const notaId = evento.detail?.notaId;
      const notaIds = evento.detail?.notaIds || (notaId ? [notaId] : []);

      if (notaIds.length === 0) return;

      setNotas((atuais) => atuais.filter((nota) => !notaIds.includes(nota.id)));
    }

    window.addEventListener("notas:excluida", removerNotaExcluida);

    return () => {
      window.removeEventListener("notas:excluida", removerNotaExcluida);
    };
  }, []);

  async function salvarConteudo(nota, html) {
    const conteudo = limparHtmlNota(html);

    setNotas((atuais) =>
      atuais.map((item) =>
        item.id === nota.id ? { ...item, conteudo } : item
      )
    );

    try {
      await api.put(`/notas/${nota.id}`, {
        conteudo,
      });
      window.dispatchEvent(new Event("notas:atualizadas"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao salvar nota."));
      console.error(error);
      carregarNotas();
    }
  }

  async function salvarConteudoSemRedesenhar(notaId, html) {
    const conteudo = limparHtmlNota(html);

    try {
      await api.put(`/notas/${notaId}`, {
        conteudo,
      });
      window.dispatchEvent(new Event("notas:atualizadas"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao salvar nota."));
      console.error(error);
    }
  }

  function atualizarTituloLocal(notaId, titulo) {
    setNotas((atuais) =>
      atuais.map((item) =>
        item.id === notaId ? { ...item, titulo } : item
      )
    );
  }

  async function salvarTitulo(nota, valor) {
    const titulo = valor.trim();

    try {
      await api.put(`/notas/${nota.id}`, {
        titulo,
      });
      window.dispatchEvent(new Event("notas:atualizadas"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao salvar tÃ­tulo da nota."));
      console.error(error);
      carregarNotas();
    }
  }

  async function alternarFixada(nota) {
    try {
      const response = await api.put(`/notas/${nota.id}`, {
        fixada: !nota.fixada,
      });

      setNotas((atuais) =>
        atuais.map((item) =>
          item.id === nota.id ? response.data : item
        )
      );
      window.dispatchEvent(new Event("notas:atualizadas"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao fixar nota."));
      console.error(error);
    }
  }

  async function alterarCor(nota, cor) {
    setNotas((atuais) =>
      atuais.map((item) =>
        item.id === nota.id ? { ...item, cor } : item
      )
    );

    try {
      const response = await api.put(`/notas/${nota.id}`, {
        cor,
      });

      setNotas((atuais) =>
        atuais.map((item) =>
          item.id === nota.id ? response.data : item
        )
      );
      window.dispatchEvent(new Event("notas:atualizadas"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao alterar cor da nota."));
      console.error(error);
      carregarNotas();
    }
  }

  function salvarSelecao(editor = editorAtivoRef.current) {
    const selecao = window.getSelection();

    if (!editor || !selecao || selecao.rangeCount === 0) return;

    const range = selecao.getRangeAt(0);

    if (!editor.contains(range.commonAncestorContainer)) return;

    editorAtivoRef.current = editor;
    selecaoAtivaRef.current = range.cloneRange();
  }

  function restaurarSelecao() {
    const selecao = window.getSelection();
    const range = selecaoAtivaRef.current;

    if (!selecao || !range || !editorAtivoRef.current) {
      editorAtivoRef.current?.focus();
      return;
    }

    editorAtivoRef.current.focus();
    selecao.removeAllRanges();
    selecao.addRange(range);
  }

  function executarComando(comando, valor = null) {
    restaurarSelecao();
    document.execCommand(comando, false, valor);
    salvarSelecao();

    const notaId = Number(editorAtivoRef.current?.dataset.notaId);

    if (notaId) {
      salvarConteudoSemRedesenhar(notaId, editorAtivoRef.current.innerHTML);
    }
  }

  function inserirImagem(e) {
    const arquivo = e.target.files?.[0];

    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onload = () => {
      executarComando("insertImage", leitor.result);
      e.target.value = "";
    };

    leitor.readAsDataURL(arquivo);
  }

  const notasVisiveis = notas.filter((nota) => nota.aberta);
  const termoLista = listaBusca.trim().toLowerCase();
  const notasFiltradas = notas.filter((nota) => {
    if (!termoLista) return true;

    return (
      (nota.titulo || "").toLowerCase().includes(termoLista) ||
      textoDaNota(nota.conteudo).toLowerCase().includes(termoLista)
    );
  });

  function janelaListaNotas() {
    if (!listaAberta) return null;

    return (
      <aside
        className={`nota-list-window fixed pointer-events-auto shadow-2xl ${
          arrastandoLista ? "scale-[1.01]" : ""
        }`}
        style={{
          left: `${listaPosicao.x}px`,
          top: `${listaPosicao.y}px`,
        }}
      >
        <div
          className="nota-list-window-topbar"
          onPointerDown={iniciarArrasteLista}
          title="Arrastar lista"
        >
          <button
            type="button"
            className="nota-window-action nota-window-plus"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={criarNota}
            title="Nova nota"
          >
            +
          </button>
          <div className="flex-1" />
          <button
            type="button"
            className="nota-window-action"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setListaAberta(false)}
            title="Fechar lista"
          >
            X
          </button>
        </div>

        <div className="nota-list-window-body">
          <h2>Notas Autoadesivas</h2>

          <label className="nota-list-search">
            <input
              value={listaBusca}
              onChange={(e) => setListaBusca(e.target.value)}
              placeholder="Pesquisar..."
            />
            <SearchIcon />
          </label>

          <div className="nota-list-items">
            {notasFiltradas.length === 0 ? (
              <p className="nota-list-empty">Nenhuma nota encontrada.</p>
            ) : (
              notasFiltradas.map((nota) => {
                const resumo = textoDaNota(nota.conteudo) || "Escreva uma anotação...";

                return (
                  <button
                    type="button"
                    key={nota.id}
                    className={`nota-list-item nota-list-item-${nota.cor || "cinza"}`}
                    onClick={() => abrirNota(nota.id)}
                  >
                    <span className="nota-list-item-date">
                      {dataCurta(nota.atualizado_em || nota.criado_em)}
                    </span>
                    <strong>{nota.titulo || "Sem título"}</strong>
                    <span>{resumo}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </aside>
    );
  }

  if (notasVisiveis.length === 0) {
    return (
      <div className="notas-flutuantes fixed inset-0 pointer-events-none">
        {janelaListaNotas()}
      </div>
    );
  }

  return (
    <div className="notas-flutuantes fixed inset-0 pointer-events-none">
      {janelaListaNotas()}
      {notasVisiveis.map((nota, indice) => (
        <article
          key={nota.id}
          className={`nota-window nota-window-cor-${nota.cor || "cinza"} fixed pointer-events-auto shadow-2xl ${
            arrastando?.id === nota.id ? "scale-[1.01]" : ""
          }`}
          style={{
            ...posicaoInicial(nota, indice),
            zIndex:
              arrastando?.id === nota.id
                ? 105
                : notaAtivaId === nota.id
                  ? 95
                  : 70 + indice,
          }}
          onPointerDown={() => setNotaAtivaId(nota.id)}
        >
          <div
            className="nota-window-topbar"
            onPointerDown={(e) => iniciarArraste(e, nota)}
            title="Arrastar nota"
          >
            <button
              type="button"
              className="nota-window-action nota-window-plus"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={criarNota}
              title="Nova nota"
            >
              +
            </button>

            <button
              type="button"
              className="nota-window-action"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={abrirNotasFixadas}
              title="Abrir notas fixadas"
            >
              <PinIcon />
            </button>

            <div className="flex-1" />

            <button
              type="button"
              className="nota-window-action"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => setMenuAberto(menuAberto === nota.id ? null : nota.id)}
              title="Opções"
            >
              ...
            </button>

            {menuAberto === nota.id && (
              <div
                className="nota-window-menu"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <p className="nota-window-menu-title">Abrir nota</p>

                {notas.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="nota-window-menu-item"
                    onClick={() => abrirNota(item.id)}
                  >
                    <span className="truncate">
                      {item.titulo || "Sem título"}
                    </span>
                    <span className="nota-window-menu-status">
                      {item.aberta ? "Aberta" : "Fechada"}
                    </span>
                  </button>
                ))}

                <p className="nota-window-menu-title nota-window-menu-section">
                  Cor da nota
                </p>

                <div className="nota-window-color-grid">
                  {coresNota.map((cor) => (
                    <button
                      type="button"
                      key={cor.id}
                      className={`nota-window-color-option nota-color-${cor.id} ${
                        nota.cor === cor.id ? "nota-window-color-option-active" : ""
                      }`}
                      onClick={() => alterarCor(nota, cor.id)}
                      title={cor.label}
                      aria-label={`Alterar cor para ${cor.label}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="nota-window-menu-command"
                  onClick={() => {
                    setListaAberta(true);
                    setMenuAberto(null);
                  }}
                >
                  <ListIcon />
                  <span>Lista de anotações</span>
                </button>
              </div>
            )}

            <button
              type="button"
              className="nota-window-action"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => fecharNota(nota.id)}
              title="Fechar"
            >
              X
            </button>
          </div>

          <input
            className="nota-window-title-input"
            value={nota.titulo || ""}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => atualizarTituloLocal(nota.id, e.target.value)}
            onBlur={(e) => salvarTitulo(nota, e.currentTarget.value)}
            placeholder="TÃ­tulo"
            aria-label="TÃ­tulo da nota"
          />

          <div
            className="nota-window-editor"
            contentEditable
            data-placeholder="Escrever uma anotação..."
            data-nota-id={nota.id}
            suppressContentEditableWarning
            onFocus={(e) => {
              editorAtivoRef.current = e.currentTarget;
              salvarSelecao(e.currentTarget);
            }}
            onInput={(e) => salvarSelecao(e.currentTarget)}
            onKeyUp={(e) => salvarSelecao(e.currentTarget)}
            onMouseUp={(e) => salvarSelecao(e.currentTarget)}
            onBlur={(e) => salvarConteudo(nota, e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{
              __html: limparHtmlNota(nota.conteudo),
            }}
          />

          <div className="nota-window-toolbar">
            <button
              type="button"
              className={`nota-toolbar-button ${nota.fixada ? "nota-toolbar-button-active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => alternarFixada(nota)}
              title={nota.fixada ? "Desfixar" : "Fixar"}
            >
              <PinIcon />
            </button>
            <button
              type="button"
              className="nota-toolbar-button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executarComando("bold")}
              title="Negrito"
            >
              B
            </button>
            <button
              type="button"
              className="nota-toolbar-button italic"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executarComando("italic")}
              title="Itálico"
            >
              I
            </button>
            <button
              type="button"
              className="nota-toolbar-button underline"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executarComando("underline")}
              title="Sublinhado"
            >
              U
            </button>
            <button
              type="button"
              className="nota-toolbar-button line-through"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executarComando("strikeThrough")}
              title="Tachado"
            >
              ab
            </button>
            <button
              type="button"
              className="nota-toolbar-button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executarComando("insertUnorderedList")}
              title="Lista"
            >
              =
            </button>
            <label
              className="nota-toolbar-button"
              title="Imagem"
              onMouseDown={(e) => e.preventDefault()}
            >
              []
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onClick={(e) => e.stopPropagation()}
                onChange={inserirImagem}
              />
            </label>
          </div>
        </article>
      ))}
    </div>
  );
}
