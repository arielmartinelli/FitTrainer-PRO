import React, { useState } from "react";
import { getRoutines, logCompletedWorkout } from "../../services/storageService";
import { useAuth } from "../../context/AuthContext";
import { RestTimer } from "./RestTimer";
import {
  Dumbbell,
  CheckCircle2,
  Clock,
  Video,
  ExternalLink,
  Flame,
  Award,
  Trophy,
  Calendar
} from "lucide-react";

export const WorkoutTracker = ({ student }) => {
  const { refreshData } = useAuth();
  const routines = getRoutines();
  const routine = routines.find((r) => r.id === student?.assignedRoutineId);

  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [completedSetsMap, setCompletedSetsMap] = useState({});
  const [exerciseWeightsMap, setExerciseWeightsMap] = useState({});
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [studentNote, setStudentNote] = useState("");
  const [sessionCompletedMsg, setSessionCompletedMsg] = useState("");
  const [newPrNotice, setNewPrNotice] = useState("");

  if (!routine || !routine.days || routine.days.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
        <Dumbbell size={40} color="var(--accent-blue)" style={{ marginBottom: "12px" }} />
        <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>Aún no tienes una rutina asignada</h3>
        <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Tu entrenador cargará tu rutina personalizada a la brevedad.</p>
      </div>
    );
  }

  const durationWeeks = routine.durationWeeks || 6;
  const currentDay = routine.days[selectedDayIndex] || routine.days[0];

  // Detectar y actualizar Récord Personal (PR)
  const handleWeightChange = (eIdx, val) => {
    const key = `w${selectedWeek}_d${selectedDayIndex}_e${eIdx}`;
    setExerciseWeightsMap((prev) => ({
      ...prev,
      [key]: val
    }));

    const numWeight = parseFloat(val);
    if (!isNaN(numWeight) && numWeight > 0) {
      const currentExName = currentDay.exercises[eIdx]?.name;
      let previousBest = 0;

      student?.completedWorkouts?.forEach((w) => {
        w.logs?.forEach((l) => {
          if (l.exercise === currentExName && l.bestWeight) {
            const parsed = parseFloat(l.bestWeight);
            if (!isNaN(parsed) && parsed > previousBest) {
              previousBest = parsed;
            }
          }
        });
      });

      if (numWeight > previousBest && previousBest > 0) {
        setNewPrNotice(`🏆 ¡NUEVO RÉCORD PERSONAL! Batiste tu récord en ${currentExName}: ${numWeight} kg`);
        setTimeout(() => setNewPrNotice(""), 4500);
      }
    }
  };

  const toggleSet = (exerciseIndex, setIndex) => {
    const key = `w${selectedWeek}_d${selectedDayIndex}_e${exerciseIndex}_s${setIndex}`;
    setCompletedSetsMap((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const triggerRestTimer = (seconds = 90) => {
    setTimerSeconds(seconds);
  };

  const handleFinishWorkout = (e) => {
    e.preventDefault();
    
    const logs = currentDay.exercises.map((ex, eIdx) => {
      const weight = exerciseWeightsMap[`w${selectedWeek}_d${selectedDayIndex}_e${eIdx}`] || "Según plantilla";
      const setsDone = Array.from({ length: ex.sets }).filter((_, sIdx) => completedSetsMap[`w${selectedWeek}_d${selectedDayIndex}_e${eIdx}_s${sIdx}`]).length;
      return {
        exercise: ex.name,
        setsDone: setsDone || ex.sets,
        bestWeight: weight
      };
    });

    logCompletedWorkout(student.id, {
      dayName: `${currentDay.dayName} (Semana ${selectedWeek} de ${durationWeeks})`,
      weekNumber: selectedWeek,
      durationMinutes: 60,
      studentNotes: studentNote,
      logs
    });

    refreshData();
    setShowFinishModal(false);
    setSessionCompletedMsg(`🎉 ¡Entrenamiento de Semana ${selectedWeek} registrado exitosamente!`);
    setTimeout(() => setSessionCompletedMsg(""), 5000);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* PR Toast Notice */}
      {newPrNotice && (
        <div style={{
          background: "linear-gradient(135deg, #FF9500 0%, #FF2D55 100%)",
          color: "#FFFFFF",
          padding: "14px 18px",
          borderRadius: "var(--radius-md)",
          fontWeight: 800,
          textAlign: "center",
          fontSize: "0.95rem",
          boxShadow: "0 8px 24px rgba(255,149,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }}>
          <Trophy size={20} /> {newPrNotice}
        </div>
      )}

      {/* Session Toast Alert */}
      {sessionCompletedMsg && (
        <div style={{
          background: "var(--accent-green)",
          color: "#FFFFFF",
          padding: "16px",
          borderRadius: "var(--radius-md)",
          fontWeight: 700,
          textAlign: "center",
          fontSize: "0.95rem",
          boxShadow: "0 6px 20px rgba(52,199,89,0.3)"
        }}>
          {sessionCompletedMsg}
        </div>
      )}

      {/* Routine Banner */}
      <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid var(--accent-green)" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          🏋️ PROGRAMA DE {durationWeeks} SEMANAS • ASIGNADO POR TU ENTRENADOR
        </div>
        <h2 style={{ fontSize: "1.35rem", margin: "2px 0", color: "var(--text-primary)" }}>{routine.title}</h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{routine.description}</p>
      </div>

      {/* Selector de Semanas del Programa (Semana 1 de N) */}
      <div className="glass-panel" style={{ padding: "12px 16px" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, uppercase: "true", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={14} color="var(--accent-blue)" /> SELECCIONA LA SEMANA DE ENTRENAMIENTO:
        </div>

        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
          {Array.from({ length: durationWeeks }).map((_, wIdx) => {
            const weekNum = wIdx + 1;
            const isSelected = selectedWeek === weekNum;

            return (
              <button
                key={weekNum}
                className={`btn ${isSelected ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setSelectedWeek(weekNum)}
                style={{ borderRadius: "20px", padding: "6px 14px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
              >
                Semana {weekNum} de {durationWeeks}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de Días (Apple iOS Segmented Pills) */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
        {routine.days.map((day, idx) => (
          <button
            key={idx}
            className={`btn ${selectedDayIndex === idx ? "btn-lime" : "btn-secondary"}`}
            onClick={() => setSelectedDayIndex(idx)}
            style={{ borderRadius: "20px", padding: "8px 16px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
          >
            {day.dayName}
          </button>
        ))}
      </div>

      {/* Current Day Exercises Card */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <span className="badge badge-blue" style={{ marginBottom: "4px" }}>SEMANA {selectedWeek} DE {durationWeeks}</span>
            <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>{currentDay.dayName}</h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              {currentDay.exercises.length} Ejercicios a realizar hoy
            </span>
          </div>

          <button className="btn btn-lime btn-sm" onClick={() => setShowFinishModal(true)}>
            <CheckCircle2 size={16} /> Finalizar Sesión
          </button>
        </div>

        {/* Exercises List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {currentDay.exercises.map((ex, eIdx) => (
            <div
              key={eIdx}
              style={{
                background: "#F2F2F7",
                border: "1px solid var(--border-subtle)",
                borderRadius: "14px",
                padding: "16px"
              }}
            >
              {/* Exercise Header & Video Button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <h4 style={{ fontSize: "1.05rem", color: "var(--text-primary)", fontWeight: 700 }}>
                    {eIdx + 1}. {ex.name}
                  </h4>
                  {ex.notes && (
                    <div style={{ fontSize: "0.8rem", color: "var(--accent-blue)", marginTop: "2px" }}>
                      💡 {ex.notes}
                    </div>
                  )}
                </div>

                {/* BOTÓN VÍDEO DE TÉCNICA */}
                {ex.videoUrl ? (
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: "0.8rem", padding: "6px 12px", borderRadius: "20px", boxShadow: "0 4px 12px rgba(0,122,255,0.2)" }}
                  >
                    <Video size={15} /> 🎥 Ver Video <ExternalLink size={12} />
                  </a>
                ) : (
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + " tecnica ejecucion")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: "0.75rem", padding: "4px 8px", color: "var(--accent-blue)" }}
                  >
                    <Video size={13} /> Buscar Vídeo Demo
                  </a>
                )}
              </div>

              {/* Target Badges */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                <span className="badge badge-blue">{ex.sets} Series</span>
                <span className="badge badge-blue">{ex.reps} Reps</span>
                <span className="badge badge-success">{ex.rpe}</span>
                <span className="badge badge-warning">Descanso: {ex.restSec}s</span>
              </div>

              {/* Set Checklist con inputMode="decimal" */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {Array.from({ length: ex.sets }).map((_, sIdx) => {
                  const key = `w${selectedWeek}_d${selectedDayIndex}_e${eIdx}_s${sIdx}`;
                  const isDone = !!completedSetsMap[key];

                  return (
                    <div
                      key={sIdx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        background: isDone ? "rgba(52, 199, 89, 0.1)" : "#FFFFFF",
                        border: isDone ? "1px solid rgba(52, 199, 89, 0.3)" : "1px solid var(--border-subtle)",
                        borderRadius: "10px",
                        transition: "all 0.16s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggleSet(eIdx, sIdx)}
                          style={{ width: "20px", height: "20px", accentColor: "var(--accent-green)", cursor: "pointer" }}
                        />
                        <span style={{ fontWeight: 600, fontSize: "0.875rem", color: isDone ? "var(--accent-green)" : "var(--text-primary)" }}>
                          Serie {sIdx + 1}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {/* Campo de peso con inputMode="decimal" para celular */}
                        <input
                          type="text"
                          inputMode="decimal"
                          className="form-input"
                          placeholder="Carga (kg)"
                          style={{ width: "100px", padding: "6px 8px", fontSize: "0.85rem", background: isDone ? "#FFFFFF" : "#F2F2F7", textAlign: "center" }}
                          value={exerciseWeightsMap[`w${selectedWeek}_d${selectedDayIndex}_e${eIdx}`] || ""}
                          onChange={(e) => handleWeightChange(eIdx, e.target.value)}
                        />

                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => triggerRestTimer(ex.restSec || 90)}
                          style={{ fontSize: "0.75rem", color: "var(--accent-blue)", padding: "4px 8px" }}
                          title="Temporizador de descanso"
                        >
                          <Clock size={13} /> {ex.restSec}s
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px" }}>
          <button className="btn btn-lime btn-lg" style={{ width: "100%", borderRadius: "14px" }} onClick={() => setShowFinishModal(true)}>
            <CheckCircle2 size={20} /> Completar Sesión de Semana {selectedWeek}
          </button>
        </div>

      </div>

      {/* Floating Rest Timer */}
      {timerSeconds !== null && (
        <RestTimer defaultSeconds={timerSeconds} onClose={() => setTimerSeconds(null)} />
      )}

      {/* Modal Finalizar Entrenamiento */}
      {showFinishModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px"
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: "480px", padding: "24px" }}>
            <h3 style={{ fontSize: "1.2rem", color: "var(--accent-green)", marginBottom: "6px" }}>
              🏆 Finalizar {currentDay.dayName} (Semana {selectedWeek})
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Envía un comentario a tu entrenador sobre la sesión de hoy.
            </p>

            <form onSubmit={handleFinishWorkout}>
              <div className="form-group">
                <label className="form-label">Comentarios o Feedback para el Profesor</label>
                <textarea
                  className="form-textarea"
                  placeholder="Ej: Excelente entrenamiento! En sentadillas subí a 85kg sin molestia..."
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowFinishModal(false)}>
                  Volver a la Rutina
                </button>
                <button type="submit" className="btn btn-lime">
                  Guardar y Notificar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
