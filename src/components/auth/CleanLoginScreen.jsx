import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Zap, Lock, User, ShieldCheck, CheckSquare, Square } from "lucide-react";

export const CleanLoginScreen = () => {
  const { loginAdmin, loginTrainer, loginStudent } = useAuth();
  const [roleType, setRoleType] = useState("trainer"); // "trainer" | "student" | "admin"
  const [inputVal, setInputVal] = useState("");
  const [passwordVal, setPasswordVal] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Cargar credenciales recordadas al cambiar de rol o abrir la pantalla
  useEffect(() => {
    const key = `fittrainer_remember_credentials_${roleType}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const { username, password } = JSON.parse(saved);
        setInputVal(username || "");
        setPasswordVal(password || "");
      } catch (e) {}
    } else {
      setInputVal("");
      setPasswordVal("");
    }
  }, [roleType]);

  const handleModeChange = (newRole) => {
    setRoleType(newRole);
    setErrorMsg("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    let res = null;
    if (roleType === "admin") {
      res = loginAdmin(inputVal, passwordVal);
    } else if (roleType === "trainer") {
      res = loginTrainer(inputVal, passwordVal);
    } else if (roleType === "student") {
      res = loginStudent(inputVal, passwordVal);
    }

    if (res && res.success) {
      if (rememberMe) {
        localStorage.setItem(`fittrainer_remember_credentials_${roleType}`, JSON.stringify({
          username: inputVal,
          password: passwordVal
        }));
      } else {
        localStorage.removeItem(`fittrainer_remember_credentials_${roleType}`);
      }
    } else if (res && !res.success) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F2F2F7",
        padding: "16px",
        zIndex: 1000
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "32px 24px",
          background: "#FFFFFF",
          borderRadius: "20px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.08)",
          margin: "auto"
        }}
      >
        {/* Logo Branding - Rayo Azul sin fondo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Zap size={46} color="var(--accent-blue)" strokeWidth={2.6} style={{ marginBottom: "8px" }} />
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--text-primary)" }}>FitTrainer PRO</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Software de Gestión de Entrenamientos
          </p>
        </div>

        {/* Apple Segmented Control Switcher */}
        <div style={{ display: "flex", background: "#E5E5EA", padding: "3px", borderRadius: "10px", marginBottom: "20px" }}>
          <button
            type="button"
            className={`btn btn-sm ${roleType === "trainer" ? "btn-primary" : "btn-ghost"}`}
            style={{ flex: 1, borderRadius: "8px", fontWeight: 600, fontSize: "0.8rem" }}
            onClick={() => handleModeChange("trainer")}
          >
            Profesor
          </button>
          <button
            type="button"
            className={`btn btn-sm ${roleType === "student" ? "btn-lime" : "btn-ghost"}`}
            style={{ flex: 1, borderRadius: "8px", fontWeight: 600, fontSize: "0.8rem" }}
            onClick={() => handleModeChange("student")}
          >
            Alumno
          </button>
          <button
            type="button"
            className={`btn btn-sm ${roleType === "admin" ? "btn-secondary" : "btn-ghost"}`}
            style={{ flex: 1, borderRadius: "8px", fontWeight: 600, fontSize: "0.8rem" }}
            onClick={() => handleModeChange("admin")}
          >
            Admin
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: "10px 14px", background: "rgba(255,59,48,0.1)", border: "1px solid var(--accent-red)", borderRadius: "10px", color: "var(--accent-red)", fontSize: "0.85rem", marginBottom: "16px" }}>
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {roleType === "trainer" && "Email / Usuario de Profesor"}
              {roleType === "student" && "Usuario de Alumno"}
              {roleType === "admin" && "Usuario Administrador (Admin)"}
            </label>
            <div style={{ position: "relative" }}>
              <User size={18} color="var(--text-secondary)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                className="form-input"
                placeholder={roleType === "admin" ? "admin" : "Tu usuario o email..."}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                style={{ paddingLeft: "38px" }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label">Contraseña</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} color="var(--text-secondary)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={passwordVal}
                onChange={(e) => setPasswordVal(e.target.value)}
                style={{ paddingLeft: "38px" }}
                required
              />
            </div>
          </div>

          {/* CHECKBOX RECORDAR USUARIO Y CONTRASEÑA */}
          <div
            onClick={() => setRememberMe(!rememberMe)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            {rememberMe ? (
              <CheckSquare size={18} color="var(--accent-blue)" />
            ) : (
              <Square size={18} color="var(--text-secondary)" />
            )}
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Recordar usuario y contraseña
            </span>
          </div>

          <button
            type="submit"
            className={`btn ${roleType === "student" ? "btn-lime" : "btn-primary"} btn-lg`}
            style={{ width: "100%", borderRadius: "12px" }}
          >
            <ShieldCheck size={18} /> Iniciar Sesión
          </button>
        </form>

      </div>
    </div>
  );
};
