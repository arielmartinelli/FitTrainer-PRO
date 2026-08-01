// Lógica de cuotas y recaudación (FitTrainer PRO)
// -----------------------------------------------
// Antes el estado de cuota era un campo suelto que nadie recalculaba: todos los alumnos
// quedaban "paid" para siempre. Ahora se deriva SIEMPRE de la fecha de vencimiento.

export const DUE_SOON_DAYS = 7;

const startOfDay = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/** Convierte "2026-08-15" (o Date) a Date local sin desfase de zona horaria. */
export const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return startOfDay(value);
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return startOfDay(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : startOfDay(parsed);
};

export const toISODate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** Días que faltan para el vencimiento (negativo = vencido). null si no hay fecha. */
export const daysUntilDue = (student) => {
  const due = parseDate(student?.nextDueDate);
  if (!due) return null;
  const today = startOfDay(new Date());
  return Math.round((due - today) / 86400000);
};

/**
 * Estado real de la cuota, calculado al vuelo.
 * "paid" = al día · "due_soon" = vence dentro de 7 días · "overdue" = vencida
 */
export const getPaymentStatus = (student) => {
  if (!student) return "paid";
  const days = daysUntilDue(student);
  if (days === null) return "due_soon"; // sin fecha cargada => hay que revisarlo
  if (days < 0) return "overdue";
  if (days <= DUE_SOON_DAYS) return "due_soon";
  return "paid";
};

export const getPaymentLabel = (student) => {
  const status = getPaymentStatus(student);
  const days = daysUntilDue(student);

  if (status === "overdue") {
    return { status, text: `Vencida hace ${Math.abs(days ?? 0)} día${Math.abs(days ?? 0) === 1 ? "" : "s"}`, badge: "badge-danger", dot: "🔴" };
  }
  if (status === "due_soon") {
    if (days === null) return { status, text: "Sin fecha de vencimiento", badge: "badge-warning", dot: "🟡" };
    if (days === 0) return { status, text: "Vence hoy", badge: "badge-warning", dot: "🟡" };
    return { status, text: `Vence en ${days} día${days === 1 ? "" : "s"}`, badge: "badge-warning", dot: "🟡" };
  }
  return { status, text: `Al día · vence ${student.nextDueDate}`, badge: "badge-success", dot: "🟢" };
};

const isSameMonth = (dateValue, reference = new Date()) => {
  const d = parseDate(dateValue);
  if (!d) return false;
  return d.getMonth() === reference.getMonth() && d.getFullYear() === reference.getFullYear();
};

/**
 * Recaudación REAL del mes: suma de pagos efectivamente registrados.
 * Es el único cálculo de recaudación de la app (antes había dos, con resultados distintos).
 */
export const getMonthlyRevenue = (students = [], reference = new Date()) =>
  students.reduce((total, student) => {
    const payments = student?.payments || [];
    return total + payments.reduce((sub, p) => (isSameMonth(p.date, reference) ? sub + Number(p.amount || 0) : sub), 0);
  }, 0);

/** Lo que debería facturarse este mes si todos pagan (proyección). */
export const getProjectedRevenue = (students = []) =>
  students.reduce((total, s) => total + Number(s?.planPrice || 0), 0);

/** Monto pendiente de cobro (alumnos vencidos o por vencer). */
export const getPendingAmount = (students = []) =>
  students.reduce((total, s) => {
    const status = getPaymentStatus(s);
    return status === "overdue" || status === "due_soon" ? total + Number(s?.planPrice || 0) : total;
  }, 0);

export const formatMoney = (amount) => `$${Number(amount || 0).toLocaleString("es-AR")}`;

/** Suma un mes calendario a partir de hoy (o de la fecha dada). */
export const addOneMonth = (from = new Date()) => {
  const base = parseDate(from) || new Date();
  const next = new Date(base);
  next.setMonth(next.getMonth() + 1);
  return next;
};
