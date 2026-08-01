// Métricas de progreso y adherencia (FitTrainer PRO)
// --------------------------------------------------
// Toda esta información ya se estaba guardando pero no se mostraba en ninguna parte.

import { parseDate, toISODate } from "./billingService";

/** Convierte una carga registrada ("82.5", "80 kg", "Según plantilla") a número. */
export const parseWeight = (value) => {
  if (value === null || value === undefined) return null;
  const num = parseFloat(String(value).replace(",", ".").replace(/[^0-9.]/g, ""));
  return isNaN(num) || num <= 0 ? null : num;
};

/** Todos los entrenamientos ordenados del más reciente al más antiguo. */
export const getWorkouts = (student) =>
  [...(student?.completedWorkouts || [])].sort((a, b) => (a.date < b.date ? 1 : -1));

/** Cuántos entrenamientos registró en los últimos N días. */
export const countWorkoutsInLastDays = (student, days = 7) => {
  const limit = new Date();
  limit.setHours(0, 0, 0, 0);
  limit.setDate(limit.getDate() - (days - 1));

  return getWorkouts(student).filter((w) => {
    const d = parseDate(w.date);
    return d && d >= limit;
  }).length;
};

/** Días transcurridos desde el último entrenamiento. null si nunca entrenó. */
export const daysSinceLastWorkout = (student) => {
  const workouts = getWorkouts(student);
  if (workouts.length === 0) return null;
  const last = parseDate(workouts[0].date);
  if (!last) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today - last) / 86400000);
};

/**
 * Resumen de adherencia: lo primero que un profe quiere ver de cada alumno.
 * `state` sirve para pintar el semáforo sin repetir la lógica en cada componente.
 */
export const getAdherence = (student) => {
  const thisWeek = countWorkoutsInLastDays(student, 7);
  const lastWeek = countWorkoutsInLastDays(student, 14) - thisWeek;
  const since = daysSinceLastWorkout(student);
  const total = (student?.completedWorkouts || []).length;

  let state = "good";
  if (total === 0) state = "never";
  else if (since === null || since > 10) state = "inactive";
  else if (thisWeek === 0) state = "warning";

  return { thisWeek, lastWeek, daysSince: since, total, state };
};

export const ADHERENCE_LABEL = {
  good: { text: "Entrenando", badge: "badge-success", dot: "🟢" },
  warning: { text: "Sin entrenar esta semana", badge: "badge-warning", dot: "🟡" },
  inactive: { text: "Inactivo", badge: "badge-danger", dot: "🔴" },
  never: { text: "Nunca entrenó", badge: "badge-neutral", dot: "⚪" }
};

/** Últimos 7 días como matriz para pintar el mini-calendario de adherencia. */
export const getLast7Days = (student) => {
  const done = new Set(getWorkouts(student).map((w) => w.date));
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const iso = toISODate(d);
    days.push({
      iso,
      label: ["D", "L", "M", "M", "J", "V", "S"][d.getDay()],
      trained: done.has(iso)
    });
  }
  return days;
};

/**
 * Evolución de carga por ejercicio: para cada ejercicio, la mejor carga de cada fecha.
 * Devuelve un array ordenado por cantidad de registros (los más trabajados primero).
 */
export const getExerciseProgress = (student) => {
  const byExercise = new Map();

  getWorkouts(student)
    .slice()
    .reverse() // cronológico para que la serie temporal quede en orden
    .forEach((workout) => {
      (workout.logs || []).forEach((log) => {
        const weight = parseWeight(log.bestWeight);
        if (!weight || !log.exercise) return;

        if (!byExercise.has(log.exercise)) byExercise.set(log.exercise, []);
        const series = byExercise.get(log.exercise);
        const existing = series.find((p) => p.date === workout.date);

        if (existing) existing.weight = Math.max(existing.weight, weight);
        else series.push({ date: workout.date, weight });
      });
    });

  return Array.from(byExercise.entries())
    .map(([exercise, points]) => {
      const weights = points.map((p) => p.weight);
      const best = Math.max(...weights);
      const first = weights[0];
      const latest = weights[weights.length - 1];
      return {
        exercise,
        points,
        best,
        latest,
        delta: latest - first,
        deltaPct: first > 0 ? Math.round(((latest - first) / first) * 100) : 0
      };
    })
    .sort((a, b) => b.points.length - a.points.length);
};

/** Récord personal histórico de un ejercicio. */
export const getPersonalRecord = (student, exerciseName) => {
  let best = 0;
  getWorkouts(student).forEach((w) => {
    (w.logs || []).forEach((l) => {
      if (l.exercise !== exerciseName) return;
      const weight = parseWeight(l.bestWeight);
      if (weight && weight > best) best = weight;
    });
  });
  return best;
};

/** Serie de peso corporal lista para graficar (cronológica). */
export const getBodyWeightSeries = (student) =>
  [...(student?.bodyWeightLog || [])]
    .filter((e) => e && e.date && Number(e.weightKg) > 0)
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((e) => ({ date: e.date, weight: Number(e.weightKg) }));

/** Volumen total (series completadas) por semana del programa. */
export const getVolumeByWeek = (student) => {
  const byWeek = new Map();
  getWorkouts(student).forEach((w) => {
    const week = w.weekNumber || 1;
    const sets = (w.logs || []).reduce((sum, l) => sum + (Number(l.setsDone) || 0), 0);
    byWeek.set(week, (byWeek.get(week) || 0) + sets);
  });
  return Array.from(byWeek.entries())
    .map(([week, sets]) => ({ week, sets }))
    .sort((a, b) => a.week - b.week);
};
