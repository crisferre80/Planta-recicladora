-- ============================================
-- DESACTIVAR RLS EN TABLAS QUE USAN CLIENTE
-- ============================================
-- Ejecutar este script para permitir inserciones desde el cliente
-- sin políticas de seguridad de filas

-- Tablas principales
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;

-- Tablas secundarias que podrían necesitar acceso
ALTER TABLE public.attendances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts DISABLE ROW LEVEL SECURITY;

-- Verificar estado de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
