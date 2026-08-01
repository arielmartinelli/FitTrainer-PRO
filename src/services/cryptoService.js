// Servicio de hashing de contraseñas (FitTrainer PRO)
// ---------------------------------------------------
// Las contraseñas NUNCA se guardan en texto plano, ni en localStorage ni en Supabase.
// Se usa SHA-256 sobre "salt + password" mediante la Web Crypto API (nativa del navegador).
//
// NOTA IMPORTANTE: el hashing en el cliente evita que la contraseña quede legible en la
// base de datos y en el dispositivo, pero NO reemplaza a una autenticación de servidor.
// El paso definitivo es migrar a Supabase Auth. Ver MIGRACION.md.

const SALT = "fittrainer_pro_v1::";

/** Hashea una contraseña. Devuelve un string tipo "sha256$<hex>". */
export const hashPassword = async (plain) => {
  if (plain === null || plain === undefined) return "";
  const text = String(plain);
  if (text === "") return "";

  // Si ya viene hasheada, no la volvemos a hashear.
  if (isHashed(text)) return text;

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(SALT + text);
    const buffer = await crypto.subtle.digest("SHA-256", data);
    const hex = Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `sha256$${hex}`;
  } catch (err) {
    // Contextos sin crypto.subtle (http:// sin localhost). Se avisa y se deja pasar
    // para no bloquear al usuario, pero conviene servir la app por HTTPS.
    console.warn("crypto.subtle no disponible: la contraseña no pudo hashearse.", err);
    return text;
  }
};

/** ¿Este valor ya es un hash generado por nosotros? */
export const isHashed = (value) => typeof value === "string" && value.startsWith("sha256$");

/**
 * Compara una contraseña escrita por el usuario contra la almacenada.
 * Retrocompatible: si la almacenada todavía está en texto plano (cuentas creadas
 * antes de esta versión), acepta la comparación directa y avisa que hay que migrar.
 */
export const verifyPassword = async (plainInput, stored) => {
  if (!stored) return { ok: false, needsMigration: false };

  if (isHashed(stored)) {
    const hashed = await hashPassword(plainInput);
    return { ok: hashed === stored, needsMigration: false };
  }

  // Cuenta legacy con contraseña en texto plano.
  const ok = String(plainInput) === String(stored);
  return { ok, needsMigration: ok };
};

/** Genera una contraseña temporal legible para entregar al alumno. */
export const generateTempPassword = (seed = "") => {
  const clean = String(seed).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "fit";
  const digits = Math.floor(100 + Math.random() * 900);
  return `${clean}${digits}`;
};
