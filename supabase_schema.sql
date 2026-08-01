-- ============================================================
-- FitTrainer PRO — Esquema de base de datos (v3, con Supabase Auth)
--
-- Pegar TODO en el "SQL Editor" de Supabase y presionar RUN.
-- Es idempotente: se puede volver a correr sin romper nada.
--
-- ⚠️ SEGUIR SUPABASE_AUTH.md. Este script es el paso 3 de esa guía.
--
-- Modelo de identidad:
--   · Cada profesor, alumno y admin es un usuario de Supabase Auth.
--   · El id de la fila ES el uid de Auth (trainers.id = auth.uid()).
--   · Las contraseñas viven en auth.users, NO en estas tablas.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. ADMINISTRADORES
--    Tabla chiquita: solo dice qué uid tiene permisos globales.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Administrador',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

/*
  is_admin() con SECURITY DEFINER.

  Si las políticas consultaran app_admins directamente, esa consulta volvería a
  disparar las políticas de app_admins y Postgres cortaría con "infinite recursion
  detected in policy". SECURITY DEFINER hace que la función corra con los permisos
  del dueño y saltee RLS, que es el patrón recomendado para este caso.
*/
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (SELECT 1 FROM public.app_admins WHERE id = auth.uid());
$$;

-- ------------------------------------------------------------
-- 2. PROFESORES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trainers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    phone TEXT,
    brand_name TEXT DEFAULT 'Estudio Personal Trainer',
    specialty TEXT,
    gender TEXT DEFAULT 'male',
    status TEXT DEFAULT 'active',
    cbu TEXT,
    alias TEXT,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male';
ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- La contraseña la administra Supabase Auth. Si la columna existía, se elimina.
ALTER TABLE public.trainers DROP COLUMN IF EXISTS password;

-- ------------------------------------------------------------
-- 3. ALUMNOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    trainer_id TEXT REFERENCES public.trainers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    gender TEXT DEFAULT 'male',
    goal TEXT DEFAULT 'Hipertrofia Muscular',
    join_date DATE,
    plan_name TEXT DEFAULT 'Plan Mensual',
    plan_price NUMERIC DEFAULT 28000,
    status TEXT DEFAULT 'active',
    next_due_date DATE,
    assigned_routine_id TEXT,
    questionnaire_completed BOOLEAN DEFAULT false,
    questionnaire_data JSONB DEFAULT '{}'::jsonb,
    -- Antes esto vivía solo en el celular del alumno y se perdía al sincronizar.
    payments JSONB DEFAULT '[]'::jsonb,
    completed_workouts JSONB DEFAULT '[]'::jsonb,
    body_weight_log JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS join_date DATE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS completed_workouts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS body_weight_log JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

ALTER TABLE public.students DROP COLUMN IF EXISTS password;
-- payment_status ya no se usa: el estado se calcula en la app desde next_due_date.
ALTER TABLE public.students DROP COLUMN IF EXISTS payment_status;

CREATE INDEX IF NOT EXISTS students_trainer_id_idx ON public.students(trainer_id);
CREATE INDEX IF NOT EXISTS students_next_due_date_idx ON public.students(next_due_date);

-- ------------------------------------------------------------
-- 4. RUTINAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.routines (
    id TEXT PRIMARY KEY,
    trainer_id TEXT REFERENCES public.trainers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Hipertrofia',
    duration_weeks INT DEFAULT 6,
    description TEXT,
    days JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());
CREATE INDEX IF NOT EXISTS routines_trainer_id_idx ON public.routines(trainer_id);

-- ------------------------------------------------------------
-- 5. BANCO DE EJERCICIOS (catálogo compartido)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exercise_bank (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
    muscle TEXT,
    default_sets INT DEFAULT 4,
    default_reps TEXT DEFAULT '10-12',
    default_rest INT DEFAULT 60,
    default_rpe TEXT DEFAULT 'RPE 8',
    notes TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- ------------------------------------------------------------
-- 6. updated_at automático (lo usa el merge de la app)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trainers_touch ON public.trainers;
CREATE TRIGGER trainers_touch BEFORE UPDATE ON public.trainers
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS students_touch ON public.students;
CREATE TRIGGER students_touch BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS routines_touch ON public.routines;
CREATE TRIGGER routines_touch BEFORE UPDATE ON public.routines
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================
-- Quién puede ver qué:
--   admin    → todo
--   profesor → su ficha, sus alumnos, sus rutinas
--   alumno   → su ficha y la rutina que tiene asignada
-- Nadie ve datos de otro profesor ni de alumnos ajenos.
-- ============================================================

ALTER TABLE public.app_admins    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_bank ENABLE ROW LEVEL SECURITY;

-- Limpieza para poder re-ejecutar el script.
DROP POLICY IF EXISTS "admin_lee_su_fila"          ON public.app_admins;
DROP POLICY IF EXISTS "trainers_select"            ON public.trainers;
DROP POLICY IF EXISTS "trainers_insert"            ON public.trainers;
DROP POLICY IF EXISTS "trainers_update"            ON public.trainers;
DROP POLICY IF EXISTS "trainers_delete"            ON public.trainers;
DROP POLICY IF EXISTS "students_select"            ON public.students;
DROP POLICY IF EXISTS "students_insert"            ON public.students;
DROP POLICY IF EXISTS "students_update"            ON public.students;
DROP POLICY IF EXISTS "students_delete"            ON public.students;
DROP POLICY IF EXISTS "routines_select"            ON public.routines;
DROP POLICY IF EXISTS "routines_insert"            ON public.routines;
DROP POLICY IF EXISTS "routines_update"            ON public.routines;
DROP POLICY IF EXISTS "routines_delete"            ON public.routines;
DROP POLICY IF EXISTS "banco_lectura"              ON public.exercise_bank;
DROP POLICY IF EXISTS "banco_escritura"            ON public.exercise_bank;
-- Políticas viejas y peligrosas de versiones anteriores, por si quedaron.
DROP POLICY IF EXISTS "transitorio_trainers"       ON public.trainers;
DROP POLICY IF EXISTS "transitorio_students"       ON public.students;
DROP POLICY IF EXISTS "transitorio_routines"       ON public.routines;
DROP POLICY IF EXISTS "transitorio_bank"           ON public.exercise_bank;

-- --- app_admins ---
-- Cada admin ve su propia fila; así la app puede detectar el rol al iniciar sesión.
CREATE POLICY "admin_lee_su_fila" ON public.app_admins
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- --- trainers ---
CREATE POLICY "trainers_select" ON public.trainers
    FOR SELECT TO authenticated
    USING (
        public.is_admin()
        OR id = auth.uid()::text
        -- El alumno necesita los datos de cobro de su profesor (alias/CBU).
        OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = auth.uid()::text AND s.trainer_id = trainers.id)
    );

