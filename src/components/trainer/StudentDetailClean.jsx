import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  recordStudentPayment,
  saveStudent,
  toggleStudentAccess,
  reopenStudentQuestionnaire,
  deleteStudentPayment,
  isStudentUsernameTaken
} from "../../services/storageService";
import { generateTempPassword } from "../../services/cryptoService";
import { resetOtherUserPassword, isCloudMode } from "../../services/authService";
import { getPaymentLabel, formatMoney, toISODate } from "../../services/billingService";
import { getAdherence, getExerciseProgress, getWorkouts, getBodyWeightSeries, ADHERENCE_LABEL } from "../../services/progressService";
import { StudentAvatar } from "../common/StudentAvatar";
import { Modal } from "../common/Modal";
import { MiniLineChart } from "../common/MiniLineChart";
import { RoutinePrintView } from "./RoutinePrintView";
import { RoutineFileViewer } from "../common/RoutineFileViewer";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Copy,
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
  CheckCircle2,
  AlertCircle,
  Printer,
  TrendingUp,
  Trash2,
  Flame,
  Loader2,
  ShieldAlert
} from "lucide-react";

const TABS = [
  { key: "progress", label: "Progreso", Icon: TrendingUp },
  { key: "questionnaire", label: "Cuestionario", Icon: ClipboardList },
  { key: "routine", label: "Rutina", Icon: Dumbbell },
  { key: "payments", label: "Cuotas", Icon: DollarSign },
  { key: "credentials", label: "Acceso", Icon: Key }
];

