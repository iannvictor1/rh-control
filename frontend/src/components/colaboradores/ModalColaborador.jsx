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

export default function ModalColaborador({
  modalAberto,
  setModalAberto,
  modoEdicao,
  salvarColaborador,
  form,
  atualizarCampo,
}) {

  if (!modalAberto) return null;

  return (
    <div className="
      fixed
      inset-0
      bg-black/70
      flex
      items-center
      justify-center
      z-50
    ">

      <div className="
        bg-zinc-900
        border
        border-zinc-800
        rounded-2xl
        p-8
        w-full
        max-w-3xl
      ">

        <div className="
          flex
          justify-between
          items-center
          mb-6
        ">

          <h3 className="text-2xl font-bold">

            {modoEdicao
              ? "Editar Colaborador"
              : "Novo Colaborador"}

          </h3>

          <button
            onClick={() => setModalAberto(false)}
            className="text-zinc-400 hover:text-white"
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

          <Campo label="E-mail">
            <input
              className="input w-full"
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

          <div className="
            col-span-2
            flex
            justify-end
            gap-3
            mt-4
          ">

            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="
                px-5
                py-3
                rounded-xl
                bg-zinc-800
                hover:bg-zinc-700
              "
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="
                px-5
                py-3
                rounded-xl
                bg-blue-600
                hover:bg-blue-700
                font-semibold
              "
            >
              {modoEdicao
                ? "Atualizar"
                : "Salvar"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}