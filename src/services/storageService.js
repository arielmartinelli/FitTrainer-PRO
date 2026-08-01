import { initialTrainers, initialRoutines, initialStudents, initialMasterAdmin } from "./mockData";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { hashPassword } from "./cryptoService";
import { toISODate, addOneMonth } from "./billingService";

const KEYS = {
  MASTER: "fittrainer_master_admin_v1",
  TRAINERS: "fittrainer_trainers_v1",
  ROUTINES: "fittrainer_routines_v1",
  STUDENTS: "fittrainer_students_v1"
};

export const SESSION_KEY = "fittrainer_active_session_v1";

const now = () => new Date().toISOString();

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`Dato corrupto en ${key}, se reinicia.`, err);
    return fallback;
  }
};

const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export const initializeStorage = () => {
  if (!localStorage.getItem(KEYS.MASTER)) writeJSON(KEYS.MASTER, initialMasterAdmin);
  if (!localStorage.getItem(KEYS.TRAINERS)) writeJSON(KEYS.TRAINERS, initialTrainers);
  if (!localStorage.getItem(KEYS.ROUTINES)) writeJSON(KEYS.ROUTINES, initialRoutines);
  if (!localStorage.getItem(KEYS.STUDENTS)) writeJSON(KEYS.STUDENTS, initialStudents);
};

/* ============================================================
   ADMINISTRADOR
   ============================================================ */

export const getMasterAdmin = () => {
  initializeStorage();
  return readJSON(KEYS.MASTER, initialMasterAdmin);
};

/** Permite al admin cambiar su propia contraseña (antes estaba hardcodeada). */
export const updateMasterAdminPassword = async (newPlainPassword) => {
  const admin = getMasterAdmin();
  const updated = { ...admin, password: await hashPassword(newPlainPassword), updatedAt: now() };
  writeJSON(KEYS.MASTER, updated);
  return updated;
};

/* ============================================================
   PROFESORES
   ============================================================ */

export const getTrainers = () => {
  initializeStorage();
  return readJSON(KEYS.TRAINERS, []);
};

/** Verifica que el usuario/email no esté tomado por otra cuenta. */
export const isTrainerIdentifierTaken = (identifier, exceptId = null) => {
  const value = String(identifier || "").toLowerCase().trim();
  if (!value) return false;
  return getTrainers().some(
    (t) => t.id !== exceptId && ((t.username || "").toLowerCase() === value || (t.email || "").toLowerCase() === value)
  );
};

// En modo nube la contraseña NO viaja a la base: la administra Supabase Auth.
const trainerToRow = (t) => ({
  id: t.id,
  name: t.name,
  email: t.email,
  username: t.username,
  brand_name: t.brandName || "",
  phone: t.phone || "",
  gender: t.gender || "male",
  status: t.status || "active",
  specialty: t.specialty || "",
  alias: t.alias || "",
  cbu: t.cbu || "",
  updated_at: t.updatedAt || now()
});

const pushTrainer = async (trainer) => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from("trainers").upsert([trainerToRow(trainer)]);
  if (error) console.error("Supabase trainer sync error:", error);
};

export const saveTrainer = async (trainer) => {
  const trainers = getTrainers();
  const index = trainers.findIndex((t) => t.id === trainer.id);
  const existing = index >= 0 ? trainers[index] : null;

  // Solo re-hashea si la contraseña cambió respecto de la guardada.
  // En modo nube no se guarda ninguna contraseña: la valida Supabase Auth.
  const passwordChanged = !existing || trainer.password !== existing.password;
  const password = isSupabaseConfigured()
    ? null
    : passwordChanged
      ? await hashPassword(trainer.password)
      : existing.password;

  const trainerData = {
    ...existing,
    ...trainer,
    password,
    id: trainer.id || `trainer_${Date.now()}`,
    gender: trainer.gender || existing?.gender || "male",
    status: trainer.status || existing?.status || "active",
    updatedAt: now()
  };

  if (index >= 0) trainers[index] = trainerData;
  else trainers.push(trainerData);

  writeJSON(KEYS.TRAINERS, trainers);
  await pushTrainer(trainerData);
  return trainers;
};

export const deleteTrainer = async (trainerId) => {
  const updated = getTrainers().filter((t) => t.id !== trainerId);
  writeJSON(KEYS.TRAINERS, updated);
  if (isSupabaseConfigured()) await supabase.from("trainers").delete().eq("id", trainerId);
  return updated;
};

