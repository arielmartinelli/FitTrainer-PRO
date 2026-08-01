import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx'
import { MaintenanceScreen } from './components/common/MaintenanceScreen.jsx'
import './index.css'

// Mantenimiento manual: se activa poniendo VITE_MAINTENANCE_MODE=true.
// Útil para cortar el acceso mientras hacés cambios en la base o un deploy grande.
const enMantenimiento = String(import.meta.env.VITE_MAINTENANCE_MODE || '').toLowerCase() === 'true'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {enMantenimiento ? (
      <MaintenanceScreen
        title="Estamos en mantenimiento"
        message="Estamos haciendo mejoras en la aplicación. Volvemos en unos minutos. Tus datos están a salvo."
      />
    ) : (
      // Cualquier error de renderizado muestra el cartel en vez de una pantalla en blanco.
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    )}
  </React.StrictMode>,
)

// PWA: permite abrir la app sin señal (típico sótano de gimnasio).
// Solo se registra en producción para no interferir con el hot reload de Vite.
if ('serviceWorker' in navigator && import.meta.env.PROD && !enMantenimiento) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('No se pudo registrar el service worker:', err))
  })
}
