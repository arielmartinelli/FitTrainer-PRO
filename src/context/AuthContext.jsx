import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getMasterAdmin,
  getTrainers,
  getStudents,
  getRoutines,
  initializeStorage
} from "../services/storageService";
import { supabase, isSupabaseConfigured } from "../services/supabaseClient";

const AuthContext = createContext(null);
const SESSION_KEY = "fittrainer_active_session_v1";

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState("guest"); // "admin" | "trainer" | "student" | "guest"
  const [trainers, setTrainers] = useState([]);
  const [students, setStudents] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    initializeStorage();
    let loadedTrainers = getTrainers();
    let loadedStudents = getStudents();
    let loadedRoutines = getRoutines();

    setTrainers(loadedTrainers);
    setStudents(loadedStudents);
    setRoutines(loadedRoutines);

    // Cargar datos remotos en vivo desde Supabase si la base de datos está conectada
    if (isSupabaseConfigured()) {
      try {
        const { data: dbTrainers } = await supabase.from("trainers").select("*");
        const { data: dbStudents } = await supabase.from("students").select("*");
        const { data: dbRoutines } = await supabase.from("routines").select("*");

        if (dbTrainers && dbTrainers.length > 0) {
          const mappedTrainers = dbTrainers.map(t => ({
            id: t.id,
            name: t.name,
            email: t.email,
            username: t.username,
            password: t.password,
            brandName: t.brand_name,
            phone: t.phone,
            gender: t.gender || "male",
            status: t.status || "active"
          }));
          setTrainers(mappedTrainers);
          localStorage.setItem("fittrainer_trainers_v1", JSON.stringify(mappedTrainers));
        }

        if (dbStudents && dbStudents.length > 0) {
          const mappedStudents = dbStudents.map(s => ({
            id: s.id,
            trainerId: s.trainer_id,
            name: s.name,
            username: s.username,
            password: s.password,
            gender: s.gender || "male",
            goal: s.goal,
            planName: s.plan_name,
            planPrice: s.plan_price,
            status: s.status || "active",
            paymentStatus: s.payment_status || "paid",
            nextDueDate: s.next_due_date,
            assignedRoutineId: s.assigned_routine_id,
            questionnaireCompleted: s.questionnaire_completed,
            questionnaireData: s.questionnaire_data
          }));
          setStudents(mappedStudents);
          localStorage.setItem("fittrainer_students_v1", JSON.stringify(mappedStudents));
        }

        if (dbRoutines && dbRoutines.length > 0) {
          const mappedRoutines = dbRoutines.map(r => ({
            id: r.id,
            trainerId: r.trainer_id,
            title: r.title,
            category: r.category,
            durationWeeks: r.duration_weeks,
            description: r.description,
            days: r.days
          }));
          setRoutines(mappedRoutines);
          localStorage.setItem("fittrainer_routines_v1", JSON.stringify(mappedRoutines));
        }
      } catch (err) {
        console.warn("Supabase live fetch fallback:", err);
      }
    }

    return { loadedTrainers, loadedStudents, loadedRoutines };
  };

  useEffect(() => {
    refreshData();

    // Restaurar sesión guardada para que no pida usuario y contraseña cada vez que recargas
    const savedSessionStr = localStorage.getItem(SESSION_KEY);
    if (savedSessionStr) {
      try {
        const savedSession = JSON.parse(savedSessionStr);
        if (savedSession && savedSession.user && savedSession.role) {
          setCurrentUser(savedSession.user);
          setRole(savedSession.role);
        }
      } catch (e) {
        console.warn("Session restore error:", e);
      }
    }

    setLoading(false);
  }, []);

  // Guardar sesión en almacenamiento persistente
  const persistSession = (user, roleType) => {
    setCurrentUser(user);
    setRole(roleType);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, role: roleType }));
  };

  // Login Administrador (Super Admin)
  const loginAdmin = (username, password) => {
    const admin = getMasterAdmin();
    if (
      (username.toLowerCase() === admin.username.toLowerCase() || username.toLowerCase() === admin.email.toLowerCase()) &&
      password === admin.password
    ) {
      persistSession(admin, "admin");
      return { success: true, user: admin };
    }
    return { success: false, error: "Credenciales de Administrador incorrectas." };
  };

  // Login Profesor
  const loginTrainer = (input, password) => {
    const loadedTrainers = trainers.length > 0 ? trainers : getTrainers();
    const trainer = loadedTrainers.find(
      (t) =>
        ((t.email || "").toLowerCase() === input.toLowerCase() || (t.username || "").toLowerCase() === input.toLowerCase()) &&
        t.password === password
    );

    if (trainer) {
      if (trainer.status === "revoked") {
        return { success: false, error: "⛔ Tu acceso de profesor ha sido suspendido por el Administrador." };
      }
      persistSession(trainer, "trainer");
      return { success: true, user: trainer };
    }
    return { success: false, error: "Usuario/Email o contraseña de profesor incorrectos." };
  };

  // Login Alumno
  const loginStudent = (input, password) => {
    const loadedStudents = students.length > 0 ? students : getStudents();
    const student = loadedStudents.find(
      (s) =>
        ((s.username || "").toLowerCase() === input.toLowerCase() || (s.email || "").toLowerCase() === input.toLowerCase()) &&
        s.password === password
    );

    if (student) {
      if (student.status === "revoked") {
        return { success: false, error: "⛔ Tu acceso de alumno ha sido suspendido. Consulta con tu profesor o administrador para restaurarlo." };
      }
      persistSession(student, "student");
      return { success: true, user: student };
    }
    return { success: false, error: "Usuario o contraseña de alumno incorrectos." };
  };

  const logout = () => {
    setCurrentUser(null);
    setRole("guest");
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        trainers,
        students,
        routines,
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
