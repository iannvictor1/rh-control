import { useEffect, useRef, useState } from "react";

export default function ActionMenu({
  aberto,
  onToggle,
  onClose,
  onEditar,
  onExcluir,
}) {
  const botaoRef = useRef(null);
  const menuRef = useRef(null);
  const [posicao, setPosicao] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (!aberto || !botaoRef.current) return;

    const rect = botaoRef.current.getBoundingClientRect();
    const larguraMenu = 136;

    setPosicao({
      top: rect.bottom + 6,
      left: Math.max(12, rect.right - larguraMenu),
    });
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;

    function fecharAoClicarFora(event) {
      const clicouNoBotao = botaoRef.current?.contains(event.target);
      const clicouNoMenu = menuRef.current?.contains(event.target);

      if (!clicouNoBotao && !clicouNoMenu) {
        onClose?.();
      }
    }

    function fecharComEsc(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEsc);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEsc);
    };
  }, [aberto, onClose]);

  return (
    <div className="action-menu">
      <button
        ref={botaoRef}
        type="button"
        className="action-menu-button"
        onClick={onToggle}
        aria-label="Abrir acoes"
      >
        <span />
        <span />
        <span />
      </button>

      {aberto && (
        <div
          ref={menuRef}
          className="action-menu-list"
          style={{
            top: `${posicao.top}px`,
            left: `${posicao.left}px`,
          }}
        >
          <button type="button" onClick={onEditar}>
            Editar
          </button>

          <button type="button" onClick={onExcluir}>
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}
