# Activar Supabase Auth + RLS — paso a paso

Guía completa para pasar de "base abierta" a "base cerrada de verdad". Tiempo estimado: **30–40 minutos**.

Al terminar vas a tener:

- Alumnos entrando desde su celular con usuario y contraseña.
- Cada profesor viendo **solo** sus alumnos y sus rutinas.
- Cada alumno viendo **solo** su propia ficha y su rutina.
- Contraseñas administradas por Supabase, fuera de tus tablas.

---

## Paso 1 — Crear el proyecto

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta.
2. **New project**. Ponele un nombre (ej. `fittrainer`), elegí una contraseña de base de datos y **guardala** (no es la de tu app, es la de Postgres).
3. Región: elegí la más cercana a tus clientes (`South America (São Paulo)` para Argentina).
4. Esperá a que termine de aprovisionar, tarda un par de minutos.

---

## Paso 2 — Desactivar la confirmación por email

**Esto es obligatorio**, si no lo hacés los alumnos no van a poder entrar nunca.

Los alumnos entran con un usuario (`nicolas.fit`), no con un email real. Internamente la app les arma una dirección como `nicolas.fit@alumnos.fittrainer.app`, que es un buzón que no existe. Si Supabase exige confirmar el email, esa confirmación nunca llega y la cuenta queda bloqueada.

1. Barra lateral → **Authentication**.
2. **Sign In / Providers** → **Email**.
3. Desactivá **Confirm email**.
4. **Save**.

---

## Paso 3 — Crear las tablas y las políticas

1. Barra lateral → **SQL Editor** → **New query**.
2. Abrí `supabase_schema.sql` de este proyecto, copiá **todo** el contenido y pegalo.
3. **Run**.

Al final el script corre una consulta de verificación. Tiene que devolver algo así:

| tablename | rls_activo |
|---|---|
| app_admins | true |
| exercise_bank | true |
| routines | true |
| students | true |
| trainers | true |

Si alguna dice `false`, algo falló: revisá el panel de errores del editor.

---

## Paso 4 — Crear tu usuario de administrador

1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Email: el tuyo real (vas a poder recuperar la contraseña por mail).
3. Contraseña: una fuerte.
4. Marcá **Auto Confirm User**.
5. **Create user**.
6. Copiá el **UID** que aparece en la lista (es un código largo tipo `a1b2c3d4-...`).

Ahora decile a la base que ese usuario es administrador. **SQL Editor** → nueva consulta, reemplazando el UID y el nombre:

```sql
insert into public.app_admins (id, name)
values ('PEGA-ACÁ-EL-UID', 'Ariel')
on conflict (id) do update set name = excluded.name;
```

**Run**.

---

## Paso 5 — Conectar la app

1. En Supabase: **Project Settings** (el engranaje) → **API**.
2. Copiá **Project URL** y la clave **anon / public**.
3. En la carpeta del proyecto, creá un archivo `.env` (al lado de `package.json`):

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_STUDENT_EMAIL_DOMAIN=alumnos.fittrainer.app
VITE_CONTACT_WHATSAPP=
```

`VITE_STUDENT_EMAIL_DOMAIN` es el dominio interno de los alumnos. Podés dejar el que viene o poner el tuyo. **Una vez que creaste alumnos, no lo cambies**: sus emails de login se arman con ese dominio y dejarían de poder entrar.

4. Reiniciá el servidor:

```bash
npm run dev
```

La app detecta sola que hay Supabase y pasa a modo nube.

---

## Paso 6 — Primer uso

1. Entrá con la pestaña **Admin**, usando el **email** y la contraseña del paso 4.
2. **Crear Profesor**. Usá un email real: es con lo que va a iniciar sesión y con lo que va a poder recuperar la contraseña.
3. Cerrá sesión y entrá como ese profesor.
4. **Crear Alumno**. Anotá el usuario y la contraseña que te muestra.
5. Probá entrar como ese alumno desde otro navegador (o una ventana de incógnito).

Si el alumno entra y ve su ficha, está andando.

> **Ojo con las cuentas viejas.** Los profesores y alumnos que hayas cargado antes de este cambio vivían solo en localStorage y no tienen cuenta en Supabase. Hay que volver a crearlos desde el panel de admin. Si eran pocos, es más rápido que migrarlos.

---

## Paso 7 — Reseteo de contraseñas de alumnos (opcional pero recomendado)

Los profesores y el admin recuperan su contraseña solos, con el enlace **"Olvidé mi contraseña"** del login, porque usan un email real.

Los alumnos no: su email es interno. Para que el profesor pueda generarles una contraseña nueva desde la app hace falta desplegar una pequeña función de servidor.

Sin esto, el botón "Generar contraseña nueva" avisa que la función no está desplegada y no rompe nada.

```bash
# 1. Instalar el CLI (una sola vez)
npm install -g supabase

