import React from "react";
import { MaintenanceScreen } from "./MaintenanceScreen";

/**
 * Atrapa los errores de renderizado de React.
 *
 * Sin esto, un error en cualquier componente deja la pantalla en blanco y el
 * usuario no entiende qué pasó. Con esto ve un cartel claro y puede reintentar.
 *
 * Tiene que ser un componente de clase: `componentDidCatch` no existe en hooks.
 *
 * Ojo con el alcance: solo atrapa errores que ocurren DURANTE el renderizado.
 * Un `fetch` que falla dentro de un `onClick` no pasa por acá — esos ya se
 * manejan con try/catch en cada pantalla.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Queda en la consola para poder diagnosticarlo.
    // Si algún día sumás un servicio de monitoreo (Sentry y similares), este es el lugar.
    console.error("Error capturado por ErrorBoundary:", error, info?.componentStack);
  }

  handleRetry = () => {
    // Primero se intenta re-renderizar sin recargar; si el error vuelve,
    // el usuario puede recargar la página o cerrar sesión desde la pantalla.
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <MaintenanceScreen
          title="Algo salió mal"
          message="La aplicación encontró un problema inesperado. Tus datos están a salvo. Probá reintentar; si sigue igual, cerrá sesión y volvé a entrar."
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
