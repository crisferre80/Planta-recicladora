-- =============================================
-- MIGRACIÓN: Perfil de usuario con avatar y bio
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Agregar columnas de perfil a la tabla users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "bio" TEXT;

-- Crear bucket para avatares (si no existe)
-- Nota: este paso se hace desde el panel Storage de Supabase:
-- 1. Ir a Storage > New bucket
-- 2. Nombre: avatars
-- 3. Public: true

-- Política de storage para avatars (ejecutar en SQL Editor)
-- Esto permite a usuarios autenticados subir y ver sus avatares:

-- Permitir INSERT (upload) a usuarios autenticados
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Deshabilitar RLS del bucket avatars para simplificar
UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- Políticas de acceso al bucket avatars
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "avatars_authenticated_upload" ON storage.objects;
  DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_authenticated_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "avatars_authenticated_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
