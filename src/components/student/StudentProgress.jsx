import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { recordStudentMetric } from "../../services/storageService";
import { ProgressChart } from "../trainer/ProgressChart";
import { TrendingUp, Plus, Scale, Calendar } from "lucide-react";
import { Modal } from "../common/Modal";

export const StudentProgress = ({ student }) => {
  const { refreshData } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [weightInput, setWeightInput] = useState({
    date: new Date().toISOString().split("T")[0],
    weightKg: student?.metrics?.[student.metrics.length - 1]?.weightKg || 70
  });

  const handleAddWeight = (e) => {
    e.preventDefault();
    recordStudentMetric(student.id, {
      date: weightInput.date,
      weightKg: weightInput.weightKg
    });
    refreshData();
    setShowModal(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      <div className="glass-panel" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp color="var(--accent-lime)" size={26} /> Mi Registro de Peso y Evolución
          </h2>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Supervisa tus progresos y registra tu peso actual
          </span>
        </div>

        <button className="btn btn-lime" onClick={() => setShowModal(true)}>
          <Scale size={18} /> Registrar Mi Peso de Hoy
        </button>
      </div>

      <ProgressChart student={student} />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Registrar Peso Corporal"
      >
        <form onSubmit={handleAddWeight}>
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className="form-input"
              value={weightInput.date}
              onChange={(e) => setWeightInput({ ...weightInput, date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Peso Corporal (kg)</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              value={weightInput.weightKg}
              onChange={(e) => setWeightInput({ ...weightInput, weightKg: e.target.value })}
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-lime">
              Guardar Peso
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
