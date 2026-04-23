-- ============================================
-- FIX: PERMISOS PARA TRIGGER AUTH
-- ============================================
-- Ejecuta esto si obtuviste el error:
-- "ERROR: 42501: must be owner of relation users"
-- ============================================

-- 1. Cambiar ownership de la tabla a postgres
ALTER TABLE public.users OWNER TO postgres;

-- 2. Dar permisos completos a la tabla users
GRANT ALL ON public.users TO postgres;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- 2. Recrear la función con permisos correctos
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
  VALUES (
    NEW.id::text,
    NEW.email,
    'supabase_auth',
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    'OPERADOR'::"UserRole",
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Cambiar ownership de la función
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 3. Dar permisos de ejecución a la función
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- 4. Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Verificar que el trigger existe
SELECT tgname, tgrelid::regclass, tgfoid::regproc 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- ============================================
-- AHORA INTENTA CREAR EL USUARIO DE NUEVO
-- ============================================
