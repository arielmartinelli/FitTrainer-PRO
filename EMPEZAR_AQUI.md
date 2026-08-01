# Poner Supabase en marcha — de cero

Checklist de 8 pasos. Hacelos en orden y marcá cada uno. Tiempo: ~30 minutos.

Si algo falla, andá al final: **Si algo sale mal**.

---

## ☐ Paso 1 — Crear el proyecto

1. Entrá a **supabase.com** → **Start your project** → creá la cuenta (podés usar GitHub).
2. **New project**.
3. Completá:
   - **Name**: `fittrainer`
   - **Database Password**: generá una fuerte con el botón *Generate*. **Copiala y guardala** en algún lado. No es la de tu app, es la de Postgres — casi no la vas a usar, pero no se puede recuperar.
   - **Region**: `South America (São Paulo)` si tus clientes son de Argentina.
4. **Create new project**.
5. Esperá 2–3 minutos a que termine.

---

## ☐ Paso 2 — Desactivar la confirmación por email

**No te saltees este paso.** Si lo hacés, los alumnos nunca van a poder entrar.

Los alumnos entran con un usuario (`nicolas.fit`), no con un email. La app les arma por dentro una dirección tipo `nicolas.fit@alumnos.fittrainer.app`, que es un buzón que no existe. Si Supabase les exige confirmar el email, esa confirmación nunca llega y la cuenta queda muerta.

1. Menú de la izquierda → **Authentication**.
2. Submenú → **Sign In / Providers**.
3. Click en **Email**.
4. Adentro hay **dos interruptores distintos**. Tienen que quedar así:

| Interruptor | Estado |
|---|---|
| **Enable Email provider** | ✅ **ENCENDIDO** |
| **Confirm email** | ❌ apagado |

5. **Save**.

> ⚠️ Es el error más común de este paso: apagar el proveedor entero en vez de apagar
> solo la confirmación. Si apagás *Enable Email provider*, nadie puede iniciar sesión
> y la app muestra **"Email logins are disabled"** (error 422 en la consola).

---

## ☐ Paso 3 — Crear las tablas

1. Menú de la izquierda → **SQL Editor**.
2. **New query**.
3. Abrí el archivo `supabase_schema.sql` de este proyecto. Seleccioná **todo** (Ctrl+A) y copiá.
4. Pegalo en el editor de Supabase.
5. **Run** (o Ctrl+Enter).

Abajo te va a aparecer una tabla de resultado. Tiene que verse así:

| tabla | rls_activo | estado |
|---|---|---|
| app_admins | true | OK |
| exercise_bank | true | OK |
| routines | true | OK |
| students | true | OK |
| trainers | true | OK |

**Las 5 filas tienen que decir OK.** Si alguna dice REVISAR, algo falló: fijate el mensaje de error arriba.

---

## ☐ Paso 4 — Crear tu usuario de administrador

1. **Authentication** → **Users** → botón **Add user** → **Create new user**.
2. Completá:
   - **Email**: tu email real (con este vas a poder recuperar la contraseña).
   - **Password**: una contraseña fuerte. Anotala.
   - **Auto Confirm User**: ✅ **tildado**.
3. **Create user**.

Ahora convertilo en admin. Volvé a **SQL Editor** → **New query** y corré esto, cambiando el email y el nombre:

```sql
select public.hacer_admin('arielmartinelli2019@gmail.com', 'Ariel');
```

Tiene que responder: **"Listo: ... ahora es administrador."**

Si dice *"No existe ningún usuario con el email..."*, es que el email no coincide exacto con el que creaste. Revisalo.

---

## ☐ Paso 5 — Conectar la app

1. En Supabase: engranaje **Project Settings** (abajo a la izquierda) → **API**.
2. Vas a ver dos datos:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **Project API keys → anon / public** → una cadena larga que empieza con `eyJ...`
3. En la carpeta del proyecto (donde está `package.json`), creá un archivo llamado exactamente **`.env`** con esto:

