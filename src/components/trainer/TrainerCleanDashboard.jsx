import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { StudentAvatar } from "../common/StudentAvatar";
import {
  Users,
  DollarSign,
  AlertCircle,
  Plus,
  CreditCard,
  ArrowRight,
  TrendingUp,
  CheckCircle2
} from "lucide-react";

export const TrainerCleanDashboard = ({ onNavigateTab, onSelectStudent, onOpenNewStudent }) => {
  const { currentUser, students } = useAuth();
  const [activeTooltipStudentId, setActiveTooltipStudentId] = useState(null);

  const trainerStudents = students.filter((s) => s.trainerId === currentUser?.id);

  const totalRevenueMonth = trainerStudents.reduce((sum, st) => {
    const monthPayments = (st.payments || []).filter((p) => {
      const pDate = new Date(p.date);
      const now = new Date();
      return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
    });
    return sum + monthPayments.reduce((sub, p) => sub + Number(p.amount), 0);
  }, 0);

  const pendingCount = trainerStudents.filter(
    (st) => st.paymentStatus === "overdue" || st.paymentStatus === "due_soon"
  ).length;

  const toggleTooltip = (e, studentId) => {
    e.stopPropagation();
    setActiveTooltipStudentId(activeTooltipStudentId === studentId ? null : studentId);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Apple Greeting Banner */}
      <div className="glass-panel" style={{ padding: "24px", background: "#FFFFFF" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
              {currentUser?.brandName || "Estudio Personal Trainer"}
            </span>
            <h1 style={{ fontSize: "1.75rem", margin: "2px 0" }}>
              Hola, <span style={{ color: "var(--accent-blue)" }}>{currentUser?.name}</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Resumen de tus alumnos activos, rutinas y cobranzas.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-primary" onClick={onOpenNewStudent}>
              <Plus size={18} /> Nuevo Alumno
            </button>
            <button className="btn btn-lime" onClick={() => onNavigateTab("payments")}>
              <CreditCard size={18} /> Ver Cobros
            </button>
          </div>
        </div>
      </div>

      {/* Metric Widgets (Apple Fitness Style) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        
        <div className="glass-panel" style={{ padding: "18px", cursor: "pointer", borderLeft: "4px solid var(--accent-blue)" }} onClick={() => onNavigateTab("students")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>ALUMNOS ACTIVOS</span>
            <Users size={20} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>{trainerStudents.length}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Ver fichas y rutinas <ArrowRight size={12} /></span>
        </div>

        <div className="glass-panel" style={{ padding: "18px", cursor: "pointer", borderLeft: "4px solid var(--accent-green)" }} onClick={() => onNavigateTab("payments")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>RECAUDACIÓN MES</span>
            <TrendingUp size={20} color="var(--accent-green)" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-green)" }}>
            ${totalRevenueMonth.toLocaleString('es-AR')}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total abonado en el mes</span>
        </div>

        <div className="glass-panel" style={{ padding: "18px", cursor: "pointer", borderLeft: "4px solid var(--accent-red)" }} onClick={() => onNavigateTab("payments")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>CUOTAS PENDIENTES</span>
            <AlertCircle size={20} color="var(--accent-red)" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-red)" }}>{pendingCount}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--accent-red)" }}>Por vencer o vencidas</span>
        </div>

      </div>

      {/* Recent Students */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "1.1rem" }}>📋 Tus Alumnos Asignados</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigateTab("students")}>
            Ver Todos ({trainerStudents.length}) <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {trainerStudents.slice(0, 5).map((st) => {
            const isDone = st.questionnaireCompleted;
            const showTooltip = activeTooltipStudentId === st.id;

            return (
              <div
                key={st.id}
                style={{
                  padding: "12px 14px",
                  background: "#F2F2F7",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer"
                }}
                onClick={() => onSelectStudent(st)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <StudentAvatar gender={st.gender} name={st.name} size={42} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{st.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{st.goal}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  
                  {/* ICONO DEL CUESTIONARIO (SIN TEXTO POR DEFECTO, CON CLIC DESPLEGABLE) */}
                  <div
                    style={{ position: "relative", cursor: "pointer" }}
                    onClick={(e) => toggleTooltip(e, st.id)}
                    title="Haz clic para ver el estado del cuestionario"
                  >
                    {isDone ? (
                      <div style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        background: "rgba(52, 199, 89, 0.15)",
                        border: "1px solid rgba(52, 199, 89, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <CheckCircle2 size={18} color="#34C759" />
                      </div>
                    ) : (
                      <div style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        background: "rgba(255, 59, 48, 0.15)",
                        border: "1px solid rgba(255, 59, 48, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <AlertCircle size={18} color="#FF3B30" />
                      </div>
                    )}

                    {/* Texto desplegable solo al hacer clic en el icono */}
                    {showTooltip && (
                      <div style={{
                        position: "absolute",
                        right: 0,
                        top: "40px",
                        background: "#1C1C1E",
                        color: "#FFFFFF",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        whiteSpace: "nowrap",
                        zIndex: 10,
                        boxShadow: "0 4px 14px rgba(0,0,0,0.2)"
                      }}>
                        {isDone ? "✔️ Cuestionario Realizado" : "❗ Cuestionario Pendiente"}
                      </div>
                    )}
                  </div>

                  <button className="btn btn-secondary btn-sm">Ver Ficha</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
