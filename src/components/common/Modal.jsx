import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Portal } from "./Portal";

export const Modal = ({ isOpen, onClose, title, children, maxWidth = "560px" }) => {
  const panelRef = useRef(null);

  // `onClose` suele venir como función flecha inline, así que cambia de identidad en
  // cada render. Guardarla en un ref permite que el efecto dependa SOLO de `isOpen`.
  // Si no, el efecto se re-ejecutaba con cada tecla y el focus() del panel le robaba
  // el foco al input: se escribía una letra y el campo se deseleccionaba.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCloseRef.current?.();
    };

    // Bloquea el scroll del fondo: en celular, al abrir un modal la página de atrás
    // seguía desplazándose y se perdía la posición.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    // El foco va al panel una sola vez, al abrir, y de ahí en más queda libre
    // para que el usuario escriba.
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Si el contenido es más alto que la pantalla, se scrollea el fondo
          // y el panel sigue quedando centrado.
          overflowY: "auto",
          zIndex: 2500,
          padding: "16px",
          paddingTop: "calc(16px + var(--safe-top))",
          paddingBottom: "calc(16px + var(--safe-bottom))"
        }}
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === "string" ? title : undefined}
          className="glass-panel animate-fade-in"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth,
            maxHeight: "min(88dvh, 900px)",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            padding: "20px",
            position: "relative",
            borderRadius: "20px",
            background: "var(--bg-card)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
            outline: "none",
            // Centrado real en ambos ejes, incluso con contenido corto.
            margin: "auto"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "16px",
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: "12px",
              position: "sticky",
              top: "-20px",
              background: "var(--bg-card)",
              paddingTop: "4px",
              zIndex: 1
            }}
          >
            <h3 style={{ fontSize: "1.15rem", margin: 0, fontWeight: 700, minWidth: 0 }}>{title}</h3>
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Cerrar" style={{ flexShrink: 0 }}>
              <X size={18} />
            </button>
          </div>

          {children}
        </div>
      </div>
    </Portal>
  );
};
