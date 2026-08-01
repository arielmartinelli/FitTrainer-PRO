import React from "react";
import { Wrench, RefreshCw, MessageCircle } from "lucide-react";

const CONTACT_PHONE = (import.meta.env.VITE_CONTACT_WHATSAPP || "").replace(/[^0-9]/g, "");

/**
 * Pantalla que ve el usuario cuando algo falla o cuando activás el mantenimiento.
 * No depende de ningún contexto ni servicio: tiene que poder dibujarse aunque
 * el resto de la app esté rota.
 */
export const MaintenanceScreen = ({ title, message, error, onRetry }) => {
  const esDesarrollo = import.meta.env.DEV;

  const recargar = () => {
    if (onRetry) onRetry();
    else window.location.reload();
  };

  /** Salida de emergencia: si la sesión quedó en un estado imposible, se limpia. */
  const reiniciarSesion = () => {
    try {
      localStorage.removeItem("fittrainer_active_session_v1");
      localStorage.removeItem("fittrainer-auth");
    } catch {
      /* si ni siquiera hay localStorage, se recarga igual */
    }
    window.location.href = "/";
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F2F2F7",
        padding: "20px",
        overflowY: "auto",
        zIndex: 9999,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#FFFFFF",
          borderRadius: "20px",
          padding: "32px 24px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
          textAlign: "center",
          margin: "auto"
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "rgba(255, 149, 0, 0.12)",
            border: "2px solid rgba(255, 149, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px"
          }}
        >
          <Wrench size={34} color="#FF9500" />
        </div>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1C1C1E", marginBottom: "10px", letterSpacing: "-0.02em" }}>
          {title || "Estamos en mantenimiento"}
        </h1>

        <p style={{ fontSize: "0.95rem", color: "#8E8E93", lineHeight: 1.5, marginBottom: "24px" }}>
          {message ||
            "Se produjo un problema y estamos trabajando para resolverlo. Tus datos están a salvo. Probá de nuevo en unos minutos."}
        </p>

        <button
          onClick={recargar}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: "#007AFF",
            color: "#FFFFFF",
            fontSize: "1rem",
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minHeight: "50px"
          }}
        >
          <RefreshCw size={18} /> Reintentar
        </button>

        <button
          onClick={reiniciarSesion}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            borderRadius: "12px",
            border: "none",
            background: "transparent",
            color: "#8E8E93",
            fontSize: "0.88rem",
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
            minHeight: "44px"
          }}
        >
          Cerrar sesión y empezar de nuevo
        </button>

        {CONTACT_PHONE && (
          <a
            href={`https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent("Hola, tengo un problema con FitTrainer PRO.")}`}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "18px",
              fontSize: "0.85rem",
              color: "#128C7E",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            <MessageCircle size={15} /> Avisar del problema
          </a>
        )}

        {/* El detalle técnico solo se muestra en desarrollo: al usuario final no le
            sirve y puede exponer información interna. */}
        {esDesarrollo && error && (
          <details style={{ marginTop: "22px", textAlign: "left" }}>
            <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#8E8E93", fontWeight: 600 }}>
              Detalle técnico (solo visible en desarrollo)
            </summary>
            <pre
              style={{
                marginTop: "10px",
                padding: "12px",
                background: "#F2F2F7",
                borderRadius: "10px",
                fontSize: "0.72rem",
                color: "#D70015",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: "220px"
              }}
            >
              {String(error?.stack || error?.message || error)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};
