import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Zap, Lock, User, ShieldCheck } from "lucide-react";

export const CleanLoginScreen = () => {
  const { loginAdmin, loginTrainer, loginStudent } = useAuth();
  const [roleType, setRoleType] = useState("trainer"); // "trainer" | "student" | "admin"
  const [inputVal, setInputVal] = useState("");
  const [passwordVal, setPasswordVal] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleModeChange = (newRole) => {
    setRoleType(newRole);
    setErrorMsg("");
    setInputVal("");
    setPasswordVal("");
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

    if (res && !res.success) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: "440px", padding: "32px 24px", boxShadow: "0 10px 40px rgba(0,0,0,0.06)" }}>
        
        {/* Logo Branding - Rayo Azul sin fondo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Zap size={44} color="var(--accent-blue)" strokeWidth={2.6} style={{ marginBottom: "8px" }} />
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>FitTrainer PRO</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Software de Gestión de Entrenamientos y Clientes
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

          <div className="form-group" style={{ marginBottom: "20px" }}>
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
