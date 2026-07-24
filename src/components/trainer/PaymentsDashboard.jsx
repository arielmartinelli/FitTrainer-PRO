import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { recordStudentPayment } from "../../services/storageService";
import { Modal } from "../common/Modal";
import {
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  CreditCard,
  TrendingUp,
  Search,
  Filter,
  ArrowUpRight
} from "lucide-react";

export const PaymentsDashboard = ({ onSelectStudent }) => {
  const { currentUser, students, refreshData } = useAuth();
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // State para Modal de Registrar Pago
  const [selectedStudentForPay, setSelectedStudentForPay] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 28000,
    date: new Date().toISOString().split("T")[0],
    method: "Transferencia Bancaria",
    plan: "Plan Mensual",
    notes: ""
  });
  const [toastMessage, setToastMessage] = useState("");

  const trainerStudents = students.filter((s) => s.trainerId === currentUser?.id);

  // Filtro por Estado y Búsqueda
  const filteredStudents = trainerStudents.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && s.paymentStatus === filterStatus;
  });

  // Métricas Financieras
  const totalRevenueMonth = trainerStudents.reduce((sum, st) => {
    const monthPayments = (st.payments || []).filter((p) => {
      const pDate = new Date(p.date);
      const now = new Date();
      return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
    });
    return sum + monthPayments.reduce((sub, p) => sub + Number(p.amount), 0);
  }, 0);

  const pendingAmountTotal = trainerStudents
    .filter((st) => st.paymentStatus === "overdue" || st.paymentStatus === "due_soon")
    .reduce((sum, st) => sum + Number(st.planPrice || 25000), 0);

  const paidCount = trainerStudents.filter((st) => st.paymentStatus === "paid").length;
  const dueSoonCount = trainerStudents.filter((st) => st.paymentStatus === "due_soon").length;
  const overdueCount = trainerStudents.filter((st) => st.paymentStatus === "overdue").length;

  // Abrir Modal de Pago para un Alumno en específico
  const handleOpenPaymentModal = (student) => {
    setSelectedStudentForPay(student);
    setPaymentForm({
      amount: student.planPrice || 28000,
      date: new Date().toISOString().split("T")[0],
      method: "Transferencia Bancaria",
      plan: student.planName || "Plan Mensual",
      notes: "Cobro mensual registrado"
    });
  };

  // Confirmar Pago
  const handleSubmitPayment = (e) => {
    e.preventDefault();
    if (!selectedStudentForPay) return;

    recordStudentPayment(selectedStudentForPay.id, paymentForm);
    refreshData();
    setSelectedStudentForPay(null);
    setToastMessage(`✅ Pago de $${Number(paymentForm.amount).toLocaleString('es-AR')} registrado con éxito para ${selectedStudentForPay.name}.`);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Historial global de transacciones
  const allTransactions = trainerStudents.flatMap((st) =>
    (st.payments || []).map((p) => ({
      ...p,
      studentName: st.name,
      studentId: st.id
    }))
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="animate-fade-in">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: "rgba(0, 242, 254, 0.95)",
          color: "#090B0E",
          padding: "12px 20px",
          borderRadius: "var(--radius-sm)",
          fontWeight: 700,
          zIndex: 2000,
          boxShadow: "0 10px 30px rgba(0,242,254,0.4)"
        }}>
          {toastMessage}
        </div>
      )}

      {/* Title & Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <DollarSign className="gradient-text" size={28} /> Control y Dashboard de Pagos
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Gestiona la facturación mensual, vencimientos y cuotas de tus alumnos.
          </p>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        
        <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid var(--accent-lime)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Ingresos del Mes</span>
            <TrendingUp size={20} color="var(--accent-lime)" />
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "Outfit", color: "var(--accent-lime)" }}>
            ${totalRevenueMonth.toLocaleString('es-AR')}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total cobrado en el mes en curso</span>
        </div>

        <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid var(--accent-rose)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Por Cobrar / Pendiente</span>
            <AlertTriangle size={20} color="var(--accent-rose)" />
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "Outfit", color: "var(--accent-rose)" }}>
            ${pendingAmountTotal.toLocaleString('es-AR')}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{overdueCount} vencidos + {dueSoonCount} por vencer</span>
        </div>

        <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid var(--accent-cyan)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Estado de Alumnos</span>
            <CheckCircle2 size={20} color="var(--accent-cyan)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "Outfit", color: "#FFFFFF" }}>{paidCount}</span>
            <span style={{ fontSize: "0.9rem", color: "var(--accent-lime)", fontWeight: 600 }}>/ {trainerStudents.length} Al Día</span>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <span className="badge badge-success" style={{ fontSize: "0.65rem" }}>🟢 {paidCount} Al día</span>
            <span className="badge badge-warning" style={{ fontSize: "0.65rem" }}>🟡 {dueSoonCount} Cerca</span>
            <span className="badge badge-danger" style={{ fontSize: "0.65rem" }}>🔴 {overdueCount} Vencido</span>
          </div>
        </div>

      </div>

      {/* Main Table: Estado de Pagos por Alumno */}
      <div className="glass-panel" style={{ padding: "20px", marginBottom: "32px" }}>
        
        {/* Filters Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          
          {/* Search Box */}
          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por alumno o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "36px" }}
            />
          </div>

          {/* Filter Status Buttons */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className={`btn btn-sm ${filterStatus === "all" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setFilterStatus("all")}
            >
              Todos ({trainerStudents.length})
            </button>
            <button
              className={`btn btn-sm ${filterStatus === "paid" ? "btn-lime" : "btn-ghost"}`}
              onClick={() => setFilterStatus("paid")}
            >
              🟢 Al Día ({paidCount})
            </button>
            <button
              className={`btn btn-sm ${filterStatus === "due_soon" ? "btn-secondary" : "btn-ghost"}`}
              onClick={() => setFilterStatus("due_soon")}
            >
              🟡 Por Vencer ({dueSoonCount})
            </button>
            <button
              className={`btn btn-sm ${filterStatus === "overdue" ? "btn-danger" : "btn-ghost"}`}
              onClick={() => setFilterStatus("overdue")}
            >
              🔴 Vencidos ({overdueCount})
            </button>
          </div>

        </div>

        {/* Table / List */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                <th style={{ padding: "12px 10px" }}>Alumno</th>
                <th style={{ padding: "12px 10px" }}>Plan Asignado</th>
                <th style={{ padding: "12px 10px" }}>Valor Cuota</th>
                <th style={{ padding: "12px 10px" }}>Próximo Vencimiento</th>
                <th style={{ padding: "12px 10px" }}>Estado</th>
                <th style={{ padding: "12px 10px", textAlign: "right" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    No se encontraron alumnos con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    
                    {/* Alumno */}
                    <td style={{ padding: "14px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img
                          src={st.avatar}
                          alt={st.name}
                          style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#1A202C" }}
                        />
                        <div>
                          <div
                            style={{ fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
                            onClick={() => onSelectStudent && onSelectStudent(st)}
                          >
                            {st.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Ingreso: {st.joinDate}</div>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td style={{ padding: "14px 10px", color: "var(--text-main)" }}>
                      {st.planName || "Plan Mensual"}
                    </td>

                    {/* Precio */}
                    <td style={{ padding: "14px 10px", fontWeight: 700, color: "var(--accent-lime)" }}>
                      ${(st.planPrice || 25000).toLocaleString('es-AR')}
                    </td>

                    {/* Vencimiento */}
                    <td style={{ padding: "14px 10px", color: "var(--text-muted)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Calendar size={14} color="var(--accent-cyan)" />
                        <span>{st.nextDueDate || "Sin definir"}</span>
                      </div>
                    </td>

                    {/* Badge Estado */}
                    <td style={{ padding: "14px 10px" }}>
                      {st.paymentStatus === "paid" && (
                        <span className="badge badge-success">🟢 Al Día</span>
                      )}
                      {st.paymentStatus === "due_soon" && (
                        <span className="badge badge-warning">🟡 Por Vencer</span>
                      )}
                      {st.paymentStatus === "overdue" && (
                        <span className="badge badge-danger">🔴 Vencido</span>
                      )}
                    </td>

                    {/* Botón Registrar Pago */}
                    <td style={{ padding: "14px 10px", textAlign: "right" }}>
                      <button
                        className="btn btn-lime btn-sm"
                        onClick={() => handleOpenPaymentModal(st)}
                      >
                        <CreditCard size={14} /> Registrar Pago
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Transaction History */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={18} color="var(--accent-cyan)" /> Historial Reciente de Pagos
        </h3>

        {allTransactions.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No hay registros de pago en el sistema todavía.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {allTransactions.slice(0, 5).map((tx, idx) => (
              <div
                key={tx.id || idx}
                style={{
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.875rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(168,255,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <DollarSign size={16} color="var(--accent-lime)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "#FFFFFF" }}>{tx.studentName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{tx.method} • {tx.plan} ({tx.date})</div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: "var(--accent-lime)", fontSize: "1rem" }}>
                    +${Number(tx.amount).toLocaleString('es-AR')}
                  </div>
                  <span className="badge badge-success" style={{ fontSize: "0.6rem" }}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Registrar Pago */}
      <Modal
        isOpen={!!selectedStudentForPay}
        onClose={() => setSelectedStudentForPay(null)}
        title={`Registrar Pago de Cuota - ${selectedStudentForPay?.name}`}
      >
        <form onSubmit={handleSubmitPayment}>
          <div style={{ background: "rgba(0, 242, 254, 0.08)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(0,242,254,0.2)", marginBottom: "16px" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Plan actual del alumno:</div>
            <div style={{ fontWeight: 700, color: "#FFFFFF" }}>{selectedStudentForPay?.planName || "Plan Mensual"}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--accent-cyan)" }}>Fecha de vencimiento actual: {selectedStudentForPay?.nextDueDate}</div>
          </div>

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
            <label className="form-label">Fecha del Pago</label>
            <input
              type="date"
              className="form-input"
              value={paymentForm.date}
              onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
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
              <option value="Transferencia Bancaria">Transferencia Bancaria (CBU / MercadoPago)</option>
              <option value="Efectivo">Efectivo en Gimnasio</option>
              <option value="Tarjeta de Débito / Crédito">Tarjeta Débito / Crédito</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notas o Comprobante (Opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Nro de transferencia 481923..."
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            />
          </div>

          <div style={{ background: "rgba(168, 255, 0, 0.08)", padding: "10px", borderRadius: "8px", fontSize: "0.8rem", color: "var(--accent-lime)", marginBottom: "20px" }}>
            💡 Al registrar este pago, el estado del alumno cambiará automáticamente a <strong>🟢 Al Día</strong> y se extenderá su vencimiento 30 días.
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setSelectedStudentForPay(null)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-lime">
              Confirmar y Registrar Pago
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
