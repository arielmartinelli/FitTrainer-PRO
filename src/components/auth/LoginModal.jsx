import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../common/Modal";
import { UserCheck, Key, Zap, ShieldCheck, Mail, Lock, PlusCircle } from "lucide-react";

export const LoginModal = ({ isOpen, onClose }) => {
  const { loginTrainer, loginStudent, registerTrainer } = useAuth();
  const [activeMode, setActiveMode] = useState("trainer_login"); // "trainer_login" | "student_login" | "trainer_register"
  const [errorMsg, setErrorMsg] = useState("");

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Register Form State
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    brandName: "",
    specialty: "",
    phone: "",
    alias: ""
  });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (activeMode === "trainer_login") {
      const res = loginTrainer(email, password);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error);
      }
    } else if (activeMode === "student_login") {
      const res = loginStudent(email, password);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error);
      }
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setErrorMsg("Por favor completa los campos obligatorios.");
      return;
    }

    const res = registerTrainer(registerForm);
    if (res.success) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Acceso al Sistema FitTrainer Pro">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Toggle Mode Buttons */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "8px" }}>
          <button
            type="button"
            className={`btn btn-sm ${activeMode === "trainer_login" ? "btn-primary" : "btn-ghost"}`}
            style={{ flex: 1 }}
            onClick={() => { setActiveMode("trainer_login"); setErrorMsg(""); }}
          >
            👨‍🏫 Soy Profesor
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeMode === "student_login" ? "btn-lime" : "btn-ghost"}`}
            style={{ flex: 1 }}
            onClick={() => { setActiveMode("student_login"); setErrorMsg(""); }}
          >
            🏋️ Soy Alumno
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeMode === "trainer_register" ? "btn-secondary" : "btn-ghost"}`}
            style={{ flex: 1 }}
            onClick={() => { setActiveMode("trainer_register"); setErrorMsg(""); }}
          >
            ➕ Nuevo Profesor
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: "10px", background: "rgba(255,46,147,0.15)", border: "1px solid var(--accent-rose)", borderRadius: "8px", color: "var(--accent-rose)", fontSize: "0.85rem", textAlign: "center" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* LOGIN FORM (PROFESOR O ALUMNO) */}
        {activeMode !== "trainer_register" && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">
                {activeMode === "trainer_login" ? "Email de Profesor" : "Usuario o Email de Alumno"}
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder={activeMode === "trainer_login" ? "ejemplo: carlos@fittrainer.com" : "ejemplo: mateo.rossi"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: "36px" }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Tu contraseña..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: "36px" }}
                  required
                />
              </div>
            </div>

            <div style={{ background: "rgba(0, 242, 254, 0.06)", padding: "10px", borderRadius: "8px", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              💡 <strong>Cuentas de prueba rápida:</strong><br />
              • Profesor: <code>carlos@fittrainer.com</code> / pass: <code>carlos123</code><br />
              • Alumno: <code>mateo.rossi</code> / pass: <code>mateo123</code>
            </div>

            <button
              type="submit"
              className={`btn ${activeMode === "trainer_login" ? "btn-primary" : "btn-lime"}`}
              style={{ width: "100%" }}
            >
              <ShieldCheck size={18} /> Iniciar Sesión
            </button>
          </form>
        )}

        {/* REGISTRO NUEVO PROFESOR */}
        {activeMode === "trainer_register" && (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre Completo del Profesor</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Coach Lucas Martínez"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="form-group">
                <label className="form-label">Email de Acceso</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="profesor@ejemplo.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="form-group">
                <label className="form-label">Nombre de Tu Marca / Studio</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: LM High Performance"
                  value={registerForm.brandName}
                  onChange={(e) => setRegisterForm({ ...registerForm, brandName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Especialidad</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Hipertrofia y Biomecánica"
                  value={registerForm.specialty}
                  onChange={(e) => setRegisterForm({ ...registerForm, specialty: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Alias o CBU para recibir cobros</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: lucas.martinez.fit"
                value={registerForm.alias}
                onChange={(e) => setRegisterForm({ ...registerForm, alias: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "10px" }}>
              <PlusCircle size={18} /> Crear Mi Cuenta de Profesor
            </button>
          </form>
        )}

      </div>
    </Modal>
  );
};
