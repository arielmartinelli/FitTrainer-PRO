import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Zap, LogOut, Dumbbell, ClipboardList, TrendingUp, X, RefreshCw, User } from "lucide-react";

export const AppleHeader = ({ activeTab, setActiveTab }) => {
  const { currentUser, role, logout, syncing, refreshData } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Cierra el menú al tocar fuera o al presionar Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (!currentUser) return null;

  const roleLabel =
    role === "admin" ? "👑 Administrador" : role === "trainer" ? "👨‍🏫 Profesor / Entrenador" : "🏋️ Alumno";

  const desktopNav =
    role === "trainer"
      ? [
          { key: "dashboard", label: "Dashboard" },
          { key: "students", label: "Alumnos" },
          { key: "payments", label: "Pagos & Finanzas" },
          { key: "routines", label: "Rutinas & Excel" }
        ]
      : role === "student"
      ? [
          { key: "workout", label: "Mi Rutina", Icon: Dumbbell },
          { key: "progress", label: "Mi Progreso", Icon: TrendingUp },
          { key: "onboarding", label: "Mi Cuestionario", Icon: ClipboardList }
        ]
      : [];

  const activeStyle = role === "student" ? "btn-lime" : "btn-primary";

  return (
    <header className="glass-header" style={{ position: "sticky", top: 0, zIndex: 100 }}>
      <div
        className="main-content"
        style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}
      >
        {/* Marca */}
        <button
          onClick={() => setActiveTab(role === "student" ? "workout" : "dashboard")}
          style={{ display: "flex", alignItems: "center", gap: "8px", border: "none", background: "transparent", cursor: "pointer", padding: 0, minWidth: 0 }}
          aria-label="Ir al inicio"
        >
          <Zap size={26} color="var(--accent-blue)" strokeWidth={2.6} />
          <span style={{ textAlign: "left" }}>
            <span style={{ display: "block", fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1, color: "var(--text-primary)" }}>
              FitTrainer
            </span>
            <span style={{ display: "block", fontSize: "0.62rem", color: "var(--text-secondary)", letterSpacing: "0.06em" }}>
              PROFESSIONAL
            </span>
          </span>
        </button>

        {/* Navegación de escritorio (en móvil se usa la barra inferior) */}
        {desktopNav.length > 0 && (
          <nav style={{ display: "flex", gap: "4px" }} className="desktop-only">
            {desktopNav.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`btn btn-sm ${activeTab === key ? activeStyle : "btn-ghost"}`}
                style={{ borderRadius: "20px" }}
                onClick={() => setActiveTab(key)}
              >
                {Icon && <Icon size={15} />} {label}
              </button>
            ))}
          </nav>
        )}

        {/* Cuenta */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative" }} ref={menuRef}>
          {syncing && (
            <RefreshCw size={15} className="spin" color="var(--text-secondary)" aria-label="Sincronizando" />
          )}

          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Menú de cuenta"
            style={{ background: "var(--bg-subtle)" }}
          >
            {menuOpen ? <X size={20} /> : <User size={19} color="var(--accent-blue)" />}
          </button>

          {/*
            Antes en móvil este menú repetía exactamente los mismos ítems que la barra
            inferior. Ahora solo tiene lo que no está en ningún otro lado: perfil y salir.
          */}
          {menuOpen && (
            <div
              className="animate-fade-in glass-panel"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                minWidth: "230px",
                background: "var(--bg-card)",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
                zIndex: 200
              }}
            >
              <div className="subtle-box">
                <div style={{ fontWeight: 700, fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{roleLabel}</div>
                {role === "trainer" && currentUser.brandName && (
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {currentUser.brandName}
                  </div>
                )}
              </div>

              <button
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: "flex-start" }}
                onClick={() => {
                  refreshData();
                  setMenuOpen(false);
                }}
              >
                <RefreshCw size={15} /> Sincronizar ahora
              </button>

              <button
                className="btn btn-danger btn-sm"
                style={{ justifyContent: "flex-start" }}
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
              >
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
