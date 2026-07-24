import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getRoutines, recordStudentPayment, saveStudent, toggleStudentAccess, reopenStudentQuestionnaire } from "../../services/storageService";
import { StudentAvatar } from "../common/StudentAvatar";
import { Modal } from "../common/Modal";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Copy,
  Check,
  Send,
  Dumbbell,
  DollarSign,
  Key,
  ClipboardList,
  Activity,
  Heart,
  Moon,
  RefreshCw,
  UserX,
  UserCheck,
  Edit,
  User,
  Scale,
  Ruler,
  Target,
  XCircle,
  Home,
  CheckCircle2,
  AlertCircle,
  Printer,
  TrendingUp
} from "lucide-react";

export const StudentDetailClean = ({ student, onBack }) => {
  const { currentUser, refreshData } = useAuth();
  const [activeTab, setActiveTab] = useState("questionnaire");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showProgressPdfModal, setShowProgressPdfModal] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: student?.planPrice || 25000,
    date: new Date().toISOString().split("T")[0],
    method: "Transferencia Bancaria",
    plan: student?.planName || "Plan Mensual",
    notes: ""
  });

  const [credentialsForm, setCredentialsForm] = useState({
    username: student?.username || "",
    password: student?.password || "",
    planName: student?.planName || "Plan Mensual",
    planPrice: student?.planPrice || 25000
  });

  const routines = getRoutines(currentUser?.id);
  const assignedRoutine = routines.find((r) => r.id === student?.assignedRoutineId);
  const qData = student?.questionnaireData;
  const isRevoked = student?.status === "revoked";
  const isQuestionnaireDone = student?.questionnaireCompleted;

  const handleCopyCredentials = () => {
    const text = `💪 ¡Hola ${student.name}! Aquí tienes tus datos para ingresar a FitTrainer Pro:\n\nUsuario: ${student.username}\nContraseña: ${student.password}`;
    navigator.clipboard.writeText(text);
    alert("📋 Credenciales copiadas.");
  };

  const handleWhatsAppSend = () => {
    const text = encodeURIComponent(
      `💪 ¡Hola ${student.name}! Te comparto tus datos de acceso a FitTrainer Pro:\n\n*Usuario:* ${student.username}\n*Contraseña:* ${student.password}`
    );
    const cleanPhone = (student.phone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  const handleAssignRoutine = (routineId) => {
    saveStudent({
      ...student,
      assignedRoutineId: routineId
    });
    refreshData();
    setShowAssignModal(false);
  };

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    recordStudentPayment(student.id, paymentForm);
    refreshData();
    setShowPayModal(false);
  };

  const handleToggleAccess = () => {
    toggleStudentAccess(student.id);
    refreshData();
  };

  const handleReopenQuestionnaire = () => {
    if (confirm(`¿Habilitar nuevamente el Cuestionario Inicial para ${student.name}?`)) {
      reopenStudentQuestionnaire(student.id);
      refreshData();
    }
  };

  const handleSaveCredentials = (e) => {
    e.preventDefault();
    saveStudent({
      ...student,
      username: credentialsForm.username,
      password: credentialsForm.password,
      planName: credentialsForm.planName,
      planPrice: Number(credentialsForm.planPrice)
    });
    refreshData();
    setShowCredentialsModal(false);
  };

  const handlePrintProgress = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Top Header Card */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: "12px" }}>
          <ArrowLeft size={16} /> Volver a Lista de Alumnos
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <StudentAvatar gender={student.gender} name={student.name} size={56} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ fontSize: "1.4rem", margin: 0 }}>{student.name}</h2>
                {student.gender === "female" ? <span>👩</span> : <span>👨</span>}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Ingreso: {student.joinDate}</span>
                
                {/* ESTADO VISUAL DEL CUESTIONARIO */}
                {isQuestionnaireDone ? (
                  <span className="badge badge-success">
                    <CheckCircle2 size={13} /> ✔️ Cuestionario Realizado
                  </span>
                ) : (
                  <span className="badge badge-danger">
                    <AlertCircle size={13} /> ❗ Cuestionario Pendiente
                  </span>
                )}

                {isRevoked ? (
                  <span className="badge badge-danger">🔴 Acceso Revocado</span>
                ) : (
                  <>
                    {student.paymentStatus === "paid" && <span className="badge badge-success">🟢 Al Día</span>}
                    {student.paymentStatus === "due_soon" && <span className="badge badge-warning">🟡 Por Vencer</span>}
                    {student.paymentStatus === "overdue" && <span className="badge badge-danger">🔴 Cuota Vencida</span>}
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button className="btn btn-lime btn-sm" onClick={() => setShowPayModal(true)}>
              <CreditCard size={15} /> Registrar Pago
            </button>

            <button className="btn btn-secondary btn-sm" onClick={() => setShowProgressPdfModal(true)}>
              <TrendingUp size={15} /> Progreso & PDF
            </button>

            <button className={`btn btn-sm ${isRevoked ? "btn-lime" : "btn-danger"}`} onClick={handleToggleAccess}>
              {isRevoked ? <UserCheck size={15} /> : <UserX size={15} />}
              {isRevoked ? "Habilitar Acceso" : "Quitar Acceso"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", gap: "8px", overflowX: "auto" }}>
        <button
          className={`btn ${activeTab === "questionnaire" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("questionnaire")}
        >
          <ClipboardList size={16} /> Cuestionario Diagnóstico
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
          <DollarSign size={16} /> Cuota & Pagos
        </button>
        <button
          className={`btn ${activeTab === "credentials" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("credentials")}
        >
          <Key size={16} /> Credenciales & Acceso
        </button>
      </div>

      {/* TAB 1: CUESTIONARIO DIAGNÓSTICO (ICON CARDS + REABRIR) */}
      {activeTab === "questionnaire" && (
        <div className="glass-panel animate-fade-in" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <h3 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <ClipboardList size={18} color="var(--accent-blue)" /> Ficha Diagnóstica del Alumno
            </h3>

            <button className="btn btn-secondary btn-sm" onClick={handleReopenQuestionnaire}>
              <RefreshCw size={14} /> Volver a Dar Acceso al Cuestionario
            </button>
          </div>

          {!isQuestionnaireDone ? (
            <div style={{ padding: "20px", background: "rgba(255,59,48,0.08)", borderRadius: "12px", border: "1px solid rgba(255,59,48,0.2)", color: "var(--accent-red)", fontSize: "0.9rem" }}>
              ❗ <strong>Cuestionario Pendiente</strong>: El alumno aún no ha completado su diagnóstico al ingresar. Puedes hacer clic arriba para volver a pedirle que lo responda.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              
              {/* Grid 1: Biometric Icon Badges */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                
                <div style={{ background: "#F2F2F7", padding: "12px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <User size={20} color="var(--accent-blue)" />
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>GÉNERO</span>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                      {qData?.gender === "female" ? "👩 Femenino" : "👨 Masculino"}
                    </div>
                  </div>
                </div>

                <div style={{ background: "#F2F2F7", padding: "12px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Calendar size={20} color="var(--accent-blue)" />
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>EDAD</span>
                    <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>{qData?.age || "-"} años</div>
                  </div>
                </div>

                <div style={{ background: "#F2F2F7", padding: "12px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Scale size={20} color="var(--accent-green)" />
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>PESO</span>
                    <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--accent-green)" }}>{qData?.weightKg || "-"} kg</div>
                  </div>
                </div>

                <div style={{ background: "#F2F2F7", padding: "12px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Ruler size={20} color="var(--accent-indigo)" />
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>ALTURA</span>
                    <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>{qData?.heightCm || "-"} cm</div>
                  </div>
                </div>

                <div style={{ background: "#F2F2F7", padding: "12px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Target size={20} color="var(--accent-orange)" />
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>OBJETIVO</span>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>{qData?.mainGoal || student.goal}</div>
                  </div>
                </div>

              </div>

              {/* Grid 2: Health & Exercise Preferences Icon Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                
                <div style={{ background: "#F2F2F7", padding: "14px", borderRadius: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-red)", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <Activity size={16} /> Lesiones o Molestias Físicas
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    {qData?.injuries || "Sin dolor ni molestias declaradas"}
                  </div>
                </div>

                <div style={{ background: "#F2F2F7", padding: "14px", borderRadius: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-green)", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <Heart size={16} /> Ejercicios Preferidos
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    {qData?.favoriteExercises || "Sin especificar"}
                  </div>
                </div>

              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                
                <div style={{ background: "#F2F2F7", padding: "14px", borderRadius: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-orange)", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <XCircle size={16} /> Ejercicios A Evitar / Odia
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    {qData?.dislikedExercises || "Ninguno"}
                  </div>
                </div>

                <div style={{ background: "#F2F2F7", padding: "14px", borderRadius: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-blue)", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <Moon size={16} /> Descanso & Estrés
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    {qData?.sleepHours} • Estrés {qData?.stressLevel || "Moderado"}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 2: RUTINA ASIGNADA */}
      {activeTab === "routine" && (
        <div className="glass-panel animate-fade-in" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Rutina Activa:</div>
              <h3 style={{ fontSize: "1.2rem", color: "var(--accent-blue)" }}>
                {assignedRoutine ? `${assignedRoutine.title} (${assignedRoutine.durationWeeks || 6} Semanas)` : "Sin rutina asignada"}
              </h3>
            </div>
            <button className="btn btn-lime btn-sm" onClick={() => setShowAssignModal(true)}>
              <RefreshCw size={15} /> Asignar / Cambiar Rutina
            </button>
          </div>

          {assignedRoutine ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {assignedRoutine.days.map((day, dIdx) => (
                <div key={dIdx} style={{ background: "#F2F2F7", padding: "14px", borderRadius: "12px" }}>
                  <h4 style={{ color: "var(--accent-blue)", marginBottom: "8px" }}>{day.dayName}</h4>
                  {day.exercises.map((ex, eIdx) => (
                    <div key={eIdx} style={{ background: "#FFFFFF", padding: "8px 12px", borderRadius: "8px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                      <span style={{ fontWeight: 600 }}>{ex.name}</span>
                      <span style={{ color: "var(--text-secondary)" }}>{ex.sets} series x {ex.reps} reps ({ex.restSec}s rest)</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Asigna una rutina existente o crea una nueva.</p>
          )}
        </div>
      )}

      {/* TAB 3: CUOTA & PAGOS */}
      {activeTab === "payments" && (
        <div className="glass-panel animate-fade-in" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem" }}>Cobros & Historial</h3>
            <button className="btn btn-lime btn-sm" onClick={() => setShowPayModal(true)}>
              <CreditCard size={15} /> Registrar Pago
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            <div style={{ background: "#F2F2F7", padding: "12px", borderRadius: "10px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>PLAN</div>
              <div style={{ fontWeight: 700 }}>{student.planName || "Plan Mensual"}</div>
            </div>
            <div style={{ background: "#F2F2F7", padding: "12px", borderRadius: "10px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>VALOR</div>
              <div style={{ fontWeight: 700, color: "var(--accent-green)" }}>${(student.planPrice || 25000).toLocaleString('es-AR')}</div>
            </div>
            <div style={{ background: "#F2F2F7", padding: "12px", borderRadius: "10px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>VENCIMIENTO</div>
              <div style={{ fontWeight: 700, color: "var(--accent-blue)" }}>{student.nextDueDate}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CREDENCIALES & ACCESO */}
      {activeTab === "credentials" && (
        <div className="glass-panel animate-fade-in" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "1.1rem" }}>Credenciales & Gestión de Acceso</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCredentialsModal(true)}>
              <Edit size={14} /> Editar Credenciales
            </button>
          </div>

          <div style={{ background: "#F2F2F7", padding: "14px", borderRadius: "10px", marginBottom: "16px" }}>
            <div>Usuario para Login: <strong style={{ color: "var(--accent-blue)" }}>{student.username}</strong></div>
            <div>Contraseña: <strong style={{ color: "var(--accent-green)" }}>{student.password}</strong></div>
            <div>Estado de Acceso: <strong>{isRevoked ? "🔴 Revocado (Bloqueado)" : "🟢 Activo (Habilitado)"}</strong></div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCopyCredentials}>
              <Copy size={16} /> Copiar Datos
            </button>
            <button className="btn btn-lime" style={{ flex: 1 }} onClick={handleWhatsAppSend}>
              <Send size={16} /> Enviar por WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Modal Asignar Rutina */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Asignar Rutina al Alumno">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {routines.map((r) => (
            <div key={r.id} style={{ padding: "12px", background: "#F2F2F7", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{r.title}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{r.days.length} Días • {r.durationWeeks || 6} Semanas</div>
              </div>
              <button className="btn btn-lime btn-sm" onClick={() => handleAssignRoutine(r.id)}>Asignar</button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal Registrar Pago */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Registrar Pago de Cuota">
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
            <button type="button" className="btn btn-ghost" onClick={() => setShowPayModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-lime">Confirmar Pago</button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Credenciales del Alumno */}
      <Modal isOpen={showCredentialsModal} onClose={() => setShowCredentialsModal(false)} title={`Editar Credenciales - ${student.name}`}>
        <form onSubmit={handleSaveCredentials}>
          <div className="form-group">
            <label className="form-label">Usuario para Login</label>
            <input
              type="text"
              className="form-input"
              value={credentialsForm.username}
              onChange={(e) => setCredentialsForm({ ...credentialsForm, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Nueva Contraseña</label>
            <input
              type="text"
              className="form-input"
              value={credentialsForm.password}
              onChange={(e) => setCredentialsForm({ ...credentialsForm, password: e.target.value })}
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowCredentialsModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </Modal>

      {/* Modal Reporte de Progreso y PDF */}
      <Modal isOpen={showProgressPdfModal} onClose={() => setShowProgressPdfModal(false)} title={`Evolución de Pesos - ${student.name}`}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Registro histórico de entrenamientos completados por semana.
            </div>
            <button className="btn btn-primary btn-sm" onClick={handlePrintProgress}>
              <Printer size={15} /> Exportar Reporte PDF
            </button>
          </div>

          <div style={{ background: "#F2F2F7", padding: "16px", borderRadius: "12px" }}>
            {(!student.completedWorkouts || student.completedWorkouts.length === 0) ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                El alumno aún no ha registrado entrenamientos completados en su aplicación.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {student.completedWorkouts.map((w, idx) => (
                  <div key={idx} style={{ background: "#FFFFFF", padding: "12px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.9rem", color: "var(--accent-blue)" }}>
                      <span>{w.dayName}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{w.date}</span>
                    </div>

                    <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {w.logs?.map((l, lIdx) => (
                        <div key={lIdx} style={{ fontSize: "0.825rem", display: "flex", justifyContent: "space-between" }}>
                          <span>• {l.exercise}</span>
                          <span style={{ fontWeight: 700, color: "var(--accent-green)" }}>{l.bestWeight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

    </div>
  );
};
