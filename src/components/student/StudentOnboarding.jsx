import React, { useState, useEffect, useRef } from "react";
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
  Minus
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

  const kgWheelRef = useRef(null);
  const gmWheelRef = useRef(null);

  // Auto-scroll para las ruedas de peso al seleccionar
  useEffect(() => {
    if (kgWheelRef.current) {
      const selectedKgEl = kgWheelRef.current.children[answers.weightKg];
      if (selectedKgEl) {
        kgWheelRef.current.scrollTop = selectedKgEl.offsetTop - kgWheelRef.current.clientHeight / 2 + 16;
      }
    }
  }, [answers.weightKg, step]);

  useEffect(() => {
    if (gmWheelRef.current) {
      const gmIndex = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900].indexOf(answers.weightGrams);
      if (gmIndex >= 0 && gmWheelRef.current.children[gmIndex]) {
        const selectedGmEl = gmWheelRef.current.children[gmIndex];
        gmWheelRef.current.scrollTop = selectedGmEl.offsetTop - gmWheelRef.current.clientHeight / 2 + 16;
      }
    }
  }, [answers.weightGrams, step]);

  const handleNextStep = (e) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
    } else {
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

  // Ajustar Altura en CM
  const updateHeightCm = (delta) => {
    setAnswers((prev) => ({
      ...prev,
      heightCm: Math.max(0, Math.min(230, Number(prev.heightCm || 0) + delta))
    }));
  };

  // Total de peso para la insignia de visualización
  const totalWeightDisplay = (Number(answers.weightKg || 0) + Number(answers.weightGrams || 0) / 1000).toFixed(1);

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
        
        {/* PASO 1: Datos Personales con Ruedas de Peso e Interactivos */}
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

            {/* RUEDA DOBLE DE PESO CORPORAL (RUEDA 1: KILOS | RUEDA 2: GRAMOS) */}
            <div style={{ background: "#F2F2F7", padding: "18px", borderRadius: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <label className="form-label" style={{ margin: 0, color: "var(--text-secondary)" }}>⚖️ PESO CORPORAL (RUEDA KG & GRAMOS)</label>
                <span className="badge badge-blue" style={{ fontSize: "0.9rem", fontWeight: 800, padding: "4px 10px" }}>
                  {totalWeightDisplay} kg
                </span>
              </div>

              {/* RUEDA DOBLE TIPO DRUM PICKER DE IPHONE */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                
                {/* RUEDA 1: KILOS */}
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, display: "block", marginBottom: "4px" }}>RUEDA KILOS (0 a 200 KG)</span>
                  <div
                    ref={kgWheelRef}
                    style={{
                      height: "150px",
                      overflowY: "scroll",
                      background: "#FFFFFF",
                      borderRadius: "12px",
                      border: "2px solid var(--accent-blue)",
                      boxShadow: "inset 0 4px 12px rgba(0,0,0,0.06)",
                      scrollSnapType: "y mandatory"
                    }}
                  >
                    {Array.from({ length: 201 }, (_, i) => i).map((kg) => (
                      <div
                        key={kg}
                        onClick={() => setAnswers({ ...answers, weightKg: kg })}
                        style={{
                          padding: "10px 0",
                          scrollSnapAlign: "center",
                          fontWeight: answers.weightKg === kg ? 800 : 400,
                          fontSize: answers.weightKg === kg ? "1.3rem" : "0.9rem",
                          color: answers.weightKg === kg ? "#007AFF" : "var(--text-secondary)",
                          background: answers.weightKg === kg ? "rgba(0,122,255,0.12)" : "transparent",
                          cursor: "pointer",
                          transition: "all 0.12s ease"
                        }}
                      >
                        {kg} kg
                      </div>
                    ))}
                  </div>
                </div>

                {/* RUEDA 2: GRAMOS */}
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, display: "block", marginBottom: "4px" }}>RUEDA GRAMOS (0 a 900 GR)</span>
                  <div
                    ref={gmWheelRef}
                    style={{
                      height: "150px",
                      overflowY: "scroll",
                      background: "#FFFFFF",
                      borderRadius: "12px",
                      border: "2px solid #FF2D55",
                      boxShadow: "inset 0 4px 12px rgba(0,0,0,0.06)",
                      scrollSnapType: "y mandatory"
                    }}
                  >
                    {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((gm) => (
                      <div
                        key={gm}
                        onClick={() => setAnswers({ ...answers, weightGrams: gm })}
                        style={{
                          padding: "10px 0",
                          scrollSnapAlign: "center",
                          fontWeight: answers.weightGrams === gm ? 800 : 400,
                          fontSize: answers.weightGrams === gm ? "1.3rem" : "0.9rem",
                          color: answers.weightGrams === gm ? "#FF2D55" : "var(--text-secondary)",
                          background: answers.weightGrams === gm ? "rgba(255,45,85,0.12)" : "transparent",
                          cursor: "pointer",
                          transition: "all 0.12s ease"
                        }}
                      >
                        .{gm / 100} ({gm} g)
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Botones de Salto Rápido de Peso */}
              <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "12px", flexWrap: "wrap" }}>
                {[50, 60, 70, 80, 90, 100, 110].map((presetW) => (
                  <button
                    key={presetW}
                    type="button"
                    onClick={() => setAnswers({ ...answers, weightKg: presetW })}
                    style={{
                      border: "none",
                      padding: "5px 12px",
                      borderRadius: "14px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      background: answers.weightKg === presetW ? "var(--accent-blue)" : "#E5E5EA",
                      color: answers.weightKg === presetW ? "#FFF" : "var(--text-primary)"
                    }}
                  >
                    {presetW} kg
                  </button>
                ))}
              </div>
            </div>

            {/* RODILLO / DIAL INTERACTIVO 3: ALTURA EN CENTÍMETROS CON BOTONES GRANDES (48px) */}
            <div style={{ background: "#F2F2F7", padding: "18px", borderRadius: "16px", textAlign: "center" }}>
              <label className="form-label" style={{ marginBottom: "8px", display: "block", color: "var(--text-secondary)" }}>📏 ALTURA (CENTÍMETROS)</label>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginBottom: "12px" }}>
                {/* BOTÓN MENOS AGRANDADO A 48px IGUAL AL DE LA EDAD */}
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => updateHeightCm(-1)}
                  style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#FFF", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Minus size={20} color="var(--text-primary)" />
                </button>

                <div>
                  <span style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--accent-blue)" }}>{answers.heightCm}</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginLeft: "4px" }}>cm</span>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>({(answers.heightCm / 100).toFixed(2)} m)</div>
                </div>

                {/* BOTÓN MÁS AGRANDADO A 48px IGUAL AL DE LA EDAD */}
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => updateHeightCm(1)}
                  style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#FFF", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Plus size={20} color="var(--text-primary)" />
                </button>
              </div>

              {/* Slider de Rodillo de Altura */}
              <div style={{ position: "relative", padding: "8px 0" }}>
                <input
                  type="range"
                  min="0"
                  max="220"
                  value={answers.heightCm}
                  onChange={(e) => setAnswers({ ...answers, heightCm: Number(e.target.value) })}
                  style={{
                    width: "100%",
                    accentColor: "var(--accent-blue)",
                    height: "10px",
                    borderRadius: "5px",
                    cursor: "pointer"
                  }}
                />
                
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  <span>0 cm</span>
                  <span>140 cm</span>
                  <span>170 cm</span>
                  <span>200 cm</span>
                  <span>220 cm</span>
                </div>
              </div>

              {/* Botones Rápidos de Altura */}
              <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "12px", flexWrap: "wrap" }}>
                {[155, 165, 170, 175, 180, 185, 190].map((presetH) => (
                  <button
                    key={presetH}
                    type="button"
                    onClick={() => setAnswers({ ...answers, heightCm: presetH })}
                    style={{
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "14px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      background: answers.heightCm === presetH ? "var(--accent-blue)" : "#E5E5EA",
                      color: answers.heightCm === presetH ? "#FFF" : "var(--text-primary)"
                    }}
                  >
                    {presetH} cm
                  </button>
                ))}
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
