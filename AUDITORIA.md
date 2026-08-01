# Auditoría FitTrainer PRO — 31/07/2026

Revisión de los 3 modos (Admin / Profesor / Alumno) + foco en vista móvil.

---

## 🔴 BLOQUEANTES (arreglar antes de vender esto)

### 1. Seguridad: la base está abierta a cualquiera
`supabase_schema.sql` termina con `DISABLE ROW LEVEL SECURITY` en las 6 tablas. La `anon key` viaja en el bundle JS público. Cualquiera que abra DevTools puede leer/escribir **todos los profesores, alumnos y contraseñas** de la plataforma.

Además:
- Las contraseñas se guardan en texto plano (localStorage + columna `password TEXT`).
- `CleanLoginScreen.jsx:49` guarda usuario **y contraseña** en claro en localStorage con "Recordar".
- `MasterDashboard.jsx:300,377` y `StudentDetailClean.jsx:405` **muestran las contraseñas en pantalla**.
- El admin es `admin/admin123` hardcodeado en `mockData.js` y no hay forma de cambiarlo desde la UI.

**Fix:** migrar a Supabase Auth (o al menos hashear con bcrypt), activar RLS con políticas por `trainer_id`, y quitar contraseñas de la UI (mostrar "Restablecer contraseña" en vez de revelarla).

### 2. Pérdida de datos: entrenamientos y pagos no suben a la nube
`logCompletedWorkout`, `recordStudentPayment`, `toggleStudentAccess` y `toggleTrainerAccess` escriben **solo en localStorage**.
Pero `refreshData()` (AuthContext:74) **sobreescribe localStorage con lo que viene de Supabase**.

Resultado: el alumno registra 3 semanas de entrenamiento en el celular → el profe abre la app → el próximo `refreshData` del alumno le borra todo.

### 3. El progreso del entrenamiento no se persiste
`WorkoutTracker.jsx:24-25` — `completedSetsMap` y `exerciseWeightsMap` son `useState` puro.
El alumno bloquea el celular, entra una llamada o recarga → pierde toda la sesión. En el gym esto pasa **siempre**.

**Fix:** persistir en localStorage con key `workout_{studentId}_{routineId}_{semana}_{día}`.

### 4. El peso se comparte entre todas las series
`WorkoutTracker.jsx:312` usa la key `w{sem}_d{día}_e{idx}` — **sin el índice de serie**. Escribís 60kg en la serie 1 y aparece 60 en las 4 series. No se puede registrar una progresión 60/65/70/70.

Es el bug funcional más visible de todo el software.

### 5. El semáforo de cuotas no funciona
Nada en el código compara `nextDueDate` contra la fecha de hoy. `paymentStatus` solo cambia a `"paid"` cuando se registra un pago, y arranca en `"paid"` por defecto (`storageService.js:178`).

Todo el módulo de cobros es decorativo: el contador "Cuotas Pendientes" del dashboard siempre da 0, los filtros 🟡/🔴 nunca devuelven nada.

**Fix:** función derivada `getPaymentStatus(student)` que calcule `overdue` / `due_soon` (≤7 días) / `paid` al vuelo.

### 6. Dos números distintos llamados "Recaudación"
- `TrainerCleanDashboard.jsx:21` → suma los pagos reales del mes. Correcto.
- `PaymentsClean.jsx:28` → suma `planPrice` de todos los que figuran "paid". Incorrecto y siempre más alto.

El profe ve dos cifras contradictorias en dos pantallas.

---

## 🟠 BUGS FUNCIONALES

