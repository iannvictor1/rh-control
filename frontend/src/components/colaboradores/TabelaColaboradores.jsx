import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ActionMenu from "../ActionMenu";
import { formatarMoeda } from "../../services/utils/formatters";

function formatarData(data) {
  if (!data) return "Não informado";

  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

function statusAso(colaborador) {
  if (!colaborador.data_aso) {
    return {
      texto: "ASO não informado",
      classe: "bg-zinc-700/60 text-zinc-300",
    };
  }

  const vencimento = colaborador.vencimento_aso || (() => {
    const data = new Date(`${colaborador.data_aso}T00:00:00`);
    data.setFullYear(data.getFullYear() + 1);
    return data.toISOString().slice(0, 10);
  })();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataVencimento = new Date(`${vencimento}T00:00:00`);
  const diasRestantes = Math.ceil(
    (dataVencimento - hoje) / (1000 * 60 * 60 * 24)
  );

  if (diasRestantes < 0) {
    return {
      texto: `Vencido em ${formatarData(vencimento)}`,
      classe: "bg-red-500/20 text-red-400",
    };
  }

  if (diasRestantes <= 30) {
    return {
      texto: `Vence em ${diasRestantes} dia(s)`,
      classe: "bg-yellow-500/20 text-yellow-300",
    };
  }

  return {
    texto: `Válido até ${formatarData(vencimento)}`,
    classe: "bg-cyan-500/20 text-cyan-300",
  };
}

export default function TabelaColaboradores({
  colaboradores,
  abrirEdicao,
  inativarColaborador,
  ativarColaborador,
  podeGerenciar = true,
  carregando = false,
}) {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(null);

  function montarAcoes(colaborador) {
    const actions = [
      {
        label: "Histórico",
        onClick: () => navigate(`/colaboradores/${colaborador.id}`),
      },
    ];

    if (podeGerenciar) {
      actions.push({
        label: "Editar",
        onClick: () => abrirEdicao(colaborador),
      });

      actions.push({
        label: colaborador.ativo ? "Inativar" : "Ativar",
        onClick: () => {
          if (colaborador.ativo) {
            inativarColaborador(colaborador);
            return;
          }

          ativarColaborador(colaborador.id);
        },
      });
    }

    return actions;
  }

  return (
    <div className="mt-10 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
      <table className="w-full">
        <thead className="bg-zinc-800">
          <tr>
            <th className="text-left p-4">Nome</th>
            <th className="text-left p-4">Empresa</th>
            <th className="text-left p-4">Matrícula</th>
            <th className="text-left p-4">Cargo/Setor</th>
            <th className="text-left p-4">Salário</th>
            <th className="text-left p-4">Bonificação</th>
            <th className="text-left p-4">CPF</th>
            <th className="text-left p-4">Telefone</th>
            <th className="text-left p-4">ASO</th>
            <th className="text-left p-4">Status</th>
            <th className="text-left p-4">Ações</th>
          </tr>
        </thead>

        <tbody>
          {carregando && (
            <tr className="border-t border-zinc-800">
              <td className="p-6 text-center text-zinc-400" colSpan={11}>
                Carregando colaboradores...
              </td>
            </tr>
          )}

          {!carregando && colaboradores.length === 0 && (
            <tr className="border-t border-zinc-800">
              <td className="p-6 text-center text-zinc-400" colSpan={11}>
                Nenhum colaborador encontrado.
              </td>
            </tr>
          )}

          {!carregando && colaboradores.map((colaborador) => {
            const aso = statusAso(colaborador);

            return (
              <tr key={colaborador.id} className="border-t border-zinc-800">
                <td className="p-4">{colaborador.nome}</td>
                <td className="p-4">{colaborador.empresa || "-"}</td>
                <td className="p-4">{colaborador.matricula || "-"}</td>
                <td className="p-4">
                  <div>{colaborador.cargo || "-"}</div>
                  <div className="text-sm text-zinc-500">
                    {colaborador.setor || "-"}
                  </div>
                </td>
                <td className="p-4 whitespace-nowrap">
                  {formatarMoeda(colaborador.salario)}
                </td>
                <td className="p-4 whitespace-nowrap">
                  <div>{colaborador.tipo_bonificacao || "-"}</div>
                  <div className="text-sm text-zinc-500">
                    {formatarMoeda(colaborador.bonificacao)}
                  </div>
                </td>
                <td className="p-4">{colaborador.cpf || "-"}</td>
                <td className="p-4">{colaborador.telefone || "-"}</td>

                <td className="p-4">
                  <span className={`${aso.classe} px-3 py-1 rounded-full text-sm whitespace-nowrap`}>
                    {aso.texto}
                  </span>
                </td>

                <td className="p-4">
                  {colaborador.ativo ? (
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                      Ativo
                    </span>
                  ) : (
                    <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                      Inativo
                    </span>
                  )}
                </td>

                <td className="p-4">
                  <ActionMenu
                    aberto={menuAberto === colaborador.id}
                    onClose={() => setMenuAberto(null)}
                    onToggle={() =>
                      setMenuAberto(
                        menuAberto === colaborador.id ? null : colaborador.id
                      )
                    }
                    actions={montarAcoes(colaborador)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