export const toggleTrainerAccess = async (trainerId) => {
  let changed = null;
  const updated = getTrainers().map((t) => {
    if (t.id !== trainerId) return t;
    changed = { ...t, status: t.status === "revoked" ? "active" : "revoked", updatedAt: now() };
    return changed;
  });
  writeJSON(KEYS.TRAINERS, updated);
  if (changed) await pushTrainer(changed); // antes esto no se sincronizaba nunca
  return updated;
};

/* ============================================================
   RUTINAS
   ============================================================ */

export const getRoutines = (trainerId = null) => {
  initializeStorage();
  const routines = readJSON(KEYS.ROUTINES, []);
  return trainerId ? routines.filter((r) => r.trainerId === trainerId) : routines;
};

const routineToRow = (r) => ({
  id: r.id,
  trainer_id: r.trainerId,
  title: r.title,
  category: r.category,
  duration_weeks: r.durationWeeks,
  description: r.description,
  days: r.days,
  // 'structured' = días y ejercicios en la app · 'file' = foto/PDF/planilla subida
  kind: r.kind || "structured",
  file_path: r.filePath || null,
  file_name: r.fileName || null,
  file_type: r.fileType || null,
  file_size: r.fileSize || null,
  updated_at: r.updatedAt || now()
});

export const saveRoutine = async (routine) => {
  const routines = getRoutines();
  const index = routines.findIndex((r) => r.id === routine.id);

  const formatted = {
    ...(index >= 0 ? routines[index] : {}),
    ...routine,
    id: routine.id || `routine_${Date.now()}`,
    durationWeeks: Number(routine.durationWeeks || 6),
    kind: routine.kind || "structured",
    days: routine.days || [],
    updatedAt: now()
  };

  if (index >= 0) routines[index] = formatted;
  else routines.push(formatted);

  writeJSON(KEYS.ROUTINES, routines);

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("routines").upsert([routineToRow(formatted)]);
    if (error) console.error("Supabase routine sync error:", error);
  }
  return routines;
};

/** Copia una rutina existente para adaptarla a otro alumno sin rehacerla. */
export const duplicateRoutine = async (routine) => {
  const copy = JSON.parse(JSON.stringify(routine));
  copy.id = `routine_${Date.now()}`;
  copy.title = `${routine.title} (copia)`;
  delete copy.updatedAt;
  return saveRoutine(copy);
};

export const deleteRoutine = async (routineId) => {
  const updated = getRoutines().filter((r) => r.id !== routineId);
  writeJSON(KEYS.ROUTINES, updated);
  if (isSupabaseConfigured()) await supabase.from("routines").delete().eq("id", routineId);
  return updated;
};

/* ============================================================
   ALUMNOS
   ============================================================ */

export const getStudents = (trainerId = null) => {
  initializeStorage();
  const students = readJSON(KEYS.STUDENTS, []);
  return trainerId ? students.filter((s) => s.trainerId === trainerId) : students;
};

/** Evita dos alumnos con el mismo usuario (antes el login tomaba el primero que encontrara). */
export const isStudentUsernameTaken = (username, exceptId = null) => {
  const value = String(username || "").toLowerCase().trim();
  if (!value) return false;
  return getStudents().some((s) => s.id !== exceptId && (s.username || "").toLowerCase() === value);
};

const studentToRow = (s) => ({
  id: s.id,
  trainer_id: s.trainerId,
  name: s.name,
  username: s.username,
  email: s.email || "",
  phone: s.phone || "",
  gender: s.gender || "male",
  goal: s.goal,
  join_date: s.joinDate || null,
  plan_name: s.planName,
  plan_price: s.planPrice,
  status: s.status || "active",
  next_due_date: s.nextDueDate,
  assigned_routine_id: s.assignedRoutineId || null,
  questionnaire_completed: !!s.questionnaireCompleted,
  questionnaire_data: s.questionnaireData || null,
  payments: s.payments || [],
  completed_workouts: s.completedWorkouts || [],
  body_weight_log: s.bodyWeightLog || [],
  updated_at: s.updatedAt || now()
});

const pushStudent = async (student) => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from("students").upsert([studentToRow(student)]);
  if (error) console.error("Supabase student sync error:", error);
};

