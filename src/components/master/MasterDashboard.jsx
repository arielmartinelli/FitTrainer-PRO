import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  saveTrainer,
  deleteTrainer,
  saveStudent,
  deleteStudent,
  toggleTrainerAccess,
  toggleStudentAccess,
  isTrainerIdentifierTaken,
  isStudentUsernameTaken,
  updateMasterAdminPassword
} from "../../services/storageService";
import {
  provisionTrainer,
  provisionStudent,
  resetOtherUserPassword,
  changeOwnPassword,
  isCloudMode
} from "../../services/authService";
import { generateTempPassword } from "../../services/cryptoService";
import { StudentAvatar } from "../common/StudentAvatar";
import { Modal } from "../common/Modal";
import { Users, UserCheck, UserX, Plus, Search, Key, Edit, Trash2, ShieldAlert, Loader2, Copy, Send, CheckCircle2 } from "lucide-react";

const emptyTrainer = () => ({
  id: "",
  name: "",
  gender: "male",
  email: "",
  username: "",
  password: "",
  brandName: "",
  phone: "",
  alias: "",
  cbu: ""
});

const emptyStudent = (trainerId = "") => ({
  id: "",
  name: "",
  gender: "male",
  phone: "",
  email: "",
  trainerId,
  goal: "Hipertrofia Muscular",
  planName: "Plan Mensual",
  planPrice: 28000,
  username: "",
  password: ""
});

const GenderPicker = ({ value, onChange }) => (
  <div className="segmented-2">
    <button type="button" className="seg-option" data-tone="male" data-active={value === "male"} onClick={() => onChange("male")}>
      👨 Masculino
    </button>
    <button type="button" className="seg-option" data-tone="female" data-active={value === "female"} onClick={() => onChange("female")}>
      👩 Femenino
    </button>
  </div>
);

const ErrorBox = ({ children }) =>
  children ? (
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
      {children}
    </div>
  ) : null;

