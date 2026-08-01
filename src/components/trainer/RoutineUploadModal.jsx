import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { saveRoutine } from "../../services/storageService";
import {
  subirArchivoDeRutina,
  validarArchivo,
  categoriaDeArchivo,
  formatearTamano,
  ACCEPT_ATTR
} from "../../services/routineFileService";
import { Modal } from "../common/Modal";
import { Upload, FileSpreadsheet, FileText, ImageIcon, X, Loader2, Info } from "lucide-react";

const ICONO = { imagen: ImageIcon, pdf: FileText, excel: FileSpreadsheet, otro: FileText };

/**
 * Alta de una rutina a partir de un archivo ya armado (foto, PDF o planilla).
 * Para el profesor que no quiere cargar ejercicio por ejercicio.
 */
export const RoutineUploadModal = ({ isOpen, onClose, onSubida }) => {
  const { currentUser, refreshData } = useAuth();
  const inputRef = useRef(null);

  const [archivo, setArchivo] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("Hipertrofia");
  const [semanas, setSemanas] = useState(6);
  const [error, setError] = useState("");
  const [subiendo, setSubiendo] = useState(false);

  const limpiar = () => {
    setArchivo(null);
    setTitulo("");
    setDescripcion("");
    setCategoria("Hipertrofia");
    setSemanas(6);
    setError("");
  };

  const cerrar = () => {
    limpiar();
    onClose();
  };

  const elegirArchivo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;

    const problema = validarArchivo(file);
    if (problema) {
      setError(problema);
      setArchivo(null);
      return;
    }

    setError("");
    setArchivo(file);
    // Propone el nombre del archivo como título, sin la extensión.
    if (!titulo) setTitulo(file.name.replace(/\.[^/.]+$/, ""));
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (subiendo) return;

    if (!archivo) return setError("Elegí un archivo primero.");
    if (!titulo.trim()) return setError("Ponele un título a la rutina.");

    setError("");
    setSubiendo(true);

    try {
      const routineId = `routine_${Date.now()}`;
      const datos = await subirArchivoDeRutina({
        file: archivo,
        trainerId: currentUser?.id,
        routineId
      });

      await saveRoutine({
        id: routineId,
        trainerId: currentUser?.id,
        title: titulo.trim(),
        description: descripcion.trim(),
        category: categoria,
        durationWeeks: Number(semanas),
        kind: "file",
        days: [],
        ...datos
      });

      await refreshData();
      onSubida?.(titulo.trim());
      cerrar();
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo subir el archivo.");
    } finally {
      setSubiendo(false);
    }
  };

  const cat = archivo ? categoriaDeArchivo(archivo.type, archivo.name) : null;
  const Icono = cat ? ICONO[cat] : Upload;

  return (
    <Modal isOpen={isOpen} onClose={cerrar} title="Subir rutina como archivo">
      <form onSubmit={guardar}>
        <div
          className="subtle-box"
          style={{ display: "flex", gap: "9px", alignItems: "flex-start", marginBottom: "14px", fontSize: "0.82rem", color: "var(--text-secondary)" }}
        >
          <Info size={16} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: "1px" }} />
          <span>
            Si ya tenés la rutina hecha, subila tal cual. El alumno la va a ver desde su celular y va a poder
            registrar sus entrenamientos igual.
          </span>
        </div>

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

        {/* Selector de archivo */}
        {!archivo ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              width: "100%",
              border: "2px dashed rgba(0, 122, 255, 0.35)",
              borderRadius: "14px",
              padding: "30px 18px",
              textAlign: "center",
              background: "var(--bg-subtle)",
              cursor: "pointer",
              fontFamily: "inherit",
              marginBottom: "16px"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(0,122,255,0.12)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "10px"
              }}
            >
              <Upload size={23} color="var(--accent-blue)" />
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.97rem", marginBottom: "4px", color: "var(--text-primary)" }}>
              Elegí el archivo
            </div>
            <div style={{ fontSize: "0.79rem", color: "var(--text-secondary)" }}>
              Foto, PDF o planilla · hasta 10 MB
            </div>
          </button>
        ) : (
          <div
            className="subtle-box"
            style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "16px", background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.3)" }}
          >
            <Icono size={22} color="var(--accent-green)" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.87rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {archivo.name}
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>{formatearTamano(archivo.size)}</div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setArchivo(null)}
              aria-label="Quitar archivo"
              style={{ flexShrink: 0 }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          onChange={elegirArchivo}
          style={{ display: "none" }}
        />

        <div className="form-group">
          <label className="form-label" htmlFor="ru-title">Título de la rutina</label>
          <input
            id="ru-title"
            type="text"
            className="form-input"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Plan hipertrofia 4 días"
            required
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="ru-cat">Categoría</label>
            <select id="ru-cat" className="form-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="Hipertrofia">Hipertrofia</option>
              <option value="Fuerza">Fuerza</option>
              <option value="Acondicionamiento">Acondicionamiento</option>
              <option value="Funcional">Funcional</option>
              <option value="Rehabilitación">Rehabilitación</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ru-weeks">Duración</label>
            <select id="ru-weeks" className="form-select" value={semanas} onChange={(e) => setSemanas(Number(e.target.value))}>
              {[4, 6, 8, 12, 16].map((w) => (
                <option key={w} value={w}>{w} semanas</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="ru-desc">Indicaciones (opcional)</label>
          <input
            id="ru-desc"
            type="text"
            className="form-input"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: descanso de 90 segundos entre series"
          />
        </div>

        <div className="action-row" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
          <button type="button" className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
          <button type="submit" className="btn btn-lime" disabled={subiendo || !archivo}>
            {subiendo ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
            {subiendo ? "Subiendo..." : "Guardar rutina"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
