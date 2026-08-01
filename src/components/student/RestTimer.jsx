import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, X, GripHorizontal } from "lucide-react";
import { Portal } from "../common/Portal";

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= breakpoint);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
};

/**
 * Cronómetro de descanso.
 * En celular es una barra fija sobre la navegación inferior (antes era una ventana
 * arrastrable de 300px fijos que tapaba el ejercicio y quedaba mal posicionada).
 * En escritorio se mantiene flotante y arrastrable.
 */
export const RestTimer = ({ defaultSeconds = 90, onClose }) => {
  const isMobile = useIsMobile();
  const [totalSeconds, setTotalSeconds] = useState(defaultSeconds);
  const [secondsLeft, setSecondsLeft] = useState(defaultSeconds);
  const [isActive, setIsActive] = useState(true);
  const [finished, setFinished] = useState(false);

  const playBeep = useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
      setTimeout(() => ctx.close?.(), 1200);
    } catch (err) {
      console.warn("No se pudo reproducir el sonido de descanso.", err);
    }
  }, []);

  useEffect(() => {
    if (!isActive || secondsLeft <= 0) return;
    const interval = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  useEffect(() => {
    if (secondsLeft > 0 || finished) return;
    setFinished(true);
    setIsActive(false);
    playBeep();
    navigator.vibrate?.([200, 100, 200]);
  }, [secondsLeft, finished, playBeep]);

  const addSeconds = (extra) => {
    setSecondsLeft((prev) => Math.max(0, prev) + extra);
    setTotalSeconds((prev) => prev + extra);
    setFinished(false);
    setIsActive(true);
  };

  const reset = () => {
    setSecondsLeft(totalSeconds);
    setFinished(false);
    setIsActive(true);
  };

  const formatTime = (secs) => {
    const safe = Math.max(0, secs);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const progressPct = totalSeconds > 0 ? Math.min(100, ((totalSeconds - Math.max(0, secondsLeft)) / totalSeconds) * 100) : 0;
  const timeColor = finished ? "var(--accent-green)" : "#FFFFFF";

  const controls = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", minWidth: 0 }}>
          <span style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", color: timeColor, lineHeight: 1 }}>
            {formatTime(secondsLeft)}
          </span>
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
            {finished ? "¡A la siguiente serie!" : "descanso"}
          </span>
        </div>

        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <button className="btn btn-sm" onClick={() => addSeconds(15)} style={{ background: "rgba(255,255,255,0.16)", color: "#FFF" }}>
            +15s
          </button>
          <button className="btn btn-sm" onClick={() => addSeconds(30)} style={{ background: "rgba(255,255,255,0.16)", color: "#FFF" }}>
            +30s
          </button>
        </div>
      </div>

      <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.18)", borderRadius: "2px", overflow: "hidden", margin: "10px 0" }}>
        <div
          style={{
            width: `${progressPct}%`,
            height: "100%",
            background: finished ? "var(--accent-green)" : "var(--accent-blue)",
            transition: "width 1s linear"
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button className={`btn btn-sm ${isActive ? "btn-secondary" : "btn-lime"}`} style={{ flex: 1 }} onClick={() => setIsActive(!isActive)}>
          {isActive ? <Pause size={15} /> : <Play size={15} />} {isActive ? "Pausar" : "Reanudar"}
        </button>
        <button className="btn btn-sm" onClick={reset} style={{ background: "rgba(255,255,255,0.16)", color: "#FFF" }} aria-label="Reiniciar descanso">
          <RotateCcw size={15} />
        </button>
        <button className="btn btn-sm" onClick={onClose} style={{ background: "rgba(255,255,255,0.16)", color: "#FFF" }} aria-label="Cerrar cronómetro">
          <X size={15} />
        </button>
      </div>
    </>
  );

  // Portal: si no, cualquier ancestro con transform lo descoloca.
  if (isMobile) {
    return (
      <Portal>
        <div className="rest-timer-mobile animate-slide-up" role="timer" aria-live="polite">
          {controls}
        </div>
      </Portal>
    );
  }

  return (
    <Portal>
      <DesktopTimer onClose={onClose}>{controls}</DesktopTimer>
    </Portal>
  );
};

/** Panel flotante arrastrable (solo escritorio). */
const DesktopTimer = ({ children }) => {
  const [position, setPosition] = useState(() => ({
    x: Math.max(16, (typeof window !== "undefined" ? window.innerWidth : 1200) - 330),
    y: 90
  }));
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onPointerDown = (e) => {
    dragging.current = true;
    offset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    setPosition({
      x: Math.max(8, Math.min(window.innerWidth - 308, e.clientX - offset.current.x)),
      y: Math.max(8, Math.min(window.innerHeight - 190, e.clientY - offset.current.y))
    });
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      className="animate-fade-in"
      role="timer"
      aria-live="polite"
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1200,
        width: "300px",
        background: "rgba(28, 28, 30, 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "18px",
        padding: "12px 14px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        color: "#FFFFFF",
        userSelect: "none"
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          display: "flex",
          /* antes decía `justify` (prop inválida) y el contenido quedaba pegado */
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
          cursor: "grab",
          paddingBottom: "6px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          touchAction: "none"
        }}
      >
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent-blue)", display: "flex", alignItems: "center", gap: "6px" }}>
          <GripHorizontal size={14} color="rgba(255,255,255,0.5)" /> CRONÓMETRO DE DESCANSO
        </span>
      </div>
      {children}
    </div>
  );
};
