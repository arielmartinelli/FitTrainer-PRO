import React, { useState } from "react";
import { getExerciseBank, addExerciseToBank, deleteExerciseFromBank } from "../../services/exerciseBankService";
import { Search, Plus, Dumbbell, Video, CheckCircle2, Trash2, X, ArrowLeft } from "lucide-react";

export const ExerciseBankModal = ({ isOpen, onClose, onSelectExercise }) => {
  const [bank, setBank] = useState(getExerciseBank());
  const [selectedSector, setSelectedSector] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const [newExForm, setNewExForm] = useState({
    name: "",
    sector: "Brazos",
    defaultSets: 4,
    defaultReps: "10-12",
    defaultRest: 60,
    defaultRpe: "RPE 8",
    notes: "",
    videoUrl: ""
  });

  if (!isOpen) return null;

  const sectors = ["Todos", "Brazos", "Cuádriceps", "Femoral / Glúteos", "Pecho", "Hombros", "Espalda", "Core"];

  const filteredExercises = bank.filter((ex) => {
    const matchesSector = selectedSector === "Todos" || ex.sector === selectedSector || ex.muscle === selectedSector;
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSector && matchesSearch;
  });

  const handleAddNewExercise = (e) => {
    e.preventDefault();
    if (!newExForm.name) return;
    const updated = addExerciseToBank(newExForm);
    setBank(updated);
    setShowAddForm(false);
    setNewExForm({
      name: "",
      sector: "Brazos",
      defaultSets: 4,
      defaultReps: "10-12",
      defaultRest: 60,
      defaultRpe: "RPE 8",
      notes: "",
      videoUrl: ""
    });
  };

  const handleDeleteExercise = (exId, exName) => {
    if (confirm(`¿Eliminar "${exName}" del Banco de Ejercicios?`)) {
      const updated = deleteExerciseFromBank(exId);
      setBank(updated);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 3000,
        background: "#F2F2F7",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column"
      }}
      className="animate-fade-in"
    >
      {/* Full Screen Header */}
      <div className="glass-header" style={{ position: "sticky", top: 0, zIndex: 10, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: "6px" }}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Dumbbell color="var(--accent-blue)" size={22} /> Banco de Ejercicios por Sectores Musculares
          </h2>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ borderRadius: "50%", padding: "8px" }}>
          <X size={22} />
        </button>
      </div>

      <div className="main-content" style={{ padding: "20px 16px", maxWidth: "900px", margin: "0 auto", width: "100%", flex: 1 }}>
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {!showAddForm ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
                  <Search size={16} color="var(--text-secondary)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Buscar por nombre de ejercicio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: "36px" }}
                  />
                </div>

                <button className="btn btn-lime" onClick={() => setShowAddForm(true)}>
                  <Plus size={16} /> Cargar Nuevo al Banco
                </button>
              </div>

              {/* Sector Pills */}
              <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
                {sectors.map((sector) => (
                  <button
                    key={sector}
                    className={`btn ${selectedSector === sector ? "btn-primary" : "btn-secondary"} btn-sm`}
                    style={{ borderRadius: "20px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                    onClick={() => setSelectedSector(sector)}
                  >
                    {sector === "Brazos" && "🦾 "}
                    {sector === "Cuádriceps" && "🦵 "}
                    {sector === "Femoral / Glúteos" && "🍑 "}
                    {sector === "Pecho" && "🛡️ "}
                    {sector === "Hombros" && "🎯 "}
                    {sector === "Espalda" && "🦹 "}
                    {sector === "Core" && "🧘 "}
                    {sector}
                  </button>
                ))}
              </div>

              {/* Exercise Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
                {filteredExercises.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)", gridColumn: "1 / -1" }}>
                    No se encontraron ejercicios en esta categoría. Haz clic en "Cargar Nuevo al Banco" para añadirlo.
                  </div>
                ) : (
                  filteredExercises.map((ex) => (
                    <div
                      key={ex.id}
                      style={{
                        background: "#F2F2F7",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        display: "flex",
                        flexDirection: "column",
                        justify: "space-between",
                        gap: "10px"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                          <h4 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 700, margin: 0 }}>
                            {ex.name}
                          </h4>
                          <span className="badge badge-blue">{ex.sector}</span>
                        </div>

                        {ex.notes && (
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                            💡 {ex.notes}
                          </div>
                        )}

                        {ex.videoUrl && (
                          <a
                            href={ex.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: "0.75rem", color: "var(--accent-blue)", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            🎥 Ver Vídeo de Demostración
                          </a>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                        {onSelectExercise && (
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
                            <CheckCircle2 size={15} /> Seleccionar
                          </button>
                        )}

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteExercise(ex.id, ex.name)}
                          title="Eliminar del Banco"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Form para añadir un nuevo ejercicio al Banco */
            <form onSubmit={handleAddNewExercise} className="animate-fade-in">
              <h3 style={{ fontSize: "1.2rem", color: "var(--accent-blue)", marginBottom: "16px" }}>
                ➕ Guardar Nuevo Ejercicio en el Banco
              </h3>

              <div className="form-group">
                <label className="form-label">Nombre del Ejercicio</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Press Francés con Barra Z"
                  value={newExForm.name}
                  onChange={(e) => setNewExForm({ ...newExForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Sector Muscular</label>
                  <select
                    className="form-select"
                    value={newExForm.sector}
                    onChange={(e) => setNewExForm({ ...newExForm, sector: e.target.value })}
                  >
                    <option value="Brazos">🦾 Brazos (Bíceps / Tríceps)</option>
                    <option value="Cuádriceps">🦵 Cuádriceps / Piernas</option>
                    <option value="Femoral / Glúteos">🍑 Femoral / Glúteos</option>
                    <option value="Pecho">🛡️ Pecho</option>
                    <option value="Hombros">🎯 Hombros</option>
                    <option value="Espalda">🦹 Espalda</option>
                    <option value="Core">🧘 Core & Abdominales</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Link de Vídeo de Técnica (YouTube/Reel)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newExForm.videoUrl}
                    onChange={(e) => setNewExForm({ ...newExForm, videoUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notas de Técnica / Indicaciones</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Codos fijos, controlar bajada en 2 segundos..."
                  value={newExForm.notes}
                  onChange={(e) => setNewExForm({ ...newExForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-lime">
                  Guardar en Banco
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