```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
VITE_STUDENT_EMAIL_DOMAIN=alumnos.fittrainer.app
VITE_CONTACT_WHATSAPP=
```

> Ojo: el archivo se llama `.env`, con el punto adelante y sin extensión. En Windows, si el Explorador no te deja, crealo desde VS Code.

4. **Parar y volver a arrancar** el servidor (Vite lee el `.env` solo al iniciar):

```bash
npm run dev
```

La app detecta sola que hay Supabase y pasa a modo nube.

---

## ☐ Paso 6 — Probar que funciona

1. Abrí la app. Pestaña **Admin**. Entrá con el **email** y la contraseña del paso 4.
2. Deberías ver el Panel de Administrador vacío.
3. **Crear Profesor**:
   - Email: uno real y distinto al del admin.
   - Contraseña inicial: la que quieras.
4. Cerrá sesión (ícono de usuario arriba a la derecha → Cerrar sesión).
5. Entrá con la pestaña **Profesor**, con ese email.
6. **Crear Alumno**. Anotá el usuario y la contraseña que te muestra.
7. Abrí una **ventana de incógnito** y entrá con la pestaña **Alumno**, usando ese usuario.

Si el alumno ve su pantalla, **ya está funcionando**.

---

## ☐ Paso 7 — Comprobar que la seguridad realmente cierra

Vale la pena verlo con los ojos.

1. Volvé al admin y creá un **segundo profesor**, con **su propio alumno**.
2. Entrá como el profesor 1 → pestaña **Alumnos**.
3. Tiene que ver **solo su alumno**, no el del profesor 2.

Si ve los dos, alguna política quedó mal — avisame y lo revisamos.

---

## ☐ Paso 8 — Reseteo de contraseñas de alumnos (opcional)

Profesores y admin recuperan su contraseña solos, con **"Olvidé mi contraseña"** en el login, porque usan un email real.

Los alumnos no pueden (su email es interno). Para que el profesor pueda generarles una nueva desde la app, hay que desplegar una función chiquita de servidor.

**Sin esto no se rompe nada**: el botón simplemente avisa que falta.

```bash
npm install -g supabase
supabase login
supabase link --project-ref abcdefgh
supabase functions deploy admin-reset-password
```

El `project-ref` es la parte del medio de tu Project URL (`https://abcdefgh.supabase.co` → `abcdefgh`).

---

# Si algo sale mal

**"Email logins are disabled"**
Se apagó el proveedor Email entero. Authentication → Sign In / Providers → Email →
encendé **Enable Email provider** (dejando *Confirm email* apagado) → Save.

**"Email not confirmed" al iniciar sesión**
Te quedó activo *Confirm email* (paso 2). Apagalo. Para las cuentas ya creadas: Authentication → Users → los tres puntos de la fila → *Confirm email*.

**"Invalid login credentials"**
Email o contraseña equivocados. Ojo con la pestaña: si la cuenta es de Profesor y estás en la pestaña Admin, la app te lo avisa.

**El profesor entra pero no ve ningún alumno**
El `id` de la fila no coincide con su `uid` de Auth. Verificalo:

```sql
select t.email, t.id as id_en_tabla, u.id as uid_de_auth
from public.trainers t
left join auth.users u on lower(u.email) = lower(t.email);
```

Las dos últimas columnas tienen que ser idénticas.

**"infinite recursion detected in policy"**
Quedó una política vieja. Volvé a correr `supabase_schema.sql` completo.

**"new row violates row-level security policy"**
Estás intentando escribir algo que no te corresponde. Lo más común: crear un alumno asignándolo a un profesor que no sos vos.

**La app sigue en modo local (no sincroniza)**
El `.env` no se está leyendo. Verificá que esté en la raíz del proyecto (al lado de `package.json`), que las variables empiecen con `VITE_`, y que hayas reiniciado `npm run dev`.

**Quiero volver atrás**
Borrá o renombrá el `.env` y reiniciá. La app vuelve a modo local sin tocar nada de Supabase.
