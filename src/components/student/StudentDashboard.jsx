import React from "react";
import { WorkoutTracker } from "./WorkoutTracker";
import { StudentProgress } from "./StudentProgress";
import {
  Dumbbell,
  Zap,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

export const StudentDashboard = ({ student, activeTab, setActiveTab }) => {
  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Student Welcome Header */}
      <div
        className="glass-panel"
        style={{
          padding: "24px",
          background: "linear-gradient(135deg, rgba(18,22,31,0.95) 0%, rgba(168,255,0,0.1) 100%)",
          border: "1px solid rgba(168,255,0,0.2)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="badge badge-success" style={{ marginBottom: "8px" }}>🏋️ PORTAL DEL ALUMNO</span>
            <h1 style={{ fontSize: "1.8rem", margin: "4px 0" }}>
              ¡Hola, <span style={{ color: "var(--accent-lime)" }}>{student.name}</span>!
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Objetivo: <strong style={{ color: "#FFF" }}>{student.goal}</strong> • Ingreso: {student.joinDate}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className={`btn ${activeTab === "student-home" ? "btn-lime" : "btn-secondary"}`}
              onClick={() => setActiveTab("student-home")}
            >
              <Dumbbell size={18} /> Mi Rutina
            </button>
            <button
              className={`btn ${activeTab === "student-progress" ? "btn-lime" : "btn-secondary"}`}
              onClick={() => setActiveTab("student-progress")}
            >
              <Zap size={18} /> Mi Peso & Evolución
            </button>
          </div>
        </div>
      </div>

      {/* Payment & Subscription Status Bar */}
      <div className="glass-panel" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <DollarSign size={20} color="var(--accent-lime)" />
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Estado de Tu Cuota:</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, marginLeft: "6px" }}>
              {student.planName || "Plan Mensual"} (${(student.planPrice || 25000).toLocaleString('es-AR')})
            </span>
          </div>
        </div>

        <div>
          {student.paymentStatus === "paid" && (
            <span className="badge badge-success">🟢 Al Día (Vence: {student.nextDueDate})</span>
          )}
          {student.paymentStatus === "due_soon" && (
            <span className="badge badge-warning">🟡 Próximo Vencimiento: {student.nextDueDate}</span>
          )}
          {student.paymentStatus === "overdue" && (
            <span className="badge badge-danger">🔴 Cuota Pendiente</span>
          )}
        </div>
      </div>

      {/* Dynamic Tab View */}
      {activeTab === "student-home" && (
        <WorkoutTracker student={student} />
      )}

      {activeTab === "student-progress" && (
        <StudentProgress student={student} />
      )}

    </div>
  );
};
