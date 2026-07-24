import React, { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({ isOpen, onClose, title, children, maxWidth = "560px" }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2500,
        padding: "16px"
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: "100%",
          maxWidth: maxWidth,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
          position: "relative",
          margin: "auto",
          borderRadius: "20px",
          background: "#FFFFFF",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
          border: "1px solid var(--border-subtle)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
          <h3 style={{ fontSize: "1.25rem", margin: 0, color: "var(--text-primary)", fontWeight: 700 }}>{title}</h3>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ borderRadius: "50%", padding: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
