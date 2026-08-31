import * as XLSX from "xlsx";

function obterValorCelula(coluna, linha) {
  return typeof coluna.valor === "function"
    ? coluna.valor(linha)
    : linha[coluna.valor];
}

function trocarExtensao(nomeArquivo, extensao) {
  return nomeArquivo.replace(/\.[^.]+$/, extensao);
}

export function exportarXlsx(nomeArquivo, colunas, linhas) {
  const dados = linhas.map((linha) =>
    colunas.reduce((registro, coluna) => {
      registro[coluna.label] = obterValorCelula(coluna, linha) ?? "";
      return registro;
    }, {})
  );

  const planilha = XLSX.utils.json_to_sheet(dados, {
    header: colunas.map((coluna) => coluna.label),
  });
  const pasta = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(pasta, planilha, "Relatório");
  XLSX.writeFile(pasta, trocarExtensao(nomeArquivo, ".xlsx"));
}
