import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import { recordStudentMetric } from "../../services/storageService";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../common/Modal";
import { TrendingUp, Plus, Calendar, Activity } from "lucide-react";

export const ProgressChart = ({ student }) => {
  const { refreshData } = useAuth();
  const [showAddMetricModal, setShowAddMetricModal] = useState(false);
  const [metricForm, setMetricForm] = useState({
    date: new Date().toISOString().split("T")[0],
    weightKg: 75,
    chestCm: 100,
    waistCm: 82,
    hipsCm: 96,
    bicepsCm: 35,
    thighCm: 58,
    bodyFatPct: 15
  });

  const metricsData = student?.metrics || [];

  const handleAddMetricSubmit = (e) => {
    e.preventDefault();
    recordStudentMetric(student.id, metricForm);
    refreshData();
    setShowAddMetricModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Header with Add Record button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={20} color="var(--accent-lime)" /> Evolución Corporal de {student.name}
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Historial de peso, grasa corporal y medidas antropométricas
          </span>
        </div>

        <button className="btn btn-lime btn-sm" onClick={() => setShowAddMetricModal(true)}>
          <Plus size={15} /> Registrar Nueva Medición
        </button>
      </div>

      {metricsData.length === 0 ? (
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          No hay registros de mediciones guardados para este alumno. Presiona "Registrar Nueva Medición" para comenzar.
        </div>
      ) : (
        <>
          {/* Main Weight Chart */}
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={16} color="var(--accent-cyan)" /> Evolución del Peso Corporal (kg)
            </div>

            <div style={{ width: "100%", height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "#12161F", border: "1px solid var(--accent-cyan)", borderRadius: "8px", color: "#FFF" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weightKg"
                    name="Peso (kg)"
                    stroke="var(--accent-cyan)"
                    strokeWidth={3}
                    dot={{ fill: "var(--accent-cyan)", r: 5 }}
                    activeDot={{ r: 8, fill: "var(--accent-lime)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Body Measurements & Fat % Chart */}
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "16px" }}>
              📏 Medidas Antropométricas (cm) & % Grasa
            </div>

            <div style={{ width: "100%", height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "#12161F", border: "1px solid var(--border-color)", borderRadius: "8px", color: "#FFF" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Line type="monotone" dataKey="chestCm" name="Pecho (cm)" stroke="#00F2FE" strokeWidth={2} />
                  <Line type="monotone" dataKey="waistCm" name="Cintura (cm)" stroke="#FFB703" strokeWidth={2} />
                  <Line type="monotone" dataKey="hipsCm" name="Cadera (cm)" stroke="#FF2E93" strokeWidth={2} />
                  <Line type="monotone" dataKey="bicepsCm" name="Bíceps (cm)" stroke="#A8FF00" strokeWidth={2} />
                  <Line type="monotone" dataKey="bodyFatPct" name="% Grasa" stroke="#9D4EDD" strokeWidth={2} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Measurements Table */}
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
              📋 Tabla de Registros Históricos
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "center" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem" }}>
                    <th style={{ padding: "10px" }}>Fecha</th>
                    <th style={{ padding: "10px" }}>Peso (kg)</th>
                    <th style={{ padding: "10px" }}>Pecho</th>
                    <th style={{ padding: "10px" }}>Cintura</th>
                    <th style={{ padding: "10px" }}>Cadera</th>
                    <th style={{ padding: "10px" }}>Bíceps</th>
                    <th style={{ padding: "10px" }}>Muslo</th>
                    <th style={{ padding: "10px" }}>% Grasa</th>
                  </tr>
                </thead>
                <tbody>
                  {metricsData.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "10px", color: "var(--accent-cyan)", fontWeight: 600 }}>{m.date}</td>
                      <td style={{ padding: "10px", fontWeight: 700, color: "#FFF" }}>{m.weightKg} kg</td>
                      <td style={{ padding: "10px", color: "var(--text-muted)" }}>{m.chestCm || "-"} cm</td>
                      <td style={{ padding: "10px", color: "var(--text-muted)" }}>{m.waistCm || "-"} cm</td>
                      <td style={{ padding: "10px", color: "var(--text-muted)" }}>{m.hipsCm || "-"} cm</td>
                      <td style={{ padding: "10px", color: "var(--text-muted)" }}>{m.bicepsCm || "-"} cm</td>
                      <td style={{ padding: "10px", color: "var(--text-muted)" }}>{m.thighCm || "-"} cm</td>
                      <td style={{ padding: "10px", color: "var(--accent-lime)" }}>{m.bodyFatPct ? `${m.bodyFatPct}%` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Nueva Medición */}
      <Modal
        isOpen={showAddMetricModal}
        onClose={() => setShowAddMetricModal(false)}
        title={`Registrar Mediciones Antropométricas - ${student.name}`}
      >
        <form onSubmit={handleAddMetricSubmit}>
          <div className="form-group">
            <label className="form-label">Fecha de Medición</label>
            <input
              type="date"
              className="form-input"
              value={metricForm.date}
              onChange={(e) => setMetricForm({ ...metricForm, date: e.target.value })}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Peso Corporal (kg)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={metricForm.weightKg}
                onChange={(e) => setMetricForm({ ...metricForm, weightKg: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">% Grasa Estimado</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={metricForm.bodyFatPct}
                onChange={(e) => setMetricForm({ ...metricForm, bodyFatPct: e.target.value })}
              />
            </div>
          </div>

          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-cyan)", margin: "10px 0 6px 0", textTransform: "uppercase" }}>
            Medidas en Centímetros (cm)
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Pecho (cm)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={metricForm.chestCm}
                onChange={(e) => setMetricForm({ ...metricForm, chestCm: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cintura (cm)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={metricForm.waistCm}
                onChange={(e) => setMetricForm({ ...metricForm, waistCm: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cadera (cm)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={metricForm.hipsCm}
                onChange={(e) => setMetricForm({ ...metricForm, hipsCm: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bíceps (cm)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={metricForm.bicepsCm}
                onChange={(e) => setMetricForm({ ...metricForm, bicepsCm: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAddMetricModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-lime">
              Guardar Medición
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
