-- ============================================================
-- FitTrainer PRO — Rutinas subidas como archivo (foto, PDF o Excel)
--
-- Pegar TODO en el SQL Editor de Supabase y presionar RUN.
-- Correr DESPUÉS de supabase_schema.sql.
-- Es idempotente: se puede volver a ejecutar sin romper nada.
-- ============================================================

-- ------------------------------------------------------------
-- 1. CAMPOS NUEVOS EN routines
-- ------------------------------------------------------------
-- `kind` distingue las dos formas de armar una rutina:
--   'structured' → días y ejercicios cargados en la app (la de siempre)
--   'file'       → el profesor subió una foto, un PDF o una planilla
ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'structured';
ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS file_size INT;

-- Las rutinas que ya existían son estructuradas.
UPDATE public.routines SET kind = 'structured' WHERE kind IS NULL;

-- ------------------------------------------------------------
-- 2. BUCKET PRIVADO
-- ------------------------------------------------------------
-- Privado a propósito: los archivos solo se sirven con URLs firmadas que
-- caducan. Si fuera público, cualquiera con el enlace vería la rutina.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'rutinas',
    'rutinas',
    false,
    10485760, -- 10 MB
    ARRAY[
        'image/jpeg', 'image/png', 'image/webp', 'image/heic',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
    ]
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    public = false;

-- ------------------------------------------------------------
-- 3. POLÍTICAS DEL BUCKET
-- ------------------------------------------------------------
-- Los archivos se guardan como:  {trainer_id}/{routine_id}/{nombre}
-- Eso permite decidir los permisos mirando la ruta:
--   · segmento 1 = el profesor dueño
--   · segmento 2 = la rutina, para saber si el alumno la tiene asignada
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "rutinas_profesor_lee"    ON storage.objects;
DROP POLICY IF EXISTS "rutinas_profesor_sube"   ON storage.objects;
DROP POLICY IF EXISTS "rutinas_profesor_edita"  ON storage.objects;
DROP POLICY IF EXISTS "rutinas_profesor_borra"  ON storage.objects;
DROP POLICY IF EXISTS "rutinas_alumno_lee"      ON storage.objects;

-- El profesor gestiona todo lo que está bajo su carpeta. El admin, todo.
CREATE POLICY "rutinas_profesor_lee" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'rutinas'
        AND (public.is_admin() OR (storage.foldername(name))[1] = auth.uid()::text)
    );

CREATE POLICY "rutinas_profesor_sube" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'rutinas'
        AND (public.is_admin() OR (storage.foldername(name))[1] = auth.uid()::text)
    );

CREATE POLICY "rutinas_profesor_edita" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'rutinas'
        AND (public.is_admin() OR (storage.foldername(name))[1] = auth.uid()::text)
    );

CREATE POLICY "rutinas_profesor_borra" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'rutinas'
        AND (public.is_admin() OR (storage.foldername(name))[1] = auth.uid()::text)
    );

-- El alumno solo lee el archivo de la rutina que tiene asignada.
CREATE POLICY "rutinas_alumno_lee" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'rutinas'
        AND EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = auth.uid()::text
              AND s.assigned_routine_id = (storage.foldername(name))[2]
        )
    );

-- ------------------------------------------------------------
-- 4. VERIFICACIÓN
-- ------------------------------------------------------------
SELECT
    b.id AS bucket,
    b.public AS es_publico,
    b.file_size_limit AS limite_bytes,
    (SELECT count(*) FROM pg_policies p
      WHERE p.schemaname = 'storage'
        AND p.tablename = 'objects'
        AND p.policyname LIKE 'rutinas_%') AS politicas
FROM storage.buckets b
WHERE b.id = 'rutinas';
