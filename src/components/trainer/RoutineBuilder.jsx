import React, { useState, useMemo } from "react";
import { saveRoutine, deleteRoutine, duplicateRoutine } from "../../services/storageService";
import { borrarArchivoDeRutina } from "../../services/routineFileService";
import { downloadSampleExcelTemplate } from "../../services/excelService";
import { useAuth } from "../../context/AuthContext";
import { ExcelImporterModal } from "./ExcelImporterModal";
import { ExerciseBankModal } from "./ExerciseBankModal";
import { RoutinePrintView } from "./RoutinePrintView";
import { RoutineUploadModal } from "./RoutineUploadModal";
import { RoutineFileViewer } from "../common/RoutineFileViewer";
import { Portal } from "../common/Portal";
import {
  Dumbbell,
  Plus,
  Trash2,
  Edit,
  Save,
  FileSpreadsheet,
  Layers,
  ArrowLeft,
  Download,
  Video,
  Search,
  Printer,
  Copy,
  Upload,
  ChevronUp,
  ChevronDown,
  Loader2
} from "lucide-react";

const newExercise = (name = "Nuevo ejercicio") => ({
  name,
  sets: 3,
  reps: "10-12",
  restSec: 60,
  rpe: "RPE 8",
  notes: "",
  videoUrl: ""
});