/** Mantiene sincronizada la sesión activa cuando el alumno logueado es el que cambió. */
const syncActiveSession = (updatedUser) => {
  if (!updatedUser) return;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return;
  try {
    const session = JSON.parse(raw);
    if (session?.user?.id === updatedUser.id) {
      writeJSON(SESSION_KEY, { ...session, user: updatedUser });
    }
  } catch {
    /* sesión corrupta: se ignora */
  }
};

export const saveStudent = async (student) => {
  const students = getStudents();
  const index = students.findIndex((s) => s.id === student.id);
  const existing = index >= 0 ? students[index] : null;

  const passwordChanged = !existing || student.password !== existing.password;
  const password = isSupabaseConfigured()
    ? null
    : passwordChanged
      ? await hashPassword(student.password)
      : existing.password;

  const studentData = {
    ...existing,
    ...student,
    password,
    id: student.id || `student_${Date.now()}`,
    status: student.status || existing?.status || "active",
    gender: student.gender || existing?.gender || "male",
    joinDate: student.joinDate || existing?.joinDate || toISODate(new Date()),
    // Antes esto era la fecha fija "2026-08-15" para todos.
    nextDueDate: student.nextDueDate || existing?.nextDueDate || toISODate(addOneMonth(new Date())),
    questionnaireCompleted: student.questionnaireCompleted ?? existing?.questionnaireCompleted ?? false,
    questionnaireData: student.questionnaireData ?? existing?.questionnaireData ?? null,
    payments: student.payments || existing?.payments || [],
    completedWorkouts: student.completedWorkouts || existing?.completedWorkouts || [],
    bodyWeightLog: student.bodyWeightLog || existing?.bodyWeightLog || [],
    updatedAt: now()
  };

  if (index >= 0) students[index] = studentData;
  else students.push(studentData);

  writeJSON(KEYS.STUDENTS, students);
  syncActiveSession(studentData);
  await pushStudent(studentData);
  return students;
};

export const deleteStudent = async (studentId) => {
  const updated = getStudents().filter((s) => s.id !== studentId);
  writeJSON(KEYS.STUDENTS, updated);
  if (isSupabaseConfigured()) await supabase.from("students").delete().eq("id", studentId);
  return updated;
};

export const toggleStudentAccess = async (studentId) => {
  let changed = null;
  const updated = getStudents().map((s) => {
    if (s.id !== studentId) return s;
    changed = { ...s, status: s.status === "revoked" ? "active" : "revoked", updatedAt: now() };
    return changed;
  });
  writeJSON(KEYS.STUDENTS, updated);
  if (changed) {
    syncActiveSession(changed);
    await pushStudent(changed); // antes la suspensión no salía nunca del dispositivo
  }
  return updated;
};

/* ============================================================
   CUESTIONARIO
   ============================================================ */

export const saveStudentQuestionnaire = async (studentId, questionnaireData) => {
  const students = getStudents();
  let updatedStudent = null;

  const updated = students.map((s) => {
    if (s.id !== studentId) return s;
    updatedStudent = {
      ...s,
      name: questionnaireData.fullName || s.name,
      gender: questionnaireData.gender || s.gender || "male",
      questionnaireCompleted: true,
      questionnaireData,
      // El peso declarado abre el historial corporal.
      bodyWeightLog: questionnaireData.weightKg
        ? [{ date: toISODate(new Date()), weightKg: Number(questionnaireData.weightKg) }, ...(s.bodyWeightLog || [])]
        : s.bodyWeightLog || [],
      updatedAt: now()
    };
    return updatedStudent;
  });

  writeJSON(KEYS.STUDENTS, updated);
  syncActiveSession(updatedStudent);
  await pushStudent(updatedStudent);
  return updated;
};

export const reopenStudentQuestionnaire = async (studentId) => {
  const students = getStudents();
  let updatedStudent = null;

  const updated = students.map((s) => {
    if (s.id !== studentId) return s;
    updatedStudent = { ...s, questionnaireCompleted: false, updatedAt: now() };
    return updatedStudent;
  });

  writeJSON(KEYS.STUDENTS, updated);
  syncActiveSession(updatedStudent);
  await pushStudent(updatedStudent);
  return updated;
};

/* ============================================================
   PAGOS
   ============================================================ */

