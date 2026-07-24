// Servicio de Sincronización Remota Limpio para FitTrainer PRO
// Elimina llamadas a apis externas de prueba y sincroniza directamente con la base de datos de Supabase.

import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const fetchCloudData = async () => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: dbTrainers } = await supabase.from("trainers").select("*");
    const { data: dbStudents } = await supabase.from("students").select("*");
    const { data: dbRoutines } = await supabase.from("routines").select("*");

    return {
      trainers: dbTrainers || [],
      students: dbStudents || [],
      routines: dbRoutines || []
    };
  } catch (err) {
    console.warn("Supabase fetch warning:", err);
    return null;
  }
};

export const pushCloudData = async (data) => {
  // Manejado directamente por las operaciones de Supabase upsert en storageService.js
  return true;
};