| # | Dónde | Problema |
|---|---|---|
| 7 | `AuthContext:98` | `refreshData()` es async pero el `useEffect` no espera. Si el login ocurre antes de que responda Supabase, valida contra localStorage viejo → un alumno creado en otro dispositivo no puede entrar hasta el 2° refresh. |
| 8 | `AuthContext:122` | La sesión se congela: `currentUser` sale de localStorage y nunca se re-sincroniza. Si el profe asigna una rutina, cambia el plan o **revoca el acceso**, el alumno ya logueado sigue usando la app normalmente. |
| 9 | `WorkoutTracker:67` | Detección de PR rota: `numWeight > previousBest && previousBest > 0` → nunca avisa el primer récord. Y compara contra `bestWeight` que puede ser el string `"Según plantilla"`. |
| 10 | `WorkoutTracker:19` | Lee `getRoutines()` de localStorage en cada render, ignorando el contexto. Rutinas nuevas de Supabase no aparecen. |
| 11 | `StudentListClean:13` | El form de alta no pide **teléfono ni email**, pero `handleSendWhatsAppReminder` y `handleWhatsAppSend` dependen de `student.phone` → abren `wa.me/?text=` sin número. El buscador filtra por un email que nunca existe. |
| 12 | `storageService:36,161` | No hay validación de `username` único. Dos alumnos con el mismo usuario → el login toma el primero. |
| 13 | `StudentDetailClean:121` | "Exportar Reporte PDF" hace `window.print()` → imprime la app entera con el modal encima. Ya existe `RoutinePrintView` con html2pdf, no se usa acá. |
| 14 | `RoutineBuilder:554` | `RoutinePrintView` nunca recibe la prop `student` → todos los PDF dicen *"Alumno / Plantilla Generica"*. |
| 15 | `storageService:57` | El upsert de profesor no envía `gender` ni `status` → al recargar de Supabase se pierde la suspensión y el género. |
| 16 | `StudentDetailClean:107` | Editar credenciales no actualiza la sesión activa del alumno (sí lo hace `saveStudentQuestionnaire`, ahí está bien resuelto). |
| 17 | `StudentDetailClean:376` | El tab "Cuota & Pagos" **no lista el historial** aunque `student.payments[]` se guarda. |
| 18 | `storageService:179` | `nextDueDate: "2026-08-15"` hardcodeado como default. |
| 19 | `WorkoutTracker:166` | El selector "Semana 1 de 6" no cambia **nada** del contenido: las 6 semanas muestran los mismos pesos y reps. No hay progresión programada. |
| 20 | `RoutineBuilder:135` | `handleExerciseChange` muta el objeto anidado (`[...days]` es shallow copy). Funciona por accidente; riesgoso con React 19 concurrente. |
| 21 | `RoutineBuilder:3` | Importa `downloadSampleExcelTemplate` y no lo usa. |
| 22 | Varios | Props JSX inválidas que React ignora en silencio: `uppercase:"true"` (WorkoutTracker:161), `smWidth`/`smFlexDirection` (RoutineBuilder:292,498), y **`justify:"space-between"`** en RestTimer:137 → debería ser `justifyContent`; por eso el botón ✕ queda pegado al título. |

---

## 📱 VISTA MÓVIL (prioridad alta — es el uso real)

### M1. Navegación duplicada
Hay **bottom tab bar** y **menú hamburguesa** con exactamente los mismos ítems. Ocupa espacio y confunde.
→ Dejar la bottom bar para navegar y el hamburguesa solo con perfil + cerrar sesión.

### M2. La barra inferior no respeta el área segura del iPhone
`MobileBottomTabBar` usa `padding: "6px 4px 10px 4px"` sin `env(safe-area-inset-bottom)`. En iPhone con barra gestual, los labels quedan debajo del indicador.
```js
paddingBottom: "calc(10px + env(safe-area-inset-bottom))"
```
Y `.main-content` necesita el mismo ajuste en su `padding-bottom: 105px`.

### M3. Zoom automático de iOS en cada input
`.form-input` está en `0.925rem` (~14.8px). iOS Safari hace auto-zoom en cualquier input < 16px. Combinado con `user-scalable=no` en el viewport (que además es un problema de accesibilidad), la experiencia queda rota.
→ `font-size: 16px` en inputs en móvil, y quitar `maximum-scale=1.0, user-scalable=no`.

### M4. Grids fijos que se aplastan
- `StudentDetailClean:376` → `"1fr 1fr 1fr"` fijo (Plan / Valor / Vencimiento) en 360px.
- `StudentDetailClean:282,304` → dos grids `"1fr 1fr"` fijos en el cuestionario.
- `RoutineBuilder:423` → 4 inputs a `minmax(70px,1fr)`, inusables con el teclado abierto.
- Cards a `minmax(300px,1fr)`/`minmax(320px,1fr)` + `main-content` con 10px de padding → **desborde horizontal en iPhone SE (320px)**.

### M5. Los títulos son MÁS grandes en móvil que en desktop
`index.css:70` → `h1 { font-size: 2.25rem !important }` en móvil vs `2.1rem` en desktop. Los encabezados se comen media pantalla.

### M6. La rueda de peso del onboarding se traba
`StudentOnboarding:436-472`: renderiza **201 divs** en un contenedor de 160px, con `onScroll` que dispara `setState` en cada evento (decenas de renders/segundo en móvil). Además el click hace `scrollTop = val*40` que re-dispara el handler → loop de scroll.
Para llegar a 90kg hay que scrollear 90 items.
→ Reemplazar por input numérico grande + slider, o virtualizar la lista y hacer debounce del scroll.

### M7. El cronómetro flotante es inusable en celular
`RestTimer` tiene ancho fijo de 300px, se posiciona en `window.innerWidth - 340` (en un celular de 375px queda descolocado) y es una ventana arrastrable que tapa el ejercicio.
→ En móvil debe ser una barra fija abajo, encima de la tab bar. En desktop puede quedar flotante.

