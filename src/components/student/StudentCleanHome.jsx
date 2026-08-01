import React from "react";
import { StudentOnboarding } from "./StudentOnboarding";
import { WorkoutTracker } from "./WorkoutTracker";
import { StudentProgress } from "./StudentProgress";
import { getPaymentLabel } from "../../services/billingService";
import { getAdherence, ADHERENCE_LABEL } from "../../services/progressService";
import { Flame } from "lucide-react";

export const StudentCleanHome = ({ student, activeTab = "workout", setActiveTab }) => {
  // El cuestionario se toma directo del alumno del contexto: si el profe lo reabre,
  // el alumno lo ve sin tener que cerrar sesión (antes quedaba fijo en un useState).
  const questionnaireDone = !!student?.questionnaireCompleted;

  if (!questionnaireDone || activeTab === "onboarding") {
    return (
      <StudentOnboarding
        student={student}
        onCompleted={() => setActiveTab?.("workout")}
      />
    );
  }

  if (activeTab === "progress") {
    return <StudentProgress student={student} />;
  }

  const payment = getPaymentLabel(student);
  const adherence = getAdherence(student);
  const adherenceInfo = ADHERENCE_LABEL[adherence.state];

  return (
    <div className="animate-fade-in stack">
      {/* Saludo */}
      <div className="glass-panel" style={{ padding: "18px" }}>
        <div className="row-between">
          <div style={{ minWidth: 0 }}>
            <span className="badge badge-success" style={{ marginBottom: "6px" }}>🏋️ PORTAL DEL ALUMNO</span>
            <h1 style={{ fontSize: "1.5rem", margin: 0 }}>
              ¡Hola, <span style={{ color: "var(--accent-green)" }}>{student.name}</span>!
            </h1>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Objetivo: <strong>{student.goal || "Sin definir"}</strong>
            </p>
          </div>

          <div className="subtle-box" style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>ESTADO DE CUOTA</span>
            <div style={{ marginTop: "4px" }}>
              <span className={`badge ${payment.badge}`}>
                {payment.dot} {payment.text}
              </span>
            </div>
          </div>
        </div>

        {/* Racha de la semana, para que abra la app con una referencia */}
        <div
          className="subtle-box"
          style={{ marginTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
            <Flame size={17} color="var(--accent-orange)" />
            {adherence.thisWeek} {adherence.thisWeek === 1 ? "entrenamiento" : "entrenamientos"} esta semana
          </span>
          <span className={`badge ${adherenceInfo.badge}`}>{adherenceInfo.dot} {adherenceInfo.text}</span>
        </div>
      </div>

      <WorkoutTracker student={student} />
    </div>
  );
};