export const StudentDetailClean = ({ student, onBack }) => {
  const { currentUser, routines, refreshData } = useAuth();
  const [activeTab, setActiveTab] = useState("progress");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editError, setEditError] = useState("");
  const [actionError, setActionError] = useState("");

  const trainerRoutines = useMemo(() => routines.filter((r) => r.trainerId === currentUser?.id), [routines, currentUser?.id]);
  const assignedRoutine = trainerRoutines.find((r) => r.id === student?.assignedRoutineId);

  const adherence = useMemo(() => getAdherence(student), [student]);
  const adherenceInfo = ADHERENCE_LABEL[adherence.state];
  const exercises = useMemo(() => getExerciseProgress(student), [student]);
  const workouts = useMemo(() => getWorkouts(student), [student]);
  const weightSeries = useMemo(() => getBodyWeightSeries(student), [student]);
  const payment = getPaymentLabel(student);

  const qData = student?.questionnaireData;
  const isRevoked = student?.status === "revoked";
  const payments = student?.payments || [];

  const [paymentForm, setPaymentForm] = useState({
    amount: student?.planPrice || 0,
    date: toISODate(new Date()),
    method: "Transferencia Bancaria",
    notes: ""
  });

  const [editForm, setEditForm] = useState({
    name: student?.name || "",
    phone: student?.phone || "",
    email: student?.email || "",
    username: student?.username || "",
    planName: student?.planName || "Plan Mensual",
    planPrice: student?.planPrice || 0,
    nextDueDate: student?.nextDueDate || "",
    goal: student?.goal || ""
  });

  // Igual que en el panel de admin: sin catch, los errores quedaban invisibles.
  const run = async (fn) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      await refreshData();
    } catch (err) {
      console.error(err);
      setActionError(err?.message || "Ocurrió un error. Revisá la consola para más detalle.");
    } finally {
      setBusy(false);
    }
  };

  const handleAssignRoutine = (routineId) =>
    run(async () => {
      await saveStudent({ ...student, assignedRoutineId: routineId });
      setShowAssignModal(false);
    });

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    return run(async () => {
      await recordStudentPayment(student.id, paymentForm);
      setShowPayModal(false);
    });
  };

  const handleToggleAccess = () => run(() => toggleStudentAccess(student.id));

  const handleReopenQuestionnaire = () => {
    if (!confirm(`¿Habilitar de nuevo el cuestionario para ${student.name}?`)) return;
    return run(() => reopenStudentQuestionnaire(student.id));
  };

  const handleDeletePayment = (paymentId) => {
    if (!confirm("¿Eliminar este pago del historial?")) return;
    return run(() => deleteStudentPayment(student.id, paymentId));
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (isStudentUsernameTaken(editForm.username, student.id)) {
      setEditError(`El usuario "${editForm.username}" ya está en uso por otro alumno.`);
      return;
    }
    setEditError("");
    return run(async () => {
      await saveStudent({ ...student, ...editForm, planPrice: Number(editForm.planPrice) || 0 });
      setShowEditModal(false);
    });
  };

  /**
   * Las contraseñas ahora se guardan hasheadas, así que no se pueden "ver".
   * En su lugar se genera una nueva y se muestra una única vez para entregarla.
   */
  const handleGeneratePassword = () => {
    const temp = generateTempPassword(student.name);
    return run(async () => {
      try {
        // En modo nube la contraseña la administra Supabase Auth, no la tabla.
        await resetOtherUserPassword({ userId: student.id, newPassword: temp });
        if (!isCloudMode()) await saveStudent({ ...student, password: temp });
        setPasswordError("");
        setNewPassword(temp);
      } catch (err) {
        setPasswordError(err.message);
        setNewPassword("");
      }
    });
  };

  const credentialsText = (password) =>
    `Hola ${student.name}, estos son tus datos para entrar a FitTrainer PRO:\n\n` +
    `Usuario: ${student.username}\n` +
    `Contraseña: ${password}`;

  const handleCopyCredentials = async () => {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(credentialsText(newPassword));
      alert("📋 Credenciales copiadas.");
    } catch {
      alert("No se pudo copiar automáticamente. Copialas a mano desde la pantalla.");
    }
  };

  const handleWhatsAppSend = () => {
    const phone = (student.phone || "").replace(/[^0-9]/g, "");
    if (!phone) {
      alert("Este alumno no tiene teléfono cargado. Agregalo con el botón 'Editar datos'.");
      return;
    }
    if (!newPassword) {
      alert("Generá primero una contraseña nueva para poder enviarla.");
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(credentialsText(newPassword))}`, "_blank", "noopener");
  };

  return (
    <div className="animate-fade-in stack">
      {actionError && (
        <div
          role="alert"
          style={{
            padding: "12px 14px",
            background: "rgba(255,59,48,0.1)",
            border: "1px solid var(--accent-red)",
            borderRadius: "12px",
            color: "var(--accent-red)",
            fontSize: "0.85rem",
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            alignItems: "center"
          }}
        >
          <span>{actionError}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setActionError("")} style={{ flexShrink: 0 }}>
            Cerrar
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="glass-panel" style={{ padding: "18px" }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: "12px", paddingLeft: 0 }}>
          <ArrowLeft size={16} /> Volver a mis alumnos
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "13px", minWidth: 0 }}>
          <StudentAvatar gender={student.gender} name={student.name} size={54} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{student.name}</h2>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              {student.planName || "Plan Mensual"} · {formatMoney(student.planPrice)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
          <span className={`badge ${payment.badge}`}>{payment.dot} {payment.text}</span>
          <span className={`badge ${adherenceInfo.badge}`}><Flame size={11} /> {adherence.thisWeek} esta semana</span>
          {student.questionnaireCompleted ? (
            <span className="badge badge-success"><CheckCircle2 size={12} /> Cuestionario ok</span>
          ) : (
            <span className="badge badge-danger"><AlertCircle size={12} /> Cuestionario pendiente</span>
          )}
          {isRevoked && <span className="badge badge-danger">Acceso revocado</span>}
        </div>

        <div className="action-row" style={{ marginTop: "14px" }}>
          <button className="btn btn-lime btn-sm" onClick={() => setShowPayModal(true)}>
            <CreditCard size={15} /> Registrar pago
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(true)}>
            <Edit size={15} /> Editar datos
          </button>
          <button className={`btn btn-sm ${isRevoked ? "btn-lime" : "btn-danger"}`} onClick={handleToggleAccess} disabled={busy}>
            {isRevoked ? <UserCheck size={15} /> : <UserX size={15} />}
            {isRevoked ? "Habilitar" : "Suspender"}
          </button>
        </div>
      </div>

      {/* Pestañas con scroll horizontal en celular */}
      <div className="scroll-x-wrap">
        <div className="scroll-x" role="tablist">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              className={`btn btn-sm ${activeTab === key ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: "20px" }}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* PROGRESO */}
      {activeTab === "progress" && (
        <div className="animate-fade-in stack">
          <div className="glass-panel" style={{ padding: "18px" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "12px" }}>Adherencia</h3>
            <div className="stat-grid">
              <div className="subtle-box">
                <span style={{ fontSize: "0.66rem", color: "var(--text-secondary)", fontWeight: 700 }}>ESTA SEMANA</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-green)" }}>{adherence.thisWeek}</div>
              </div>
              <div className="subtle-box">
                <span style={{ fontSize: "0.66rem", color: "var(--text-secondary)", fontWeight: 700 }}>SEMANA PASADA</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{adherence.lastWeek}</div>
              </div>
              <div className="subtle-box">
                <span style={{ fontSize: "0.66rem", color: "var(--text-secondary)", fontWeight: 700 }}>TOTAL</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-blue)" }}>{adherence.total}</div>
              </div>
              <div className="subtle-box">
                <span style={{ fontSize: "0.66rem", color: "var(--text-secondary)", fontWeight: 700 }}>ÚLTIMO</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                  {adherence.daysSince === null ? "—" : adherence.daysSince === 0 ? "Hoy" : `${adherence.daysSince}d`}
                </div>
              </div>
            </div>
          </div>

          {weightSeries.length > 0 && (
            <div className="glass-panel" style={{ padding: "18px" }}>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Scale size={17} color="var(--accent-indigo)" /> Peso corporal
              </h3>
              <MiniLineChart points={weightSeries} color="var(--accent-indigo)" unit="kg" />
            </div>
          )}

          <div className="glass-panel" style={{ padding: "18px" }}>
            <div className="row-between" style={{ marginBottom: "12px" }}>
              <h3 style={{ fontSize: "1.05rem" }}>Evolución de cargas</h3>
              {assignedRoutine && assignedRoutine.kind !== "file" && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPrintModal(true)}>
                  <Printer size={14} /> Rutina en PDF
                </button>
              )}
            </div>

            {exercises.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                El alumno todavía no registró cargas en la app.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {exercises.slice(0, 8).map((ex) => (
                  <div key={ex.exercise} className="subtle-box" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.86rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ex.exercise}
                      </div>
                      <div style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>
                        Récord {ex.best} kg · {ex.points.length} registros
                      </div>
                    </div>
                    {ex.delta !== 0 && (
                      <span className={`badge ${ex.delta > 0 ? "badge-success" : "badge-warning"}`} style={{ flexShrink: 0 }}>
                        {ex.delta > 0 ? "+" : ""}{Number(ex.delta.toFixed(1))} kg
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: "18px" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "12px" }}>Últimos entrenamientos</h3>
            {workouts.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Sin entrenamientos registrados.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {workouts.slice(0, 6).map((w) => (
                  <div key={w.id} className="subtle-box">
                    <div className="row-between" style={{ gap: "8px" }}>
                      <strong style={{ fontSize: "0.85rem", color: "var(--accent-blue)" }}>{w.dayName}</strong>
                      <span style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>{w.date}</span>
                    </div>
                    {w.studentNotes && (
                      <div style={{ fontSize: "0.78rem", color: "var(--accent-orange)", fontStyle: "italic", marginTop: "4px" }}>
                        💬 “{w.studentNotes}”
                      </div>
                    )}
                    <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "3px" }}>
                      {(w.logs || []).map((l, i) => (
                        <div key={i} style={{ fontSize: "0.77rem", display: "flex", justifyContent: "space-between", gap: "10px" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>• {l.exercise}</span>
                          <span style={{ fontWeight: 700, color: "var(--accent-green)", flexShrink: 0 }}>
                            {l.setsDone}/{l.setsPlanned ?? l.setsDone} {l.bestWeight ? `· ${l.bestWeight}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CUESTIONARIO */}
      {activeTab === "questionnaire" && (
        <div className="glass-panel animate-fade-in" style={{ padding: "18px" }}>
          <div className="row-between" style={{ marginBottom: "14px" }}>
            <h3 style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <ClipboardList size={17} color="var(--accent-blue)" /> Ficha diagnóstica
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={handleReopenQuestionnaire} disabled={busy}>
              <RefreshCw size={14} /> Reabrir cuestionario
            </button>
          </div>

          {!student.questionnaireCompleted ? (
            <div
              className="subtle-box"
              style={{ background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)", color: "var(--accent-red)", fontSize: "0.87rem" }}
            >
              ❗ <strong>Pendiente</strong>: el alumno todavía no completó su diagnóstico.
            </div>
          ) : (
            <div className="stack" style={{ gap: "12px" }}>
              <div className="stat-grid">
                {[
                  { Icon: User, label: "GÉNERO", value: qData?.gender === "female" ? "👩 Femenino" : "👨 Masculino", color: "var(--accent-blue)" },
                  { Icon: Calendar, label: "EDAD", value: `${qData?.age || "-"} años`, color: "var(--accent-blue)" },
                  { Icon: Scale, label: "PESO", value: `${qData?.weightKg || "-"} kg`, color: "var(--accent-green)" },
                  { Icon: Ruler, label: "ALTURA", value: `${qData?.heightCm || "-"} cm`, color: "var(--accent-indigo)" },
                  { Icon: Target, label: "OBJETIVO", value: qData?.mainGoal || student.goal, color: "var(--accent-orange)" }
                ].map(({ Icon, label, value, color }) => (
                  <div key={label} className="subtle-box" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Icon size={19} color={color} />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "0.64rem", color: "var(--text-secondary)", fontWeight: 700 }}>{label}</span>
                      <div style={{ fontWeight: 700, fontSize: "0.87rem" }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Antes eran grids "1fr 1fr" fijos que se aplastaban en el celular */}
              <div className="grid-2">
                {[
                  { Icon: Activity, label: "LESIONES O MOLESTIAS", value: qData?.injuries || "Sin molestias declaradas", color: "var(--accent-red)" },
                  { Icon: Heart, label: "EJERCICIOS PREFERIDOS", value: qData?.favoriteExercises || "Sin especificar", color: "var(--accent-green)" },
                  { Icon: XCircle, label: "EJERCICIOS A EVITAR", value: qData?.dislikedExercises || "Ninguno", color: "var(--accent-orange)" },
                  { Icon: Moon, label: "DESCANSO Y ESTRÉS", value: `${qData?.sleepHours || "—"} · estrés ${qData?.stressLevel || "—"}`, color: "var(--accent-blue)" },
                  { Icon: Dumbbell, label: "EQUIPAMIENTO", value: qData?.equipment || "—", color: "var(--accent-indigo)" },
                  { Icon: Calendar, label: "DISPONIBILIDAD", value: qData?.availableDays || "—", color: "var(--accent-blue)" }
                ].map(({ Icon, label, value, color }) => (
                  <div key={label} className="subtle-box">
                    <div style={{ fontSize: "0.7rem", color, fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <Icon size={14} /> {label}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.86rem" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RUTINA */}
      {activeTab === "routine" && (
        <div className="glass-panel animate-fade-in" style={{ padding: "18px" }}>
          <div className="row-between" style={{ marginBottom: "14px" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>Rutina activa</div>
              <h3 style={{ fontSize: "1.1rem", color: "var(--accent-blue)" }}>
                {assignedRoutine ? `${assignedRoutine.title} (${assignedRoutine.durationWeeks || 6} semanas)` : "Sin rutina asignada"}
              </h3>
            </div>
            <div className="action-row">
              {assignedRoutine && assignedRoutine.kind !== "file" && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPrintModal(true)}>
                  <Printer size={14} /> PDF
                </button>
              )}
              <button className="btn btn-lime btn-sm" onClick={() => setShowAssignModal(true)}>
                <RefreshCw size={14} /> {assignedRoutine ? "Cambiar" : "Asignar"}
              </button>
            </div>
          </div>

          {assignedRoutine?.kind === "file" ? (
            <RoutineFileViewer routine={assignedRoutine} />
          ) : assignedRoutine ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(assignedRoutine.days || []).map((day, dIdx) => (
                <div key={dIdx} className="subtle-box">
                  <h4 style={{ color: "var(--accent-blue)", marginBottom: "8px", fontSize: "0.95rem" }}>{day.dayName}</h4>
                  {day.exercises.map((ex, eIdx) => (
                    <div
                      key={eIdx}
                      style={{
                        background: "var(--bg-card)",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        marginBottom: "5px",
                        fontSize: "0.82rem",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "8px",
                        flexWrap: "wrap"
                      }}
                    >
                      <span style={{ fontWeight: 600, minWidth: 0 }}>{ex.name}</span>
                      <span style={{ color: "var(--text-secondary)", flexShrink: 0 }}>
                        {ex.sets}×{ex.reps} · {ex.restSec}s
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              Asigná una rutina de tu biblioteca para que el alumno la vea en su app.
            </p>
          )}
        </div>
      )}

      {/* CUOTAS */}
      {activeTab === "payments" && (
        <div className="glass-panel animate-fade-in" style={{ padding: "18px" }}>
          <div className="row-between" style={{ marginBottom: "14px" }}>
            <h3 style={{ fontSize: "1.05rem" }}>Cuotas e historial</h3>
            <button className="btn btn-lime btn-sm" onClick={() => setShowPayModal(true)}>
              <CreditCard size={14} /> Registrar pago
            </button>
          </div>

          {/* Antes era un grid "1fr 1fr 1fr" fijo, ilegible en celular */}
          <div className="stat-grid" style={{ marginBottom: "16px" }}>
            <div className="subtle-box">
              <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>PLAN</div>
              <div style={{ fontWeight: 700 }}>{student.planName || "Plan Mensual"}</div>
            </div>
            <div className="subtle-box">
              <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>VALOR</div>
              <div style={{ fontWeight: 700, color: "var(--accent-green)" }}>{formatMoney(student.planPrice)}</div>
            </div>
            <div className="subtle-box">
              <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>VENCIMIENTO</div>
              <div style={{ fontWeight: 700, color: "var(--accent-blue)" }}>{student.nextDueDate || "—"}</div>
            </div>
          </div>

          {/* El historial se guardaba pero no se mostraba en ningún lado */}
          <h4 style={{ fontSize: "0.9rem", marginBottom: "8px" }}>Historial de pagos ({payments.length})</h4>
          {payments.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Todavía no registraste pagos de este alumno.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {payments.map((p) => (
                <div key={p.id} className="subtle-box" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "10px 12px" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "var(--accent-green)", fontSize: "0.9rem" }}>{formatMoney(p.amount)}</div>
                    <div style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>
                      {p.date} · {p.method}
                      {p.notes ? ` · ${p.notes}` : ""}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDeletePayment(p.id)}
                    aria-label="Eliminar pago"
                    style={{ color: "var(--accent-red)", flexShrink: 0 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACCESO */}
      {activeTab === "credentials" && (
        <div className="glass-panel animate-fade-in" style={{ padding: "18px" }}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: "12px" }}>Acceso del alumno</h3>

          <div className="subtle-box" style={{ marginBottom: "14px" }}>
            <div>Usuario: <strong style={{ color: "var(--accent-blue)" }}>{student.username}</strong></div>
            <div>Estado: <strong>{isRevoked ? "🔴 Revocado" : "🟢 Activo"}</strong></div>
            <div>Teléfono: <strong>{student.phone || "sin cargar"}</strong></div>
          </div>

          {/* Las contraseñas están hasheadas: ya no se pueden mostrar, se generan de nuevo */}
          <div
            className="subtle-box"
            style={{ background: "rgba(0,122,255,0.06)", border: "1px solid rgba(0,122,255,0.2)", marginBottom: "14px", fontSize: "0.83rem" }}
          >
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <ShieldAlert size={17} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>
                Por seguridad, las contraseñas se guardan cifradas y no se pueden ver. Si el alumno la perdió, generá una
                nueva y enviásela.
              </span>
            </div>
          </div>

          {passwordError && (
            <div
              role="alert"
              style={{
                padding: "10px 12px",
                background: "rgba(255,59,48,0.1)",
                border: "1px solid var(--accent-red)",
                borderRadius: "10px",
                color: "var(--accent-red)",
                fontSize: "0.82rem",
                marginBottom: "14px"
              }}
            >
              {passwordError}
            </div>
          )}

          {newPassword && (
            <div
              className="subtle-box animate-fade-in"
              style={{ background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.3)", marginBottom: "14px" }}
            >
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 700 }}>NUEVA CONTRASEÑA (anotala ahora)</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--accent-green)", letterSpacing: "0.02em", wordBreak: "break-all" }}>
                {newPassword}
              </div>
            </div>
          )}

          <div className="action-row">
            <button className="btn btn-primary btn-sm" onClick={handleGeneratePassword} disabled={busy}>
              {busy ? <Loader2 size={14} className="spin" /> : <Key size={14} />} Generar contraseña nueva
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleCopyCredentials} disabled={!newPassword}>
              <Copy size={14} /> Copiar
            </button>
            <button className="btn btn-lime btn-sm" onClick={handleWhatsAppSend} disabled={!newPassword}>
              <Send size={14} /> WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Modales */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Asignar rutina">
        {trainerRoutines.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.87rem" }}>
            No tenés rutinas creadas. Andá a la sección "Rutinas" para armar la primera.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {trainerRoutines.map((r) => (
              <div key={r.id} className="subtle-box" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{r.title}</div>
                  <div style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>
                    {r.kind === "file"
                      ? `Archivo · ${r.durationWeeks || 6} semanas`
                      : `${r.days?.length || 0} días · ${r.durationWeeks || 6} semanas`}
                  </div>
                </div>
                <button
                  className={`btn btn-sm ${r.id === student.assignedRoutineId ? "btn-secondary" : "btn-lime"}`}
                  onClick={() => handleAssignRoutine(r.id)}
                  disabled={busy || r.id === student.assignedRoutineId}
                  style={{ flexShrink: 0 }}
                >
                  {r.id === student.assignedRoutineId ? "Asignada" : "Asignar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Registrar pago de cuota">
        <form onSubmit={handleSubmitPayment}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="sd-amount">Monto ($)</label>
              <input
                id="sd-amount"
                type="text"
                inputMode="numeric"
                className="form-input"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value.replace(/[^0-9]/g, "") })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sd-date">Fecha</label>
              <input
                id="sd-date"
                type="date"
                className="form-input"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sd-method">Medio de pago</label>
            <select
              id="sd-method"
              className="form-select"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
            >
              <option value="Transferencia Bancaria">Transferencia bancaria</option>
              <option value="Efectivo">Efectivo</option>
              <option value="MercadoPago / Tarjeta">MercadoPago / Tarjeta</option>
            </select>
          </div>

          <div className="action-row" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowPayModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-lime" disabled={busy}>Confirmar pago</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Editar · ${student.name}`}>
        <form onSubmit={handleSaveEdit}>
          {editError && (
            <div
              role="alert"
              style={{
                padding: "10px 12px",
                background: "rgba(255,59,48,0.1)",
                border: "1px solid var(--accent-red)",
                borderRadius: "10px",
                color: "var(--accent-red)",
                fontSize: "0.82rem",
                marginBottom: "14px"
              }}
            >
              {editError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="ed-name">Nombre</label>
            <input id="ed-name" type="text" className="form-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="ed-phone">Teléfono (WhatsApp)</label>
              <input id="ed-phone" type="tel" inputMode="tel" className="form-input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ed-email">Email</label>
              <input id="ed-email" type="email" className="form-input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ed-user">Usuario de acceso</label>
            <input id="ed-user" type="text" autoCapitalize="none" className="form-input" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} required />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="ed-plan">Plan</label>
              <input id="ed-plan" type="text" className="form-input" value={editForm.planName} onChange={(e) => setEditForm({ ...editForm, planName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ed-price">Valor cuota ($)</label>
              <input
                id="ed-price"
                type="text"
                inputMode="numeric"
                className="form-input"
                value={editForm.planPrice}
                onChange={(e) => setEditForm({ ...editForm, planPrice: e.target.value.replace(/[^0-9]/g, "") })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="ed-due">Próximo vencimiento</label>
              <input id="ed-due" type="date" className="form-input" value={editForm.nextDueDate} onChange={(e) => setEditForm({ ...editForm, nextDueDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ed-goal">Objetivo</label>
              <input id="ed-goal" type="text" className="form-input" value={editForm.goal} onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })} />
            </div>
          </div>

          <div className="action-row" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Guardar cambios</button>
          </div>
        </form>
      </Modal>

      {/* PDF real de la rutina, con el nombre del alumno (antes usaba window.print()) */}
      <RoutinePrintView
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        routine={assignedRoutine}
        student={student}
      />
    </div>
  );
};
