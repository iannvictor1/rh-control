export default function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = "Excluir",
  onCancelar,
  onConfirmar,
}) {
  if (!aberto) return null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog-box" role="dialog" aria-modal="true">
        <h3>{titulo}</h3>
        <p>{mensagem}</p>

        <div className="dialog-actions">
          <button
            type="button"
            className="dialog-button-secondary"
            onClick={onCancelar}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="dialog-button-danger"
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
