// Rutinas subidas como archivo (FitTrainer PRO)
// ----------------------------------------------
// Permite que el profesor cargue su rutina como foto, PDF o planilla en vez de
// armarla ejercicio por ejercicio.
//
// Los archivos viven en el bucket privado `rutinas`, con la ruta:
//     {trainer_id}/{routine_id}/{nombre}
// Esa estructura es la que usan las políticas de seguridad para decidir quién
// puede verlos (ver supabase_storage.sql).

import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const BUCKET = "rutinas";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const TIPOS_ACEPTADOS = {
  "image/jpeg": "imagen",
  "image/png": "imagen",
  "image/webp": "imagen",
  "image/heic": "imagen",
  "application/pdf": "pdf",
  "application/vnd.ms-excel": "excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "excel",
  "text/csv": "excel"
};

export const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,.heic,.pdf,.xls,.xlsx,.csv";

/** Categoría simple del archivo: "imagen" | "pdf" | "excel" | "otro". */
export const categoriaDeArchivo = (mimeType, fileName = "") => {
  if (TIPOS_ACEPTADOS[mimeType]) return TIPOS_ACEPTADOS[mimeType];
  // Algunos celulares no informan bien el mime type: se cae a la extensión.
  const ext = String(fileName).toLowerCase().split(".").pop();
  if (["jpg", "jpeg", "png", "webp", "heic"].includes(ext)) return "imagen";
  if (ext === "pdf") return "pdf";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  return "otro";
};

export const formatearTamano = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Valida el archivo antes de subirlo. Devuelve un mensaje de error, o null. */
export const validarArchivo = (file) => {
  if (!file) return "No se seleccionó ningún archivo.";
  if (file.size > MAX_FILE_SIZE) {
    return `El archivo pesa ${formatearTamano(file.size)}. El máximo es 10 MB. Si es una foto, sacale una con menos resolución o comprimila.`;
  }
  if (categoriaDeArchivo(file.type, file.name) === "otro") {
    return "Formato no admitido. Se aceptan imágenes (JPG, PNG, WEBP), PDF y planillas (XLS, XLSX, CSV).";
  }
  return null;
};

/** Limpia el nombre para que sea seguro como parte de una ruta de storage. */
const nombreSeguro = (fileName) =>
  String(fileName)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-80);

/**
 * Sube el archivo de una rutina y devuelve los datos para guardar en la fila.
 * `upsert: true` permite reemplazar el archivo de una rutina existente.
 */
export const subirArchivoDeRutina = async ({ file, trainerId, routineId }) => {
  if (!isSupabaseConfigured()) {
    throw new Error("Para subir archivos hace falta tener Supabase configurado.");
  }

  const error = validarArchivo(file);
  if (error) throw new Error(error);

  const path = `${trainerId}/${routineId}/${Date.now()}_${nombreSeguro(file.name)}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
    cacheControl: "3600"
  });

  if (uploadError) {
    if (/exceeded the maximum allowed size|Payload too large/i.test(uploadError.message)) {
      throw new Error("El archivo supera el límite de 10 MB.");
    }
    if (/Bucket not found/i.test(uploadError.message)) {
      throw new Error(
        "Falta crear el espacio de archivos en Supabase. Corré 'supabase_storage.sql' en el SQL Editor."
      );
    }
    throw new Error(uploadError.message);
  }

  return {
    filePath: path,
    fileName: file.name,
    fileType: file.type || "",
    fileSize: file.size
  };
};

/**
 * Genera una URL temporal para ver o descargar el archivo.
 * El bucket es privado, así que sin firma no se puede acceder.
 */
export const obtenerUrlDeArchivo = async (filePath, segundos = 3600) => {
  if (!filePath || !isSupabaseConfigured()) return null;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, segundos);
  if (error) {
    console.warn("No se pudo generar el enlace del archivo:", error.message);
    return null;
  }
  return data?.signedUrl || null;
};

/** Borra el archivo del storage. Se llama al eliminar o reemplazar la rutina. */
export const borrarArchivoDeRutina = async (filePath) => {
  if (!filePath || !isSupabaseConfigured()) return;
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) console.warn("No se pudo borrar el archivo:", error.message);
};
