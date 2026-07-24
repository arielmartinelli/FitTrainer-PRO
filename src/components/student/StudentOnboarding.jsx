import React, { useState, useRef } from "react";
import { saveStudentQuestionnaire } from "../../services/storageService";
import { useAuth } from "../../context/AuthContext";
import {
  ClipboardList,
  ArrowRight,
  User,
  Activity,
  Heart,
  Moon,
  Plus,
  Minus,
  CheckCircle2
} from "lucide-react";

export const StudentOnboarding = ({ student, onCompleted }) => {
  const { refreshData } = useAuth();
  const [step, setStep] = useState(1);

  // Inicialización de respuestas con todos los datos métricos en 0 por defecto
  const [answers, setAnswers] = useState(
    student?.questionnaireData || {
      fullName: student?.name || "",
      gender: student?.gender || "male",
      age: 0,
      weightKg: 0,
      weightGrams: 0,
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

  const handleNextStep = (e) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Calcular peso total combinado
      const totalWeight = Number(answers.weightKg) + Number(answers.weightGrams) / 1000;
      const finalAnswers = {
        ...answers,
        weightKg: Number(totalWeight.toFixed(2))
      };

      saveStudentQuestionnaire(student.id, finalAnswers);
      refreshData();
      if (onCompleted) onCompleted();
    }
  };

  // Ajustar Edad
  const updateAge = (delta) => {
    setAnswers((prev) => ({
      ...prev,
      age: Math.max(0, Math.min(100, Number(prev.age || 0) + delta))
    }));
  };

  // Ajustar Kilos de Peso
  const updateWeightKg = (delta) => {
    setAnswers((prev) => ({
      ...prev,
      weightKg: Math.max(0, Math.min(250, Number(prev.weightKg || 0) + delta))
    }));
  };

  // Ajustar Gramos de Peso (en pasos de 100g)
  const updateWeightGrams = (delta) => {
    setAnswers((prev) => {
      let currentGrams = Number(prev.weightGrams || 0) + delta;
      let extraKg = 0;
      if (currentGrams >= 1000) {
        extraKg = 1;
        currentGrams = 0;
      } else if (currentGrams < 0) {
        if (prev.weightKg > 0) {
          extraKg = -1;
          currentGrams = 900;
        } else {
          currentGrams = 0;
        }
      }
      return {
        ...prev,
        weightKg: Math.max(0, Number(prev.weightKg || 0) + extraKg),
        weightGrams: currentGrams
      };
    });
  };

  // Ajustar Altura en CM
  const updateHeightCm = (delta) => {
    setAnswers((prev) => ({
      ...prev,
      heightCm: Math.max(0, Math.min(230, Number(prev.heightCm || 0) + delta))
    }));
  };

  // Total de peso formateado para visualización
  const totalWeightFormatted = (Number(answers.weightKg || 0) + Number(answers.weightGrams || 0) / 1000).toFixed(1);

  return (
    <div className="animate-fade-in" style={{ maxWidth: "620px", margin: "16px auto" }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: "20px", marginBottom: "16px", borderLeft: "4px solid var(--accent-blue)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(0,122,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ClipboardList size={22} color="var(--accent-blue)" />
          </div>
          <div>
            <h2 style={{ fontSize: "1.3rem", margin: 0 }}>Cuestionario de Diagnóstico Inicial</h2>
            <span style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
              Completa tus métricas para que tu entrenador cree tu rutina personalizada.
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: "100%", height: "6px", background: "rgba(0,0,0,0.06)", borderRadius: "3px", overflow: "hidden", marginTop: "14px" }}>
          <div style={{ width: `${(step / 4) * 100}%`, height: "100%", background: "var(--accent-blue)", transition: "width 0.3s ease" }} />
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "right", marginTop: "4px" }}>
          Paso {step} de 4
        </div>
      </div>

      {/* Form Steps Container */}
      <form onSubmit={handleNextStep} className="glass-panel" style={{ padding: "24px" }}>
        
        {/* PASO 1: Datos Personales con Contadores Dinámicos e Interactivos */}
        {step === 1 && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3 style={{ fontSize: "1.1rem", color: "var(--accent-blue)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} /> 1. Datos Personales & Métricas Interactivas
            </h3>

            {/* Nombre Completo */}
            <div className="form-group">
              <label className="form-label">Nombre Completo</label>
              <input
                type="text"
                className="form-input"
                value={answers.fullName}
                onChange={(e) => setAnswers({ ...answers, fullName: e.target.value })}
                required
              />
            </div>

            {/* Selector de Género Estilo iOS Segmented Control */}
            <div className="form-group">
              <label className="form-label">Género del Alumno</label>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                background: "#F2F2F7",
                padding: "4px",
                borderRadius: "12px"
              }}>
                <button
                  type="button"
                  onClick={() => setAnswers({ ...answers, gender: "male" })}
                  style={{
                    border: "none",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.16s ease",
                    background: answers.gender === "male" ? "#007AFF" : "transparent",
                    color: answers.gender === "male" ? "#FFFFFF" : "var(--text-secondary)",
                    boxShadow: answers.gender === "male" ? "0 2px 8px rgba(0,122,255,0.3)" : "none"
                  }}
                >
                  👨 Masculino
                </button>

                <button
                  type="button"
                  onClick={() => setAnswers({ ...answers, gender: "female" })}
                  style={{
                    border: "none",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.16s ease",
                    background: answers.gender === "female" ? "#FF2D55" : "transparent",
                    color: answers.gender === "female" ? "#FFFFFF" : "var(--text-secondary)",
                    boxShadow: answers.gender === "female" ? "0 2px 8px rgba(255,45,85,0.3)" : "none"
                  }}
                >
                  👩 Femenino
                </button>
              </div>
            </div>

            {/* CONTADOR INTERACTIVO 1: EDAD */}
            <div style={{ background: "#F2F2F7", padding: "18px", borderRadius: "16px", textAlign: "center" }}>
              <label className="form-label" style={{ marginBottom: "8px", display: "block", color: "var(--text-secondary)" }}>🎂 EDAD (AÑOS)</label>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => updateAge(-1)}
                  style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#FFF", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Minus size={20} color="var(--text-primary)" />
                </button>

                <div style={{ minWidth: "100px" }}>
                  <span style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--accent-blue)" }}>{answers.age}</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginLeft: "4px" }}>años</span>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => updateAge(1)}
                  style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#FFF", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Plus size={20} color="var(--text-primary)" />
                </button>
              </div>

              {/* Botones Rápidos de Edad */}
              <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "12px", flexWrap: "wrap" }}>
                {[18, 22, 25, 30, 35, 40].map((presetAge) => (
                  <button
                    key={presetAge}
                    type="button"
                    onClick={() => setAnswers({ ...answers, age: presetAge })}
                    style={{
                      border: "none",
                      padding: "4px 10px",
                      borderRadius: "14px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      background: answers.age === presetAge ? "var(--accent-blue)" : "#E5E5EA",
                      color: answers.age === presetAge ? "#FFF" : "var(--text-primary)"
                    }}
                  >
                    {presetAge}
                  </button>
                ))}
              </div>
            </div>

            {/* CONTADOR INTERACTIVO 2: PESO (KILOS Y GRAMOS) */}
            <div style={{ background: "#F2F2F7", padding: "18px", borderRadius: "16px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <label className="form-label" style={{ margin: 0, color: "var(--text-secondary)" }}>⚖️ PESO CORPORAL</label>
                <span className="badge badge-blue" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  Total: {totalWeightFormatted} kg
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                
                {/* Control Kilos */}
                <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>KILOS</span>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => updateWeightKg(-1)}
                      style={{ borderRadius: "50%", width: "32px", height: "32px", padding: 0 }}
                    >
                      <Minus size={16} />
                    </button>
                    <span style={{ fontSize: "1.4rem", fontWeight: 800 }}>{answers.weightKg} <small style={{ fontSize: "0.75rem" }}>kg</small></span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => updateWeightKg(1)}
                      style={{ borderRadius: "50%", width: "32px", height: "32px", padding: 0 }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Control Gramos */}
                <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>GRAMOS</span>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => updateWeightGrams(-100)}
                      style={{ borderRadius: "50%", width: "32px", height: "32px", padding: 0 }}
                    >
                      <Minus size={16} />
                    </button>
                    <span style={{ fontSize: "1.4rem", fontWeight: 800 }}>{answers.weightGrams} <small style={{ fontSize: "0.75rem" }}>g</small></span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => updateWeightGrams(100)}
                      style={{ borderRadius: "50%", width: "32px", height: "32px", padding: 0 }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* RODILLO / DIAL INTERACTIVO 3: ALTURA EN CENTÍMETROS */}
            <div style={{ background: "#F2F2F7", padding: "18px", borderRadius: "16px", textAlign: "center" }}>
              <label className="form-label" style={{ marginBottom: "8px", display: "block", color: "var(--text-secondary)" }}>📏 ALTURA (CENTÍMETROS)</label>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "12px" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => updateHeightCm(-1)}
                  style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#FFF", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Minus size={18} />
                </button>

                <div>
                  <span style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--accent-blue)" }}>{answers.heightCm}</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginLeft: "4px" }}>cm</span>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>({(answers.heightCm / 100).toFixed(2)} m)</div>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => updateHeightCm(1)}
                  style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#FFF", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Slider de Rodillo / Regla Estilo iOS/Android Wheel */}
              <div style={{ position: "relative", padding: "10px 0" }}>
                <input
                  type="range"
                  min="0"
                  max="220"
                  value={answers.heightCm}
                  onChange={(e) => setAnswers({ ...answers, heightCm: Number(e.target.value) })}
                  style={{
                    width: "100%",
                    accentColor: "var(--accent-blue)",
                    height: "8px",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                />
                
                {/* Visual Ticks de la Regla */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                  <span>0 cm</span>
                  <span>140 cm</span>
                  <span>170 cm</span>
                  <span>200 cm</span>
                  <span>220 cm</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* PASO 2: Objetivo y Salud / Lesiones */}
        {step === 2 && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", color: "var(--accent-blue)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={18} /> 2. Objetivo Principal & Historial de Salud
            </h3>

            <div className="form-group">
              <label className="form-label">Objetivo Principal</label>
              <select
                className="form-select"
                value={answers.mainGoal}
                onChange={(e) => setAnswers({ ...answers, mainGoal: e.target.value })}
              >
                <option value="Hipertrofia Muscular">Hipertrofia Muscular & Masa</option>
                <option value="Pérdida de Grasa & Tonificación">Pérdida de Grasa & Tonificación</option>
                <option value="Fuerza Máxima">Fuerza Máxima</option>
                <option value="Rendimiento Deportivo">Rendimiento Deportivo</option>
                <option value="Salud & Movilidad">Salud & Movilidad General</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">¿Posees alguna dolencia, dolor o lesión previa/actual?</label>
              <textarea
                className="form-textarea"
                placeholder="Ej: Leve molestia en rodilla derecha al bajar profundo, molestia lumbar o ninguna..."
                value={answers.injuries}
                onChange={(e) => setAnswers({ ...answers, injuries: e.target.value })}
                required
              />
            </div>
          </div>
        )}

        {/* PASO 3: Preferencias de Ejercicios y Nivel */}
        {step === 3 && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", color: "var(--accent-blue)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Heart size={18} /> 3. Gustos de Ejercicios & Experiencia
            </h3>

            <div className="form-group">
              <label className="form-label">¿Qué ejercicios te gustan más o prefieres hacer?</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Press de banca, Sentadillas, Dominadas, Hip thrust..."
                value={answers.favoriteExercises}
                onChange={(e) => setAnswers({ ...answers, favoriteExercises: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">¿Qué ejercicios prefieres evitar u odias?</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Burpees, Zancadas caminadas, Ninguno..."
                value={answers.dislikedExercises}
                onChange={(e) => setAnswers({ ...answers, dislikedExercises: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nivel de Experiencia</label>
              <select
                className="form-select"
                value={answers.experienceLevel}
                onChange={(e) => setAnswers({ ...answers, experienceLevel: e.target.value })}
              >
                <option value="Principiante (Menos de 6 meses)">Principiante (Menos de 6 meses)</option>
                <option value="Intermedio (6 meses a 2 años)">Intermedio (6 meses a 2 años)</option>
                <option value="Avanzado (Más de 2 años constante)">Avanzado (Más de 2 años constante)</option>
              </select>
            </div>
          </div>
        )}

        {/* PASO 4: Hábitos y Disponibilidad */}
        {step === 4 && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", color: "var(--accent-blue)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Moon size={18} /> 4. Sueño, Estrés & Disponibilidad
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              <div className="form-group">
                <label className="form-label">Horas de Sueño</label>
                <select
                  className="form-select"
                  value={answers.sleepHours}
                  onChange={(e) => setAnswers({ ...answers, sleepHours: e.target.value })}
                >
                  <option value="Menos de 6 horas">Menos de 6 horas</option>
                  <option value="6 - 7 horas">6 - 7 horas</option>
                  <option value="7 - 8 horas">7 - 8 horas</option>
                  <option value="Más de 8 horas">Más de 8 horas</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nivel de Estrés</label>
                <select
                  className="form-select"
                  value={answers.stressLevel}
                  onChange={(e) => setAnswers({ ...answers, stressLevel: e.target.value })}
                >
                  <option value="Bajo">Bajo</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Alto">Alto</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Equipamiento Disponible</label>
              <select
                className="form-select"
                value={answers.equipment}
                onChange={(e) => setAnswers({ ...answers, equipment: e.target.value })}
              >
                <option value="Gimnasio comercial completo">Gimnasio comercial completo</option>
                <option value="Gimnasio de edificio / básico">Gimnasio de edificio / básico</option>
                <option value="En casa con mancuernas y bandas">En casa con mancuernas y bandas</option>
                <option value="Calistenia / Peso corporal">Calistenia / Peso corporal</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Días Disponibles por Semana</label>
              <select
                className="form-select"
                value={answers.availableDays}
                onChange={(e) => setAnswers({ ...answers, availableDays: e.target.value })}
              >
                <option value="2 días por semana">2 días por semana</option>
                <option value="3 días por semana">3 días por semana</option>
                <option value="4 días por semana">4 días por semana</option>
                <option value="5 días por semana">5 días por semana</option>
                <option value="6 días por semana">6 días por semana</option>
              </select>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "24px" }}>
          {step > 1 ? (
            <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>
              Anterior
            </button>
          ) : <div />}

          <button type="submit" className="btn btn-primary">
            {step === 4 ? "Guardar Cuestionario" : "Siguiente"} <ArrowRight size={16} />
          </button>
        </div>

      </form>

    </div>
  );
};
