import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { sendPasswordReset, isCloudMode } from "../../services/authService";
import { Zap, Lock, User, ShieldCheck, CheckSquare, Square, Eye, EyeOff, Loader2, MailQuestion } from "lucide-react";

// Solo se recuerda el USUARIO. La contraseña ya no se guarda nunca en el dispositivo.
const REMEMBER_KEY = (roleType) => `fittrainer_remember_user_${roleType}`;
const LEGACY_KEY = (roleType) => `fittrainer_remember_credentials_${roleType}`;

export const CleanLoginScreen = () => {
  const { loginAdmin, loginTrainer, loginStudent, sessionNotice, clearSessionNotice } = useAuth();
  const [roleType, setRoleType] = useState("trainer"); // "trainer" | "student" | "admin"
  const [inputVal, setInputVal] = useState("");
  const [passwordVal, setPasswordVal] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  // Limpia contraseñas guardadas por versiones anteriores de la app.
  useEffect(() => {
    ["trainer", "student", "admin"].forEach((r) => localStorage.removeItem(LEGACY_KEY(r)));
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem(REMEMBER_KEY(roleType));
    setInputVal(savedUser || "");
    setPasswordVal("");
  }, [roleType]);

  const handleModeChange = (newRole) => {
    setRoleType(newRole);
    setErrorMsg("");
    setResetMsg("");
    clearSessionNotice?.();
  };

  /**
   * Recuperación por email. Solo tiene sentido para profesores y admin, que usan
   * una casilla real: los alumnos entran con un usuario y su email de Auth es
   * interno, así que a ellos les resetea la contraseña su profesor.
   */
  const handleForgotPassword = async () => {
    if (!inputVal.trim()) {
      setErrorMsg("Escribí tu email arriba y volvé a tocar el enlace.");
      return;
    }
    setErrorMsg("");
    try {
      await sendPasswordReset(inputVal);
      setResetMsg(`Te mandamos un mail a ${inputVal} con el enlace para restablecer la contraseña.`);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMsg("");
    clearSessionNotice?.();
    setSubmitting(true);

    try {
      let res = null;
      if (roleType === "admin") res = await loginAdmin(inputVal, passwordVal);
      else if (roleType === "trainer") res = await loginTrainer(inputVal, passwordVal);
      else res = await loginStudent(inputVal, passwordVal);

      if (res?.success) {
        if (rememberMe) localStorage.setItem(REMEMBER_KEY(roleType), inputVal);
        else localStorage.removeItem(REMEMBER_KEY(roleType));
      } else {
        setErrorMsg(res?.error || "No se pudo iniciar sesión.");
        setPasswordVal("");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocurrió un error al iniciar sesión. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="glass-panel animate-fade-in login-card">
        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Zap size={52} color="var(--accent-blue)" strokeWidth={2.8} style={{ marginBottom: "8px" }} />
          <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.035em" }}>FitTrainer PRO</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px", fontWeight: 500 }}>
            Software de Gestión de Entrenamientos
          </p>

          {/* Indicador de conexión: deja ver de un vistazo si la app está leyendo
              el .env y hablando con Supabase, o si quedó en modo local. */}
          <span className={`badge ${isCloudMode() ? "badge-success" : "badge-warning"}`} style={{ marginTop: "10px" }}>
            {isCloudMode() ? "🟢 Conectado a la nube" : "🟡 Modo local (sin Supabase)"}
          </span>
        </div>

        {/* Selector de rol */}
        <div className="segmented" style={{ marginBottom: "20px" }}>
          <button
            type="button"
            className={`btn btn-sm ${roleType === "trainer" ? "btn-primary" : "btn-ghost"}`}
            style={{ flex: 1, borderRadius: "8px", fontWeight: 600 }}
            onClick={() => handleModeChange("trainer")}
          >
            Profesor
          </button>
          <button
            type="button"
            className={`btn btn-sm ${roleType === "student" ? "btn-lime" : "btn-ghost"}`}
            style={{ flex: 1, borderRadius: "8px", fontWeight: 600 }}
            onClick={() => handleModeChange("student")}
          >
            Alumno
          </button>
          <button
            type="button"
            className={`btn btn-sm ${roleType === "admin" ? "btn-secondary" : "btn-ghost"}`}
            style={{ flex: 1, borderRadius: "8px", fontWeight: 600 }}
            onClick={() => handleModeChange("admin")}
          >
            Admin
          </button>
        </div>

        {resetMsg && (
          <div
            role="status"
            style={{
              padding: "10px 14px",
              background: "rgba(52,199,89,0.1)",
              border: "1px solid var(--accent-green)",
              borderRadius: "10px",
              color: "#248A3D",
              fontSize: "0.85rem",
              marginBottom: "16px"
            }}
          >
            {resetMsg}
          </div>
        )}

        {(errorMsg || sessionNotice) && (
          <div
            role="alert"
            style={{
              padding: "10px 14px",
              background: "rgba(255,59,48,0.1)",
              border: "1px solid var(--accent-red)",
              borderRadius: "10px",
              color: "var(--accent-red)",
              fontSize: "0.85rem",
              marginBottom: "16px"
            }}
          >
            {errorMsg || sessionNotice}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-user">
              {/* Con Supabase Auth la identidad es el email; sin nube alcanza el usuario. */}
              {roleType === "trainer" && (isCloudMode() ? "Email de Profesor" : "Email / Usuario de Profesor")}
              {roleType === "student" && "Usuario de Alumno"}
              {roleType === "admin" && (isCloudMode() ? "Email de Administrador" : "Usuario Administrador")}
            </label>
            <div style={{ position: "relative" }}>
              <User size={18} color="var(--text-secondary)" className="input-icon-left" />
              <input
                id="login-user"
                type="text"
                className="form-input"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder={
                  roleType === "student"
                    ? "Ej: nicolas.fit"
                    : isCloudMode()
                      ? "tu@email.com"
                      : "Tu usuario o email..."
                }
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                style={{ paddingLeft: "38px" }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label" htmlFor="login-pass">Contraseña</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} color="var(--text-secondary)" className="input-icon-left" />
              <input
                id="login-pass"
                type={showPassword ? "text" : "password"}
                className="form-input"
                autoComplete="current-password"
                placeholder="••••••••"
                value={passwordVal}
                onChange={(e) => setPasswordVal(e.target.value)}
                style={{ paddingLeft: "38px", paddingRight: "44px" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="input-icon-right-btn"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Solo recuerda el usuario, nunca la contraseña */}
          <button
            type="button"
            onClick={() => setRememberMe(!rememberMe)}
            className="btn btn-ghost"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
              padding: "8px 0",
              justifyContent: "flex-start",
              width: "100%"
            }}
          >
            {rememberMe ? <CheckSquare size={18} color="var(--accent-blue)" /> : <Square size={18} color="var(--text-secondary)" />}
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Recordar mi usuario en este dispositivo
            </span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className={`btn ${roleType === "student" ? "btn-lime" : "btn-primary"} btn-lg`}
            style={{ width: "100%", borderRadius: "12px", fontWeight: 700, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? <Loader2 size={18} className="spin" /> : <ShieldCheck size={18} />}
            {submitting ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </form>

        {isCloudMode() && roleType !== "student" ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ width: "100%", marginTop: "14px", fontWeight: 500 }}
            onClick={handleForgotPassword}
          >
            <MailQuestion size={15} /> Olvidé mi contraseña
          </button>
        ) : (
          <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", textAlign: "center", marginTop: "18px", lineHeight: 1.4 }}>
            ¿Olvidaste tu contraseña? Pedísela a tu profesor para que te genere una nueva.
          </p>
        )}
      </div>
    </div>
  );
};
