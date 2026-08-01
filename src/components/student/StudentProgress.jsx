import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { logBodyWeight } from "../../services/storageService";
import { Modal } from "../common/Modal";
import { MiniLineChart } from "../common/MiniLineChart";
import {
  getBodyWeightSeries,
  getExerciseProgress,
  getAdherence,
  getLast7Days,
  getWorkouts,
  ADHERENCE_LABEL
} from "../../services/progressService";
import { toISODate } from "../../services/billingService";
import { TrendingUp, Scale, Dumbbell, Flame, Trophy, CalendarCheck, ChevronDown, ChevronUp } from "lucide-react";

export const StudentProgress = ({ student }) => {
  const { refreshData } = useAuth();
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const weightSeries = useMemo(() => getBodyWeightSeries(student), [student]);
  const exercises = useMemo(() => getExerciseProgress(student), [student]);
  const adherence = useMemo(() => getAdherence(student), [student]);
  const week = useMemo(() => getLast7Days(student), [student]);
  const workouts = useMemo(() => getWorkouts(student), [student]);

  const [weightForm, setWeightForm] = useState({
    date: toISODate(new Date()),
    weightKg: weightSeries[weightSeries.length - 1]?.weight || ""
  });

  const handleAddWeight = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await logBodyWeight(student.id, weightForm.weightKg, weightForm.date);
      await refreshData();
      setShowWeightModal(false);
    } finally {
      setSaving(false);
    }
  };

  const adherenceInfo = ADHERENCE_LABEL[adherence.state];
  const visibleHistory = showAllHistory ? workouts : workouts.slice(0, 5);

  return (
    <div className="animate-fade-in stack">
      {/* Resumen */}
      <div className="glass-panel" style={{ padding: "18px" }}>
        <div className="row-between" style={{ marginBottom: "14px" }}>
          <h2 style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={22} color="var(--accent-green)" /> Mi Progreso
          </h2>
          <span className={`badge ${adherenceInfo.badge}`}>
            {adherenceInfo.dot} {adherenceInfo.text}
          </span>
        </div>

        <div className="stat-grid">
          <div className="subtle-box">
            <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>ESTA SEMANA</span>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-green)" }}>
              {adherence.thisWeek}
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}> sesiones</span>
            </div>
          </div>
          <div className="subtle-box">
            <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>TOTAL</span>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-blue)" }}>
              {adherence.total}
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}> entrenos</span>
            </div>
          </div>
          <div className="subtle-box">
            <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>ÚLTIMO</span>
            <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>
              {adherence.daysSince === null ? "—" : adherence.daysSince === 0 ? "Hoy" : `${adherence.daysSince}d`}
            </div>
          </div>
        </div>

        {/* Mini calendario de la semana */}
        <div style={{ display: "flex", gap: "6px", marginTop: "14px", justifyContent: "space-between" }}>
          {week.map((d) => (
            <div key={d.iso} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "4px" }}>{d.label}</div>
              <div
                title={d.iso}
                style={{
                  height: "34px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: d.trained ? "var(--accent-green)" : "var(--bg-subtle)",
                  border: d.trained ? "none" : "1px solid var(--border-subtle)",
                  color: "#FFFFFF"
                }}
              >
                {d.trained && <Flame size={16} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Peso corporal */}
      <div className="glass-panel" style={{ padding: "18px" }}>
        <div className="row-between" style={{ marginBottom: "10px" }}>
          <h3 style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <Scale size={18} color="var(--accent-indigo)" /> Peso corporal
          </h3>
          <button className="btn btn-lime btn-sm" onClick={() => setShowWeightModal(true)}>
            <Scale size={14} /> Registrar peso
          </button>
        </div>

        <MiniLineChart points={weightSeries} color="var(--accent-indigo)" unit="kg" />
      </div>

      {/* Evolución de cargas */}
      <div className="glass-panel" style={{ padding: "18px" }}>
        <h3 style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <Dumbbell size={18} color="var(--accent-blue)" /> Evolución de cargas
        </h3>

        {exercises.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Cuando registres el peso que levantás en cada serie, vas a ver acá cómo progresás ejercicio por ejercicio.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {exercises.map((ex) => {
              const open = expandedExercise === ex.exercise;
              return (
                <div key={ex.exercise} className="subtle-box" style={{ padding: "12px 14px" }}>
                  <button
                    onClick={() => setExpandedExercise(open ? null : ex.exercise)}
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: "inherit",
                      textAlign: "left"
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis" }}>{ex.exercise}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        <Trophy size={11} style={{ verticalAlign: "-1px" }} /> Récord: <strong>{ex.best} kg</strong> · {ex.points.length} registros
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      {ex.delta !== 0 && (
                        <span className={`badge ${ex.delta > 0 ? "badge-success" : "badge-warning"}`}>
                          {ex.delta > 0 ? "+" : ""}
                          {Number(ex.delta.toFixed(1))} kg
                        </span>
                      )}
                      {open ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                    </div>
                  </button>

                  {open && (
                    <div style={{ marginTop: "12px" }} className="animate-fade-in">
                      <MiniLineChart points={ex.points} color="var(--accent-blue)" unit="kg" height={130} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="glass-panel" style={{ padding: "18px" }}>
        <h3 style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <CalendarCheck size={18} color="var(--accent-orange)" /> Historial de entrenamientos
        </h3>

        {workouts.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Todavía no completaste ninguna sesión.</p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {visibleHistory.map((w) => (
                <div key={w.id} className="subtle-box" style={{ padding: "12px 14px" }}>
                  <div className="row-between" style={{ gap: "8px", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "0.88rem", color: "var(--accent-blue)" }}>{w.dayName}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{w.date}</span>
                  </div>
                  {w.studentNotes && (
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontStyle: "italic", marginBottom: "6px" }}>
                      “{w.studentNotes}”
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    {(w.logs || []).map((l, i) => (
                      <div key={i} style={{ fontSize: "0.78rem", display: "flex", justifyContent: "space-between", gap: "10px" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>• {l.exercise}</span>
                        <span style={{ fontWeight: 700, color: "var(--accent-green)", flexShrink: 0 }}>
                          {l.setsDone} series {l.bestWeight ? `· ${l.bestWeight}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {workouts.length > 5 && (
              <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: "10px" }} onClick={() => setShowAllHistory(!showAllHistory)}>
                {showAllHistory ? "Ver menos" : `Ver los ${workouts.length} entrenamientos`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Modal registrar peso */}
      <Modal isOpen={showWeightModal} onClose={() => setShowWeightModal(false)} title="Registrar peso corporal">
        <form onSubmit={handleAddWeight}>
          <div className="form-group">
            <label className="form-label" htmlFor="bw-date">Fecha</label>
            <input
              id="bw-date"
              type="date"
              className="form-input"
              value={weightForm.date}
              onChange={(e) => setWeightForm({ ...weightForm, date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="bw-kg">Peso (kg)</label>
            <input
              id="bw-kg"
              type="text"
              inputMode="decimal"
              className="form-input"
              placeholder="Ej: 78.4"
              value={weightForm.weightKg}
              onChange={(e) => setWeightForm({ ...weightForm, weightKg: e.target.value })}
              required
            />
          </div>

          <div className="action-row" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowWeightModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-lime" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
