import { formatarData } from "./formatters";

export const modelosAdvertencia = [
  { value: "falta_injustificada", label: "Falta injustificada" },
  { value: "abandono_posto", label: "Abandono de posto" },
  { value: "insubordinacao_ma_conduta", label: "Insubordinação e má conduta" },
  { value: "outro", label: "Outro" },
];

export const modelosSuspensao = [
  { value: "falta_injustificada", label: "Falta injustificada" },
  { value: "abandono_posto", label: "Abandono de posto" },
  { value: "insubordinacao_ma_conduta", label: "Insubordinação e má conduta" },
  { value: "outro", label: "Outro" },
];

export function labelModelo(lista, value) {
  return lista.find((item) => item.value === value)?.label || value || "-";
}

export function labelModeloRegistro(lista, detalhes) {
  if (detalhes?.modelo === "outro" && detalhes.modelo_outro) {
    return detalhes.modelo_outro;
  }

  return labelModelo(lista, detalhes?.modelo);
}

export function dataRetorno(dataInicio, dias) {
  if (!dataInicio || !dias) return "";

  const data = new Date(`${dataInicio}T00:00:00`);
  data.setDate(data.getDate() + Number(dias));

  return data.toISOString().slice(0, 10);
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function texto(valor, fallback = "______________________________") {
  const limpo = String(valor ?? "").trim();
  return escapeHtml(limpo || fallback);
}

function dadosColaborador(registro, colaboradores) {
  const completo =
    colaboradores.find((colaborador) => colaborador.id === Number(registro.colaborador_id)) ||
    {};

  return {
    ...completo,
    ...(registro.colaborador || {}),
    cargo: registro.colaborador?.cargo || completo.cargo,
    setor: registro.colaborador?.setor || completo.setor,
  };
}

function blocoAssinaturas() {
  return `
    <p class="assinatura">Atenciosamente,</p>
    <p>Setor ____________________</p>
    <p class="ciente">Ciente do(a) colaborador(a): _______ /________/________</p>
    <p class="linha">Assinatura do colaborador</p>
    <p class="testemunhas">TESTEMUNHAS:</p>
    <div class="duas-linhas">
      <span>________________________________</span>
      <span>________________________________</span>
    </div>
  `;
}

function corpoAdvertencia(registro) {
  const detalhes = registro.detalhes || {};
  const modelo = detalhes.modelo;
  const diasOcorrencia = texto(detalhes.dias_ocorrencia);

  if (modelo === "outro") {
    return `
      <p>Informamos que no(s) dia(s) ${diasOcorrencia}, foi registrada a seguinte ocorrência disciplinar: ${texto(registro.motivo)}.</p>
      <p>A presente advertência fica registrada como orientação e alerta quanto ao cumprimento das normas internas da empresa, das obrigações contratuais e da postura profissional esperada no ambiente de trabalho.</p>
    `;
  }

  if (modelo === "abandono_posto") {
    return `
      <p>Informamos que no(s) dia(s) ${diasOcorrencia}, foi constatado que V.Sa. ausentou-se de seu posto de trabalho sem autorização, configurando abandono momentâneo de posto, situação que caracteriza descumprimento das obrigações contratuais e das normas internas da empresa e a Consolidação das Leis do Trabalho (CLT).</p>
      <p>Ressaltamos que, de acordo com o artigo 482, alínea "i", da CLT, o abandono de emprego ou de posto de trabalho é considerado ato faltoso passível de sanções disciplinares, podendo inclusive acarretar dispensa por justa causa em casos de reincidência.</p>
    `;
  }

  if (modelo === "insubordinacao_ma_conduta") {
    return `
      <p>Informamos que, no dia ${diasOcorrencia}, foi constatado que V.Sa., no exercício da função de ${texto(detalhes.funcao_ocorrencia)}, pelo motivo de ${texto(registro.motivo)}. Tal conduta caracteriza insubordinação e descumprimento das orientações relacionadas à execução das atividades profissionais, além de demonstrar comportamento incompatível com a postura profissional esperada no ambiente de trabalho.</p>
      <p>Ressaltamos que, de acordo com o artigo 482, alínea "h", da CLT, constitui falta grave o ato de indisciplina ou de insubordinação.</p>
    `;
  }

  return `
    <p>Informamos que sua ausência ao trabalho no(s) dia(s) ${diasOcorrencia} foi registrada sem a devida justificativa, contrariando as normas internas da empresa e a Consolidação das Leis do Trabalho (CLT).</p>
    <p>Solicitamos que o(a) senhor(a) apresente, com a máxima brevidade, a devida justificativa para a falta, acompanhada de documentos comprobatórios.</p>
  `;
}

function corpoSuspensao(registro) {
  const detalhes = registro.detalhes || {};
  const modelo = detalhes.modelo;
  const dataAnterior = texto(formatarData(detalhes.data_advertencia_anterior), "___/___/____");
  const ocorrencia = texto(detalhes.dias_ocorrencia || detalhes.data_ocorrencia);
  const retorno = detalhes.data_retorno || dataRetorno(registro.data_inicio, registro.dias);

  if (modelo === "outro") {
    return `
      <p>Conforme registrado anteriormente, o(a) senhor(a) já recebeu ADVERTÊNCIA referente a ${texto(detalhes.modelo_outro || registro.motivo)}, no dia ${dataAnterior}.</p>
      <p>Entretanto, verificamos nova ocorrência disciplinar no(s) dia(s) ${ocorrencia}: ${texto(registro.motivo)}.</p>
      <p>Diante da situação, comunicamos que o(a) senhor(a) ficará sujeito(a) à suspensão disciplinar de ${texto(registro.dias)} dia(s) a contar de ${texto(formatarData(registro.data_inicio), "___/___/____")}, retornando às suas atividades em ${texto(formatarData(retorno), "___/___/____")}.</p>
      <p>A presente suspensão fica registrada como medida disciplinar personalizada, conforme a ocorrência informada e as normas internas da empresa.</p>
    `;
  }

  let motivoAnterior = "ausência ao trabalho sem justificativa comprovada";
  let reincidencia = `tendo o(a) senhor(a) se ausentado novamente de suas atividades no(s) dia(s) ${ocorrencia}, sem apresentar justificativa ou documentação comprobatória`;

  if (modelo === "abandono_posto") {
    motivoAnterior = "abandono de posto sem justificativa comprovada";
    reincidencia = `tendo o(a) senhor(a) se recusado a seguir em rota e ido embora sem autorização às ${texto(detalhes.horario_ocorrencia, "___:___")} no dia ${ocorrencia}, sem apresentar justificativa ou documentação comprobatória`;
  }

  if (modelo === "insubordinacao_ma_conduta") {
    motivoAnterior = "insubordinação e/ou má conduta";
    reincidencia = `tendo sido constatado que o(a) senhor(a), no dia ${ocorrencia}, ${texto(registro.motivo)}`;
  }

  return `
    <p>Conforme registrado anteriormente, o(a) senhor(a) já recebeu ADVERTÊNCIA pelo motivo de ${motivoAnterior}, no dia ${dataAnterior}.</p>
    <p>Entretanto, verificamos a reincidência da mesma conduta, ${reincidencia}, em desacordo com as normas internas da empresa e a Consolidação das Leis do Trabalho (CLT).</p>
    <p>Diante da reincidência, comunicamos que o(a) senhor(a) ficará sujeito(a) à suspensão disciplinar de ${texto(registro.dias)} dia(s) a contar de ${texto(formatarData(registro.data_inicio), "___/___/____")}, retornando às suas atividades em ${texto(formatarData(retorno), "___/___/____")}.</p>
    <p>Ressaltamos que, conforme o artigo 482 da CLT, tais condutas podem configurar ato de indisciplina e/ou desídia, sendo passíveis de sanções mais severas, inclusive a rescisão do contrato de trabalho por justa causa, em caso de novas reincidências.</p>
  `;
}

function montarDocumento({ tipo, registro, colaboradores }) {
  const colaborador = dadosColaborador(registro, colaboradores);
  const detalhes = registro.detalhes || {};
  const dataDocumento = tipo === "advertencia" ? registro.data_advertencia : registro.data_inicio;
  const complementoTitulo = detalhes.modelo === "outro" && detalhes.modelo_outro
    ? ` - ${escapeHtml(detalhes.modelo_outro).toUpperCase()}`
    : "";
  const titulo = tipo === "advertencia"
    ? `ADVERTÊNCIA DISCIPLINAR${complementoTitulo}`
    : `SUSPENSÃO DISCIPLINAR${complementoTitulo}`;
  const corpo = tipo === "advertencia" ? corpoAdvertencia(registro) : corpoSuspensao(registro);
  const informacoesAdicionais = detalhes.observacoes
    ? `<p>${texto(detalhes.observacoes, "")}</p>`
    : "";

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${titulo}</title>
        <style>
          body { color: #111827; font-family: Arial, sans-serif; margin: 0; }
          main { margin: 36px auto; max-width: 760px; padding: 0 36px; }
          h1 { font-size: 22px; text-align: center; margin: 0 0 28px; }
          p { font-size: 15px; line-height: 1.55; text-align: justify; }
          .dados p { margin: 8px 0; text-align: left; }
          .assinatura { margin-top: 34px; text-align: left; }
          .ciente { margin-top: 34px; text-align: left; }
          .linha { border-top: 1px solid #111827; margin-top: 40px; padding-top: 8px; text-align: center; width: 320px; }
          .testemunhas { margin-top: 28px; text-align: left; }
          .duas-linhas { display: flex; gap: 36px; margin-top: 28px; }
          @media print { main { margin: 24px auto; } button { display: none; } }
        </style>
      </head>
      <body>
        <main>
          <h1>${titulo}</h1>
          <section class="dados">
            <p><strong>Colaborador(a):</strong> ${texto(colaborador.nome)}</p>
            <p><strong>Cargo:</strong> ${texto(colaborador.cargo)}</p>
            <p><strong>Setor:</strong> ${texto(colaborador.setor)}</p>
            <p><strong>Data:</strong> ${texto(formatarData(dataDocumento), "___/___/____")}</p>
          </section>
          ${informacoesAdicionais}
          <p>Prezado(a),</p>
          ${corpo}
          <p>Desta forma, fica registrada a presente medida disciplinar, servindo como orientação e alerta de que novas ocorrências semelhantes poderão acarretar medidas disciplinares mais severas.</p>
          ${blocoAssinaturas()}
        </main>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `;
}

export function extrairPdfDisciplinar(tipo, registro, colaboradores) {
  const janela = window.open("", "_blank", "width=900,height=700");

  if (!janela) return;

  janela.document.open();
  janela.document.write(montarDocumento({ tipo, registro, colaboradores }));
  janela.document.close();
}