export const MasterDashboard = () => {
  const { trainers, students, refreshData } = useAuth();
  const [activeTab, setActiveTab] = useState("trainers");
  const [searchQuery, setSearchQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const [trainerModal, setTrainerModal] = useState(null); // null | { editing }
  const [studentModal, setStudentModal] = useState(null);
  const [adminModal, setAdminModal] = useState(false);

  const [trainerForm, setTrainerForm] = useState(emptyTrainer);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [adminForm, setAdminForm] = useState({ password: "", confirm: "" });

  const [formError, setFormError] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState(null); // { name, user, password }

  // Sin este catch, cualquier error de Supabase se perdía como promesa rechazada
  // y la pantalla no mostraba nada: parecía que el botón no hacía nada.
  const run = async (fn) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      await refreshData();
    } catch (err) {
      console.error(err);
      setFormError(err?.message || "Ocurrió un error. Revisá la consola para más detalle.");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Profesores ---------- */

  const openNewTrainer = () => {
    setTrainerForm(emptyTrainer());
    setFormError("");
    setTrainerModal({ editing: null });
  };

  const openEditTrainer = (trainer) => {
    setTrainerForm({
      ...emptyTrainer(),
      ...trainer,
      username: trainer.username || trainer.email?.split("@")[0] || "",
      password: "" // vacío = no se cambia
    });
    setFormError("");
    setTrainerModal({ editing: trainer });
  };

  const handleSaveTrainer = (e) => {
    e.preventDefault();
    const editing = trainerModal?.editing;

    if (!trainerForm.name.trim()) return setFormError("Ingresá el nombre del profesor.");
    if (!trainerForm.email.trim()) return setFormError("Ingresá el email de acceso.");
    if (!editing && !trainerForm.password) return setFormError("Definí una contraseña inicial.");
    if (isTrainerIdentifierTaken(trainerForm.email, editing?.id)) return setFormError("Ese email ya está registrado.");
    if (trainerForm.username && isTrainerIdentifierTaken(trainerForm.username, editing?.id)) {
      return setFormError("Ese usuario ya está registrado.");
    }

    setFormError("");
    return run(async () => {
      const payload = {
        ...trainerForm,
        username: trainerForm.username || trainerForm.email.split("@")[0]
      };
      if (editing) {
        // Al editar no se toca la cuenta de Auth, solo la ficha.
        await saveTrainer({ ...payload, password: trainerForm.password || editing.password });
      } else {
        // Alta: crea la cuenta de Auth y usa su uid como id de la fila.
        await provisionTrainer(payload);
        // La contraseña no se puede volver a consultar: se muestra para entregarla.
        setGeneratedPassword({
          tipo: "trainer",
          name: payload.name,
          user: payload.email,
          password: trainerForm.password,
          phone: payload.phone
        });
      }
      setTrainerModal(null);
    });
  };

  const handleDeleteTrainer = (trainer) => {
    const count = students.filter((s) => s.trainerId === trainer.id).length;
    const warning = count > 0 ? `\n\nTiene ${count} alumno(s) asignado(s), que van a quedar sin profesor.` : "";
    if (!confirm(`¿Eliminar al profesor "${trainer.name}"?${warning}`)) return;
    return run(() => deleteTrainer(trainer.id));
  };

  const handleResetTrainerPassword = (trainer) => {
    if (!confirm(`¿Generar una contraseña nueva para ${trainer.name}?`)) return;
    const password = generateTempPassword(trainer.name);
    return run(async () => {
      try {
        // En modo nube la contraseña vive en Supabase Auth, no en la tabla.
        await resetOtherUserPassword({ userId: trainer.id, newPassword: password });
        if (!isCloudMode()) await saveTrainer({ ...trainer, password });
        setGeneratedPassword({ tipo: "trainer", name: trainer.name, user: trainer.email, password, phone: trainer.phone });
      } catch (err) {
        setFormError(err.message);
        alert(err.message);
      }
    });
  };

  /* ---------- Alumnos ---------- */

  const openNewStudent = () => {
    setStudentForm(emptyStudent(trainers[0]?.id || ""));
    setFormError("");
    setStudentModal({ editing: null });
  };

  const openEditStudent = (student) => {
    setStudentForm({ ...emptyStudent(), ...student, password: "" });
    setFormError("");
    setStudentModal({ editing: student });
  };

  const handleSaveStudent = (e) => {
    e.preventDefault();
    const editing = studentModal?.editing;

    if (!studentForm.name.trim()) return setFormError("Ingresá el nombre del alumno.");
    if (!studentForm.username.trim()) return setFormError("Ingresá el usuario de acceso.");
    if (isStudentUsernameTaken(studentForm.username, editing?.id)) return setFormError("Ese usuario ya está en uso.");
    if (!studentForm.trainerId) return setFormError("Asigná el alumno a un profesor.");
    if (!editing && !studentForm.password) return setFormError("Definí una contraseña inicial.");

    setFormError("");
    return run(async () => {
      const payload = { ...studentForm, planPrice: Number(studentForm.planPrice) || 0 };
      if (editing) {
        await saveStudent({ ...payload, password: studentForm.password || editing.password });
      } else {
        await provisionStudent(payload);
        setGeneratedPassword({
          tipo: "student",
          name: payload.name,
          user: payload.username,
          password: studentForm.password,
          phone: payload.phone
        });
      }
      setStudentModal(null);
    });
  };

  const handleDeleteStudent = (student) => {
    if (!confirm(`¿Eliminar al alumno "${student.name}"? Se pierden sus entrenamientos y pagos.`)) return;
    return run(() => deleteStudent(student.id));
  };

  const handleResetStudentPassword = (student) => {
    if (!confirm(`¿Generar una contraseña nueva para ${student.name}?`)) return;
    const password = generateTempPassword(student.name);
    return run(async () => {
      try {
        await resetOtherUserPassword({ userId: student.id, newPassword: password });
        if (!isCloudMode()) await saveStudent({ ...student, password });
        setGeneratedPassword({ tipo: "student", name: student.name, user: student.username, password, phone: student.phone });
      } catch (err) {
        setFormError(err.message);
        alert(err.message);
      }
    });
  };

  /* ---------- Admin ---------- */

  const handleChangeAdminPassword = (e) => {
    e.preventDefault();
    if (adminForm.password.length < 6) return setFormError("La contraseña debe tener al menos 6 caracteres.");
    if (adminForm.password !== adminForm.confirm) return setFormError("Las contraseñas no coinciden.");
    setFormError("");
    return run(async () => {
      try {
        if (isCloudMode()) await changeOwnPassword(adminForm.password);
        else await updateMasterAdminPassword(adminForm.password);
        setAdminForm({ password: "", confirm: "" });
        setAdminModal(false);
        alert("✅ Contraseña de administrador actualizada.");
      } catch (err) {
        setFormError(err.message);
      }
    });
  };

  /* ---------- Entrega de accesos ---------- */

  const textoAccesos = (acceso) =>
    `Hola ${acceso.name}, estos son tus datos para entrar a FitTrainer PRO:\n\n` +
    `${acceso.tipo === "trainer" ? "Email" : "Usuario"}: ${acceso.user}\n` +
    `Contraseña: ${acceso.password}`;

  const copiarAccesos = async () => {
    try {
      await navigator.clipboard.writeText(textoAccesos(generatedPassword));
      alert("Accesos copiados.");
    } catch {
      alert("No se pudo copiar automáticamente. Copialos a mano desde la pantalla.");
    }
  };

  const enviarAccesos = () => {
    const phone = (generatedPassword.phone || "").replace(/[^0-9]/g, "");
    if (!phone) {
      alert("No hay teléfono cargado para esta persona. Agregalo con el botón Editar y volvé a intentar.");
      return;
    }
    const texto = encodeURIComponent(textoAccesos(generatedPassword));
    window.open(`https://wa.me/${phone}?text=${texto}`, "_blank", "noopener");
  };

  /* ---------- Filtros ---------- */

  const filteredTrainers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return trainers.filter((t) => !q || t.name.toLowerCase().includes(q) || (t.email || "").toLowerCase().includes(q));
  }, [trainers, searchQuery]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => !q || s.name.toLowerCase().includes(q) || (s.username || "").toLowerCase().includes(q));
  }, [students, searchQuery]);

  return (
    <div className="animate-fade-in stack" style={{ gap: "18px" }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: "20px", background: "linear-gradient(135deg, #1C1C1E 0%, #007AFF 100%)", color: "#FFF" }}>
        <div className="row-between">
          <div style={{ minWidth: 0 }}>
            <span className="badge" style={{ background: "rgba(255,255,255,0.2)", color: "#FFF", marginBottom: "8px" }}>
              👑 PANEL DE ADMINISTRADOR
            </span>
            <h1 style={{ fontSize: "1.5rem", color: "#FFF", margin: "4px 0" }}>Gestión global</h1>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.87rem" }}>
              {trainers.length} profesores · {students.length} alumnos
            </p>
          </div>

          <div className="action-row">
            <button className="btn btn-lime" onClick={openNewTrainer}>
              <Plus size={17} /> Profesor
            </button>
            <button className="btn btn-secondary" onClick={openNewStudent} disabled={trainers.length === 0}>
              <Plus size={17} /> Alumno
            </button>
          </div>
        </div>
      </div>

      {/* Accesos recién generados: al crear una cuenta o al resetear la contraseña */}
      {generatedPassword && (
        <div className="glass-panel animate-fade-in" style={{ padding: "16px", border: "1px solid var(--accent-green)" }}>
          <div className="row-between" style={{ marginBottom: "10px" }}>
            <strong style={{ fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={18} color="var(--accent-green)" />
              Accesos de {generatedPassword.name}
            </strong>
            <button className="btn btn-ghost btn-sm" onClick={() => setGeneratedPassword(null)}>Cerrar</button>
          </div>

          <div className="subtle-box" style={{ background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.3)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>
              {generatedPassword.tipo === "trainer" ? "EMAIL" : "USUARIO"}
            </div>
            <div style={{ fontWeight: 800, color: "var(--accent-blue)", wordBreak: "break-all", marginBottom: "8px" }}>
              {generatedPassword.user}
            </div>

            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>CONTRASEÑA</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent-green)", wordBreak: "break-all" }}>
              {generatedPassword.password}
            </div>
          </div>

          <div className="action-row" style={{ marginTop: "12px" }}>
            <button className="btn btn-lime btn-sm" style={{ flex: 1 }} onClick={enviarAccesos}>
              <Send size={15} /> Enviar accesos
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={copiarAccesos}>
              <Copy size={15} /> Copiar accesos
            </button>
          </div>

          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "10px" }}>
            Anotá o enviá la contraseña ahora: se guarda cifrada y no se puede volver a ver.
          </p>
        </div>
      )}

      {/* Pestañas (antes se desbordaban en celular) */}
      <div className="scroll-x-wrap">
        <div className="scroll-x" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "trainers"}
            className={`btn btn-sm ${activeTab === "trainers" ? "btn-primary" : "btn-secondary"}`}
            style={{ borderRadius: "20px" }}
            onClick={() => setActiveTab("trainers")}
          >
            💪 Profesores ({trainers.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "students"}
            className={`btn btn-sm ${activeTab === "students" ? "btn-primary" : "btn-secondary"}`}
            style={{ borderRadius: "20px" }}
            onClick={() => setActiveTab("students")}
          >
            🏋️ Alumnos ({students.length})
          </button>
          <button className="btn btn-sm btn-secondary" style={{ borderRadius: "20px" }} onClick={() => { setFormError(""); setAdminModal(true); }}>
            <ShieldAlert size={14} /> Mi contraseña
          </button>
        </div>
      </div>

      <div className="search-box">
        <Search size={17} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          className="form-input"
          placeholder="Buscar por nombre o usuario..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Buscar"
        />
      </div>

      {/* PROFESORES */}
      {activeTab === "trainers" && (
        <div className="grid-cards">
          {filteredTrainers.length === 0 ? (
            <div className="glass-panel" style={{ padding: "34px 20px", textAlign: "center", color: "var(--text-secondary)", gridColumn: "1 / -1" }}>
              No hay profesores registrados. Creá el primero.
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
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    opacity: isRevoked ? 0.65 : 1,
                    borderLeft: `4px solid ${isRevoked ? "var(--accent-red)" : "var(--accent-blue)"}`
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
                    <StudentAvatar gender={t.gender || "male"} name={t.name} size={44} />
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: "1rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</h3>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{t.brandName || "Profesor"}</span>
                    </div>
                  </div>

                  {/* Antes esta tarjeta mostraba la contraseña en texto plano */}
                  <div className="subtle-box" style={{ fontSize: "0.78rem", padding: "10px 12px" }}>
                    <div>📧 {t.email}</div>
                    {t.phone && <div>📱 {t.phone}</div>}
                    <div>
                      <Users size={11} style={{ verticalAlign: "-1px" }} /> Alumnos:{" "}
                      <strong style={{ color: "var(--accent-blue)" }}>{countStudents}</strong>
                    </div>
                  </div>

                  <span className={`badge ${isRevoked ? "badge-danger" : "badge-success"}`} style={{ alignSelf: "flex-start" }}>
                    {isRevoked ? "🔴 Acceso revocado" : "🟢 Acceso habilitado"}
                  </span>

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => openEditTrainer(t)}>
                      <Edit size={14} /> Editar
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleResetTrainerPassword(t)} title="Generar contraseña nueva" aria-label="Generar contraseña nueva">
                      <Key size={14} />
                    </button>
                    <button
                      className={`btn btn-sm ${isRevoked ? "btn-lime" : "btn-secondary"}`}
                      onClick={() => run(() => toggleTrainerAccess(t.id))}
                      title={isRevoked ? "Habilitar" : "Suspender"}
                      aria-label={isRevoked ? "Habilitar acceso" : "Suspender acceso"}
                    >
                      {isRevoked ? <UserCheck size={14} /> : <UserX size={14} />}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTrainer(t)} title="Eliminar" aria-label="Eliminar profesor">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ALUMNOS */}
      {activeTab === "students" && (
        <div className="grid-cards">
          {filteredStudents.length === 0 ? (
            <div className="glass-panel" style={{ padding: "34px 20px", textAlign: "center", color: "var(--text-secondary)", gridColumn: "1 / -1" }}>
              No hay alumnos registrados.
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
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    opacity: isRevoked ? 0.65 : 1,
                    borderLeft: `4px solid ${isRevoked ? "var(--accent-red)" : "var(--accent-green)"}`
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
                    <StudentAvatar gender={s.gender} name={s.name} size={44} />
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: "1rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</h3>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{s.goal}</span>
                    </div>
                  </div>

                  <div className="subtle-box" style={{ fontSize: "0.78rem", padding: "10px 12px" }}>
                    <div>
                      💪 Profesor: <strong style={{ color: "var(--accent-blue)" }}>{assignedTrainer?.name || "Sin asignar"}</strong>
                    </div>
                    <div>🔑 Usuario: <strong style={{ color: "var(--accent-blue)" }}>{s.username}</strong></div>
                    {s.phone && <div>📱 {s.phone}</div>}
                  </div>

                  <span className={`badge ${isRevoked ? "badge-danger" : "badge-success"}`} style={{ alignSelf: "flex-start" }}>
                    {isRevoked ? "🔴 Acceso revocado" : "🟢 Acceso habilitado"}
                  </span>

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => openEditStudent(s)}>
                      <Edit size={14} /> Editar
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleResetStudentPassword(s)} title="Generar contraseña nueva" aria-label="Generar contraseña nueva">
                      <Key size={14} />
                    </button>
                    <button
                      className={`btn btn-sm ${isRevoked ? "btn-lime" : "btn-secondary"}`}
                      onClick={() => run(() => toggleStudentAccess(s.id))}
                      title={isRevoked ? "Habilitar" : "Suspender"}
                      aria-label={isRevoked ? "Habilitar acceso" : "Suspender acceso"}
                    >
                      {isRevoked ? <UserCheck size={14} /> : <UserX size={14} />}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStudent(s)} title="Eliminar" aria-label="Eliminar alumno">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal profesor */}
      <Modal
        isOpen={!!trainerModal}
        onClose={() => setTrainerModal(null)}
        title={trainerModal?.editing ? `Editar · ${trainerModal.editing.name}` : "Crear profesor"}
      >
        <form onSubmit={handleSaveTrainer}>
          <ErrorBox>{formError}</ErrorBox>

          <div className="form-group">
            <label className="form-label" htmlFor="tf-name">Nombre</label>
            <input id="tf-name" type="text" className="form-input" value={trainerForm.name} onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Género</label>
            <GenderPicker value={trainerForm.gender} onChange={(gender) => setTrainerForm({ ...trainerForm, gender })} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="tf-email">
                Email de acceso {isCloudMode() && "(es su usuario)"}
              </label>
              <input id="tf-email" type="email" className="form-input" value={trainerForm.email} onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="tf-user">Usuario</label>
              <input id="tf-user" type="text" autoCapitalize="none" className="form-input" placeholder="Se genera del email" value={trainerForm.username} onChange={(e) => setTrainerForm({ ...trainerForm, username: e.target.value })} />
            </div>
          </div>

          {/* En modo nube la contraseña la administra Supabase Auth: al editar
              no se cambia desde acá, sino con el botón 🔑 de la tarjeta. */}
          {trainerModal?.editing && isCloudMode() ? (
            <div className="subtle-box" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
              🔒 La contraseña la maneja Supabase Auth. Para cambiarla, usá el botón 🔑 de la tarjeta del profesor.
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label" htmlFor="tf-pass">
                {trainerModal?.editing ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña inicial"}
              </label>
              <input
                id="tf-pass"
                type="text"
                className="form-input"
                value={trainerForm.password}
                onChange={(e) => setTrainerForm({ ...trainerForm, password: e.target.value })}
                placeholder={trainerModal?.editing ? "••••••" : "Ej: coach2026"}
              />
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="tf-brand">Marca / Estudio</label>
              <input id="tf-brand" type="text" className="form-input" value={trainerForm.brandName} onChange={(e) => setTrainerForm({ ...trainerForm, brandName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="tf-phone">Teléfono</label>
              <input id="tf-phone" type="tel" inputMode="tel" className="form-input" value={trainerForm.phone} onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })} />
            </div>
          </div>

          {/* Se usan en los recordatorios de cuota por WhatsApp */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="tf-alias">Alias de cobro</label>
              <input id="tf-alias" type="text" className="form-input" value={trainerForm.alias} onChange={(e) => setTrainerForm({ ...trainerForm, alias: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="tf-cbu">CBU / CVU</label>
              <input id="tf-cbu" type="text" inputMode="numeric" className="form-input" value={trainerForm.cbu} onChange={(e) => setTrainerForm({ ...trainerForm, cbu: e.target.value })} />
            </div>
          </div>

          <div className="action-row" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setTrainerModal(null)}>Cancelar</button>
            <button type="submit" className="btn btn-lime" disabled={busy}>
              {busy && <Loader2 size={15} className="spin" />} {trainerModal?.editing ? "Guardar" : "Crear profesor"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal alumno */}
      <Modal
        isOpen={!!studentModal}
        onClose={() => setStudentModal(null)}
        title={studentModal?.editing ? `Editar · ${studentModal.editing.name}` : "Crear alumno"}
      >
        <form onSubmit={handleSaveStudent}>
          <ErrorBox>{formError}</ErrorBox>

          <div className="form-group">
            <label className="form-label" htmlFor="sf-name">Nombre completo</label>
            <input
              id="sf-name"
              type="text"
              className="form-input"
              value={studentForm.name}
              onChange={(e) => {
                const value = e.target.value;
                const clean = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
                setStudentForm((prev) => ({
                  ...prev,
                  name: value,
                  username: prev.username || (clean ? `${clean}.fit` : ""),
                  password: prev.password || (clean ? generateTempPassword(clean) : "")
                }));
              }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Género</label>
            <GenderPicker value={studentForm.gender} onChange={(gender) => setStudentForm({ ...studentForm, gender })} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sf-trainer">Profesor asignado</label>
            <select id="sf-trainer" className="form-select" value={studentForm.trainerId} onChange={(e) => setStudentForm({ ...studentForm, trainerId: e.target.value })} required>
              <option value="">Seleccionar...</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.brandName || "Profesor"})</option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="sf-phone">Teléfono (WhatsApp)</label>
              <input id="sf-phone" type="tel" inputMode="tel" className="form-input" value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sf-price">Valor cuota ($)</label>
              <input
                id="sf-price"
                type="text"
                inputMode="numeric"
                className="form-input"
                value={studentForm.planPrice}
                onChange={(e) => setStudentForm({ ...studentForm, planPrice: e.target.value.replace(/[^0-9]/g, "") })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="sf-user">
                Usuario de acceso {isCloudMode() && "(no se puede cambiar después)"}
              </label>
              <input id="sf-user" type="text" autoCapitalize="none" className="form-input" value={studentForm.username} onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })} required />
            </div>
            {!(studentModal?.editing && isCloudMode()) && (
              <div className="form-group">
                <label className="form-label" htmlFor="sf-pass">
                  {studentModal?.editing ? "Nueva contraseña (opcional)" : "Contraseña inicial"}
                </label>
                <input id="sf-pass" type="text" className="form-input" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} />
              </div>
            )}
          </div>

          <div className="action-row" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setStudentModal(null)}>Cancelar</button>
            <button type="submit" className="btn btn-lime" disabled={busy}>
              {busy && <Loader2 size={15} className="spin" />} {studentModal?.editing ? "Guardar" : "Crear alumno"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal contraseña de admin (antes estaba fija en el código) */}
      <Modal isOpen={adminModal} onClose={() => setAdminModal(false)} title="Cambiar mi contraseña de administrador">
        <form onSubmit={handleChangeAdminPassword}>
          <ErrorBox>{formError}</ErrorBox>

          <div className="form-group">
            <label className="form-label" htmlFor="ad-pass">Nueva contraseña</label>
            <input id="ad-pass" type="password" className="form-input" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ad-confirm">Repetir contraseña</label>
            <input id="ad-confirm" type="password" className="form-input" value={adminForm.confirm} onChange={(e) => setAdminForm({ ...adminForm, confirm: e.target.value })} required />
          </div>

          <div className="action-row" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setAdminModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Actualizar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
