import React, { useState } from "react";
import { StudentOnboarding } from "./StudentOnboarding";
import { WorkoutTracker } from "./WorkoutTracker";
import { Dumbbell, ClipboardList, CheckCircle2 } from "lucide-react";

export const StudentCleanHome = ({ student, activeTab = "workout", setActiveTab }) => {
  const [onboardingDone, setOnboardingDone] = useState(student?.questionnaireCompleted || false);

  if (!onboardingDone || activeTab === "onboarding") {
    return (
      <StudentOnboarding
        student={student}
        onCompleted={() => {
          setOnboardingDone(true);
          if (setActiveTab) setActiveTab("workout");
        }}
      />
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Student Greeting Banner */}
      <div className="glass-panel" style={{ padding: "20px", background: "#FFFFFF" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span className="badge badge-success" style={{ marginBottom: "6px" }}>🏋️ PORTAL DEL ALUMNO</span>
            <h1 style={{ fontSize: "1.6rem", margin: 0 }}>
              ¡Hola, <span style={{ color: "var(--accent-green)" }}>{student.name}</span>!
            </h1>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Objetivo: <strong>{student.goal}</strong>
            </p>
          </div>

          <div style={{ background: "#F2F2F7", padding: "10px 14px", borderRadius: "12px", textAlign: "right" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>ESTADO DE CUOTA</span>
            <div style={{ marginTop: "2px" }}>
              {student.paymentStatus === "paid" && <span className="badge badge-success">🟢 Al Día ({student.nextDueDate})</span>}
              {student.paymentStatus === "due_soon" && <span className="badge badge-warning">🟡 Vence: {student.nextDueDate}</span>}
              {student.paymentStatus === "overdue" && <span className="badge badge-danger">🔴 Cuota Pendiente</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Gym Workout Tracker */}
      <WorkoutTracker student={student} />

    </div>
  );
};
