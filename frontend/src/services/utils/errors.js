const FIELD_LABELS = {
  empresa: "Empresa",
  salario: "Salário",
  tipo_bonificacao: "Tipo de bonificação",
  bonificacao: "Bonificação",
  data_nascimento: "Data de nascimento",
  data_admissao: "Data de admissão",
  data_desligamento: "Data de desligamento",
  motivo_desligamento: "Motivo do desligamento",
  data_aso: "Data do ASO",
  data_falta: "Data da falta",
  data_advertencia: "Data da advertência",
  data_inicio: "Data de início",
  data_atestado: "Data do atestado",
  email: "E-mail",
  cpf: "CPF",
};

function limparMensagemValidacao(mensagem) {
  return mensagem
    ?.replace(/^Value error,\s*/i, "")
    .replace(/^Input should be a valid date.*$/i, "Data inválida")
    .trim();
}

function obterLabelCampo(item) {
  const loc = Array.isArray(item.loc) ? item.loc : [];
  const campo = [...loc].reverse().find((parte) => typeof parte === "string");

  return FIELD_LABELS[campo] || campo;
}

export function getApiErrorMessage(error, fallback = "Erro ao processar solicitação.") {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const mensagem = limparMensagemValidacao(item.msg || item.message);
        const campo = obterLabelCampo(item);

        return campo && mensagem ? `${campo}: ${mensagem}` : mensagem;
      })
      .filter(Boolean)
      .join(" ");
  }

  return fallback;
}
