import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import { formatarData } from "../src/services/utils/formatters.js";

const source = readFileSync(new URL("../src/services/utils/documentosDisciplinares.js", import.meta.url), "utf8")
  .replace(/^import .*;\r?\n/, "")
  .replaceAll("export ", "");

function documento(tipo, registro) {
  let html;
  const context = vm.createContext({
    formatarData,
    window: { open: () => ({ document: {
      open() {}, close() {}, write(value) { html = value; },
    } }) },
  });
  vm.runInContext(source, context);
  context.extrairPdfDisciplinar(tipo, registro, []);
  return html;
}

test("advertências separam título, descrição e observações em todos os modelos", () => {
  for (const modelo of ["outro", "insubordinacao_ma_conduta", "abandono_posto", "falta_injustificada"]) {
    const html = documento("advertencia", {
      motivo: "Título <ponto>", data_advertencia: "2026-09-29",
      detalhes: { modelo, descricao: "Descrição única", observacoes: "Observação final" },
    });
    assert.equal(html.split("Título &lt;ponto&gt;").length - 1, 1);
    assert.equal(html.split("Descrição única").length - 1, 1);
    assert.ok(html.indexOf("29/09/2026") < html.indexOf("Título &lt;ponto&gt;"));
    assert.ok(html.indexOf("Título &lt;ponto&gt;") < html.indexOf("Descrição única"));
    assert.ok(html.indexOf("Descrição única") < html.indexOf("Observação final"));
  }
});

test("advertência antiga mantém o texto no corpo", () => {
  const html = documento("advertencia", { motivo: "Texto antigo", detalhes: { modelo: "outro" } });
  assert.equal(html.split("Texto antigo").length - 1, 1);
  assert.ok(html.indexOf("Prezado(a)") < html.indexOf("Texto antigo"));
});

test("feedback imprime motivo antes da ocorrência, sem fatos e dados", () => {
  const html = documento("feedback", { motivo: "Motivo único", ocorrencia: "Ocorrência única", observacoes: "Observação final" });
  assert.equal(html.split("Ocorrência única").length - 1, 1);
  assert.ok(!html.includes("Fatos e dados"));
  assert.ok(html.indexOf("Motivo único") < html.indexOf("Ocorrência única"));
  assert.ok(html.indexOf("Ocorrência única") < html.indexOf("Observação final"));
});
