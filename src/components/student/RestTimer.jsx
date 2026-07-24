import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, X, Bell, GripHorizontal } from "lucide-react";

export const RestTimer = ({ defaultSeconds = 90, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(defaultSeconds);
  const [isActive, setIsActive] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(defaultSeconds);

  // Drag Position State (default top-right)
  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.log("Audio play error", e);
    }
  };

  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      playBeepSound();
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  // Dragging event handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragOffset({
      x: clientX - position.x,
      y: clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: Math.max(10, Math.min(window.innerWidth - 310, clientX - dragOffset.x)),
      y: Math.max(10, Math.min(window.innerHeight - 180, clientY - dragOffset.y))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleMouseMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  const toggleTimer = () => setIsActive(!isActive);

  const addExtraSeconds = (extraSecs) => {
    setSecondsLeft((prev) => prev + extraSecs);
    setTotalSeconds((prev) => prev + extraSecs);
  };

  const resetTimer = (newSecs = totalSeconds) => {
    setTotalSeconds(newSecs);
    setSecondsLeft(newSecs);
    setIsActive(true);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPct = Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100);

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 2000,
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
      className="animate-fade-in"
    >
      {/* Draggable Header Bar */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{
          display: "flex",
          justify: "space-between",
          alignItems: "center",
          marginBottom: "6px",
          cursor: "grab",
          paddingBottom: "4px",
          borderBottom: "1px solid rgba(255,255,255,0.1)"
        }}
      >
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-blue)", display: "flex", alignItems: "center", gap: "6px" }}>
          <GripHorizontal size={14} color="rgba(255,255,255,0.5)" /> RELOJ FLOTANTE
        </div>

        <button
          className="btn btn-ghost btn-sm"
          onClick={onClose}
          style={{ padding: "2px", height: "22px", color: "rgba(255,255,255,0.7)" }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Time Display */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ fontSize: "2.2rem", fontWeight: 800, fontFamily: "Outfit", color: secondsLeft === 0 ? "var(--accent-green)" : "#FFFFFF", lineHeight: 1 }}>
          {formatTime(secondsLeft)}
        </div>

        <div style={{ display: "flex", gap: "4px" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => addExtraSeconds(15)}
            style={{ padding: "3px 6px", fontSize: "0.75rem", background: "rgba(255,255,255,0.15)", color: "#FFF" }}
          >
            +15s
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => addExtraSeconds(30)}
            style={{ padding: "3px 6px", fontSize: "0.75rem", background: "rgba(255,255,255,0.15)", color: "#FFF" }}
          >
            +30s
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.15)", borderRadius: "2px", overflow: "hidden", marginBottom: "10px" }}>
        <div style={{ width: `${progressPct}%`, height: "100%", background: "var(--accent-blue)", transition: "width 1s linear" }} />
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          className={`btn ${isActive ? "btn-secondary" : "btn-lime"} btn-sm`}
          style={{ flex: 1, padding: "6px 12px", fontSize: "0.8rem" }}
          onClick={toggleTimer}
        >
          {isActive ? <Pause size={14} /> : <Play size={14} />} {isActive ? "Pausar" : "Reanudar"}
        </button>

        <button
          className="btn btn-ghost btn-sm"
          style={{ color: "#FFF", padding: "6px 10px" }}
          onClick={() => resetTimer(totalSeconds)}
          title="Reiniciar"
        >
          <RotateCcw size={14} />
        </button>
      </div>

    </div>
  );
};
