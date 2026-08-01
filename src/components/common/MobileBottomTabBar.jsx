import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Home, Users, CreditCard, Dumbbell, ClipboardList, TrendingUp } from "lucide-react";

const TABS_BY_ROLE = {
  trainer: [
    { key: "dashboard", label: "Inicio", Icon: Home, matches: ["dashboard"] },
    { key: "students", label: "Alumnos", Icon: Users, matches: ["students", "student-detail"] },
    { key: "payments", label: "Cobros", Icon: CreditCard, matches: ["payments"] },
    { key: "routines", label: "Rutinas", Icon: Dumbbell, matches: ["routines"] }
  ],
  student: [
    { key: "workout", label: "Mi Rutina", Icon: Dumbbell, matches: ["workout"] },
    { key: "progress", label: "Progreso", Icon: TrendingUp, matches: ["progress"] },
    { key: "onboarding", label: "Cuestionario", Icon: ClipboardList, matches: ["onboarding"] }
  ]
};

const ACCENT = { trainer: "var(--accent-blue)", student: "var(--accent-green)" };

export const MobileBottomTabBar = ({ activeTab, setActiveTab }) => {
  const { currentUser, role } = useAuth();

  const tabs = TABS_BY_ROLE[role];
  // El admin tiene una sola pantalla: mostrarle una barra con un botón inerte no aportaba nada.
  if (!currentUser || !tabs) return null;

  return (
    <nav className="tab-bar mobile-only" aria-label="Navegación principal">
      {tabs.map(({ key, label, Icon, matches }) => {
        const isActive = matches.includes(activeTab);
        return (
          <button
            key={key}
            className="tab-item"
            data-active={isActive}
            aria-current={isActive ? "page" : undefined}
            style={{ color: isActive ? ACCENT[role] : "var(--text-secondary)" }}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={21} strokeWidth={isActive ? 2.4 : 2} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
