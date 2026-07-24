const STORAGE_KEY = "fittrainer_exercise_bank_v2";

export const initialExerciseBank = [
  // 🦾 BRAZOS (Bícep / Trícep)
  { id: "eb_1", sector: "Brazos", muscle: "Bíceps", name: "Curl de Bíceps con Barra", defaultSets: 4, defaultReps: "10-12", defaultRest: 60, defaultRpe: "RPE 8", notes: "Codos pegados al torso, controlar bajada en 2s.", videoUrl: "https://www.youtube.com/results?search_query=curl+de+biceps+con+barra" },
  { id: "eb_2", sector: "Brazos", muscle: "Bíceps", name: "Curl Martillo con Mancuernas", defaultSets: 3, defaultReps: "10-12", defaultRest: 60, defaultRpe: "RPE 8", notes: "Agarre neutro enfocado en braquial.", videoUrl: "https://www.youtube.com/results?search_query=curl+martillo+con+mancuernas" },
  { id: "eb_3", sector: "Brazos", muscle: "Bíceps", name: "Curl Predicador en Banco Scott", defaultSets: 3, defaultReps: "10-12", defaultRest: 75, defaultRpe: "RPE 8.5", notes: "Aislamiento total del bíceps sin impulso de torso.", videoUrl: "https://www.youtube.com/results?search_query=curl+predicador" },
  { id: "eb_4", sector: "Brazos", muscle: "Tríceps", name: "Tríceps Polea Alta con Cuerda", defaultSets: 4, defaultReps: "12-15", defaultRest: 60, defaultRpe: "RPE 8", notes: "Abrir la cuerda al final de la extensión.", videoUrl: "https://www.youtube.com/results?search_query=triceps+polea+cuerda" },
  { id: "eb_5", sector: "Brazos", muscle: "Tríceps", name: "Press Francés con Barra Z", defaultSets: 3, defaultReps: "10-12", defaultRest: 75, defaultRpe: "RPE 8", notes: "Llevar la barra hacia la frente sin abrir codos.", videoUrl: "https://www.youtube.com/results?search_query=press+frances+barra+z" },
  { id: "eb_6", sector: "Brazos", muscle: "Tríceps", name: "Fondos en Paralelas / Dips", defaultSets: 3, defaultReps: "8-10", defaultRest: 90, defaultRpe: "RPE 8.5", notes: "Cálculo con peso corporal o lastre.", videoUrl: "https://www.youtube.com/results?search_query=fondos+en+paralelas" },

  // 🦵 CUÁDRICEPS / PIERNAS
  { id: "eb_7", sector: "Cuádriceps", muscle: "Cuádriceps", name: "Sentadilla Trasera con Barra (Back Squat)", defaultSets: 4, defaultReps: "6-8", defaultRest: 120, defaultRpe: "RPE 8.5", notes: "Bajar rompiendo los 90 grados, rodillas hacia afuera.", videoUrl: "https://www.youtube.com/results?search_query=sentadilla+trasera+tecnica" },
  { id: "eb_8", sector: "Cuádriceps", muscle: "Cuádriceps", name: "Prensa de Piernas a 45°", defaultSets: 4, defaultReps: "10-12", defaultRest: 90, defaultRpe: "RPE 8", notes: "Pies a ancho de hombros, no hiperextender rodillas.", videoUrl: "https://www.youtube.com/results?search_query=prensa+de+piernas" },
  { id: "eb_9", sector: "Cuádriceps", muscle: "Cuádriceps", name: "Extensión de Cuádriceps en Sillón", defaultSets: 4, defaultReps: "12-15", defaultRest: 60, defaultRpe: "RPE 9", notes: "Pausa de 1 segundo en la máxima extensión.", videoUrl: "https://www.youtube.com/results?search_query=extension+de+cuadriceps" },
  { id: "eb_10", sector: "Cuádriceps", muscle: "Cuádriceps", name: "Sentadilla Búlgara con Mancuernas", defaultSets: 3, defaultReps: "10-12", defaultRest: 90, defaultRpe: "RPE 8.5", notes: "Pie posterior apoyado en banco, torso inclinado.", videoUrl: "https://www.youtube.com/results?search_query=sentadilla+bulgara" },
  { id: "eb_11", sector: "Cuádriceps", muscle: "Cuádriceps", name: "Sentadilla Hack (Hack Squat)", defaultSets: 4, defaultReps: "8-10", defaultRest: 90, defaultRpe: "RPE 8", notes: "Enfoque masivo en vasto externo.", videoUrl: "https://www.youtube.com/results?search_query=sentadilla+hack" },

  // 🍑 FEMORAL / GLÚTEOS
  { id: "eb_12", sector: "Femoral / Glúteos", muscle: "Glúteos", name: "Hip Thrust con Barra", defaultSets: 4, defaultReps: "8-10", defaultRest: 90, defaultRpe: "RPE 9", notes: "Retroversión pélvica arriba apretando fuerte el glúteo.", videoUrl: "https://www.youtube.com/results?search_query=hip+thrust+tecnica" },
  { id: "eb_13", sector: "Femoral / Glúteos", muscle: "Femoral", name: "Peso Muerto Rumano con Barra", defaultSets: 4, defaultReps: "8-10", defaultRest: 90, defaultRpe: "RPE 8", notes: "Empujar cadera atrás sintiendo estiramiento en isquios.", videoUrl: "https://www.youtube.com/results?search_query=peso+muerto+rumano" },
  { id: "eb_14", sector: "Femoral / Glúteos", muscle: "Femoral", name: "Camilla Femoral Acostado", defaultSets: 4, defaultReps: "10-12", defaultRest: 75, defaultRpe: "RPE 8", notes: "Mantener cadera pegada al banco.", videoUrl: "https://www.youtube.com/results?search_query=camilla+femoral" },
  { id: "eb_15", sector: "Femoral / Glúteos", muscle: "Femoral", name: "Curl Femoral De Pie Unilateral", defaultSets: 3, defaultReps: "12-15", defaultRest: 60, defaultRpe: "RPE 8.5", notes: "Trabajo unípodal de aislamiento isquiotibial.", videoUrl: "https://www.youtube.com/results?search_query=curl+femoral+de+pie" },
  { id: "eb_16", sector: "Femoral / Glúteos", muscle: "Glúteos", name: "Patada de Glúteo en Polea Baja", defaultSets: 3, defaultReps: "12-15", defaultRest: 60, defaultRpe: "RPE 9", notes: "Mantener la pierna casi recta apretando glúteo mayor.", videoUrl: "https://www.youtube.com/results?search_query=patada+de+gluteo+polea" },

  // 🛡️ PECHO
  { id: "eb_17", sector: "Pecho", muscle: "Pecho", name: "Press de Banca Plano con Barra", defaultSets: 4, defaultReps: "6-8", defaultRest: 120, defaultRpe: "RPE 8", notes: "Retraer escápulas, apoyar pies firmes en suelo.", videoUrl: "https://www.youtube.com/results?search_query=press+de+banca+plano" },
  { id: "eb_18", sector: "Pecho", muscle: "Pecho", name: "Press Inclinado con Mancuernas", defaultSets: 4, defaultReps: "8-10", defaultRest: 90, defaultRpe: "RPE 8", notes: "Banco a 30 grados, enfocado en pectoral superior.", videoUrl: "https://www.youtube.com/results?search_query=press+inclinado+mancuernas" },
  { id: "eb_19", sector: "Pecho", muscle: "Pecho", name: "Aperturas Inclinadas con Mancuernas", defaultSets: 3, defaultReps: "12-15", defaultRest: 75, defaultRpe: "RPE 8", notes: "Codos semiflexionados para máximo estiramiento.", videoUrl: "https://www.youtube.com/results?search_query=aperturas+inclinadas" },
  { id: "eb_20", sector: "Pecho", muscle: "Pecho", name: "Cruce de Poleas (Crossover)", defaultSets: 4, defaultReps: "12-15", defaultRest: 60, defaultRpe: "RPE 9", notes: "Cruzar manos al centro apretando pectoral inferior.", videoUrl: "https://www.youtube.com/results?search_query=cruce+de+poleas" },
  { id: "eb_21", sector: "Pecho", muscle: "Pecho", name: "Flexiones de Brazo / Push Ups", defaultSets: 3, defaultReps: "15-20", defaultRest: 60, defaultRpe: "RPE 8", notes: "Core bloqueado, pecho toca suelo.", videoUrl: "https://www.youtube.com/results?search_query=push+ups+tecnica" },

  // 🎯 HOMBROS
  { id: "eb_22", sector: "Hombros", muscle: "Hombros", name: "Press Militar con Mancuernas", defaultSets: 4, defaultReps: "8-10", defaultRest: 90, defaultRpe: "RPE 8", notes: "Subir fluido sin balancear la zona lumbar.", videoUrl: "https://www.youtube.com/results?search_query=press+militar+mancuernas" },
  { id: "eb_23", sector: "Hombros", muscle: "Hombros", name: "Elevaciones Laterales con Mancuernas", defaultSets: 4, defaultReps: "12-15", defaultRest: 60, defaultRpe: "RPE 9", notes: "Codos ligeramente flexionados, subir a altura del hombro.", videoUrl: "https://www.youtube.com/results?search_query=elevaciones+laterales" },
  { id: "eb_24", sector: "Hombros", muscle: "Hombros", name: "Vuelos Posteriores / Pájaro con Mancuernas", defaultSets: 4, defaultReps: "12-15", defaultRest: 60, defaultRpe: "RPE 9", notes: "Torso inclinado 90°, enfoque en deltoides posterior.", videoUrl: "https://www.youtube.com/results?search_query=vuelos+posteriores" },
  { id: "eb_25", sector: "Hombros", muscle: "Hombros", name: "Press Arnold Seated", defaultSets: 3, defaultReps: "10-12", defaultRest: 75, defaultRpe: "RPE 8", notes: "Rotación de muñecas durante el empuje vertical.", videoUrl: "https://www.youtube.com/results?search_query=press+arnold" },
  { id: "eb_26", sector: "Hombros", muscle: "Hombros", name: "Remada al Mentón con Barra Z", defaultSets: 3, defaultReps: "10-12", defaultRest: 75, defaultRpe: "RPE 8", notes: "Codos siempre por encima de la barra.", videoUrl: "https://www.youtube.com/results?search_query=remada+al+menton" },

  // 🦹 ESPALDA
  { id: "eb_27", sector: "Espalda", muscle: "Espalda", name: "Remo con Barra Prono", defaultSets: 4, defaultReps: "8-10", defaultRest: 90, defaultRpe: "RPE 8", notes: "Torso inclinado 45°, jalar la barra al ombligo.", videoUrl: "https://www.youtube.com/results?search_query=remo+con+barra" },
  { id: "eb_28", sector: "Espalda", muscle: "Espalda", name: "Jalón al Pecho Agarre Neutro", defaultSets: 4, defaultReps: "10-12", defaultRest: 75, defaultRpe: "RPE 8", notes: "Traccionar hacia la clavícula apretando dorsales.", videoUrl: "https://www.youtube.com/results?search_query=jalon+al+pecho" },
  { id: "eb_29", sector: "Espalda", muscle: "Espalda", name: "Remo Gironda en Polea Baja", defaultSets: 4, defaultReps: "10-12", defaultRest: 75, defaultRpe: "RPE 8", notes: "Pausa de 1 segundo atrás sellando escápulas.", videoUrl: "https://www.youtube.com/results?search_query=remo+gironda" },
  { id: "eb_30", sector: "Espalda", muscle: "Espalda", name: "Dominadas Pronas / Pull Ups", defaultSets: 4, defaultReps: "6-8", defaultRest: 120, defaultRpe: "RPE 8.5", notes: "Mentón sobre la barra, bajada controlada.", videoUrl: "https://www.youtube.com/results?search_query=dominadas+tecnica" },
  { id: "eb_31", sector: "Espalda", muscle: "Espalda", name: "Pullover de Espalda con Cuerda en Polea", defaultSets: 3, defaultReps: "12-15", defaultRest: 60, defaultRpe: "RPE 8", notes: "Brazo casi extendido traccionando al muslo.", videoUrl: "https://www.youtube.com/results?search_query=pullover+polea+espalda" },

  // 🧘 CORE
  { id: "eb_32", sector: "Core", muscle: "Core", name: "Plancha Isométrica", defaultSets: 3, defaultReps: "45 seg", defaultRest: 45, defaultRpe: "RPE 8", notes: "Activar glúteos y abdomen como una tabla.", videoUrl: "https://www.youtube.com/results?search_query=plancha+isometrica" },
  { id: "eb_33", sector: "Core", muscle: "Core", name: "Rueda Abdominal", defaultSets: 3, defaultReps: "10-12", defaultRest: 60, defaultRpe: "RPE 8.5", notes: "Desenrollar sin curvar la espalda baja.", videoUrl: "https://www.youtube.com/results?search_query=rueda+abdominal" },
  { id: "eb_34", sector: "Core", muscle: "Core", name: "Elevación de Piernas Colgado", defaultSets: 3, defaultReps: "12-15", defaultRest: 60, defaultRpe: "RPE 8.5", notes: "Elevar pelvis hacia el pecho sin balanceo.", videoUrl: "https://www.youtube.com/results?search_query=elevacion+de+piernas+colgado" },
  { id: "eb_35", sector: "Core", muscle: "Core", name: "Crunch Abdominal en Polea Alta", defaultSets: 4, defaultReps: "12-15", defaultRest: 60, defaultRpe: "RPE 9", notes: "Flexión de columna apretando recto abdominal.", videoUrl: "https://www.youtube.com/results?search_query=crunch+en+polea" },
  { id: "eb_36", sector: "Core", muscle: "Core", name: "Twist Ruso con Disco (Russian Twist)", defaultSets: 3, defaultReps: "20 reps", defaultRest: 45, defaultRpe: "RPE 8", notes: "Rotación de oblicuos de lado a lado.", videoUrl: "https://www.youtube.com/results?search_query=russian+twist" }
];

export const getExerciseBank = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialExerciseBank));
  }
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
};

export const addExerciseToBank = (exerciseData) => {
  const bank = getExerciseBank();
  const newEx = {
    id: `eb_${Date.now()}`,
    sector: exerciseData.sector || "Brazos",
    muscle: exerciseData.muscle || exerciseData.sector,
    name: exerciseData.name,
    defaultSets: Number(exerciseData.defaultSets || 3),
    defaultReps: String(exerciseData.defaultReps || "10-12"),
    defaultRest: Number(exerciseData.defaultRest || 60),
    defaultRpe: String(exerciseData.defaultRpe || "RPE 8"),
    notes: exerciseData.notes || "",
    videoUrl: exerciseData.videoUrl || ""
  };
  const updated = [...bank, newEx];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteExerciseFromBank = (exerciseId) => {
  const bank = getExerciseBank();
  const updated = bank.filter((ex) => ex.id !== exerciseId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
