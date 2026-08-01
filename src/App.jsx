import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppleHeader } from "./components/common/AppleHeader";
import { MobileBottomTabBar } from "./components/common/MobileBottomTabBar";
import { CleanLoginScreen } from "./components/auth/CleanLoginScreen";
import { MasterDashboard } from "./components/master/MasterDashboard";
import { TrainerCleanDashboard } from "./components/trainer/TrainerCleanDashboard";
import { StudentListClean } from "./components/trainer/StudentListClean";
import { StudentDetailClean } from "./components/trainer/StudentDetailClean";
import { PaymentsClean } from "./components/trainer/PaymentsClean";
import { RoutineBuilder } from "./components/trainer/RoutineBuilder";
import { StudentCleanHome } from "./components/student/StudentCleanHome";
import { CordobaContactBanner } from "./components/common/CordobaContactBanner";
import { Zap } from "lucide-react";

const SplashScreen = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      background: "var(--bg-system)"
    }}
  >
    <Zap size={54} color="var(--accent-blue)" strokeWidth={2.8} className="spin" style={{ animationDuration: "1.6s" }} />
    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Cargando FitTrainer PRO...</span>
  </div>
);

const MainApp = () => {
  const { currentUser, role, loading, students } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isCreateStudentModalOpen, setIsCreateStudentModalOpen] = useState(false);

  // Se guarda el id, no el objeto: así la ficha siempre muestra datos frescos
  // después de registrar un pago o asignar una rutina.
  const selectedStudent = selectedStudentId ? students.find((s) => s.id === selectedStudentId) : null;

  // Al entrar, cada rol arranca en su pantalla natural.
  useEffect(() => {
    if (!currentUser) return;
    if (role === "student") setActiveTab((t) => (t === "dashboard" ? "workout" : t));
    if (role === "admin") setActiveTab("dashboard");
  }, [currentUser, role]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== "student-detail") setSelectedStudentId(null);
    if (tab !== "students") setIsCreateStudentModalOpen(false);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudentId(student.id);
    setActiveTab("student-detail");
  };

  // Evita el parpadeo de la pantalla de login mientras se restaura la sesión.
  if (loading) return <SplashScreen />;

  if (!currentUser) {
    return (
      <div className="app-container">
        <CleanLoginScreen />
      </div>
    );
  }

  return (
    <div className="app-container">
      <AppleHeader activeTab={activeTab} setActiveTab={handleTabChange} />

      <main className="main-content">
        {/* ADMINISTRADOR */}
        {role === "admin" && <MasterDashboard />}

        {/* PROFESOR */}
        {role === "trainer" && (
          <>
            {activeTab === "dashboard" && (
              <TrainerCleanDashboard
                onNavigateTab={handleTabChange}
                onSelectStudent={handleSelectStudent}
                onOpenNewStudent={() => {
                  setActiveTab("students");
                  setIsCreateStudentModalOpen(true);
                }}
              />
            )}

            {activeTab === "students" && (
              <StudentListClean
                onSelectStudent={handleSelectStudent}
                isCreateModalOpen={isCreateStudentModalOpen}
                setIsCreateModalOpen={setIsCreateStudentModalOpen}
              />
            )}

            {activeTab === "student-detail" && selectedStudent && (
              <StudentDetailClean
                student={selectedStudent}
                onBack={() => {
                  setSelectedStudentId(null);
                  setActiveTab("students");
                }}
              />
            )}

            {/* Si el alumno seleccionado se borró en otro dispositivo */}
            {activeTab === "student-detail" && !selectedStudent && (
              <div className="glass-panel" style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>
                Ese alumno ya no está disponible.
                <div style={{ marginTop: "12px" }}>
                  <button className="btn btn-primary" onClick={() => handleTabChange("students")}>
                    Volver a mis alumnos
                  </button>
                </div>
              </div>
            )}

            {activeTab === "payments" && <PaymentsClean onSelectStudent={handleSelectStudent} />}
            {activeTab === "routines" && <RoutineBuilder />}
          </>
        )}

        {/* ALUMNO */}
        {role === "student" && (
          <StudentCleanHome student={currentUser} activeTab={activeTab} setActiveTab={handleTabChange} />
        )}
      </main>

      <MobileBottomTabBar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Aviso de contacto: se muestra una sola vez por dispositivo */}
      <CordobaContactBanner />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
