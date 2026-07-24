import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  saveTrainer,
  deleteTrainer,
  saveStudent,
  deleteStudent,
  toggleTrainerAccess,
  toggleStudentAccess
} from "../../services/storageService";
import { StudentAvatar } from "../common/StudentAvatar";
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
  DollarSign,
  Edit,
  Trash2
} from "lucide-react";

export const MasterDashboard = () => {
  const { trainers, students, refreshData } = useAuth();
  const [activeTab, setActiveTab] = useState("trainers"); // "trainers" | "students"
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);

  // Forms
  const [trainerForm, setTrainerForm] = useState({
    id: "",
    name: "",
    gender: "male",
    email: "",
    username: "",
    password: "",
    brandName: "",
    specialty: "",
    phone: "",
    alias: ""
  });

  const [studentForm, setStudentForm] = useState({
    id: "",
    name: "",
    gender: "male",
    phone: "",
    trainerId: trainers[0]?.id || "",
    joinDate: new Date().toISOString().split("T")[0],
    goal: "Hipertrofia Muscular",
    planName: "Plan Mensual",
    planPrice: 28000,
    username: "",
    password: ""
  });

  // Abrir Modal Crear Profesor
  const handleOpenNewTrainer = () => {
    setEditingTrainer(null);
    setTrainerForm({
      id: "",
      name: "",
      gender: "male",
      email: "",
      username: "",
      password: "",
      brandName: "",
      specialty: "",
      phone: "",
      alias: ""
    });
    setShowTrainerModal(true);
  };

  // Abrir Modal Editar Profesor
  const handleOpenEditTrainer = (trainer) => {
    setEditingTrainer(trainer);
    setTrainerForm({
      id: trainer.id,
      name: trainer.name,
      gender: trainer.gender || "male",
      email: trainer.email,
      username: trainer.username || trainer.email?.split("@")[0],
      password: trainer.password,
      brandName: trainer.brandName || "",
      specialty: trainer.specialty || "",
      phone: trainer.phone || "",
      alias: trainer.alias || ""
    });
    setShowTrainerModal(true);
  };

  // Abrir Modal Crear Alumno
  const handleOpenNewStudent = () => {
    setEditingStudent(null);
    setStudentForm({
      id: "",
      name: "",
      gender: "male",
      phone: "",
      trainerId: trainers[0]?.id || "",
      joinDate: new Date().toISOString().split("T")[0],
      goal: "Hipertrofia Muscular",
      planName: "Plan Mensual",
      planPrice: 28000,
      username: "",
      password: ""
    });
    setShowStudentModal(true);
  };

  // Abrir Modal Editar Alumno
  const handleOpenEditStudent = (student) => {
    setEditingStudent(student);
    setStudentForm({
      id: student.id,
      name: student.name,
      gender: student.gender || "male",
      phone: student.phone || "",
      trainerId: student.trainerId || trainers[0]?.id || "",
      joinDate: student.joinDate || new Date().toISOString().split("T")[0],
      goal: student.goal || "Hipertrofia Muscular",
      planName: student.planName || "Plan Mensual",
      planPrice: student.planPrice || 28000,
      username: student.username || "",
      password: student.password || ""
    });
    setShowStudentModal(true);
  };

  // Guardar Profesor (Crear / Modificar)
  const handleSaveTrainerSubmit = (e) => {
    e.preventDefault();
    if (!trainerForm.name || !trainerForm.email || !trainerForm.password) return;

    saveTrainer({
      ...trainerForm,
      username: trainerForm.username || trainerForm.email.split("@")[0]
    });

    refreshData();
    setShowTrainerModal(false);
  };

  // Eliminar Profesor
  const handleDeleteTrainer = (trainerId, trainerName) => {
    if (confirm(`¿Estás seguro de eliminar permanentemente al profesor "${trainerName}"?`)) {
      deleteTrainer(trainerId);
      refreshData();
    }
  };

  // Guardar Alumno (Crear / Modificar)
  const handleSaveStudentSubmit = (e) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.username) return;

    saveStudent({
      ...studentForm,
      username: studentForm.username,
      password: studentForm.password || "alumno123"
    });

    refreshData();
    setShowStudentModal(false);
  };

  // Eliminar Alumno
  const handleDeleteStudent = (studentId, studentName) => {
    if (confirm(`¿Estás seguro de eliminar permanentemente al alumno "${studentName}"?`)) {
      deleteStudent(studentId);
      refreshData();
    }
  };

  // Toggle Accesos
  const handleToggleTrainer = (trainerId) => {
    toggleTrainerAccess(trainerId);
    refreshData();
  };

  const handleToggleStudent = (studentId) => {
    toggleStudentAccess(studentId);
    refreshData();
  };

  const filteredTrainers = trainers.filter(
    (t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(
    (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.username || "").toLowerCase().includes(searchQuery.toLowerCase())
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
              Crea, edita o elimina profesores y alumnos, asigna relaciones y avatares por género.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-lime" onClick={handleOpenNewTrainer}>
              <Plus size={18} /> Crear Profesor
            </button>
            <button className="btn btn-secondary" onClick={handleOpenNewStudent}>
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
          💪 Profesores ({trainers.length})
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
          placeholder="Buscar por nombre o usuario..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* TAB 1: GESTIÓN DE PROFESORES */}
      {activeTab === "trainers" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {filteredTrainers.length === 0 ? (
            <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)", gridColumn: "1 / -1" }}>
              No hay profesores registrados. Presiona "Crear Profesor" para añadir el primero.
            </div>
          ) : (
            filteredTrainers.map((t) => {
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
                      <StudentAvatar gender={t.gender || "male"} name={t.name} size={48} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{t.name}</h3>
                          <span>💪</span>
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{t.brandName || "Profesor"}</span>
                      </div>
                    </div>

                    <div style={{ background: "#F2F2F7", padding: "10px", borderRadius: "8px", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "14px" }}>
                      <div>📧 Email: <strong>{t.email}</strong></div>
                      <div>🔑 Clave: <strong>{t.password}</strong></div>
                      <div>👥 Alumnos asignados: <strong style={{ color: "var(--accent-blue)" }}>{countStudents}</strong></div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className={`badge ${isRevoked ? "badge-danger" : "badge-success"}`}>
                        {isRevoked ? "🔴 Acceso Revocado" : "🟢 Acceso Habilitado"}
                      </span>

                      <button
                        className={`btn btn-sm ${isRevoked ? "btn-lime" : "btn-secondary"}`}
                        onClick={() => handleToggleTrainer(t.id)}
                      >
                        {isRevoked ? <UserCheck size={14} /> : <UserX size={14} />}
                        {isRevoked ? "Habilitar" : "Suspender"}
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleOpenEditTrainer(t)}>
                        <Edit size={14} /> Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTrainer(t.id, t.name)} title="Eliminar Profesor">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: GESTIÓN DE ALUMNOS */}
      {activeTab === "students" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {filteredStudents.length === 0 ? (
            <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)", gridColumn: "1 / -1" }}>
              No hay alumnos registrados. Presiona "Crear Alumno" para añadir el primero.
            </div>
          ) : (
            filteredStudents.map((s) => {
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
                      <StudentAvatar gender={s.gender} name={s.name} size={48} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{s.name}</h3>
                          <span>{s.gender === "female" ? "👩" : "👨"}</span>
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{s.goal}</span>
                      </div>
                    </div>

                    <div style={{ background: "#F2F2F7", padding: "10px", borderRadius: "8px", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "14px" }}>
                      <div>💪 Profesor Asignado: <strong style={{ color: "var(--accent-blue)" }}>{assignedTrainer?.name || "Sin asignar"}</strong></div>
                      <div>🔑 Usuario Login: <strong style={{ color: "var(--accent-blue)" }}>{s.username}</strong></div>
                      <div>🔐 Contraseña: <strong>{s.password}</strong></div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className={`badge ${isRevoked ? "badge-danger" : "badge-success"}`}>
                        {isRevoked ? "🔴 Acceso Revocado" : "🟢 Acceso Habilitado"}
                      </span>

                      <button
                        className={`btn btn-sm ${isRevoked ? "btn-lime" : "btn-secondary"}`}
                        onClick={() => handleToggleStudent(s.id)}
                      >
                        {isRevoked ? <UserCheck size={14} /> : <UserX size={14} />}
                        {isRevoked ? "Habilitar" : "Suspender"}
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleOpenEditStudent(s)}>
                        <Edit size={14} /> Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStudent(s.id, s.name)} title="Eliminar Alumno">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Crear / Editar Profesor */}
      <Modal isOpen={showTrainerModal} onClose={() => setShowTrainerModal(false)} title={editingTrainer ? `Editar Profesor - ${editingTrainer.name}` : "Crear Perfil de Profesor"}>
        <form onSubmit={handleSaveTrainerSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre del Profesor</label>
            <input
              type="text"
              className="form-input"
              value={trainerForm.name}
              onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
              placeholder="Ej: Coach Esteban Pérez"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label">Género del Profesor</label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              background: "#F2F2F7",
              padding: "4px",
              borderRadius: "12px"
            }}>
              <button
                type="button"
                onClick={() => setTrainerForm({ ...trainerForm, gender: "male" })}
                style={{
                  border: "none",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.16s ease",
                  background: trainerForm.gender === "male" ? "#007AFF" : "transparent",
                  color: trainerForm.gender === "male" ? "#FFFFFF" : "var(--text-secondary)",
                  boxShadow: trainerForm.gender === "male" ? "0 2px 8px rgba(0,122,255,0.3)" : "none"
                }}
              >
                👨 Masculino
              </button>

              <button
                type="button"
                onClick={() => setTrainerForm({ ...trainerForm, gender: "female" })}
                style={{
                  border: "none",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.16s ease",
                  background: trainerForm.gender === "female" ? "#FF2D55" : "transparent",
                  color: trainerForm.gender === "female" ? "#FFFFFF" : "var(--text-secondary)",
                  boxShadow: trainerForm.gender === "female" ? "0 2px 8px rgba(255,45,85,0.3)" : "none"
                }}
              >
                👩 Femenino
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            <div className="form-group">
              <label className="form-label">Email de Acceso</label>
              <input
                type="email"
                className="form-input"
                value={trainerForm.email}
                onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="text"
                className="form-input"
                value={trainerForm.password}
                onChange={(e) => setTrainerForm({ ...trainerForm, password: e.target.value })}
                placeholder="esteban123"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre de Marca / Estudio (Opcional)</label>
            <input
              type="text"
              className="form-input"
              value={trainerForm.brandName}
              onChange={(e) => setTrainerForm({ ...trainerForm, brandName: e.target.value })}
              placeholder="Ej: Esteban Fitness Studio"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowTrainerModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-lime">{editingTrainer ? "Guardar Cambios" : "Crear Profesor"}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Crear / Editar Alumno */}
      <Modal isOpen={showStudentModal} onClose={() => setShowStudentModal(false)} title={editingStudent ? `Editar Alumno - ${editingStudent.name}` : "Crear Nuevo Alumno"}>
        <form onSubmit={handleSaveStudentSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre Completo del Alumno</label>
            <input
              type="text"
              className="form-input"
              value={studentForm.name}
              onChange={(e) => {
                const val = e.target.value;
                const clean = val.toLowerCase().replace(/[^a-z0-9]/g, "");
                setStudentForm({
                  ...studentForm,
                  name: val,
                  username: studentForm.username || (clean ? `${clean}.fit` : ""),
                  password: studentForm.password || (clean ? `${clean}123` : "")
                });
              }}
              placeholder="Ej: Nicolás Gómez"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label">Género del Alumno</label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              background: "#F2F2F7",
              padding: "4px",
              borderRadius: "12px"
            }}>
              <button
                type="button"
                onClick={() => setStudentForm({ ...studentForm, gender: "male" })}
                style={{
                  border: "none",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.16s ease",
                  background: studentForm.gender === "male" ? "#007AFF" : "transparent",
                  color: studentForm.gender === "male" ? "#FFFFFF" : "var(--text-secondary)",
                  boxShadow: studentForm.gender === "male" ? "0 2px 8px rgba(0,122,255,0.3)" : "none"
                }}
              >
                👨 Masculino
              </button>

              <button
                type="button"
                onClick={() => setStudentForm({ ...studentForm, gender: "female" })}
                style={{
                  border: "none",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.16s ease",
                  background: studentForm.gender === "female" ? "#FF2D55" : "transparent",
                  color: studentForm.gender === "female" ? "#FFFFFF" : "var(--text-secondary)",
                  boxShadow: studentForm.gender === "female" ? "0 2px 8px rgba(255,45,85,0.3)" : "none"
                }}
              >
                👩 Femenino
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Asignar a Profesor</label>
            <select
              className="form-select"
              value={studentForm.trainerId}
              onChange={(e) => setStudentForm({ ...studentForm, trainerId: e.target.value })}
              required
            >
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.brandName || "Profesor"})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            <div className="form-group">
              <label className="form-label">Usuario de Acceso</label>
              <input
                type="text"
                className="form-input"
                value={studentForm.username}
                onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                placeholder="nicolas.fit"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="text"
                className="form-input"
                value={studentForm.password}
                onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                placeholder="nicolas123"
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowStudentModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-lime">{editingStudent ? "Guardar Cambios" : "Crear Alumno"}</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
