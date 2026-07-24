import React from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  Users,
  CreditCard,
  Dumbbell,
  ClipboardList,
  ShieldAlert,
  UserCheck
} from "lucide-react";

export const MobileBottomTabBar = ({ activeTab, setActiveTab }) => {
  const { currentUser, role } = useAuth();

  if (!currentUser) return null;

  return (
    <nav
      className="mobile-only"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "6px 4px 10px 4px",
        boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.04)"
      }}
    >
      {/* PROFESOR TABS */}
      {role === "trainer" && (
        <>
          <button
            className="btn btn-ghost"
            style={{
              flexDirection: "column",
              gap: "2px",
              padding: "4px 8px",
              fontSize: "0.68rem",
              color: activeTab === "dashboard" ? "var(--accent-blue)" : "var(--text-secondary)",
              fontWeight: activeTab === "dashboard" ? 700 : 500
            }}
            onClick={() => setActiveTab("dashboard")}
          >
            <Home size={20} />
            <span>Inicio</span>
          </button>

          <button
            className="btn btn-ghost"
            style={{
              flexDirection: "column",
              gap: "2px",
              padding: "4px 8px",
              fontSize: "0.68rem",
              color: activeTab === "students" || activeTab === "student-detail" ? "var(--accent-blue)" : "var(--text-secondary)",
              fontWeight: activeTab === "students" ? 700 : 500
            }}
            onClick={() => setActiveTab("students")}
          >
            <Users size={20} />
            <span>Alumnos</span>
          </button>

          <button
            className="btn btn-ghost"
            style={{
              flexDirection: "column",
              gap: "2px",
              padding: "4px 8px",
              fontSize: "0.68rem",
              color: activeTab === "payments" ? "var(--accent-blue)" : "var(--text-secondary)",
              fontWeight: activeTab === "payments" ? 700 : 500
            }}
            onClick={() => setActiveTab("payments")}
          >
            <CreditCard size={20} />
            <span>Cobros</span>
          </button>

          <button
            className="btn btn-ghost"
            style={{
              flexDirection: "column",
              gap: "2px",
              padding: "4px 8px",
              fontSize: "0.68rem",
              color: activeTab === "routines" ? "var(--accent-blue)" : "var(--text-secondary)",
              fontWeight: activeTab === "routines" ? 700 : 500
            }}
            onClick={() => setActiveTab("routines")}
          >
            <Dumbbell size={20} />
            <span>Rutinas</span>
          </button>
        </>
      )}

      {/* ALUMNO TABS */}
      {role === "student" && (
        <>
          <button
            className="btn btn-ghost"
            style={{
              flexDirection: "column",
              gap: "2px",
              padding: "4px 12px",
              fontSize: "0.725rem",
              color: activeTab === "workout" ? "var(--accent-green)" : "var(--text-secondary)",
              fontWeight: activeTab === "workout" ? 700 : 500
            }}
            onClick={() => setActiveTab("workout")}
          >
            <Dumbbell size={22} />
            <span>Mi Rutina</span>
          </button>

          <button
            className="btn btn-ghost"
            style={{
              flexDirection: "column",
              gap: "2px",
              padding: "4px 12px",
              fontSize: "0.725rem",
              color: activeTab === "onboarding" ? "var(--accent-green)" : "var(--text-secondary)",
              fontWeight: activeTab === "onboarding" ? 700 : 500
            }}
            onClick={() => setActiveTab("onboarding")}
          >
            <ClipboardList size={22} />
            <span>Mi Cuestionario</span>
          </button>
        </>
      )}

      {/* ADMIN TABS */}
      {role === "admin" && (
        <>
          <button
            className="btn btn-ghost"
            style={{
              flexDirection: "column",
              gap: "2px",
              padding: "4px 12px",
              fontSize: "0.725rem",
              color: "var(--accent-blue)",
              fontWeight: 700
            }}
            onClick={() => setActiveTab("dashboard")}
          >
            <ShieldAlert size={22} />
            <span>Panel Admin</span>
          </button>
        </>
      )}
    </nav>
  );
};
