import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getRoutines, recordStudentPayment, saveStudent } from "../../services/storageService";
import { ProgressChart } from "./ProgressChart";
import { Modal } from "../common/Modal";
import {
  User,
  Calendar,
  DollarSign,
  Dumbbell,
  Key,
  TrendingUp,
  CreditCard,
  Copy,
  Check,
  Send,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RefreshCw,
  Plus
} from "lucide-react";

export const StudentDetail = ({ student, onBack }) => {
  const { currentUser, refreshData } = useAuth();
  const [activeTab, setActiveTab] = useState("progress"); // "progress" | "routine" | "payments" | "credentials" | "workouts"
  const [copiedText, setCopiedText] = useState(false);
  const [showAssignRoutineModal, setShowAssignRoutineModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: student?.planPrice || 25000,
    date: new Date().toISOString().split("T")[0],
    method: "Transferencia Bancaria",
    plan: student?.planName || "Plan Mensual",
    notes: ""
  });

  const routines = getRoutines(currentUser?.id);
  const assignedRoutine = routines.find((r) => r.id === student?.assignedRoutineId);

  // Copiar Credenciales
  const handleCopyCredentials = () => {
    const text = `💪 ¡Hola ${student.name}! Aquí tienes los datos de acceso para ver tu rutina en FitTrainer Pro:\n\n🔗 Usuario: ${student.username}\n🔑 Contraseña: ${student.password}\n\nIngresa desde la web para ver tu entrenamiento de hoy.`;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  // Enviar Credenciales por WhatsApp
  const handleWhatsAppSend = () => {
    const text = encodeURIComponent(
      `💪 ¡Hola ${student.name}! Te comparto tus datos para ingresar a ver tu rutina en FitTrainer Pro:\n\n*Usuario:* ${student.username}\n*Contraseña:* ${student.password}\n\n¡A entrenar con todo!`
    );
    const cleanPhone = (student.phone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  // Asignar Rutina desde Biblioteca
  const handleAssignRoutine = (routineId) => {
    saveStudent({
      ...student,
      assignedRoutineId: routineId
    });
    refreshData();
    setShowAssignRoutineModal(false);
  };

  // Confirmar Pago
  const handleSubmitPayment = (e) => {
    e.preventDefault();
    recordStudentPayment(student.id, paymentForm);
    refreshData();
    setShowPayModal(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Top Header Card */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: "12px" }}>
          <ArrowLeft size={16} /> Volver a Lista de Alumnos
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img
              src={student.avatar}
              alt={student.name}
              style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#1A202C", border: "2px solid var(--accent-cyan)" }}
            />
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "2px" }}>{student.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={14} color="var(--accent-cyan)" /> Fecha Ingreso: <strong style={{ color: "#FFF" }}>{student.joinDate}</strong>
                </span>
                
                {student.paymentStatus === "paid" && <span className="badge badge-success">🟢 Al Día</span>}
                {student.paymentStatus === "due_soon" && <span className="badge badge-warning">🟡 Por Vencer ({student.nextDueDate})</span>}
                {student.paymentStatus === "overdue" && <span className="badge badge-danger">🔴 Cuota Vencida</span>}

                <span className="badge badge-cyan">🎯 {student.goal}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-lime btn-sm" onClick={() => setShowPayModal(true)}>
              <CreditCard size={15} /> Registrar Pago
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleCopyCredentials}>
              {copiedText ? <Check size={15} color="var(--accent-lime)" /> : <Copy size={15} />} Credenciales
            </button>
          </div>

        </div>

      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "8px", overflowX: "auto" }}>
        <button
          className={`btn ${activeTab === "progress" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("progress")}
        >
          <TrendingUp size={16} /> Evolución y Medidas
        </button>
        <button
          className={`btn ${activeTab === "routine" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("routine")}
        >
          <Dumbbell size={16} /> Rutina Asignada
        </button>
        <button
          className={`btn ${activeTab === "payments" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("payments")}
        >
          <DollarSign size={16} /> Estado de Pagos
        </button>
        <button
          className={`btn ${activeTab === "credentials" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("credentials")}
        >
          <Key size={16} /> Acceso Alumno
        </button>
        <button
          className={`btn ${activeTab === "workouts" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("workouts")}
        >
          <Clock size={16} /> Sesiones Realizadas ({student.completedWorkouts?.length || 0})
        </button>
      </div>

      {/* TAB 1: EVOLUCIÓN Y MEDIDAS */}
      {activeTab === "progress" && (
        <ProgressChart student={student} />
      )}

      {/* TAB 2: RUTINA ASIGNADA */}
      {activeTab === "routine" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div className="glass-panel" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Rutina Actualmente Asignada</div>
              <h3 style={{ fontSize: "1.3rem", color: "var(--accent-cyan)", margin: "4px 0" }}>
                {assignedRoutine ? assignedRoutine.title : "Sin rutina asignada"}
              </h3>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {assignedRoutine ? assignedRoutine.description : "Haz clic en 'Cambiar / Asignar Rutina' para seleccionar un plan."}
              </span>
            </div>

            <button className="btn btn-lime btn-sm" onClick={() => setShowAssignRoutineModal(true)}>
              <RefreshCw size={15} /> Cambiar / Asignar Rutina
            </button>
          </div>

          {assignedRoutine ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {assignedRoutine.days.map((day, dIdx) => (
                <div key={dIdx} className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid var(--accent-cyan)" }}>
                  <h4 style={{ color: "var(--accent-cyan)", marginBottom: "12px", fontSize: "1.1rem" }}>{day.dayName}</h4>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {day.exercises.map((ex, eIdx) => (
                      <div key={eIdx} style={{ padding: "10px 14px", background: "rgba(9,11,14,0.6)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <span style={{ fontWeight: 700, color: "#FFF", fontSize: "0.95rem" }}>{ex.name}</span>
                          {ex.notes && <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>💡 {ex.notes}</div>}
                        </div>
                        <div style={{ display: "flex", gap: "12px", fontSize: "0.85rem" }}>
                          <span><strong>{ex.sets}</strong> series</span>
                          <span><strong>{ex.reps}</strong> reps</span>
                          <span>Descanso: <strong>{ex.restSec}s</strong></span>
                          <span className="badge badge-lime">{ex.rpe}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              Este alumno no tiene una rutina asignada todavía.
            </div>
          )}

        </div>
      )}

      {/* TAB 3: ESTADO DE PAGOS */}
      {activeTab === "payments" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <DollarSign color="var(--accent-lime)" size={20} /> Información de Cuota y Cobros
              </h3>
              <button className="btn btn-lime btn-sm" onClick={() => setShowPayModal(true)}>
                <CreditCard size={15} /> Registrar Nuevo Pago
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PLAN DE SUSCRIPCIÓN</span>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#FFF" }}>{student.planName || "Plan Mensual"}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>VALOR DE CUOTA</span>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--accent-lime)" }}>${(student.planPrice || 25000).toLocaleString('es-AR')}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PRÓXIMO VENCIMIENTO</span>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--accent-cyan)" }}>{student.nextDueDate || "Sin definir"}</div>
              </div>
            </div>

            <h4 style={{ fontSize: "0.95rem", marginBottom: "10px", color: "var(--text-main)" }}>Historial de Transacciones</h4>

            {(!student.payments || student.payments.length === 0) ? (
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No hay pagos registrados para este alumno.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {student.payments.map((p, idx) => (
                  <div key={idx} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#FFF" }}>{p.plan} (${Number(p.amount).toLocaleString('es-AR')})</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.date} • {p.method}</div>
                    </div>
                    <span className="badge badge-success">Aprobado</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ACCESO ALUMNO / CREDENCIALES */}
      {activeTab === "credentials" && (
        <div className="animate-fade-in glass-panel" style={{ padding: "24px", maxWidth: "600px" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Key color="var(--accent-cyan)" size={20} /> Credenciales de Acceso para el Alumno
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>
            Con este usuario y contraseña, el alumno podrá ingresar a la aplicación para ver su rutina del día en el gimnasio y llevar su registro de pesos.
          </p>

          <div style={{ background: "rgba(9,11,14,0.8)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color)", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Usuario:</span>
              <strong style={{ color: "var(--accent-cyan)", fontSize: "1rem" }}>{student.username}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Contraseña:</span>
              <strong style={{ color: "var(--accent-lime)", fontSize: "1rem" }}>{student.password}</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCopyCredentials}>
              {copiedText ? <Check size={16} color="var(--accent-lime)" /> : <Copy size={16} />} Copiar Datos
            </button>
            <button className="btn btn-lime" style={{ flex: 1 }} onClick={handleWhatsAppSend}>
              <Send size={16} /> Enviar por WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: SESIONES REALIZADAS */}
      {activeTab === "workouts" && (
        <div className="animate-fade-in glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={18} color="var(--accent-lime)" /> Historial de Entrenamientos del Alumno
          </h3>

          {(!student.completedWorkouts || student.completedWorkouts.length === 0) ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              El alumno no ha registrado entrenamientos completados en la aplicación aún.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {student.completedWorkouts.map((w, idx) => (
                <div key={idx} style={{ padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", borderLeft: "3px solid var(--accent-lime)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 700, color: "#FFF" }}>{w.dayName}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--accent-cyan)" }}>{w.date}</span>
                  </div>
                  {w.studentNotes && (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "8px" }}>
                      "{w.studentNotes}"
                    </p>
                  )}
                  {w.logs && w.logs.length > 0 && (
                    <div style={{ fontSize: "0.8rem", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {w.logs.map((l, lIdx) => (
                        <span key={lIdx} className="badge badge-cyan">
                          {l.exercise}: {l.bestWeight} ({l.setsDone} series)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Asignar Rutina */}
      <Modal
        isOpen={showAssignRoutineModal}
        onClose={() => setShowAssignRoutineModal(false)}
        title="Seleccionar Rutina de la Biblioteca"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {routines.map((r) => (
            <div
              key={r.id}
              style={{
                padding: "12px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: "#FFF" }}>{r.title}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.days?.length || 0} Días de entrenamiento</div>
              </div>
              <button
                className="btn btn-lime btn-sm"
                onClick={() => handleAssignRoutine(r.id)}
              >
                Asignar
              </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal Registrar Pago */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title={`Registrar Pago para ${student.name}`}
      >
        <form onSubmit={handleSubmitPayment}>
          <div className="form-group">
            <label className="form-label">Monto Acreditado ($)</label>
            <input
              type="number"
              className="form-input"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha del Pago</label>
            <input
              type="date"
              className="form-input"
              value={paymentForm.date}
              onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Medio de Pago</label>
            <select
              className="form-select"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
            >
              <option value="Transferencia Bancaria">Transferencia Bancaria</option>
              <option value="Efectivo">Efectivo</option>
              <option value="MercadoPago / Tarjeta">MercadoPago / Tarjeta</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowPayModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-lime">
              Guardar Pago
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
