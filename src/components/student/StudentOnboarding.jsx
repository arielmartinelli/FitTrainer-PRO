import React, { useState } from "react";
import { saveStudentQuestionnaire } from "../../services/storageService";
import { useAuth } from "../../context/AuthContext";
import {
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  User,
  Activity,
  Heart,
  Moon,
  Minus,
  Plus,
  CheckCircle2,
  Lock,
  Scale,
  Ruler,
  Calendar,
  Loader2
} from "lucide-react";

/**
 * Control numérico grande: dos botones táctiles de 48px + campo escribible + atajos.
 * Reemplaza a la "rueda" de 201 elementos que hacía setState en cada evento de scroll
 * y se trababa en el celular (además había que scrollear 90 items para llegar a 90 kg).
 */
const NumberStepper = ({ label, value, onChange, min = 0, max = 300, step = 1, unit, presets = [], decimals = 0, hint }) => {
  const clamp = (n) => Math.min(max, Math.max(min, n));
  const format = (n) => (decimals > 0 ? Number(n).toFixed(decimals) : String(Math.round(n)));

  const bump = (delta) => onChange(clamp(Number(value || 0) + delta));

  return (
    <div className="subtle-box" style={{ padding: "16px" }}>
      <label className="form-label" style={{ display: "block", marginBottom: "10px", textAlign: "center" }}>
        {label}
      </label>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
        <button
          type="button"
          onClick={() => bump(-step)}
          aria-label={`Disminuir ${label}`}
          style={{
            width: "48px",
            height: "48px",
            minWidth: "48px",
            borderRadius: "50%",
            border: "none",
            background: "var(--bg-card)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}
        >
          <Minus size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "baseline", gap: "4px", minWidth: "120px", justifyContent: "center" }}>
          <input
            type="text"
            inputMode="decimal"
            aria-label={label}
            value={value === 0 ? "" : format(value)}
            placeholder="0"
            onChange={(e) => {
              const raw = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "");
              onChange(raw === "" ? 0 : clamp(parseFloat(raw) || 0));
            }}
            style={{
              width: "100px",
              border: "none",
              background: "transparent",
              fontSize: "2.1rem",
              fontWeight: 800,
              color: "var(--accent-blue)",
              textAlign: "right",
              outline: "none",
              fontFamily: "inherit",
              padding: 0
            }}
          />
          <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>{unit}</span>
        </div>

        <button
          type="button"
          onClick={() => bump(step)}
          aria-label={`Aumentar ${label}`}
          style={{
            width: "48px",
            height: "48px",
            minWidth: "48px",
            borderRadius: "50%",
            border: "none",
            background: "var(--bg-card)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}
        >
          <Plus size={20} />
        </button>
      </div>

      {hint && (
        <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "6px" }}>{hint}</div>
      )}

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value || min}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} (deslizador)`}
        style={{ width: "100%", accentColor: "var(--accent-blue)", marginTop: "14px", height: "22px", cursor: "pointer" }}
      />

      {presets.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
          {presets.map((p) => (
            <button key={p} type="button" className="chip" data-active={Number(value) === p} onClick={() => onChange(p)}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const GenderPicker = ({ value, onChange }) => (
  <div className="segmented-2">
    <button type="button" className="seg-option" data-tone="male" data-active={value === "male"} onClick={() => onChange("male")}>
      👨 Masculino
    </button>
    <button type="button" className="seg-option" data-tone="female" data-active={value === "female"} onClick={() => onChange("female")}>
      👩 Femenino
    </button>
  </div>
);

const TOTAL_STEPS = 4;

export const StudentOnboarding = ({ student, onCompleted }) => {
  const { refreshData } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isAlreadyCompleted = !!student?.questionnaireCompleted;

  const [answers, setAnswers] = useState(
    student?.questionnaireData || {
      fullName: student?.name || "",
      gender: student?.gender || "male",
      age: 0,
      weightKg: 0,
      heightCm: 0,
      mainGoal: student?.goal || "Hipertrofia Muscular",
      injuries: "",
      favoriteExercises: "",
      dislikedExercises: "",
      experienceLevel: "Intermedio (6 meses a 2 años)",
      sleepHours: "7 - 8 horas",
      stressLevel: "Moderado",
      equipment: "Gimnasio comercial completo",
      availableDays: "4 días por semana"
    }
  );

  const update = (patch) => setAnswers((prev) => ({ ...prev, ...patch }));

  const validateStep = () => {
    if (step === 1) {
      if (!answers.fullName.trim()) return "Ingresá tu nombre completo.";
      if (!answers.age) return "Ingresá tu edad.";
      if (!answers.weightKg) return "Ingresá tu peso corporal.";
      if (!answers.heightCm) return "Ingresá tu altura.";
    }
    return "";
  };

  const handleNext = async (e) => {
    e.preventDefault();

    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    try {
      await saveStudentQuestionnaire(student.id, {
        ...answers,
        weightKg: Number(Number(answers.weightKg).toFixed(1)),
        heightCm: Math.round(Number(answers.heightCm)),
        age: Math.round(Number(answers.age))
      });
      await refreshData();
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el cuestionario. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Vista de solo lectura (ya completado) ---------- */
  if (isAlreadyCompleted && !isSubmitted) {
    const q = student?.questionnaireData || {};
    const metrics = [
      { Icon: User, label: "GÉNERO", value: q.gender === "female" ? "👩 Femenino" : "👨 Masculino", color: "var(--accent-blue)" },
      { Icon: Calendar, label: "EDAD", value: `${q.age || "-"} años`, color: "var(--accent-blue)" },
      { Icon: Scale, label: "PESO", value: `${q.weightKg || "-"} kg`, color: "var(--accent-green)" },
      { Icon: Ruler, label: "ALTURA", value: `${q.heightCm || "-"} cm`, color: "var(--accent-indigo)" }
    ];

    return (
      <div className="animate-fade-in" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="glass-panel" style={{ padding: "22px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                minWidth: "44px",
                borderRadius: "50%",
                background: "rgba(52,199,89,0.15)",
                border: "2px solid var(--accent-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <CheckCircle2 size={23} color="var(--accent-green)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Cuestionario completado</h2>
              <span className="badge badge-success" style={{ marginTop: "4px" }}>
                <Lock size={11} /> Guardado
              </span>
            </div>
          </div>

          <div
            className="subtle-box"
            style={{ fontSize: "0.83rem", color: "var(--text-secondary)", marginBottom: "18px", borderLeft: "4px solid var(--accent-green)" }}
          >
            🔒 Tus datos ya fueron enviados a tu entrenador. Si necesitás actualizar algo, pedile que te habilite el cuestionario de nuevo.
          </div>

          <div className="stat-grid">
            {metrics.map(({ Icon, label, value, color }) => (
              <div key={label} className="subtle-box" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Icon size={19} color={color} />
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontWeight: 700 }}>{label}</span>
                  <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="subtle-box" style={{ marginTop: "12px" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--accent-blue)", fontWeight: 700 }}>OBJETIVO PRINCIPAL</span>
            <div style={{ fontWeight: 700, fontSize: "0.92rem", marginTop: "2px" }}>{q.mainGoal || student.goal}</div>
          </div>

          <div className="subtle-box" style={{ marginTop: "10px" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--accent-red)", fontWeight: 700 }}>LESIONES DECLARADAS</span>
            <div style={{ fontWeight: 600, fontSize: "0.86rem", marginTop: "2px" }}>{q.injuries || "Sin lesiones ni molestias"}</div>
          </div>

          <button className="btn btn-lime btn-lg" style={{ width: "100%", borderRadius: "12px", marginTop: "20px" }} onClick={() => onCompleted?.()}>
            Ir a mi rutina <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Confirmación ---------- */
  if (isSubmitted) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: "540px", margin: "20px auto", textAlign: "center" }}>
        <div className="glass-panel" style={{ padding: "36px 22px" }}>
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "rgba(52,199,89,0.15)",
              border: "2px solid var(--accent-green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px"
            }}
          >
            <CheckCircle2 size={36} color="var(--accent-green)" />
          </div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "8px" }}>¡Cuestionario enviado!</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: "22px", lineHeight: 1.5 }}>
            Tu entrenador ya tiene tus métricas para armarte el plan personalizado.
          </p>
          <button className="btn btn-lime btn-lg" style={{ width: "100%", borderRadius: "12px" }} onClick={() => onCompleted?.()}>
            Ir a mi rutina <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Formulario por pasos ---------- */
  return (
    <div className="animate-fade-in" style={{ maxWidth: "620px", margin: "0 auto" }}>
      <div className="glass-panel" style={{ padding: "18px", marginBottom: "14px", borderLeft: "4px solid var(--accent-blue)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              minWidth: "40px",
              borderRadius: "50%",
              background: "rgba(0,122,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <ClipboardList size={21} color="var(--accent-blue)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Cuestionario inicial</h2>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Para que tu entrenador arme tu rutina.
            </span>
          </div>
        </div>

        <div style={{ width: "100%", height: "6px", background: "rgba(0,0,0,0.06)", borderRadius: "3px", overflow: "hidden", marginTop: "14px" }}>
          <div style={{ width: `${(step / TOTAL_STEPS) * 100}%`, height: "100%", background: "var(--accent-blue)", transition: "width 0.3s ease" }} />
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "right", marginTop: "4px" }}>
          Paso {step} de {TOTAL_STEPS}
        </div>
      </div>

      <form onSubmit={handleNext} className="glass-panel" style={{ padding: "18px" }}>
        {error && (
          <div
            role="alert"
            style={{
              padding: "10px 12px",
              background: "rgba(255,59,48,0.1)",
              border: "1px solid var(--accent-red)",
              borderRadius: "10px",
              color: "var(--accent-red)",
              fontSize: "0.82rem",
              marginBottom: "14px"
            }}
          >
            {error}
          </div>
        )}

        {/* PASO 1 */}
        {step === 1 && (
          <div className="animate-fade-in stack">
            <h3 style={{ fontSize: "1.05rem", color: "var(--accent-blue)", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} /> 1. Tus datos
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="q-name">Nombre completo</label>
              <input
                id="q-name"
                type="text"
                className="form-input"
                value={answers.fullName}
                onChange={(e) => update({ fullName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Género</label>
              <GenderPicker value={answers.gender} onChange={(gender) => update({ gender })} />
            </div>

            <NumberStepper
              label="🎂 EDAD"
              unit="años"
              value={answers.age}
              onChange={(age) => update({ age })}
              min={10}
              max={99}
              presets={[18, 25, 30, 40, 50]}
            />

            <NumberStepper
              label="⚖️ PESO CORPORAL"
              unit="kg"
              value={answers.weightKg}
              onChange={(weightKg) => update({ weightKg })}
              min={30}
              max={220}
              step={0.5}
              decimals={1}
              presets={[60, 70, 80, 90, 100]}
              hint="Podés escribir decimales, por ejemplo 78.5"
            />

            <NumberStepper
              label="📏 ALTURA"
              unit="cm"
              value={answers.heightCm}
              onChange={(heightCm) => update({ heightCm })}
              min={120}
              max={220}
              presets={[160, 170, 175, 180, 190]}
              hint={answers.heightCm ? `${(answers.heightCm / 100).toFixed(2)} m` : ""}
            />
          </div>
        )}

        {/* PASO 2 */}
        {step === 2 && (
          <div className="animate-fade-in stack">
            <h3 style={{ fontSize: "1.05rem", color: "var(--accent-blue)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={18} /> 2. Objetivo y salud
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="q-goal">Objetivo principal</label>
              <select id="q-goal" className="form-select" value={answers.mainGoal} onChange={(e) => update({ mainGoal: e.target.value })}>
                <option value="Hipertrofia Muscular">Hipertrofia muscular y masa</option>
                <option value="Pérdida de Grasa & Tonificación">Pérdida de grasa y tonificación</option>
                <option value="Fuerza Máxima">Fuerza máxima</option>
                <option value="Rendimiento Deportivo">Rendimiento deportivo</option>
                <option value="Salud & Movilidad">Salud y movilidad general</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="q-injuries">¿Tenés alguna dolencia, dolor o lesión?</label>
              <textarea
                id="q-injuries"
                className="form-textarea"
                placeholder="Ej: molestia en la rodilla derecha al bajar profundo. Si no tenés nada, escribí 'ninguna'."
                value={answers.injuries}
                onChange={(e) => update({ injuries: e.target.value })}
                required
              />
            </div>
          </div>
        )}

        {/* PASO 3 */}
        {step === 3 && (
          <div className="animate-fade-in stack">
            <h3 style={{ fontSize: "1.05rem", color: "var(--accent-blue)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Heart size={18} /> 3. Preferencias y experiencia
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="q-fav">Ejercicios que más te gustan</label>
              <input
                id="q-fav"
                type="text"
                className="form-input"
                placeholder="Press de banca, sentadillas, dominadas..."
                value={answers.favoriteExercises}
                onChange={(e) => update({ favoriteExercises: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="q-dislike">Ejercicios que preferís evitar</label>
              <input
                id="q-dislike"
                type="text"
                className="form-input"
                placeholder="Burpees, zancadas... o 'ninguno'"
                value={answers.dislikedExercises}
                onChange={(e) => update({ dislikedExercises: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="q-level">Nivel de experiencia</label>
              <select id="q-level" className="form-select" value={answers.experienceLevel} onChange={(e) => update({ experienceLevel: e.target.value })}>
                <option value="Principiante (Menos de 6 meses)">Principiante (menos de 6 meses)</option>
                <option value="Intermedio (6 meses a 2 años)">Intermedio (6 meses a 2 años)</option>
                <option value="Avanzado (Más de 2 años constante)">Avanzado (más de 2 años)</option>
              </select>
            </div>
          </div>
        )}

        {/* PASO 4 */}
        {step === 4 && (
          <div className="animate-fade-in stack">
            <h3 style={{ fontSize: "1.05rem", color: "var(--accent-blue)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Moon size={18} /> 4. Descanso y disponibilidad
            </h3>

            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="q-sleep">Horas de sueño</label>
                <select id="q-sleep" className="form-select" value={answers.sleepHours} onChange={(e) => update({ sleepHours: e.target.value })}>
                  <option value="Menos de 6 horas">Menos de 6 horas</option>
                  <option value="6 - 7 horas">6 - 7 horas</option>
                  <option value="7 - 8 horas">7 - 8 horas</option>
                  <option value="Más de 8 horas">Más de 8 horas</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="q-stress">Nivel de estrés</label>
                <select id="q-stress" className="form-select" value={answers.stressLevel} onChange={(e) => update({ stressLevel: e.target.value })}>
                  <option value="Bajo">Bajo</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Alto">Alto</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="q-equip">Equipamiento disponible</label>
              <select id="q-equip" className="form-select" value={answers.equipment} onChange={(e) => update({ equipment: e.target.value })}>
                <option value="Gimnasio comercial completo">Gimnasio comercial completo</option>
                <option value="Gimnasio de edificio / básico">Gimnasio de edificio / básico</option>
                <option value="En casa con mancuernas y bandas">En casa con mancuernas y bandas</option>
                <option value="Calistenia / Peso corporal">Calistenia / peso corporal</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="q-days">Días disponibles por semana</label>
              <select id="q-days" className="form-select" value={answers.availableDays} onChange={(e) => update({ availableDays: e.target.value })}>
                {[2, 3, 4, 5, 6].map((d) => (
                  <option key={d} value={`${d} días por semana`}>{d} días por semana</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "22px" }}>
          {step > 1 ? (
            <button type="button" className="btn btn-secondary" onClick={() => { setStep(step - 1); setError(""); }}>
              <ArrowLeft size={16} /> Anterior
            </button>
          ) : (
            <span />
          )}

          <button type="submit" className={`btn ${step === TOTAL_STEPS ? "btn-lime" : "btn-primary"}`} disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : null}
            {step === TOTAL_STEPS ? (saving ? "Guardando..." : "Guardar cuestionario") : "Siguiente"}
            {!saving && <ArrowRight size={16} />}
          </button>
        </div>
      </form>
    </div>
  );
};
