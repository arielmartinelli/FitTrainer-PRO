import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  getTrainers,
  getStudents,
  getRoutines,
  initializeStorage,
  persistTrainers,
  persistStudents,
  persistRoutines,
  mergeRecords,
  SESSION_KEY
} from "../services/storageService";
import { login as authLogin, logout as authLogout, getAuthUser, onAuthChange, resolveIdentity, isCloudMode } from "../services/authService";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext(null);

/* ============================================================
   MAPEO DE FILAS
   ============================================================ */

const mapTrainerRow = (t) => ({
  id: t.id,
  name: t.name,
  email: t.email,
  username: t.username,
  brandName: t.brand_name,
  phone: t.phone,
  specialty: t.specialty || "",
  alias: t.alias || "",
  cbu: t.cbu || "",
  gender: t.gender || "male",
  status: t.status || "active",
  updatedAt: t.updated_at
});

const mapStudentRow = (s) => ({
  id: s.id,
  trainerId: s.trainer_id,
  name: s.name,
  username: s.username,
  email: s.email || "",
  phone: s.phone || "",
  gender: s.gender || "male",
  goal: s.goal,
  joinDate: s.join_date,
  planName: s.plan_name,
  planPrice: s.plan_price,
  status: s.status || "active",
  nextDueDate: s.next_due_date,
  assignedRoutineId: s.assigned_routine_id,
  questionnaireCompleted: s.questionnaire_completed,
  questionnaireData: s.questionnaire_data,
  payments: s.payments || [],
  completedWorkouts: s.completed_workouts || [],
  bodyWeightLog: s.body_weight_log || [],
  updatedAt: s.updated_at
});