### M8. Áreas táctiles por debajo del mínimo
`.btn-sm` = ~28px de alto (Apple recomienda 44px). Los checkbox de series son 20px, y los botones de ícono (borrar, WhatsApp, suspender) también quedan chicos. En el gym, con las manos sudadas, esto falla.

### M9. El banner de Córdoba tapa la barra inferior
`CordobaContactBanner`: `bottom: 80px`, `zIndex: 2500` (la tab bar es 1000). Aparece en **cada carga** durante 5s y su botón abre `wa.me/?text=` **sin número de teléfono**.
→ Mostrarlo una sola vez (flag en localStorage) y ponerle un número real, o eliminarlo.

### M10. `100vh` en la pantalla de login
`CleanLoginScreen:63` usa `position: fixed` + `height: 100vh`. En iOS Safari, con el teclado abierto, el botón "Iniciar Sesión" queda fuera de pantalla.
→ `height: 100dvh` + `overflowY: auto`.

### M11. Tabs con scroll horizontal sin señal visual
`StudentDetailClean:187` y el selector de semanas tienen `overflowX: auto` pero nada indica que hay más contenido. En `MasterDashboard:233` los tabs **ni siquiera tienen** `overflowX` → se desbordan.

### M12. Buscadores invisibles
Los inputs de búsqueda usan `border: none` + `background: transparent` dentro del panel. En móvil no se distingue dónde tocar.

### M13. Parpadeo del login en cada carga
`AuthContext` expone `loading` y **nadie lo consume**. La app pinta la pantalla de login por un instante antes de restaurar la sesión.

### M14. Sin service worker
Hay `manifest.json` y metas de PWA pero **no hay service worker** → la app no abre offline. En un sótano de gym sin señal, no carga.

---

## 🧹 CÓDIGO MUERTO (~2.500 líneas)

Ninguno de estos se importa desde ningún lado:

| Archivo | Líneas |
|---|---|
| `trainer/PaymentsDashboard.jsx` | 437 |
| `trainer/StudentDetail.jsx` | 425 |
| `trainer/StudentList.jsx` | 320 |
| `common/Header.jsx` | 318 |
| `trainer/ProgressChart.jsx` | 262 |
| `trainer/TrainerDashboard.jsx` | 246 |
| `auth/LoginModal.jsx` | 236 |
| `student/StudentDashboard.jsx` | 91 |
| `student/StudentProgress.jsx` | 87 |
| `src/App.css` (plantilla Vite) | 184 |
| `src/assets/{hero.png, react.svg, vite.svg}` | — |

`recharts` está en el bundle solo por `ProgressChart`, que no se usa. Sacarlo aliviana bastante la carga en móvil.

---

## ✨ QUÉ AGREGARÍA para que sea un producto completo

**Para el alumno (lo más importante):**
1. **Mi Progreso** — historial de entrenamientos, evolución de cargas por ejercicio, PRs. El código ya existe en `StudentProgress` + `ProgressChart`, solo hay que conectarlo. Sería el 3er tab de la barra inferior.
2. **Registro de peso corporal** con gráfico de evolución.
3. **Notas de la sesión** — cómo se sintió, molestias. Hoy se guarda `studentNotes: ""` siempre vacío.
4. **Progresión por semana** — que la semana 3 muestre las cargas sugeridas en base a lo que levantó en la 2.

**Para el profesor:**
5. **Adherencia** — cuántos días entrenó cada alumno esta semana. Es lo primero que un PT quiere ver.
6. **Alertas automáticas** — "3 alumnos no entrenan hace 10 días", "2 cuotas vencen esta semana".
7. **Historial de pagos** visible en la ficha + recibo en PDF.
8. **Duplicar rutina** — hoy hay que rehacerla desde cero para cada alumno.
9. **Mensajería** profe ↔ alumno.

**Transversal:**
10. Recuperación de contraseña.
11. Backup / exportar datos.
12. Modo oscuro (se entrena de noche, la pantalla blanca a 2200 quema).

---

## Orden sugerido de trabajo

1. **Sprint 1 (crítico):** RLS + hash de contraseñas + quitar contraseñas de la UI.
2. **Sprint 2 (datos):** sincronizar workouts/pagos a Supabase + persistir el tracker + peso por serie.
3. **Sprint 3 (móvil):** safe-area, font-size 16px, grids responsivos, RestTimer como barra, rueda de peso, quitar navegación duplicada.
4. **Sprint 4 (lógica):** estado de cuota calculado, unificar recaudación, teléfono en el alta.
5. **Sprint 5 (limpieza + valor):** borrar código muerto, conectar Mi Progreso, adherencia.
