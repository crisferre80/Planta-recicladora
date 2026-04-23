-- ============================================
-- FIX: POLÍTICAS RLS PARA STORAGE (employee-photos)
-- Ejecuta esto en el SQL Editor de Supabase
-- ============================================

-- 1. Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-photos',
  'employee-photos',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Eliminar policies antiguas si existen
DROP POLICY IF EXISTS "Empleados fotos - leer publico"     ON storage.objects;
DROP POLICY IF EXISTS "Empleados fotos - subir autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Empleados fotos - actualizar"       ON storage.objects;
DROP POLICY IF EXISTS "Empleados fotos - eliminar"         ON storage.objects;

-- 3. Policy: cualquiera puede LEER (bucket público)
CREATE POLICY "Empleados fotos - leer publico"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee-photos');

-- 4. Policy: usuarios autenticados pueden SUBIR
CREATE POLICY "Empleados fotos - subir autenticado"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-photos');

-- 5. Policy: usuarios autenticados pueden ACTUALIZAR (upsert)
CREATE POLICY "Empleados fotos - actualizar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'employee-photos');

-- 6. Policy: usuarios autenticados pueden ELIMINAR
CREATE POLICY "Empleados fotos - eliminar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'employee-photos');

-- 7. Asegurar que RLS de la tabla employees está deshabilitado (para actualizaciones de photoUrl)
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;

-- 8. Agregar columnas faltantes a employees (si no existen)
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
