import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Zap, LogOut, Dumbbell, ClipboardList, Menu, X, Users, CreditCard } from "lucide-react";

export const AppleHeader = ({ activeTab, setActiveTab }) => {
  const { currentUser, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <header className="glass-header" style={{ position: "sticky", top: 0, zIndex: 100 }}>
      <div className="main-content" style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        
        {/* Brand Logo - Rayo azul sin fondo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => setActiveTab("dashboard")}>
          <Zap size={28} color="var(--accent-blue)" strokeWidth={2.6} />
          <div>
            <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: "1.15rem", lineHeight: 1 }}>FitTrainer</div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", letterSpacing: "0.04em" }}>PROFESSIONAL</div>
          </div>
        </div>

        {/* Navigation Tabs for Trainer Desktop */}
        {role === "trainer" && (
          <nav style={{ display: "flex", gap: "4px" }} className="desktop-only">
            <button
              className={`btn ${activeTab === "dashboard" ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: "20px", padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`btn ${activeTab === "students" ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: "20px", padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={() => setActiveTab("students")}
            >
              Alumnos
            </button>
            <button
              className={`btn ${activeTab === "payments" ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: "20px", padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={() => setActiveTab("payments")}
            >
              Pagos & Finanzas
            </button>
            <button
              className={`btn ${activeTab === "routines" ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: "20px", padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={() => setActiveTab("routines")}
            >
              Rutinas & Excel
            </button>
          </nav>
        )}

        {/* Navigation Tabs for Student Desktop */}
        {role === "student" && (
          <nav style={{ display: "flex", gap: "4px" }} className="desktop-only">
            <button
              className={`btn ${activeTab === "workout" ? "btn-lime" : "btn-ghost"}`}
              style={{ borderRadius: "20px", padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={() => setActiveTab("workout")}
            >
              <Dumbbell size={15} /> Mi Rutina
            </button>
            <button
              className={`btn ${activeTab === "onboarding" ? "btn-lime" : "btn-ghost"}`}
              style={{ borderRadius: "20px", padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={() => setActiveTab("onboarding")}
            >
              <ClipboardList size={15} /> Mi Cuestionario
            </button>
          </nav>
        )}

        {/* User Info & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="desktop-only">
            {role === "admin" && <span className="badge badge-blue">👑 ADMIN</span>}
            {role === "trainer" && <span className="badge badge-blue">👨‍🏫 {currentUser.name}</span>}
            {role === "student" && <span className="badge badge-success">🏋️ {currentUser.name}</span>}
          </div>

          <button
            className="btn btn-ghost btn-sm desktop-only"
            onClick={logout}
            title="Cerrar sesión"
            style={{ borderRadius: "50%", padding: "6px", width: "32px", height: "32px" }}
          >
            <LogOut size={16} color="var(--accent-red)" />
          </button>

          {/* Hamburger Menu Toggle (Mobile view) */}
          <button
            className="btn btn-ghost btn-sm mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ padding: "6px" }}
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer (Menú Hamburguesa) */}
      {mobileMenuOpen && (
        <div className="animate-fade-in mobile-only" style={{
          padding: "16px",
          background: "#FFFFFF",
          borderTop: "1px solid var(--border-subtle)",
          boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          
          <div style={{ padding: "8px 12px", background: "#F2F2F7", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{currentUser.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                {role === "admin" ? "👑 Administrador" : role === "trainer" ? "👨‍🏫 Profesor / Entrenador" : "🏋️ Alumno"}
              </div>
            </div>
          </div>

          {/* Trainer Mobile Navigation */}
          {role === "trainer" && (
            <>
              <button
                className={`btn ${activeTab === "dashboard" ? "btn-primary" : "btn-ghost"}`}
                style={{ justifyContent: "flex-start", borderRadius: "10px" }}
                onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
              >
                Dashboard
              </button>
              <button
                className={`btn ${activeTab === "students" ? "btn-primary" : "btn-ghost"}`}
                style={{ justifyContent: "flex-start", borderRadius: "10px" }}
                onClick={() => { setActiveTab("students"); setMobileMenuOpen(false); }}
              >
                <Users size={16} /> Mis Alumnos
              </button>
              <button
                className={`btn ${activeTab === "payments" ? "btn-primary" : "btn-ghost"}`}
                style={{ justifyContent: "flex-start", borderRadius: "10px" }}
                onClick={() => { setActiveTab("payments"); setMobileMenuOpen(false); }}
              >
                <CreditCard size={16} /> Cobros & Cuotas
              </button>
              <button
                className={`btn ${activeTab === "routines" ? "btn-primary" : "btn-ghost"}`}
                style={{ justifyContent: "flex-start", borderRadius: "10px" }}
                onClick={() => { setActiveTab("routines"); setMobileMenuOpen(false); }}
              >
                <Dumbbell size={16} /> Rutinas & Excel
              </button>
            </>
          )}

          {/* Student Mobile Navigation */}
          {role === "student" && (
            <>
              <button
                className={`btn ${activeTab === "workout" ? "btn-lime" : "btn-ghost"}`}
                style={{ justifyContent: "flex-start", borderRadius: "10px" }}
                onClick={() => { setActiveTab("workout"); setMobileMenuOpen(false); }}
              >
                <Dumbbell size={16} /> Mi Rutina
              </button>
              <button
                className={`btn ${activeTab === "onboarding" ? "btn-lime" : "btn-ghost"}`}
                style={{ justifyContent: "flex-start", borderRadius: "10px" }}
                onClick={() => { setActiveTab("onboarding"); setMobileMenuOpen(false); }}
              >
                <ClipboardList size={16} /> Mi Cuestionario
              </button>
            </>
          )}

          {/* LogOut Button */}
          <button
            className="btn btn-danger"
            style={{ width: "100%", marginTop: "8px", borderRadius: "10px" }}
            onClick={() => { logout(); setMobileMenuOpen(false); }}
          >
            <LogOut size={16} /> Cerrar Sesión (Salir)
          </button>

        </div>
      )}

    </header>
  );
};
