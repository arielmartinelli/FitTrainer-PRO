import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { saveStudent, toggleStudentAccess } from "../../services/storageService";
import { StudentAvatar } from "../common/StudentAvatar";
import { Modal } from "../common/Modal";
import { Users, Search, Plus, Eye, Key, UserX, UserCheck, CheckCircle2, AlertCircle } from "lucide-react";

export const StudentListClean = ({ onSelectStudent, isCreateModalOpen, setIsCreateModalOpen }) => {
  const { currentUser, students, refreshData } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTooltipStudentId, setActiveTooltipStudentId] = useState(null);

  const [newStudentForm, setNewStudentForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "male",
    joinDate: new Date().toISOString().split("T")[0],
    goal: "Hipertrofia Muscular",
    planName: "Plan Mensual",
    planPrice: 28000,
    username: "",
    password: ""
  });

  const trainerStudents = students.filter((s) => s.trainerId === currentUser?.id);

  const filteredStudents = trainerStudents.filter(
    (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNameChange = (e) => {
    const val = e.target.value;
    const cleanUser = val.toLowerCase().replace(/[^a-z0-9]/g, "");
    setNewStudentForm({
      ...newStudentForm,
      name: val,
      username: cleanUser ? `${cleanUser}.fit` : "",
      password: cleanUser ? `${cleanUser}123` : ""
    });
  };

  const handleCreateStudent = (e) => {
    e.preventDefault();
    if (!newStudentForm.name) return;

    saveStudent({
      ...newStudentForm,
      trainerId: currentUser?.id
    });

    refreshData();
    setIsCreateModalOpen(false);
  };

  const handleToggleAccess = (studentId) => {
    toggleStudentAccess(studentId);
    refreshData();
  };

  const toggleTooltip = (e, studentId) => {
    e.stopPropagation();
    setActiveTooltipStudentId(activeTooltipStudentId === studentId ? null : studentId);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem" }}>Mis Alumnos ({trainerStudents.length})</h2>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Listado de clientes asignados a tu cuenta de profesor.
          </span>
        </div>

        <button className="btn btn-lime" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={18} /> Crear Nuevo Alumno
        </button>
      </div>

      <div className="glass-panel" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
        <Search size={16} color="var(--text-secondary)" />
        <input
          type="text"
          className="form-input"
          style={{ background: "transparent", border: "none" }}
          placeholder="Buscar alumno por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
        {filteredStudents.map((st) => {
          const isRevoked = st.status === "revoked";
          const isDone = st.questionnaireCompleted;
          const showTooltip = activeTooltipStudentId === st.id;

          return (
            <div key={st.id} className="glass-panel" style={{ padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: isRevoked ? 0.65 : 1 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <StudentAvatar gender={st.gender} name={st.name} size={46} />
                    <div>
                      <h3 style={{ fontSize: "1.05rem", margin: 0 }}>{st.name}</h3>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Ingreso: {st.joinDate}</div>
                    </div>
                  </div>

                  {/* ICONO DEL CUESTIONARIO (SOLO ICONO POR DEFECTO, CON CLIC DESPLEGABLE) */}
                  <div
                    style={{ position: "relative", cursor: "pointer" }}
                    onClick={(e) => toggleTooltip(e, st.id)}
                    title="Haz clic para ver el estado del cuestionario"
                  >
                    {isDone ? (
                      <div style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        background: "rgba(52, 199, 89, 0.15)",
                        border: "1px solid rgba(52, 199, 89, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <CheckCircle2 size={18} color="#34C759" />
                      </div>
                    ) : (
                      <div style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        background: "rgba(255, 59, 48, 0.15)",
                        border: "1px solid rgba(255, 59, 48, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <AlertCircle size={18} color="#FF3B30" />
                      </div>
                    )}

                    {showTooltip && (
                      <div style={{
                        position: "absolute",
                        right: 0,
                        top: "40px",
                        background: "#1C1C1E",
                        color: "#FFFFFF",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        whiteSpace: "nowrap",
                        zIndex: 10,
                        boxShadow: "0 4px 14px rgba(0,0,0,0.2)"
                      }}>
                        {isDone ? "✔️ Cuestionario Realizado" : "❗ Cuestionario Pendiente"}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ background: "#F2F2F7", padding: "8px 12px", borderRadius: "8px", fontSize: "0.8rem", marginBottom: "12px" }}>
                  <div>Plan: <strong>{st.planName || "Plan Mensual"}</strong></div>
                  <div>Login: <strong style={{ color: "var(--accent-blue)" }}>{st.username}</strong></div>
                  <div>Acceso: <strong>{isRevoked ? "🔴 Suspendido" : "🟢 Activo"}</strong></div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onSelectStudent(st)}>
                  <Eye size={14} /> Ver Ficha
                </button>

                <button className={`btn btn-sm ${isRevoked ? "btn-lime" : "btn-danger"}`} onClick={() => handleToggleAccess(st.id)} title={isRevoked ? "Habilitar Acceso" : "Quitar Acceso"}>
                  {isRevoked ? <UserCheck size={14} /> : <UserX size={14} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear Alumno con Segmented Control de Género Inmune a Deformaciones */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Crear Nuevo Alumno">
        <form onSubmit={handleCreateStudent}>
          <div className="form-group">
            <label className="form-label">Nombre Completo</label>
            <input
              type="text"
              className="form-input"
              value={newStudentForm.name}
              onChange={handleNameChange}
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
                onClick={() => setNewStudentForm({ ...newStudentForm, gender: "male" })}
                style={{
                  border: "none",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.16s ease",
                  background: newStudentForm.gender === "male" ? "#007AFF" : "transparent",
                  color: newStudentForm.gender === "male" ? "#FFFFFF" : "var(--text-secondary)",
                  boxShadow: newStudentForm.gender === "male" ? "0 2px 8px rgba(0,122,255,0.3)" : "none"
                }}
              >
                👨 Masculino
              </button>

              <button
                type="button"
                onClick={() => setNewStudentForm({ ...newStudentForm, gender: "female" })}
                style={{
                  border: "none",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.16s ease",
                  background: newStudentForm.gender === "female" ? "#FF2D55" : "transparent",
                  color: newStudentForm.gender === "female" ? "#FFFFFF" : "var(--text-secondary)",
                  boxShadow: newStudentForm.gender === "female" ? "0 2px 8px rgba(255,45,85,0.3)" : "none"
                }}
              >
                👩 Femenino
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
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
            <button type="button" className="btn btn-ghost" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-lime">Crear Alumno</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
