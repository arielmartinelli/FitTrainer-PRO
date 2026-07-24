-- ============================================================
-- SCRIPT CORREGIDO Y PROBADO PARA SUPABASE (FitTrainer PRO)
-- Copia y pega TODO este script en el "SQL Editor" de Supabase y presiona "RUN"
-- ============================================================

-- 1. Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Profesores (trainers)
CREATE TABLE IF NOT EXISTS public.trainers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    brand_name TEXT DEFAULT 'Estudio Personal Trainer',
    cbu TEXT,
    alias TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Alumnos (students)
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    trainer_id TEXT,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    gender TEXT DEFAULT 'male',
    goal TEXT DEFAULT 'Hipertrofia Muscular',
    plan_name TEXT DEFAULT 'Plan Mensual',
    plan_price NUMERIC DEFAULT 28000,
    status TEXT DEFAULT 'active',
    payment_status TEXT DEFAULT 'paid',
    next_due_date TEXT,
    assigned_routine_id TEXT,
    questionnaire_completed BOOLEAN DEFAULT false,
    questionnaire_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Rutinas (routines)
CREATE TABLE IF NOT EXISTS public.routines (
    id TEXT PRIMARY KEY,
    trainer_id TEXT,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Hipertrofia',
    duration_weeks INT DEFAULT 6,
    description TEXT,
    days JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla de Registro de Pagos (payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT,
    amount NUMERIC NOT NULL,
    date TEXT NOT NULL,
    method TEXT DEFAULT 'Transferencia Bancaria',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabla del Banco de Ejercicios (exercise_bank)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabla de Entrenamientos Completados por Alumnos (completed_workouts)
CREATE TABLE IF NOT EXISTS public.completed_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT,
    day_name TEXT NOT NULL,
    week_number INT DEFAULT 1,
    duration_minutes INT DEFAULT 60,
    student_notes TEXT,
    logs JSONB DEFAULT '[]'::jsonb,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Deshabilitar RLS para permitir lecturas/escrituras de la API pública sin bloqueos
ALTER TABLE public.trainers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_bank DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_workouts DISABLE ROW LEVEL SECURITY;
