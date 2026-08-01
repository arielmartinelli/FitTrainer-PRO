// Autenticación (FitTrainer PRO)
// ------------------------------
// Dos modos, misma interfaz para el resto de la app:
//
//  · MODO NUBE  (hay VITE_SUPABASE_URL) → Supabase Auth.
//    La identidad la maneja Supabase, `auth.uid()` existe y RLS puede cerrar la base.
//
//  · MODO LOCAL (sin Supabase)         → validación contra localStorage.
//    Sirve para desarrollo o para un profesor que trabaja desde un solo equipo.
//    Los alumnos NO pueden entrar desde su celular en este modo.

import { supabase, supabaseProvisioning, isSupabaseConfigured, usernameToAuthEmail, looksLikeEmail } from "./supabaseClient";
import { verifyPassword, hashPassword } from "./cryptoService";
import { getMasterAdmin, getTrainers, getStudents, saveTrainer, saveStudent } from "./storageService";

export const isCloudMode = () => isSupabaseConfigured();

/* ============================================================
   IDENTIFICADORES
   ============================================================ */

/**
 * Convierte lo que el usuario escribió en el email que espera Supabase Auth.
 * Profesores y admin usan su email real; los alumnos, el sintético del usuario.
 */
export const resolveAuthEmail = (identifier, role) => {
  const value = String(identifier || "").trim();
  if (looksLikeEmail(value)) return value.toLowerCase();
  if (role === "student") return usernameToAuthEmail(value);
  return value.toLowerCase(); // profesor/admin que escribió solo el usuario
};

/* ============================================================
   SESIÓN
   ============================================================ */

/** Devuelve el usuario de Auth activo, o null. */
export const getAuthUser = async () => {
  if (!isCloudMode()) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
};

export const onAuthChange = (callback) => {
  if (!isCloudMode()) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session?.user || null));
  return () => data?.subscription?.unsubscribe();
};

/**
 * Averigua qué es este uid: admin, profesor o alumno.
 * Con RLS activo cada consulta devuelve, como mucho, la fila propia.
 */
export const resolveIdentity = async (userId) => {
  if (!userId) return null;

  const { data: adminRow } = await supabase.from("app_admins").select("id, name").eq("id", userId).maybeSingle();
  if (adminRow) return { role: "admin", profile: { ...adminRow, name: adminRow.name || "Administrador" } };

  const { data: trainerRow } = await supabase.from("trainers").select("*").eq("id", userId).maybeSingle();
  if (trainerRow) return { role: "trainer", profile: trainerRow };

  const { data: studentRow } = await supabase.from("students").select("*").eq("id", userId).maybeSingle();
  if (studentRow) return { role: "student", profile: studentRow };

  return null;
};

/* ============================================================
   LOGIN
   ============================================================ */

const CLOUD_ERRORS = {
  "Invalid login credentials": "Usuario o contraseña incorrectos.",
  "Email not confirmed":
    "La cuenta todavía no fue confirmada. Desactivá 'Confirm email' en Supabase (Authentication → Sign In / Providers) o confirmá el usuario a mano."
};

const translateError = (message) => CLOUD_ERRORS[message] || message || "No se pudo iniciar sesión.";

/** Login en modo nube. Devuelve { success, user, role } o { success: false, error }. */
const cloudLogin = async (identifier, password, expectedRole) => {
  const email = resolveAuthEmail(identifier, expectedRole);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: translateError(error.message) };

  const identity = await resolveIdentity(data.user.id);
  if (!identity) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Tu usuario existe pero no tiene una ficha asociada. Avisale al administrador."
    };
  }

  if (identity.role !== expectedRole) {
    await supabase.auth.signOut();
    const nombre = { admin: "Administrador", trainer: "Profesor", student: "Alumno" }[identity.role];
    return { success: false, error: `Esta cuenta es de ${nombre}. Cambiá la pestaña e intentá de nuevo.` };
  }

  if (identity.profile?.status === "revoked") {
    await supabase.auth.signOut();
    return {
      success: false,
      error:
        expectedRole === "trainer"
          ? "⛔ Tu acceso de profesor fue suspendido por el Administrador."
          : "⛔ Tu acceso fue suspendido. Consultá con tu profesor."
    };
  }

  return { success: true, userId: data.user.id, role: identity.role, profile: identity.profile };
};

/** Login en modo local (sin Supabase), con migración de contraseñas viejas en texto plano. */
const localLogin = async (identifier, password, expectedRole) => {
  const value = String(identifier || "").toLowerCase().trim();

  if (expectedRole === "admin") {
    const admin = getMasterAdmin();
    const matches =
      value === String(admin.username || "").toLowerCase() || value === String(admin.email || "").toLowerCase();
    if (!matches) return { success: false, error: "Credenciales de Administrador incorrectas." };

    const { ok } = await verifyPassword(password, admin.password);
    if (!ok) return { success: false, error: "Credenciales de Administrador incorrectas." };
    return { success: true, role: "admin", profile: admin };
  }

  const list = expectedRole === "trainer" ? getTrainers() : getStudents();
  const found = list.find(
    (u) => (u.username || "").toLowerCase() === value || (u.email || "").toLowerCase() === value
  );

  const genericError =
    expectedRole === "trainer"
      ? "Usuario/Email o contraseña de profesor incorrectos."
      : "Usuario o contraseña de alumno incorrectos.";

  if (!found) return { success: false, error: genericError };

  const { ok, needsMigration } = await verifyPassword(password, found.password);
  if (!ok) return { success: false, error: genericError };

  if (found.status === "revoked") {
    return {
      success: false,
      error:
        expectedRole === "trainer"
          ? "⛔ Tu acceso de profesor fue suspendido por el Administrador."
          : "⛔ Tu acceso fue suspendido. Consultá con tu profesor."
    };
  }

  let profile = found;
  if (needsMigration) {
    const hashed = await hashPassword(password);
    if (expectedRole === "trainer") {
      await saveTrainer({ ...found, password: hashed });
      profile = getTrainers().find((t) => t.id === found.id) || found;
    } else {
      await saveStudent({ ...found, password: hashed });
      profile = getStudents().find((s) => s.id === found.id) || found;
    }
  }

  return { success: true, role: expectedRole, profile };
};

