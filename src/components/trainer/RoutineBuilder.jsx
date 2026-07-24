import React, { useState } from "react";
import { getRoutines, saveRoutine, deleteRoutine } from "../../services/storageService";
import { downloadSampleExcelTemplate } from "../../services/excelService";
import { useAuth } from "../../context/AuthContext";
import { ExcelImporterModal } from "./ExcelImporterModal";
import { ExerciseBankModal } from "./ExerciseBankModal";
import { RoutinePrintView } from "./RoutinePrintView";
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
  GripVertical
} from "lucide-react";

export const RoutineBuilder = () => {
  const { currentUser, refreshData } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // "list" | "editor"
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedRoutineForPrint, setSelectedRoutineForPrint] = useState(null);
  const [targetDayIndexForBank, setTargetDayIndexForBank] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [editingRoutine, setEditingRoutine] = useState(null);

  const [draggedExInfo, setDraggedExInfo] = useState(null);

  const routines = getRoutines(currentUser?.id);

  // Iniciar creación de nueva rutina genérica (duración predeterminada 6 semanas)
  const handleStartNewRoutine = () => {
    setEditingRoutine({
      id: `routine_${Date.now()}`,
      title: "Nueva Rutina Genérica (Plantilla)",
      category: "Hipertrofia",
      durationWeeks: 6,
      description: "Programa genérico de 6 semanas estructurado por días.",
      trainerId: currentUser?.id,
      days: [
        {
          dayName: "Día 1: Torso (Empuje / Tracción)",
          exercises: [
            { name: "Press de Banca Plano con Barra", sets: 4, reps: "8-10", restSec: 90, rpe: "RPE 8", notes: "Retraer escápulas.", videoUrl: "https://www.youtube.com/results?search_query=press+de+banca+plano" }
          ]
        }
      ]
    });
    setViewMode("editor");
  };

  const handleEditRoutine = (routine) => {
    setEditingRoutine(JSON.parse(JSON.stringify(routine)));
    setViewMode("editor");
  };

  const handleDeleteRoutine = (routineId, routineTitle) => {
    if (confirm(`¿Estás seguro de eliminar la rutina "${routineTitle}"?`)) {
      deleteRoutine(routineId);
      refreshData();
      setToastMessage("🗑️ Rutina eliminada de la biblioteca.");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  const handleAddDay = () => {
    const dayNumber = editingRoutine.days.length + 1;
    setEditingRoutine({
      ...editingRoutine,
      days: [
        ...editingRoutine.days,
        {
          dayName: `Día ${dayNumber}: Nombre del Día`,
          exercises: [
            { name: "Sentadilla Trasera", sets: 4, reps: "8-10", restSec: 90, rpe: "RPE 8", notes: "", videoUrl: "" }
          ]
        }
      ]
    });
  };

  const handleRemoveDay = (dayIndex) => {
    if (editingRoutine.days.length <= 1) {
      alert("La rutina debe tener al menos un día de entrenamiento.");
      return;
    }
    const updatedDays = editingRoutine.days.filter((_, idx) => idx !== dayIndex);
    setEditingRoutine({ ...editingRoutine, days: updatedDays });
  };

  const handleDayNameChange = (dayIndex, name) => {
    const updatedDays = [...editingRoutine.days];
    updatedDays[dayIndex].dayName = name;
    setEditingRoutine({ ...editingRoutine, days: updatedDays });
  };

  const handleAddManualExercise = (dayIndex) => {
    const updatedDays = [...editingRoutine.days];
    updatedDays[dayIndex].exercises.push({
      name: "Nuevo Ejercicio",
      sets: 3,
      reps: "10-12",
      restSec: 60,
      rpe: "RPE 8",
      notes: "",
      videoUrl: ""
    });
    setEditingRoutine({ ...editingRoutine, days: updatedDays });
  };

  const handleAddExerciseFromBank = (selectedEx) => {
    if (targetDayIndexForBank === null) return;
    const updatedDays = [...editingRoutine.days];
    updatedDays[targetDayIndexForBank].exercises.push(selectedEx);
    setEditingRoutine({ ...editingRoutine, days: updatedDays });
    setTargetDayIndexForBank(null);
  };

  const handleRemoveExercise = (dayIndex, exerciseIndex) => {
    const updatedDays = [...editingRoutine.days];
    updatedDays[dayIndex].exercises = updatedDays[dayIndex].exercises.filter((_, idx) => idx !== exerciseIndex);
    setEditingRoutine({ ...editingRoutine, days: updatedDays });
  };

  const handleExerciseChange = (dayIndex, exerciseIndex, field, value) => {
    const updatedDays = [...editingRoutine.days];
    updatedDays[dayIndex].exercises[exerciseIndex][field] = value;
    setEditingRoutine({ ...editingRoutine, days: updatedDays });
  };

  // Drag & Drop Handlers
  const handleDragStart = (dIdx, eIdx) => {
    setDraggedExInfo({ dayIndex: dIdx, exerciseIndex: eIdx });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetDayIdx, targetExIdx) => {
    if (!draggedExInfo) return;
    const { dayIndex: sourceDayIdx, exerciseIndex: sourceExIdx } = draggedExInfo;

    const updatedDays = [...editingRoutine.days];
    const [movedEx] = updatedDays[sourceDayIdx].exercises.splice(sourceExIdx, 1);
    updatedDays[targetDayIdx].exercises.splice(targetExIdx, 0, movedEx);

    setEditingRoutine({ ...editingRoutine, days: updatedDays });
    setDraggedExInfo(null);
  };

  const handleSaveRoutineSubmit = (e) => {
    e.preventDefault();
    saveRoutine({
      ...editingRoutine,
      trainerId: currentUser?.id
    });
    refreshData();
    setToastMessage("✅ Rutina guardada correctamente.");
    setTimeout(() => setToastMessage(""), 4000);
    setViewMode("list");
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px",
          background: "var(--accent-green)", color: "#FFF",
          padding: "12px 20px", borderRadius: "10px", fontWeight: 700,
          zIndex: 2000, boxShadow: "0 8px 24px rgba(52,199,89,0.3)"
        }}>
          {toastMessage}
        </div>
      )}

      {/* VISTA 1: BIBLIOTECA DE RUTINAS CARGADAS */}
      {viewMode === "list" && (
        <>
          {/* Header Banner */}
          <div className="glass-panel" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
            <div>
              <h2 style={{ fontSize: "1.4rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <Dumbbell color="var(--accent-blue)" size={24} /> Rutinas Genéricas & Banco de Ejercicios
              </h2>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Genera plantillas genéricas, administra tu catálogo de ejercicios por sector o importa planillas Excel.
              </span>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={handleStartNewRoutine}>
                <Plus size={16} /> Crear Rutina Genérica
              </button>
              <button className="btn btn-secondary" onClick={() => setShowBankModal(true)}>
                <Search size={16} /> Abrir Banco de Ejercicios
              </button>
              <button className="btn btn-lime" onClick={() => setShowExcelModal(true)}>
                <FileSpreadsheet size={16} /> Importar Excel
              </button>
            </div>
          </div>

          {/* Cards Grid de Rutinas Cargadas */}
          {routines.length === 0 ? (
            <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
              No tienes rutinas guardadas aún. Crea tu primera rutina genérica o carga un archivo Excel.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {routines.map((r) => {
                const totalExercises = r.days?.reduce((sum, d) => sum + (d.exercises?.length || 0), 0) || 0;

                return (
                  <div key={r.id} className="glass-panel animate-fade-in" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <span className="badge badge-blue">{r.category || "Hipertrofia"}</span>
                        <span className="badge badge-success">{r.durationWeeks || 6} Semanas</span>
                      </div>

                      <h3 style={{ fontSize: "1.2rem", margin: "4px 0 8px 0" }}>{r.title}</h3>
                      <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: "16px" }}>{r.description}</p>

                      <div style={{ background: "#F2F2F7", padding: "10px 12px", borderRadius: "10px", fontSize: "0.78rem", marginBottom: "16px" }}>
                        <div style={{ fontWeight: 700, marginBottom: "4px", color: "var(--text-primary)" }}>
                          Estructura ({r.days?.length || 0} días • {totalExercises} ejercicios):
                        </div>
                        {r.days?.map((d, dIdx) => (
                          <div key={dIdx} style={{ color: "var(--text-secondary)" }}>
                            • {d.dayName} ({d.exercises?.length || 0} ejer.)
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", flexWrap: "wrap" }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleEditRoutine(r)}
                      >
                        <Edit size={14} /> Modificar
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setSelectedRoutineForPrint(r);
                          setShowPrintModal(true);
                        }}
                        title="Exportar a PDF / WhatsApp"
                      >
                        <Printer size={14} /> Exportar
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteRoutine(r.id, r.title)}
                        title="Eliminar rutina"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VISTA 2: EDITOR VISUAL DE RUTINA (REDISEÑADO PARA MÓVIL) */}
      {viewMode === "editor" && editingRoutine && (
        <>
          <div className="glass-panel" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setViewMode("list")}>
              <ArrowLeft size={16} /> Volver a la Biblioteca
            </button>

            <div style={{ display: "flex", gap: "8px", width: "100%", smWidth: "auto", justifyContent: "flex-end" }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelectedRoutineForPrint(editingRoutine);
                  setShowPrintModal(true);
                }}
              >
                <Printer size={15} /> Vista PDF
              </button>

              <button className="btn btn-lime btn-sm" onClick={handleSaveRoutineSubmit}>
                <Save size={15} /> Guardar Cambios
              </button>
            </div>
          </div>

          {/* Formulario Encabezado Responsivo */}
          <div className="glass-panel" style={{ padding: "18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Título de la Rutina</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingRoutine.title}
                  onChange={(e) => setEditingRoutine({ ...editingRoutine, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Duración (Semanas)</label>
                <select
                  className="form-select"
                  value={editingRoutine.durationWeeks || 6}
                  onChange={(e) => setEditingRoutine({ ...editingRoutine, durationWeeks: Number(e.target.value) })}
                >
                  <option value={4}>4 Semanas</option>
                  <option value={6}>6 Semanas</option>
                  <option value={8}>8 Semanas</option>
                  <option value={12}>12 Semanas</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Categoría / Objetivo</label>
                <select
                  className="form-select"
                  value={editingRoutine.category}
                  onChange={(e) => setEditingRoutine({ ...editingRoutine, category: e.target.value })}
                >
                  <option value="Hipertrofia">Hipertrofia</option>
                  <option value="Fuerza">Fuerza</option>
                  <option value="Acondicionamiento">Acondicionamiento</option>
                  <option value="Funcional">Funcional</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "12px", marginBottom: 0 }}>
              <label className="form-label">Descripción o Indicaciones</label>
              <input
                type="text"
                className="form-input"
                value={editingRoutine.description}
                onChange={(e) => setEditingRoutine({ ...editingRoutine, description: e.target.value })}
              />
            </div>
          </div>

          {/* Días y Ejercicios (Rediseño 100% Responsivo Móvil) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {editingRoutine.days.map((day, dIdx) => (
              <div key={dIdx} className="glass-panel" style={{ padding: "16px", borderLeft: "4px solid var(--accent-blue)" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "200px" }}>
                    <Layers size={18} color="var(--accent-blue)" />
                    <input
                      type="text"
                      className="form-input"
                      value={day.dayName}
                      onChange={(e) => handleDayNameChange(dIdx, e.target.value)}
                      style={{ fontWeight: 700, fontSize: "1rem", color: "var(--accent-blue)" }}
                    />
                  </div>

                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveDay(dIdx)}>
                    <Trash2 size={14} /> Eliminar Día
                  </button>
                </div>

                {/* Lista de Ejercicios Tarjetas Responsivas */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {day.exercises.map((ex, eIdx) => (
                    <div
                      key={eIdx}
                      draggable
                      onDragStart={() => handleDragStart(dIdx, eIdx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(dIdx, eIdx)}
                      style={{
                        background: "#F2F2F7",
                        padding: "14px",
                        borderRadius: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        border: "1px solid var(--border-subtle)"
                      }}
                    >
                      {/* Fila Superior: Grip + Nombre + Eliminar */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ color: "var(--text-secondary)", cursor: "grab", padding: "4px" }} title="Arrastrar para reordenar">
                          <GripVertical size={18} />
                        </div>
                        <input
                          type="text"
                          className="form-input"
                          value={ex.name}
                          onChange={(e) => handleExerciseChange(dIdx, eIdx, "name", e.target.value)}
                          placeholder="Nombre del ejercicio"
                          style={{ flex: 1, fontWeight: 700 }}
                        />
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--accent-red)", padding: "6px" }} onClick={() => handleRemoveExercise(dIdx, eIdx)}>
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Fila Intermedia: 4 Inputs Atributos Adaptables (Series, Reps, Descanso, RPE) */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))", gap: "6px" }}>
                        <div>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>SERIES</span>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: "6px", fontSize: "0.85rem", textAlign: "center" }}
                            value={ex.sets}
                            onChange={(e) => handleExerciseChange(dIdx, eIdx, "sets", e.target.value)}
                            placeholder="Series"
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>REPS</span>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: "6px", fontSize: "0.85rem", textAlign: "center" }}
                            value={ex.reps}
                            onChange={(e) => handleExerciseChange(dIdx, eIdx, "reps", e.target.value)}
                            placeholder="Reps"
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>DESC (s)</span>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: "6px", fontSize: "0.85rem", textAlign: "center" }}
                            value={ex.restSec}
                            onChange={(e) => handleExerciseChange(dIdx, eIdx, "restSec", e.target.value)}
                            placeholder="Secs"
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>RPE</span>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: "6px", fontSize: "0.85rem", textAlign: "center" }}
                            value={ex.rpe}
                            onChange={(e) => handleExerciseChange(dIdx, eIdx, "rpe", e.target.value)}
                            placeholder="RPE 8"
                          />
                        </div>
                      </div>

                      {/* Fila Inferior: Notas de Técnica & Video URL */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "6px" }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: "0.8rem" }}
                          value={ex.notes}
                          onChange={(e) => handleExerciseChange(dIdx, eIdx, "notes", e.target.value)}
                          placeholder="Notas de técnica / Ejecución..."
                        />
                        <div style={{ position: "relative" }}>
                          <Video size={14} color="var(--accent-blue)" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: "0.8rem", paddingLeft: "30px" }}
                            value={ex.videoUrl || ""}
                            onChange={(e) => handleExerciseChange(dIdx, eIdx, "videoUrl", e.target.value)}
                            placeholder="Link de Vídeo de Técnica (YouTube/Reel)"
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {/* BOTONES DOBLES RESPONSIVOS */}
                <div style={{ display: "flex", flexDirection: "column", smFlexDirection: "row", gap: "8px", marginTop: "14px" }}>
                  <button
                    type="button"
                    className="btn btn-lime btn-sm"
                    style={{ width: "100%" }}
                    onClick={() => {
                      setTargetDayIndexForBank(dIdx);
                      setShowBankModal(true);
                    }}
                  >
                    <Search size={14} /> Buscar del Banco por Sectores
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ width: "100%" }}
                    onClick={() => handleAddManualExercise(dIdx)}
                  >
                    <Plus size={14} /> Escribir Ejercicio Manual
                  </button>
                </div>

              </div>
            ))}

            <button className="btn btn-primary btn-lg" style={{ width: "100%", borderRadius: "14px" }} onClick={handleAddDay}>
              <Plus size={18} /> Añadir Día de Entrenamiento
            </button>
          </div>
        </>
      )}

      {/* Modal Importar desde Excel */}
      <ExcelImporterModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onRoutineImported={(importedRoutine) => {
          setEditingRoutine(importedRoutine);
          setViewMode("editor");
          setToastMessage("✅ Rutina importada desde Excel. Revisa y guarda los cambios.");
          setTimeout(() => setToastMessage(""), 4000);
        }}
      />

      {/* Modal Banco de Ejercicios por Sectores (Pantalla Completa) */}
      <ExerciseBankModal
        isOpen={showBankModal}
        onClose={() => {
          setShowBankModal(false);
          setTargetDayIndexForBank(null);
        }}
        onSelectExercise={handleAddExerciseFromBank}
      />

      {/* Modal Imprimir / Exportar a PDF & WhatsApp */}
      <RoutinePrintView
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setSelectedRoutineForPrint(null);
        }}
        routine={selectedRoutineForPrint}
      />

    </div>
  );
};
