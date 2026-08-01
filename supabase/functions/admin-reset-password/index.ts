// Edge Function: admin-reset-password
// ------------------------------------
// Cambia la contraseña de OTRA persona (el profesor a su alumno, el admin a un profesor).
//
// Por qué hace falta: cambiar la clave de un tercero requiere la `service_role key`,
// que tiene permisos totales sobre el proyecto. Esa llave NUNCA puede viajar al
// navegador. Acá vive del lado del servidor, donde nadie la ve.
//
// Reglas que aplica:
//   · Un profesor solo puede resetear la contraseña de SUS alumnos.
//   · Un admin puede resetear la de cualquiera.
//   · Nadie más puede llamar a esto.
//
// Desplegar con:  supabase functions deploy admin-reset-password

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" }
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  // 1. ¿Quién está llamando?
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Falta el token de sesión." }, 401);

  const asCaller = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData?.user) return json({ error: "Sesión inválida." }, 401);

  const callerId = userData.user.id;

  // 2. Qué pide hacer
  let payload: { userId?: string; newPassword?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Cuerpo de la petición inválido." }, 400);
  }

  const { userId, newPassword } = payload;
  if (!userId || !newPassword) return json({ error: "Faltan userId o newPassword." }, 400);
  if (newPassword.length < 6) return json({ error: "La contraseña debe tener al menos 6 caracteres." }, 400);

  // 3. ¿Tiene permiso?
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: isAdminRow } = await admin.from("app_admins").select("id").eq("id", callerId).maybeSingle();
  let allowed = Boolean(isAdminRow);

  if (!allowed) {
    // Un profesor solo puede tocar a sus propios alumnos.
    const { data: student } = await admin
      .from("students")
      .select("id")
      .eq("id", userId)
      .eq("trainer_id", callerId)
      .maybeSingle();
    allowed = Boolean(student);
  }

  if (!allowed) return json({ error: "No tenés permiso para cambiar esa contraseña." }, 403);

  // 4. Hacerlo
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return json({ error: error.message }, 400);

  return json({ ok: true });
});
