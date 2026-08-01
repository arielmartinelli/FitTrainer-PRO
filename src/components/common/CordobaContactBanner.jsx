import React, { useState, useEffect } from "react";
import { Send, X, MapPin, MessageCircle } from "lucide-react";

const DISMISSED_KEY = "fittrainer_contact_banner_dismissed_v1";

// Número de contacto configurable (.env → VITE_CONTACT_WHATSAPP=5493511234567).
// Antes el botón abría wa.me SIN número, así que no servía para nada.
const CONTACT_PHONE = (import.meta.env.VITE_CONTACT_WHATSAPP || "").replace(/[^0-9]/g, "");

export const CordobaContactBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Sin número configurado no tiene sentido mostrarlo.
    if (!CONTACT_PHONE) return;
    // Se muestra una sola vez por dispositivo, no en cada carga.
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const show = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(show);
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  if (!isVisible) return null;

  const handleOpenWhatsApp = () => {
    const message = encodeURIComponent(
      "¡Hola! Quisiera consultar y cotizar un plan de entrenamiento personalizado."
    );
    window.open(`https://wa.me/${CONTACT_PHONE}?text=${message}`, "_blank", "noopener");
    dismiss();
  };

  return (
    <div
      className="animate-slide-up"
      role="complementary"
      style={{
        position: "fixed",
        // Se apoya encima de la barra inferior en vez de taparla.
        bottom: "calc(var(--tabbar-height) + 12px)",
        right: "12px",
        left: "12px",
        maxWidth: "380px",
        margin: "0 auto",
        background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
        color: "#FFFFFF",
        padding: "12px 14px",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(37, 211, 102, 0.35)",
        zIndex: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <MessageCircle size={19} color="#FFFFFF" />
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
            <MapPin size={13} /> Atención presencial en Córdoba
          </div>
          <p style={{ fontSize: "0.73rem", opacity: 0.95, margin: "2px 0 0 0", lineHeight: 1.25 }}>
            ¿Querés cotizar tu plan personal?
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        <button
          onClick={handleOpenWhatsApp}
          className="btn btn-sm"
          style={{ background: "#FFFFFF", color: "#128C7E", fontWeight: 700, borderRadius: "20px" }}
        >
          <Send size={13} /> Cotizar
        </button>

        <button
          onClick={dismiss}
          aria-label="Cerrar aviso"
          style={{
            border: "none",
            background: "rgba(0, 0, 0, 0.18)",
            color: "#FFFFFF",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0
          }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
