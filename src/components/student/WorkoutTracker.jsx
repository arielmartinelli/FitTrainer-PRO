import React, { useState, useEffect, useMemo, useCallback } from "react";
import { logCompletedWorkout } from "../../services/storageService";
import { useAuth } from "../../context/AuthContext";
import { RestTimer } from "./RestTimer";
import { RoutineFileViewer } from "../common/RoutineFileViewer";
import { getPersonalRecord, parseWeight } from "../../services/progressService";
import {
  Dumbbell,
  CheckCircle2,
  Clock,
  Video,
  ExternalLink,
  Trophy,
  Calendar,
  History,
  Loader2
} from "lucide-react";

const DRAFT_KEY = (studentId) => `fittrainer_workout_draft_${studentId}`;

/** Lee el borrador guardado del entrenamiento en curso. */
const readDraft = (studentId) => {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY(studentId)) || "{}");
  } catch {
    return {};
  }
};

export const WorkoutTracker = ({ student }) => {
  const { refreshData, routines } = useAuth();

  // Antes leía localStorage directo en cada render e ignoraba las rutinas del contexto.
  const routine = useMemo(
    () => routines.find((r) => r.id === student?.assignedRoutineId),
    [routines, student?.assignedRoutineId]
  );

  // Si el profe le cambió la rutina, el borrador viejo ya no aplica.
  const draft = useMemo(() => {
    const saved = readDraft(student?.id);
    return saved.routineId && saved.routineId !== student?.assignedRoutineId ? {} : saved;
  }, [student?.id, student?.assignedRoutineId]);

  const [selectedWeek, setSelectedWeek] = useState(draft.week || 1);
  const [selectedDayIndex, setSelectedDayIndex] = useState(draft.dayIndex || 0);
  const [entries, setEntries] = useState(draft.entries || {}); // { "s0": {done, weight, reps} }
  const [sessionNotes, setSessionNotes] = useState(draft.notes || "");
  // `nonce` obliga a remontar el cronómetro para que reinicie aunque sean los mismos segundos.
  const [restTimer, setRestTimer] = useState(null); // { seconds, nonce }
  const [sessionCompletedMsg, setSessionCompletedMsg] = useState("");
  const [prNotice, setPrNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const durationWeeks = routine?.durationWeeks || 6;
  const currentDay = routine?.days?.[selectedDayIndex] || routine?.days?.[0];

  /**
   * Persiste el borrador ante cualquier cambio.
   * Antes todo esto vivía solo en memoria: si el alumno bloqueaba el celular
   * o entraba una llamada, perdía el entrenamiento entero.
   */
  useEffect(() => {
    if (!student?.id || !routine) return;
    localStorage.setItem(
      DRAFT_KEY(student.id),
      JSON.stringify({
        routineId: routine.id,
        week: selectedWeek,
        dayIndex: selectedDayIndex,
        entries,
        notes: sessionNotes,
        savedAt: new Date().toISOString()
      })
    );
  }, [student?.id, routine, selectedWeek, selectedDayIndex, entries, sessionNotes]);

  // Cada serie tiene su propia clave: antes todas las series compartían el mismo peso.
  const setKey = useCallback(
    (exerciseIndex, setIndex) => `w${selectedWeek}_d${selectedDayIndex}_e${exerciseIndex}_s${setIndex}`,
    [selectedWeek, selectedDayIndex]
  );

  const getEntry = (exerciseIndex, setIndex) => entries[setKey(exerciseIndex, setIndex)] || {};

  const updateEntry = (exerciseIndex, setIndex, patch) => {
    const key = setKey(exerciseIndex, setIndex);
    setEntries((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  /** Registro de la última vez que hizo este ejercicio, para saber con qué carga arrancar. */
  const lastSessionByExercise = useMemo(() => {
    const map = {};
    (student?.completedWorkouts || []).forEach((w) => {
      (w.logs || []).forEach((l) => {
        if (!map[l.exercise]) map[l.exercise] = { date: w.date, weights: l.setWeights || [], best: l.bestWeight };
      });
    });
    return map;
  }, [student?.completedWorkouts]);

  const handleWeightChange = (exerciseIndex, setIndex, value) => {
    updateEntry(exerciseIndex, setIndex, { weight: value });

    const weight = parseWeight(value);
    const exerciseName = currentDay?.exercises?.[exerciseIndex]?.name;
    if (!weight || !exerciseName) return;

    // PR corregido: antes exigía previousBest > 0, así que el primer récord nunca avisaba.
    const previousBest = getPersonalRecord(student, exerciseName);
    if (weight > previousBest) {
      setPrNotice(
        previousBest > 0
          ? `¡Nuevo récord en ${exerciseName}! ${weight} kg (antes ${previousBest} kg)`
          : `¡Primer registro en ${exerciseName}: ${weight} kg!`
      );
    }
  };

  useEffect(() => {
    if (!prNotice) return;
    const t = setTimeout(() => setPrNotice(""), 4500);
    return () => clearTimeout(t);
  }, [prNotice]);

  const startRest = (restSec) => setRestTimer({ seconds: Number(restSec) || 90, nonce: Date.now() });

  const toggleSet = (exerciseIndex, setIndex, restSec) => {
    const entry = getEntry(exerciseIndex, setIndex);
    const nowDone = !entry.done;
    updateEntry(exerciseIndex, setIndex, { done: nowDone });
    // Al completar una serie arranca el descanso solo.
    if (nowDone) startRest(restSec);
  };

  const totalSets = useMemo(
    () => (currentDay?.exercises || []).reduce((sum, ex) => sum + (Number(ex.sets) || 0), 0),
    [currentDay]
  );

  const doneSets = useMemo(
    () =>
      (currentDay?.exercises || []).reduce(
        (sum, ex, eIdx) =>
          sum + Array.from({ length: Number(ex.sets) || 0 }).filter((_, sIdx) => getEntry(eIdx, sIdx).done).length,
        0
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentDay, entries, selectedWeek, selectedDayIndex]
  );

  const progressPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  const handleFinishWorkout = async () => {
    if (saving || !currentDay) return;
    if (doneSets === 0 && !confirm("No marcaste ninguna serie como completada. ¿Guardar igual la sesión?")) return;

    setSaving(true);
    try {
      const logs = currentDay.exercises.map((ex, eIdx) => {
        const count = Number(ex.sets) || 0;
        const setWeights = [];
        let setsDone = 0;
        let best = 0;

        for (let sIdx = 0; sIdx < count; sIdx++) {
          const entry = getEntry(eIdx, sIdx);
          if (entry.done) setsDone++;
          const weight = parseWeight(entry.weight);
          setWeights.push({
            set: sIdx + 1,
            weight: entry.weight || "",
            reps: entry.reps || "",
            done: !!entry.done
          });
          if (weight && weight > best) best = weight;
        }

        return {
          exercise: ex.name,
          setsDone,
          setsPlanned: count,
          setWeights,
          bestWeight: best > 0 ? `${best} kg` : ""
        };
      });

      await logCompletedWorkout(student.id, {
        dayName: `${currentDay.dayName} · Semana ${selectedWeek}/${durationWeeks}`,
        weekNumber: selectedWeek,
        durationMinutes: 60,
        studentNotes: sessionNotes.trim(),
        logs
      });

      await refreshData();

      // Sesión cerrada: se limpia el borrador.
      localStorage.removeItem(DRAFT_KEY(student.id));
      setEntries({});
      setSessionNotes("");
      setSessionCompletedMsg(`🎉 ¡${currentDay.dayName} registrado! ${doneSets} de ${totalSets} series completadas.`);
      setTimeout(() => setSessionCompletedMsg(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Rutina subida como archivo: el profesor cargó su plan como foto, PDF o
   * planilla. No hay series que tildar, pero el alumno igual puede registrar
   * que entrenó para que la adherencia y el historial sigan funcionando.
   */
  if (routine?.kind === "file") {
    return (
      <RutinaEnArchivo
        routine={routine}
        student={student}
        onRegistrado={(mensaje) => {
          setSessionCompletedMsg(mensaje);
          setTimeout(() => setSessionCompletedMsg(""), 5000);
        }}
        mensaje={sessionCompletedMsg}
      />
    );
  }

  if (!routine || !routine.days || routine.days.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
        <Dumbbell size={40} color="var(--accent-blue)" style={{ marginBottom: "12px" }} />
        <h3 style={{ fontSize: "1.15rem", color: "var(--text-primary)" }}>Todavía no tenés una rutina asignada</h3>
        <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Tu entrenador va a cargarte la rutina personalizada a la brevedad.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in stack">
      {/* Avisos */}
      {prNotice && (
        <div
          className="animate-fade-in"
          style={{
            background: "linear-gradient(135deg, #FF9500 0%, #FF2D55 100%)",
            color: "#FFFFFF",
            padding: "14px 18px",
            borderRadius: "var(--radius-md)",
            fontWeight: 700,
            textAlign: "center",
            fontSize: "0.9rem",
            boxShadow: "0 8px 24px rgba(255,149,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <Trophy size={20} /> {prNotice}
        </div>
      )}

      {sessionCompletedMsg && (
        <div
          style={{
            background: "var(--accent-green)",
            color: "#FFFFFF",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            fontWeight: 700,
            textAlign: "center",
            fontSize: "0.9rem",
            boxShadow: "0 6px 20px rgba(52,199,89,0.3)"
          }}
        >
          {sessionCompletedMsg}
        </div>
      )}

      {/* Rutina */}
      <div className="glass-panel" style={{ padding: "18px", borderLeft: "4px solid var(--accent-green)" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Programa de {durationWeeks} semanas · asignado por tu entrenador
        </div>
        <h2 style={{ fontSize: "1.25rem", margin: "3px 0" }}>{routine.title}</h2>
        {routine.description && <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{routine.description}</p>}
      </div>

      {/* Semana */}
      <div className="glass-panel" style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={14} color="var(--accent-blue)" /> SEMANA DE ENTRENAMIENTO
        </div>
        <div className="scroll-x-wrap">
          <div className="scroll-x">
            {Array.from({ length: durationWeeks }).map((_, wIdx) => {
              const weekNum = wIdx + 1;
              return (
                <button
                  key={weekNum}
                  className={`btn btn-sm ${selectedWeek === weekNum ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setSelectedWeek(weekNum)}
                  style={{ borderRadius: "20px" }}
                >
                  Semana {weekNum}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Días */}
      <div className="scroll-x-wrap">
        <div className="scroll-x">
          {routine.days.map((day, idx) => (
            <button
              key={idx}
              className={`btn btn-sm ${selectedDayIndex === idx ? "btn-lime" : "btn-secondary"}`}
              onClick={() => setSelectedDayIndex(idx)}
              style={{ borderRadius: "20px" }}
            >
              {day.dayName}
            </button>
          ))}
        </div>
      </div>

      {/* Ejercicios del día */}
      <div className="glass-panel" style={{ padding: "16px" }}>
        <div style={{ marginBottom: "14px" }}>
          <span className="badge badge-blue">SEMANA {selectedWeek} DE {durationWeeks}</span>
          <h3 style={{ fontSize: "1.1rem", marginTop: "6px" }}>{currentDay.dayName}</h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {currentDay.exercises.length} ejercicios · {doneSets}/{totalSets} series
          </span>

          {/* Barra de avance de la sesión */}
          <div style={{ width: "100%", height: "8px", background: "var(--bg-subtle)", borderRadius: "4px", overflow: "hidden", marginTop: "10px" }}>
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: progressPct === 100 ? "var(--accent-green)" : "var(--accent-blue)",
                transition: "width 0.25s ease"
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {currentDay.exercises.map((ex, eIdx) => {
            const setCount = Number(ex.sets) || 0;
            const previous = lastSessionByExercise[ex.name];
            const pr = getPersonalRecord(student, ex.name);

            return (
              <div
                key={eIdx}
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "14px",
                  padding: "14px"
                }}
              >
                <div style={{ marginBottom: "10px" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.3 }}>
                    {eIdx + 1}. {ex.name}
                  </h4>
                  {ex.notes && (
                    <div style={{ fontSize: "0.78rem", color: "var(--accent-blue)", marginTop: "3px" }}>💡 {ex.notes}</div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <span className="badge badge-blue">{ex.sets} series</span>
                  <span className="badge badge-blue">{ex.reps} reps</span>
                  {ex.rpe && <span className="badge badge-success">{ex.rpe}</span>}
                  <span className="badge badge-warning">Descanso {ex.restSec}s</span>
                  {pr > 0 && <span className="badge badge-neutral">🏆 PR {pr} kg</span>}
                </div>

                {/* Referencia de la última vez */}
                {previous && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      marginBottom: "10px"
                    }}
                  >
                    <History size={13} />
                    Última vez ({previous.date}):{" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      {previous.weights?.length
                        ? previous.weights.filter((s) => s.weight).map((s) => s.weight).join(" · ")
                        : previous.best || "sin registro"}
                    </strong>
                  </div>
                )}

                {/* Series */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {Array.from({ length: setCount }).map((_, sIdx) => {
                    const entry = getEntry(eIdx, sIdx);
                    const isDone = !!entry.done;

                    return (
                      <div
                        key={sIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          background: isDone ? "rgba(52, 199, 89, 0.1)" : "var(--bg-card)",
                          border: isDone ? "1px solid rgba(52, 199, 89, 0.35)" : "1px solid var(--border-subtle)",
                          borderRadius: "10px"
                        }}
                      >
                        {/* Checkbox grande y táctil */}
                        <button
                          type="button"
                          onClick={() => toggleSet(eIdx, sIdx, ex.restSec)}
                          aria-pressed={isDone}
                          aria-label={`Serie ${sIdx + 1} ${isDone ? "completada" : "pendiente"}`}
                          style={{
                            width: "34px",
                            height: "34px",
                            minWidth: "34px",
                            borderRadius: "9px",
                            border: isDone ? "none" : "2px solid var(--border-subtle)",
                            background: isDone ? "var(--accent-green)" : "transparent",
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontWeight: 800,
                            fontSize: "0.85rem"
                          }}
                        >
                          {isDone ? <CheckCircle2 size={19} /> : <span style={{ color: "var(--text-secondary)" }}>{sIdx + 1}</span>}
                        </button>

                        {/* Peso propio de ESTA serie */}
                        <input
                          type="text"
                          inputMode="decimal"
                          className="form-input"
                          placeholder="kg"
                          aria-label={`Peso serie ${sIdx + 1}`}
                          style={{ flex: 1, minWidth: 0, padding: "8px", textAlign: "center", background: "var(--bg-card)" }}
                          value={entry.weight || ""}
                          onChange={(e) => handleWeightChange(eIdx, sIdx, e.target.value)}
                        />

                        <input
                          type="text"
                          inputMode="numeric"
                          className="form-input"
                          placeholder="reps"
                          aria-label={`Repeticiones serie ${sIdx + 1}`}
                          style={{ width: "72px", flexShrink: 0, padding: "8px", textAlign: "center", background: "var(--bg-card)" }}
                          value={entry.reps || ""}
                          onChange={(e) => updateEntry(eIdx, sIdx, { reps: e.target.value })}
                        />

                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => startRest(ex.restSec)}
                          style={{ color: "var(--accent-blue)", padding: "6px 8px", flexShrink: 0 }}
                          aria-label="Iniciar descanso"
                          title="Temporizador de descanso"
                        >
                          <Clock size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Video de técnica */}
                <a
                  href={ex.videoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${ex.name} tecnica ejecucion`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: "10px", color: "var(--accent-blue)", padding: "6px 0" }}
                >
                  <Video size={15} /> {ex.videoUrl ? "Ver video de técnica" : "Buscar video de técnica"} <ExternalLink size={12} />
                </a>
              </div>
            );
          })}
        </div>

        {/* Notas y cierre */}
        <div className="form-group" style={{ marginTop: "18px" }}>
          <label className="form-label" htmlFor="session-notes">¿Cómo te sentiste hoy? (opcional)</label>
          <textarea
            id="session-notes"
            className="form-textarea"
            style={{ minHeight: "70px" }}
            placeholder="Ej: molestia leve en el hombro derecho, buen nivel de energía..."
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
          />
        </div>

        <button
          className="btn btn-lime btn-lg"
          style={{ width: "100%", borderRadius: "14px" }}
          onClick={handleFinishWorkout}
          disabled={saving}
        >
          {saving ? <Loader2 size={20} className="spin" /> : <CheckCircle2 size={20} />}
          {saving ? "Guardando..." : `Finalizar sesión (${doneSets}/${totalSets})`}
        </button>
      </div>

      {restTimer && (
        <RestTimer key={restTimer.nonce} defaultSeconds={restTimer.seconds} onClose={() => setRestTimer(null)} />
      )}
    </div>
  );
};

/**
 * Vista para las rutinas que el profesor subió como archivo.
 *
 * No hay series que tildar, pero sí conviene que el alumno pueda dejar
 * registrado que entrenó: así el profe sigue viendo la adherencia y el alumno
 * mantiene su historial en la pestaña Progreso.
 */
const RutinaEnArchivo = ({ routine, student, onRegistrado, mensaje }) => {
  const { refreshData } = useAuth();
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const registrarEntrenamiento = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      await logCompletedWorkout(student.id, {
        dayName: routine.title,
        weekNumber: 1,
        durationMinutes: 60,
        studentNotes: notas.trim(),
        logs: []
      });
      await refreshData();
      setNotas("");
      onRegistrado?.("Entrenamiento registrado. ¡Bien ahí!");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="animate-fade-in stack">
      {mensaje && (
        <div
          style={{
            background: "var(--accent-green)",
            color: "#FFFFFF",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            fontWeight: 700,
            textAlign: "center",
            fontSize: "0.9rem",
            boxShadow: "0 6px 20px rgba(52,199,89,0.3)"
          }}
        >
          {mensaje}
        </div>
      )}

      <div className="glass-panel" style={{ padding: "18px", borderLeft: "4px solid var(--accent-green)" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Programa de {routine.durationWeeks || 6} semanas · asignado por tu entrenador
        </div>
        <h2 style={{ fontSize: "1.25rem", margin: "3px 0" }}>{routine.title}</h2>
        {routine.description && <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{routine.description}</p>}
      </div>

      <div className="glass-panel" style={{ padding: "16px" }}>
        <RoutineFileViewer routine={routine} />
      </div>

      <div className="glass-panel" style={{ padding: "16px" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "10px" }}>¿Entrenaste hoy?</h3>

        <div className="form-group">
          <label className="form-label" htmlFor="nota-archivo">Cómo te fue (opcional)</label>
          <textarea
            id="nota-archivo"
            className="form-textarea"
            style={{ minHeight: "70px" }}
            placeholder="Ej: subí 5 kg en press de banca, molestia leve en el hombro..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>

        <button
          className="btn btn-lime btn-lg"
          style={{ width: "100%", borderRadius: "14px" }}
          onClick={registrarEntrenamiento}
          disabled={guardando}
        >
          {guardando ? <Loader2 size={20} className="spin" /> : <CheckCircle2 size={20} />}
          {guardando ? "Guardando..." : "Registrar entrenamiento de hoy"}
        </button>

        <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginTop: "10px", textAlign: "center" }}>
          Queda en tu historial y tu entrenador ve que estás cumpliendo.
        </p>
      </div>
    </div>
  );
};
