# Guía de migración — FitTrainer PRO v2

Qué hacer para poner en producción los cambios de esta versión.

---

## 1. Actualizar dependencias

Se sacó `recharts` (~400 KB) porque solo lo usaba una pantalla que estaba desconectada. Ahora los gráficos son SVG propios.

```bash
npm install
npm run dev
```

---

## 2. Variables de entorno

Copiá `.env.example` a `.env` y completá:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_CONTACT_WHATSAPP=5493511234567   # opcional
```

`VITE_CONTACT_WHATSAPP` es nuevo: el banner de contacto abría `wa.me/` **sin número**, así que no servía. Si lo dejás vacío, el banner directamente no aparece.

---

## 3. Base de datos

Pegá `supabase_schema.sql` completo en el **SQL Editor** de Supabase y ejecutalo. El script es idempotente: se puede correr sobre la base existente sin perder datos.

Agrega columnas nuevas (`payments`, `completed_workouts`, `body_weight_log`, `updated_at`, `phone`, `email`, `join_date`) y elimina `payment_status`, que ya no se usa.

---

## 4. Contraseñas: qué pasa con las cuentas existentes

Las contraseñas ahora se guardan hasheadas (SHA-256 con salt). **No hay que hacer nada manualmente**: la migración es automática y transparente.

- La primera vez que un profesor o alumno entra con su contraseña de siempre, la app la valida contra el texto plano guardado, la hashea y la reemplaza.
- A partir de ahí solo existe el hash.

**Consecuencia importante:** las contraseñas ya no se pueden *ver* en ningún lado (antes se mostraban en el panel de admin y en la ficha del alumno). Si alguien la pierde, el flujo ahora es:

- **Profesor** → ficha del alumno → pestaña *Acceso* → "Generar contraseña nueva" → se muestra una sola vez → "WhatsApp".
- **Admin** → tarjeta del profesor/alumno → botón 🔑.

El admin también puede cambiar su propia contraseña desde *Panel Admin → Mi contraseña* (antes estaba fija en el código como `admin/admin123`).

> Requisito: el hash usa la Web Crypto API, que solo está disponible en **HTTPS** o en `localhost`. Si servís la app por `http://` en una IP, el hasheo se desactiva y la app avisa por consola. Usá HTTPS.

---

## 5. Row Level Security y login

**Ya está resuelto en el código.** La app migró a Supabase Auth: la identidad la maneja
Supabase, cada fila tiene como `id` el `uid` del usuario, y las políticas de RLS cierran
la base de verdad.

Lo único que falta es la configuración del lado de Supabase, que son unos clics en el panel.

👉 **Seguí [SUPABASE_AUTH.md](SUPABASE_AUTH.md)** — tiene los 8 pasos con los clics exactos.

Resumen de lo que vas a hacer ahí:

1. Crear el proyecto en Supabase.
2. **Desactivar "Confirm email"** (obligatorio: los alumnos usan un email interno).
3. Correr `supabase_schema.sql` en el SQL Editor.
4. Crear tu usuario de admin y registrarlo en `app_admins`.
5. Poner la URL y la anon key en el `.env`.
6. Crear un profesor y un alumno de prueba, y verificar que entran.
7. (Opcional) Desplegar la Edge Function para que el profesor pueda resetear
   la contraseña de sus alumnos.
8. Comprobar que un profesor no ve los alumnos del otro.

Si no configurás el `.env`, la app sigue funcionando 100% local con localStorage —
útil para desarrollar, pero los alumnos no pueden entrar desde su celular.

## 6. Datos que antes se perdían

Los entrenamientos y los pagos solo se guardaban en `localStorage`, pero `refreshData()` sobrescribía `localStorage` con lo que venía de Supabase. Resultado: un alumno podía registrar semanas de entrenamiento y perderlas.

Ahora:

- Entrenamientos, pagos, peso corporal y estados de suspensión **sí** suben a Supabase.
- La sincronización **mezcla** local y remoto en vez de pisar: gana el registro con `updated_at` más reciente y se conservan los que existen de un solo lado.

Si algún alumno tiene entrenamientos viejos guardados solo en su celular, con abrir la app una vez conectado se suben solos.

---

## 7. Cambios de comportamiento que conviene avisar

| Antes | Ahora |
|---|---|
| El estado de cuota era un campo fijo; todos quedaban "al día" para siempre | Se calcula solo desde `next_due_date` (vencida / vence en ≤7 días / al día) |
| El dashboard y la pantalla de cobros mostraban recaudaciones distintas | Un único cálculo: pagos realmente registrados en el mes |
| El peso se compartía entre las 4 series de un ejercicio | Cada serie tiene su propio peso y sus propias reps |
| Si el alumno bloqueaba el celular perdía la sesión | El entrenamiento se guarda solo mientras entrena |
| Suspender a un alumno no lo echaba de su sesión abierta | Se cierra la sesión automáticamente |
| El alumno no tenía forma de ver su progreso | Nueva pestaña "Progreso" con adherencia, peso corporal, evolución de cargas y PRs |
| El profe no veía quién dejó de entrenar | Alertas en el dashboard + adherencia en cada alumno |
| El teléfono era opcional, pero WhatsApp lo necesitaba | El teléfono es obligatorio al crear un alumno |
| "Exportar PDF" imprimía la app entera | PDF real de la rutina, con el nombre del alumno |

---

## 8. Publicar

```bash
npm run build
```

Subí la carpeta `dist/`. Verificá que el hosting sirva:

- **HTTPS** (obligatorio para el hasheo de contraseñas y para el service worker).
- Un *fallback* a `index.html` para cualquier ruta (es una SPA).

La app ahora incluye un service worker (`public/sw.js`) que la deja abrir sin señal — útil en gimnasios con mala conexión. Usa "red primero" para el HTML, así que nunca se queda pegada una versión vieja.