const mapRoutineRow = (r) => ({
  id: r.id,
  trainerId: r.trainer_id,
  title: r.title,
  category: r.category,
  durationWeeks: r.duration_weeks,
  description: r.description,
  days: r.days,
  updatedAt: r.updated_at
});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState("guest");
  const [trainers, setTrainers] = useState([]);
  const [students, setStudents] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sessionNotice, setSessionNotice] = useState("");

  const trainersRef = useRef([]);
  const studentsRef = useRef([]);

  const applyTrainers = useCallback((list) => {
    trainersRef.current = list;
    setTrainers(list);
  }, []);

  const applyStudents = useCallback((list) => {
    studentsRef.current = list;
    setStudents(list);
  }, []);

  /**
   * Trae los datos.
   *
   * En modo nube, RLS decide qué puede ver cada uno: el profesor recibe solo sus
   * alumnos y sus rutinas, el alumno solo su propia ficha. No hace falta filtrar
   * nada acá — si la consulta trae de más, es que una política quedó mal.
   */
  const refreshData = useCallback(async () => {
    initializeStorage();

    const localTrainers = getTrainers();
    const localStudents = getStudents();
    const localRoutines = getRoutines();

    applyTrainers(localTrainers);
    applyStudents(localStudents);
    setRoutines(localRoutines);

    if (!isCloudMode()) {
      return { trainers: localTrainers, students: localStudents, routines: localRoutines };
    }

    // Sin sesión de Auth no hay nada que traer: RLS lo bloquearía igual.
    const authUser = await getAuthUser();
    if (!authUser) return { trainers: [], students: [], routines: [] };

    setSyncing(true);
    try {
      const [trainerRes, studentRes, routineRes] = await Promise.all([
        supabase.from("trainers").select("*"),
        supabase.from("students").select("*"),
        supabase.from("routines").select("*")
      ]);

      const firstError = trainerRes.error || studentRes.error || routineRes.error;
      if (firstError) console.warn("Supabase:", firstError.message);

      const mergedTrainers = mergeRecords(localTrainers, (trainerRes.data || []).map(mapTrainerRow));
      const mergedStudents = mergeRecords(localStudents, (studentRes.data || []).map(mapStudentRow));
      const mergedRoutines = mergeRecords(localRoutines, (routineRes.data || []).map(mapRoutineRow));

      persistTrainers(mergedTrainers);
      persistStudents(mergedStudents);
      persistRoutines(mergedRoutines);

      applyTrainers(mergedTrainers);
      applyStudents(mergedStudents);
      setRoutines(mergedRoutines);

      return { trainers: mergedTrainers, students: mergedStudents, routines: mergedRoutines };
    } catch (err) {
      console.warn("No se pudo sincronizar, se trabaja con datos locales:", err);
      return { trainers: localTrainers, students: localStudents, routines: localRoutines };
    } finally {
      setSyncing(false);
    }
  }, [applyStudents, applyTrainers]);

  const persistSession = useCallback((user, roleType) => {
    setCurrentUser(user);
    setRole(roleType);
    // En modo nube la sesión real la guarda Supabase; esto es solo la caché del perfil
    // para poder pintar la pantalla sin esperar a la red.
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, role: roleType }));
  }, []);

  const logout = useCallback(
    async (notice = "") => {
      setCurrentUser(null);
      setRole("guest");
      setSessionNotice(notice);
      localStorage.removeItem(SESSION_KEY);
      await authLogout();
    },
    []
  );

  /* ---------- Arranque ---------- */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Perfil cacheado: evita el parpadeo mientras se valida la sesión real.
      const cached = localStorage.getItem(SESSION_KEY);
      if (cached) {
        try {
          const session = JSON.parse(cached);
          if (session?.user && session?.role) {
            setCurrentUser(session.user);
            setRole(session.role);
          }
        } catch {
          localStorage.removeItem(SESSION_KEY);
        }
      }

      if (isCloudMode()) {
        const authUser = await getAuthUser();

        if (!authUser) {
          // La caché quedó huérfana (sesión vencida o cerrada en otro dispositivo).
          setCurrentUser(null);
          setRole("guest");
          localStorage.removeItem(SESSION_KEY);
        } else {
          const identity = await resolveIdentity(authUser.id);
          if (identity) {
            const profile =
              identity.role === "trainer"
                ? mapTrainerRow(identity.profile)
                : identity.role === "student"
                  ? mapStudentRow(identity.profile)
                  : identity.profile;
            if (!cancelled) persistSession(profile, identity.role);
          }
        }
      }

      await refreshData();
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshData, persistSession]);

  /* ---------- Sesión cerrada desde otra pestaña o token vencido ---------- */

  useEffect(() => {
    if (!isCloudMode()) return;
    return onAuthChange((authUser) => {
      if (!authUser) {
        setCurrentUser(null);
        setRole("guest");
        localStorage.removeItem(SESSION_KEY);
      }
    });
  }, []);

  /* ---------- Revalidación del perfil ---------- */
  // Si le cambian el plan, la rutina o le revocan el acceso, se refleja
  // sin necesidad de cerrar sesión.

  useEffect(() => {
    if (loading || !currentUser || role === "admin" || role === "guest") return;

    const source = role === "trainer" ? trainers : students;
    const fresh = source.find((u) => u.id === currentUser.id);
    if (!fresh) return;

    if (fresh.status === "revoked") {
      logout(
        role === "trainer"
          ? "⛔ Tu acceso de profesor fue suspendido por el Administrador."
          : "⛔ Tu acceso fue suspendido. Consultá con tu profesor."
      );
      return;
    }

    if ((fresh.updatedAt || "") !== (currentUser.updatedAt || "")) {
      persistSession(fresh, role);
    }
  }, [trainers, students, currentUser, role, loading, logout, persistSession]);

  /* ---------- Login ---------- */

  const doLogin = useCallback(
    async (identifier, password, expectedRole) => {
      const result = await authLogin(identifier, password, expectedRole);
      if (!result.success) return result;

      const profile =
        isCloudMode() && expectedRole === "trainer"
          ? mapTrainerRow(result.profile)
          : isCloudMode() && expectedRole === "student"
            ? mapStudentRow(result.profile)
            : result.profile;

      persistSession(profile, result.role);
      await refreshData();

      return { success: true, user: profile };
    },
    [persistSession, refreshData]
  );

  const loginAdmin = useCallback((id, pass) => doLogin(id, pass, "admin"), [doLogin]);
  const loginTrainer = useCallback((id, pass) => doLogin(id, pass, "trainer"), [doLogin]);
  const loginStudent = useCallback((id, pass) => doLogin(id, pass, "student"), [doLogin]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        trainers,
        students,
        routines,
        loading,
        syncing,
        cloudMode: isCloudMode(),
        sessionNotice,
        clearSessionNotice: () => setSessionNotice(""),
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
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};
