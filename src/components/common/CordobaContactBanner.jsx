import React, { useState, useEffect } from "react";
import { Send, X, MapPin, MessageCircle } from "lucide-react";

export const CordobaContactBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Desaparece automáticamente a los 5 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const handleOpenWhatsApp = () => {
    const message = encodeURIComponent("¡Hola! Quisiera consultar y cotizar un plan de entrenamiento presencial o personalizado en Córdoba.");
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed",
        bottom: "80px",
        right: "16px",
        left: "16px",
        maxWidth: "380px",
        margin: "0 auto",
        background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
        color: "#FFFFFF",
        padding: "14px 16px",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(37, 211, 102, 0.4)",
        zIndex: 2500,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        transition: "opacity 0.3s ease, transform 0.3s ease"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <MessageCircle size={20} color="#FFFFFF" />
        </div>

        <div>
          <div style={{ fontSize: "0.825rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
            <MapPin size={13} /> Atención presencial en Córdoba
          </div>
          <p style={{ fontSize: "0.75rem", opacity: 0.95, margin: "2px 0 0 0", lineHeight: "1.2" }}>
            ¿Tienes dudas o deseas cotizar tu plan personal?
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {/* Botón Acción WhatsApp */}
        <button
          onClick={handleOpenWhatsApp}
          style={{
            border: "none",
            background: "#FFFFFF",
            color: "#128C7E",
            fontWeight: 700,
            fontSize: "0.78rem",
            padding: "8px 12px",
            borderRadius: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
          }}
        >
          <Send size={12} /> Cotizar
        </button>

        {/* Botón de Cierre (Cruz) */}
        <button
          onClick={() => setIsVisible(false)}
          title="Cerrar aviso"
          style={{
            border: "none",
            background: "rgba(0, 0, 0, 0.15)",
            color: "#FFFFFF",
            width: "26px",
            height: "26px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.2s ease"
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
