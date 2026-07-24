import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { resetToFactoryData } from "../../services/storageService";
import {
  Zap,
  UserCheck,
  Dumbbell,
  DollarSign,
  Users,
  LogOut,
  ChevronDown,
  RotateCcw,
  PlusCircle,
  Menu,
  X,
  CreditCard
} from "lucide-react";

export const Header = ({ activeTab, setActiveTab, onOpenNewStudent, onOpenLoginModal }) => {
  const { currentUser, role, trainers, students, switchRoleQuick, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: "sticky", top: 0, zIndex: 100 }}>
      <div className="main-content" style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        
        {/* Logo & Marca */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #00F2FE 0%, #A8FF00 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(0, 242, 254, 0.4)"
          }}>
            <Zap size={24} color="#090B0E" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.03em" }}>FitTrainer</span>
              <span className="gradient-text" style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: "1.3rem" }}>PRO</span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginTop: "-3px" }}>
              Software para Personal Trainers
            </span>
          </div>
        </div>

        {/* Navigation Desktop */}
        {currentUser && role === "trainer" && (
          <nav style={{ display: "flex", alignItems: "center", gap: "6px" }} className="desktop-only">
            <button
              className={`btn ${activeTab === "dashboard" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("dashboard")}
            >
              <Zap size={16} /> Dashboard
            </button>
            <button
              className={`btn ${activeTab === "students" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("students")}
            >
              <Users size={16} /> Alumnos ({students.filter(s => s.trainerId === currentUser.id).length})
            </button>
            <button
              className={`btn ${activeTab === "payments" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("payments")}
            >
              <DollarSign size={16} /> Pagos & Cuotas
            </button>
            <button
              className={`btn ${activeTab === "routines" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("routines")}
            >
              <Dumbbell size={16} /> Creador Rutinas
            </button>
          </nav>
        )}

        {currentUser && role === "student" && (
          <nav style={{ display: "flex", alignItems: "center", gap: "6px" }} className="desktop-only">
            <button
              className={`btn ${activeTab === "student-home" ? "btn-lime" : "btn-ghost"}`}
              onClick={() => setActiveTab("student-home")}
            >
              <Dumbbell size={16} /> Mi Rutina
            </button>
            <button
              className={`btn ${activeTab === "student-progress" ? "btn-lime" : "btn-ghost"}`}
              onClick={() => setActiveTab("student-progress")}
            >
              <Zap size={16} /> Mi Progreso
            </button>
          </nav>
        )}

        {/* Quick Role Switcher / Demo Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          
          {/* Quick Demo Switcher Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              style={{
                border: "1px solid var(--accent-cyan)",
                background: "rgba(0, 242, 254, 0.08)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              title="Cambiar de Rol Rápidamente para Demo"
            >
              <span className={`badge ${role === "trainer" ? "badge-cyan" : "badge-success"}`}>
                {role === "trainer" ? "VISTA PROFESOR" : "VISTA ALUMNO"}
              </span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                {currentUser?.name || "Seleccionar Rol"}
              </span>
              <ChevronDown size={14} />
            </button>

            {showRoleMenu && (
              <div className="glass-panel animate-fade-in" style={{
                position: "absolute",
                top: "110%",
                right: 0,
                width: "300px",
                padding: "12px",
                zIndex: 200,
                boxShadow: "0 10px 30px rgba(0,0,0,0.8)"
              }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                  ⚡ Selector Rápido para Pruebas
                </div>
                
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: 600, marginBottom: "4px" }}>
                    👨‍🏫 Entrenadores (Profesores)
                  </div>
                  {trainers.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        switchRoleQuick("trainer", t.id);
                        setShowRoleMenu(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        textAlign: "left",
                        background: currentUser?.id === t.id && role === "trainer" ? "rgba(0, 242, 254, 0.15)" : "transparent",
                        border: "none",
                        borderRadius: "6px",
                        color: "var(--text-main)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                        marginBottom: "2px"
                      }}
                    >
                      <span>{t.name}</span>
                      {currentUser?.id === t.id && role === "trainer" && <UserCheck size={14} color="var(--accent-cyan)" />}
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--accent-lime)", fontWeight: 600, marginBottom: "4px" }}>
                    🏋️‍♂️ Alumnos (Portal Gym)
                  </div>
                  {students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        switchRoleQuick("student", s.id);
                        setShowRoleMenu(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        textAlign: "left",
                        background: currentUser?.id === s.id && role === "student" ? "rgba(168, 255, 0, 0.15)" : "transparent",
                        border: "none",
                        borderRadius: "6px",
                        color: "var(--text-main)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                        marginBottom: "2px"
                      }}
                    >
                      <div>
                        <div>{s.name}</div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Pass: {s.password}</span>
                      </div>
                      {currentUser?.id === s.id && role === "student" && <UserCheck size={14} color="var(--accent-lime)" />}
                    </button>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px", display: "flex", gap: "6px" }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, fontSize: "0.75rem" }}
                    onClick={() => {
                      onOpenLoginModal();
                      setShowRoleMenu(false);
                    }}
                  >
                    Ingresar con Login
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ fontSize: "0.75rem" }}
                    onClick={() => {
                      if (confirm("¿Resetear todos los datos de demostración a fábrica?")) {
                        resetToFactoryData();
                      }
                    }}
                    title="Restablecer datos originales"
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Quick Add Student Button if Trainer */}
          {role === "trainer" && (
            <button className="btn btn-primary btn-sm desktop-only" onClick={onOpenNewStudent}>
              <PlusCircle size={15} /> Nuevo Alumno
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="btn btn-ghost btn-sm mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ padding: "6px" }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div style={{ padding: "12px 16px", background: "var(--bg-card)", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "8px" }} className="mobile-only">
          {role === "trainer" && (
            <>
              <button
                className={`btn ${activeTab === "dashboard" ? "btn-primary" : "btn-ghost"}`}
                style={{ justifyContent: "flex-start" }}
                onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
              >
                <Zap size={16} /> Dashboard General
              </button>
              <button
                className={`btn ${activeTab === "students" ? "btn-primary" : "btn-ghost"}`}
                style={{ justifyContent: "flex-start" }}
                onClick={() => { setActiveTab("students"); setMobileMenuOpen(false); }}
              >
                <Users size={16} /> Alumnos ({students.filter(s => s.trainerId === currentUser.id).length})
              </button>
              <button
                className={`btn ${activeTab === "payments" ? "btn-primary" : "btn-ghost"}`}
                style={{ justifyContent: "flex-start" }}
                onClick={() => { setActiveTab("payments"); setMobileMenuOpen(false); }}
              >
                <CreditCard size={16} /> Control de Pagos
              </button>
              <button
                className={`btn ${activeTab === "routines" ? "btn-primary" : "btn-ghost"}`}
                style={{ justifyContent: "flex-start" }}
                onClick={() => { setActiveTab("routines"); setMobileMenuOpen(false); }}
              >
                <Dumbbell size={16} /> Creador de Rutinas
              </button>
              <button className="btn btn-lime btn-sm" style={{ marginTop: "6px" }} onClick={() => { onOpenNewStudent(); setMobileMenuOpen(false); }}>
                <PlusCircle size={15} /> Crear Nuevo Alumno
              </button>
            </>
          )}

          {role === "student" && (
            <>
              <button
                className={`btn ${activeTab === "student-home" ? "btn-lime" : "btn-ghost"}`}
                style={{ justifyContent: "flex-start" }}
                onClick={() => { setActiveTab("student-home"); setMobileMenuOpen(false); }}
              >
                <Dumbbell size={16} /> Mi Rutina del Gimnasio
              </button>
              <button
                className={`btn ${activeTab === "student-progress" ? "btn-lime" : "btn-ghost"}`}
                style={{ justifyContent: "flex-start" }}
                onClick={() => { setActiveTab("student-progress"); setMobileMenuOpen(false); }}
              >
                <Zap size={16} /> Mi Progreso y Peso
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
