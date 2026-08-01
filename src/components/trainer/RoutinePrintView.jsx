import React, { useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { Modal } from "../common/Modal";
import { Download, Send, Copy, Zap, User, Dumbbell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const RoutinePrintView = ({ isOpen, onClose, routine, student }) => {
  const { currentUser } = useAuth();
  const pdfRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  if (!routine) return null;

  const trainerName = currentUser?.name || "Entrenador FitTrainer";
  const studentName = student?.name || "Alumno / Plantilla Generica";

  const handleDownloadPDF = async () => {
    const element = pdfRef.current;
    if (!element || generating) return;
    setGenerating(true);

    const opt = {
      margin: [10, 10, 10, 10], // top, left, bottom, right in mm
      filename: `Rutina_${studentName.replace(/\s+/g, "_")}_${routine.title.replace(/\s+/g, "_")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
      alert("No se pudo generar el PDF. Probá de nuevo.");
    } finally {
      setGenerating(false);
    }
  };

  const generateWhatsAppMessage = () => {
    let msg = `🏋️ *RUTINA DE ENTRENAMIENTO - ${routine.title.toUpperCase()}*\n`;
    msg += `👨‍🏫 Profesor: ${trainerName}\n`;
    msg += `🏋️ Alumno: ${studentName}\n`;
    msg += `🎯 Categoría: ${routine.category || "Hipertrofia"} (${routine.durationWeeks || 6} Semanas)\n`;
    if (routine.description) msg += `📝 ${routine.description}\n`;
    msg += `-----------------------------------\n\n`;

    routine.days?.forEach((d) => {
      msg += `📌 *${d.dayName.toUpperCase()}*\n`;
      d.exercises?.forEach((ex, idx) => {
        msg += `${idx + 1}. *${ex.name}* -> ${ex.sets} series x ${ex.reps} (${ex.restSec}s desc.) [${ex.rpe || "RPE 8"}]\n`;
        if (ex.notes) msg += `   💡 _${ex.notes}_\n`;
        if (ex.videoUrl) msg += `   🎥 _Video: ${ex.videoUrl}_\n`;
      });
      msg += `\n`;
    });

    msg += `💪 ¡A entrenar con todo! Generado con FitTrainer PRO.`;
    return msg;
  };

  const handleCopyWhatsAppText = () => {
    navigator.clipboard.writeText(generateWhatsAppMessage());
    alert("📋 Texto de rutina copiado para enviar por WhatsApp.");
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    // Si la rutina es de un alumno concreto, se abre directo su chat.
    const phone = (student?.phone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Descargar Rutina en PDF / WhatsApp" maxWidth="750px">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Actions Bar */}
        <div className="action-row subtle-box" style={{ justifyContent: "space-between" }}>
          <button className="btn btn-lime" onClick={handleDownloadPDF} disabled={generating}>
            <Download size={18} /> {generating ? "Generando..." : "Descargar PDF"}
          </button>
          
          <div className="action-row">
            <button className="btn btn-secondary btn-sm" onClick={handleCopyWhatsAppText}>
              <Copy size={14} /> Copiar Texto
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleOpenWhatsApp}>
              <Send size={14} /> Enviar WhatsApp
            </button>
          </div>
        </div>

        {/* Clean PDF Content Container (Only Trainer, Student, and Routine - No Screen UI) */}
        <div
          ref={pdfRef}
          className="print-area"
          style={{
            background: "#FFFFFF",
            padding: "24px 28px",
            border: "1px solid var(--border-subtle)",
            borderRadius: "12px",
            color: "#1C1C1E",
            fontFamily: "Inter, sans-serif"
          }}
        >
          {/* Header Branding */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #007AFF", paddingBottom: "12px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap size={26} color="#007AFF" strokeWidth={2.6} />
              <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1C1C1E" }}>FitTrainer PRO</span>
            </div>
            <span style={{ fontSize: "0.8rem", color: "#8E8E93", fontWeight: 600 }}>PLAN DE ENTRENAMIENTO</span>
          </div>

          {/* Trainer & Student Info Card */}
          <div className="grid-2" style={{ background: "#F2F2F7", padding: "12px 16px", borderRadius: "10px", marginBottom: "18px" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#8E8E93", fontWeight: 700, textTransform: "uppercase" }}>ENTRENADOR / PROFESOR</div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#007AFF" }}>👨‍🏫 {trainerName}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#8E8E93", fontWeight: 700, textTransform: "uppercase" }}>ALUMNO / CLIENTE</div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#34C759" }}>🏋️ {studentName}</div>
            </div>
          </div>

          {/* Routine Title & Meta */}
          <div style={{ marginBottom: "18px" }}>
            <h2 style={{ fontSize: "1.35rem", color: "#1C1C1E", margin: "0 0 4px 0" }}>{routine.title}</h2>
            <div style={{ fontSize: "0.85rem", color: "#666" }}>
              Programa de <strong>{routine.durationWeeks || 6} Semanas</strong> • Categoría: <strong>{routine.category || "Hipertrofia"}</strong>
            </div>
            {routine.description && (
              <p style={{ fontSize: "0.825rem", color: "#444", marginTop: "6px", fontStyle: "italic" }}>
                {routine.description}
              </p>
            )}
          </div>

          {/* Days & Exercises List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {routine.days?.map((d, dIdx) => (
              <div key={dIdx} style={{ background: "#FAFAFC", border: "1px solid #E5E5EA", padding: "14px", borderRadius: "10px" }}>
                <h3 style={{ fontSize: "1.05rem", color: "#007AFF", marginTop: 0, marginBottom: "10px", borderBottom: "1px solid #E5E5EA", paddingBottom: "6px" }}>
                  📌 {d.dayName}
                </h3>
                
                <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: "460px", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ background: "#E5E5EA", textAlign: "left", color: "#333", fontSize: "0.75rem" }}>
                      <th style={{ padding: "6px 8px" }}>#</th>
                      <th style={{ padding: "6px 8px" }}>Ejercicio</th>
                      <th style={{ padding: "6px 8px" }}>Series x Reps</th>
                      <th style={{ padding: "6px 8px" }}>Descanso</th>
                      <th style={{ padding: "6px 8px" }}>RPE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.exercises?.map((ex, eIdx) => (
                      <tr key={eIdx} style={{ borderBottom: "1px solid #E5E5EA" }}>
                        <td style={{ padding: "8px", fontWeight: 700, width: "24px" }}>{eIdx + 1}</td>
                        <td style={{ padding: "8px" }}>
                          <div style={{ fontWeight: 700, color: "#1C1C1E" }}>{ex.name}</div>
                          {ex.notes && <div style={{ fontSize: "0.75rem", color: "var(--accent-blue)" }}>💡 {ex.notes}</div>}
                          {ex.videoUrl && <div style={{ fontSize: "0.7rem", color: "#007AFF" }}>🎥 {ex.videoUrl}</div>}
                        </td>
                        <td style={{ padding: "8px", fontWeight: 600 }}>{ex.sets} x {ex.reps}</td>
                        <td style={{ padding: "8px" }}>{ex.restSec}s</td>
                        <td style={{ padding: "8px" }}>{ex.rpe || "RPE 8"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>

              </div>
            ))}
          </div>

          <div style={{ marginTop: "20px", paddingTop: "12px", borderTop: "1px solid #E5E5EA", textAlign: "center", fontSize: "0.75rem", color: "#8E8E93" }}>
            FitTrainer PRO • Software de Gestión de Entrenamientos
          </div>

        </div>

      </div>
    </Modal>
  );
};
