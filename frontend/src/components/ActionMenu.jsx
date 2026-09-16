import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function ActionMenu({
  aberto,
  onToggle,
  onClose,
  onEditar,
  onExcluir,
  actions,
}) {
  const botaoRef = useRef(null);
  const menuRef = useRef(null);
  const [posicao, setPosicao] = useState({
    top: 0,
    left: 0,
  });

  useLayoutEffect(() => {
    if (!aberto || !botaoRef.current) return;

    function atualizarPosicao() {
      const rect = botaoRef.current.getBoundingClientRect();
      const larguraMenu = menuRef.current?.offsetWidth || 160;
      const alturaMenu = menuRef.current?.offsetHeight || 112;
      const margem = 12;
      const espacamento = 6;

      let top = rect.bottom + espacamento;
      let left = rect.right - larguraMenu;

      if (top + alturaMenu > window.innerHeight - margem) {
        top = rect.top - alturaMenu - espacamento;
      }

      setPosicao({
        top: Math.max(margem, top),
        left: Math.min(
          Math.max(margem, left),
          window.innerWidth - larguraMenu - margem
        ),
      });
    }

    atualizarPosicao();
    window.addEventListener("resize", atualizarPosicao);
    window.addEventListener("scroll", atualizarPosicao, true);

    return () => {
      window.removeEventListener("resize", atualizarPosicao);
      window.removeEventListener("scroll", atualizarPosicao, true);
    };
  }, [aberto, actions]);

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
        aria-label="Abrir ações"
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
          {actions ? (
            actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  action.onClick();
                  onClose?.();
                }}
              >
                {action.label}
              </button>
            ))
          ) : (
            <>
              <button type="button" onClick={onEditar}>
                Editar
              </button>

              <button type="button" onClick={onExcluir}>
                Excluir
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
