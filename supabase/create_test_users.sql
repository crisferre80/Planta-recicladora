-- ============================================
-- CREAR USUARIOS DE PRUEBA EN SUPABASE AUTH
-- ============================================
-- IMPORTANTE: Ejecuta esto DESPUÉS de aplicar la migración principal
-- Esto creará usuarios directamente en auth.users y el trigger
-- los sincronizará automáticamente con public.users
-- ============================================

-- Usuario 1: Administrador
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@recicladora.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Administrador"}',
  NOW(),
  NOW(),
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- Usuario 2: Supervisor
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'supervisor@recicladora.com',
  crypt('super123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Supervisor"}',
  NOW(),
  NOW(),
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- Usuario 3: Operador
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'operador@recicladora.com',
  crypt('oper123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Operador"}',
  NOW(),
  NOW(),
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- Usuario 4: Contador
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'contador@recicladora.com',
  crypt('conta123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Contador"}',
  NOW(),
  NOW(),
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VERIFICAR QUE SE CREARON CORRECTAMENTE
-- ============================================
-- Ejecuta esto después para verificar:
-- SELECT id, email, email_confirmed_at FROM auth.users WHERE email LIKE '%recicladora.com';
-- SELECT id, email, name, role FROM public.users WHERE email LIKE '%recicladora.com';

-- ============================================
-- ACTUALIZAR ROLES EN PUBLIC.USERS
-- ============================================
-- Por defecto el trigger crea usuarios con rol OPERADOR
-- Actualiza los roles manualmente:

UPDATE public.users 
SET role = 'ADMIN'::"UserRole", name = 'Administrador'
WHERE email = 'admin@recicladora.com';

UPDATE public.users 
SET role = 'SUPERVISOR'::"UserRole", name = 'Supervisor'
WHERE email = 'supervisor@recicladora.com';

UPDATE public.users 
SET role = 'OPERADOR'::"UserRole", name = 'Operador'
WHERE email = 'operador@recicladora.com';

UPDATE public.users 
SET role = 'CONTADOR'::"UserRole", name = 'Contador'
WHERE email = 'contador@recicladora.com';
