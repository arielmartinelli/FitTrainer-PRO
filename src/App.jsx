import React, { useState } from "react";
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

const MainApp = () => {
  const { currentUser, role } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isCreateStudentModalOpen, setIsCreateStudentModalOpen] = useState(false);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setActiveTab("student-detail");
  };

  return (
    <div className="app-container">
      {/* Apple Header */}
      {currentUser && (
        <AppleHeader
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== "student-detail") setSelectedStudent(null);
          }}
        />
      )}

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* SI NO HAY USUARIO LOGUEADO -> PANTALLA LOGIN LIMPIA */}
        {!currentUser && <CleanLoginScreen />}

        {/* 👑 VISTA DEL ADMINISTRADOR */}
        {role === "admin" && currentUser && (
          <MasterDashboard />
        )}

        {/* 👨‍🏫 VISTA DEL PROFESOR / ENTRENADOR */}
        {role === "trainer" && currentUser && (
          <>
            {(activeTab === "dashboard" || activeTab === "workout" || activeTab === "onboarding") && (
              <TrainerCleanDashboard
                onNavigateTab={(tab) => setActiveTab(tab)}
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
                  setSelectedStudent(null);
                  setActiveTab("students");
                }}
              />
            )}

            {activeTab === "payments" && (
              <PaymentsClean onSelectStudent={handleSelectStudent} />
            )}

            {activeTab === "routines" && (
              <RoutineBuilder />
            )}
          </>
        )}

        {/* 🏋️ VISTA DEL ALUMNO */}
        {role === "student" && currentUser && (
          <StudentCleanHome
            student={currentUser}
            activeTab={activeTab === "onboarding" ? "onboarding" : "workout"}
            setActiveTab={setActiveTab}
          />
        )}

      </main>

      {/* Barra de Navegación Inferior Móvil (Bottom Tab Bar estilo iPhone) */}
      {currentUser && (
        <MobileBottomTabBar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== "student-detail") setSelectedStudent(null);
          }}
        />
      )}
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
