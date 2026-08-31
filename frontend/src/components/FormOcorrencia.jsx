function CampoFormulario({ campo, form, hoje, onChange }) {
  if (campo.type === "select") {
    return (
      <div className={campo.className}>
        <label className="text-sm text-zinc-400 mb-1 block">
          {campo.label}
        </label>

        <select
          className="input w-full"
          name={campo.name}
          value={form[campo.name] ?? ""}
          onChange={onChange}
          required={campo.required}
        >
          {campo.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (campo.type === "textarea") {
    return (
      <div className={campo.className}>
        <label className="text-sm text-zinc-400 mb-1 block">
          {campo.label}
        </label>

        <textarea
          className="input w-full min-h-28 resize-y"
          name={campo.name}
          placeholder={campo.placeholder}
          value={form[campo.name] ?? ""}
          onChange={onChange}
          required={campo.required}
        />
      </div>
    );
  }

  return (
    <div className={campo.className}>
      <label className="text-sm text-zinc-400 mb-1 block">
        {campo.label}
      </label>

      <input
        className="input w-full"
        type={campo.type || "text"}
        min={campo.min}
        max={campo.type === "date" ? (campo.allowFuture ? campo.max : hoje) : campo.max}
        name={campo.name}
        placeholder={campo.placeholder}
        value={form[campo.name] ?? ""}
        onChange={onChange}
        required={campo.required}
      />
    </div>
  );
}

export default function FormOcorrencia({
  form,
  editando,
  colaboradores,
  campos,
  extraContent,
  hoje,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-5 gap-4"
    >
      <div>
        <label className="text-sm text-zinc-400 mb-1 block">
          Colaborador
        </label>

        <select
          className="input w-full"
          name="colaborador_id"
          value={form.colaborador_id}
          onChange={onChange}
          required
        >
          <option value="">Selecione</option>

          {colaboradores
            .filter((colaborador) => colaborador.ativo)
            .map((colaborador) => (
              <option key={colaborador.id} value={colaborador.id}>
                {colaborador.nome}
              </option>
            ))}
        </select>
      </div>

      {campos.map((campo) => (
        <CampoFormulario
          key={campo.name}
          campo={campo}
          form={form}
          hoje={hoje}
          onChange={onChange}
        />
      ))}

      {extraContent}

      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold transition"
        >
          {editando ? "Atualizar" : "Registrar"}
        </button>

        {editando && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
