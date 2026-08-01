import React, { useState, useMemo, useEffect, useRef } from "react";
import { getExerciseBank, addExerciseToBank, deleteExerciseFromBank } from "../../services/exerciseBankService";
import { Search, Plus, Dumbbell, CheckCircle2, Trash2, X, ArrowLeft, Video } from "lucide-react";
import { Portal } from "../common/Portal";

const SECTORS = ["Todos", "Brazos", "Cuádriceps", "Femoral / Glúteos", "Pecho", "Hombros", "Espalda", "Core"];

const SECTOR_EMOJI = {
  Brazos: "🦾",
  Cuádriceps: "🦵",
  "Femoral / Glúteos": "🍑",
  Pecho: "🛡️",
  Hombros: "🎯",
  Espalda: "🦹",
  Core: "🧘"
};

const emptyForm = () => ({
  name: "",
  sector: "Brazos",
  defaultSets: 4,
  defaultReps: "10-12",
  defaultRest: 60,
  defaultRpe: "RPE 8",
  notes: "",
  videoUrl: ""
});

export const ExerciseBankModal = ({ isOpen, onClose, onSelectExercise, canAdd = true }) => {
  const [bank, setBank] = useState([]);
  const [selectedSector, setSelectedSector] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExForm, setNewExForm] = useState(emptyForm);

  // Se recarga al abrir para reflejar lo que se haya agregado en otra sesión.
  useEffect(() => {
    if (isOpen) setBank(getExerciseBank());
  }, [isOpen]);

  // Mismo criterio que en Modal: `onClose` va por ref para que el efecto dependa
  // solo de `isOpen` y no se re-ejecute en cada render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Bloquea el scroll del fondo mientras la pantalla completa está abierta.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onCloseRef.current?.();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const filteredExercises = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return bank.filter((ex) => {
      const matchesSector = selectedSector === "Todos" || ex.sector === selectedSector || ex.muscle === selectedSector;
      const matchesSearch = !q || ex.name.toLowerCase().includes(q) || (ex.muscle || "").toLowerCase().includes(q);
      return matchesSector && matchesSearch;
    });
  }, [bank, selectedSector, searchQuery]);

  if (!isOpen) return null;

  const handleAddNewExercise = (e) => {
    e.preventDefault();
    if (!newExForm.name.trim()) return;
    setBank(addExerciseToBank(newExForm));
    setNewExForm(emptyForm());
    setShowAddForm(false);
  };

  const handleDeleteExercise = (exId, exName) => {
    if (!confirm(`¿Eliminar "${exName}" del banco?`)) return;
    setBank(deleteExerciseFromBank(exId));
  };

  return (
    <Portal>
    <div
      className="animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Banco de ejercicios"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "var(--bg-system)",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div
        className="glass-header"
        style={{ position: "sticky", top: 0, zIndex: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Volver">
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ fontSize: "1.05rem", margin: 0, display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
            <Dumbbell color="var(--accent-blue)" size={20} style={{ flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Banco de ejercicios</span>
          </h2>
        </div>

        <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
      </div>

      <div
        className="main-content"
        style={{ padding: "16px 14px calc(24px + var(--safe-bottom)) 14px", maxWidth: "900px", margin: "0 auto", width: "100%", flex: 1 }}
      >
        {!showAddForm ? (
          <div className="stack">
            <div className="search-box">
              <Search size={17} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar ejercicio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar ejercicio"
              />
            </div>

            <button className="btn btn-lime" onClick={() => setShowAddForm(true)} style={{ width: "100%" }}>
              <Plus size={16} /> Cargar ejercicio nuevo al banco
            </button>

            <div className="scroll-x-wrap">
              <div className="scroll-x">
                {SECTORS.map((sector) => (
                  <button
                    key={sector}
                    className={`btn btn-sm ${selectedSector === sector ? "btn-primary" : "btn-secondary"}`}
                    style={{ borderRadius: "20px" }}
                    onClick={() => setSelectedSector(sector)}
                  >
                    {SECTOR_EMOJI[sector] ? `${SECTOR_EMOJI[sector]} ` : ""}
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-cards">
              {filteredExercises.length === 0 ? (
                <div style={{ padding: "34px 16px", textAlign: "center", color: "var(--text-secondary)", gridColumn: "1 / -1" }}>
                  No hay ejercicios en esta categoría.
                </div>
              ) : (
                filteredExercises.map((ex) => (
                  <div
                    key={ex.id}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      padding: "14px",
                      borderRadius: "14px",
                      display: "flex",
                      flexDirection: "column",
                      /* antes decía `justify:` (prop inválida) y no aplicaba nada */
                      justifyContent: "space-between",
                      gap: "10px"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                        <h4 style={{ fontSize: "0.96rem", fontWeight: 700, margin: 0, minWidth: 0 }}>{ex.name}</h4>
                        <span className="badge badge-blue" style={{ flexShrink: 0 }}>{ex.sector}</span>
                      </div>

                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                        {ex.defaultSets}×{ex.defaultReps} · {ex.defaultRest}s · {ex.defaultRpe}
                      </div>

                      {ex.notes && (
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "6px" }}>💡 {ex.notes}</div>
                      )}

                      {ex.videoUrl && (
                        <a
                          href={ex.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: "0.75rem", color: "var(--accent-blue)", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <Video size={12} /> Ver video
                        </a>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                      {onSelectExercise && canAdd && (
                        <button
                          className="btn btn-lime btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => {
                            onSelectExercise({
                              name: ex.name,
                              sets: ex.defaultSets || 4,
                              reps: ex.defaultReps || "10-12",
                              restSec: ex.defaultRest || 60,
                              rpe: ex.defaultRpe || "RPE 8",
                              notes: ex.notes || "",
                              videoUrl: ex.videoUrl || ""
                            });
                            onClose();
                          }}
                        >
                          <CheckCircle2 size={15} /> Agregar al día
                        </button>
                      )}

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteExercise(ex.id, ex.name)}
                        aria-label="Eliminar del banco"
                        title="Eliminar del banco"
                        style={{ marginLeft: onSelectExercise && canAdd ? 0 : "auto" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleAddNewExercise} className="glass-panel animate-fade-in" style={{ padding: "18px" }}>
            <h3 style={{ fontSize: "1.05rem", color: "var(--accent-blue)", marginBottom: "16px" }}>Nuevo ejercicio</h3>

            <div className="form-group">
              <label className="form-label" htmlFor="eb-name">Nombre</label>
              <input
                id="eb-name"
                type="text"
                className="form-input"
                placeholder="Ej: Press francés con barra Z"
                value={newExForm.name}
                onChange={(e) => setNewExForm({ ...newExForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="eb-sector">Sector muscular</label>
              <select
                id="eb-sector"
                className="form-select"
                value={newExForm.sector}
                onChange={(e) => setNewExForm({ ...newExForm, sector: e.target.value })}
              >
                {SECTORS.filter((s) => s !== "Todos").map((s) => (
                  <option key={s} value={s}>{SECTOR_EMOJI[s]} {s}</option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="eb-sets">Series por defecto</label>
                <input
                  id="eb-sets"
                  type="number"
                  inputMode="numeric"
                  className="form-input"
                  value={newExForm.defaultSets}
                  onChange={(e) => setNewExForm({ ...newExForm, defaultSets: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="eb-reps">Reps por defecto</label>
                <input
                  id="eb-reps"
                  type="text"
                  className="form-input"
                  value={newExForm.defaultReps}
                  onChange={(e) => setNewExForm({ ...newExForm, defaultReps: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="eb-rest">Descanso (s)</label>
                <input
                  id="eb-rest"
                  type="number"
                  inputMode="numeric"
                  className="form-input"
                  value={newExForm.defaultRest}
                  onChange={(e) => setNewExForm({ ...newExForm, defaultRest: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="eb-rpe">RPE</label>
                <input
                  id="eb-rpe"
                  type="text"
                  className="form-input"
                  value={newExForm.defaultRpe}
                  onChange={(e) => setNewExForm({ ...newExForm, defaultRpe: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="eb-notes">Notas de técnica</label>
              <input
                id="eb-notes"
                type="text"
                className="form-input"
                placeholder="Ej: codos fijos, bajada controlada en 2 segundos"
                value={newExForm.notes}
                onChange={(e) => setNewExForm({ ...newExForm, notes: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="eb-video">Link del video</label>
              <input
                id="eb-video"
                type="url"
                className="form-input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={newExForm.videoUrl}
                onChange={(e) => setNewExForm({ ...newExForm, videoUrl: e.target.value })}
              />
            </div>

            <div className="action-row" style={{ justifyContent: "flex-end", marginTop: "18px" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-lime">Guardar en el banco</button>
            </div>
          </form>
        )}
      </div>
    </div>
    </Portal>
  );
};
