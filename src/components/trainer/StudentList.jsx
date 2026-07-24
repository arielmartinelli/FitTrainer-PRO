import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { saveStudent, deleteStudent } from "../../services/storageService";
import { Modal } from "../common/Modal";
import {
  Users,
  Search,
  Plus,
  User,
  Calendar,
  DollarSign,
  Dumbbell,
  CreditCard,
  Trash2,
  Eye,
  Key,
  CheckCircle2
} from "lucide-react";

export const StudentList = ({ onSelectStudent, isCreateModalOpen, setIsCreateModalOpen }) => {
  const { currentUser, students, refreshData } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [newStudentForm, setNewStudentForm] = useState({
    name: "",
    email: "",
    phone: "",
    joinDate: new Date().toISOString().split("T")[0],
    goal: "Hipertrofia y Ganancia Muscular",
    notes: "",
    planName: "Plan Mensual 4 Días",
    planPrice: 28000,
    username: "",
    password: ""
  });

  const trainerStudents = students.filter((s) => s.trainerId === currentUser?.id);

  const filteredStudents = trainerStudents.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && s.paymentStatus === statusFilter;
  });

  // Autogenerar usuario y clave cuando escribe el nombre
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
    setNewStudentForm({
      name: "",
      email: "",
      phone: "",
      joinDate: new Date().toISOString().split("T")[0],
      goal: "Hipertrofia y Ganancia Muscular",
      notes: "",
      planName: "Plan Mensual 4 Días",
      planPrice: 28000,
      username: "",
      password: ""
    });
  };

  const handleDelete = (studentId, studentName) => {
    if (confirm(`¿Estás seguro de eliminar a ${studentName}?`)) {
      deleteStudent(studentId);
      refreshData();
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Title Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <Users className="gradient-text" size={28} /> Mis Alumnos
          </h2>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Gestiona las fichas, progreso, rutinas y accesos de tus clientes.
          </span>
        </div>

        <button className="btn btn-lime" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={18} /> Crear Nuevo Alumno
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        
        <div style={{ position: "relative", minWidth: "280px" }}>
          <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "36px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button className={`btn btn-sm ${statusFilter === "all" ? "btn-primary" : "btn-ghost"}`} onClick={() => setStatusFilter("all")}>
            Todos ({trainerStudents.length})
          </button>
          <button className={`btn btn-sm ${statusFilter === "paid" ? "btn-lime" : "btn-ghost"}`} onClick={() => setStatusFilter("paid")}>
            🟢 Al día
          </button>
          <button className={`btn btn-sm ${statusFilter === "due_soon" ? "btn-secondary" : "btn-ghost"}`} onClick={() => setStatusFilter("due_soon")}>
            🟡 Por vencer
          </button>
          <button className={`btn btn-sm ${statusFilter === "overdue" ? "btn-danger" : "btn-ghost"}`} onClick={() => setStatusFilter("overdue")}>
            🔴 Vencidos
          </button>
        </div>

      </div>

      {/* Student Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {filteredStudents.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            No se encontraron alumnos con los criterios seleccionados.
          </div>
        ) : (
          filteredStudents.map((st) => (
            <div key={st.id} className="glass-panel animate-fade-in" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
              
              <div>
                {/* Header Card */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                  <img
                    src={st.avatar}
                    alt={st.name}
                    style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#1A202C" }}
                  />
                  <div>
                    <h3 style={{ fontSize: "1.15rem", cursor: "pointer", color: "#FFF" }} onClick={() => onSelectStudent(st)}>
                      {st.name}
                    </h3>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={12} color="var(--accent-cyan)" /> Ingreso: {st.joinDate}
                    </div>
                  </div>
                </div>

                {/* Status & Plan Info */}
                <div style={{ background: "rgba(9,11,14,0.6)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Plan:</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#FFF" }}>{st.planName || "Plan Mensual"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Cuota:</span>
                    {st.paymentStatus === "paid" && <span className="badge badge-success">🟢 Al día ({st.nextDueDate})</span>}
                    {st.paymentStatus === "due_soon" && <span className="badge badge-warning">🟡 Vence {st.nextDueDate}</span>}
                    {st.paymentStatus === "overdue" && <span className="badge badge-danger">🔴 Vencido</span>}
                  </div>
                </div>

                {/* Credentials Preview */}
                <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                  <Key size={12} color="var(--accent-cyan)" /> Usuario Alumno: <strong style={{ color: "var(--accent-cyan)" }}>{st.username}</strong>
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onSelectStudent(st)}>
                  <Eye size={14} /> Ver Ficha
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--accent-rose)" }} onClick={() => handleDelete(st.id, st.name)} title="Eliminar alumno">
                  <Trash2 size={14} />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Modal Crear Nuevo Alumno */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Alumno"
      >
        <form onSubmit={handleCreateStudent}>
          
          <div className="form-group">
            <label className="form-label">Nombre Completo del Alumno</label>
            <input
              type="text"
              className="form-input"
              value={newStudentForm.name}
              onChange={handleNameChange}
              placeholder="Ej: Mateo Rossi"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Fecha de Ingreso</label>
              <input
                type="date"
                className="form-input"
                value={newStudentForm.joinDate}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, joinDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Objetivo Principal</label>
              <select
                className="form-select"
                value={newStudentForm.goal}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, goal: e.target.value })}
              >
                <option value="Hipertrofia y Ganancia Muscular">Hipertrofia & M. Muscular</option>
                <option value="Pérdida de Grasa y Tonificación">Pérdida de Grasa & Tono</option>
                <option value="Fuerza Máxima 1RM">Fuerza Máxima</option>
                <option value="Rendimiento Deportivo">Rendimiento Deportivo</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Nombre del Plan de Cuota</label>
              <input
                type="text"
                className="form-input"
                value={newStudentForm.planName}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, planName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Precio de Cuota ($)</label>
              <input
                type="number"
                className="form-input"
                value={newStudentForm.planPrice}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, planPrice: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Autogenerated Credentials Box */}
          <div style={{ background: "rgba(0, 242, 254, 0.08)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(0, 242, 254, 0.2)", margin: "10px 0 16px 0" }}>
            <div style={{ fontWeight: 700, color: "var(--accent-cyan)", fontSize: "0.85rem", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Key size={16} /> Credenciales Generadas para el Alumno
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Usuario para Login:</span>
                <input
                  type="text"
                  className="form-input"
                  value={newStudentForm.username}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Contraseña:</span>
                <input
                  type="text"
                  className="form-input"
                  value={newStudentForm.password}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, password: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-lime">
              Crear Alumno
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
};
