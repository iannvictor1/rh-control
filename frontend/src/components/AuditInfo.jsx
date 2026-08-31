import { formatarDataHora } from "../services/utils/formatters";

function nomeUsuario(usuario, id) {
  if (usuario?.nome) return usuario.nome;
  if (id) return `usuário #${id}`;
  return "sistema";
}

function foiAtualizado(registro) {
  if (!registro?.criado_em || !registro?.atualizado_em) return false;

  const criado = new Date(registro.criado_em).getTime();
  const atualizado = new Date(registro.atualizado_em).getTime();

  if (Number.isNaN(criado) || Number.isNaN(atualizado)) return false;

  return atualizado - criado > 2000;
}

export default function AuditInfo({ registro, compacto = false }) {
  if (!registro?.criado_em && !registro?.atualizado_em) return null;

  const criadoPor = nomeUsuario(registro.criado_por, registro.criado_por_id);
  const atualizadoPor = nomeUsuario(
    registro.atualizado_por,
    registro.atualizado_por_id,
  );
  const mostrarAtualizacao = foiAtualizado(registro);

  return (
    <div
      className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 text-zinc-500 ${
        compacto ? "text-xs" : "text-sm"
      }`}
    >
      {registro.criado_em && (
        <span>
          Criado por {criadoPor} em {formatarDataHora(registro.criado_em)}
        </span>
      )}

      {mostrarAtualizacao && (
        <span>
          Atualizado por {atualizadoPor} em{" "}
          {formatarDataHora(registro.atualizado_em)}
        </span>
      )}
    </div>
  );
}