export const login = (identifier, password, expectedRole) =>
  isCloudMode() ? cloudLogin(identifier, password, expectedRole) : localLogin(identifier, password, expectedRole);

export const logout = async () => {
  if (isCloudMode()) await supabase.auth.signOut();
};

/* ============================================================
   ALTA DE USUARIOS
   ============================================================ */

/**
 * Crea la cuenta de Auth y devuelve su uid, que después se usa como id de la fila.
 * Se hace con el cliente de aprovisionamiento para no pisar la sesión de quien la crea.
 */
export const createAuthUser = async ({ email, password, metadata = {} }) => {
  if (!isCloudMode()) return { userId: null };

  const { data, error } = await supabaseProvisioning.auth.signUp({
    email,
    password,
    options: { data: metadata }
  });

  const yaExiste = `Ya existe una cuenta con ${email}. Usá otro email, o borrá el usuario viejo en Supabase → Authentication → Users.`;

  if (error) {
    if (/already registered|already exists/i.test(error.message)) throw new Error(yaExiste);
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error(
      "Supabase no devolvió el usuario. Revisá que 'Confirm email' esté desactivado en Authentication → Sign In / Providers."
    );
  }

  // Cuando la confirmación por email está activada, Supabase NO informa que el email
  // ya existe (para no filtrar qué cuentas hay): devuelve un usuario ficticio con
  // `identities` vacío. Hay que detectarlo a mano, si no se crearía una ficha
  // apuntando a un uid que no es el real.
  if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error(yaExiste);
  }

  // Descarta cualquier sesión que haya quedado en el cliente secundario.
  await supabaseProvisioning.auth.signOut();

  return { userId: data.user.id };
};

/** Crea la cuenta de Auth de un profesor (usa su email real). */
export const createTrainerAccount = ({ email, password, name }) =>
  createAuthUser({ email: String(email).trim().toLowerCase(), password, metadata: { name, role: "trainer" } });

/** Crea la cuenta de Auth de un alumno (email sintético a partir del usuario). */
export const createStudentAccount = ({ username, password, name }) =>
  createAuthUser({ email: usernameToAuthEmail(username), password, metadata: { name, role: "student" } });

/* ============================================================
   ALTA COMPLETA (cuenta de Auth + ficha)
   ============================================================
   El id de la fila TIENE que ser el uid de Auth: las políticas de RLS comparan
   `id = auth.uid()` y `trainer_id = auth.uid()`. Si no coinciden, el usuario
   entra pero no ve nada. */

/** Da de alta un profesor: crea su cuenta y después su ficha. */
export const provisionTrainer = async (form) => {
  let id = form.id;

  if (!id) {
    if (isCloudMode()) {
      const { userId } = await createTrainerAccount({
        email: form.email,
        password: form.password,
        name: form.name
      });
      id = userId;
    } else {
      id = `trainer_${Date.now()}`;
    }
  }

  await saveTrainer({ ...form, id });
  return id;
};

/** Da de alta un alumno: crea su cuenta y después su ficha. */
export const provisionStudent = async (form) => {
  let id = form.id;

  if (!id) {
    if (isCloudMode()) {
      const { userId } = await createStudentAccount({
        username: form.username,
        password: form.password,
        name: form.name
      });
      id = userId;
    } else {
      id = `student_${Date.now()}`;
    }
  }

  await saveStudent({ ...form, id });
  return id;
};

/* ============================================================
   CONTRASEÑAS
   ============================================================ */

/** Cambia la contraseña del usuario que está logueado ahora mismo. */
export const changeOwnPassword = async (newPassword) => {
  if (!isCloudMode()) return { ok: true };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
  return { ok: true };
};

/** Envía el mail de recuperación. Solo sirve para casillas reales (profesores y admin). */
export const sendPasswordReset = async (email) => {
  if (!isCloudMode()) throw new Error("La recuperación por email necesita Supabase configurado.");
  const { error } = await supabase.auth.resetPasswordForEmail(String(email).trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/`
  });
  if (error) throw new Error(error.message);
  return { ok: true };
};

/**
 * Reseteo de la contraseña de OTRA persona (el profesor a su alumno).
 *
 * Supabase no permite esto desde el navegador: cambiar la clave de un tercero
 * requiere la service key, que jamás debe viajar al cliente. Se resuelve con una
 * Edge Function que sí la tiene. Ver supabase/functions/admin-reset-password/.
 *
 * Si la función no está desplegada, se avisa con un mensaje claro en vez de fallar raro.
 */
export const resetOtherUserPassword = async ({ userId, newPassword }) => {
  if (!isCloudMode()) return { ok: true, mode: "local" };

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Tu sesión expiró. Volvé a iniciar sesión.");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, newPassword })
    });
  } catch {
    throw new Error(
      "No se pudo contactar la función de reseteo. Desplegá 'admin-reset-password' (ver SUPABASE_AUTH.md, paso 7)."
    );
  }

  if (response.status === 404) {
    throw new Error(
      "La función 'admin-reset-password' no está desplegada en tu proyecto. Ver SUPABASE_AUTH.md, paso 7."
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "No se pudo cambiar la contraseña.");

  return { ok: true, mode: "cloud" };
};
