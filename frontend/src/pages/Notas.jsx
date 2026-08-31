import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getApiErrorMessage } from "../services/utils/errors";

const notaInicial = {
  titulo: "",
  conteudo: "",
  cor: "amarelo",
  fixada: false,
};

const cores = [
  { id: "amarelo", label: "Amarelo" },
  { id: "azul", label: "Azul" },
  { id: "verde", label: "Verde" },
  { id: "rosa", label: "Rosa" },
  { id: "roxo", label: "Roxo" },
  { id: "cinza", label: "Cinza" },
];

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

function textoNotaVazio(html) {
  const documento = new DOMParser().parseFromString(html || "", "text/html");
  return !documento.body.textContent.trim() && !documento.body.querySelector("img");
}

function TrashIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 15h10l1-15" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export default function Notas() {
  const location = useLocation();
  const navigate = useNavigate();
  const [notas, setNotas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState(notaInicial);
  const [notaEditando, setNotaEditando] = useState(null);
  const [notasSelecionadas, setNotasSelecionadas] = useState([]);
  const editorRef = useRef(null);
  const imagemRef = useRef(null);
  const todasSelecionadas = notas.length > 0 && notasSelecionadas.length === notas.length;

  async function carregarNotas() {
    setCarregando(true);

    try {
      const response = await api.get("/notas/");
      setNotas(response.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao carregar notas."));
      console.error(error);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarNotas();

    function atualizarNotas() {
      carregarNotas();
    }

    window.addEventListener("notas:atualizadas", atualizarNotas);

    return () => {
      window.removeEventListener("notas:atualizadas", atualizarNotas);
    };
  }, []);

  useEffect(() => {
    const nota = location.state?.notaParaEditar;

    if (!nota) return;

    setNotaEditando(nota);
    setForm({
      titulo: nota.titulo || "",
      conteudo: nota.conteudo || "",
      cor: nota.cor || "amarelo",
      fixada: nota.fixada,
    });

    if (editorRef.current) {
      editorRef.current.innerHTML = limparHtmlNota(nota.conteudo || "");
    }

    navigate("/notas", { replace: true, state: null });
  }, [location.state, navigate]);

  function atualizarCampo(e) {
    const { name, value, checked, type } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  function atualizarConteudoEditor() {
    setForm((atual) => ({
      ...atual,
      conteudo: limparHtmlNota(editorRef.current?.innerHTML || ""),
    }));
  }

  function executarComando(comando, valor = null) {
    editorRef.current?.focus();
    document.execCommand(comando, false, valor);
    atualizarConteudoEditor();
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

  function limparForm() {
    setForm(notaInicial);
    setNotaEditando(null);

    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  }

  async function salvarNota(e) {
    e.preventDefault();

    const conteudoLimpo = limparHtmlNota(editorRef.current?.innerHTML || form.conteudo);
    const dados = {
      ...form,
      conteudo: conteudoLimpo,
    };

    if (!form.titulo.trim() && textoNotaVazio(conteudoLimpo)) {
      toast.error("Preencha o título ou o conteúdo da nota.");
      return;
    }

    try {
      if (notaEditando) {
        await api.put(`/notas/${notaEditando.id}`, dados);
        toast.success("Nota atualizada com sucesso!");
      } else {
        const response = await api.post("/notas/", {
          ...dados,
          aberta: true,
        });
        toast.success("Nota criada com sucesso!");

        window.dispatchEvent(new CustomEvent("notas:reabrir", {
          detail: { nota: response.data, notaId: response.data.id },
        }));
      }

      limparForm();
      window.dispatchEvent(new Event("notas:atualizadas"));
      carregarNotas();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao salvar nota."));
      console.error(error);
    }
  }

  function reabrirNota(nota) {
    window.dispatchEvent(new CustomEvent("notas:reabrir", {
      detail: { notaId: nota.id },
    }));
  }

  function alternarNotaSelecionada(notaId) {
    setNotasSelecionadas((atuais) =>
      atuais.includes(notaId)
        ? atuais.filter((id) => id !== notaId)
        : [...atuais, notaId]
    );
  }

  function alternarTodasSelecionadas() {
    setNotasSelecionadas(todasSelecionadas ? [] : notas.map((nota) => nota.id));
  }

  async function excluirNotasPorIds(idsParaExcluir, mensagemConfirmacao) {
    if (idsParaExcluir.length === 0) return;

    const confirmou = window.confirm(mensagemConfirmacao);

    if (!confirmou) return;

    try {
      await Promise.all(
        idsParaExcluir.map((notaId) => api.delete(`/notas/${notaId}`))
      );
      setNotas((atuais) => atuais.filter((nota) => !idsParaExcluir.includes(nota.id)));
      setNotasSelecionadas((atuais) =>
        atuais.filter((notaId) => !idsParaExcluir.includes(notaId))
      );
      toast.success(
        idsParaExcluir.length === 1
          ? "Nota excluída com sucesso!"
          : "Notas excluídas com sucesso!"
      );
      window.dispatchEvent(new CustomEvent("notas:excluida", {
        detail: { notaIds: idsParaExcluir },
      }));
      window.dispatchEvent(new Event("notas:atualizadas"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao excluir notas."));
      console.error(error);
      carregarNotas();
    }
  }

  async function excluirNota(nota) {
    await excluirNotasPorIds(
      [nota.id],
      `Excluir a nota "${nota.titulo || "Sem título"}"?`
    );
  }

  async function excluirNotasSelecionadas() {
    await excluirNotasPorIds(
      [...notasSelecionadas],
      `Excluir ${notasSelecionadas.length} nota(s) selecionada(s)?`
    );
  }

  async function excluirPeloBotaoDoCard(nota) {
    if (notasSelecionadas.length > 0) {
      await excluirNotasSelecionadas();
      return;
    }

    await excluirNota(nota);
  }

  return (
    <div>
      <div>
        <h2 className="text-3xl md:text-4xl font-bold">Notas</h2>
        <p className="mt-2 text-zinc-500">Notas adesivas do usuário logado</p>
      </div>

      <form
        onSubmit={salvarNota}
        className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr_auto] gap-4 items-start"
      >
        <div className="space-y-3">
          <input
            className="input"
            name="titulo"
            value={form.titulo}
            onChange={atualizarCampo}
            placeholder="Título"
          />

          <select
            className="input"
            name="cor"
            value={form.cor}
            onChange={atualizarCampo}
          >
            {cores.map((cor) => (
              <option key={cor.id} value={cor.id}>
                {cor.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800">
          <div className="flex items-center gap-1 border-b border-zinc-700 bg-zinc-900/70 px-2 py-2">
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
            <button
              type="button"
              className="nota-toolbar-button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => imagemRef.current?.click()}
              title="Imagem"
            >
              []
            </button>
            <input
              ref={imagemRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={inserirImagem}
            />
          </div>

          <div
            ref={editorRef}
            className="nota-editor min-h-28 px-4 py-3 text-white outline-none"
            contentEditable
            suppressContentEditableWarning
            onInput={atualizarConteudoEditor}
            data-placeholder="Conteúdo"
          />
        </div>

        <div className="flex flex-col gap-3 min-w-40">
          <label className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3">
            <input
              type="checkbox"
              name="fixada"
              checked={form.fixada}
              onChange={atualizarCampo}
            />
            Fixada
          </label>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold transition"
          >
            {notaEditando ? "Atualizar" : "Nova nota"}
          </button>

          {notaEditando && (
            <button
              type="button"
              onClick={limparForm}
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl font-semibold transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <section className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Notas salvas</h3>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {notas.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={todasSelecionadas}
                  onChange={alternarTodasSelecionadas}
                />
                Selecionar todas
              </label>
            )}
            {notasSelecionadas.length > 0 && (
              <button
                type="button"
                onClick={excluirNotasSelecionadas}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 p-2 text-white transition hover:bg-red-700"
                title="Excluir selecionadas"
                aria-label="Excluir selecionadas"
              >
                <TrashIcon />
              </button>
            )}
            <span className="text-sm text-zinc-400">
              {notas.length} nota(s)
            </span>
          </div>
        </div>

        {carregando ? (
          <p className="mt-5 text-zinc-400">Carregando notas...</p>
        ) : notas.length === 0 ? (
          <p className="mt-5 text-zinc-400">Nenhuma nota salva.</p>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {notas.map((nota) => (
              <div
                key={nota.id}
                className={`bg-zinc-800 border rounded-xl p-4 ${
                  notasSelecionadas.includes(nota.id)
                    ? "border-red-500/70"
                    : "border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={notasSelecionadas.includes(nota.id)}
                      onChange={() => alternarNotaSelecionada(nota.id)}
                      className="mt-1"
                      aria-label={`Selecionar nota ${nota.titulo || "Sem título"}`}
                    />
                    <div className="min-w-0">
                      <strong className="break-words">
                        {nota.titulo || "Sem título"}
                      </strong>
                      {nota.fixada && (
                        <span className="mt-2 inline-flex rounded-full bg-yellow-400/15 px-2 py-1 text-xs font-semibold text-yellow-300">
                          Fixada
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => reabrirNota(nota)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Abrir
                    </button>
                    <button
                      type="button"
                      onClick={() => excluirPeloBotaoDoCard(nota)}
                      className="inline-flex items-center justify-center rounded-lg bg-red-600 p-2 text-white transition hover:bg-red-700"
                      title={notasSelecionadas.length > 0 ? "Excluir selecionadas" : "Excluir nota"}
                      aria-label={notasSelecionadas.length > 0 ? "Excluir selecionadas" : "Excluir nota"}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <div
                  className="nota-lista-conteudo mt-3 text-sm text-zinc-400 line-clamp-3"
                  dangerouslySetInnerHTML={{
                    __html: limparHtmlNota(nota.conteudo) || "Sem conteúdo",
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
