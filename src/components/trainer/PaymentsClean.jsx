import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { recordStudentPayment } from "../../services/storageService";
import {
  getPaymentStatus,
  getPaymentLabel,
  getMonthlyRevenue,
  getPendingAmount,
  getProjectedRevenue,
  formatMoney,
  toISODate
} from "../../services/billingService";
import { Modal } from "../common/Modal";
import { DollarSign, Search, CreditCard, Send, Loader2, Eye } from "lucide-react";

const STATUS_TONE = {
  overdue: { fg: "#FF3B30", bg: "rgba(255, 59, 48, 0.15)", border: "rgba(255, 59, 48, 0.3)" },
  due_soon: { fg: "#FF9500", bg: "rgba(255, 149, 0, 0.15)", border: "rgba(255, 149, 0, 0.3)" },
  paid: { fg: "#34C759", bg: "rgba(52, 199, 89, 0.15)", border: "rgba(52, 199, 89, 0.3)" }
};

export const PaymentsClean = ({ onSelectStudent }) => {
  const { currentUser, students, refreshData } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [payTarget, setPayTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    date: toISODate(new Date()),
    method: "Transferencia Bancaria",
    notes: ""
  });

  const trainerStudents = useMemo(
    () => students.filter((s) => s.trainerId === currentUser?.id),
    [students, currentUser?.id]
  );

  // Mismos números que el dashboard: antes esta pantalla sumaba planPrice
  // de los "pagados" y mostraba una recaudación distinta a la del inicio.
  const revenueMonth = useMemo(() => getMonthlyRevenue(trainerStudents), [trainerStudents]);
  const pendingAmount = useMemo(() => getPendingAmount(trainerStudents), [trainerStudents]);
  const projected = useMemo(() => getProjectedRevenue(trainerStudents), [trainerStudents]);

  const counts = useMemo(() => {
    const acc = { all: trainerStudents.length, paid: 0, due_soon: 0, overdue: 0 };
    trainerStudents.forEach((s) => {
      acc[getPaymentStatus(s)]++;
    });
    return acc;
  }, [trainerStudents]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return trainerStudents.filter((s) => {
      const matchesSearch = !q || s.name.toLowerCase().includes(q);
      const matchesFilter = filterStatus === "all" || getPaymentStatus(s) === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [trainerStudents, searchQuery, filterStatus]);

  const openPayModal = (student) => {
    setPayTarget(student);
    setPaymentForm({
      amount: student.planPrice || 0,
      date: toISODate(new Date()),
      method: "Transferencia Bancaria",
      notes: ""
    });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!payTarget || saving) return;
    setSaving(true);
    try {
      await recordStudentPayment(payTarget.id, paymentForm);
      await refreshData();
      setPayTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const sendWhatsAppReminder = (student) => {
    const phone = (student.phone || "").replace(/[^0-9]/g, "");
    if (!phone) {
      alert(`${student.name} no tiene teléfono cargado. Agregalo en su ficha para poder mandarle el recordatorio.`);
      return;
    }

    const label = getPaymentLabel(student);
    const datosPago = [
      currentUser?.alias ? `Alias: ${currentUser.alias}` : null,
      currentUser?.cbu ? `CBU: ${currentUser.cbu}` : null
    ]
      .filter(Boolean)
      .join("\n");

    const text = encodeURIComponent(
      `Hola ${student.name}, te recuerdo tu cuota de entrenamiento de ${formatMoney(student.planPrice)}.\n` +
        `${label.text}.\n\n` +
        (datosPago ? `${datosPago}\n\n` : "") +
        `Gracias.`
    );

    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener");
  };

  return (
    <div className="animate-fade-in stack">
      {/* Resumen financiero */}
      <div className="glass-panel" style={{ padding: "18px", background: "linear-gradient(135deg, #1C1C1E 0%, #34C759 100%)", color: "#FFF" }}>
        <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.85, fontWeight: 700 }}>
          Cobrado este mes
        </span>
        <h2 style={{ fontSize: "1.9rem", color: "#FFF", margin: "2px 0 8px 0" }}>{formatMoney(revenueMonth)}</h2>

        <div className="grid-2" style={{ gap: "10px" }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "10px 12px" }}>
            <div style={{ fontSize: "0.68rem", opacity: 0.85, fontWeight: 700 }}>PENDIENTE</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 800 }}>{formatMoney(pendingAmount)}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "10px 12px" }}>
            <div style={{ fontSize: "0.68rem", opacity: 0.85, fontWeight: 700 }}>POTENCIAL MENSUAL</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 800 }}>{formatMoney(projected)}</div>
          </div>
        </div>
      </div>

      <div className="search-box">
        <Search size={17} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          className="form-input"
          placeholder="Buscar alumno..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Buscar alumno"
        />
      </div>

      <div className="scroll-x-wrap">
        <div className="scroll-x">
          {[
            { key: "all", label: `Todos (${counts.all})`, cls: "btn-primary" },
            { key: "overdue", label: `🔴 Vencidas (${counts.overdue})`, cls: "btn-danger" },
            { key: "due_soon", label: `🟡 Por vencer (${counts.due_soon})`, cls: "btn-secondary" },
            { key: "paid", label: `🟢 Al día (${counts.paid})`, cls: "btn-lime" }
          ].map((f) => (
            <button
              key={f.key}
              className={`btn btn-sm ${filterStatus === f.key ? f.cls : "btn-secondary"}`}
              style={{ borderRadius: "20px" }}
              onClick={() => setFilterStatus(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="glass-panel" style={{ padding: "34px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
          No hay alumnos en este filtro.
        </div>
      ) : (
        <div className="grid-cards">
          {filteredStudents.map((st) => {
            const label = getPaymentLabel(st);
            const lastPayment = (st.payments || [])[0];
            // Sin color-mix() para no depender de soporte de Safari viejo.
            const tone = STATUS_TONE[label.status];

            return (
              <div key={st.id} className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      minWidth: "38px",
                      borderRadius: "50%",
                      background: tone.bg,
                      border: `1px solid ${tone.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <DollarSign size={19} color={tone.fg} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ fontSize: "1rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.name}</h3>
                    <div style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>{st.planName || "Plan Mensual"}</div>
                  </div>
                </div>

                <span className={`badge ${label.badge}`} style={{ alignSelf: "flex-start" }}>
                  {label.dot} {label.text}
                </span>

                <div className="subtle-box" style={{ fontSize: "0.79rem", padding: "10px 12px" }}>
                  <div>Cuota: <strong style={{ color: "var(--accent-green)" }}>{formatMoney(st.planPrice)}</strong></div>
                  <div>Vencimiento: <strong>{st.nextDueDate || "sin fecha"}</strong></div>
                  <div>
                    Último pago:{" "}
                    <strong>{lastPayment ? `${formatMoney(lastPayment.amount)} el ${lastPayment.date}` : "sin registros"}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                  <button className="btn btn-lime btn-sm" style={{ flex: 1 }} onClick={() => openPayModal(st)}>
                    <CreditCard size={14} /> Registrar pago
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => sendWhatsAppReminder(st)}
                    aria-label="Enviar recordatorio por WhatsApp"
                    title="Recordatorio por WhatsApp"
                  >
                    <Send size={14} />
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectStudent?.(st)}
                    aria-label="Ver ficha"
                    title="Ver ficha del alumno"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registrar pago */}
      <Modal isOpen={!!payTarget} onClose={() => setPayTarget(null)} title={payTarget ? `Registrar pago · ${payTarget.name}` : ""}>
        <form onSubmit={handleSubmitPayment}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="pay-amount">Monto ($)</label>
              <input
                id="pay-amount"
                type="text"
                inputMode="numeric"
                className="form-input"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value.replace(/[^0-9]/g, "") })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pay-date">Fecha del pago</label>
              <input
                id="pay-date"
                type="date"
                className="form-input"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pay-method">Medio de pago</label>
            <select
              id="pay-method"
              className="form-select"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
            >
              <option value="Transferencia Bancaria">Transferencia bancaria</option>
              <option value="Efectivo">Efectivo</option>
              <option value="MercadoPago / Tarjeta">MercadoPago / Tarjeta</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pay-notes">Notas (opcional)</label>
            <input
              id="pay-notes"
              type="text"
              className="form-input"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            />
          </div>

          <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
            El vencimiento se recalcula un mes después de la fecha del pago.
          </p>

          <div className="action-row" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setPayTarget(null)}>Cancelar</button>
            <button type="submit" className="btn btn-lime" disabled={saving}>
              {saving && <Loader2 size={16} className="spin" />} {saving ? "Guardando..." : "Confirmar pago"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