export const recordStudentPayment = async (studentId, paymentData) => {
  const students = getStudents();
  let updatedStudent = null;

  const updated = students.map((s) => {
    if (s.id !== studentId) return s;

    const newPayment = {
      id: `pay_${Date.now()}`,
      date: paymentData.date || toISODate(new Date()),
      amount: Number(paymentData.amount) || 0,
      method: paymentData.method || "Transferencia Bancaria",
      notes: paymentData.notes || "",
      status: "Aprobado"
    };

    // El vencimiento se corre un mes desde la fecha del pago, no desde hoy.
    const nextDue = toISODate(addOneMonth(newPayment.date));

    updatedStudent = {
      ...s,
      nextDueDate: nextDue,
      payments: [newPayment, ...(s.payments || [])],
      updatedAt: now()
    };
    return updatedStudent;
  });

  writeJSON(KEYS.STUDENTS, updated);
  syncActiveSession(updatedStudent);
  await pushStudent(updatedStudent); // antes los pagos jamás salían de localStorage
  return updated;
};

export const deleteStudentPayment = async (studentId, paymentId) => {
  const students = getStudents();
  let updatedStudent = null;

  const updated = students.map((s) => {
    if (s.id !== studentId) return s;
    updatedStudent = { ...s, payments: (s.payments || []).filter((p) => p.id !== paymentId), updatedAt: now() };
    return updatedStudent;
  });

  writeJSON(KEYS.STUDENTS, updated);
  syncActiveSession(updatedStudent);
  await pushStudent(updatedStudent);
  return updated;
};

/* ============================================================
   ENTRENAMIENTOS
   ============================================================ */

export const logCompletedWorkout = async (studentId, workoutData) => {
  const students = getStudents();
  let updatedStudent = null;

  const updated = students.map((s) => {
    if (s.id !== studentId) return s;
    const newWorkout = {
      id: `w_${Date.now()}`,
      date: toISODate(new Date()),
      ...workoutData
    };
    updatedStudent = {
      ...s,
      completedWorkouts: [newWorkout, ...(s.completedWorkouts || [])],
      updatedAt: now()
    };
    return updatedStudent;
  });

  writeJSON(KEYS.STUDENTS, updated);
  syncActiveSession(updatedStudent);
  await pushStudent(updatedStudent); // antes se perdía al refrescar desde Supabase
  return updated;
};

/** Registro de peso corporal del alumno a lo largo del tiempo. */
export const logBodyWeight = async (studentId, weightKg, dateStr = null) => {
  const students = getStudents();
  let updatedStudent = null;
  const date = dateStr || toISODate(new Date());

  const updated = students.map((s) => {
    if (s.id !== studentId) return s;
    const log = (s.bodyWeightLog || []).filter((entry) => entry.date !== date);
    updatedStudent = {
      ...s,
      bodyWeightLog: [{ date, weightKg: Number(weightKg) }, ...log].sort((a, b) => (a.date < b.date ? 1 : -1)),
      updatedAt: now()
    };
    return updatedStudent;
  });

  writeJSON(KEYS.STUDENTS, updated);
  syncActiveSession(updatedStudent);
  await pushStudent(updatedStudent);
  return updated;
};

/* ============================================================
   PERSISTENCIA LOCAL Y MERGE REMOTO
   ============================================================ */

export const persistTrainers = (trainers) => writeJSON(KEYS.TRAINERS, trainers);
export const persistStudents = (students) => writeJSON(KEYS.STUDENTS, students);
export const persistRoutines = (routines) => writeJSON(KEYS.ROUTINES, routines);

/**
 * Combina los registros locales con los remotos en vez de pisarlos.
 * Gana el que tenga `updatedAt` más reciente; los registros que existen solo de un lado
 * se conservan. Esto es lo que evitaba que se perdieran entrenamientos y pagos.
 */
export const mergeRecords = (localList = [], remoteList = []) => {
  const byId = new Map();

  localList.forEach((item) => byId.set(item.id, item));

  remoteList.forEach((remote) => {
    const local = byId.get(remote.id);
    if (!local) {
      byId.set(remote.id, remote);
      return;
    }
    const localTime = Date.parse(local.updatedAt || 0) || 0;
    const remoteTime = Date.parse(remote.updatedAt || 0) || 0;
    byId.set(remote.id, remoteTime > localTime ? { ...local, ...remote } : local);
  });

  return Array.from(byId.values());
};
