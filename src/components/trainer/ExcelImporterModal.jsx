import React, { useState } from "react";
import { importRoutineFromExcel, downloadSampleExcelTemplate } from "../../services/excelService";
import { saveRoutine, getRoutines } from "../../services/storageService";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../common/Modal";
import { FileSpreadsheet, Download, Upload, CheckCircle, AlertCircle, Dumbbell, Play } from "lucide-react";

export const ExcelImporterModal = ({ isOpen, onClose, onRoutineImported }) => {
  const { currentUser, refreshData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewRoutine, setPreviewRoutine] = useState(null);
  const [routineTitle, setRoutineTitle] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg("");
    setPreviewRoutine(null);

    try {
      const routineObj = await importRoutineFromExcel(file);
      setPreviewRoutine(routineObj);
      setRoutineTitle(routineObj.title);
    } catch (err) {
      setErrorMsg(err.message || "Error al leer la plantilla Excel.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!previewRoutine) return;

    const newRoutine = {
      ...previewRoutine,
      title: routineTitle || "Rutina Importada",
      trainerId: currentUser?.id,
      id: `routine_${Date.now()}`
    };

    saveRoutine(newRoutine);
    refreshData();

    if (onRoutineImported) {
      onRoutineImported(newRoutine);
    }

    setPreviewRoutine(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importar Rutina desde Excel / CSV" maxWidth="750px">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Banner informativo y descarga de Plantilla */}
        <div className="glass-panel" style={{ padding: "16px", background: "rgba(0, 242, 254, 0.06)", border: "1px solid rgba(0,242,254,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--accent-cyan)", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <FileSpreadsheet size={18} /> ¿No tienes el formato exacto?
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Descarga la planilla modelo en Excel con las columnas listas: <strong>Día, Ejercicio, Series, Repeticiones, Descanso y Notas</strong>.
              </div>
            </div>
            <button
              className="btn btn-lime btn-sm"
              onClick={downloadSampleExcelTemplate}
              type="button"
            >
              <Download size={14} /> Descargar Plantilla Modelo (.xlsx)
            </button>
          </div>
        </div>

        {/* Drag & Drop File Upload Area */}
        {!previewRoutine && (
          <div
            style={{
              border: "2px dashed rgba(0, 242, 254, 0.3)",
              borderRadius: "12px",
              padding: "40px 20px",
              textAlign: "center",
              background: "rgba(18, 22, 31, 0.5)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onClick={() => document.getElementById("excelFileInput").click()}
          >
            <input
              id="excelFileInput"
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            
            <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "rgba(0,242,254,0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
              <Upload size={24} color="var(--accent-cyan)" />
            </div>

            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#FFF", marginBottom: "4px" }}>
              Haz clic aquí para seleccionar tu archivo Excel o CSV
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Soporta archivos <strong>.XLSX, .XLS o .CSV</strong>
            </div>

            {loading && (
              <div style={{ marginTop: "12px", color: "var(--accent-lime)", fontWeight: 600, fontSize: "0.9rem" }}>
                ⏳ Leyendo y analizando archivo Excel...
              </div>
            )}
          </div>
        )}

        {/* Mensaje de Error */}
        {errorMsg && (
          <div style={{ padding: "12px", background: "rgba(255, 46, 147, 0.15)", border: "1px solid var(--accent-rose)", borderRadius: "8px", color: "var(--accent-rose)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        {/* Previsualización Interactiva de la Rutina Cargada */}
        {previewRoutine && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div className="form-group">
              <label className="form-label">Nombre para guardar esta Rutina</label>
              <input
                type="text"
                className="form-input"
                value={routineTitle}
                onChange={(e) => setRoutineTitle(e.target.value)}
                placeholder="Ej: Hipertrofia 4 Días - Importada"
              />
            </div>

            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--accent-lime)", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle size={16} /> ¡Archivo procesado exitosamente! Previsualización de los días encontrados:
            </div>

            <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {previewRoutine.days.map((day, dIdx) => (
                <div key={dIdx} className="glass-panel" style={{ padding: "14px", borderLeft: "3px solid var(--accent-cyan)" }}>
                  <div style={{ fontWeight: 700, color: "var(--accent-cyan)", marginBottom: "8px", fontSize: "0.9rem" }}>
                    {day.dayName} ({day.exercises.length} Ejercicios)
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {day.exercises.map((ex, eIdx) => (
                      <div key={eIdx} style={{ fontSize: "0.825rem", background: "rgba(255,255,255,0.02)", padding: "6px 10px", borderRadius: "6px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                        <span style={{ fontWeight: 600, color: "#FFF" }}>{ex.name}</span>
                        <span style={{ color: "var(--text-muted)" }}>
                          {ex.sets} series x {ex.reps} reps | Descanso: {ex.restSec}s | <strong style={{ color: "var(--accent-lime)" }}>{ex.rpe}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPreviewRoutine(null)}
              >
                Cargar Otro Archivo
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmImport}
              >
                <CheckCircle size={16} /> Guardar e Importar Rutina
              </button>
            </div>

          </div>
        )}

      </div>
    </Modal>
  );
};
