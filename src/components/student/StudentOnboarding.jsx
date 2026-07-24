import React, { useState } from "react";
import { saveStudentQuestionnaire } from "../../services/storageService";
import { useAuth } from "../../context/AuthContext";
import {
  ClipboardList,
  ArrowRight,
  User,
  Activity,
  Heart,
  Moon,
  Home,
  Scale,
  Ruler
} from "lucide-react";

export const StudentOnboarding = ({ student, onCompleted }) => {
  const { refreshData } = useAuth();
  const [step, setStep] = useState(1);

  const [answers, setAnswers] = useState(
    student?.questionnaireData || {
      fullName: student?.name || "",
      gender: student?.gender || "male",
      age: 25,
      weightKg: 70,
      heightCm: 175,
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
      saveStudentQuestionnaire(student.id, answers);
      refreshData();
      if (onCompleted) onCompleted();
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "600px", margin: "16px auto" }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: "20px", marginBottom: "16px", borderLeft: "4px solid var(--accent-blue)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(0,122,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ClipboardList size={22} color="var(--accent-blue)" />
          </div>
          <div>
            <h2 style={{ fontSize: "1.3rem" }}>Cuestionario de Diagnóstico Inicial</h2>
            <span style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
              Completa tus datos para que tu entrenador pueda diseñar tu plan a medida.
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

      {/* Form Steps */}
      <form onSubmit={handleNextStep} className="glass-panel" style={{ padding: "20px" }}>
        
        {/* PASO 1: Datos Personales & Género (Nombre, Género, Edad, Peso, Altura) */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: "1.1rem", color: "var(--accent-blue)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} /> 1. Datos Personales & Biométricos
            </h3>

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

            {/* Selector de Género */}
            <div className="form-group">
              <label className="form-label">Género</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className={`btn ${answers.gender === "male" ? "btn-primary" : "btn-secondary"}`}
                  style={{ flex: 1, padding: "12px", borderRadius: "12px" }}
                  onClick={() => setAnswers({ ...answers, gender: "male" })}
                >
                  👨 Masculino
                </button>
                <button
                  type="button"
                  className={`btn ${answers.gender === "female" ? "btn-lime" : "btn-secondary"}`}
                  style={{ flex: 1, padding: "12px", borderRadius: "12px", background: answers.gender === "female" ? "#FF2D55" : "" }}
                  onClick={() => setAnswers({ ...answers, gender: "female" })}
                >
                  👩 Femenino
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div className="form-group">
                <label className="form-label">Edad</label>
                <input
                  type="number"
                  className="form-input"
                  value={answers.age}
                  onChange={(e) => setAnswers({ ...answers, age: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={answers.weightKg}
                  onChange={(e) => setAnswers({ ...answers, weightKg: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Altura (cm)</label>
                <input
                  type="number"
                  className="form-input"
                  value={answers.heightCm}
                  onChange={(e) => setAnswers({ ...answers, heightCm: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Objetivo y Salud / Lesiones */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: "1.1rem", color: "var(--accent-blue)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
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
          <div className="animate-fade-in">
            <h3 style={{ fontSize: "1.1rem", color: "var(--accent-blue)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
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
          <div className="animate-fade-in">
            <h3 style={{ fontSize: "1.1rem", color: "var(--accent-blue)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Moon size={18} /> 4. Sueño, Estrés & Disponibilidad
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "20px" }}>
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
