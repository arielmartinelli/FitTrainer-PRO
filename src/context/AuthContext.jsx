import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getMasterAdmin,
  getTrainers,
  getStudents,
  initializeStorage
} from "../services/storageService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState("guest"); // "admin" | "trainer" | "student" | "guest"
  const [trainers, setTrainers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshData = () => {
    initializeStorage();
    const loadedTrainers = getTrainers();
    const loadedStudents = getStudents();
    setTrainers(loadedTrainers);
    setStudents(loadedStudents);
    return { loadedTrainers, loadedStudents };
  };

  useEffect(() => {
    refreshData();
    setLoading(false);
  }, []);

  // Login Administrador (Super Admin)
  const loginAdmin = (username, password) => {
    const admin = getMasterAdmin();
    if (
      (username.toLowerCase() === admin.username.toLowerCase() || username.toLowerCase() === admin.email.toLowerCase()) &&
      password === admin.password
    ) {
      setCurrentUser(admin);
      setRole("admin");
      return { success: true, user: admin };
    }
    return { success: false, error: "Credenciales de Administrador incorrectas." };
  };

  // Login Profesor
  const loginTrainer = (input, password) => {
    const loadedTrainers = getTrainers();
    const trainer = loadedTrainers.find(
      (t) =>
        (t.email.toLowerCase() === input.toLowerCase() || t.username?.toLowerCase() === input.toLowerCase()) &&
        t.password === password
    );

    if (trainer) {
      if (trainer.status === "revoked") {
        return { success: false, error: "⛔ Tu acceso de profesor ha sido suspendido por el Administrador." };
      }
      setCurrentUser(trainer);
      setRole("trainer");
      return { success: true, user: trainer };
    }
    return { success: false, error: "Usuario/Email o contraseña de profesor incorrectos." };
  };

  // Login Alumno
  const loginStudent = (input, password) => {
    const loadedStudents = getStudents();
    const student = loadedStudents.find(
      (s) =>
        (s.username?.toLowerCase() === input.toLowerCase() || s.email?.toLowerCase() === input.toLowerCase()) &&
        s.password === password
    );

    if (student) {
      if (student.status === "revoked") {
        return { success: false, error: "⛔ Tu acceso de alumno ha sido suspendido. Consulta con tu profesor o administrador para restaurarlo." };
      }
      setCurrentUser(student);
      setRole("student");
      return { success: true, user: student };
    }
    return { success: false, error: "Usuario o contraseña de alumno incorrectos." };
  };

  const logout = () => {
    setCurrentUser(null);
    setRole("guest");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        trainers,
        students,
        loading,
        loginAdmin,
        loginTrainer,
        loginStudent,
        logout,
        refreshData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
