# FitTrainer PRO

Software de gestión para entrenadores personales: alumnos, rutinas, cuotas y seguimiento de entrenamientos. Pensado mobile-first, porque el alumno lo usa desde el celular en el gimnasio.

## Roles

- **Administrador** — crea y gestiona profesores y alumnos de toda la plataforma, suspende accesos, regenera contraseñas.
- **Profesor** — sus alumnos, rutinas, cobros y seguimiento de adherencia.
- **Alumno** — su rutina del día, registro de series y cargas, progreso y cuestionario inicial.

## Arranque

```bash
npm install
cp .env.example .env    # completar si vas a usar Supabase
npm run dev
```

La app funciona sin backend: si no configurás Supabase, guarda todo en el dispositivo. Con Supabase configurado, sincroniza entre dispositivos.

Usuario inicial de administrador: `admin` / `admin123`. **Cambialo apenas entres** desde *Panel Admin → Mi contraseña*.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build local |
| `npm run lint` | oxlint |

## Estructura

```
src/
  components/
    auth/       Pantalla de login
    common/     Header, barra inferior, modal, avatar, gráfico
    master/     Panel de administrador
    trainer/    Dashboard, alumnos, cobros, rutinas, banco de ejercicios
    student/    Rutina del día, cronómetro, progreso, cuestionario
  context/      AuthContext (sesión, sincronización, login)
  services/
    storageService    Persistencia local + sincronización con Supabase
    cryptoService     Hasheo de contraseñas
    billingService    Estado de cuotas y recaudación
    progressService   Adherencia, PRs y evolución de cargas
    excelService      Importar/exportar rutinas en Excel
    exerciseBankService  Catálogo de ejercicios por sector
```

## Notas

- Las contraseñas se guardan hasheadas y **no se pueden ver**: si un alumno la pierde, se genera una nueva desde su ficha.
- Servir siempre por **HTTPS** (lo necesitan el hasheo y el service worker).
- Antes de desplegar por primera vez o de actualizar desde una versión anterior, leer **[MIGRACION.md](MIGRACION.md)** — en particular la sección de Row Level Security.
