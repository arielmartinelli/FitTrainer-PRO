import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = () =>
  Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes("tu-proyecto") &&
      !supabaseUrl.includes("your-project-ref")
  );

/** Cliente principal: mantiene la sesión del usuario logueado. */
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
  {
    auth: {
      storageKey: "fittrainer-auth",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

/**
 * Cliente secundario de aprovisionamiento.
 *
 * `signUp()` deja logueado al usuario recién creado. Si lo usáramos con el cliente
 * principal, cada vez que un profesor da de alta a un alumno quedaría logueado
 * COMO ese alumno. Este segundo cliente no persiste sesión: crea la cuenta y no
 * toca la sesión de quien la está creando.
 */
export const supabaseProvisioning = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
  {
    auth: {
      storageKey: "fittrainer-provisioning",
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

/**
 * Dominio para las direcciones internas de los alumnos.
 *
 * Los alumnos entran con un usuario ("nicolas.fit"), no con un email, pero Supabase
 * Auth necesita sí o sí un email. Se arma uno determinístico a partir del usuario,
 * así el login no tiene que consultar la base antes de autenticar (algo que RLS
 * justamente impide). El email de contacto real es un campo aparte de la ficha.
 */
export const STUDENT_EMAIL_DOMAIN = import.meta.env.VITE_STUDENT_EMAIL_DOMAIN || "alumnos.fittrainer.app";

export const usernameToAuthEmail = (username) =>
  `${String(username || "").trim().toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;

/** ¿El identificador que escribió el usuario ya es un email? */
export const looksLikeEmail = (value) => /\S+@\S+\.\S+/.test(String(value || "").trim());
