import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ActionMenu from "../components/ActionMenu";
import AuditInfo from "../components/AuditInfo";
import ConfirmDialog from "../components/ConfirmDialog";
import FiltrosOcorrencias from "../components/FiltrosOcorrencias";
import FormOcorrencia from "../components/FormOcorrencia";
import Paginacao from "../components/Paginacao";
import useBuscaPaginada from "../hooks/useBuscaPaginada";
import api from "../services/api";
import { canManageRh } from "../services/utils/auth";
import { getApiErrorMessage } from "../services/utils/errors";
import { formatarData } from "../services/utils/formatters";

const formInicial = {
  colaborador_id: "",
  data_atestado: "",
  cid: "",
  dias: "",
  observacao: "",
};

export default function Atestados() {
  const [colaboradores, setColaboradores] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [atestadoParaExcluir, setAtestadoParaExcluir] = useState(null);
  const [anexo, setAnexo] = useState(null);
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const podeGerenciar = canManageRh();
  const hoje = new Date().toISOString().slice(0, 10);

  const filtros = useMemo(() => ({
    q: busca,
    data_inicio: dataInicio,
    data_fim: dataFim,
  }), [busca, dataInicio, dataFim]);

  const {
    items: atestados,
    total,
    pagina,
    setPagina,
    carregando,
    limitePorPagina,
    carregar: carregarAtestados,
    atualizarFiltro,
  } = useBuscaPaginada({
    endpoint: "/atestados/busca",
    filtros,
    mensagemErro: "Erro ao carregar atestados.",
  });

  useEffect(() => {
    async function carregarColaboradores() {
      try {
        const response = await api.get("/colaboradores/opcoes", {
          params: { ativo: true },
        });
        setColaboradores(response.data);
      } catch (error) {
        toast.error("Erro ao carregar colaboradores.");
        console.error(error);
      }
    }

    carregarColaboradores();
  }, []);

  function atualizarCampo(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function buscarNomeColaborador(registro) {
    return registro.colaborador?.nome || "Colaborador não encontrado";
  }

  function editarAtestado(atestado) {
    setEditando(atestado);
    setMenuAberto(null);
    setForm({
      colaborador_id: String(atestado.colaborador_id),
      data_atestado: atestado.data_atestado || "",
      cid: atestado.cid || "",
      dias: String(atestado.dias || ""),
      observacao: atestado.observacao || "",
    });
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(formInicial);
    setAnexo(null);
  }

  async function enviarAnexo(atestadoId) {
    if (!anexo) return;

    const formData = new FormData();
    formData.append("arquivo", anexo);

    await api.post(`/atestados/${atestadoId}/anexos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async function salvarAtestado(e) {
    e.preventDefault();

    const dados = {
      colaborador_id: Number(form.colaborador_id),
      data_atestado: form.data_atestado,
      cid: form.cid || null,
      dias: Number(form.dias),
      observacao: form.observacao || null,
    };

    try {
      let response;

      if (editando) {
        response = await api.put(`/atestados/${editando.id}`, dados);
      } else {
        response = await api.post("/atestados/", dados);
      }

      if (anexo) {
        try {
          await enviarAnexo(response.data.id);

          toast.success(
            editando
              ? "Atestado médico atualizado!"
              : "Atestado médico registrado!"
          );
        } catch (error) {
          toast.error("Atestado salvo, mas houve erro ao enviar o anexo.");
          console.error(error);
        }
      } else {
        toast.success(
          editando
            ? "Atestado médico atualizado!"
            : "Atestado médico registrado!"
        );
      }

      cancelarEdicao();
      carregarAtestados();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao salvar atestado."));
      console.error(error);
    }
  }

  function excluirAtestado(atestado) {
    setMenuAberto(null);
    setAtestadoParaExcluir(atestado);
  }

  async function confirmarExclusao() {
    if (!atestadoParaExcluir) return;

    try {
      await api.delete(`/atestados/${atestadoParaExcluir.id}`);
      toast.success("Atestado médico excluído!");

      if (editando?.id === atestadoParaExcluir.id) {
        cancelarEdicao();
      }

      setAtestadoParaExcluir(null);
      carregarAtestados();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao excluir atestado."));
      console.error(error);
    }
  }

  async function baixarAnexo(anexoAtestado) {
    try {
      const response = await api.get(
        `/atestados/anexos/${anexoAtestado.id}/download`,
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = anexoAtestado.nome_original;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao baixar anexo."));
      console.error(error);
    }
  }

  async function excluirAnexo(anexoAtestado) {
    try {
      await api.delete(`/atestados/anexos/${anexoAtestado.id}`);
      toast.success("Anexo removido!");
      carregarAtestados();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao remover anexo."));
      console.error(error);
    }
  }

  return (
    <>
      <h2 className="text-4xl font-bold">Atestados médicos</h2>

      {podeGerenciar && (
        <>
        <FormOcorrencia
          form={form}
          editando={editando}
          colaboradores={colaboradores}
          hoje={hoje}
          onChange={atualizarCampo}
          onSubmit={salvarAtestado}
          onCancel={cancelarEdicao}
          extraContent={
            <div className="md:col-span-5">
              <label className="text-sm text-zinc-400 mb-2 block">
                Anexo do atestado
              </label>
              <input
                className="input w-full"
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => setAnexo(e.target.files?.[0] || null)}
              />
              <p className="mt-2 text-sm text-zinc-500">
                PDF ou imagem, até 10 MB.
              </p>
            </div>
          }
          campos={[
            {
              name: "data_atestado",
              label: "Data",
              type: "date",
              required: true,
            },
            {
              name: "cid",
              label: "CID",
              placeholder: "Opcional",
            },
            {
              name: "dias",
              label: "Dias",
              type: "number",
              min: "1",
              required: true,
            },
            {
              name: "observacao",
              label: "Observação",
              placeholder: "Opcional",
              className: "md:col-span-5",
            },
          ]}
        />
        </>
      )}

      <FiltrosOcorrencias
        busca={busca}
        placeholderBusca="Buscar por colaborador, CID ou observação"
        dataInicio={dataInicio}
        dataFim={dataFim}
        hoje={hoje}
        onBuscaChange={atualizarFiltro(setBusca)}
        onDataInicioChange={atualizarFiltro(setDataInicio)}
        onDataFimChange={atualizarFiltro(setDataFim)}
      />

      <div className="mt-10 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Colaborador</th>
              <th className="text-left p-4">Data</th>
              <th className="text-left p-4">CID</th>
              <th className="text-left p-4">Dias</th>
              <th className="text-left p-4">Observação</th>
              <th className="text-left p-4">Anexos</th>
              {podeGerenciar && <th className="text-left p-4">Ações</th>}
            </tr>
          </thead>

          <tbody>
            {carregando && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 7 : 6}>
                  Carregando atestados...
                </td>
              </tr>
            )}

            {!carregando && atestados.length === 0 && (
              <tr className="border-t border-zinc-800">
                <td className="p-6 text-center text-zinc-400" colSpan={podeGerenciar ? 7 : 6}>
                  Nenhum atestado registrado.
                </td>
              </tr>
            )}

            {!carregando && atestados.map((atestado) => (
              <tr key={atestado.id} className="border-t border-zinc-800">
                <td className="p-4">
                  {buscarNomeColaborador(atestado)}
                  <AuditInfo registro={atestado} compacto />
                </td>

                <td className="p-4">{formatarData(atestado.data_atestado)}</td>
                <td className="p-4">{atestado.cid || "-"}</td>
                <td className="p-4">{atestado.dias} dia(s)</td>

                <td className="p-4">
                  {atestado.observacao || "Sem observação"}
                </td>

                <td className="p-4">
                  {atestado.anexos?.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {atestado.anexos.map((item) => (
                        <div key={item.id} className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="text-blue-400 hover:text-blue-300 text-left"
                            onClick={() => baixarAnexo(item)}
                          >
                            {item.nome_original}
                          </button>

                          {podeGerenciar && (
                            <button
                              type="button"
                              className="text-red-400 hover:text-red-300 text-sm"
                              onClick={() => excluirAnexo(item)}
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-zinc-500">Sem anexo</span>
                  )}
                </td>

                {podeGerenciar && (
                  <td className="p-4">
                    <ActionMenu
                      aberto={menuAberto === atestado.id}
                      onClose={() => setMenuAberto(null)}
                      onToggle={() =>
                        setMenuAberto(
                          menuAberto === atestado.id ? null : atestado.id
                        )
                      }
                      onEditar={() => editarAtestado(atestado)}
                      onExcluir={() => excluirAtestado(atestado)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginacao
        total={total}
        pagina={pagina}
        limitePorPagina={limitePorPagina}
        onPaginaChange={setPagina}
        textoTotal={`${total} atestado(s) encontrado(s)`}
      />

      <ConfirmDialog
        aberto={Boolean(atestadoParaExcluir)}
        titulo="Excluir atestado"
        mensagem="Esta ação remove o atestado médico do histórico."
        onCancelar={() => setAtestadoParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </>
  );
}
