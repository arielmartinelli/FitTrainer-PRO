import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { toggleStudentAccess, isStudentUsernameTaken } from "../../services/storageService";
import { provisionStudent } from "../../services/authService";
import { generateTempPassword } from "../../services/cryptoService";
import { getPaymentLabel, toISODate, addOneMonth } from "../../services/billingService";
import { getAdherence, ADHERENCE_LABEL } from "../../services/progressService";
import { StudentAvatar } from "../common/StudentAvatar";
import { Modal } from "../common/Modal";
import { InfoTooltip } from "../common/InfoTooltip";
import { Search, Plus, Eye, UserX, UserCheck, CheckCircle2, AlertCircle, Flame, Loader2, Copy, Send, KeyRound } from "lucide-react";

const emptyForm = () => ({
  name: "",
  email: "",
  phone: "",
  gender: "male",
  joinDate: toISODate(new Date()),
  nextDueDate: toISODate(addOneMonth(new Date())),
  goal: "Hipertrofia Muscular",
  planName: "Plan Mensual",
  planPrice: 28000,
  username: "",
  password: ""
});

export const StudentListClean = ({ onSelectStudent, isCreateModalOpen, setIsCreateModalOpen }) => {
  const { currentUser, students, refreshData } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | attention
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  // Credenciales del alumno recién creado: se muestran una sola vez para entregarlas.
  const [nuevoAcceso, setNuevoAcceso] = useState(null);

  const trainerStudents = useMemo(
    () => students.filter((s) => s.trainerId === currentUser?.id),
    [students, currentUser?.id]
  );

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return trainerStudents.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.username || "").toLowerCase().includes(q) ||
        (s.phone || "").includes(q);

      if (!matchesSearch) return false;
      if (filter === "active") return s.status !== "revoked";
      if (filter === "attention") {
        const adherence = getAdherence(s);
        return adherence.state === "inactive" || adherence.state === "never" || !s.questionnaireCompleted;
      }
      return true;
    });
  }, [trainerStudents, searchQuery, filter]);

  const handleNameChange = (value) => {
    const clean = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // saca tildes
      .replace(/[^a-z0-9]/g, "");
    setForm((prev) => ({
      ...prev,
      name: value,
      // Solo autocompleta si el usuario todavía no tocó esos campos manualmente.
      username: prev.usernameTouched ? prev.username : clean ? `${clean}.fit` : "",
      password: prev.passwordTouched ? prev.password : clean ? generateTempPassword(clean) : ""
    }));
  };

  const openCreateModal = () => {
    setForm(emptyForm());
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!form.name.trim()) return setFormError("Ingresá el nombre del alumno.");
    if (!form.username.trim()) return setFormError("Ingresá un usuario de acceso.");
    // Antes no se validaba nada y dos alumnos podían quedar con el mismo usuario.
    if (isStudentUsernameTaken(form.username)) {
      return setFormError(`El usuario "${form.username}" ya está en uso. Elegí otro.`);
    }
    if (!form.phone.trim()) {
      return setFormError("Cargá el teléfono: se usa para mandarle las credenciales y los avisos de cuota por WhatsApp.");
    }

    setFormError("");
    setSaving(true);
    try {
      const { usernameTouched, passwordTouched, ...payload } = form;
      // Crea la cuenta de Supabase Auth (si hay nube) y después la ficha,
      // usando el uid de Auth como id para que RLS reconozca al alumno.
      await provisionStudent({ ...payload, trainerId: currentUser?.id, planPrice: Number(form.planPrice) || 0 });
      await refreshData();
      // La contraseña no se puede volver a consultar, así que el modal pasa a
      // mostrar los accesos para copiarlos o enviarlos antes de cerrarse.
      setNuevoAcceso({
        name: form.name,
        username: form.username,
        password: form.password,
        phone: form.phone
      });
      setForm(emptyForm());
    } catch (err) {
      console.error(err);
      setFormError(err.message || "No se pudo crear el alumno. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAccess = async (studentId) => {
    await toggleStudentAccess(studentId);
    await refreshData();
  };

  const textoAccesos = (acceso) =>
    `Hola ${acceso.name}, estos son tus datos para entrar a FitTrainer PRO:\n\n` +
    `Usuario: ${acceso.username}\n` +
    `Contraseña: ${acceso.password}`;

  const copiarAccesos = async () => {
    try {
      await navigator.clipboard.writeText(textoAccesos(nuevoAcceso));
      alert("Accesos copiados.");
    } catch {
      alert("No se pudo copiar automáticamente. Copialos a mano desde la pantalla.");
    }
  };

  const enviarAccesos = () => {
    const phone = (nuevoAcceso.phone || "").replace(/[^0-9]/g, "");
    const texto = encodeURIComponent(textoAccesos(nuevoAcceso));
    window.open(`https://wa.me/${phone}?text=${texto}`, "_blank", "noopener");
  };

  const cerrarModal = () => {
    setIsCreateModalOpen(false);
    setNuevoAcceso(null);
    setFormError("");
  };

  return (
    <div className="animate-fade-in stack">
      <div className="row-between">
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: "1.35rem" }}>Mis Alumnos ({trainerStudents.length})</h2>
          <span style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>Fichas, rutinas y accesos.</span>
        </div>

        <button className="btn btn-lime" onClick={openCreateModal}>
          <Plus size={18} /> Crear Alumno
        </button>
      </div>

      <div className="search-box">
        <Search size={17} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          className="form-input"
          placeholder="Buscar por nombre, usuario o teléfono..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Buscar alumno"
        />
      </div>

      <div className="scroll-x-wrap">
        <div className="scroll-x">
          {[
            { key: "all", label: `Todos (${trainerStudents.length})` },
            { key: "active", label: "Solo activos" },
            { key: "attention", label: "Requieren atención" }
          ].map((f) => (
            <button
              key={f.key}
              className={`btn btn-sm ${filter === f.key ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: "20px" }}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="glass-panel" style={{ padding: "34px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
          {trainerStudents.length === 0 ? "Todavía no cargaste alumnos." : "Ningún alumno coincide con la búsqueda."}
        </div>
      ) : (
        <div className="grid-cards">
          {filteredStudents.map((st) => {
            const isRevoked = st.status === "revoked";
            const payment = getPaymentLabel(st);
            const adherence = getAdherence(st);
            const adherenceInfo = ADHERENCE_LABEL[adherence.state];

            return (
              <div
                key={st.id}
                className="glass-panel"
                style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", opacity: isRevoked ? 0.6 : 1 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
                  <StudentAvatar gender={st.gender} name={st.name} size={44} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ fontSize: "1rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {st.name}
                    </h3>
                    <div style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>{st.planName || "Plan Mensual"}</div>
                  </div>
                  {st.questionnaireCompleted ? (
                    <InfoTooltip
                      tone="success"
                      ariaLabel="Estado del cuestionario"
                      text="Cuestionario completado. Ya podés ver sus datos en la ficha."
                    >
                      <CheckCircle2 size={19} color="var(--accent-green)" />
                    </InfoTooltip>
                  ) : (
                    <InfoTooltip
                      tone="danger"
                      ariaLabel="Estado del cuestionario"
                      text="Cuestionario pendiente: el alumno todavía no cargó peso, altura, lesiones ni objetivos."
                    >
                      <AlertCircle size={19} color="var(--accent-red)" />
                    </InfoTooltip>
                  )}
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span className={`badge ${payment.badge}`}>{payment.dot} {payment.text}</span>
                  <span className={`badge ${adherenceInfo.badge}`}>
                    <Flame size={11} /> {adherence.thisWeek} esta semana
                  </span>
                  {isRevoked && <span className="badge badge-danger">Acceso suspendido</span>}
                </div>

                <div className="subtle-box" style={{ fontSize: "0.78rem", padding: "10px 12px" }}>
                  <div>Usuario: <strong style={{ color: "var(--accent-blue)" }}>{st.username}</strong></div>
                  {st.phone && <div>Tel: <strong>{st.phone}</strong></div>}
                  <div>Ingreso: <strong>{st.joinDate || "—"}</strong></div>
                </div>

                <div style={{ display: "flex", gap: "6px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onSelectStudent(st)}>
                    <Eye size={14} /> Ver ficha
                  </button>
                  <button
                    className={`btn btn-sm ${isRevoked ? "btn-lime" : "btn-danger"}`}
                    onClick={() => handleToggleAccess(st.id)}
                    aria-label={isRevoked ? "Habilitar acceso" : "Suspender acceso"}
                    title={isRevoked ? "Habilitar acceso" : "Suspender acceso"}
                  >
                    {isRevoked ? <UserCheck size={15} /> : <UserX size={15} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alta de alumno */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={cerrarModal}
        title={nuevoAcceso ? "Alumno creado" : "Crear nuevo alumno"}
      >
        {nuevoAcceso ? (
          /* Paso final: entregar los accesos. La contraseña no se puede volver
             a consultar después, así que este es el momento de pasarla. */
          <div className="stack" style={{ gap: "14px" }}>
            <div
              className="subtle-box"
              style={{ background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.3)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <CheckCircle2 size={19} color="var(--accent-green)" />
                <strong style={{ fontSize: "0.95rem" }}>{nuevoAcceso.name} ya puede entrar</strong>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>USUARIO</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--accent-blue)", wordBreak: "break-all" }}>
                    {nuevoAcceso.username}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>CONTRASEÑA</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--accent-green)", wordBreak: "break-all" }}>
                    {nuevoAcceso.password}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="subtle-box"
              style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "0.82rem", color: "var(--text-secondary)" }}
            >
              <KeyRound size={16} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>
                Anotá o enviá la contraseña ahora: se guarda cifrada y no se puede volver a ver. Si se pierde,
                vas a tener que generar una nueva desde la ficha.
              </span>
            </div>

            <div className="action-row">
              <button className="btn btn-lime" style={{ flex: 1 }} onClick={enviarAccesos}>
                <Send size={16} /> Enviar accesos
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={copiarAccesos}>
                <Copy size={16} /> Copiar accesos
              </button>
            </div>

            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={cerrarModal}>
              Listo, cerrar
            </button>
          </div>
        ) : (
        <form onSubmit={handleCreateStudent}>
          {formError && (
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
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="ns-name">Nombre completo</label>
            <input id="ns-name" type="text" className="form-input" value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Género</label>
            <div className="segmented-2">
              <button type="button" className="seg-option" data-tone="male" data-active={form.gender === "male"} onClick={() => setForm({ ...form, gender: "male" })}>
                👨 Masculino
              </button>
              <button type="button" className="seg-option" data-tone="female" data-active={form.gender === "female"} onClick={() => setForm({ ...form, gender: "female" })}>
                👩 Femenino
              </button>
            </div>
          </div>

          {/* Sin teléfono no funcionaban ni el envío de credenciales ni los avisos de cuota */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="ns-phone">Teléfono (WhatsApp)</label>
              <input
                id="ns-phone"
                type="tel"
                inputMode="tel"
                className="form-input"
                placeholder="5493511234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ns-email">Email (opcional)</label>
              <input
                id="ns-email"
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="ns-user">Usuario de acceso</label>
              <input
                id="ns-user"
                type="text"
                className="form-input"
                autoCapitalize="none"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value, usernameTouched: true })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ns-pass">Contraseña inicial</label>
              <input
                id="ns-pass"
                type="text"
                className="form-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value, passwordTouched: true })}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="ns-plan">Plan</label>
              <input id="ns-plan" type="text" className="form-input" value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ns-price">Valor de la cuota ($)</label>
              <input
                id="ns-price"
                type="text"
                inputMode="numeric"
                className="form-input"
                value={form.planPrice}
                onChange={(e) => setForm({ ...form, planPrice: e.target.value.replace(/[^0-9]/g, "") })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ns-due">Primer vencimiento de cuota</label>
            <input id="ns-due" type="date" className="form-input" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} />
          </div>

          <div className="action-row" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
            <button type="button" className="btn btn-ghost" onClick={cerrarModal}>Cancelar</button>
            <button type="submit" className="btn btn-lime" disabled={saving}>
              {saving && <Loader2 size={16} className="spin" />} {saving ? "Creando..." : "Crear alumno"}
            </button>
          </div>
        </form>
        )}
      </Modal>
    </div>
  );
};
