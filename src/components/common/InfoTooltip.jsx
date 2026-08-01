import React, { useState, useRef, useEffect } from "react";

/**
 * Ícono con globito explicativo.
 *
 * Funciona por toque (celular) y por hover (escritorio). Se cierra al tocar
 * fuera o al presionar Escape.
 */
export const InfoTooltip = ({ children, text, tone = "neutral", ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("touchstart", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("touchstart", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const fondo = tone === "danger" ? "#B3261E" : tone === "success" ? "#1B5E20" : "#1C1C1E";

  return (
    <span ref={wrapRef} style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <button
        type="button"
        aria-label={ariaLabel || text}
        aria-expanded={open}
        onClick={(e) => {
          // Evita que el clic active la tarjeta que está debajo.
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {children}
      </button>

      {open && (
        <span
          role="tooltip"
          className="animate-fade-in"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: fondo,
            color: "#FFFFFF",
            padding: "9px 12px",
            borderRadius: "10px",
            fontSize: "0.76rem",
            fontWeight: 500,
            lineHeight: 1.35,
            width: "max-content",
            maxWidth: "220px",
            zIndex: 50,
            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
            pointerEvents: "none"
          }}
        >
          {/* Puntita del globo */}
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "12px",
              width: "10px",
              height: "10px",
              background: fondo,
              transform: "rotate(45deg)",
              borderRadius: "2px"
            }}
          />
          {text}
        </span>
      )}
    </span>
  );
};
