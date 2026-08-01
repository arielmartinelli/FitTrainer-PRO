import { createPortal } from "react-dom";

/**
 * Renderiza a sus hijos directamente en <body>.
 *
 * Por qué hace falta: cualquier ancestro con `transform` (por ejemplo nuestra clase
 * `.animate-fade-in`, que termina en `translateY(0)`) se convierte en el contenedor
 * de referencia de sus descendientes `position: fixed`. Eso hacía que los modales,
 * el cronómetro y los avisos quedaran posicionados respecto de la tarjeta que los
 * contenía en vez de respecto de la pantalla.
 *
 * Sin estado interno a propósito: si el portal montara en un segundo paso, todo el
 * contenido se remontaría y los inputs perderían el foco al escribir.
 */
export const Portal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};
