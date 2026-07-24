import React from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  DollarSign,
  Dumbbell,
  AlertCircle,
  PlusCircle,
  CreditCard,
  FileSpreadsheet,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Calendar
} from "lucide-react";

export const TrainerDashboard = ({ onNavigateTab, onSelectStudent, onOpenNewStudent }) => {
  const { currentUser, students } = useAuth();

  const trainerStudents = students.filter((s) => s.trainerId === currentUser?.id);

  // Financial Metrics
  const totalRevenueMonth = trainerStudents.reduce((sum, st) => {
    const monthPayments = (st.payments || []).filter((p) => {
      const pDate = new Date(p.date);
      const now = new Date();
      return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
    });
    return sum + monthPayments.reduce((sub, p) => sub + Number(p.amount), 0);
  }, 0);

  const pendingCount = trainerStudents.filter((st) => st.paymentStatus === "overdue" || st.paymentStatus === "due_soon").length;

  const totalCompletedWorkouts = trainerStudents.reduce(
    (sum, st) => sum + (st.completedWorkouts?.length || 0),
    0
  );

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: "24px",
        background: "linear-gradient(135deg, rgba(18,22,31,0.9) 0%, rgba(0,242,254,0.1) 100%)",
        border: "1px solid rgba(0,242,254,0.2)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="badge badge-cyan" style={{ marginBottom: "8px" }}>🚀 PANEL PRINCIPAL DE ENTRENADOR</span>
            <h1 style={{ fontSize: "1.8rem", margin: "4px 0" }}>
              ¡Hola, <span className="gradient-text">{currentUser?.name}</span>!
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              {currentUser?.brandName || "CR Fitness Studio"} • {currentUser?.specialty}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-primary" onClick={onOpenNewStudent}>
              <PlusCircle size={18} /> Nuevo Alumno
            </button>
            <button className="btn btn-lime" onClick={() => onNavigateTab("payments")}>
              <CreditCard size={18} /> Ver Finanzas y Pagos
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        
        <div
          className="glass-panel"
          style={{ padding: "20px", cursor: "pointer", borderLeft: "4px solid var(--accent-cyan)" }}
          onClick={() => onNavigateTab("students")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Total Alumnos</span>
            <Users size={20} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit", color: "#FFF" }}>
            {trainerStudents.length}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
            Alumnos activos registrados <ArrowRight size={12} color="var(--accent-cyan)" />
          </span>
        </div>

        <div
          className="glass-panel"
          style={{ padding: "20px", cursor: "pointer", borderLeft: "4px solid var(--accent-lime)" }}
          onClick={() => onNavigateTab("payments")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Ingresos del Mes</span>
            <TrendingUp size={20} color="var(--accent-lime)" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit", color: "var(--accent-lime)" }}>
            ${totalRevenueMonth.toLocaleString('es-AR')}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Cobros registrados este mes
          </span>
        </div>

        <div
          className="glass-panel"
          style={{ padding: "20px", cursor: "pointer", borderLeft: "4px solid var(--accent-rose)" }}
          onClick={() => onNavigateTab("payments")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Cuotas Pendientes</span>
            <AlertCircle size={20} color="var(--accent-rose)" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit", color: "var(--accent-rose)" }}>
            {pendingCount}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--accent-rose)" }}>
            Alumnos con vencimiento próximo o vencido
          </span>
        </div>

        <div
          className="glass-panel"
          style={{ padding: "20px", borderLeft: "4px solid var(--accent-purple)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Sesiones Completadas</span>
            <CheckCircle2 size={20} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit", color: "#FFF" }}>
            {totalCompletedWorkouts}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Entrenamientos registrados por alumnos
          </span>
        </div>

      </div>

      {/* Main Grid: Alumnos Recientes & Accesos Rápidos */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        
        {/* Recent Students Table */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem" }}>📋 Mis Alumnos Recientes</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigateTab("students")}>
              Ver Todos ({trainerStudents.length}) <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {trainerStudents.slice(0, 5).map((st) => (
              <div
                key={st.id}
                style={{
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onClick={() => onSelectStudent(st)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <img
                    src={st.avatar}
                    alt={st.name}
                    style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#1A202C" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: "#FFF" }}>{st.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{st.goal}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {st.paymentStatus === "paid" && <span className="badge badge-success">🟢 Al Día</span>}
                  {st.paymentStatus === "due_soon" && <span className="badge badge-warning">🟡 Por Vencer</span>}
                  {st.paymentStatus === "overdue" && <span className="badge badge-danger">🔴 Vencido</span>}
                  <button className="btn btn-secondary btn-sm" style={{ padding: "4px 8px" }}>Ficha</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tools Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div className="glass-panel" style={{ padding: "20px", borderTop: "3px solid var(--accent-cyan)" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              ⚡ Herramientas Rápidas
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: "flex-start", textAlign: "left" }}
                onClick={() => onNavigateTab("routines")}
              >
                <Dumbbell size={18} color="var(--accent-cyan)" /> Creador de Rutinas
              </button>

              <button
                className="btn btn-secondary"
                style={{ justifyContent: "flex-start", textAlign: "left" }}
                onClick={() => onNavigateTab("routines")}
              >
                <FileSpreadsheet size={18} color="var(--accent-lime)" /> Importar Rutina desde Excel
              </button>

              <button
                className="btn btn-secondary"
                style={{ justifyContent: "flex-start", textAlign: "left" }}
                onClick={() => onNavigateTab("payments")}
              >
                <CreditCard size={18} color="var(--accent-amber)" /> Registrar Cobro de Cuota
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "18px", background: "rgba(168,255,0,0.05)", border: "1px solid rgba(168,255,0,0.2)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-lime)", marginBottom: "4px" }}>
              💡 Datos de Cobro Configurados
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Alias: <strong>{currentUser?.alias || "carlos.rivera.fit"}</strong>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "4px" }}>
              Comparte tu alias a tus alumnos para recibir transferencias directas.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
