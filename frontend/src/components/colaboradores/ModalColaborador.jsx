function Campo({ label, children }) {
  return (
    <div>
      <label className="text-sm text-zinc-400 mb-1 block">
        {label}
      </label>

      {children}
    </div>
  );
}

function calcularVencimentoAso(dataAso) {
  if (!dataAso) return "";

  const data = new Date(`${dataAso}T00:00:00`);
  data.setFullYear(data.getFullYear() + 1);

  return data.toISOString().slice(0, 10);
}

export default function ModalColaborador({
  modalAberto,
  setModalAberto,
  modoEdicao,
  salvarColaborador,
  form,
  atualizarCampo,
}) {
  if (!modalAberto) return null;

  const vencimentoAso = calcularVencimentoAso(form.data_aso);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">
            {modoEdicao ? "Editar colaborador" : "Novo colaborador"}
          </h3>

          <button
            onClick={() => setModalAberto(false)}
            className="text-zinc-400 hover:text-white"
            type="button"
          >
            X
          </button>
        </div>

        <form
          onSubmit={salvarColaborador}
          className="grid grid-cols-2 gap-4"
        >
          <Campo label="Nome">
            <input
              className="input w-full"
              name="nome"
              value={form.nome}
              onChange={atualizarCampo}
              required
            />
          </Campo>

          <Campo label="Matricula">
            <input
              className="input w-full"
              name="matricula"
              value={form.matricula}
              onChange={atualizarCampo}
            />
          </Campo>

          <Campo label="Cargo">
            <input
              className="input w-full"
              name="cargo"
              value={form.cargo}
              onChange={atualizarCampo}
            />
          </Campo>

          <Campo label="Setor">
            <input
              className="input w-full"
              name="setor"
              value={form.setor}
              onChange={atualizarCampo}
            />
          </Campo>

          <Campo label="Tipo de contrato">
            <select
              className="input w-full"
              name="tipo_contrato"
              value={form.tipo_contrato}
              onChange={atualizarCampo}
            >
              <option value="">Selecione</option>
              <option value="CLT">CLT</option>
              <option value="PJ">PJ</option>
              <option value="Temporario">Temporario</option>
              <option value="Estagio">Estagio</option>
              <option value="Terceirizado">Terceirizado</option>
            </select>
          </Campo>

          <Campo label="CPF">
            <input
              className="input w-full"
              name="cpf"
              value={form.cpf}
              onChange={atualizarCampo}
            />
          </Campo>

          <Campo label="RG">
            <input
              className="input w-full"
              name="rg"
              value={form.rg}
              onChange={atualizarCampo}
            />
          </Campo>

          <Campo label="Data de nascimento">
            <input
              className="input w-full"
              type="date"
              name="data_nascimento"
              value={form.data_nascimento}
              onChange={atualizarCampo}
            />
          </Campo>

          <Campo label="Data de admissão">
            <input
              className="input w-full"
              type="date"
              name="data_admissao"
              value={form.data_admissao}
              onChange={atualizarCampo}
            />
          </Campo>

          <Campo label="Data do ASO">
            <input
              className="input w-full"
              type="date"
              name="data_aso"
              value={form.data_aso}
              onChange={atualizarCampo}
            />
          </Campo>

          <Campo label="Data de desligamento">
            <input
              className="input w-full"
              type="date"
              name="data_desligamento"
              value={form.data_desligamento}
              onChange={atualizarCampo}
            />
          </Campo>

          <Campo label="Vencimento do ASO">
            <input
              className="input w-full text-zinc-400"
              value={vencimentoAso || "Calculado 12 meses após o ASO"}
              readOnly
            />
          </Campo>

          <Campo label="E-mail">
            <input
              className="input w-full"
              type="email"
              name="email"
              value={form.email}
              onChange={atualizarCampo}
            />
          </Campo>

          <Campo label="Telefone">
            <input
              className="input w-full"
              name="telefone"
              value={form.telefone}
              onChange={atualizarCampo}
            />
          </Campo>

          <Campo label="Telefone de emergência">
            <input
              className="input w-full"
              name="telefone_emergencia"
              value={form.telefone_emergencia}
              onChange={atualizarCampo}
            />
          </Campo>

          <div className="col-span-2">
            <Campo label="Endereço">
              <input
                className="input w-full"
                name="endereco"
                value={form.endereco}
                onChange={atualizarCampo}
              />
            </Campo>
          </div>

          <div className="col-span-2">
            <Campo label="Observacoes">
              <textarea
                className="input w-full min-h-24"
                name="observacoes"
                value={form.observacoes}
                onChange={atualizarCampo}
              />
            </Campo>
          </div>

          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold"
            >
              {modoEdicao ? "Atualizar" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
