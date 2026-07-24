import * as XLSX from "xlsx";

/**
 * Lee un archivo .xlsx o .csv subido por el profesor y genera una estructura de Rutina
 */
export const importRoutineFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir la hoja a objetos JSON
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          reject(new Error("El archivo Excel está vacío o no tiene formato válido."));
          return;
        }

        // Estructurar días y ejercicios
        const daysMap = {};
        let currentDayName = "Día 1: General";

        rawJson.forEach((row) => {
          // Detectar columnas flexiblmente (Mayúsculas, minúsculas, con/sin tildes)
          const dayVal = row["Día"] || row["Dia"] || row["DAY"] || row["day"] || row["DÍA"] || "";
          const exerciseVal = row["Ejercicio"] || row["EJERCICIO"] || row["Nombre"] || row["Exercise"] || row["exercise"] || "";
          const setsVal = row["Series"] || row["SERIES"] || row["Sets"] || row["sets"] || 3;
          const repsVal = row["Repeticiones"] || row["REPETICIONES"] || row["Reps"] || row["reps"] || "10-12";
          const restVal = row["Descanso (Segundos)"] || row["Descanso"] || row["DESCANSO"] || row["Rest"] || 60;
          const rpeVal = row["RPE / Carga"] || row["RPE"] || row["Carga"] || row["Peso"] || "RPE 8";
          const notesVal = row["Notas / Técnica"] || row["Notas"] || row["NOTAS"] || row["Notes"] || "";

          if (dayVal && dayVal.trim() !== "") {
            currentDayName = dayVal.trim();
          }

          if (exerciseVal && exerciseVal.trim() !== "") {
            if (!daysMap[currentDayName]) {
              daysMap[currentDayName] = [];
            }

            daysMap[currentDayName].push({
              name: exerciseVal.trim(),
              sets: Number(setsVal) || 3,
              reps: String(repsVal).trim(),
              restSec: Number(restVal) || 60,
              rpe: String(rpeVal).trim(),
              notes: String(notesVal).trim(),
              videoUrl: ""
            });
          }
        });

        const formattedDays = Object.keys(daysMap).map((dayName) => ({
          dayName,
          exercises: daysMap[dayName]
        }));

        if (formattedDays.length === 0) {
          reject(new Error("No se encontraron ejercicios válidos en las columnas 'Día' y 'Ejercicio'."));
          return;
        }

        const routine = {
          title: file.name.replace(/\.[^/.]+$/, "") || "Rutina Importada desde Excel",
          category: "Importada Excel",
          description: `Rutina importada automáticamente el ${new Date().toLocaleDateString('es-ES')}`,
          days: formattedDays
        };

        resolve(routine);
      } catch (err) {
        reject(new Error("Error al procesar el archivo Excel: " + err.message));
      }
    };

    reader.onerror = () => reject(new Error("Error al leer el archivo."));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Descarga una plantilla modelo Excel (.xlsx) para que el profesor la complete fácilmente
 */
export const downloadSampleExcelTemplate = () => {
  const sampleData = [
    {
      "Día": "Día 1: Torso (Empuje / Tracción)",
      "Ejercicio": "Press de Banca con Barra",
      "Series": 4,
      "Repeticiones": "6-8",
      "Descanso (Segundos)": 120,
      "RPE / Carga": "RPE 8 (80kg)",
      "Notas / Técnica": "Retraer escápulas, bajar controlado en 2 segundos."
    },
    {
      "Día": "Día 1: Torso (Empuje / Tracción)",
      "Ejercicio": "Remo con Barra",
      "Series": 4,
      "Repeticiones": "8-10",
      "Descanso (Segundos)": 90,
      "RPE / Carga": "RPE 8",
      "Notas / Técnica": "Torso a 45 grados, jalar hacia el ombligo."
    },
    {
      "Día": "Día 1: Torso (Empuje / Tracción)",
      "Ejercicio": "Press Militar con Mancuernas",
      "Series": 3,
      "Repeticiones": "10-12",
      "Descanso (Segundos)": 75,
      "RPE / Carga": "RPE 7.5",
      "Notas / Técnica": "Activar glúteos y abdominales."
    },
    {
      "Día": "Día 2: Pierna (Cuádriceps / Femoral)",
      "Ejercicio": "Sentadilla Trasera con Barra",
      "Series": 4,
      "Repeticiones": "6-8",
      "Descanso (Segundos)": 150,
      "RPE / Carga": "RPE 8.5",
      "Notas / Técnica": "Romper paralelo 90°. Mantener rodillas alineadas."
    },
    {
      "Día": "Día 2: Pierna (Cuádriceps / Femoral)",
      "Ejercicio": "Peso Muerto Rumano",
      "Series": 4,
      "Repeticiones": "8-10",
      "Descanso (Segundos)": 90,
      "RPE / Carga": "RPE 8",
      "Notas / Técnica": "Empujar la cadera hacia atrás sintiendo el femoral."
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla Rutina");

  // Ancho automático de columnas
  worksheet["!cols"] = [
    { wch: 32 }, // Día
    { wch: 30 }, // Ejercicio
    { wch: 8 },  // Series
    { wch: 14 }, // Repeticiones
    { wch: 20 }, // Descanso
    { wch: 16 }, // RPE / Carga
    { wch: 45 }  // Notas
  ];

  XLSX.writeFile(workbook, "Plantilla_Rutina_FitTrainer.xlsx");
};