# 2. Iniciar sesión
supabase login

# 3. Vincular con tu proyecto (el ref está en la URL del panel)
supabase link --project-ref xxxxxxxxxxxx

# 4. Desplegar
supabase functions deploy admin-reset-password
```

El código ya está en `supabase/functions/admin-reset-password/index.ts`. Valida que quien llama sea admin, o el profesor del alumno en cuestión — nadie más puede usarla.

---

## Paso 8 — Comprobar que RLS realmente bloquea

Vale la pena verificarlo con los ojos, no confiar.

1. Creá **dos** profesores, cada uno con un alumno.
2. Entrá como el profesor A.
3. Abrí la consola del navegador (F12) y pegá:

```js
const { data } = await window.__supabase.from('students').select('*')
console.table(data)
```

Si `window.__supabase` no existe, hacelo más simple: mirá la pestaña **Alumnos** de la app. El profesor A tiene que ver **solo** a su alumno.

Prueba más contundente: en Supabase → **Table Editor** → `students` vas a ver todas las filas (ahí sos dueño del proyecto, RLS no aplica). Pero desde la app, cada profesor ve solo lo suyo. Esa es la diferencia.

---

## Cómo queda el modelo de identidad

| Rol | Entra con | Email en Supabase | Recupera contraseña |
|---|---|---|---|
| Admin | su email real | el real | Solo, por mail |
| Profesor | su email real | el real | Solo, por mail |
| Alumno | usuario (`nicolas.fit`) | `nicolas.fit@` + dominio interno | Se la genera su profesor |

El `id` de cada fila **es** el `uid` de Supabase Auth. De eso dependen todas las políticas: si alguna vez creás una fila a mano con otro id, ese usuario va a poder entrar pero no va a ver nada.

---

## Si algo no anda

**"Email not confirmed" al iniciar sesión**
Te quedó activo *Confirm email*. Volvé al paso 2. Para arreglar las cuentas ya creadas: Authentication → Users → los tres puntos → *Confirm email*.

**El profesor entra pero no ve ningún alumno**
El `id` de la fila no coincide con su `uid` de Auth. Comprobalo:

```sql
select t.id as id_en_tabla, u.id as uid_auth, t.email
from public.trainers t
left join auth.users u on u.email = t.email;
```

Las dos columnas tienen que ser iguales.

**"infinite recursion detected in policy"**
Falta la función `is_admin()` o quedó una política vieja consultando `app_admins` directo. Volvé a correr el schema completo.

**"new row violates row-level security policy"**
Estás intentando escribir algo que no te corresponde. Lo más común: crear un alumno con un `trainer_id` que no es el tuyo.

**Todo dejó de sincronizar de golpe**
Fijate en la consola si dice `JWT expired`. Cerrá sesión y volvé a entrar.

---

## Volver atrás

Si necesitás desactivar todo esto y volver al modo local, borrá o renombrá el archivo `.env` y reiniciá. La app vuelve a funcionar con localStorage, sin tocar nada de Supabase.
