function escaparCsv(valor) {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  return `"${texto.replace(/"/g, '""')}"`;
}

export function exportarCsv(nomeArquivo, colunas, linhas) {
  const cabecalho = colunas.map((coluna) => escaparCsv(coluna.label)).join(";");
  const conteudo = linhas.map((linha) =>
    colunas
      .map((coluna) => {
        const valor = typeof coluna.valor === "function"
          ? coluna.valor(linha)
          : linha[coluna.valor];

        return escaparCsv(valor);
      })
      .join(";")
  );

  const csv = ["\uFEFF" + cabecalho, ...conteudo].join("\n");
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = nomeArquivo;
  link.click();

  URL.revokeObjectURL(url);
}