export const RoutineBuilder = () => {
  const { currentUser, routines, refreshData } = useAuth();
  const [viewMode, setViewMode] = useState("list");
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [routineForPrint, setRoutineForPrint] = useState(null);
  const [targetDayIndex, setTargetDayIndex] = useState(null);
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const trainerRoutines = useMemo(
    () => routines.filter((r) => r.trainerId === currentUser?.id),
    [routines, currentUser?.id]
  );

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3500);
  };

  /* ---------- Biblioteca ---------- */

  const handleStartNewRoutine = () => {
    setEditing({
      id: `routine_${Date.now()}`,
      title: "Nueva rutina",
      category: "Hipertrofia",
      durationWeeks: 6,
      description: "",
      trainerId: currentUser?.id,
      days: [
        {
          dayName: "Día 1: Torso",
          exercises: [newExercise("Press de banca plano con barra")]
        }
      ]
    });
    setViewMode("editor");
  };

  const handleEditRoutine = (routine) => {
    setEditing(structuredClone ? structuredClone(routine) : JSON.parse(JSON.stringify(routine)));
    setViewMode("editor");
  };

  const handleDeleteRoutine = async (routine) => {
    if (!confirm(`¿Eliminar la rutina "${routine.title}"?`)) return;
    // Si era una rutina-archivo, se limpia también el storage.
    if (routine.kind === "file" && routine.filePath) await borrarArchivoDeRutina(routine.filePath);
    await deleteRoutine(routine.id);
    await refreshData();
    notify("🗑️ Rutina eliminada.");
  };

  const handleDuplicate = async (routine) => {
    await duplicateRoutine(routine);
    await refreshData();
    notify("📋 Rutina duplicada. Editá la copia para adaptarla.");
  };

  /* ---------- Editor (actualizaciones inmutables) ---------- */
  // Antes se mutaban los objetos anidados directamente: funcionaba de casualidad
  // porque el spread de `days` es superficial.

  const updateDays = (fn) => setEditing((prev) => ({ ...prev, days: fn(prev.days) }));

  const handleAddDay = () =>
    updateDays((days) => [
      ...days,
      { dayName: `Día ${days.length + 1}`, exercises: [newExercise()] }
    ]);

  const handleRemoveDay = (dayIndex) => {
    if (editing.days.length <= 1) {
      alert("La rutina tiene que tener al menos un día.");
      return;
    }
    if (!confirm(`¿Eliminar "${editing.days[dayIndex].dayName}"?`)) return;
    updateDays((days) => days.filter((_, i) => i !== dayIndex));
  };

  const handleDayNameChange = (dayIndex, name) =>
    updateDays((days) => days.map((d, i) => (i === dayIndex ? { ...d, dayName: name } : d)));

  const handleAddExercise = (dayIndex, exercise = newExercise()) =>
    updateDays((days) =>
      days.map((d, i) => (i === dayIndex ? { ...d, exercises: [...d.exercises, exercise] } : d))
    );

  const handleRemoveExercise = (dayIndex, exerciseIndex) =>
    updateDays((days) =>
      days.map((d, i) =>
        i === dayIndex ? { ...d, exercises: d.exercises.filter((_, j) => j !== exerciseIndex) } : d
      )
    );

  const handleExerciseChange = (dayIndex, exerciseIndex, field, value) =>
    updateDays((days) =>
      days.map((d, i) =>
        i === dayIndex
          ? {
              ...d,
              exercises: d.exercises.map((ex, j) => (j === exerciseIndex ? { ...ex, [field]: value } : ex))
            }
          : d
      )
    );

  /** Reordenar con botones: en celular arrastrar no funcionaba bien. */
  const moveExercise = (dayIndex, exerciseIndex, direction) =>
    updateDays((days) =>
      days.map((d, i) => {
        if (i !== dayIndex) return d;
        const target = exerciseIndex + direction;
        if (target < 0 || target >= d.exercises.length) return d;
        const list = [...d.exercises];
        [list[exerciseIndex], list[target]] = [list[target], list[exerciseIndex]];
        return { ...d, exercises: list };
      })
    );

  const handleAddFromBank = (exercise) => {
    if (targetDayIndex === null) return;
    handleAddExercise(targetDayIndex, exercise);
    setTargetDayIndex(null);
  };

  const handleSaveRoutine = async (e) => {
    e?.preventDefault();
    if (saving) return;
    if (!editing.title.trim()) {
      alert("Ponele un título a la rutina.");
      return;
    }
    setSaving(true);
    try {
      await saveRoutine({ ...editing, trainerId: currentUser?.id });
      await refreshData();
      notify("✅ Rutina guardada.");
      setViewMode("list");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in stack">
      {toast && (
        <Portal>
        <div
          className="animate-fade-in"
          style={{
            position: "fixed",
            bottom: "calc(var(--tabbar-height) + 16px)",
            left: "16px",
            right: "16px",
            maxWidth: "380px",
            margin: "0 auto",
            background: "var(--accent-green)",
            color: "#FFF",
            padding: "12px 18px",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "0.85rem",
            textAlign: "center",
            zIndex: 1500,
            boxShadow: "0 8px 24px rgba(52,199,89,0.35)"
          }}
        >
          {toast}
        </div>
        </Portal>
      )}

      {/* BIBLIOTECA */}
      {viewMode === "list" && (
        <>
          <div className="glass-panel" style={{ padding: "18px" }}>
            <div className="row-between">
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: "1.3rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Dumbbell color="var(--accent-blue)" size={22} /> Rutinas
                </h2>
                <span style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                  Armá la rutina en la app, o subí la que ya tenés como foto, PDF o planilla.
                </span>
              </div>

              <div className="action-row">
                <button className="btn btn-primary" onClick={handleStartNewRoutine}>
                  <Plus size={16} /> Crear rutina
                </button>
                <button className="btn btn-secondary" onClick={() => setShowBankModal(true)}>
                  <Search size={16} /> Banco
                </button>
                <button className="btn btn-lime" onClick={() => setShowUploadModal(true)}>
                  <Upload size={16} /> Subir archivo
                </button>
                <button className="btn btn-secondary" onClick={() => setShowExcelModal(true)}>
                  <FileSpreadsheet size={16} /> Importar Excel
                </button>
              </div>
            </div>

            {/* La plantilla de ejemplo estaba importada en el código pero no se usaba */}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: "10px", paddingLeft: 0 }} onClick={downloadSampleExcelTemplate}>
              <Download size={14} /> Descargar plantilla Excel de ejemplo
            </button>
          </div>

          {trainerRoutines.length === 0 ? (
            <div className="glass-panel" style={{ padding: "36px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
              Todavía no tenés rutinas. Creá la primera o importá una planilla de Excel.
            </div>
          ) : (
            <div className="grid-cards">
              {trainerRoutines.map((r) => {
                const totalExercises = r.days?.reduce((sum, d) => sum + (d.exercises?.length || 0), 0) || 0;

                return (
                  <div key={r.id} className="glass-panel" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                        <span className="badge badge-blue">{r.category || "Hipertrofia"}</span>
                        {r.kind === "file" && <span className="badge badge-neutral">Archivo</span>}
                        <span className="badge badge-success">{r.durationWeeks || 6} semanas</span>
                      </div>

                      <h3 style={{ fontSize: "1.1rem", margin: "4px 0" }}>{r.title}</h3>
                      {r.description && (
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{r.description}</p>
                      )}
                    </div>

                    {r.kind === "file" ? (
                      <div className="subtle-box" style={{ padding: "12px" }}>
                        <RoutineFileViewer routine={r} compacto />
                      </div>
                    ) : (
                      <div className="subtle-box" style={{ fontSize: "0.76rem", padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                          {r.days?.length || 0} días · {totalExercises} ejercicios
                        </div>
                        {r.days?.map((d, dIdx) => (
                          <div key={dIdx} style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            • {d.dayName} ({d.exercises?.length || 0})
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                      {/* Una rutina-archivo no se edita ni se exporta: el archivo ya es la rutina. */}
                      {r.kind !== "file" && (
                        <>
                          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleEditRoutine(r)}>
                            <Edit size={14} /> Editar
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleDuplicate(r)} title="Duplicar" aria-label="Duplicar rutina">
                            <Copy size={14} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setRoutineForPrint(r);
                              setShowPrintModal(true);
                            }}
                            title="Exportar"
                            aria-label="Exportar a PDF o WhatsApp"
                          >
                            <Printer size={14} />
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ flex: r.kind === "file" ? 1 : "0 0 auto" }}
                        onClick={() => handleDeleteRoutine(r)}
                        title="Eliminar"
                        aria-label="Eliminar rutina"
                      >
                        <Trash2 size={14} /> {r.kind === "file" ? "Eliminar rutina" : ""}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* EDITOR */}
      {viewMode === "editor" && editing && (
        <>
          <div className="glass-panel" style={{ padding: "14px 16px" }}>
            <div className="row-between">
              <button className="btn btn-ghost btn-sm" onClick={() => setViewMode("list")} style={{ paddingLeft: 0 }}>
                <ArrowLeft size={16} /> Biblioteca
              </button>

              <div className="action-row">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setRoutineForPrint(editing);
                    setShowPrintModal(true);
                  }}
                >
                  <Printer size={15} /> Vista PDF
                </button>
                <button className="btn btn-lime btn-sm" onClick={handleSaveRoutine} disabled={saving}>
                  {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />} Guardar
                </button>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "16px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="rt-title">Título de la rutina</label>
              <input
                id="rt-title"
                type="text"
                className="form-input"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="rt-weeks">Duración</label>
                <select
                  id="rt-weeks"
                  className="form-select"
                  value={editing.durationWeeks || 6}
                  onChange={(e) => setEditing({ ...editing, durationWeeks: Number(e.target.value) })}
                >
                  {[4, 6, 8, 12, 16].map((w) => (
                    <option key={w} value={w}>{w} semanas</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rt-cat">Categoría</label>
                <select
                  id="rt-cat"
                  className="form-select"
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                >
                  <option value="Hipertrofia">Hipertrofia</option>
                  <option value="Fuerza">Fuerza</option>
                  <option value="Acondicionamiento">Acondicionamiento</option>
                  <option value="Funcional">Funcional</option>
                  <option value="Rehabilitación">Rehabilitación</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="rt-desc">Descripción o indicaciones</label>
              <input
                id="rt-desc"
                type="text"
                className="form-input"
                value={editing.description || ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>
          </div>

          {editing.days.map((day, dIdx) => (
            <div key={dIdx} className="glass-panel" style={{ padding: "14px", borderLeft: "4px solid var(--accent-blue)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Layers size={18} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  className="form-input"
                  aria-label={`Nombre del día ${dIdx + 1}`}
                  value={day.dayName}
                  onChange={(e) => handleDayNameChange(dIdx, e.target.value)}
                  style={{ fontWeight: 700, color: "var(--accent-blue)", flex: 1, minWidth: 0 }}
                />
                <button className="btn btn-danger btn-sm" onClick={() => handleRemoveDay(dIdx)} aria-label="Eliminar día" style={{ flexShrink: 0 }}>
                  <Trash2 size={15} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {day.exercises.map((ex, eIdx) => (
                  <div
                    key={eIdx}
                    style={{
                      background: "var(--bg-subtle)",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {/* Reordenar con botones en vez de drag: en móvil arrastrar era inusable */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", flexShrink: 0 }}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "2px", minHeight: "22px", height: "22px", width: "26px" }}
                          onClick={() => moveExercise(dIdx, eIdx, -1)}
                          disabled={eIdx === 0}
                          aria-label="Subir ejercicio"
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "2px", minHeight: "22px", height: "22px", width: "26px" }}
                          onClick={() => moveExercise(dIdx, eIdx, 1)}
                          disabled={eIdx === day.exercises.length - 1}
                          aria-label="Bajar ejercicio"
                        >
                          <ChevronDown size={15} />
                        </button>
                      </div>

                      <input
                        type="text"
                        className="form-input"
                        aria-label="Nombre del ejercicio"
                        value={ex.name}
                        onChange={(e) => handleExerciseChange(dIdx, eIdx, "name", e.target.value)}
                        placeholder="Nombre del ejercicio"
                        style={{ flex: 1, minWidth: 0, fontWeight: 700 }}
                      />

                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--accent-red)", flexShrink: 0 }}
                        onClick={() => handleRemoveExercise(dIdx, eIdx)}
                        aria-label="Eliminar ejercicio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Antes eran 4 campos de 70px, imposibles de usar con el teclado abierto */}
                    <div className="grid-2">
                      {[
                        { field: "sets", label: "SERIES", type: "number", mode: "numeric" },
                        { field: "reps", label: "REPS", type: "text", mode: "text" },
                        { field: "restSec", label: "DESCANSO (s)", type: "number", mode: "numeric" },
                        { field: "rpe", label: "RPE", type: "text", mode: "text" }
                      ].map(({ field, label, type, mode }) => (
                        <div key={field}>
                          <label style={{ fontSize: "0.66rem", color: "var(--text-secondary)", fontWeight: 700 }} htmlFor={`ex-${dIdx}-${eIdx}-${field}`}>
                            {label}
                          </label>
                          <input
                            id={`ex-${dIdx}-${eIdx}-${field}`}
                            type={type}
                            inputMode={mode}
                            className="form-input"
                            style={{ textAlign: "center" }}
                            value={ex[field] ?? ""}
                            onChange={(e) => handleExerciseChange(dIdx, eIdx, field, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: "0.85rem" }}
                      value={ex.notes || ""}
                      onChange={(e) => handleExerciseChange(dIdx, eIdx, "notes", e.target.value)}
                      placeholder="Notas de técnica..."
                      aria-label="Notas de técnica"
                    />

                    <div style={{ position: "relative" }}>
                      <Video size={15} color="var(--accent-blue)" className="input-icon-left" />
                      <input
                        type="url"
                        className="form-input"
                        style={{ fontSize: "0.85rem", paddingLeft: "34px" }}
                        value={ex.videoUrl || ""}
                        onChange={(e) => handleExerciseChange(dIdx, eIdx, "videoUrl", e.target.value)}
                        placeholder="Link del video de técnica"
                        aria-label="Link del video"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                <button
                  type="button"
                  className="btn btn-lime btn-sm"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setTargetDayIndex(dIdx);
                    setShowBankModal(true);
                  }}
                >
                  <Search size={14} /> Buscar en el banco de ejercicios
                </button>
                <button type="button" className="btn btn-secondary btn-sm" style={{ width: "100%" }} onClick={() => handleAddExercise(dIdx)}>
                  <Plus size={14} /> Escribir ejercicio manual
                </button>
              </div>
            </div>
          ))}

          <button className="btn btn-primary btn-lg" style={{ width: "100%", borderRadius: "14px" }} onClick={handleAddDay}>
            <Plus size={18} /> Añadir día de entrenamiento
          </button>

          <button className="btn btn-lime btn-lg" style={{ width: "100%", borderRadius: "14px" }} onClick={handleSaveRoutine} disabled={saving}>
            {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />} Guardar rutina
          </button>
        </>
      )}

      <RoutineUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubida={(nombre) => notify(`Rutina "${nombre}" subida.`)}
      />

      <ExcelImporterModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onRoutineImported={(imported) => {
          setEditing(imported);
          setViewMode("editor");
          notify("✅ Rutina importada. Revisá y guardá los cambios.");
        }}
      />

      <ExerciseBankModal
        isOpen={showBankModal}
        onClose={() => {
          setShowBankModal(false);
          setTargetDayIndex(null);
        }}
        onSelectExercise={handleAddFromBank}
        canAdd={targetDayIndex !== null}
      />

      <RoutinePrintView
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setRoutineForPrint(null);
        }}
        routine={routineForPrint}
      />
    </div>
  );
};
