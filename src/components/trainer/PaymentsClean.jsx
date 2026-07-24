import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { recordStudentPayment } from "../../services/storageService";
import { Modal } from "../common/Modal";
import { DollarSign, Search, CreditCard, Send, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export const PaymentsClean = ({ onSelectStudent }) => {
  const { currentUser, students, refreshData } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedStudentForPay, setSelectedStudentForPay] = useState(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: 28000,
    date: new Date().toISOString().split("T")[0],
    method: "Transferencia Bancaria",
    notes: ""
  });

  const trainerStudents = students.filter((s) => s.trainerId === currentUser?.id);

  const filteredStudents = trainerStudents.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || s.paymentStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalMonthlyIncome = trainerStudents.reduce((sum, s) => {
    if (s.paymentStatus === "paid") return sum + (s.planPrice || 25000);
    return sum;
  }, 0);

  const handleOpenPayModal = (student) => {
    setSelectedStudentForPay(student);
    setPaymentForm({
      amount: student.planPrice || 25000,
      date: new Date().toISOString().split("T")[0],
      method: "Transferencia Bancaria",
      notes: ""
    });
  };

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    if (!selectedStudentForPay) return;
    recordStudentPayment(selectedStudentForPay.id, paymentForm);
    refreshData();
    setSelectedStudentForPay(null);
  };

  const handleSendWhatsAppReminder = (student) => {
    const text = encodeURIComponent(
      `💪 ¡Hola ${student.name}! Te recuerdo que tu cuota de entrenamiento ($${(student.planPrice || 25000).toLocaleString("es-AR")}) vence el ${student.nextDueDate}.\n\nCBU: ${currentUser.cbu || "0000003100012345678901"}\nAlias: ${currentUser.alias || "carlos.rivera.fit"}\n\n¡Muchas gracias!`
    );
    const cleanPhone = (student.phone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Banner Resumen de Cobros */}
      <div className="glass-panel" style={{ padding: "20px", background: "linear-gradient(135deg, #1C1C1E 0%, #34C759 100%)", color: "#FFF" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.8 }}>
              💳 CONTROL FINANCIERO Y CUOTAS DE ALUMNOS
            </span>
            <h2 style={{ fontSize: "1.6rem", color: "#FFF", margin: "2px 0" }}>
              Recaudación Acreditada: ${(totalMonthlyIncome).toLocaleString("es-AR")}
            </h2>
            <p style={{ fontSize: "0.85rem", opacity: 0.9 }}>
              Total de alumnos: {trainerStudents.length} • Revisa estados de cuota y registra cobros recibidos.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
        <div className="glass-panel" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            className="form-input"
            style={{ background: "transparent", border: "none" }}
            placeholder="Buscar alumno por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button className={`btn ${filterStatus === "all" ? "btn-primary" : "btn-ghost"} btn-sm`} onClick={() => setFilterStatus("all")}>
            Todos
          </button>
          <button className={`btn ${filterStatus === "paid" ? "btn-lime" : "btn-ghost"} btn-sm`} onClick={() => setFilterStatus("paid")}>
            🟢 Al Día
          </button>
          <button className={`btn ${filterStatus === "due_soon" ? "btn-secondary" : "btn-ghost"} btn-sm`} onClick={() => setFilterStatus("due_soon")}>
            🟡 Pendientes
          </button>
          <button className={`btn ${filterStatus === "overdue" ? "btn-danger" : "btn-ghost"} btn-sm`} onClick={() => setFilterStatus("overdue")}>
            🔴 Vencidos
          </button>
        </div>
      </div>

      {/* Lista de Alumnos con Iconos de Peso Verde / Naranja / Rojo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
        {filteredStudents.map((st) => (
          <div key={st.id} className="glass-panel" style={{ padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* ICONOS DE PESO SEGÚN ESTADO */}
                  {st.paymentStatus === "paid" && (
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(52, 199, 89, 0.15)", border: "1px solid rgba(52, 199, 89, 0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <DollarSign size={20} color="#34C759" />
                    </div>
                  )}
                  {st.paymentStatus === "due_soon" && (
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255, 149, 0, 0.15)", border: "1px solid rgba(255, 149, 0, 0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <DollarSign size={20} color="#FF9500" />
                    </div>
                  )}
                  {st.paymentStatus === "overdue" && (
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255, 59, 48, 0.15)", border: "1px solid rgba(255, 59, 48, 0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <DollarSign size={20} color="#FF3B30" />
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: "1.05rem", margin: 0 }}>{st.name}</h3>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Plan: {st.planName || "Mensual"}</div>
                  </div>
                </div>

                {st.paymentStatus === "paid" && <span className="badge badge-success">🟢 Al Día</span>}
                {st.paymentStatus === "due_soon" && <span className="badge badge-warning">🟡 Vence: {st.nextDueDate}</span>}
                {st.paymentStatus === "overdue" && <span className="badge badge-danger">🔴 Cuota Vencida</span>}
              </div>

              <div style={{ background: "#F2F2F7", padding: "10px 12px", borderRadius: "10px", fontSize: "0.8rem", marginBottom: "14px" }}>
                <div>Valor Cuota: <strong style={{ color: "var(--accent-green)" }}>${(st.planPrice || 25000).toLocaleString("es-AR")}</strong></div>
                <div>Fecha Vencimiento: <strong>{st.nextDueDate}</strong></div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
              <button className="btn btn-lime btn-sm" style={{ flex: 1 }} onClick={() => handleOpenPayModal(st)}>
                <CreditCard size={14} /> Registrar Pago
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleSendWhatsAppReminder(st)} title="Enviar Recordatorio por WhatsApp">
                <Send size={14} />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Modal Registrar Pago */}
      {selectedStudentForPay && (
        <Modal isOpen={!!selectedStudentForPay} onClose={() => setSelectedStudentForPay(null)} title={`Registrar Pago - ${selectedStudentForPay.name}`}>
          <form onSubmit={handleSubmitPayment}>
            <div className="form-group">
              <label className="form-label">Monto Acreditado ($)</label>
              <input
                type="number"
                className="form-input"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Medio de Pago</label>
              <select
                className="form-select"
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
              >
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Efectivo">Efectivo</option>
                <option value="MercadoPago / Tarjeta">MercadoPago / Tarjeta</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedStudentForPay(null)}>Cancelar</button>
              <button type="submit" className="btn btn-lime">Confirmar Pago</button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
