import React, { useState } from "react";
import { importRoutineFromExcel, downloadSampleExcelTemplate } from "../../services/excelService";
import { saveRoutine } from "../../services/storageService";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../common/Modal";
import { FileSpreadsheet, Download, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export const ExcelImporterModal = ({ isOpen, onClose, onRoutineImported }) => {
  const { currentUser, refreshData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewRoutine, setPreviewRoutine] = useState(null);
  const [routineTitle, setRoutineTitle] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg("");
    setPreviewRoutine(null);

    try {
      const routineObj = await importRoutineFromExcel(file);
      setPreviewRoutine(routineObj);
      setRoutineTitle(routineObj.title);
    } catch (err) {
      setErrorMsg(err.message || "No se pudo leer la planilla.");
    } finally {
      setLoading(false);
      e.target.value = ""; // permite volver a elegir el mismo archivo
    }
  };

  const handleConfirmImport = async () => {
    if (!previewRoutine || saving) return;
    setSaving(true);
    try {
      const newRoutine = {
        ...previewRoutine,
        title: routineTitle || "Rutina importada",
        trainerId: currentUser?.id,
        id: `routine_${Date.now()}`,
        durationWeeks: previewRoutine.durationWeeks || 6
      };

      await saveRoutine(newRoutine);
      await refreshData();

      onRoutineImported?.(newRoutine);
      setPreviewRoutine(null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setPreviewRoutine(null);
    setErrorMsg("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar rutina desde Excel / CSV" maxWidth="720px">
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Plantilla modelo */}
        <div
          className="subtle-box"
          style={{ background: "rgba(0,122,255,0.06)", border: "1px solid rgba(0,122,255,0.2)" }}
        >
          <div className="row-between">
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: "var(--accent-blue)", fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <FileSpreadsheet size={17} /> ¿No tenés el formato?
              </div>
              <div style={{ fontSize: "0.79rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                Descargá la planilla modelo con las columnas <strong>Día, Ejercicio, Series, Repeticiones, Descanso y Notas</strong>.
              </div>
            </div>
            <button className="btn btn-lime btn-sm" onClick={downloadSampleExcelTemplate} type="button" style={{ flexShrink: 0 }}>
              <Download size={14} /> Plantilla
            </button>
          </div>
        </div>

        {/* Subida */}
        {!previewRoutine && (
          <label
            htmlFor="excelFileInput"
            style={{
              border: "2px dashed rgba(0, 122, 255, 0.35)",
              borderRadius: "14px",
              padding: "32px 18px",
              textAlign: "center",
              background: "var(--bg-subtle)",
              cursor: "pointer",
              display: "block"
            }}
          >
            <input
              id="excelFileInput"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />

            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(0,122,255,0.12)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "10px"
              }}
            >
              <Upload size={23} color="var(--accent-blue)" />
            </div>

            <div style={{ fontWeight: 700, fontSize: "0.98rem", marginBottom: "4px" }}>
              Tocá acá para elegir tu archivo
            </div>
            <div style={{ fontSize: "0.79rem", color: "var(--text-secondary)" }}>
              Formatos <strong>.XLSX, .XLS o .CSV</strong>
            </div>

            {loading && (
              <div style={{ marginTop: "12px", color: "var(--accent-blue)", fontWeight: 600, fontSize: "0.87rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Loader2 size={15} className="spin" /> Analizando el archivo...
              </div>
            )}
          </label>
        )}

        {errorMsg && (
          <div
            role="alert"
            style={{
              padding: "12px",
              background: "rgba(255,59,48,0.1)",
              border: "1px solid var(--accent-red)",
              borderRadius: "10px",
              color: "var(--accent-red)",
              fontSize: "0.84rem",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} /> {errorMsg}
          </div>
        )}

        {/* Previsualización */}
        {previewRoutine && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="imp-title">Nombre de la rutina</label>
              <input
                id="imp-title"
                type="text"
                className="form-input"
                value={routineTitle}
                onChange={(e) => setRoutineTitle(e.target.value)}
                placeholder="Ej: Hipertrofia 4 días"
              />
            </div>

            <div style={{ fontWeight: 700, fontSize: "0.87rem", color: "var(--accent-green)", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle size={16} /> Archivo procesado. Días encontrados:
            </div>

            <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              {previewRoutine.days.map((day, dIdx) => (
                <div key={dIdx} className="subtle-box" style={{ borderLeft: "3px solid var(--accent-blue)" }}>
                  <div style={{ fontWeight: 700, color: "var(--accent-blue)", marginBottom: "6px", fontSize: "0.88rem" }}>
                    {day.dayName} ({day.exercises.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {day.exercises.map((ex, eIdx) => (
                      <div
                        key={eIdx}
                        style={{
                          fontSize: "0.8rem",
                          background: "var(--bg-card)",
                          padding: "6px 10px",
                          borderRadius: "7px",
                          display: "flex",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "6px"
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{ex.name}</span>
                        <span style={{ color: "var(--text-secondary)" }}>
                          {ex.sets}×{ex.reps} · {ex.restSec}s · <strong style={{ color: "var(--accent-green)" }}>{ex.rpe}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="action-row" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setPreviewRoutine(null)}>
                Cargar otro archivo
              </button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmImport} disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                {saving ? "Guardando..." : "Importar rutina"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
