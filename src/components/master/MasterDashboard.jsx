import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  saveTrainer,
  saveStudent,
  toggleTrainerAccess,
  toggleStudentAccess
} from "../../services/storageService";
import { Modal } from "../common/Modal";
import {
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  Key,
  Calendar,
  CheckCircle2,
  DollarSign
} from "lucide-react";

export const MasterDashboard = () => {
  const { trainers, students, refreshData } = useAuth();
  const [activeTab, setActiveTab] = useState("trainers"); // "trainers" | "students"
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // Forms
  const [newTrainerForm, setNewTrainerForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    brandName: "",
    specialty: "",
    phone: "",
    alias: ""
  });

  const [newStudentForm, setNewStudentForm] = useState({
    name: "",
    email: "",
    phone: "",
    trainerId: trainers[0]?.id || "",
    joinDate: new Date().toISOString().split("T")[0],
    goal: "Hipertrofia Muscular",
    planName: "Plan Mensual",
    planPrice: 28000,
    username: "",
    password: ""
  });

  // Toggle Accesos
  const handleToggleTrainer = (trainerId) => {
    toggleTrainerAccess(trainerId);
    refreshData();
  };

  const handleToggleStudent = (studentId) => {
    toggleStudentAccess(studentId);
    refreshData();
  };

  // Crear Profesor
  const handleCreateTrainerSubmit = (e) => {
    e.preventDefault();
    if (!newTrainerForm.name || !newTrainerForm.email || !newTrainerForm.password) return;

    saveTrainer({
      ...newTrainerForm,
      username: newTrainerForm.username || newTrainerForm.email.split("@")[0]
    });

    refreshData();
    setShowTrainerModal(false);
    setNewTrainerForm({
      name: "",
      email: "",
      username: "",
      password: "",
      brandName: "",
      specialty: "",
      phone: "",
      alias: ""
    });
  };

  // Crear Alumno y Asignar a Profesor
  const handleCreateStudentSubmit = (e) => {
    e.preventDefault();
    if (!newStudentForm.name) return;

    saveStudent({
      ...newStudentForm,
      username: newStudentForm.username || newStudentForm.name.toLowerCase().replace(/\s+/g, ""),
      password: newStudentForm.password || "alumno123"
    });

    refreshData();
    setShowStudentModal(false);
  };

  const filteredTrainers = trainers.filter(
    (t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(
    (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: "24px", background: "linear-gradient(135deg, #1C1C1E 0%, #007AFF 100%)", color: "#FFF" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="badge badge-blue" style={{ background: "rgba(255,255,255,0.2)", color: "#FFF", marginBottom: "8px" }}>
              👑 PANEL DE ADMINISTRADOR
            </span>
            <h1 style={{ fontSize: "1.8rem", color: "#FFF", margin: "4px 0" }}>Gestión Global de la Plataforma</h1>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
              Crea profesores y alumnos, asigna relaciones y quita o restaura permisos de acceso.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-lime" onClick={() => setShowTrainerModal(true)}>
              <Plus size={18} /> Crear Profesor
            </button>
            <button className="btn btn-secondary" onClick={() => setShowStudentModal(true)}>
              <Plus size={18} /> Crear Alumno
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", gap: "10px" }}>
        <button
          className={`btn ${activeTab === "trainers" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("trainers")}
        >
          👨‍🏫 Profesores ({trainers.length})
        </button>
        <button
          className={`btn ${activeTab === "students" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("students")}
        >
          🏋️ Alumnos ({students.length})
        </button>
      </div>

      {/* Search Input */}
      <div className="glass-panel" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
        <Search size={16} color="var(--text-secondary)" />
        <input
          type="text"
          className="form-input"
          style={{ background: "transparent", border: "none" }}
          placeholder="Buscar profesor o alumno por nombre o email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* TAB 1: GESTIÓN DE PROFESORES */}
      {activeTab === "trainers" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {filteredTrainers.map((t) => {
            const countStudents = students.filter((s) => s.trainerId === t.id).length;
            const isRevoked = t.status === "revoked";

            return (
              <div
                key={t.id}
                className="glass-panel"
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: isRevoked ? 0.65 : 1,
                  borderLeft: isRevoked ? "4px solid var(--accent-red)" : "4px solid var(--accent-blue)"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <img src={t.avatar} alt={t.name} style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#E5E5EA" }} />
                    <div>
                      <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{t.name}</h3>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{t.brandName || "Profesor"}</span>
                    </div>
                  </div>

                  <div style={{ background: "#F2F2F7", padding: "10px", borderRadius: "8px", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "14px" }}>
                    <div>📧 Email: <strong>{t.email}</strong></div>
                    <div>🔑 Clave: <strong>{t.password}</strong></div>
                    <div>👥 Alumnos asignados: <strong style={{ color: "var(--accent-blue)" }}>{countStudents}</strong></div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                  <span className={`badge ${isRevoked ? "badge-danger" : "badge-success"}`}>
                    {isRevoked ? "🔴 Acceso Revocado" : "🟢 Acceso Habilitado"}
                  </span>

                  <button
                    className={`btn btn-sm ${isRevoked ? "btn-lime" : "btn-danger"}`}
                    onClick={() => handleToggleTrainer(t.id)}
                  >
                    {isRevoked ? <UserCheck size={14} /> : <UserX size={14} />}
                    {isRevoked ? "Habilitar Acceso" : "Quitar Acceso"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: GESTIÓN DE ALUMNOS */}
      {activeTab === "students" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {filteredStudents.map((s) => {
            const assignedTrainer = trainers.find((t) => t.id === s.trainerId);
            const isRevoked = s.status === "revoked";

            return (
              <div
                key={s.id}
                className="glass-panel"
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: isRevoked ? 0.65 : 1,
                  borderLeft: isRevoked ? "4px solid var(--accent-red)" : "4px solid var(--accent-green)"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <img src={s.avatar} alt={s.name} style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#E5E5EA" }} />
                    <div>
                      <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{s.name}</h3>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{s.goal}</span>
                    </div>
                  </div>

                  <div style={{ background: "#F2F2F7", padding: "10px", borderRadius: "8px", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "14px" }}>
                    <div>👨‍🏫 Profesor Asignado: <strong style={{ color: "var(--accent-blue)" }}>{assignedTrainer?.name || "Sin asignar"}</strong></div>
                    <div>🔑 Login: <strong>{s.username}</strong> / Clave: <strong>{s.password}</strong></div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                  <span className={`badge ${isRevoked ? "badge-danger" : "badge-success"}`}>
                    {isRevoked ? "🔴 Acceso Revocado" : "🟢 Acceso Habilitado"}
                  </span>

                  <button
                    className={`btn btn-sm ${isRevoked ? "btn-lime" : "btn-danger"}`}
                    onClick={() => handleToggleStudent(s.id)}
                  >
                    {isRevoked ? <UserCheck size={14} /> : <UserX size={14} />}
                    {isRevoked ? "Habilitar Acceso" : "Quitar Acceso"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear Profesor */}
      <Modal isOpen={showTrainerModal} onClose={() => setShowTrainerModal(false)} title="Crear Nuevo Perfil de Profesor">
        <form onSubmit={handleCreateTrainerSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre del Profesor</label>
            <input
              type="text"
              className="form-input"
              value={newTrainerForm.name}
              onChange={(e) => setNewTrainerForm({ ...newTrainerForm, name: e.target.value })}
              placeholder="Ej: Coach Esteban Pérez"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="form-group">
              <label className="form-label">Email de Acceso</label>
              <input
                type="email"
                className="form-input"
                value={newTrainerForm.email}
                onChange={(e) => setNewTrainerForm({ ...newTrainerForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="text"
                className="form-input"
                value={newTrainerForm.password}
                onChange={(e) => setNewTrainerForm({ ...newTrainerForm, password: e.target.value })}
                placeholder="esteban123"
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowTrainerModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-lime">Crear Profesor</button>
          </div>
        </form>
      </Modal>

      {/* Modal Crear Alumno */}
      <Modal isOpen={showStudentModal} onClose={() => setShowStudentModal(false)} title="Crear Nuevo Alumno y Asignar a Profesor">
        <form onSubmit={handleCreateStudentSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre Completo del Alumno</label>
            <input
              type="text"
              className="form-input"
              value={newStudentForm.name}
              onChange={(e) => {
                const val = e.target.value;
                const clean = val.toLowerCase().replace(/[^a-z0-9]/g, "");
                setNewStudentForm({
                  ...newStudentForm,
                  name: val,
                  username: clean ? `${clean}.fit` : "",
                  password: clean ? `${clean}123` : ""
                });
              }}
              placeholder="Ej: Nicolás Gómez"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Asignar a Profesor</label>
            <select
              className="form-select"
              value={newStudentForm.trainerId}
              onChange={(e) => setNewStudentForm({ ...newStudentForm, trainerId: e.target.value })}
              required
            >
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.brandName || "Profesor"})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="form-group">
              <label className="form-label">Usuario de Login</label>
              <input
                type="text"
                className="form-input"
                value={newStudentForm.username}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="text"
                className="form-input"
                value={newStudentForm.password}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, password: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowStudentModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-lime">Crear Alumno</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
