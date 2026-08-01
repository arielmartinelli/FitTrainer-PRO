import React, { useState, useEffect } from "react";
import { obtenerUrlDeArchivo, categoriaDeArchivo, formatearTamano } from "../../services/routineFileService";
import { FileSpreadsheet, FileText, ImageIcon, Download, ExternalLink, Loader2, AlertCircle } from "lucide-react";

const ICONO = {
  imagen: ImageIcon,
  pdf: FileText,
  excel: FileSpreadsheet,
  otro: FileText
};

const COLOR = {
  imagen: "var(--accent-indigo)",
  pdf: "var(--accent-red)",
  excel: "var(--accent-green)",
  otro: "var(--text-secondary)"
};

/**
 * Muestra la rutina que el profesor subió como archivo.
 *
 * Las imágenes se ven directo en pantalla (que es lo que el alumno quiere en el
 * gimnasio). Los PDF y las planillas se abren o descargan, porque incrustarlos
 * en el celular funciona mal.
 *
 * El bucket es privado, así que la URL se pide firmada cada vez que se monta.
 */
export const RoutineFileViewer = ({ routine, compacto = false }) => {
  const [url, setUrl] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const categoria = categoriaDeArchivo(routine?.fileType, routine?.fileName);
  const Icono = ICONO[categoria];
  const color = COLOR[categoria];

  useEffect(() => {
    let cancelado = false;

    (async () => {
      setCargando(true);
      setError("");
      try {
        const firmada = await obtenerUrlDeArchivo(routine.filePath);
        if (cancelado) return;
        if (!firmada) setError("No se pudo abrir el archivo. Puede que ya no exista o que no tengas permiso.");
        setUrl(firmada);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [routine?.filePath]);

  if (!routine?.filePath) return null;

  const encabezado = (
    <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
      <div
        style={{
          width: "40px",
          height: "40px",
          minWidth: "40px",
          borderRadius: "10px",
          background: "var(--bg-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Icono size={20} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {routine.fileName || "Archivo de rutina"}
        </div>
        <div style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>
          {categoria === "imagen" ? "Imagen" : categoria === "pdf" ? "PDF" : "Planilla"}
          {routine.fileSize ? ` · ${formatearTamano(routine.fileSize)}` : ""}
        </div>
      </div>
    </div>
  );

  if (cargando) {
    return (
      <div className="subtle-box" style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
        <Loader2 size={16} className="spin" /> Abriendo el archivo...
      </div>
    );
  }

  if (error || !url) {
    return (
      <div
        className="subtle-box"
        style={{ display: "flex", alignItems: "flex-start", gap: "9px", background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)" }}
      >
        <AlertCircle size={17} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: "1px" }} />
        <span style={{ fontSize: "0.83rem", color: "var(--accent-red)" }}>{error || "No se pudo cargar el archivo."}</span>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: "12px" }}>
      <div className="row-between">
        {encabezado}
        <div className="action-row">
          <a href={url} target="_blank" rel="noreferrer noopener" className="btn btn-secondary btn-sm">
            <ExternalLink size={14} /> Abrir
          </a>
          <a href={url} download={routine.fileName} className="btn btn-primary btn-sm">
            <Download size={14} /> Descargar
          </a>
        </div>
      </div>

      {/* La imagen se muestra directa: es el caso más común y el más útil en el gimnasio. */}
      {categoria === "imagen" && !compacto && (
        <a href={url} target="_blank" rel="noreferrer noopener" style={{ display: "block" }}>
          <img
            src={url}
            alt={`Rutina: ${routine.title}`}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
              display: "block",
              background: "var(--bg-subtle)"
            }}
          />
        </a>
      )}

      {categoria === "pdf" && !compacto && (
        <div className="subtle-box" style={{ fontSize: "0.83rem", color: "var(--text-secondary)" }}>
          Tocá <strong>Abrir</strong> para verlo en pantalla completa, o <strong>Descargar</strong> para guardarlo en el
          teléfono y consultarlo sin conexión.
        </div>
      )}

      {categoria === "excel" && !compacto && (
        <div className="subtle-box" style={{ fontSize: "0.83rem", color: "var(--text-secondary)" }}>
          Descargá la planilla para abrirla con Excel o Google Sheets.
        </div>
      )}
    </div>
  );
};
