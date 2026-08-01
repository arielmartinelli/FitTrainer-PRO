import React, { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { StudentAvatar } from "../common/StudentAvatar";
import { getPaymentStatus, getMonthlyRevenue, getPendingAmount, formatMoney } from "../../services/billingService";
import { getAdherence, ADHERENCE_LABEL } from "../../services/progressService";
import {
  Users,
  AlertCircle,
  Plus,
  CreditCard,
  ArrowRight,
  TrendingUp,
  Flame,
  CheckCircle2,
  BellRing
} from "lucide-react";

export const TrainerCleanDashboard = ({ onNavigateTab, onSelectStudent, onOpenNewStudent }) => {
  const { currentUser, students } = useAuth();

  const trainerStudents = useMemo(
    () => students.filter((s) => s.trainerId === currentUser?.id),
    [students, currentUser?.id]
  );

  // Un solo cálculo de recaudación para toda la app: pagos realmente registrados este mes.
  const revenueMonth = useMemo(() => getMonthlyRevenue(trainerStudents), [trainerStudents]);
  const pendingAmount = useMemo(() => getPendingAmount(trainerStudents), [trainerStudents]);

  const { overdue, dueSoon, inactive, trainedThisWeek } = useMemo(() => {
    const result = { overdue: [], dueSoon: [], inactive: [], trainedThisWeek: 0 };
    trainerStudents.forEach((s) => {
      if (s.status === "revoked") return;
      const status = getPaymentStatus(s);
      if (status === "overdue") result.overdue.push(s);
      else if (status === "due_soon") result.dueSoon.push(s);

      const adherence = getAdherence(s);
      if (adherence.state === "inactive" || adherence.state === "never") result.inactive.push(s);
      if (adherence.thisWeek > 0) result.trainedThisWeek++;
    });
    return result;
  }, [trainerStudents]);

  const activeCount = trainerStudents.filter((s) => s.status !== "revoked").length;

  return (
    <div className="animate-fade-in stack">
      {/* Saludo */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div className="row-between">
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
              {currentUser?.brandName || "Estudio Personal Trainer"}
            </span>
            <h1 style={{ fontSize: "1.6rem", margin: "2px 0" }}>
              Hola, <span style={{ color: "var(--accent-blue)" }}>{currentUser?.name}</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
              {activeCount} {activeCount === 1 ? "alumno activo" : "alumnos activos"} · {trainedThisWeek} entrenaron esta semana
            </p>
          </div>

          <div className="action-row">
            <button className="btn btn-primary" onClick={onOpenNewStudent}>
              <Plus size={18} /> Nuevo Alumno
            </button>
            <button className="btn btn-lime" onClick={() => onNavigateTab("payments")}>
              <CreditCard size={18} /> Cobros
            </button>
          </div>
        </div>
      </div>

      {/* Alertas: lo primero que un profe necesita ver al abrir la app */}
      {(overdue.length > 0 || inactive.length > 0 || dueSoon.length > 0) && (
        <div className="glass-panel" style={{ padding: "16px", borderLeft: "4px solid var(--accent-orange)" }}>
          <h3 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <BellRing size={18} color="var(--accent-orange)" /> Necesitan tu atención
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {overdue.length > 0 && (
              <button className="subtle-box" onClick={() => onNavigateTab("payments")} style={alertRowStyle}>
                <span>🔴 <strong>{overdue.length}</strong> {overdue.length === 1 ? "cuota vencida" : "cuotas vencidas"}</span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  {overdue.slice(0, 2).map((s) => s.name.split(" ")[0]).join(", ")}
                  {overdue.length > 2 ? ` +${overdue.length - 2}` : ""} <ArrowRight size={13} />
                </span>
              </button>
            )}

            {dueSoon.length > 0 && (
              <button className="subtle-box" onClick={() => onNavigateTab("payments")} style={alertRowStyle}>
                <span>🟡 <strong>{dueSoon.length}</strong> {dueSoon.length === 1 ? "cuota vence pronto" : "cuotas vencen pronto"}</span>
                <ArrowRight size={13} color="var(--text-secondary)" />
              </button>
            )}

            {inactive.length > 0 && (
              <button className="subtle-box" onClick={() => onNavigateTab("students")} style={alertRowStyle}>
                <span>😴 <strong>{inactive.length}</strong> {inactive.length === 1 ? "alumno sin entrenar" : "alumnos sin entrenar"}</span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  {inactive.slice(0, 2).map((s) => s.name.split(" ")[0]).join(", ")}
                  {inactive.length > 2 ? ` +${inactive.length - 2}` : ""} <ArrowRight size={13} />
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Métricas */}
      <div className="grid-auto">
        <button className="glass-panel" style={metricCardStyle("var(--accent-blue)")} onClick={() => onNavigateTab("students")}>
          <div className="row-between" style={{ marginBottom: "4px", gap: "6px" }}>
            <span style={metricLabelStyle}>ALUMNOS ACTIVOS</span>
            <Users size={19} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800 }}>{activeCount}</div>
          <span style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>Ver fichas y rutinas →</span>
        </button>

        <button className="glass-panel" style={metricCardStyle("var(--accent-green)")} onClick={() => onNavigateTab("payments")}>
          <div className="row-between" style={{ marginBottom: "4px", gap: "6px" }}>
            <span style={metricLabelStyle}>COBRADO ESTE MES</span>
            <TrendingUp size={19} color="var(--accent-green)" />
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--accent-green)" }}>{formatMoney(revenueMonth)}</div>
          <span style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>Pagos registrados</span>
        </button>

        <button className="glass-panel" style={metricCardStyle("var(--accent-red)")} onClick={() => onNavigateTab("payments")}>
          <div className="row-between" style={{ marginBottom: "4px", gap: "6px" }}>
            <span style={metricLabelStyle}>PENDIENTE DE COBRO</span>
            <AlertCircle size={19} color="var(--accent-red)" />
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--accent-red)" }}>{formatMoney(pendingAmount)}</div>
          <span style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>
            {overdue.length} {overdue.length === 1 ? "vencida" : "vencidas"} · {dueSoon.length} por vencer
          </span>
        </button>
      </div>

      {/* Alumnos */}
      <div className="glass-panel" style={{ padding: "18px" }}>
        <div className="row-between" style={{ marginBottom: "12px" }}>
          <h3 style={{ fontSize: "1.05rem" }}>Tus alumnos</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigateTab("students")}>
            Ver todos ({trainerStudents.length}) <ArrowRight size={14} />
          </button>
        </div>

        {trainerStudents.length === 0 ? (
          <div style={{ padding: "28px 12px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.88rem" }}>
            Todavía no tenés alumnos. Creá el primero para empezar a cargar rutinas y cuotas.
            <div style={{ marginTop: "14px" }}>
              <button className="btn btn-primary" onClick={onOpenNewStudent}>
                <Plus size={16} /> Crear mi primer alumno
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {trainerStudents.slice(0, 6).map((st) => {
              const adherence = getAdherence(st);
              const info = ADHERENCE_LABEL[adherence.state];
              const paymentStatus = getPaymentStatus(st);

              return (
                <button key={st.id} className="subtle-box" onClick={() => onSelectStudent(st)} style={studentRowStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0, flex: 1 }}>
                    <StudentAvatar gender={st.gender} name={st.name} size={40} />
                    <div style={{ minWidth: 0, textAlign: "left" }}>
                      <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.name}</div>
                      <div style={{ fontSize: "0.73rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "5px" }}>
                        <Flame size={11} color="var(--accent-orange)" />
                        {adherence.thisWeek} esta semana
                        {!st.questionnaireCompleted && <span style={{ color: "var(--accent-red)" }}>· sin cuestionario</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    {paymentStatus === "overdue" && <span className="badge badge-danger">🔴</span>}
                    {paymentStatus === "due_soon" && <span className="badge badge-warning">🟡</span>}
                    <span className={`badge ${info.badge}`}>{info.dot}</span>
                    {st.questionnaireCompleted ? (
                      <CheckCircle2 size={17} color="var(--accent-green)" />
                    ) : (
                      <AlertCircle size={17} color="var(--accent-red)" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const metricLabelStyle = {
  fontSize: "0.72rem",
  color: "var(--text-secondary)",
  fontWeight: 700,
  letterSpacing: "0.02em"
};

const metricCardStyle = (color) => ({
  padding: "16px",
  cursor: "pointer",
  borderLeft: `4px solid ${color}`,
  textAlign: "left",
  fontFamily: "inherit",
  display: "block",
  width: "100%"
});

const alertRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "0.85rem",
  textAlign: "left",
  width: "100%",
  color: "var(--text-primary)",
  minHeight: "44px"
};

const studentRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  width: "100%",
  color: "var(--text-primary)",
  padding: "10px 12px"
};
