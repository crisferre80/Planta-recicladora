-- ============================================
-- LIMPIEZA COMPLETA - EMPEZAR DESDE CERO
-- ============================================
-- IMPORTANTE: Ejecuta ESTO PRIMERO para limpiar todo
-- Luego ejecuta la migración 20260421000000_initial_setup.sql
-- ============================================

-- Eliminar trigger y función
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Eliminar todas las tablas en orden inverso (respetando foreign keys)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.cash_registers CASCADE;
DROP TABLE IF EXISTS public.maintenances CASCADE;
DROP TABLE IF EXISTS public.production_records CASCADE;
DROP TABLE IF EXISTS public.equipment CASCADE;
DROP TABLE IF EXISTS public.material_types CASCADE;
DROP TABLE IF EXISTS public.attendances CASCADE;
DROP TABLE IF EXISTS public.shift_assignments CASCADE;
DROP TABLE IF EXISTS public.work_shifts CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.taxes CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Eliminar ENUMs
DROP TYPE IF EXISTS "AlertSeverity" CASCADE;
DROP TYPE IF EXISTS "AlertType" CASCADE;
DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
DROP TYPE IF EXISTS "TransactionType" CASCADE;
DROP TYPE IF EXISTS "EquipmentStatus" CASCADE;
DROP TYPE IF EXISTS "AttendanceStatus" CASCADE;
DROP TYPE IF EXISTS "EmployeeStatus" CASCADE;
DROP TYPE IF EXISTS "UserRole" CASCADE;

-- Eliminar función de timestamp
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- AHORA EJECUTA: 20260421000000_initial_setup.sql
-- ============================================