CREATE POLICY "trainers_insert" ON public.trainers
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin() OR id = auth.uid()::text);

CREATE POLICY "trainers_update" ON public.trainers
    FOR UPDATE TO authenticated
    USING (public.is_admin() OR id = auth.uid()::text)
    WITH CHECK (public.is_admin() OR id = auth.uid()::text);

CREATE POLICY "trainers_delete" ON public.trainers
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- --- students ---
CREATE POLICY "students_select" ON public.students
    FOR SELECT TO authenticated
    USING (public.is_admin() OR trainer_id = auth.uid()::text OR id = auth.uid()::text);

CREATE POLICY "students_insert" ON public.students
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin() OR trainer_id = auth.uid()::text OR id = auth.uid()::text);

CREATE POLICY "students_update" ON public.students
    FOR UPDATE TO authenticated
    USING (public.is_admin() OR trainer_id = auth.uid()::text OR id = auth.uid()::text)
    WITH CHECK (public.is_admin() OR trainer_id = auth.uid()::text OR id = auth.uid()::text);

CREATE POLICY "students_delete" ON public.students
    FOR DELETE TO authenticated
    USING (public.is_admin() OR trainer_id = auth.uid()::text);

-- --- routines ---
CREATE POLICY "routines_select" ON public.routines
    FOR SELECT TO authenticated
    USING (
        public.is_admin()
        OR trainer_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = auth.uid()::text AND s.assigned_routine_id = routines.id
        )
    );

CREATE POLICY "routines_insert" ON public.routines
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin() OR trainer_id = auth.uid()::text);

CREATE POLICY "routines_update" ON public.routines
    FOR UPDATE TO authenticated
    USING (public.is_admin() OR trainer_id = auth.uid()::text)
    WITH CHECK (public.is_admin() OR trainer_id = auth.uid()::text);

CREATE POLICY "routines_delete" ON public.routines
    FOR DELETE TO authenticated
    USING (public.is_admin() OR trainer_id = auth.uid()::text);

-- --- exercise_bank (catálogo compartido) ---
CREATE POLICY "banco_lectura" ON public.exercise_bank
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "banco_escritura" ON public.exercise_bank
    FOR INSERT TO authenticated WITH CHECK (true);

-- ------------------------------------------------------------
-- 8. AYUDANTE PARA DESIGNAR ADMINISTRADORES
--    Evita tener que copiar el UID a mano desde el panel.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hacer_admin(p_email TEXT, p_nombre TEXT DEFAULT 'Administrador')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id FROM auth.users WHERE lower(email) = lower(p_email);

    IF v_id IS NULL THEN
        RETURN 'No existe ningún usuario con el email ' || p_email ||
               '. Crealo primero en Authentication -> Users.';
    END IF;

    INSERT INTO public.app_admins (id, name)
    VALUES (v_id, p_nombre)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    RETURN 'Listo: ' || p_email || ' ahora es administrador.';
END;
$$;


-- ============================================================
-- SIGUIENTE PASO (no se ejecuta acá)
-- ============================================================
-- Cuando hayas creado tu usuario en Authentication -> Users, abrí una consulta
-- NUEVA y corré esto con tu email y tu nombre:
--
--     select public.hacer_admin('tu@email.com', 'Ariel');
--
-- Tiene que responder: "Listo: tu@email.com ahora es administrador."

-- ============================================================
-- 9. VERIFICACIÓN
-- ============================================================
-- Las 5 tablas tienen que decir `true`. Si alguna dice `false`, RLS quedó apagada ahí.

SELECT
    tablename AS tabla,
    rowsecurity AS rls_activo,
    CASE WHEN rowsecurity THEN 'OK' ELSE 'REVISAR' END AS estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('app_admins', 'trainers', 'students', 'routines', 'exercise_bank')
ORDER BY tablename;
